'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
    FileSignature, Loader2, Eye, Send, Check, X,
    Clock, FileText, AlertTriangle, ArrowRight
} from 'lucide-react'

interface Contract {
    id: string
    status: string
    salary: number
    currency: string
    start_date: string
    benefits: string
    candidate_name: string
    job_title: string
    template_name: string
    rendered_html?: string
    sent_at: string | null
    viewed_at: string | null
    signed_at: string | null
    declined_at: string | null
    decline_reason: string | null
    expires_at: string | null
    created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: 'مسودة', color: 'bg-gray-500/10 text-gray-400', icon: FileText },
    sent: { label: 'مُرسل', color: 'bg-blue-500/10 text-blue-400', icon: Send },
    viewed: { label: 'تم الاطلاع', color: 'bg-purple-500/10 text-purple-400', icon: Eye },
    signed: { label: 'موقّع', color: 'bg-green-500/10 text-green-400', icon: Check },
    declined: { label: 'مرفوض', color: 'bg-red-500/10 text-red-400', icon: X },
    expired: { label: 'منتهي', color: 'bg-yellow-500/10 text-yellow-400', icon: AlertTriangle },
}

export default function ContractsTrackPage() {
    const [contracts, setContracts] = useState<Contract[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')
    const [previewContract, setPreviewContract] = useState<Contract | null>(null)

    useEffect(() => { loadContracts(activeTab) }, [activeTab])

    const loadContracts = async (status: string) => {
        setLoading(true)
        const res = await fetch(`/api/contracts/track?status=${status}`)
        const data = await res.json()
        setContracts(data.contracts || [])
        setLoading(false)
    }

    const updateStatus = async (id: string, status: string) => {
        const res = await fetch('/api/contracts/track', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
        })
        if (res.ok) {
            toast.success(`تم تحديث الحالة إلى: ${STATUS_CONFIG[status]?.label}`)
            loadContracts(activeTab)
        } else {
            toast.error('فشل تحديث الحالة')
        }
    }

    const statusCounts = contracts.reduce((acc: Record<string, number>, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1
        return acc
    }, {})

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-cream">تتبع العقود</h1>
                <p className="text-cream-dark/50 mt-1">متابعة حالة العقود المرسلة للمرشحين</p>
            </div>

            {/* Status Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon
                    return (
                        <Card key={key} className={`bg-navy-light border-gold/10 cursor-pointer transition-all ${activeTab === key ? 'ring-1 ring-gold/30' : ''}`}
                            onClick={() => setActiveTab(key)}>
                            <CardContent className="p-3 text-center">
                                <Icon className={`h-5 w-5 mx-auto mb-1 ${cfg.color.split(' ')[1]}`} />
                                <p className="text-lg font-bold text-cream">{statusCounts[key] || 0}</p>
                                <p className="text-[10px] text-cream-dark/40">{cfg.label}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Filter Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-navy-light border border-gold/10">
                    <TabsTrigger value="all" className="data-[state=active]:bg-gold data-[state=active]:text-navy text-cream-dark/50 text-xs">
                        الكل ({contracts.length})
                    </TabsTrigger>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <TabsTrigger key={key} value={key}
                            className="data-[state=active]:bg-gold data-[state=active]:text-navy text-cream-dark/50 text-xs">
                            {cfg.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Contracts List */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-gold" />
                </div>
            ) : contracts.length === 0 ? (
                <Card className="bg-navy-light border-gold/10">
                    <CardContent className="p-12 text-center">
                        <FileSignature className="h-12 w-12 text-gold/20 mx-auto mb-4" />
                        <h3 className="text-cream text-lg font-medium mb-2">لا توجد عقود</h3>
                        <p className="text-cream-dark/40 text-sm">يمكنك إنشاء عقد من صفحة المتقدمين عند اختيار مرشح للتوظيف</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {contracts.map(contract => {
                        const cfg = STATUS_CONFIG[contract.status] || STATUS_CONFIG.draft
                        const StatusIcon = cfg.icon
                        return (
                            <Card key={contract.id} className="bg-navy-light border-gold/10 hover:border-gold/20 transition-colors">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-lg ${cfg.color.split(' ')[0]}`}>
                                                <StatusIcon className={`h-5 w-5 ${cfg.color.split(' ')[1]}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-cream font-medium">{contract.candidate_name}</h3>
                                                <p className="text-cream-dark/50 text-sm">{contract.job_title}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs text-gold">{contract.salary.toLocaleString()} {contract.currency}</span>
                                                    <span className="text-xs text-cream-dark/30">•</span>
                                                    <span className="text-xs text-cream-dark/40">المباشرة: {contract.start_date}</span>
                                                    <span className="text-xs text-cream-dark/30">•</span>
                                                    <span className="text-xs text-cream-dark/40">{contract.template_name}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Badge className={`${cfg.color} border-0 text-xs`}>
                                                {cfg.label}
                                            </Badge>

                                            {/* Action buttons based on status */}
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => setPreviewContract(contract)}
                                                    className="text-cream-dark/40 hover:text-cream h-8 w-8 p-0">
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                {contract.status === 'draft' && (
                                                    <Button size="sm" onClick={() => updateStatus(contract.id, 'sent')}
                                                        className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 h-8 text-xs">
                                                        <Send className="h-3 w-3 me-1" />إرسال
                                                    </Button>
                                                )}

                                                {contract.status === 'sent' && (
                                                    <Button size="sm" onClick={() => updateStatus(contract.id, 'viewed')}
                                                        className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 h-8 text-xs">
                                                        <Eye className="h-3 w-3 me-1" />تم الاطلاع
                                                    </Button>
                                                )}

                                                {(contract.status === 'viewed' || contract.status === 'sent') && (
                                                    <>
                                                        <Button size="sm" onClick={() => updateStatus(contract.id, 'signed')}
                                                            className="bg-green-500/10 text-green-400 hover:bg-green-500/20 h-8 text-xs">
                                                            <Check className="h-3 w-3 me-1" />توقيع
                                                        </Button>
                                                        <Button size="sm" onClick={() => updateStatus(contract.id, 'declined')}
                                                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 h-8 text-xs">
                                                            <X className="h-3 w-3 me-1" />رفض
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gold/5">
                                        <div className="flex items-center gap-1.5 text-[10px]">
                                            <Clock className="h-3 w-3 text-cream-dark/30" />
                                            <span className="text-cream-dark/40">أُنشئ: {new Date(contract.created_at).toLocaleDateString('ar-AE')}</span>
                                        </div>
                                        {contract.sent_at && (
                                            <>
                                                <ArrowRight className="h-3 w-3 text-cream-dark/20" />
                                                <span className="text-[10px] text-blue-400/70">أُرسل: {new Date(contract.sent_at).toLocaleDateString('ar-AE')}</span>
                                            </>
                                        )}
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
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Preview Dialog */}
            <Dialog open={!!previewContract} onOpenChange={() => setPreviewContract(null)}>
                <DialogContent className="bg-white max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900">
                            عقد — {previewContract?.candidate_name} — {previewContract?.job_title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="border rounded-lg p-6"
                        dangerouslySetInnerHTML={{ __html: previewContract?.rendered_html || '' }} />
                </DialogContent>
            </Dialog>
        </div>
    )
}
