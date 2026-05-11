'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    FileSignature, Loader2, Eye, Send, Check, X,
    Clock, AlertTriangle, ArrowRight, FileText
} from 'lucide-react'

interface Contract {
    id: string
    status: string
    salary: number
    currency: string
    start_date: string
    company_name: string
    job_title: string
    template_name: string
    sent_at: string | null
    signed_at: string | null
    declined_at: string | null
    expires_at: string | null
    created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    sent: { label: 'بانتظار المراجعة', color: 'bg-blue-500/10 text-blue-400', icon: Send },
    viewed: { label: 'تمت المراجعة', color: 'bg-purple-500/10 text-purple-400', icon: Eye },
    signed: { label: 'تم التوقيع', color: 'bg-green-500/10 text-green-400', icon: Check },
    declined: { label: 'مرفوض', color: 'bg-red-500/10 text-red-400', icon: X },
    expired: { label: 'منتهي الصلاحية', color: 'bg-yellow-500/10 text-yellow-400', icon: AlertTriangle },
}

export default function CandidateContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadContracts()
    }, [])

    const loadContracts = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/contracts/candidate')
            const data = await res.json()
            setContracts(data.contracts || [])
        } catch {
            setContracts([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-cream">العقود</h1>
                <p className="text-cream-dark/50 mt-1">عرض ومراجعة عقود العمل المقدمة لك</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon
                    const count = contracts.filter(c => c.status === key).length
                    return (
                        <Card key={key} className="bg-navy-light border-gold/10">
                            <CardContent className="p-3 text-center">
                                <Icon className={`h-5 w-5 mx-auto mb-1 ${cfg.color.split(' ')[1]}`} />
                                <p className="text-lg font-bold text-cream">{count}</p>
                                <p className="text-[10px] text-cream-dark/40">{cfg.label}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Contracts List */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-gold" />
                </div>
            ) : contracts.length === 0 ? (
                <Card className="bg-navy-light border-gold/10">
                    <CardContent className="p-12 text-center">
                        <FileSignature className="h-12 w-12 text-gold/20 mx-auto mb-4" />
                        <h3 className="text-cream text-lg font-medium mb-2">لا توجد عقود حالياً</h3>
                        <p className="text-cream-dark/40 text-sm">ستظهر العقود هنا عندما يرسل لك صاحب العمل عرضاً وظيفياً</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {contracts.map(contract => {
                        const cfg = STATUS_CONFIG[contract.status] || STATUS_CONFIG.sent
                        const StatusIcon = cfg.icon
                        const needsAction = contract.status === 'sent' || contract.status === 'viewed'

                        return (
                            <Link key={contract.id} href={`/candidate/contracts/${contract.id}`}>
                                <Card className={`bg-navy-light border-gold/10 hover:border-gold/25 transition-all cursor-pointer ${needsAction ? 'ring-1 ring-gold/20' : ''}`}>
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-lg ${cfg.color.split(' ')[0]}`}>
                                                    <StatusIcon className={`h-5 w-5 ${cfg.color.split(' ')[1]}`} />
                                                </div>
                                                <div>
                                                    <h3 className="text-cream font-medium">{contract.job_title}</h3>
                                                    <p className="text-cream-dark/50 text-sm">{contract.company_name}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs text-gold">{contract.salary.toLocaleString()} {contract.currency}</span>
                                                        <span className="text-xs text-cream-dark/30">•</span>
                                                        <span className="text-xs text-cream-dark/40">المباشرة: {contract.start_date}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Badge className={`${cfg.color} border-0 text-xs`}>
                                                    {cfg.label}
                                                </Badge>
                                                {needsAction && (
                                                    <Badge className="bg-gold/10 text-gold border-0 text-xs animate-pulse">
                                                        يحتاج إجراء
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gold/5">
                                            <div className="flex items-center gap-1.5 text-[10px]">
                                                <Clock className="h-3 w-3 text-cream-dark/30" />
                                                <span className="text-cream-dark/40">أُرسل: {contract.sent_at ? new Date(contract.sent_at).toLocaleDateString('ar-AE') : '-'}</span>
                                            </div>
                                            {contract.signed_at && (
                                                <>
                                                    <ArrowRight className="h-3 w-3 text-cream-dark/20" />
                                                    <span className="text-[10px] text-green-400/70">وُقّع: {new Date(contract.signed_at).toLocaleDateString('ar-AE')}</span>
                                                </>
                                            )}
                                            {contract.declined_at && (
                                                <>
                                                    <ArrowRight className="h-3 w-3 text-cream-dark/20" />
                                                    <span className="text-[10px] text-red-400/70">رُفض: {new Date(contract.declined_at).toLocaleDateString('ar-AE')}</span>
                                                </>
                                            )}
                                            {contract.expires_at && !contract.signed_at && !contract.declined_at && (
                                                <>
                                                    <ArrowRight className="h-3 w-3 text-cream-dark/20" />
                                                    <span className="text-[10px] text-yellow-400/70">ينتهي: {new Date(contract.expires_at).toLocaleDateString('ar-AE')}</span>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
