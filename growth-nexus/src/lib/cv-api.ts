// ===== CV Services API Client =====
// Centralizes all calls to /api/cv/* routes

import type {
  CvLanguage,
  CvOptimizeResult,
  CvFinalizeResult,
  CvAtsConvertResult,
  CvLinkProfileResult,
  CvData,
} from '@/types/cv'

// --- Parse CV (Upload PDF → extract text, create session) ---

export interface ParseCvResponse {
  success: boolean
  sessionId?: string
  text?: string
  error?: string
}

export async function parseCv(
  file: File,
  language: CvLanguage = 'en'
): Promise<ParseCvResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('language', language)

    const res = await fetch('/api/cv/parse', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.error || 'فشل تحليل السيرة الذاتية' }
    return { success: true, sessionId: data.sessionId, text: data.text }
  } catch {
    return { success: false, error: 'خطأ في الاتصال بالخادم' }
  }
}

// --- Parse CV from URL (server fetches PDF, avoids CORS) ---

export async function parseCvFromUrl(
  sourceUrl: string,
  language: CvLanguage = 'en'
): Promise<ParseCvResponse> {
  try {
    const res = await fetch('/api/cv/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl, language }),
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.error || 'فشل تحليل السيرة الذاتية' }
    return { success: true, sessionId: data.sessionId, text: data.text }
  } catch {
    return { success: false, error: 'خطأ في الاتصال بالخادم' }
  }
}

// --- Optimize CV (AI chat loop) ---

export interface OptimizeCvResponse {
  success: boolean
  result?: CvOptimizeResult
  error?: string
}

export async function optimizeCv(
  sessionId: string,
  message: string,
  language: CvLanguage = 'en',
  chatHistory: Array<{ id: string; sender: string; content: string; timestamp: string }> = []
): Promise<OptimizeCvResponse> {
  try {
    const res = await fetch('/api/cv/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message, language, chatHistory }),
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.error || 'فشل تحسين السيرة الذاتية' }
    return { success: true, result: data }
  } catch {
    return { success: false, error: 'خطأ في الاتصال بالخادم' }
  }
}

// --- Create CV (Form data → generate PDF) ---

export interface CreateCvResponse {
  success: boolean
  sessionId?: string
  downloadUrl?: string
  error?: string
}

export async function createCv(
  formData: CvData,
  language: CvLanguage = 'en'
): Promise<CreateCvResponse> {
  try {
    const res = await fetch('/api/cv/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvData: formData, language }),
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.error || 'فشل إنشاء السيرة الذاتية' }
    return { success: true, sessionId: data.sessionId, downloadUrl: data.downloadUrl }
  } catch {
    return { success: false, error: 'خطأ في الاتصال بالخادم' }
  }
}

// --- ATS Convert (PDF/text → ATS-ready CV) ---

export interface AtsConvertResponse {
  success: boolean
  result?: CvAtsConvertResult
  error?: string
}

export async function atsConvertCv(
  input: File | string,
  language: CvLanguage = 'en'
): Promise<AtsConvertResponse> {
  try {
    const payload: any = { language }

    if (input instanceof File) {
      // Convert File to base64 string
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(input)
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1]) // Remove data:application/pdf;base64, prefix
        }
        reader.onerror = error => reject(error)
      })

      payload.inputType = 'pdf'
      payload.pdfBase64 = base64
      payload.fileName = input.name
    } else {
      payload.inputType = 'text'
      payload.rawText = input
    }

    const res = await fetch('/api/cv/ats-convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.error || 'فشل تحويل ATS' }
    return { success: true, result: data }
  } catch {
    return { success: false, error: 'خطأ في الاتصال بالخادم' }
  }
}

// --- Finalize CV (Mark session done, get download URL) ---

export interface FinalizeCvResponse {
  success: boolean
  result?: CvFinalizeResult
  error?: string
}

export async function finalizeCv(sessionId: string): Promise<FinalizeCvResponse> {
  try {
    const res = await fetch('/api/cv/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.error || 'فشل إنهاء الجلسة' }
    return { success: true, result: data }
  } catch {
    return { success: false, error: 'خطأ في الاتصال بالخادم' }
  }
}

// --- Link CV to Profile (User-initiated) ---

export async function linkCvToProfile(sessionId: string): Promise<CvLinkProfileResult> {
  try {
    const res = await fetch('/api/cv/link-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })

    const data = await res.json()
    if (!res.ok) return { success: false, message: data.error || 'فشل ربط السيرة بالملف', error: data.error }
    return { success: true, message: data.message || 'تم تحديث ملفك بنجاح', cv_url: data.cv_url }
  } catch {
    return { success: false, message: 'خطأ في الاتصال بالخادم', error: 'connection_error' }
  }
}
