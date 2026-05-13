'use client'

import { useState } from 'react'
import { ClipboardPaste, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { atsConvertCv } from '@/lib/cv-api'
import type { CvLanguage, CvData } from '@/types/cv'

interface CvPasteTabProps {
  language: CvLanguage
  onSuccess: (downloadUrl: string, sessionId: string) => void
  onError: (message: string) => void
}

export default function CvPasteTab({ language, onSuccess, onError }: CvPasteTabProps) {
  const [text, setText] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleExtract = async () => {
    if (!text.trim()) {
      onError('يرجى لصق نص السيرة الذاتية أولاً')
      return
    }

    if (text.trim().length < 50) {
      onError('النص قصير جداً — يرجى لصق سيرة ذاتية كاملة')
      return
    }

    setProcessing(true)
    const result = await atsConvertCv(text, language)

    if (result.success && result.result) {
      onSuccess(result.result.downloadUrl, result.result.sessionId)
    } else {
      onError(result.error || 'فشل استخراج البيانات')
    }

    setProcessing(false)
  }

  const charCount = text.length

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="الصق نص سيرتك الذاتية هنا... يمكنك نسخ المحتوى من ملف Word أو أي مصدر آخر"
          disabled={processing}
          rows={12}
          className="w-full bg-navy-lighter border border-gold/10 rounded-xl px-4 py-4 text-sm text-cream placeholder:text-cream-dark/25 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 disabled:opacity-50 resize-none transition-colors leading-relaxed"
        />
        <div className="absolute bottom-3 start-4 text-xs text-cream-dark/25">
          {charCount.toLocaleString('ar-AE')} حرف
        </div>
      </div>

      {charCount > 0 && charCount < 50 && (
        <div className="flex items-center gap-2 text-xs text-yellow-400">
          <AlertCircle className="h-3.5 w-3.5" />
          النص قصير — يرجى لصق سيرة ذاتية كاملة للحصول على نتائج أفضل
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-cream-dark/30 flex items-center gap-1.5">
          <ClipboardPaste className="h-3.5 w-3.5" />
          سيقوم الذكاء الاصطناعي باستخراج البيانات وتعبئة النموذج تلقائياً
        </p>
        <Button
          onClick={handleExtract}
          disabled={!text.trim() || processing}
          className="bg-gold hover:bg-gold-dark text-navy font-bold disabled:opacity-30"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin me-2" />
              جارِ الاستخراج...
            </>
          ) : (
            'استخراج البيانات'
          )}
        </Button>
      </div>
    </div>
  )
}
