'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, FileText, Calendar, ExternalLink, ChevronDown, Filter, Search, AlertTriangle, Loader2 } from 'lucide-react'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { REJECTION_REASONS } from '@/lib/types'

const statusOptions = [
    { value: 'applied', label: 'تقدّم', color: 'bg-blue-500/20 text-blue-400' },
    { value: 'reviewing', label: 'قيد المراجعة', color: 'bg-yellow-500/20 text-yellow-400' },
    { value: 'shortlisted', label: 'قائمة مختصرة', color: 'bg-emerald-500/20 text-emerald-400' },
    { value: 'interview', label: 'مقابلة', color: 'bg-purple-500/20 text-purple-400' },
    { value: 'offer', label: 'عرض وظيفي', color: 'bg-gold/20 text-gold' },
    { value: 'hired', label: 'تم التعيين', color: 'bg-green-500/20 text-green-400' },
    { value: 'rejected', label: 'مرفوض', color: 'bg-red-500/20 text-red-400' },
]

interface ApplicantsListProps { initialApplicants: any[] }

export function ApplicantsList({ initialApplicants }: ApplicantsListProps) {
    const supabase = createClient()
    const [applicants, setApplicants] = useState(initialApplicants)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null)
    // Rejection flow
    const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false)
    const [rejectReasonOpen, setRejectReasonOpen] = useState(false)
    const [appToReject, setAppToReject] = useState<any | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [rejectNote, setRejectNote] = useState('')
    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    // Offer flow
    const [offerModalOpen, setOfferModalOpen] = useState(false)
    const [appToOffer, setAppToOffer] = useState<any | null>(null)
    const [offerSalary, setOfferSalary] = useState('')
    const [offerStartDate, setOfferStartDate] = useState('')
    const [offerTemplate, setOfferTemplate] = useState('')
    const [templates, setTemplates] = useState<any[]>([])
    const [generatingOffer, setGeneratingOffer] = useState(false)

    useEffect(() => {
        const loadTemplates = async () => {
            const { data } = await supabase.from('contract_templates').select('*')
            if (data) {
                setTemplates(data)
                if (data.length > 0) setOfferTemplate(data[0].id)
            }
        }
        loadTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleStatusChange = async (appId: string, newStatus: string) => {
        // Intercept rejection with confirmation
        if (newStatus === 'rejected') {
            const app = applicants.find(a => a.id === appId)
            setAppToReject(app)
            setRejectConfirmOpen(true)
            return
        }
        // Intercept offer to generate contract
        if (newStatus === 'offer') {
            const app = applicants.find(a => a.id === appId)
            setAppToOffer(app)
            setOfferModalOpen(true)
            return
        }

        setUpdatingId(appId)
        const { error } = await supabase.from('applications').update({ status: newStatus }).eq('id', appId)
        if (error) { toast.error('فشل تحديث الحالة') } else {
            toast.success('تم تحديث الحالة')
            setApplicants(applicants.map(a => a.id === appId ? { ...a, status: newStatus } : a))
        }
        setUpdatingId(null)
    }

    const handleRejectConfirm = () => {
        setRejectConfirmOpen(false)
        setRejectReasonOpen(true)
    }

    const handleRejectSubmit = async () => {
        if (!appToReject || !rejectReason) { toast.error('يرجى اختيار سبب الرفض'); return }
        setUpdatingId(appToReject.id)
        const reasonLabel = REJECTION_REASONS.find(r => r.value === rejectReason)?.label || rejectReason
        const fullReason = rejectNote ? `${reasonLabel}: ${rejectNote}` : reasonLabel

        const { error } = await supabase.from('applications')
            .update({ status: 'rejected', rejection_reason: fullReason }).eq('id', appToReject.id)

        if (error) { toast.error('فشل رفض المتقدم') } else {
            toast.success('تم رفض المتقدم وتسجيل السبب')
            setApplicants(applicants.map(a => a.id === appToReject.id ? { ...a, status: 'rejected', rejection_reason: fullReason } : a))
        }
        setRejectReasonOpen(false); setAppToReject(null); setRejectReason(''); setRejectNote(''); setUpdatingId(null)
    }

    const handleOfferSubmit = async () => {
        if (!appToOffer || !offerSalary || !offerStartDate || !offerTemplate) {
            toast.error('يرجى تعبئة جميع الحقول')
            return
        }
        setGeneratingOffer(true)
        try {
            const res = await fetch('/api/contracts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: appToOffer.id,
                    templateId: offerTemplate,
                    salary: offerSalary,
                    startDate: offerStartDate
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'فشل توليد العقد')
            
            toast.success('تم إنشاء العقد وتحديث الحالة بنجاح')
            setApplicants(applicants.map(a => a.id === appToOffer.id ? { ...a, status: 'offer' } : a))
            setOfferModalOpen(false)
            setAppToOffer(null)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setGeneratingOffer(false)
        }
    }

    const getStatusColor = (v: string) => statusOptions.find(s => s.value === v)?.color || 'bg-cream-dark/15 text-cream-dark/50'
    const getStatusLabel = (v: string) => statusOptions.find(s => s.value === v)?.label || v

    // Filtered applicants
    const filtered = applicants.filter(app => {
        if (filterStatus !== 'all' && app.status !== filterStatus) return false
        if (searchTerm) {
            const name = (app.profiles?.full_name || '').toLowerCase()
            const email = (app.profiles?.email || '').toLowerCase()
            return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase())
        }
        return true
    })

    const renderAiInsights = (parsedData: any) => {
        if (!parsedData) return null
        return (
            <div className="space-y-4 mt-4">
                <h4 className="text-sm font-semibold text-gold">رؤى الذكاء الاصطناعي</h4>
                {parsedData.yearsOfExperience !== undefined && (
                    <div className="text-sm"><span className="text-cream-dark/50">الخبرة:</span> <span className="text-cream font-medium">{parsedData.yearsOfExperience} سنة</span></div>
                )}
                {parsedData.education?.length > 0 && (
                    <div className="text-sm"><span className="text-cream-dark/50">التعليم:</span>
                        <ul className="list-disc list-inside text-cream mt-1">{parsedData.education.map((edu: any, i: number) => (
                            <li key={i}>{typeof edu === 'object' ? `${edu.degree} - ${edu.institution}` : edu}</li>
                        ))}</ul>
                    </div>
                )}
                {parsedData.skills?.length > 0 && (
                    <div className="text-sm"><span className="text-cream-dark/50 block mb-1">المهارات:</span>
                        <div className="flex flex-wrap gap-2">{parsedData.skills.map((s: string, i: number) => (
                            <Badge key={i} variant="secondary" className="bg-navy-lighter text-cream-dark">{s}</Badge>
                        ))}</div>
                    </div>
                )}
            </div>
        )
    }

    if (!applicants || applicants.length === 0) {
        return (
            <Card className="bg-navy-light border-gold/10"><CardContent className="py-16 text-center" dir="rtl">
                <User className="h-16 w-16 text-cream-dark/20 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-cream mb-2">لا يوجد متقدمون بعد</h3>
                <p className="text-cream-dark/40">عندما يتقدم المرشحون لهذه الوظيفة، سيظهرون هنا</p>
            </CardContent></Card>
        )
    }

    return (
        <>
            {/* Filter Bar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap" dir="rtl">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-dark/30" />
                    <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="بحث بالاسم أو البريد..."
                        className="bg-navy-lighter border-gold/10 text-cream pr-10" />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-cream-dark/30" />
                    {[{ value: 'all', label: 'الكل' }, { value: 'applied', label: 'تقدّم' }, { value: 'reviewing', label: 'مراجعة' }, { value: 'shortlisted', label: 'مختصرة' }, { value: 'interview', label: 'مقابلة' }, { value: 'offer', label: 'عرض' }].map(f => (
                        <button key={f.value} onClick={() => setFilterStatus(f.value)}
                            className={`px-2.5 py-1 rounded-full text-xs transition-colors ${filterStatus === f.value ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-navy-lighter text-cream-dark/40 border border-gold/5 hover:border-gold/15'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {filtered.map((app: any) => (
                    <Card key={app.id} className="bg-navy-light border-gold/10 hover:border-gold/20 transition-colors">
                        <CardContent className="p-6" dir="rtl">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-navy font-bold text-lg">
                                        {app.profiles?.full_name?.charAt(0)?.toUpperCase() || 'م'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-semibold text-cream">{app.profiles?.full_name || 'مرشح'}</h3>
                                            {app.ai_match_score > 0 && (
                                                <Badge className={`text-xs font-bold ${
                                                    app.ai_match_score >= 70 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                                    app.ai_match_score >= 40 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                                    'bg-red-500/20 text-red-400 border-red-500/30'
                                                }`}>
                                                    تطابق {app.ai_match_score}%
                                                </Badge>
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className={`h-6 text-xs px-2 ${getStatusColor(app.status)} hover:opacity-80`} disabled={updatingId === app.id}>
                                                        {getStatusLabel(app.status)}<ChevronDown className="ms-1 h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="bg-navy-light border-gold/10">
                                                    {statusOptions.map((s) => (
                                                        <DropdownMenuItem key={s.value} className={`cursor-pointer ${app.status === s.value ? 'bg-navy-lighter' : 'hover:bg-navy-lighter'} text-cream-dark`}
                                                            onClick={() => handleStatusChange(app.id, s.value)}>
                                                            <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${s.color.split(' ')[0]}`} />{s.label}</div>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        {app.candidates?.headline && <p className="text-cream-dark/50 text-sm mb-2">{app.candidates.headline}</p>}
                                        <div className="flex items-center gap-4 text-sm text-cream-dark/40">
                                            {app.profiles?.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{app.profiles.email}</span>}
                                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />تقدّم {new Date(app.created_at).toLocaleDateString('ar-AE')}</span>
                                        </div>
                                        {app.candidates?.skills?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {app.candidates.skills.slice(0, 5).map((s: string, i: number) => (<Badge key={i} variant="outline" className="border-gold/15 text-cream-dark/60">{s}</Badge>))}
                                                {app.candidates.skills.length > 5 && <Badge variant="outline" className="border-gold/10 text-cream-dark/30">+{app.candidates.skills.length - 5}</Badge>}
                                            </div>
                                        )}
                                        {app.status === 'rejected' && app.rejection_reason && (
                                            <div className="mt-2 text-xs text-red-400/70 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />سبب الرفض: {app.rejection_reason}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button variant="default" size="sm" className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark text-navy font-medium" onClick={() => setSelectedApplicant(app)}>
                                        <User className="me-2 h-4 w-4" />عرض الملف
                                    </Button>
                                    {app.candidates?.cv_url && (
                                        <a href={app.candidates.cv_url} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="sm" className="w-full border-gold/15 text-cream-dark/60 hover:bg-navy-lighter"><FileText className="me-2 h-4 w-4" />تحميل CV</Button>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Candidate Details Modal */}
            <Dialog open={!!selectedApplicant} onOpenChange={() => setSelectedApplicant(null)}>
                <DialogContent className="bg-navy-light border-gold/10 text-cream max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                    {selectedApplicant && (<>
                        <DialogHeader>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-navy font-bold text-2xl">
                                    {selectedApplicant.profiles?.full_name?.charAt(0)?.toUpperCase() || 'م'}
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl">{selectedApplicant.profiles?.full_name || 'مرشح'}</DialogTitle>
                                    <DialogDescription className="text-cream-dark/50 text-base mt-1">{selectedApplicant.candidates?.headline || 'لا يوجد عنوان'}</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                        <div className="space-y-6 mt-4">
                            <div className="flex flex-wrap gap-4 text-sm text-cream-dark/70 pb-4 border-b border-gold/10">
                                {selectedApplicant.profiles?.email && <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" /><a href={`mailto:${selectedApplicant.profiles.email}`} className="hover:text-gold">{selectedApplicant.profiles.email}</a></span>}
                                <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gold" />تقدّم: {new Date(selectedApplicant.created_at).toLocaleDateString('ar-AE')}</span>
                            </div>
                            {/* AI Match Score */}
                            {selectedApplicant.ai_match_score > 0 && (
                                <div className="p-4 rounded-lg border border-gold/10 bg-navy-lighter/30">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold text-gold">نسبة التطابق بالذكاء الاصطناعي</h4>
                                        <span className={`text-2xl font-bold ${
                                            selectedApplicant.ai_match_score >= 70 ? 'text-emerald-400' :
                                            selectedApplicant.ai_match_score >= 40 ? 'text-yellow-400' :
                                            'text-red-400'
                                        }`}>{selectedApplicant.ai_match_score}%</span>
                                    </div>
                                    <div className="w-full bg-navy rounded-full h-2 mb-2">
                                        <div className={`h-2 rounded-full ${
                                            selectedApplicant.ai_match_score >= 70 ? 'bg-emerald-500' :
                                            selectedApplicant.ai_match_score >= 40 ? 'bg-yellow-500' :
                                            'bg-red-500'
                                        }`} style={{ width: `${selectedApplicant.ai_match_score}%` }} />
                                    </div>
                                    {selectedApplicant.ai_analysis && (
                                        <p className="text-sm text-cream-dark/60 mt-2">{selectedApplicant.ai_analysis}</p>
                                    )}
                                </div>
                            )}
                            {selectedApplicant.cover_letter && (
                                <div className="space-y-2"><h4 className="text-sm font-semibold text-cream-dark">خطاب التقديم</h4>
                                    <div className="p-4 bg-navy-lighter/50 rounded-lg text-cream-dark/70 text-sm whitespace-pre-line">{selectedApplicant.cover_letter}</div>
                                </div>
                            )}
                            {selectedApplicant.candidates?.resume_parsed_data ? (
                                <div className="bg-navy-lighter/30 border border-gold/10 rounded-lg p-4">{renderAiInsights(selectedApplicant.candidates.resume_parsed_data)}</div>
                            ) : (
                                <div className="text-sm text-cream-dark/30 italic p-4 bg-navy-lighter/30 rounded-lg">لا تتوفر رؤى AI لهذا المرشح حتى الآن.</div>
                            )}
                            <div className="pt-4 flex gap-3">
                                {selectedApplicant.candidates?.cv_url && (
                                    <a href={selectedApplicant.candidates.cv_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                        <Button className="w-full bg-navy-lighter hover:bg-navy text-cream"><FileText className="me-2 h-4 w-4" />تحميل آخر CV</Button>
                                    </a>
                                )}
                                {selectedApplicant.resume_snapshot_url && (
                                    <a href={selectedApplicant.resume_snapshot_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                        <Button className="w-full bg-navy-lighter hover:bg-navy text-cream"><ExternalLink className="me-2 h-4 w-4" />CV وقت التقديم</Button>
                                    </a>
                                )}
                            </div>
                        </div>
                    </>)}
                </DialogContent>
            </Dialog>

            {/* Rejection Confirmation */}
            <AlertDialog open={rejectConfirmOpen} onOpenChange={setRejectConfirmOpen}>
                <AlertDialogContent className="bg-navy-light border-gold/10" dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-cream flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-400" />تأكيد رفض المتقدم</AlertDialogTitle>
                        <AlertDialogDescription className="text-cream-dark/50">
                            هل أنت متأكد من رفض &quot;{appToReject?.profiles?.full_name}&quot;؟ سيتم طلب سبب الرفض في الخطوة التالية.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogCancel className="bg-navy-lighter border-gold/10 text-cream">إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRejectConfirm} className="bg-red-600 hover:bg-red-700 text-white">نعم، أرفض</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Rejection Reason Dialog */}
            <Dialog open={rejectReasonOpen} onOpenChange={(v) => { if (!v) { setRejectReasonOpen(false); setAppToReject(null) } }}>
                <DialogContent className="bg-navy-light border-gold/10 text-cream" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>سبب الرفض</DialogTitle>
                        <DialogDescription className="text-cream-dark/50">يرجى اختيار سبب الرفض لتحسين تقارير التحليلات</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label className="text-cream-dark">السبب الرئيسي *</Label>
                            <Select value={rejectReason} onValueChange={setRejectReason}>
                                <SelectTrigger className="bg-navy-lighter border-gold/10 text-cream"><SelectValue placeholder="اختر السبب" /></SelectTrigger>
                                <SelectContent className="bg-navy-light border-gold/10">
                                    {REJECTION_REASONS.map(r => <SelectItem key={r.value} value={r.value} className="text-cream">{r.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-cream-dark">ملاحظات إضافية (اختياري)</Label>
                            <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="أضف تفاصيل إضافية..."
                                rows={3} className="bg-navy-lighter border-gold/10 text-cream resize-none" />
                        </div>
                    </div>
                    <DialogFooter className="flex-row-reverse gap-2 mt-4">
                        <Button variant="outline" onClick={() => { setRejectReasonOpen(false); setAppToReject(null) }} className="border-gold/10 text-cream-dark">إلغاء</Button>
                        <Button onClick={handleRejectSubmit} disabled={!rejectReason || updatingId === appToReject?.id} className="bg-red-600 hover:bg-red-700 text-white">
                            تأكيد الرفض
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Offer Generation Dialog */}
            <Dialog open={offerModalOpen} onOpenChange={(v) => { if (!v && !generatingOffer) { setOfferModalOpen(false); setAppToOffer(null) } }}>
                <DialogContent className="bg-navy-light border-gold/10 text-cream" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>توليد عرض وظيفي</DialogTitle>
                        <DialogDescription className="text-cream-dark/50">قم بإدخال تفاصيل العرض ليتم توليد العقد تلقائياً (MOHRE)</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label className="text-cream-dark">الراتب (بالدرهم) *</Label>
                            <Input type="number" value={offerSalary} onChange={(e) => setOfferSalary(e.target.value)} placeholder="مثال: 15000" className="bg-navy-lighter border-gold/10 text-cream" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-cream-dark">تاريخ المباشرة *</Label>
                            <Input type="date" value={offerStartDate} onChange={(e) => setOfferStartDate(e.target.value)} className="bg-navy-lighter border-gold/10 text-cream block text-left" style={{direction: "ltr"}} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-cream-dark">قالب العقد *</Label>
                            <Select value={offerTemplate} onValueChange={setOfferTemplate}>
                                <SelectTrigger className="bg-navy-lighter border-gold/10 text-cream"><SelectValue placeholder="اختر القالب" /></SelectTrigger>
                                <SelectContent className="bg-navy-light border-gold/10">
                                    {templates.map(t => <SelectItem key={t.id} value={t.id} className="text-cream">{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="flex-row-reverse gap-2 mt-4">
                        <Button variant="outline" onClick={() => { setOfferModalOpen(false); setAppToOffer(null) }} className="border-gold/10 text-cream-dark" disabled={generatingOffer}>إلغاء</Button>
                        <Button onClick={handleOfferSubmit} disabled={generatingOffer || !offerSalary || !offerStartDate} className="bg-gold hover:bg-gold-dark text-navy font-bold">
                            {generatingOffer ? <><Loader2 className="me-2 h-4 w-4 animate-spin" /> جاري التوليد...</> : 'إنشاء العقد'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
