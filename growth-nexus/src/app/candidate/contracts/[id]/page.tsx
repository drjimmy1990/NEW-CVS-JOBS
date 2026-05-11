'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
    Loader2, Check, X, Eye, Send, AlertTriangle,
    ArrowRight, Download, Building2, Banknote,
    CalendarDays, Gift, FileSignature, ChevronRight
} from 'lucide-react'

interface ContractDetail {
    id: string
    status: string
    salary: number
    currency: string
    start_date: string
    benefits: string
    rendered_html: string
    company_name: string
    job_title: string
    template_name: string
    sent_at: string | null
    viewed_at: string | null
    signed_at: string | null
    declined_at: string | null
    expires_at: string | null
    decline_reason: string | null
    created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    sent: { label: 'بانتظار المراجعة', color: 'bg-blue-500/10 text-blue-400', icon: Send },
    viewed: { label: 'تمت المراجعة', color: 'bg-purple-500/10 text-purple-400', icon: Eye },
    signed: { label: 'تم التوقيع ✓', color: 'bg-green-500/10 text-green-400', icon: Check },
    declined: { label: 'مرفوض', color: 'bg-red-500/10 text-red-400', icon: X },
    expired: { label: 'منتهي الصلاحية', color: 'bg-yellow-500/10 text-yellow-400', icon: AlertTriangle },
}

export default function CandidateContractViewPage() {
    const { id } = useParams()
    const router = useRouter()
    const [contract, setContract] = useState<ContractDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [acting, setActing] = useState(false)

    // Sign dialog
    const [signDialogOpen, setSignDialogOpen] = useState(false)
    const [agreeChecked, setAgreeChecked] = useState(false)

    // Decline dialog
    const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
    const [declineReason, setDeclineReason] = useState('')

    useEffect(() => {
        loadContract()
    }, [id])

    const loadContract = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/contracts/candidate/${id}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setContract(data.contract)

            // Auto-mark as viewed if status is 'sent'
            if (data.contract?.status === 'sent') {
                await fetch(`/api/contracts/candidate/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'viewed' })
                })
                setContract({ ...data.contract, status: 'viewed', viewed_at: new Date().toISOString() })
            }
        } catch (err: any) {
            toast.error(err.message || 'فشل تحميل العقد')
        } finally {
            setLoading(false)
        }
    }

    const handleSign = async () => {
        if (!agreeChecked) return
        setActing(true)
        try {
            const res = await fetch(`/api/contracts/candidate/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'signed' })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success('🎉 تم توقيع العقد بنجاح! مبارك عليك الوظيفة الجديدة')
            setSignDialogOpen(false)
            setContract(prev => prev ? { ...prev, status: 'signed', signed_at: new Date().toISOString() } : null)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setActing(false)
        }
    }

    const handleDecline = async () => {
        if (!declineReason.trim()) {
            toast.error('يرجى ذكر سبب الرفض')
            return
        }
        setActing(true)
        try {
            const res = await fetch(`/api/contracts/candidate/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'declined', decline_reason: declineReason })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success('تم رفض العقد')
            setDeclineDialogOpen(false)
            setContract(prev => prev ? { ...prev, status: 'declined', declined_at: new Date().toISOString() } : null)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setActing(false)
        }
    }

    const handleDownloadPdf = async () => {
        try {
            const res = await fetch(`/api/contracts/pdf/${id}`)
            if (!res.ok) throw new Error('فشل تحميل PDF')
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `contract-${contract?.job_title || 'document'}.pdf`
            a.click()
            URL.revokeObjectURL(url)
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-gold" />
            </div>
        )
    }

    if (!contract) {
        return (
            <div className="text-center py-24" dir="rtl">
                <FileSignature className="h-12 w-12 text-gold/20 mx-auto mb-4" />
                <p className="text-cream-dark/50">العقد غير موجود</p>
            </div>
        )
    }

    const cfg = STATUS_CONFIG[contract.status] || STATUS_CONFIG.sent
    const StatusIcon = cfg.icon
    const canAct = contract.status === 'viewed'
    const isExpired = contract.expires_at && new Date(contract.expires_at) < new Date() && !['signed', 'declined'].includes(contract.status)

    return (
        <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-cream-dark/40">
                <button onClick={() => router.push('/candidate/contracts')} className="hover:text-cream transition-colors">
                    العقود
                </button>
                <ChevronRight className="h-3 w-3 rotate-180" />
                <span className="text-cream">{contract.job_title}</span>
            </div>

            {/* Status Banner */}
            {contract.status === 'signed' && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/20">
                        <Check className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                        <p className="text-green-400 font-medium">🎉 مبارك! تم توقيع العقد بنجاح</p>
                        <p className="text-green-400/60 text-sm">تاريخ التوقيع: {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString('ar-AE') : '-'}</p>
                    </div>
                </div>
            )}

            {contract.status === 'declined' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 rounded-full bg-red-500/20">
                        <X className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                        <p className="text-red-400 font-medium">تم رفض هذا العقد</p>
                        {contract.decline_reason && (
                            <p className="text-red-400/60 text-sm">السبب: {contract.decline_reason}</p>
                        )}
                    </div>
                </div>
            )}

            {isExpired && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-400" />
                    <p className="text-yellow-400 font-medium">هذا العقد منتهي الصلاحية</p>
                </div>
            )}

            {/* Contract Header Card */}
            <Card className="bg-navy-light border-gold/10">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-3">
                            <div>
                                <h1 className="text-2xl font-bold text-cream">{contract.job_title}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <Building2 className="h-4 w-4 text-cream-dark/40" />
                                    <span className="text-cream-dark/60">{contract.company_name}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 bg-navy/50 px-3 py-2 rounded-lg">
                                    <Banknote className="h-4 w-4 text-gold" />
                                    <span className="text-cream text-sm font-medium">{contract.salary.toLocaleString()} {contract.currency}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-navy/50 px-3 py-2 rounded-lg">
                                    <CalendarDays className="h-4 w-4 text-gold" />
                                    <span className="text-cream text-sm">المباشرة: {contract.start_date}</span>
                                </div>
                                {contract.benefits && (
                                    <div className="flex items-center gap-2 bg-navy/50 px-3 py-2 rounded-lg">
                                        <Gift className="h-4 w-4 text-gold" />
                                        <span className="text-cream text-sm">{contract.benefits}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Badge className={`${cfg.color} border-0 text-sm px-3 py-1`}>
                            <StatusIcon className="h-4 w-4 me-1" />
                            {cfg.label}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Contract Document */}
            <Card className="bg-white border-gold/10 overflow-hidden">
                <CardHeader className="bg-gray-50 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-gray-900 text-base flex items-center gap-2">
                            <FileSignature className="h-5 w-5" />
                            نص العقد
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadPdf}
                            className="text-gray-700 border-gray-300 hover:bg-gray-100"
                        >
                            <Download className="h-4 w-4 me-1" />
                            تحميل PDF
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div
                        className="prose prose-sm max-w-none"
                        dir="rtl"
                        dangerouslySetInnerHTML={{ __html: contract.rendered_html || '' }}
                    />
                </CardContent>
            </Card>

            {/* Action Buttons */}
            {canAct && !isExpired && (
                <Card className="bg-navy-light border-gold/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-cream font-medium">هل تقبل هذا العقد؟</h3>
                                <p className="text-cream-dark/40 text-sm mt-1">يرجى مراجعة العقد بالكامل قبل اتخاذ القرار</p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setDeclineDialogOpen(true)}
                                    variant="outline"
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                >
                                    <X className="h-4 w-4 me-2" />
                                    رفض العقد
                                </Button>
                                <Button
                                    onClick={() => setSignDialogOpen(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Check className="h-4 w-4 me-2" />
                                    قبول والتوقيع
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Sign Confirmation Dialog */}
            <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
                <DialogContent className="bg-navy-light border-gold/10 sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-cream text-xl">تأكيد التوقيع</DialogTitle>
                        <DialogDescription className="text-cream-dark/50">
                            بتوقيعك على هذا العقد، فإنك توافق على جميع الشروط والأحكام الواردة فيه
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-navy/50 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between text-cream-dark/60">
                                <span>الوظيفة:</span>
                                <span className="text-cream font-medium">{contract.job_title}</span>
                            </div>
                            <div className="flex justify-between text-cream-dark/60">
                                <span>الشركة:</span>
                                <span className="text-cream font-medium">{contract.company_name}</span>
                            </div>
                            <div className="flex justify-between text-cream-dark/60">
                                <span>الراتب:</span>
                                <span className="text-gold font-medium">{contract.salary.toLocaleString()} {contract.currency}</span>
                            </div>
                            <div className="flex justify-between text-cream-dark/60">
                                <span>تاريخ المباشرة:</span>
                                <span className="text-cream font-medium">{contract.start_date}</span>
                            </div>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-gold/10 hover:border-gold/20 transition-colors">
                            <input
                                type="checkbox"
                                checked={agreeChecked}
                                onChange={(e) => setAgreeChecked(e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-gold/30 accent-gold"
                            />
                            <span className="text-cream-dark/70 text-sm leading-relaxed">
                                أوافق على جميع الشروط والأحكام الواردة في العقد وأقر بأنني قرأت ووافقت على محتواه بالكامل
                            </span>
                        </label>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setSignDialogOpen(false)} className="text-cream-dark/50">
                            إلغاء
                        </Button>
                        <Button
                            onClick={handleSign}
                            disabled={!agreeChecked || acting}
                            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-40"
                        >
                            {acting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Check className="h-4 w-4 me-2" />}
                            أوافق وأوقّع
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Decline Dialog */}
            <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
                <DialogContent className="bg-navy-light border-gold/10 sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-cream text-xl">رفض العقد</DialogTitle>
                        <DialogDescription className="text-cream-dark/50">
                            يرجى ذكر سبب رفضك للعقد. هذا يساعد الشركة على تحسين عروضها المستقبلية
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Textarea
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            placeholder="مثال: الراتب غير مناسب / ظروف شخصية / حصلت على عرض أفضل..."
                            className="bg-navy border-gold/10 text-cream placeholder:text-cream-dark/30 min-h-[100px]"
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setDeclineDialogOpen(false)} className="text-cream-dark/50">
                            إلغاء
                        </Button>
                        <Button
                            onClick={handleDecline}
                            disabled={!declineReason.trim() || acting}
                            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
                        >
                            {acting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <X className="h-4 w-4 me-2" />}
                            تأكيد الرفض
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
