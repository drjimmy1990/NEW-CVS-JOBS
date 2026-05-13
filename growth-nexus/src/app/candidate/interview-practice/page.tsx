'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Loader2, ArrowLeft, ArrowRight, CheckCircle, Brain,
    MessageSquare, Play, History, Trophy, Target,
    Sparkles, RotateCcw, Lightbulb, ChevronDown, Eye
} from 'lucide-react'
import { toast } from 'sonner'

// ── Static Data ──
const JOB_ROLES = [
    'مطور واجهات أمامية (Frontend Developer)',
    'مطور خلفيات (Backend Developer)',
    'مطور Full Stack',
    'مصمم UI/UX',
    'محلل بيانات (Data Analyst)',
    'مدير مشاريع (Project Manager)',
    'مدير تسويق (Marketing Manager)',
    'مدير موارد بشرية (HR Manager)',
    'محاسب (Accountant)',
    'مهندس شبكات (Network Engineer)',
    'مدير مبيعات (Sales Manager)',
    'مهندس DevOps',
    'مصمم جرافيك (Graphic Designer)',
    'أخصائي أمن سيبراني (Cybersecurity)',
    'مدير عمليات (Operations Manager)',
    'مساعد إداري (Administrative Assistant)',
    'خدمة عملاء (Customer Service)',
    'مهندس مدني (Civil Engineer)',
    'صيدلي (Pharmacist)',
    'طبيب (Doctor)',
]

const INDUSTRIES = [
    'تكنولوجيا المعلومات',
    'الخدمات المالية والمصرفية',
    'الرعاية الصحية',
    'التعليم والتدريب',
    'التجارة والتجزئة',
    'العقارات والإنشاءات',
    'الضيافة والسياحة',
    'النفط والغاز والطاقة',
    'الإعلام والإعلان',
    'الحكومة والقطاع العام',
    'اللوجستيات والنقل',
    'الاتصالات',
    'الصناعة والتصنيع',
    'الخدمات الاستشارية',
    'التأمين',
]

// ── Searchable Combobox Component ──
function SearchableSelect({
    options,
    value,
    onChange,
    placeholder,
}: {
    options: string[]
    value: string
    onChange: (val: string) => void
    placeholder: string
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const wrapperRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false)
                // If user typed something custom, keep it as the value
                if (search && !value) onChange(search)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [search, value, onChange])

    // Sync display text when value changes externally
    useEffect(() => {
        setSearch(value)
    }, [value])

    const filtered = options.filter(o =>
        o.toLowerCase().includes(search.toLowerCase())
    )

    const handleSelect = (item: string) => {
        onChange(item)
        setSearch(item)
        setOpen(false)
    }

    const handleInputChange = (text: string) => {
        setSearch(text)
        onChange(text) // Always update the actual value as user types
        setOpen(true)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (filtered.length === 1) {
                handleSelect(filtered[0])
            } else {
                onChange(search)
                setOpen(false)
            }
        }
        if (e.key === 'Escape') {
            setOpen(false)
            inputRef.current?.blur()
        }
    }

    return (
        <div ref={wrapperRef} className="relative">
            <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => setOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full bg-navy border border-gold/10 text-cream rounded-lg px-4 py-3 focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-colors placeholder:text-cream-dark/30"
                dir="rtl"
            />
            <ChevronDown
                className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-dark/30 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`}
            />
            {open && filtered.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-navy-light border border-gold/15 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                    {filtered.map((item) => (
                        <button
                            key={item}
                            onClick={() => handleSelect(item)}
                            className={`w-full text-right px-4 py-2.5 text-sm hover:bg-gold/10 transition-colors ${
                                item === value ? 'text-gold bg-gold/5' : 'text-cream-dark/70'
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

type PracticeSession = {
    id: string
    job_role: string
    industry: string
    score: number | null
    status: string
    created_at: string
    completed_at: string | null
    questions?: string[]
    answers?: string[]
    report?: any
}

type EvalItem = {
    question_index: number
    score: number
    max: number
    feedback: string
    tips?: string
}

export default function InterviewPracticePage() {
    // ── State ──
    const [phase, setPhase] = useState<'setup' | 'interview' | 'result' | 'detail'>('setup')
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Setup
    const [jobRole, setJobRole] = useState('')
    const [industry, setIndustry] = useState('')
    const [language, setLanguage] = useState<'ar' | 'en'>('ar')

    // Interview
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [questions, setQuestions] = useState<string[]>([])
    const [answers, setAnswers] = useState<string[]>([])
    const [currentStep, setCurrentStep] = useState(0)

    // Result
    const [result, setResult] = useState<any>(null)

    // History + Detail
    const [history, setHistory] = useState<PracticeSession[]>([])
    const [credits, setCredits] = useState({ balance: 0, allowance: 0 })
    const [loadingHistory, setLoadingHistory] = useState(true)
    const [showHistory, setShowHistory] = useState(false)
    const [viewingSession, setViewingSession] = useState<PracticeSession | null>(null)

    // ── Load History ──
    const loadHistory = useCallback(async () => {
        setLoadingHistory(true)
        try {
            const res = await fetch('/api/interview/practice/history')
            const data = await res.json()
            if (data.sessions) setHistory(data.sessions)
            if (data.credits) setCredits(data.credits)
        } catch { /* ignore */ }
        setLoadingHistory(false)
    }, [])

    useEffect(() => { loadHistory() }, [loadHistory])

    // ── Start Practice ──
    const handleStart = async () => {
        if (!jobRole.trim()) { toast.error('اختر أو اكتب المسمى الوظيفي'); return }
        if (!industry.trim()) { toast.error('اختر أو اكتب القطاع'); return }

        setLoading(true)
        try {
            const res = await fetch('/api/interview/practice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job_role: jobRole.trim(), industry: industry.trim(), language }),
            })
            const data = await res.json()

            if (data.code === 'INSUFFICIENT_CREDITS') {
                toast.error(data.error)
                setLoading(false)
                return
            }

            if (data.success && data.questions) {
                setSessionId(data.sessionId)
                setQuestions(data.questions)
                setAnswers(new Array(data.questions.length).fill(''))
                setCurrentStep(0)
                setPhase('interview')
            } else {
                toast.error(data.error || 'فشل بدء التدريب')
            }
        } catch {
            toast.error('حدث خطأ')
        }
        setLoading(false)
    }

    // ── Submit Answers ──
    const handleSubmit = async () => {
        if (answers.some(a => a.trim().length < 20)) {
            toast.error('يرجى كتابة إجابة مفصلة لكل سؤال (20 حرف على الأقل)')
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch('/api/interview/practice/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, answers }),
            })
            const data = await res.json()
            if (data.overall_score !== undefined) {
                setResult(data)
                setPhase('result')
                loadHistory() // Refresh history
                toast.success('تم تقييم المقابلة بنجاح!')
            } else {
                toast.error('فشل التقييم')
            }
        } catch {
            toast.error('حدث خطأ')
        }
        setSubmitting(false)
    }

    // ── Reset ──
    const handleReset = () => {
        setPhase('setup')
        setQuestions([])
        setAnswers([])
        setResult(null)
        setSessionId(null)
        setCurrentStep(0)
        setViewingSession(null)
    }

    // ── View Past Session ──
    const viewSession = (session: PracticeSession) => {
        setViewingSession(session)
        setJobRole(session.job_role)
        setIndustry(session.industry)
        setPhase('detail')
    }

    // ── Render: SETUP PHASE ──
    if (phase === 'setup') {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="h-16 w-16 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center mx-auto">
                        <Brain className="h-8 w-8 text-gold" />
                    </div>
                    <h1 className="text-3xl font-bold text-cream">تدريب المقابلات الذكي</h1>
                    <p className="text-cream-dark/50 max-w-lg mx-auto">
                        تدرّب على مقابلات واقعية بالذكاء الاصطناعي. اختر مجالك واحصل على أسئلة مخصصة وتقييم فوري.
                    </p>
                </div>

                {/* Credits Banner */}
                <Card className="bg-navy-light border-gold/10">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                                <p className="text-sm text-cream font-medium">رصيدك</p>
                                <p className="text-xs text-cream-dark/40">
                                    {credits.allowance > 0 && `${credits.allowance} جلسة مجانية (اشتراك) + `}
                                    {credits.balance} رصيد عام
                                </p>
                            </div>
                        </div>
                        <Badge className="bg-gold/10 text-gold border-gold/20">
                            {credits.allowance + credits.balance > 0 ? 'رصيد متاح' : 'مجاني (وضع الاختبار)'}
                        </Badge>
                    </CardContent>
                </Card>

                {/* Setup Form */}
                <Card className="bg-navy-light border-gold/10">
                    <CardHeader>
                        <CardTitle className="text-cream flex items-center gap-2">
                            <Target className="h-5 w-5 text-gold" />
                            اختر تفاصيل المقابلة
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Job Role */}
                        <div className="space-y-2">
                            <label className="text-sm text-cream-dark/60">المسمى الوظيفي</label>
                            <SearchableSelect
                                options={JOB_ROLES}
                                value={jobRole}
                                onChange={setJobRole}
                                placeholder="اختر أو اكتب المسمى الوظيفي..."
                            />
                        </div>

                        {/* Industry */}
                        <div className="space-y-2">
                            <label className="text-sm text-cream-dark/60">القطاع / الصناعة</label>
                            <SearchableSelect
                                options={INDUSTRIES}
                                value={industry}
                                onChange={setIndustry}
                                placeholder="اختر أو اكتب القطاع..."
                            />
                        </div>

                        {/* Language */}
                        <div className="space-y-2">
                            <label className="text-sm text-cream-dark/60">لغة الأسئلة</label>
                            <div className="flex gap-3">
                                {([['ar', 'العربية'], ['en', 'English']] as const).map(([val, label]) => (
                                    <button
                                        key={val}
                                        onClick={() => setLanguage(val)}
                                        className={`px-4 py-2 rounded-lg text-sm border transition-colors ${language === val
                                            ? 'bg-gold/10 border-gold/30 text-gold'
                                            : 'border-gold/10 text-cream-dark/40 hover:text-cream hover:border-gold/20'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Start Button */}
                        <Button
                            onClick={handleStart}
                            disabled={loading || !jobRole.trim() || !industry.trim()}
                            className="w-full bg-gold hover:bg-gold-dark text-navy font-bold text-lg py-6 shadow-lg shadow-gold/20"
                        >
                            {loading ? (
                                <><Loader2 className="h-5 w-5 animate-spin me-2" />جارِ التحضير...</>
                            ) : (
                                <><Play className="h-5 w-5 me-2" />ابدأ التدريب</>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* History Section */}
                <Card className="bg-navy-light border-gold/10">
                    <CardHeader>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center justify-between w-full"
                        >
                            <CardTitle className="text-cream flex items-center gap-2">
                                <History className="h-5 w-5 text-gold" />
                                سجل التدريبات ({history.length})
                            </CardTitle>
                            <ChevronDown className={`h-5 w-5 text-cream-dark/40 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                        </button>
                    </CardHeader>
                    {showHistory && (
                        <CardContent className="pt-0">
                            {loadingHistory ? (
                                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-gold" /></div>
                            ) : history.length === 0 ? (
                                <p className="text-center text-cream-dark/30 py-6">لم تقم بأي تدريب بعد. ابدأ أول جلسة!</p>
                            ) : (
                                <div className="space-y-2">
                                    {history.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => viewSession(s)}
                                            className="w-full flex items-center justify-between p-3 rounded-lg bg-navy hover:bg-navy-lighter transition-colors group cursor-pointer"
                                        >
                                            <div className="flex-1 min-w-0 text-right">
                                                <p className="text-sm text-cream font-medium truncate">{s.job_role}</p>
                                                <p className="text-xs text-cream-dark/40">{s.industry} · {new Date(s.created_at).toLocaleDateString('ar-AE', { month: 'short', day: 'numeric' })}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {s.status === 'completed' && s.score != null ? (
                                                    <Badge className={`${s.score >= 75 ? 'bg-success/15 text-success' : s.score >= 50 ? 'bg-gold/15 text-gold' : 'bg-red-500/15 text-red-400'}`}>
                                                        {s.score}%
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-cream-dark/10 text-cream-dark/40">غير مكتمل</Badge>
                                                )}
                                                <Eye className="h-4 w-4 text-cream-dark/20 group-hover:text-gold transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>
            </div>
        )
    }

    // ── Render: INTERVIEW PHASE ──
    if (phase === 'interview') {
        const progress = ((currentStep + 1) / questions.length) * 100

        return (
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="h-14 w-14 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Brain className="h-7 w-7 text-gold" />
                    </div>
                    <h1 className="text-2xl font-bold text-cream">تدريب المقابلة</h1>
                    <p className="text-cream-dark/50 mt-1">{jobRole} — {industry}</p>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-cream-dark/40">
                        <span>السؤال {currentStep + 1} من {questions.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Question */}
                <Card className="bg-navy-light border-gold/10">
                    <CardHeader>
                        <CardTitle className="text-cream text-lg flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-gold" />
                            السؤال {currentStep + 1}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-cream-dark/70 leading-relaxed">{questions[currentStep]}</p>
                        <Textarea
                            value={answers[currentStep] || ''}
                            onChange={(e) => {
                                const updated = [...answers]
                                updated[currentStep] = e.target.value
                                setAnswers(updated)
                            }}
                            placeholder="اكتب إجابتك هنا..."
                            className="bg-navy border-gold/10 text-cream min-h-[150px] resize-none"
                            dir="rtl"
                        />
                        <p className="text-cream-dark/30 text-xs">{answers[currentStep]?.length || 0} حرف (الحد الأدنى: 20)</p>
                    </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex gap-3">
                    {currentStep > 0 && (
                        <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="border-gold/20 text-cream">
                            <ArrowRight className="h-4 w-4 me-1" />السابق
                        </Button>
                    )}
                    <div className="flex-1" />
                    {currentStep < questions.length - 1 ? (
                        <Button
                            onClick={() => setCurrentStep(currentStep + 1)}
                            className="bg-gold hover:bg-gold-dark text-navy"
                            disabled={!answers[currentStep]?.trim()}
                        >
                            التالي<ArrowLeft className="h-4 w-4 ms-1" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            className="bg-success hover:bg-success/80 text-white"
                            disabled={submitting || answers.some(a => !a.trim())}
                        >
                            {submitting ? <><Loader2 className="h-4 w-4 animate-spin me-2" />جاري التقييم...</> : 'إرسال الإجابات'}
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    // ── Render: DETAIL PHASE (viewing past session) ──
    if (phase === 'detail' && viewingSession) {
        const rawQ = viewingSession.questions
        const sessionQuestions: string[] = Array.isArray(rawQ) ? rawQ : (typeof rawQ === 'string' ? JSON.parse(rawQ) : [])
        const rawA = viewingSession.answers
        const sessionAnswers: string[] = Array.isArray(rawA) ? rawA : (typeof rawA === 'string' ? JSON.parse(rawA) : [])
        const rawR = viewingSession.report
        const sessionReport = typeof rawR === 'string' ? JSON.parse(rawR) : (rawR || {})
        const sessionEval: EvalItem[] = sessionReport.evaluation || []

        return (
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <Card className="bg-navy-light border-gold/10">
                    <CardContent className="p-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto">
                            <Eye className="h-8 w-8 text-gold" />
                        </div>
                        <h1 className="text-2xl font-bold text-cream">مراجعة جلسة سابقة</h1>
                        <div className="flex gap-2 text-xs justify-center flex-wrap">
                            <Badge className="bg-navy border-gold/10 text-cream-dark/50">{viewingSession.job_role}</Badge>
                            <Badge className="bg-navy border-gold/10 text-cream-dark/50">{viewingSession.industry}</Badge>
                            <Badge className="bg-navy border-gold/10 text-cream-dark/50">
                                {new Date(viewingSession.created_at).toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </Badge>
                        </div>
                        {viewingSession.score != null && (
                            <div className="text-4xl font-bold text-gold">
                                {viewingSession.score}<span className="text-lg text-cream-dark/40">%</span>
                            </div>
                        )}
                        {sessionReport.recommendation && (
                            <p className="text-cream-dark/50 text-sm">{sessionReport.recommendation}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Q&A Cards */}
                {sessionQuestions.map((q, i) => (
                    <Card key={i} className="bg-navy-light border-gold/10">
                        <CardContent className="p-4 space-y-3">
                            {/* Question */}
                            <div className="flex items-start gap-2">
                                <div className="h-6 w-6 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-xs font-bold text-gold">{i + 1}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-cream leading-relaxed">{q}</p>
                                </div>
                                {sessionEval[i] && (
                                    <Badge className={sessionEval[i].score >= 8 ? 'bg-success/15 text-success' : sessionEval[i].score >= 6 ? 'bg-gold/15 text-gold' : 'bg-red-500/15 text-red-400'}>
                                        {sessionEval[i].score}/{sessionEval[i].max}
                                    </Badge>
                                )}
                            </div>

                            {/* Answer */}
                            {sessionAnswers[i] && (
                                <div className="mr-8 p-3 rounded-lg bg-navy border border-gold/5">
                                    <p className="text-xs text-cream-dark/30 mb-1">إجابتك:</p>
                                    <p className="text-sm text-cream-dark/60 leading-relaxed whitespace-pre-wrap">{sessionAnswers[i]}</p>
                                </div>
                            )}

                            {/* Feedback */}
                            {sessionEval[i]?.feedback && (
                                <div className="mr-8 p-3 rounded-lg bg-gold/5 border border-gold/10">
                                    <p className="text-xs text-gold/60 mb-1">تقييم الذكاء الاصطناعي:</p>
                                    <p className="text-sm text-cream-dark/50 leading-relaxed">{sessionEval[i].feedback}</p>
                                </div>
                            )}

                            {/* Tips */}
                            {sessionEval[i]?.tips && (
                                <div className="mr-8 flex items-start gap-2 p-2 rounded-lg bg-gold/5">
                                    <Lightbulb className="h-3.5 w-3.5 text-gold mt-0.5 shrink-0" />
                                    <p className="text-xs text-gold/80">{sessionEval[i].tips}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {/* General Tips */}
                {sessionReport.tips?.length > 0 && (
                    <Card className="bg-navy-light border-gold/10">
                        <CardHeader>
                            <CardTitle className="text-cream text-base flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-gold" />
                                نصائح للتحسين
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <ul className="space-y-2">
                                {sessionReport.tips.map((tip: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-cream-dark/50">
                                        <span className="text-gold mt-0.5">•</span>
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleReset} className="bg-gold hover:bg-gold-dark text-navy font-bold flex-1">
                        <RotateCcw className="h-4 w-4 me-2" />تدريب جديد
                    </Button>
                    <Button onClick={() => { setPhase('setup'); setViewingSession(null); setShowHistory(true) }} variant="outline" className="border-gold/20 text-cream flex-1">
                        <ArrowRight className="h-4 w-4 me-2" />العودة للسجل
                    </Button>
                </div>
            </div>
        )
    }

    // ── Render: RESULT PHASE ──
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Score Card */}
            <Card className="bg-navy-light border-gold/10">
                <CardContent className="p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                        <Trophy className="h-10 w-10 text-success" />
                    </div>
                    <h1 className="text-2xl font-bold text-cream">نتيجة التدريب</h1>
                    <div className="text-5xl font-bold text-gold">
                        {result?.overall_score}<span className="text-lg text-cream-dark/40">%</span>
                    </div>
                    <p className="text-cream-dark/50">{result?.recommendation}</p>
                    <div className="flex gap-2 text-xs justify-center">
                        <Badge className="bg-navy border-gold/10 text-cream-dark/50">{jobRole}</Badge>
                        <Badge className="bg-navy border-gold/10 text-cream-dark/50">{industry}</Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Per-question Breakdown */}
            {result?.evaluation?.map((ev: EvalItem, i: number) => (
                <Card key={i} className="bg-navy-light border-gold/10">
                    <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-cream text-sm font-medium">السؤال {i + 1}</span>
                            <Badge className={ev.score >= 8 ? 'bg-success/15 text-success' : ev.score >= 6 ? 'bg-gold/15 text-gold' : 'bg-red-500/15 text-red-400'}>
                                {ev.score}/{ev.max}
                            </Badge>
                        </div>
                        <p className="text-cream-dark/40 text-xs">{ev.feedback}</p>
                        {ev.tips && (
                            <div className="flex items-start gap-2 mt-2 p-2 rounded-lg bg-gold/5">
                                <Lightbulb className="h-3.5 w-3.5 text-gold mt-0.5 shrink-0" />
                                <p className="text-xs text-gold/80">{ev.tips}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}

            {/* Tips */}
            {result?.tips?.length > 0 && (
                <Card className="bg-navy-light border-gold/10">
                    <CardHeader>
                        <CardTitle className="text-cream text-base flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-gold" />
                            نصائح للتحسين
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ul className="space-y-2">
                            {result.tips.map((tip: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-cream-dark/50">
                                    <span className="text-gold mt-0.5">•</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleReset} className="bg-gold hover:bg-gold-dark text-navy font-bold flex-1">
                    <RotateCcw className="h-4 w-4 me-2" />تدريب جديد
                </Button>
                <Button onClick={() => { handleReset(); setShowHistory(true) }} variant="outline" className="border-gold/20 text-cream flex-1">
                    <History className="h-4 w-4 me-2" />سجل التدريبات
                </Button>
            </div>
        </div>
    )
}
