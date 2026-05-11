'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { getComplianceStatus, type EmiratisationProfile } from '@/lib/emiratisation-engine'

interface Props {
    profile: EmiratisationProfile
}

const statusConfig = {
    compliant: { icon: CheckCircle, gradient: 'from-emerald-500/15 to-emerald-500/5', border: 'border-emerald-500/20', iconColor: 'text-emerald-400', textColor: 'text-emerald-300' },
    near_compliant: { icon: Clock, gradient: 'from-amber-500/15 to-amber-500/5', border: 'border-amber-500/20', iconColor: 'text-amber-400', textColor: 'text-amber-300' },
    at_risk: { icon: AlertTriangle, gradient: 'from-orange-500/15 to-orange-500/5', border: 'border-orange-500/20', iconColor: 'text-orange-400', textColor: 'text-orange-300' },
    non_compliant: { icon: XCircle, gradient: 'from-red-500/15 to-red-500/5', border: 'border-red-500/20', iconColor: 'text-red-400', textColor: 'text-red-300' },
}

export function ComplianceStatusCard({ profile }: Props) {
    const compliance = getComplianceStatus(profile)
    const config = statusConfig[compliance.status]
    const Icon = config.icon

    return (
        <Card className={`bg-gradient-to-r ${config.gradient} ${config.border} border`}>
            <CardContent className="p-6 flex items-start gap-4">
                <div className="p-3 bg-navy/30 rounded-xl">
                    <Icon className={`h-8 w-8 ${config.iconColor}`} />
                </div>
                <div>
                    <h3 className={`text-xl font-bold ${config.textColor}`}>{compliance.label}</h3>
                    <p className="text-cream-dark/60 text-sm mt-1">{compliance.description}</p>
                </div>
            </CardContent>
        </Card>
    )
}
