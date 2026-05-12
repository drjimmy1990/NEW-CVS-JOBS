'use client'

import { useState, useRef } from 'react'
import { Upload, ClipboardPaste, Loader2, FileCheck } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import CvSessionHeader from '@/components/candidate/cv/CvSessionHeader'
import { atsConvertCv, linkCvToProfile } from '@/lib/cv-api'
import type { CvLanguage, CvParsedData } from '@/types/cv'

export default function CvAtsPage() {
  const [language, setLanguage] = useState<CvLanguage>('en')
  const [processing, setProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<CvParsedData | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLinked, setIsLinked] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { toast.error('يرجى رفع ملف PDF'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('الحد الأقصى 10 ميجابايت'); return }

    setProcessing(true)
    const result = await atsConvertCv(file, language)
    if (result.success && result.result) {
      setDownloadUrl(result.result.downloadUrl)
      setParsedData(result.result.parsedData)
      setSessionId(result.result.sessionId)
      toast.success('تم تحويل السيرة الذاتية لنظام ATS!')
    } else {
      toast.error(result.error || 'فشل التحويل')
    }
    setProcessing(false)
  }

  const handlePasteConvert = async () => {
    if (!pasteText.trim() || pasteText.trim().length < 50) {
      toast.error('يرجى لصق سيرة ذاتية كاملة')
      return
    }
    setProcessing(true)
    const result = await atsConvertCv(pasteText, language)
    if (result.success && result.result) {
      setDownloadUrl(result.result.downloadUrl)
      setParsedData(result.result.parsedData)
      setSessionId(result.result.sessionId)
      toast.success('تم تحويل النص لسيرة ATS!')
    } else {
      toast.error(result.error || 'فشل التحويل')
    }
    setProcessing(false)
  }

  const handleLinkProfile = async () => {
    if (!sessionId) return
    const result = await linkCvToProfile(sessionId)
    if (result.success) { setIsLinked(true); toast.success('تم تحديث ملفك!') }
    else { toast.error(result.error || 'فشل الربط') }
  }

  // Success View
  if (downloadUrl) {
    return (
      <div className="max-w-3xl mx-auto">
        <CvSessionHeader title="محوّل ATS" subtitle="تم تحويل سيرتك الذاتية بنجاح" sessionType="ats_convert" language={language} status="ready" />
        <div className="bg-navy-light border border-success/30 rounded-xl p-8 space-y-6">
          <div className="text-center">
            <div className="p-4 rounded-2xl bg-success/10 inline-block mb-3">
              <FileCheck className="h-12 w-12 text-success" />
            </div>
            <h2 className="text-xl font-bold text-cream mb-1">سيرة ATS جاهزة!</h2>
            <p className="text-cream-dark/50 text-sm">تم تحسين سيرتك الذاتية لتجاوز أنظمة تتبع المتقدمين</p>
          </div>

          {/* Parsed Data Preview */}
          {parsedData && (
            <div className="space-y-4 border-t border-gold/10 pt-4">
              <h3 className="text-cream font-medium text-sm">البيانات المستخرجة:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {parsedData.fullName && <div><span className="text-cream-dark/40">الاسم:</span> <span className="text-cream">{parsedData.fullName}</span></div>}
                {parsedData.currentTitle && <div><span className="text-cream-dark/40">المنصب:</span> <span className="text-cream">{parsedData.currentTitle}</span></div>}
                {parsedData.email && <div><span className="text-cream-dark/40">البريد:</span> <span className="text-cream">{parsedData.email}</span></div>}
                {parsedData.yearsExperience > 0 && <div><span className="text-cream-dark/40">الخبرة:</span> <span className="text-cream">{parsedData.yearsExperience} سنوات</span></div>}
              </div>
              {parsedData.skills?.length > 0 && (
                <div>
                  <span className="text-cream-dark/40 text-sm">المهارات:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {parsedData.skills.map((s, i) => <Badge key={i} className="bg-gold/10 text-gold border-gold/20 text-xs">{s}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={() => window.open(downloadUrl, '_blank')} className="bg-success hover:bg-success/80 text-white font-bold flex-1">تحميل سيرة ATS</Button>
            {!isLinked ? (
              <Button onClick={handleLinkProfile} variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 flex-1">استخدم في ملفي</Button>
            ) : (
              <span className="flex items-center justify-center gap-1.5 text-sm text-success py-2">✓ تم الربط</span>
            )}
          </div>
          <Button variant="ghost" onClick={() => { setDownloadUrl(null); setParsedData(null); setSessionId(null); setIsLinked(false); setPasteText('') }} className="w-full text-cream-dark/40 hover:text-cream">تحويل سيرة أخرى</Button>
        </div>
      </div>
    )
  }

  // Input View
  return (
    <div className="max-w-3xl mx-auto">
      <CvSessionHeader title="محوّل ATS" subtitle="حوّل سيرتك الذاتية لتكون متوافقة مع أنظمة تتبع المتقدمين" sessionType="ats_convert" />

      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-cream-dark/50">لغة السيرة:</span>
        {(['en', 'ar', 'bilingual'] as CvLanguage[]).map((lang) => (
          <button key={lang} onClick={() => setLanguage(lang)} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${language === lang ? 'bg-gold/10 border-gold/30 text-gold' : 'border-gold/10 text-cream-dark/40 hover:text-cream hover:border-gold/20'}`}>
            {lang === 'en' ? 'English' : lang === 'ar' ? 'العربية' : 'ثنائي اللغة'}
          </button>
        ))}
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="bg-navy-lighter border border-gold/10 p-1 w-full grid grid-cols-2">
          <TabsTrigger value="upload" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-cream-dark/50">📤 رفع PDF</TabsTrigger>
          <TabsTrigger value="paste" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-cream-dark/50">📋 لصق نص</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <div className="border-2 border-dashed border-gold/15 rounded-xl p-16 text-center hover:border-gold/30 transition-all cursor-pointer bg-navy-light" onClick={() => fileInputRef.current?.click()}>
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
            {processing ? (
              <div className="space-y-4">
                <Loader2 className="h-14 w-14 mx-auto text-gold animate-spin" />
                <p className="text-cream font-medium">جارِ التحويل...</p>
                <p className="text-sm text-cream-dark/40">يتم تحليل السيرة وتحويلها لنظام ATS</p>
              </div>
            ) : (
              <>
                <div className="p-5 rounded-2xl bg-gold/5 inline-block mb-4"><Upload className="h-14 w-14 text-gold/50" /></div>
                <p className="text-cream font-medium text-lg mb-1">ارفع سيرتك الذاتية بصيغة PDF</p>
                <p className="text-cream-dark/40 text-sm">سيتم تحويلها تلقائياً لنسخة متوافقة مع أنظمة ATS</p>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="paste" className="space-y-4">
          <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="الصق نص سيرتك الذاتية هنا..." rows={10} disabled={processing} className="w-full bg-navy-lighter border border-gold/10 rounded-xl px-4 py-4 text-sm text-cream placeholder:text-cream-dark/25 focus:outline-none focus:border-gold/30 resize-none disabled:opacity-50" />
          <Button onClick={handlePasteConvert} disabled={!pasteText.trim() || processing} className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-5">
            {processing ? (<><Loader2 className="h-5 w-5 animate-spin me-2" />جارِ التحويل...</>) : 'تحويل إلى سيرة ATS'}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}
