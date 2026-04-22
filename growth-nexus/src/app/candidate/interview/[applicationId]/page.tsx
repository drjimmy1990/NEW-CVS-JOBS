'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, ArrowLeft, ArrowRight, CheckCircle, Brain, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

export default function InterviewPage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()
    const applicationId = params.applicationId as string

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [application, setApplication] = useState<any>(null)
    const [questions, setQuestions] = useState<string[]>([])
    const [answers, setAnswers] = useState<string[]>([])
    const [currentStep, setCurrentStep] = useState(0)
    const [result, setResult] = useState<any>(null)

    useEffect(() => {
        loadData()
    }, [applicationId])

    const loadData = async () => {
        setLoading(true)
        // Get application + job info
        const { data: app } = await supabase
            .from('applications')
            .select('*, jobs(id, title, job_type, auto_interview)')
            .eq('id', applicationId)
            .single()

        if (!app) {
            toast.error('لم يتم العثور على الطلب')
            return
        }

        if (app.interview_score) {
            setResult(app.interview_report)
            setApplication(app)
            setLoading(false)
            return
        }

        setApplication(app)

        // Fetch questions
        const res = await fetch('/api/interview/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                job_id: app.jobs?.id,
                job_title: app.jobs?.title,
                job_type: app.jobs?.job_type,
            }),
        })
        const data = await res.json()
        if (data.questions) {
            setQuestions(data.questions)
            setAnswers(new Array(data.questions.length).fill(''))
        }
        setLoading(false)
    }

    const handleSubmit = async () => {
        if (answers.some(a => a.trim().length < 20)) {
            toast.error('يرجى كتابة إجابة مفصلة لكل سؤال (20 حرف على الأقل)')
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch('/api/interview/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    application_id: applicationId,
                    job_id: application.jobs?.id,
                    job_title: application.jobs?.title,
                    questions,
                    answers,
                }),
            })
            const data = await res.json()
            if (data.success || data.overall_score) {
                setResult(data)
                toast.success('تم تقييم المقابلة بنجاح!')
            } else {
                toast.error('فشل التقييم')
            }
        } catch {
            toast.error('حدث خطأ')
        }
        setSubmitting(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-navy flex items-center justify-center" dir="rtl">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
        )
    }

    // Show result
    if (result) {
        return (
            <div className="min-h-screen bg-navy py-8 px-4" dir="rtl">
                <div className="max-w-2xl mx-auto space-y-6">
                    <Card className="bg-navy-light border-gold/10">
                        <CardContent className="p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="h-10 w-10 text-success" />
                            </div>
                            <h1 className="text-2xl font-bold text-cream">نتيجة المقابلة الآلية</h1>
                            <div className="text-5xl font-bold text-gold">{result.overall_score}<span className="text-lg text-cream-dark/40">%</span></div>
                            <p className="text-cream-dark/50">{result.recommendation}</p>
                        </CardContent>
                    </Card>

                    {result.evaluation?.map((ev: any, i: number) => (
                        <Card key={i} className="bg-navy-light border-gold/10">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-cream text-sm font-medium">السؤال {i + 1}</span>
                                    <Badge className={ev.score >= 8 ? 'bg-success/15 text-success' : ev.score >= 6 ? 'bg-gold/15 text-gold' : 'bg-red-500/15 text-red-400'}>
                                        {ev.score}/{ev.max}
                                    </Badge>
                                </div>
                                <p className="text-cream-dark/40 text-xs">{ev.feedback}</p>
                            </CardContent>
                        </Card>
                    ))}

                    <Button onClick={() => router.push('/candidate/applications')} className="w-full bg-gold hover:bg-gold-dark text-navy">
                        العودة لطلباتي
                    </Button>
                </div>
            </div>
        )
    }

    // Interview wizard
    const progress = ((currentStep + 1) / questions.length) * 100

    return (
        <div className="min-h-screen bg-navy py-8 px-4" dir="rtl">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="h-14 w-14 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Brain className="h-7 w-7 text-gold" />
                    </div>
                    <h1 className="text-2xl font-bold text-cream">المقابلة الآلية</h1>
                    <p className="text-cream-dark/50 mt-1">{application?.jobs?.title}</p>
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
                        <p className="text-cream-dark/30 text-xs">{answers[currentStep]?.length || 0} حرف</p>
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
                        <Button onClick={() => setCurrentStep(currentStep + 1)} className="bg-gold hover:bg-gold-dark text-navy"
                            disabled={!answers[currentStep]?.trim()}>
                            التالي<ArrowLeft className="h-4 w-4 ms-1" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} className="bg-success hover:bg-success-dark text-white"
                            disabled={submitting || answers.some(a => !a.trim())}>
                            {submitting ? <><Loader2 className="h-4 w-4 animate-spin me-2" />جاري التقييم...</> : 'إرسال الإجابات'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
