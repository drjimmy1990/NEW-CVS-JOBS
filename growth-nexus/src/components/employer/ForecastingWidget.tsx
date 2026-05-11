'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Clock, TrendingUp, Target, ArrowUpDown,
    Loader2, BarChart3, Zap
} from 'lucide-react'

interface Forecasts {
    overview: {
        total_jobs: number
        active_jobs: number
        closed_jobs: number
        total_applications: number
        total_hires: number
    }
    predictions: {
        time_to_fill_days: number
        offer_acceptance_rate: number
        hiring_difficulty: 'low' | 'medium' | 'high'
        avg_applicants_per_job: number
        predicted_applicants_30d: number
        predicted_hires_30d: number
    }
    conversion_funnel: {
        applied_to_reviewed: number
        reviewed_to_interview: number
        interview_to_shortlist: number
        shortlist_to_hire: number
    }
    monthly_trend: { month: string; jobs: number; applications: number }[]
    salary_benchmark: { avg_min: number; avg_max: number }
}

const DIFFICULTY: Record<string, { label: string; color: string }> = {
    low: { label: 'منخفضة', color: 'text-green-400' },
    medium: { label: 'متوسطة', color: 'text-yellow-400' },
    high: { label: 'مرتفعة', color: 'text-red-400' },
}

export function ForecastingWidget() {
    const [data, setData] = useState<Forecasts | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/analytics/forecasting')
            .then(r => r.json())
            .then(d => { setData(d.forecasts); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <Card className="bg-navy-light border-gold/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                <CardHeader>
                    <CardTitle className="text-cream text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5 text-gold" />
                        توقعات الذكاء الاصطناعي
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gold" />
                </CardContent>
            </Card>
        )
    }

    if (!data) return null

    const diff = DIFFICULTY[data.predictions.hiring_difficulty] || DIFFICULTY.medium

    return (
        <Card className="bg-navy-light border-gold/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <CardHeader>
                <CardTitle className="text-cream text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-gold" />
                    توقعات الذكاء الاصطناعي
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Time to Fill */}
                <div className="p-4 bg-navy-lighter/30 rounded-lg border border-gold/5 flex items-start gap-4 hover:border-gold/20 transition-colors">
                    <Clock className="h-6 w-6 text-blue-400 shrink-0 mt-1" />
                    <div>
                        <h4 className="text-cream font-medium">متوسط وقت الإغلاق</h4>
                        <p className="text-cream-dark/60 text-sm mt-1 leading-relaxed">
                            بناءً على بياناتك الفعلية، يتوقع إغلاق وظائفك خلال{' '}
                            <strong className="text-gold font-bold">{data.predictions.time_to_fill_days} يوماً</strong>.
                        </p>
                    </div>
                </div>

                {/* Offer Acceptance */}
                <div className="p-4 bg-navy-lighter/30 rounded-lg border border-gold/5 flex items-start gap-4 hover:border-gold/20 transition-colors">
                    <Target className="h-6 w-6 text-emerald-400 shrink-0 mt-1" />
                    <div>
                        <h4 className="text-cream font-medium">معدل قبول العروض</h4>
                        <p className="text-cream-dark/60 text-sm mt-1 leading-relaxed">
                            <strong className="text-emerald-400 font-bold">{data.predictions.offer_acceptance_rate}%</strong>
                            {' '}من العروض المقدمة تم قبولها.
                        </p>
                    </div>
                </div>

                {/* Hiring Difficulty */}
                <div className="p-4 bg-navy-lighter/30 rounded-lg border border-gold/5 flex items-start gap-4 hover:border-gold/20 transition-colors">
                    <TrendingUp className="h-6 w-6 text-purple-400 shrink-0 mt-1" />
                    <div>
                        <h4 className="text-cream font-medium">صعوبة التوظيف</h4>
                        <p className="text-cream-dark/60 text-sm mt-1 leading-relaxed">
                            المستوى: <strong className={`${diff.color} font-bold`}>{diff.label}</strong>
                            {' '}({data.predictions.avg_applicants_per_job} متقدم/وظيفة في المعدل)
                        </p>
                    </div>
                </div>

                {/* 30-Day Predictions */}
                <div className="p-4 bg-navy-lighter/30 rounded-lg border border-gold/5 flex items-start gap-4 hover:border-gold/20 transition-colors">
                    <BarChart3 className="h-6 w-6 text-gold shrink-0 mt-1" />
                    <div>
                        <h4 className="text-cream font-medium">توقعات الـ 30 يوماً القادمة</h4>
                        <p className="text-cream-dark/60 text-sm mt-1 leading-relaxed">
                            متقدمون متوقعون: <strong className="text-cream">{data.predictions.predicted_applicants_30d}</strong>
                            {' | '}تعيينات متوقعة: <strong className="text-cream">{data.predictions.predicted_hires_30d}</strong>
                        </p>
                    </div>
                </div>

                {/* Conversion Funnel */}
                <div className="pt-3 border-t border-gold/5">
                    <h4 className="text-cream text-xs font-medium mb-3 flex items-center gap-2">
                        <ArrowUpDown className="h-3.5 w-3.5 text-gold" />
                        قمع التحويل
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: 'مراجعة', value: data.conversion_funnel.applied_to_reviewed },
                            { label: 'مقابلة', value: data.conversion_funnel.reviewed_to_interview },
                            { label: 'قائمة مختصرة', value: data.conversion_funnel.interview_to_shortlist },
                            { label: 'تعيين', value: data.conversion_funnel.shortlist_to_hire },
                        ].map(stage => (
                            <div key={stage.label} className="bg-navy/50 rounded p-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-cream-dark/50">{stage.label}</span>
                                    <span className="text-xs text-cream font-bold">{stage.value}%</span>
                                </div>
                                <div className="h-1 bg-navy-lighter rounded-full overflow-hidden">
                                    <div className="h-full bg-gold/60 rounded-full transition-all" style={{ width: `${stage.value}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Salary Benchmark */}
                {data.salary_benchmark.avg_min > 0 && (
                    <div className="pt-2 text-[11px] text-cream-dark/40 text-center">
                        متوسط نطاق الرواتب: {data.salary_benchmark.avg_min.toLocaleString()} - {data.salary_benchmark.avg_max.toLocaleString()} AED
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
