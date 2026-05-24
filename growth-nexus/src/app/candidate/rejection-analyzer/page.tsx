'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    AlertTriangle, Loader2, ChevronDown, ChevronUp,
    Target, Lightbulb, BookOpen, ArrowRight,
    Sparkles, XCircle, CheckCircle2, BarChart3
} from 'lucide-react'

interface RejectedApp {
    id: string
    job_id: string
    rejection_reason: string | null
    rejection_analysis: Record<string, unknown> | null
    created_at: string
    jobs: {
        title: string
        companies: { name: string } | null
        skills_required: string[] | null
    } | null
}

interface Analysis {
    likely_reasons: string[]
    improvement_areas: string[]
    missing_skills: string[]
    recommended_actions: string[]
    alternative_roles: string[]
    match_score?: number
}

export default function RejectionAnalyzerPage() {
    const [apps, setApps] = useState<RejectedApp[]>([])
    const [loading, setLoading] = useState(true)
    const [analyzingId, setAnalyzingId] = useState<string | null>(null)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [error, setError] = useState('')
    const supabase = createClient()

    useEffect(() => {
        loadRejectedApps()
    }, [])

    async function loadRejectedApps() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('applications')
            .select('id, job_id, rejection_reason, rejection_analysis, created_at, jobs(title, skills_required, companies(name))')
            .eq('candidate_id', user.id)
            .eq('status', 'rejected')
            .order('created_at', { ascending: false })

        setApps((data as unknown as RejectedApp[]) || [])
        setLoading(false)
    }

    async function analyzeRejection(applicationId: string) {
        setAnalyzingId(applicationId)
        setError('')

        try {
            const res = await fetch('/api/ai/rejection-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ application_id: applicationId }),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'حدث خطأ أثناء التحليل')
                return
            }

            // Update local state with analysis
            setApps(prev => prev.map(app =>
                app.id === applicationId
                    ? { ...app, rejection_analysis: data.analysis }
                    : app
            ))
            setExpandedId(applicationId)
        } catch {
            setError('فشل الاتصال بالخادم')
        } finally {
            setAnalyzingId(null)
        }
    }

    function getScoreColor(score: number) {
        if (score >= 70) return 'text-emerald-400'
        if (score >= 40) return 'text-amber-400'
        return 'text-red-400'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8" dir="rtl">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-cream flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/20">
                        <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    تحليل الرفض بالذكاء الاصطناعي
                </h1>
                <p className="text-cream-dark/60">
                    افهم أسباب رفض طلباتك واحصل على نصائح ذكية لتحسين فرصك القادمة
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                    <XCircle className="h-5 w-5 shrink-0" />
                    {error}
                </div>
            )}

            {/* Empty State */}
            {apps.length === 0 && (
                <div className="text-center py-16 px-8 rounded-2xl bg-navy-light border border-gold/10">
                    <AlertTriangle className="h-16 w-16 text-cream-dark/20 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-cream mb-2">لا توجد طلبات مرفوضة</h3>
                    <p className="text-cream-dark/50">
                        عندما يتم رفض أي طلب توظيف، ستتمكن من تحليل أسباب الرفض هنا
                    </p>
                </div>
            )}

            {/* Rejected Applications List */}
            <div className="space-y-4">
                {apps.map(app => {
                    const analysis = app.rejection_analysis as Analysis | null
                    const isExpanded = expandedId === app.id
                    const isAnalyzing = analyzingId === app.id
                    const hasAnalysis = !!analysis

                    return (
                        <div key={app.id} className="rounded-2xl bg-navy-light border border-gold/10 overflow-hidden transition-all duration-300">
                            {/* Card Header */}
                            <div className="p-5 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                    <XCircle className="h-6 w-6 text-red-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-cream truncate">
                                        {app.jobs?.title || 'وظيفة محذوفة'}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-sm text-cream-dark/50">
                                            {app.jobs?.companies?.name || 'شركة'}
                                        </span>
                                        <span className="text-xs text-cream-dark/30">•</span>
                                        <span className="text-sm text-cream-dark/50">
                                            {new Date(app.created_at).toLocaleDateString('ar-AE')}
                                        </span>
                                    </div>
                                    {app.rejection_reason && (
                                        <Badge variant="secondary" className="mt-2 bg-red-500/10 text-red-400 border-red-500/20 text-xs">
                                            سبب الرفض: {app.rejection_reason}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {hasAnalysis ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setExpandedId(isExpanded ? null : app.id)}
                                            className="text-gold hover:text-gold hover:bg-gold/10"
                                        >
                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            {isExpanded ? 'إخفاء' : 'عرض التحليل'}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => analyzeRejection(app.id)}
                                            disabled={isAnalyzing}
                                            className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold hover:opacity-90"
                                        >
                                            {isAnalyzing ? (
                                                <><Loader2 className="h-4 w-4 animate-spin me-2" />جاري التحليل...</>
                                            ) : (
                                                <><Sparkles className="h-4 w-4 me-2" />تحليل الرفض</>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Analysis Result */}
                            {isExpanded && analysis && (
                                <div className="border-t border-gold/10 p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                                    {/* Match Score */}
                                    {analysis.match_score !== undefined && (
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-navy/50">
                                            <BarChart3 className={`h-8 w-8 ${getScoreColor(analysis.match_score)}`} />
                                            <div>
                                                <p className="text-sm text-cream-dark/50">نسبة التوافق</p>
                                                <p className={`text-2xl font-bold ${getScoreColor(analysis.match_score)}`}>
                                                    {analysis.match_score}%
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Likely Reasons */}
                                    {analysis.likely_reasons?.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                                                <Target className="h-4 w-4" />
                                                أسباب الرفض المحتملة
                                            </h4>
                                            <div className="space-y-2">
                                                {analysis.likely_reasons.map((reason, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                                        <span className="text-red-400 text-sm mt-0.5">●</span>
                                                        <span className="text-sm text-cream-dark/80">{reason}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Missing Skills */}
                                    {analysis.missing_skills?.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                                                <BookOpen className="h-4 w-4" />
                                                مهارات مطلوبة لم تُذكر
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.missing_skills.map((skill, i) => (
                                                    <Badge key={i} variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Improvement Areas */}
                                    {analysis.improvement_areas?.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                                                <Lightbulb className="h-4 w-4" />
                                                مجالات التحسين
                                            </h4>
                                            <div className="space-y-2">
                                                {analysis.improvement_areas.map((area, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                                        <span className="text-blue-400 text-sm mt-0.5">{i + 1}.</span>
                                                        <span className="text-sm text-cream-dark/80">{area}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recommended Actions */}
                                    {analysis.recommended_actions?.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4" />
                                                خطوات عملية
                                            </h4>
                                            <div className="space-y-2">
                                                {analysis.recommended_actions.map((action, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                                        <ArrowRight className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                                        <span className="text-sm text-cream-dark/80">{action}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Alternative Roles */}
                                    {analysis.alternative_roles?.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                                                <Sparkles className="h-4 w-4" />
                                                وظائف بديلة مقترحة
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.alternative_roles.map((role, i) => (
                                                    <Badge key={i} variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                                                        {role}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
