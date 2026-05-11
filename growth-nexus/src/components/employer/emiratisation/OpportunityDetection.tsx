'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, CheckCircle, GraduationCap, Clock, Wrench } from 'lucide-react'
import { detectEmiratisableOpportunities, type SuitableJob } from '@/lib/emiratisation-engine'

interface Props { jobTitles: string[] }

const categoryIcons = {
    easy_fill: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    fresh_graduates: { icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    minimal_experience: { icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    needs_training: { icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-500/10' },
}

export function OpportunityDetection({ jobTitles }: Props) {
    const opportunities = detectEmiratisableOpportunities(jobTitles)

    return (
        <Card className="bg-navy-light border-gold/10">
            <CardHeader>
                <CardTitle className="text-cream text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-gold" />
                    فرص التوطين في وظائفك
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {opportunities.length === 0 ? (
                    <p className="text-cream-dark/40 text-center py-6 text-sm">
                        لا توجد وظائف نشطة حالياً قابلة للتحليل. انشر وظائف لرؤية فرص التوطين.
                    </p>
                ) : (
                    opportunities.map((opp, i) => {
                        const config = categoryIcons[opp.suitability.category]
                        const Icon = config.icon
                        return (
                            <div key={i} className="p-4 rounded-lg bg-navy/50 border border-gold/5 hover:border-gold/15 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${config.bg}`}>
                                        <Icon className={`h-4 w-4 ${config.color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-cream text-sm font-medium">{opp.title}</h4>
                                            <Badge className={`${config.bg} ${config.color} border-0 text-[10px]`}>{opp.suitability.categoryLabel}</Badge>
                                        </div>
                                        <p className="text-xs text-cream-dark/50">{opp.suitability.reason}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </CardContent>
        </Card>
    )
}
