'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Circle, Rocket } from 'lucide-react'
import { generateActionPlan, type EmiratisationProfile } from '@/lib/emiratisation-engine'

interface Props { profile: EmiratisationProfile }

export function NafisActionPlan({ profile }: Props) {
    const steps = generateActionPlan(profile)

    return (
        <Card className="bg-navy-light border-gold/10">
            <CardHeader>
                <CardTitle className="text-cream text-lg flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-gold" />
                    خطة عمل نافس
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    {steps.map((step, index) => (
                        <div key={step.order} className="flex gap-4 relative">
                            {/* Timeline line */}
                            {index < steps.length - 1 && (
                                <div className="absolute right-[15px] top-8 bottom-0 w-px bg-gold/10" />
                            )}
                            {/* Dot */}
                            <div className="shrink-0 mt-1.5">
                                <Circle className="h-4 w-4 text-gold/30" />
                            </div>
                            {/* Content */}
                            <div className="pb-6 flex-1">
                                <div className="flex items-start justify-between">
                                    <h4 className="text-sm text-cream font-medium">{step.title}</h4>
                                    {step.deadline && (
                                        <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-full shrink-0">
                                            {step.deadline}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-cream-dark/50 mt-1">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
