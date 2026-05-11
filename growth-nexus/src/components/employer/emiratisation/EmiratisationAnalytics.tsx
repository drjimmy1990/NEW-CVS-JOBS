'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, TrendingDown, UserPlus, UserMinus, Users } from 'lucide-react'
import { type EmiratisationProfile } from '@/lib/emiratisation-engine'

interface Props { profile: EmiratisationProfile }

export function EmiratisationAnalytics({ profile }: Props) {
    const netGrowth = profile.new_emiratis_this_year - profile.resigned_emiratis_this_year
    const citizenRatio = profile.total_employees > 0
        ? ((profile.current_emiratis / profile.total_employees) * 100).toFixed(1) : '0'
    const residentCount = profile.total_employees - profile.current_emiratis

    const stats = [
        { label: 'مواطنين جدد', value: profile.new_emiratis_this_year, icon: UserPlus, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'مواطنين مستقيلين', value: profile.resigned_emiratis_this_year, icon: UserMinus, color: 'text-red-400', bg: 'bg-red-500/10' },
        { label: 'صافي النمو', value: netGrowth, icon: netGrowth >= 0 ? TrendingUp : TrendingDown, color: netGrowth >= 0 ? 'text-emerald-400' : 'text-red-400', bg: netGrowth >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10' },
    ]

    return (
        <Card className="bg-navy-light border-gold/10">
            <CardHeader>
                <CardTitle className="text-cream text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-gold" />
                    تحليلات التوطين
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Growth Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {stats.map(s => (
                        <div key={s.label} className={`p-4 rounded-lg ${s.bg} text-center`}>
                            <s.icon className={`h-5 w-5 ${s.color} mx-auto mb-1`} />
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value >= 0 ? '+' : ''}{s.value}</p>
                            <p className="text-[10px] text-cream-dark/40 mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Citizen vs Resident Distribution */}
                <div>
                    <p className="text-sm text-cream-dark/60 mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        توزيع القوى العاملة
                    </p>
                    <div className="h-6 rounded-full overflow-hidden flex bg-navy-lighter">
                        <div className="bg-gold h-full flex items-center justify-center text-[10px] text-navy font-bold transition-all"
                            style={{ width: `${citizenRatio}%`, minWidth: profile.current_emiratis > 0 ? '30px' : '0' }}>
                            {profile.current_emiratis > 0 ? `${citizenRatio}%` : ''}
                        </div>
                        <div className="bg-navy-lighter h-full flex-1 flex items-center justify-center text-[10px] text-cream-dark/40">
                            {residentCount > 0 ? `${(100 - parseFloat(citizenRatio)).toFixed(1)}%` : ''}
                        </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-cream-dark/50">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-gold" /> مواطنين ({profile.current_emiratis})
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-navy-lighter border border-gold/10" /> مقيمين ({residentCount})
                        </span>
                    </div>
                </div>

                {/* Skilled vs Unskilled */}
                <div>
                    <p className="text-sm text-cream-dark/60 mb-3">توزيع المهارات</p>
                    <div className="h-6 rounded-full overflow-hidden flex bg-navy-lighter">
                        <div className="bg-purple-500 h-full flex items-center justify-center text-[10px] text-white font-bold transition-all"
                            style={{ width: `${profile.total_employees > 0 ? (profile.skilled_employees / profile.total_employees) * 100 : 0}%`, minWidth: profile.skilled_employees > 0 ? '30px' : '0' }}>
                            {profile.skilled_employees}
                        </div>
                        <div className="bg-navy-lighter h-full flex-1 flex items-center justify-center text-[10px] text-cream-dark/40">
                            {profile.unskilled_employees}
                        </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-cream-dark/50">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-purple-500" /> مهاريين ({profile.skilled_employees})
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-navy-lighter border border-gold/10" /> غير مهاريين ({profile.unskilled_employees})
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
