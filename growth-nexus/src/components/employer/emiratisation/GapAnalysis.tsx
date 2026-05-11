'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateGap, type EmiratisationProfile } from '@/lib/emiratisation-engine'

interface Props { profile: EmiratisationProfile }

export function GapAnalysis({ profile }: Props) {
    const gap = calculateGap(profile)

    const items = [
        { label: 'عدد المواطنين المطلوبين', value: gap.requiredEmiratis, color: 'text-amber-400' },
        { label: 'عدد المواطنين الحاليين (مهاري)', value: gap.currentEmiratis, color: 'text-blue-400' },
        { label: 'المتبقي', value: gap.additionalNeeded, color: gap.additionalNeeded > 0 ? 'text-red-400' : 'text-success' },
    ]

    return (
        <Card className="bg-navy-light border-gold/10">
            <CardHeader><CardTitle className="text-cream text-lg">تحليل الفجوة</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {items.map(i => (
                    <div key={i.label} className="flex items-center justify-between">
                        <span className="text-cream-dark/60 text-sm">{i.label}</span>
                        <span className={`text-xl font-bold ${i.color}`}>{i.value}</span>
                    </div>
                ))}

                {/* Progress bar */}
                <div className="pt-2">
                    <div className="flex justify-between text-xs text-cream-dark/40 mb-1">
                        <span>التقدم نحو المستهدف</span>
                        <span>{gap.requiredEmiratis > 0 ? Math.round((gap.currentEmiratis / gap.requiredEmiratis) * 100) : 100}%</span>
                    </div>
                    <div className="h-3 bg-navy-lighter rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all"
                            style={{ width: `${gap.requiredEmiratis > 0 ? Math.min(100, (gap.currentEmiratis / gap.requiredEmiratis) * 100) : 100}%` }} />
                    </div>
                </div>

                {/* Diagnostic flags */}
                <div className="space-y-2 pt-2">
                    {gap.isSkillGap && (
                        <p className="text-xs text-amber-300/70 bg-amber-500/5 rounded-lg p-2 border border-amber-500/10">
                            ⚠️ النقص في الوظائف المهارية — بعض المواطنين في وظائف غير مهارية
                        </p>
                    )}
                    {gap.isResignationIssue && (
                        <p className="text-xs text-red-300/70 bg-red-500/5 rounded-lg p-2 border border-red-500/10">
                            ⚠️ انخفاض بسبب الاستقالات — {profile.resigned_emiratis_this_year} مواطن استقال هذا العام
                        </p>
                    )}
                </div>

                {/* Summary text */}
                {gap.additionalNeeded > 0 && (
                    <div className="p-4 rounded-lg bg-navy/50 border border-gold/5 mt-2">
                        <p className="text-sm text-cream-dark/70">
                            الشركة لديها <span className="text-cream font-bold">{profile.skilled_employees}</span> موظفاً مهارياً، وتحتاج إلى <span className="text-gold font-bold">{gap.requiredEmiratis}</span> مواطنين لتحقيق المستهدف. الموجود حالياً <span className="text-cream font-bold">{gap.currentEmiratis}</span>، والمتبقي <span className="text-red-400 font-bold">{gap.additionalNeeded}</span> مواطنين.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
