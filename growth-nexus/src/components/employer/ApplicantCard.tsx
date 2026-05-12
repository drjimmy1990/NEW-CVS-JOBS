'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import {
    Mail, FileText, ArrowLeft, ChevronDown, Loader2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

const STATUSES = [
    { id: 'applied', label: 'لم التقديم' },
    { id: 'reviewing', label: 'قيد المراجعة' },
    { id: 'shortlisted', label: 'القائمة المختصرة' },
    { id: 'interview', label: 'مقابلة' },
    { id: 'offer', label: 'عرض وظيفي' },
    { id: 'hired', label: 'تم التعيين' },
    { id: 'rejected', label: 'مرفوض' },
]

type ApplicantCardProps = {
    applicationId: string
    candidateId: string
    candidateName: string
    jobTitle: string
    date: string
    currentStatus: string
    cvUrl?: string | null
}

export function ApplicantCard({
    applicationId,
    candidateId,
    candidateName,
    jobTitle,
    date,
    currentStatus,
    cvUrl,
}: ApplicantCardProps) {
    const [showMoveMenu, setShowMoveMenu] = useState(false)
    const [moving, setMoving] = useState(false)
    const [startingChat, setStartingChat] = useState(false)
    const router = useRouter()

    // Offer generation state
    const [offerModalOpen, setOfferModalOpen] = useState(false)
    const [offerSalary, setOfferSalary] = useState('')
    const [offerStartDate, setOfferStartDate] = useState('')
    const [offerTemplate, setOfferTemplate] = useState('')
    const [templates, setTemplates] = useState<any[]>([])
    const [generatingOffer, setGeneratingOffer] = useState(false)

    // Load templates when offer modal opens
    useEffect(() => {
        if (offerModalOpen && templates.length === 0) {
            const loadTemplates = async () => {
                const supabase = createClient()
                const { data } = await supabase.from('contract_templates').select('*')
                if (data) {
                    setTemplates(data)
                    if (data.length > 0) setOfferTemplate(data[0].id)
                }
            }
            loadTemplates()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [offerModalOpen])

    const moveToStatus = async (newStatus: string) => {
        // Intercept offer — open contract generation modal
        if (newStatus === 'offer') {
            setShowMoveMenu(false)
            setOfferModalOpen(true)
            return
        }

        setMoving(true)
        const supabase = createClient()
        const { error } = await supabase
            .from('applications')
            .update({ status: newStatus })
            .eq('id', applicationId)

        if (!error) {
            toast.success('تم تحديث الحالة')
            router.refresh()
        } else {
            toast.error('فشل تحديث الحالة')
        }
        setMoving(false)
        setShowMoveMenu(false)
    }

    const handleOfferSubmit = async () => {
        if (!offerSalary || !offerStartDate || !offerTemplate) {
            toast.error('يرجى تعبئة جميع الحقول')
            return
        }
        setGeneratingOffer(true)
        try {
            const res = await fetch('/api/contracts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId,
                    templateId: offerTemplate,
                    salary: offerSalary,
                    startDate: offerStartDate,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'فشل توليد العقد')

            toast.success('تم إنشاء العقد وتحديث الحالة بنجاح')
            setOfferModalOpen(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setGeneratingOffer(false)
        }
    }

    const startChat = async () => {
        setStartingChat(true)
        try {
            const res = await fetch('/api/conversations/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otherUserId: candidateId }),
            })
            const data = await res.json()
            if (data.conversationId) {
                router.push(`/employer/messages?chat=${data.conversationId}`)
            }
        } catch (e) {
            console.error('Failed to start chat', e)
        }
        setStartingChat(false)
    }

    // Status badge color
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            applied: 'bg-cream-dark/20 text-cream-dark/60',
            reviewing: 'bg-blue-500/15 text-blue-400',
            shortlisted: 'bg-emerald-500/15 text-emerald-400',
            interview: 'bg-purple-500/15 text-purple-400',
            offer: 'bg-gold/15 text-gold',
            hired: 'bg-green-500/15 text-green-400',
            rejected: 'bg-red-500/15 text-red-400',
        }
        return colors[status] || 'bg-cream-dark/15 text-cream-dark/50'
    }

    return (
        <>
        <Card className="bg-navy-light border-gold/10 hover:border-gold/20 transition-all hover:shadow-lg hover:shadow-navy/50 group">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/20 flex items-center justify-center text-cream font-bold text-sm shrink-0">
                            {candidateName.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-cream">{candidateName}</p>
                            <p className="text-xs text-cream-dark/40">{jobTitle}</p>
                        </div>
                    </div>
                </div>

                {/* Status badge */}
                <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(currentStatus)}`}>
                    {STATUSES.find(s => s.id === currentStatus)?.label || currentStatus}
                </div>

                <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-cream-dark/40">{date}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1.5 mt-3 pt-3 border-t border-gold/10">
                    {/* CV Button */}
                    {cvUrl ? (
                        <a
                            href={cvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1 text-xs text-cream-dark/60 hover:text-cream py-1.5 rounded-md hover:bg-navy-lighter transition-colors"
                        >
                            <FileText className="h-3 w-3" /> سيرة
                        </a>
                    ) : (
                        <button
                            disabled
                            className="flex-1 flex items-center justify-center gap-1 text-xs text-cream-dark/20 py-1.5 rounded-md cursor-not-allowed"
                        >
                            <FileText className="h-3 w-3" /> لا توجد سيرة
                        </button>
                    )}

                    {/* Message Button */}
                    <button
                        onClick={startChat}
                        disabled={startingChat}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-cream-dark/60 hover:text-cream py-1.5 rounded-md hover:bg-navy-lighter transition-colors"
                    >
                        <Mail className="h-3 w-3" />
                        {startingChat ? '...' : 'رسالة'}
                    </button>

                    {/* Move Button — dropdown */}
                    <div className="relative flex-1">
                        <button
                            onClick={() => setShowMoveMenu(!showMoveMenu)}
                            disabled={moving}
                            className="w-full flex items-center justify-center gap-1 text-xs text-gold hover:text-gold-light py-1.5 rounded-md hover:bg-gold/10 transition-colors"
                        >
                            <ArrowLeft className="h-3 w-3" />
                            {moving ? '...' : 'نقل'}
                            <ChevronDown className="h-3 w-3" />
                        </button>

                        {showMoveMenu && (
                            <div className="absolute bottom-full mb-1 start-0 end-0 bg-navy-light border border-gold/20 rounded-lg shadow-xl z-50 overflow-hidden min-w-[140px]">
                                {STATUSES
                                    .filter(s => s.id !== currentStatus)
                                    .map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => moveToStatus(s.id)}
                                            className="w-full px-3 py-2 text-xs text-cream-dark/70 hover:text-cream hover:bg-navy-lighter text-right transition-colors"
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Offer Generation Dialog */}
        <Dialog open={offerModalOpen} onOpenChange={(v) => { if (!v && !generatingOffer) { setOfferModalOpen(false) } }}>
            <DialogContent className="bg-navy-light border-gold/10 text-cream" dir="rtl">
                <DialogHeader>
                    <DialogTitle>توليد عرض وظيفي</DialogTitle>
                    <DialogDescription className="text-cream-dark/50">
                        إنشاء عقد عمل لـ &quot;{candidateName}&quot; — {jobTitle}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label className="text-cream-dark">الراتب (بالدرهم) *</Label>
                        <Input
                            type="number"
                            value={offerSalary}
                            onChange={(e) => setOfferSalary(e.target.value)}
                            placeholder="مثال: 15000"
                            className="bg-navy-lighter border-gold/10 text-cream"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-cream-dark">تاريخ المباشرة *</Label>
                        <Input
                            type="date"
                            value={offerStartDate}
                            onChange={(e) => setOfferStartDate(e.target.value)}
                            className="bg-navy-lighter border-gold/10 text-cream block text-left"
                            style={{ direction: 'ltr' }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-cream-dark">قالب العقد *</Label>
                        <Select value={offerTemplate} onValueChange={setOfferTemplate}>
                            <SelectTrigger className="bg-navy-lighter border-gold/10 text-cream">
                                <SelectValue placeholder="اختر القالب" />
                            </SelectTrigger>
                            <SelectContent className="bg-navy-light border-gold/10">
                                {templates.map(t => (
                                    <SelectItem key={t.id} value={t.id} className="text-cream">{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="flex-row-reverse gap-2 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => setOfferModalOpen(false)}
                        className="border-gold/10 text-cream-dark"
                        disabled={generatingOffer}
                    >
                        إلغاء
                    </Button>
                    <Button
                        onClick={handleOfferSubmit}
                        disabled={generatingOffer || !offerSalary || !offerStartDate}
                        className="bg-gold hover:bg-gold-dark text-navy font-bold"
                    >
                        {generatingOffer ? (
                            <><Loader2 className="me-2 h-4 w-4 animate-spin" /> جاري التوليد...</>
                        ) : (
                            'إنشاء العقد'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}
