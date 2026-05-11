'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, AlertTriangle, Info, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { generateAlerts, type EmiratisationProfile, type Alert } from '@/lib/emiratisation-engine'

interface Props { profile: EmiratisationProfile }

const severityConfig = {
    info: { icon: Info, bg: 'bg-blue-500/5', border: 'border-blue-500/10', iconColor: 'text-blue-400', titleColor: 'text-blue-300' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-500/5', border: 'border-amber-500/10', iconColor: 'text-amber-400', titleColor: 'text-amber-300' },
    danger: { icon: AlertTriangle, bg: 'bg-red-500/5', border: 'border-red-500/10', iconColor: 'text-red-400', titleColor: 'text-red-300' },
}

export function AlertsPanel({ profile }: Props) {
    const alerts = generateAlerts(profile)

    return (
        <Card className="bg-navy-light border-gold/10">
            <CardHeader>
                <CardTitle className="text-cream text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-gold" />
                    التنبيهات
                    {alerts.length > 0 && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{alerts.length}</span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {alerts.length === 0 ? (
                    <p className="text-cream-dark/40 text-center py-6">لا توجد تنبيهات حالياً ✓</p>
                ) : (
                    alerts.map((alert: Alert) => {
                        const config = severityConfig[alert.severity]
                        const Icon = config.icon
                        return (
                            <div key={alert.id} className={`${config.bg} ${config.border} border rounded-lg p-4`}>
                                <div className="flex items-start gap-3">
                                    <Icon className={`h-5 w-5 ${config.iconColor} shrink-0 mt-0.5`} />
                                    <div className="flex-1">
                                        <h4 className={`text-sm font-medium ${config.titleColor}`}>{alert.title}</h4>
                                        <p className="text-xs text-cream-dark/50 mt-1">{alert.description}</p>
                                        {alert.action && (
                                            <Link href={alert.action.href}>
                                                <Button variant="ghost" size="sm" className="mt-2 text-xs text-gold hover:text-gold-light p-0 h-auto">
                                                    {alert.action.label} <ArrowLeft className="ms-1 h-3 w-3" />
                                                </Button>
                                            </Link>
                                        )}
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
