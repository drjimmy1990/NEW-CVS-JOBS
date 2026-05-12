'use client'

import { useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import CvSessionHeader from '@/components/candidate/cv/CvSessionHeader'
import CvFormSteps from '@/components/candidate/cv/CvFormSteps'
import CvUploadTab from '@/components/candidate/cv/CvUploadTab'
import CvPasteTab from '@/components/candidate/cv/CvPasteTab'
import { createCv, linkCvToProfile } from '@/lib/cv-api'
import type { CvData, CvLanguage } from '@/types/cv'

const emptyForm: CvData = {
  fullName: '', jobTitle: '', email: '', phone: '', location: '', linkedin: '',
  photoBase64: '', summary: '', experience: [], education: [], skills: [],
  languages: [], projects: [], certifications: [], awards: [],
  hobbies: '', references: '', customSections: [],
}

export default function CvBuilderPage() {
  const [language, setLanguage] = useState<CvLanguage>('en')
  const [formData, setFormData] = useState<CvData>(emptyForm)
  const [activeTab, setActiveTab] = useState('form')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [isLinked, setIsLinked] = useState(false)

  const handleParsed = useCallback((data: Partial<CvData>, sid: string) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setSessionId(sid)
    setActiveTab('form')
    toast.success('تم استخراج البيانات — راجع النموذج وأكمل التفاصيل')
  }, [])

  const handleCreate = async () => {
    if (!formData.fullName.trim()) { toast.error('الاسم الكامل مطلوب'); return }
    if (!formData.jobTitle.trim()) { toast.error('المسمى الوظيفي مطلوب'); return }
    if (!formData.email.trim()) { toast.error('البريد الإلكتروني مطلوب'); return }

    setCreating(true)
    const result = await createCv(formData, language)
    if (result.success) {
      setSessionId(result.sessionId || sessionId)
      setDownloadUrl(result.downloadUrl || null)
      toast.success('تم إنشاء سيرتك الذاتية بنجاح!')
    } else {
      toast.error(result.error || 'فشل إنشاء السيرة الذاتية')
    }
    setCreating(false)
  }

  const handleLinkProfile = async () => {
    if (!sessionId) return
    const result = await linkCvToProfile(sessionId)
    if (result.success) { setIsLinked(true); toast.success('تم تحديث ملفك بالسيرة الجديدة!') }
    else { toast.error(result.error || 'فشل ربط السيرة بالملف') }
  }

  // Success View
  if (downloadUrl) {
    return (
      <div className="max-w-3xl mx-auto">
        <CvSessionHeader title="منشئ السيرة الذاتية" subtitle="تم إنشاء سيرتك بنجاح" sessionType="create" language={language} status="ready" />
        <div className="bg-navy-light border border-success/30 rounded-xl p-8 text-center space-y-6">
          <div className="p-5 rounded-2xl bg-success/10 inline-block">
            <svg className="h-16 w-16 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-cream mb-2">سيرتك الذاتية جاهزة!</h2>
            <p className="text-cream-dark/50">تم إنشاء سيرة ذاتية احترافية بنجاح</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Button onClick={() => window.open(downloadUrl, '_blank')} className="bg-success hover:bg-success/80 text-white font-bold flex-1">تحميل السيرة الذاتية</Button>
            {!isLinked ? (
              <Button onClick={handleLinkProfile} variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 flex-1">استخدم في ملفي الشخصي</Button>
            ) : (
              <span className="flex items-center justify-center gap-1.5 text-sm text-success py-2">✓ تم الربط بملفك</span>
            )}
          </div>
          <Button variant="ghost" onClick={() => { setDownloadUrl(null); setFormData(emptyForm); setSessionId(null); setIsLinked(false) }} className="text-cream-dark/40 hover:text-cream">إنشاء سيرة جديدة</Button>
        </div>
      </div>
    )
  }

  // Builder View
  return (
    <div className="max-w-4xl mx-auto">
      <CvSessionHeader title="منشئ السيرة الذاتية" subtitle="أنشئ سيرة ذاتية احترافية من الصفر أو من ملف موجود" sessionType="create" />
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-cream-dark/50">لغة السيرة:</span>
        {(['en', 'ar', 'bilingual'] as CvLanguage[]).map((lang) => (
          <button key={lang} onClick={() => setLanguage(lang)} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${language === lang ? 'bg-gold/10 border-gold/30 text-gold' : 'border-gold/10 text-cream-dark/40 hover:text-cream hover:border-gold/20'}`}>
            {lang === 'en' ? 'English' : lang === 'ar' ? 'العربية' : 'ثنائي اللغة'}
          </button>
        ))}
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-navy-lighter border border-gold/10 p-1 w-full grid grid-cols-3">
          <TabsTrigger value="form" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-cream-dark/50">📝 نموذج</TabsTrigger>
          <TabsTrigger value="upload" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-cream-dark/50">📤 رفع PDF</TabsTrigger>
          <TabsTrigger value="paste" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-cream-dark/50">📋 لصق نص</TabsTrigger>
        </TabsList>
        <TabsContent value="form" className="space-y-6">
          <CvFormSteps formData={formData} onChange={setFormData} />
          <div className="sticky bottom-0 bg-navy/95 backdrop-blur-sm p-4 -mx-4 border-t border-gold/10">
            <Button onClick={handleCreate} disabled={creating} className="w-full bg-gold hover:bg-gold-dark text-navy font-bold text-lg py-6 shadow-lg shadow-gold/20">
              {creating ? (<><Loader2 className="h-5 w-5 animate-spin me-2" />جارِ الإنشاء...</>) : 'إنشاء السيرة الذاتية'}
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="upload"><CvUploadTab language={language} onParsed={handleParsed} onError={(msg) => toast.error(msg)} /></TabsContent>
        <TabsContent value="paste"><CvPasteTab language={language} onParsed={handleParsed} onError={(msg) => toast.error(msg)} /></TabsContent>
      </Tabs>
    </div>
  )
}
