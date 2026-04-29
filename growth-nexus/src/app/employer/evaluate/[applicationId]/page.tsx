'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, Users, User } from 'lucide-react'
import { toast } from 'sonner'

const DEFAULT_CRITERIA = [
    { key: 'technical', label: 'المهارات الفنية', description: 'مدى تطابق المهارات مع المتطلبات' },
    { key: 'communication', label: 'مهارات التواصل', description: 'الوضوح والاحترافية في التعبير' },
    { key: 'experience', label: 'الخبرة العملية', description: 'جودة ونوعية الخبرات السابقة' },
    { key: 'cultural_fit', label: 'التوافق الثقافي', description: 'الملاءمة مع بيئة العمل والفريق' },
    { key: 'overall', label: 'التقييم العام', description: 'الانطباع الشامل عن المرشح' },
]

export default function EvaluatePage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()
    const applicationId = params.applicationId as string

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [application, setApplication] = useState<any>(null)
    const [scores, setScores] = useState<{ criteria: string; label: string; score: number; max: number }[]>(
        DEFAULT_CRITERIA.map(c => ({ criteria: c.key, label: c.label, score: 7, max: 10 }))
    )
    const [notes, setNotes] = useState('')

    useEffect(() => { loadData() }, [applicationId])

    const loadData = async () => {
        setLoading(true)
        const { data: app, error: appError } = await supabase
            .from('applications')
            .select('*, jobs(title)')
            .eq('id', applicationId)
            .single()

        if (app) {
            // Fetch candidate profile separately (FK only points to candidates table)
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', app.candidate_id)
                .single()
            app.profiles = profile || { full_name: 'غير محدد', email: '' }
        }
        setApplication(app)

        // Check if already evaluated
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: existing } = await supabase
                .from('committee_evaluations')
                .select('*')
                .eq('application_id', applicationId)
                .eq('evaluator_id', user.id)
                .single()
            if (existing) {
                setScores(existing.scores)
                setNotes(existing.notes || '')
                setSubmitted(true)
            }
        }
        setLoading(false)
    }

    const updateScore = (index: number, value: number) => {
        const updated = [...scores]
        updated[index] = { ...updated[index], score: value }
        setScores(updated)
    }

    const totalScore = Math.round(scores.reduce((s, c) => s + c.score, 0) / scores.length * 10)

    const handleSubmit = async () => {
        setSubmitting(true)
        try {
            const res = await fetch('/api/evaluation/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    application_id: applicationId,
                    scores,
                    notes,
                    total_score: totalScore,
                }),
            })
            const data = await res.json()
            if (data.success) {
                setSubmitted(true)
                toast.success('تم حفظ التقييم بنجاح!')
            } else {
                toast.error(data.error || 'فشل الحفظ')
            }
        } catch {
            toast.error('حدث خطأ')
        }
        setSubmitting(false)
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-navy"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>

    if (!application) return <div className="flex items-center justify-center min-h-screen bg-navy text-cream-dark/50">لم يتم العثور على الطلب</div>

    return (
        <div className="min-h-screen bg-navy py-8 px-4" dir="rtl">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="h-14 w-14 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="h-7 w-7 text-gold" />
                    </div>
                    <h1 className="text-2xl font-bold text-cream">تقييم المرشح</h1>
                    <p className="text-cream-dark/50 mt-1">لجنة التقييم — نموذج التقييم الموحد</p>
                </div>

                {/* Candidate Info */}
                <Card className="bg-navy-light border-gold/10">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                            <User className="h-6 w-6 text-gold" />
                        </div>
                        <div>
                            <p className="text-cream font-medium">{application.profiles?.full_name || 'غير محدد'}</p>
                            <p className="text-cream-dark/40 text-sm">{application.jobs?.title}</p>
                        </div>
                        {submitted && <Badge className="bg-success/15 text-success ms-auto">تم التقييم</Badge>}
                    </CardContent>
                </Card>

                {/* Scoring Grid */}
                {DEFAULT_CRITERIA.map((criteria, i) => (
                    <Card key={criteria.key} className="bg-navy-light border-gold/10">
                        <CardContent className="p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-cream font-medium">{criteria.label}</p>
                                    <p className="text-cream-dark/30 text-xs">{criteria.description}</p>
                                </div>
                                <div className={`text-2xl font-bold ${scores[i].score >= 8 ? 'text-success' : scores[i].score >= 6 ? 'text-gold' : 'text-red-400'}`}>
                                    {scores[i].score}<span className="text-sm text-cream-dark/30">/10</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                value={scores[i].score}
                                onChange={(e) => updateScore(i, parseInt(e.target.value))}
                                min={1} max={10} step={1}
                                disabled={submitted}
                                className="w-full py-2 accent-gold"
                            />
                        </CardContent>
                    </Card>
                ))}

                {/* Notes */}
                <Card className="bg-navy-light border-gold/10">
                    <CardHeader>
                        <CardTitle className="text-cream text-sm">ملاحظات إضافية (اختياري)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="أضف أي ملاحظات عن المرشح..."
                            className="bg-navy border-gold/10 text-cream min-h-[100px]"
                            disabled={submitted}
                        />
                    </CardContent>
                </Card>

                {/* Total + Submit */}
                <Card className="bg-navy-light border-gold/20">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-cream-dark/50 text-sm">المجموع النهائي</p>
                            <p className="text-3xl font-bold text-gold">{totalScore}<span className="text-sm text-cream-dark/40">%</span></p>
                        </div>
                        {submitted ? (
                            <div className="flex items-center gap-2 text-success">
                                <CheckCircle className="h-5 w-5" />
                                <span>تم الحفظ</span>
                            </div>
                        ) : (
                            <Button onClick={handleSubmit} disabled={submitting} className="bg-gold hover:bg-gold-dark text-navy font-bold px-8">
                                {submitting ? <><Loader2 className="h-4 w-4 animate-spin me-2" />جاري الحفظ...</> : 'إرسال التقييم'}
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <Button variant="ghost" onClick={() => router.back()} className="w-full text-cream-dark/40 hover:text-cream">
                    ← العودة
                </Button>
            </div>
        </div>
    )
}
