'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import {
    MapPin, Briefcase, GraduationCap, Globe2, Clock, FileText,
    Mail, ArrowLeft, ChevronDown, Star, Sparkles, X, Eye,
    Loader2, BookOpen, User2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

const STATUSES = [
    { id: 'applied', label: 'تم التقديم', color: 'bg-cream-dark/20 text-cream-dark/60' },
    { id: 'reviewing', label: 'قيد المراجعة', color: 'bg-blue-500/15 text-blue-400' },
    { id: 'shortlisted', label: 'القائمة المختصرة', color: 'bg-emerald-500/15 text-emerald-400' },
    { id: 'interview', label: 'مقابلة', color: 'bg-purple-500/15 text-purple-400' },
    { id: 'offer', label: 'عرض وظيفي', color: 'bg-gold/15 text-gold' },
    { id: 'hired', label: 'تم التعيين', color: 'bg-green-500/15 text-green-400' },
    { id: 'rejected', label: 'مرفوض', color: 'bg-red-500/15 text-red-400' },
]

type ApplicantData = {
    id: string
    candidateId: string
    name: string
    headline: string
    role: string
    date: string
    cvUrl: string | null
    status: string
    yearsExperience: number
    city: string
    nationality: string
    educationLevel: string
    specialization: string
    lastJobTitle: string
    skills: string[]
    matchScore: number | null
    aiSummary: { top_skills?: string[]; top_experiences?: string[] } | null
}

type Props = {
    applicants: ApplicantData[]
}

export function ApplicantListView({ applicants }: Props) {
    const [quickViewApplicant, setQuickViewApplicant] = useState<ApplicantData | null>(null)

    if (applicants.length === 0) {
        return (
            <Card className="bg-navy-light border-gold/10">
                <CardContent className="p-12 text-center">
                    <User2 className="h-12 w-12 text-cream-dark/15 mx-auto mb-3" />
                    <p className="text-cream-dark/40">لا يوجد متقدمين بعد</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <div className="space-y-3">
                {applicants.map((applicant) => (
                    <ApplicantListCard
                        key={applicant.id}
                        applicant={applicant}
                        onQuickView={() => setQuickViewApplicant(applicant)}
                    />
                ))}
            </div>

            {/* Quick View Dialog */}
            <Dialog open={!!quickViewApplicant} onOpenChange={(v) => !v && setQuickViewApplicant(null)}>
                <DialogContent className="bg-navy-light border-gold/10 text-cream max-w-2xl" dir="rtl">
                    {quickViewApplicant && (
                        <QuickViewContent
                            applicant={quickViewApplicant}
                            onClose={() => setQuickViewApplicant(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

/* ============================
   Single List Card
   ============================ */
function ApplicantListCard({ applicant, onQuickView }: { applicant: ApplicantData; onQuickView: () => void }) {
    const [showMoveMenu, setShowMoveMenu] = useState(false)
    const [moving, setMoving] = useState(false)
    const [startingChat, setStartingChat] = useState(false)
    const router = useRouter()

    // Offer modal state
    const [offerModalOpen, setOfferModalOpen] = useState(false)
    const [offerSalary, setOfferSalary] = useState('')
    const [offerStartDate, setOfferStartDate] = useState('')
    const [offerTemplate, setOfferTemplate] = useState('')
    const [templates, setTemplates] = useState<any[]>([])
    const [generatingOffer, setGeneratingOffer] = useState(false)

    const statusInfo = STATUSES.find(s => s.id === applicant.status)

    const moveToStatus = async (newStatus: string) => {
        if (newStatus === 'offer') {
            setShowMoveMenu(false)
            // Load templates
            const supabase = createClient()
            const { data } = await supabase.from('contract_templates').select('*')
            if (data) {
                setTemplates(data)
                if (data.length > 0) setOfferTemplate(data[0].id)
            }
            setOfferModalOpen(true)
            return
        }

        setMoving(true)
        const supabase = createClient()
        const { error } = await supabase
            .from('applications')
            .update({ status: newStatus })
            .eq('id', applicant.id)

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
                    applicationId: applicant.id,
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
                body: JSON.stringify({ otherUserId: applicant.candidateId }),
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

    return (
        <>
            <Card className="bg-navy-light border-gold/8 hover:border-gold/20 transition-all duration-200 group">
                <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">

                        {/* Avatar + Name + Headline */}
                        <div className="flex items-center gap-4 min-w-0 lg:w-[280px] shrink-0">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/20 flex items-center justify-center text-cream font-bold text-lg shrink-0">
                                {applicant.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <button
                                    onClick={onQuickView}
                                    className="text-base font-semibold text-cream hover:text-gold transition-colors text-right block truncate"
                                >
                                    {applicant.name}
                                </button>
                                {applicant.headline && (
                                    <p className="text-xs text-cream-dark/40 truncate">{applicant.headline}</p>
                                )}
                                <p className="text-xs text-cream-dark/30 mt-0.5">{applicant.role}</p>
                            </div>
                        </div>

                        {/* Info chips */}
                        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                            {/* Status badge */}
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo?.color || 'bg-cream-dark/15 text-cream-dark/50'}`}>
                                {statusInfo?.label || applicant.status}
                            </span>

                            {/* Years Experience */}
                            {applicant.yearsExperience > 0 && (
                                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-navy/60 border border-gold/8 text-xs text-cream-dark/50">
                                    <Clock className="h-3 w-3" />
                                    {applicant.yearsExperience} سنة
                                </span>
                            )}

                            {/* Education */}
                            {applicant.educationLevel && (
                                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-navy/60 border border-gold/8 text-xs text-cream-dark/50">
                                    <GraduationCap className="h-3 w-3" />
                                    {applicant.educationLevel}
                                </span>
                            )}

                            {/* Specialization */}
                            {applicant.specialization && (
                                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-navy/60 border border-gold/8 text-xs text-cream-dark/50">
                                    <BookOpen className="h-3 w-3" />
                                    {applicant.specialization}
                                </span>
                            )}

                            {/* Nationality */}
                            {applicant.nationality && (
                                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-navy/60 border border-gold/8 text-xs text-cream-dark/50">
                                    <Globe2 className="h-3 w-3" />
                                    {applicant.nationality}
                                </span>
                            )}

                            {/* City */}
                            {applicant.city && (
                                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-navy/60 border border-gold/8 text-xs text-cream-dark/50">
                                    <MapPin className="h-3 w-3" />
                                    {applicant.city}
                                </span>
                            )}

                            {/* Match Score */}
                            {applicant.matchScore && (
                                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-gold/10 border border-gold/20 text-xs text-gold font-medium">
                                    <Star className="h-3 w-3 fill-gold" />
                                    {applicant.matchScore}%
                                </span>
                            )}

                            {/* Skills preview — first 3 */}
                            {applicant.skills.length > 0 && (
                                <div className="hidden md:flex items-center gap-1">
                                    {applicant.skills.slice(0, 3).map((skill, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300/70 text-[10px]">
                                            {skill}
                                        </span>
                                    ))}
                                    {applicant.skills.length > 3 && (
                                        <span className="text-[10px] text-cream-dark/30">+{applicant.skills.length - 3}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Date + Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-cream-dark/30 me-2 hidden sm:block">{applicant.date}</span>

                            {/* Quick View */}
                            <button
                                onClick={onQuickView}
                                className="flex items-center gap-1 text-xs text-cream-dark/50 hover:text-cream px-2 py-1.5 rounded-md hover:bg-navy-lighter transition-colors"
                                title="عرض سريع"
                            >
                                <Eye className="h-3.5 w-3.5" />
                            </button>

                            {/* CV */}
                            {applicant.cvUrl ? (
                                <a
                                    href={applicant.cvUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-cream-dark/50 hover:text-cream px-2 py-1.5 rounded-md hover:bg-navy-lighter transition-colors"
                                    title="عرض السيرة"
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                </a>
                            ) : (
                                <span className="flex items-center gap-1 text-xs text-cream-dark/20 px-2 py-1.5" title="لا توجد سيرة">
                                    <FileText className="h-3.5 w-3.5" />
                                </span>
                            )}

                            {/* Message */}
                            <button
                                onClick={startChat}
                                disabled={startingChat}
                                className="flex items-center gap-1 text-xs text-cream-dark/50 hover:text-cream px-2 py-1.5 rounded-md hover:bg-navy-lighter transition-colors"
                                title="رسالة"
                            >
                                <Mail className="h-3.5 w-3.5" />
                            </button>

                            {/* Move Status */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowMoveMenu(!showMoveMenu)}
                                    disabled={moving}
                                    className="flex items-center gap-1 text-xs text-gold hover:text-gold-light px-2 py-1.5 rounded-md hover:bg-gold/10 transition-colors font-medium"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    {moving ? '...' : 'نقل'}
                                    <ChevronDown className="h-3 w-3" />
                                </button>

                                {showMoveMenu && (
                                    <div className="absolute top-full mt-1 end-0 bg-navy-light border border-gold/20 rounded-lg shadow-xl z-50 overflow-hidden min-w-[160px]">
                                        {STATUSES
                                            .filter(s => s.id !== applicant.status)
                                            .map(s => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => moveToStatus(s.id)}
                                                    className="w-full px-3 py-2 text-xs text-cream-dark/70 hover:text-cream hover:bg-navy-lighter text-right transition-colors flex items-center gap-2"
                                                >
                                                    <span className={`h-2 w-2 rounded-full ${s.color.split(' ')[0]}`}></span>
                                                    {s.label}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Offer Dialog */}
            <Dialog open={offerModalOpen} onOpenChange={(v) => { if (!v && !generatingOffer) setOfferModalOpen(false) }}>
                <DialogContent className="bg-navy-light border-gold/10 text-cream" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>توليد عرض وظيفي</DialogTitle>
                        <DialogDescription className="text-cream-dark/50">
                            إنشاء عقد عمل لـ &quot;{applicant.name}&quot; — {applicant.role}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label className="text-cream-dark">الراتب (بالدرهم) *</Label>
                            <Input type="number" value={offerSalary} onChange={(e) => setOfferSalary(e.target.value)} placeholder="مثال: 15000" className="bg-navy-lighter border-gold/10 text-cream" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-cream-dark">تاريخ المباشرة *</Label>
                            <Input type="date" value={offerStartDate} onChange={(e) => setOfferStartDate(e.target.value)} className="bg-navy-lighter border-gold/10 text-cream block text-left" style={{ direction: 'ltr' }} />
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
                        <Button variant="outline" onClick={() => setOfferModalOpen(false)} className="border-gold/10 text-cream-dark" disabled={generatingOffer}>إلغاء</Button>
                        <Button onClick={handleOfferSubmit} disabled={generatingOffer || !offerSalary || !offerStartDate} className="bg-gold hover:bg-gold-dark text-navy font-bold">
                            {generatingOffer ? (<><Loader2 className="me-2 h-4 w-4 animate-spin" /> جاري التوليد...</>) : 'إنشاء العقد'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

/* ============================
   Quick View Content
   ============================ */
function QuickViewContent({ applicant, onClose }: { applicant: ApplicantData; onClose: () => void }) {
    const statusInfo = STATUSES.find(s => s.id === applicant.status)

    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-xl">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/20 flex items-center justify-center text-cream font-bold text-lg shrink-0">
                            {applicant.name.charAt(0)}
                        </div>
                        <div>
                            <span>{applicant.name}</span>
                            {applicant.headline && (
                                <p className="text-sm text-cream-dark/40 font-normal mt-0.5">{applicant.headline}</p>
                            )}
                        </div>
                    </div>
                </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
                {/* Status + Match Score */}
                <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo?.color || ''}`}>
                        {statusInfo?.label || applicant.status}
                    </span>
                    {applicant.matchScore && (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-sm text-gold font-bold">
                            <Star className="h-4 w-4 fill-gold" />
                            {applicant.matchScore}% مطابقة
                        </span>
                    )}
                    <span className="text-xs text-cream-dark/30">تقدم في {applicant.date}</span>
                </div>

                {/* Basic Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <InfoItem icon={<Briefcase className="h-4 w-4" />} label="الوظيفة" value={applicant.role} />
                    <InfoItem icon={<Clock className="h-4 w-4" />} label="سنوات الخبرة" value={applicant.yearsExperience > 0 ? `${applicant.yearsExperience} سنة` : '—'} />
                    <InfoItem icon={<GraduationCap className="h-4 w-4" />} label="المؤهل" value={applicant.educationLevel || '—'} />
                    <InfoItem icon={<BookOpen className="h-4 w-4" />} label="التخصص" value={applicant.specialization || '—'} />
                    <InfoItem icon={<Globe2 className="h-4 w-4" />} label="الجنسية" value={applicant.nationality || '—'} />
                    <InfoItem icon={<MapPin className="h-4 w-4" />} label="المدينة" value={applicant.city || '—'} />
                    {applicant.lastJobTitle && (
                        <InfoItem icon={<Briefcase className="h-4 w-4" />} label="آخر وظيفة" value={applicant.lastJobTitle} />
                    )}
                </div>

                {/* Skills */}
                {applicant.skills.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-cream mb-2">المهارات</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {applicant.skills.map((skill, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 text-xs border border-blue-500/15">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Summary */}
                {applicant.aiSummary && (
                    <div className="bg-navy/50 rounded-xl border border-gold/10 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-gold text-sm font-semibold">
                            <Sparkles className="h-4 w-4" />
                            ملخص AI للسيرة الذاتية
                        </div>
                        {applicant.aiSummary.top_experiences && applicant.aiSummary.top_experiences.length > 0 && (
                            <div>
                                <p className="text-xs text-cream-dark/50 mb-1">أهم الخبرات:</p>
                                <ul className="space-y-1">
                                    {applicant.aiSummary.top_experiences.map((exp, i) => (
                                        <li key={i} className="text-sm text-cream-dark/70 flex items-start gap-2">
                                            <span className="text-gold mt-1">•</span> {exp}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {applicant.aiSummary.top_skills && applicant.aiSummary.top_skills.length > 0 && (
                            <div>
                                <p className="text-xs text-cream-dark/50 mb-1">أهم المهارات:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {applicant.aiSummary.top_skills.map((skill, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded-md bg-gold/10 text-gold text-xs">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* CV Button */}
                {applicant.cvUrl && (
                    <a
                        href={applicant.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                    >
                        <Button className="w-full bg-gold hover:bg-gold-dark text-navy font-bold">
                            <FileText className="me-2 h-4 w-4" />
                            عرض السيرة الذاتية كاملة
                        </Button>
                    </a>
                )}
            </div>
        </>
    )
}

/* Small info display helper */
function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-2 bg-navy/40 rounded-lg px-3 py-2 border border-gold/5">
            <span className="text-cream-dark/30">{icon}</span>
            <div>
                <p className="text-[10px] text-cream-dark/30">{label}</p>
                <p className="text-sm text-cream-dark/70">{value}</p>
            </div>
        </div>
    )
}
