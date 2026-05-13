'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Loader2, FileText, CheckCircle2, History, Eye, RotateCcw, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import CvSessionHeader from '@/components/candidate/cv/CvSessionHeader'
import CvPdfViewer from '@/components/candidate/cv/CvPdfViewer'
import CvChatPanel from '@/components/candidate/cv/CvChatPanel'
import { parseCv, optimizeCv, finalizeCv, linkCvToProfile } from '@/lib/cv-api'
import type { CvChatMessage, CvLanguage, CvSessionStatus } from '@/types/cv'

export default function CvOptimizePage() {
  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionStatus, setSessionStatus] = useState<CvSessionStatus>('active')
  const [language, setLanguage] = useState<CvLanguage>('en')
  const [isLinked, setIsLinked] = useState(false)

  // Upload state
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Existing CV state
  const [existingCvUrl, setExistingCvUrl] = useState<string | null>(null)
  const [existingCvDate, setExistingCvDate] = useState<string | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [usingExisting, setUsingExisting] = useState(false)

  // Chat state
  const [messages, setMessages] = useState<CvChatMessage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasOptimized, setHasOptimized] = useState(false)

  // PDF state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [finalDownloadUrl, setFinalDownloadUrl] = useState<string | null>(null)

  // Past sessions
  type PastSession = {
    id: string
    status: string
    created_at: string
    latest_draft_url: string | null
    linked_to_profile: boolean
    chat_history: unknown
  }
  const [pastSessions, setPastSessions] = useState<PastSession[]>([])

  // --- Fetch existing CV and active session on mount ---
  useEffect(() => {
    const fetchExistingCv = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch candidate profile for existing CV
        const { data: candidate } = await supabase
          .from('candidates')
          .select('cv_url, updated_at')
          .eq('id', user.id)
          .single()
        if (candidate?.cv_url) {
          setExistingCvUrl(candidate.cv_url)
          setExistingCvDate(candidate.updated_at)
        }

        // Fetch active session to resume (also fetch ready sessions)
        const { data: activeSession } = await supabase
          .from('cv_sessions')
          .select('id, original_pdf_url, latest_draft_url, final_pdf_url, status, chat_history, linked_to_profile')
          .eq('user_id', user.id)
          .eq('session_type', 'optimize')
          .in('status', ['active', 'ready'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (activeSession) {
          setSessionId(activeSession.id)
          if (activeSession.status === 'ready') {
            setSessionStatus('ready')
          }
          // Priority: latest draft > final PDF > original PDF
          const resumePdfUrl = activeSession.latest_draft_url
            || activeSession.final_pdf_url
            || activeSession.original_pdf_url
          if (resumePdfUrl) {
            setPdfUrl(resumePdfUrl)
          }
          // Restore chat history from DB
          // Handle both string (old bug) and array (correct) formats
          let chatData = activeSession.chat_history
          if (typeof chatData === 'string') {
            try { chatData = JSON.parse(chatData) } catch { chatData = [] }
          }
          if (Array.isArray(chatData) && chatData.length > 0) {
            const restored = (chatData as Array<{id: string; sender: string; content: string; timestamp: string}>).map(msg => ({
              ...msg,
              sender: msg.sender as 'user' | 'ai' | 'system',
              timestamp: new Date(msg.timestamp),
            }))
            setMessages(restored)
            setHasOptimized(true)
          }
          // If there's a latest_draft_url, optimization has happened
          if (activeSession.latest_draft_url) {
            setHasOptimized(true)
          }
          // Restore linked state
          if (activeSession.linked_to_profile) {
            setIsLinked(true)
          }
        }
      }
      // Fetch past sessions for history table
      if (user) {
        const { data: allSessions } = await supabase
          .from('cv_sessions')
          .select('id, status, created_at, latest_draft_url, linked_to_profile, chat_history')
          .eq('user_id', user.id)
          .eq('session_type', 'optimize')
          .order('created_at', { ascending: false })
          .limit(20)
        if (allSessions) {
          // We'll filter current session after state is set
          setPastSessions(allSessions)
        }
      }
      setLoadingExisting(false)
    }
    fetchExistingCv()
  }, [])

  // --- Use Existing CV Handler ---
  const handleUseExisting = async () => {
    if (!existingCvUrl) return
    setUsingExisting(true)

    try {
      // Fetch the existing PDF and send it to the parse API
      const response = await fetch(existingCvUrl)
      const blob = await response.blob()
      const file = new File([blob], 'existing-cv.pdf', { type: 'application/pdf' })

      const result = await parseCv(file, language)

      if (result.success && result.sessionId) {
        setSessionId(result.sessionId)
        setPdfUrl(existingCvUrl)

        setMessages([
          {
            id: 'sys-1',
            sender: 'system',
            content: 'تم تحميل سيرتك الذاتية الحالية بنجاح! يمكنك الآن طلب تحسينات من مساعد الذكاء الاصطناعي.',
            timestamp: new Date(),
          },
        ])

        toast.success('تم تحميل السيرة الحالية — يمكنك البدء بالتحسين')
      } else {
        toast.error(result.error || 'فشل تحليل السيرة الحالية')
      }
    } catch {
      toast.error('فشل تحميل السيرة الذاتية الحالية')
    }

    setUsingExisting(false)
  }

  // --- Upload Handler ---
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('يرجى رفع ملف PDF')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('الحد الأقصى 10 ميجابايت')
      return
    }

    setUploading(true)
    const result = await parseCv(file, language)

    if (result.success && result.sessionId) {
      setSessionId(result.sessionId)
      setPdfUrl(URL.createObjectURL(file))

      // Add system welcome message
      setMessages([
        {
          id: 'sys-1',
          sender: 'system',
          content: 'تم رفع سيرتك الذاتية بنجاح! يمكنك الآن طلب تحسينات من مساعد الذكاء الاصطناعي.',
          timestamp: new Date(),
        },
      ])

      toast.success('تم رفع السيرة الذاتية — يمكنك البدء بالتحسين')
    } else {
      toast.error(result.error || 'فشل رفع الملف')
    }

    setUploading(false)
  }

  // --- Send Chat Message ---
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!sessionId) return

      // Add user message
      const userMsg: CvChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        content: message,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMsg])
      setIsProcessing(true)

      const result = await optimizeCv(sessionId, message, language, messages.map(m => ({
        id: m.id,
        sender: m.sender,
        content: m.content,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
      })))

      if (result.success && result.result) {
        // Add AI response
        const aiMsg: CvChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          content: result.result.message || result.result.optimizedText || 'تم تحديث السيرة الذاتية.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMsg])

        // Update PDF preview if we got a new one
        if (result.result.pdfBase64) {
          const blob = base64ToBlob(result.result.pdfBase64, 'application/pdf')
          setPdfUrl(URL.createObjectURL(blob))
        }
        setHasOptimized(true)

        // Show suggestions if any
        if (result.result.suggestions && result.result.suggestions.length > 0) {
          const sugMsg: CvChatMessage = {
            id: `sug-${Date.now()}`,
            sender: 'system',
            content: '💡 اقتراحات: ' + result.result.suggestions.join(' | '),
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, sugMsg])
        }
      } else {
        const errMsg: CvChatMessage = {
          id: `err-${Date.now()}`,
          sender: 'system',
          content: '⚠️ ' + (result.error || 'حدث خطأ أثناء التحسين'),
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errMsg])
      }

      setIsProcessing(false)
    },
    [sessionId, language]
  )

  // --- Finalize ---
  const handleFinalize = async () => {
    if (!sessionId) return
    setSessionStatus('processing')

    const result = await finalizeCv(sessionId)

    if (result.success && result.result) {
      setSessionStatus('ready')
      setFinalDownloadUrl(result.result.downloadUrl)
      toast.success('تم إنهاء السيرة الذاتية! يمكنك تحميلها الآن.')
    } else {
      setSessionStatus('active')
      toast.error(result.error || 'فشل إنهاء الجلسة')
    }
  }

  // --- Link to Profile ---
  const handleLinkProfile = async () => {
    if (!sessionId) return

    const result = await linkCvToProfile(sessionId)

    if (result.success) {
      setIsLinked(true)
      toast.success('تم تحديث ملفك الشخصي بالسيرة الذاتية الجديدة!')
    } else {
      toast.error(result.error || 'فشل ربط السيرة بالملف')
    }
  }

  // --- Start New Session (Cancel Current) ---
  const handleStartNewSession = async () => {
    if (!sessionId) return
    
    // Update session status so it doesn't auto-load on refresh
    const supabase = createClient()
    await supabase
      .from('cv_sessions')
      .update({ status: 'archived' })
      .eq('id', sessionId)
      
    // Reset local state to show upload screen
    setSessionId(null)
    setSessionStatus('active')
    setPdfUrl(null)
    setMessages([])
    setFinalDownloadUrl(null)
    setIsLinked(false)
  }

  // --- Helper: Resume a past session ---
  const handleResumeSession = (s: PastSession) => {
    setSessionId(s.id)
    setSessionStatus(s.status === 'ready' ? 'ready' : 'active')
    setPdfUrl(s.latest_draft_url || null)
    setIsLinked(!!s.linked_to_profile)
    setHasOptimized(!!s.latest_draft_url)
    let chatData = s.chat_history
    if (typeof chatData === 'string') {
      try { chatData = JSON.parse(chatData) } catch { chatData = [] }
    }
    if (Array.isArray(chatData) && chatData.length > 0) {
      const restored = (chatData as Array<{id: string; sender: string; content: string; timestamp: string}>).map(msg => ({
        ...msg,
        sender: msg.sender as 'user' | 'ai' | 'system',
        timestamp: new Date(msg.timestamp),
      }))
      setMessages(restored)
    } else {
      setMessages([])
    }
    setPastSessions(prev => prev.filter(ps => ps.id !== s.id))
  }

  // --- Status badge helper ---
  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      active: { label: 'نشطة', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      processing: { label: 'قيد المعالجة', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      ready: { label: 'جاهزة', cls: 'bg-success/20 text-success border-success/30' },
      downloaded: { label: 'تم التحميل', cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      archived: { label: 'مؤرشفة', cls: 'bg-cream-dark/10 text-cream-dark/40 border-cream-dark/10' },
    }
    const item = map[status] || { label: status, cls: 'bg-navy-lighter text-cream-dark/50' }
    return <Badge variant="outline" className={item.cls}>{item.label}</Badge>
  }

  // --- Past Sessions Table Component ---
  const SessionsHistoryTable = () => {
    const filtered = pastSessions.filter(s => s.id !== sessionId)
    if (filtered.length === 0) return null
    return (
      <Card className="bg-navy-light border-gold/10 mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-cream text-base flex items-center gap-2">
            <History className="h-4 w-4 text-gold" />
            الجلسات السابقة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold/10 text-cream-dark/50">
                  <th className="text-right px-4 py-2.5 font-medium">التاريخ</th>
                  <th className="text-right px-4 py-2.5 font-medium">الحالة</th>
                  <th className="text-right px-4 py-2.5 font-medium">ملف محسّن</th>
                  <th className="text-right px-4 py-2.5 font-medium">مرتبطة بالملف</th>
                  <th className="text-right px-4 py-2.5 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-gold/5 hover:bg-gold/5 transition-colors">
                    <td className="px-4 py-3 text-cream-dark/60 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString('ar-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      <span className="text-cream-dark/30 ms-2 text-xs">
                        {new Date(s.created_at).toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(s.status)}</td>
                    <td className="px-4 py-3">
                      {s.latest_draft_url ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <span className="text-cream-dark/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.linked_to_profile ? (
                        <Badge variant="outline" className="bg-gold/10 text-gold border-gold/30 text-xs">✓ مرتبطة</Badge>
                      ) : (
                        <span className="text-cream-dark/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.latest_draft_url && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-cream-dark/60 hover:text-gold" onClick={() => window.open(s.latest_draft_url!, '_blank')}>
                            <Eye className="h-3.5 w-3.5 me-1" />
                            عرض
                          </Button>
                        )}
                        {(s.status === 'active' || s.status === 'ready') && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-cream-dark/60 hover:text-gold" onClick={() => handleResumeSession(s)}>
                            <RotateCcw className="h-3.5 w-3.5 me-1" />
                            استئناف
                          </Button>
                        )}
                        {s.latest_draft_url && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-cream-dark/60 hover:text-success" onClick={() => {
                            const a = document.createElement('a')
                            a.href = s.latest_draft_url!
                            a.download = 'cv-optimized.pdf'
                            a.click()
                          }}>
                            <Download className="h-3.5 w-3.5 me-1" />
                            تحميل
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    )
  }

  // --- No Session Yet: Upload Screen ---
  if (!sessionId) {
    return (
      <div className="max-w-4xl mx-auto">
        <CvSessionHeader
          title="محسّن السيرة الذاتية"
          subtitle="ارفع سيرتك الذاتية ودع الذكاء الاصطناعي يحسّنها خطوة بخطوة"
          sessionType="optimize"
        />

        {/* Language Selection */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm text-cream-dark/50">لغة السيرة:</span>
          {(['en', 'ar', 'bilingual'] as CvLanguage[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                language === lang
                  ? 'bg-gold/10 border-gold/30 text-gold'
                  : 'border-gold/10 text-cream-dark/40 hover:text-cream hover:border-gold/20'
              }`}
            >
              {lang === 'en' ? 'English' : lang === 'ar' ? 'العربية' : 'ثنائي اللغة'}
            </button>
          ))}
        </div>

        {/* Use Existing CV */}
        {!loadingExisting && existingCvUrl && (
          <div className="mb-6 border border-gold/20 bg-gradient-to-r from-gold/5 to-gold/10 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-success/10">
                  <FileText className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-cream font-medium flex items-center gap-2">
                    لديك سيرة ذاتية مرفوعة مسبقاً
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </p>
                  {existingCvDate && (
                    <p className="text-xs text-cream-dark/40 mt-0.5">
                      آخر تحديث: {new Date(existingCvDate).toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={handleUseExisting}
                disabled={usingExisting}
                className="bg-gold hover:bg-gold-dark text-navy font-bold shadow-lg shadow-gold/20 whitespace-nowrap"
              >
                {usingExisting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                    جارِ التحميل...
                  </>
                ) : (
                  'استخدم هذه السيرة'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Divider */}
        {!loadingExisting && existingCvUrl && (
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gold/10"></div>
            <span className="text-sm text-cream-dark/30">أو ارفع ملف جديد</span>
            <div className="flex-1 h-px bg-gold/10"></div>
          </div>
        )}

        {/* Upload Zone */}
        <div
          className="border-2 border-dashed border-gold/15 rounded-xl p-16 text-center hover:border-gold/30 transition-all cursor-pointer bg-navy-light"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            className="hidden"
          />
          {uploading ? (
            <div className="space-y-4">
              <Loader2 className="h-14 w-14 mx-auto text-gold animate-spin" />
              <p className="text-cream font-medium">جارِ رفع وتحليل السيرة الذاتية...</p>
            </div>
          ) : (
            <>
              <div className="p-5 rounded-2xl bg-gold/5 inline-block mb-4">
                <Upload className="h-14 w-14 text-gold/50" />
              </div>
              <p className="text-cream font-medium text-lg mb-1">ارفع سيرتك الذاتية بصيغة PDF</p>
              <p className="text-cream-dark/40 text-sm">
                سيقوم الذكاء الاصطناعي بتحليلها وتجهيزها للتحسين
              </p>
            </>
          )}
        </div>

        {/* Past Sessions History */}
        <SessionsHistoryTable />
      </div>
    )
  }


  // --- Active Session: Split-Screen ---
  return (
    <div>
      <CvSessionHeader
        title="محسّن السيرة الذاتية"
        sessionType="optimize"
        language={language}
        status={sessionStatus}
      />

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-5rem)]">
        {/* Right: PDF Viewer */}
        <CvPdfViewer
          pdfUrl={pdfUrl}
          status={sessionStatus === 'processing' ? 'processing' : sessionStatus === 'ready' ? 'ready' : 'draft'}
          className="h-full"
        />

        {/* Left: Chat */}
        <div className="flex flex-col h-full gap-4">
          <CvChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            disabled={sessionStatus === 'ready'}
            className="flex-1"
          />

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-navy-light rounded-xl border border-gold/10">
            {sessionStatus !== 'ready' ? (
              <>
                <Button
                  onClick={handleFinalize}
                  disabled={!hasOptimized || sessionStatus === 'processing'}
                  className="bg-gold hover:bg-gold-dark text-navy font-bold flex-1"
                >
                  {sessionStatus === 'processing' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                      جارِ الإنهاء...
                    </>
                  ) : (
                    'إنهاء وتحميل'
                  )}
                </Button>
                <Button
                  onClick={handleStartNewSession}
                  disabled={sessionStatus === 'processing'}
                  variant="outline"
                  className="border-error/30 text-error hover:bg-error/10 hover:text-error whitespace-nowrap"
                >
                  إلغاء وبدء من جديد
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => window.open(finalDownloadUrl || pdfUrl || '', '_blank')}
                  className="bg-success hover:bg-success/80 text-white font-bold flex-1"
                >
                  تحميل السيرة النهائية
                </Button>
                {!isLinked ? (
                  <Button
                    onClick={handleLinkProfile}
                    variant="outline"
                    className="border-gold/30 text-gold hover:bg-gold/10 flex-1"
                  >
                    استخدم هذه السيرة في ملفي
                  </Button>
                ) : (
                  <span className="text-sm text-success flex items-center justify-center gap-1.5 flex-1">
                    ✓ تم الربط بملفك
                  </span>
                )}
                <Button
                  onClick={handleStartNewSession}
                  variant="outline"
                  className="border-gold/30 text-gold hover:bg-gold/10 whitespace-nowrap"
                >
                  جلسة جديدة
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Past Sessions History */}
      <SessionsHistoryTable />
    </div>
  )
}

// Helper
function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}
