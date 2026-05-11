'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Building, Users, Factory } from 'lucide-react'
import { classifyCompany, isTargetedSector, getRequiredRate, type CompanyCategory } from '@/lib/emiratisation-engine'

interface Props {
    totalEmployees: number
    sector: string | null
}

const categoryConfig: Record<CompanyCategory, { icon: typeof Building; label: string; color: string; bg: string }> = {
    large_50_plus: { icon: Factory, label: '50 موظف فأكثر', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/20' },
    medium_20_49: { icon: Users, label: '20 إلى 49 موظف', color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/20' },
    small_under_20: { icon: Building, label: 'أقل من 20 موظف', color: 'text-cream-dark/60', bg: 'bg-navy-lighter border-gold/10' },
}

export function ClassificationBanner({ totalEmployees, sector }: Props) {
    if (totalEmployees <= 0) return null

    const category = classifyCompany(totalEmployees)
    const config = categoryConfig[category]
    const rate = getRequiredRate(category)
    const Icon = config.icon
    const isTarget = isTargetedSector(sector)

    return (
        <Card className={`${config.bg} border`}>
            <CardContent className="p-5">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-navy/30`}>
                        <Icon className={`h-6 w-6 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-cream font-semibold">تصنيف الشركة</h3>
                            <Badge className={`${config.bg} ${config.color} border-0`}>{config.label}</Badge>
                        </div>
                        <p className="text-cream-dark/60 text-sm">{rate.description}</p>

                        {category === 'medium_20_49' && (
                            <div className="mt-3 p-3 rounded-lg bg-navy/30 border border-gold/5">
                                <p className="text-xs text-cream-dark/50">
                                    <span className="font-medium text-cream-dark/80">القطاع: </span>
                                    {sector || 'غير محدد'}
                                    {' — '}
                                    {isTarget ? (
                                        <Badge className="bg-amber-500/15 text-amber-400 border-0 text-[10px]">ضمن القطاعات المستهدفة الـ14</Badge>
                                    ) : (
                                        <Badge className="bg-navy-lighter text-cream-dark/40 border-0 text-[10px]">خارج القطاعات المستهدفة</Badge>
                                    )}
                                </p>
                            </div>
                        )}

                        {category === 'small_under_20' && (
                            <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                <p className="text-xs text-amber-300/70">
                                    قد لا تكون الشركة ضمن الفئة الإلزامية، ولكن يمكن متابعة التوطين اختيارياً.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
