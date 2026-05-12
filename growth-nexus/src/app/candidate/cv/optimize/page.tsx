'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Loader2, FileText, CheckCircle2 } from 'lucide-react'
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

  // PDF state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [finalDownloadUrl, setFinalDownloadUrl] = useState<string | null>(null)

  // --- Fetch existing CV on mount ---
  useEffect(() => {
    const fetchExistingCv = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: candidate } = await supabase
          .from('candidates')
          .select('cv_url, updated_at')
          .eq('id', user.id)
          .single()
        if (candidate?.cv_url) {
          setExistingCvUrl(candidate.cv_url)
          setExistingCvDate(candidate.updated_at)
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

      const result = await optimizeCv(sessionId, message, language)

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
      </div>
    )
  }

  // --- Active Session: Split-Screen ---
  return (
    <div className="h-[calc(100vh-6rem)]">
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
              <Button
                onClick={handleFinalize}
                disabled={messages.length < 2 || sessionStatus === 'processing'}
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
                  <span className="text-sm text-success flex items-center gap-1.5">
                    ✓ تم الربط بملفك
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
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
