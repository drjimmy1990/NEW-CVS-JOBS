'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { parseCv } from '@/lib/cv-api'
import type { CvLanguage, CvData } from '@/types/cv'

interface CvUploadTabProps {
  language: CvLanguage
  onParsed: (data: Partial<CvData>, sessionId: string) => void
  onError: (message: string) => void
}

export default function CvUploadTab({ language, onParsed, onError }: CvUploadTabProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      onError('يرجى رفع ملف PDF فقط')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      onError('حجم الملف يجب أن يكون أقل من 10 ميجابايت')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 8, 85))
    }, 300)

    const result = await parseCv(file, language)
    clearInterval(progressInterval)

    if (result.success && result.sessionId) {
      setUploadProgress(100)
      setUploadedFile(file.name)
      // The parsed data will come back from the API in a structured format
      // For now, pass an empty object — the optimize/create flow will use the session
      onParsed({}, result.sessionId)
    } else {
      onError(result.error || 'فشل رفع الملف')
    }

    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      const input = fileInputRef.current
      if (input) {
        const dt = new DataTransfer()
        dt.items.add(file)
        input.files = dt.files
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
  }

  if (uploadedFile) {
    return (
      <div className="border border-success/30 bg-success/5 p-8 rounded-xl text-center">
        <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
        <p className="text-cream font-medium text-lg mb-1">تم رفع الملف بنجاح!</p>
        <p className="text-cream-dark/50 text-sm mb-4">{uploadedFile}</p>
        <p className="text-cream-dark/40 text-sm">
          جاري استخراج البيانات بالذكاء الاصطناعي... يمكنك مراجعة النموذج أدناه.
        </p>
        <button
          onClick={() => {
            setUploadedFile(null)
            setUploadProgress(0)
          }}
          className="mt-4 text-sm text-gold hover:text-gold-light transition-colors"
        >
          رفع ملف آخر
        </button>
      </div>
    )
  }

  return (
    <div
      className="border-2 border-dashed border-gold/15 rounded-xl p-12 text-center hover:border-gold/30 transition-all cursor-pointer group"
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {uploading ? (
        <div className="space-y-4">
          <Loader2 className="h-14 w-14 mx-auto text-gold animate-spin" />
          <p className="text-cream font-medium">جارِ رفع وتحليل السيرة الذاتية...</p>
          <Progress value={uploadProgress} className="max-w-xs mx-auto" />
          <p className="text-sm text-cream-dark/40">
            {uploadProgress < 50 ? 'جارِ الرفع...' : 'جارِ التحليل بالذكاء الاصطناعي...'}
          </p>
        </div>
      ) : (
        <>
          <div className="p-5 rounded-2xl bg-gold/5 inline-block mb-4 group-hover:bg-gold/10 transition-colors">
            <Upload className="h-12 w-12 text-gold/50 group-hover:text-gold/80 transition-colors" />
          </div>
          <p className="text-cream font-medium mb-1">
            اسحب ملف PDF هنا أو انقر للتصفح
          </p>
          <p className="text-sm text-cream-dark/30 flex items-center justify-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            صيغة PDF فقط، حد أقصى 10 ميجابايت
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-cream-dark/25">
            <AlertCircle className="h-3.5 w-3.5" />
            سيقوم الذكاء الاصطناعي باستخراج البيانات تلقائياً
          </div>
        </>
      )}
    </div>
  )
}
