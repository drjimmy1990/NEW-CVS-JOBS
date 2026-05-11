'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users, UserCheck, Target, TrendingUp, Flag, Briefcase, AlertTriangle } from 'lucide-react'
import { calculateCurrentRate, calculateGap, type EmiratisationProfile } from '@/lib/emiratisation-engine'

interface Props {
    profile: EmiratisationProfile
}

export function EmiratisationCalculator({ profile }: Props) {
    const gap = calculateGap(profile)
    const currentRate = calculateCurrentRate(profile.emiratis_in_skilled, profile.skilled_employees)

    const metrics = [
        { label: 'إجمالي الموظفين', value: profile.total_employees, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'الموظفين المهاريين', value: profile.skilled_employees, icon: Briefcase, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { label: 'المواطنين الحاليين', value: profile.current_emiratis, icon: Flag, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'المواطنين في وظائف مهارية', value: profile.emiratis_in_skilled, icon: UserCheck, color: 'text-gold', bg: 'bg-gold/10' },
        { label: 'نسبة التوطين الحالية', value: `${currentRate.toFixed(2)}%`, icon: TrendingUp, color: gap.currentRate >= gap.requiredRate ? 'text-success' : 'text-red-400', bg: gap.currentRate >= gap.requiredRate ? 'bg-success/10' : 'bg-red-500/10' },
        { label: 'النسبة المطلوبة', value: `${gap.requiredRate}%`, icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'الفجوة (مواطنين إضافيين)', value: gap.additionalNeeded, icon: AlertTriangle, color: gap.additionalNeeded > 0 ? 'text-red-400' : 'text-success', bg: gap.additionalNeeded > 0 ? 'bg-red-500/10' : 'bg-success/10' },
    ]

    return (
        <div className="space-y-6">
            {/* Large Gauge */}
            <Card className="bg-navy-light border-gold/10">
                <CardContent className="p-8 flex flex-col items-center">
                    <div className="relative w-44 h-44 mb-6">
                        <svg className="w-44 h-44 -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-navy-lighter" />
                            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8"
                                strokeDasharray={`${Math.min(100, currentRate) / 100 * 327} 327`}
                                className={gap.currentRate >= gap.requiredRate ? 'text-success' : 'text-red-400'}
                                strokeLinecap="round"
                            />
                            {/* Target indicator */}
                            {gap.requiredRate > 0 && (
                                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="2"
                                    strokeDasharray={`2 325`}
                                    strokeDashoffset={`${-((gap.requiredRate / 100) * 327)}`}
                                    className="text-amber-400/50"
                                />
                            )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-4xl font-bold ${gap.currentRate >= gap.requiredRate ? 'text-success' : 'text-red-400'}`}>
                                {currentRate.toFixed(1)}%
                            </span>
                            <span className="text-xs text-cream-dark/40 mt-1">نسبة التوطين</span>
                        </div>
                    </div>

                    {/* Mini formula */}
                    <div className="text-center text-sm text-cream-dark/50">
                        <span className="text-cream font-medium">{profile.emiratis_in_skilled}</span>
                        <span className="mx-1">÷</span>
                        <span className="text-cream font-medium">{profile.skilled_employees}</span>
                        <span className="mx-1">=</span>
                        <span className={`font-bold ${gap.currentRate >= gap.requiredRate ? 'text-success' : 'text-red-400'}`}>
                            {currentRate.toFixed(2)}%
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* 7 Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {metrics.map(m => (
                    <Card key={m.label} className="bg-navy-light border-gold/10">
                        <CardContent className="p-4 text-center">
                            <div className={`p-2 rounded-lg ${m.bg} w-fit mx-auto mb-2`}>
                                <m.icon className={`h-4 w-4 ${m.color}`} />
                            </div>
                            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                            <p className="text-[10px] text-cream-dark/40 mt-1 leading-tight">{m.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
