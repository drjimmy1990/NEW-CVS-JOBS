'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, FileText, CheckCircle2, AlertCircle, Upload } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type ApplyModalProps = {
    isOpen: boolean
    onClose: () => void
    jobId: string
    jobTitle: string
    companyName: string
}

export function ApplyModal({ isOpen, onClose, jobId, jobTitle, companyName }: ApplyModalProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [coverLetter, setCoverLetter] = useState('')
    const [candidateData, setCandidateData] = useState<{
        cv_url: string | null
        skills: string[] | null
    } | null>(null)
    const [hasLoaded, setHasLoaded] = useState(false)

    // Load candidate data when modal opens
    const loadCandidateData = async () => {
        if (hasLoaded) return

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data } = await supabase
                .from('candidates')
                .select('cv_url, skills')
                .eq('id', user.id)
                .single()

            setCandidateData(data)
        }
        setHasLoaded(true)
    }

    // Load data when modal opens
    if (isOpen && !hasLoaded) {
        loadCandidateData()
    }

    const handleApply = async () => {
        setLoading(true)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error('يرجى تسجيل الدخول للتقديم')
            setLoading(false)
            return
        }

        // Check if already applied
        const { data: existingApp } = await supabase
            .from('applications')
            .select('id')
            .eq('job_id', jobId)
            .eq('candidate_id', user.id)
            .single()

        if (existingApp) {
            toast.error('لقد تقدمت لهذه الوظيفة من قبل')
            setLoading(false)
            onClose()
            return
        }

        // Submit application
        const { data, error } = await supabase
            .from('applications')
            .insert({
                job_id: jobId,
                candidate_id: user.id,
                cover_letter: coverLetter || null,
                resume_snapshot_url: candidateData?.cv_url || null,
                status: 'applied'
            })
            .select()
            .single()

        if (error) {
            toast.error('فشل التقديم: ' + error.message)
            setLoading(false)
            return
        }

        // Trigger AI Match Score generation (await to prevent browser cancellation on navigation)
        try {
            await fetch('/api/ai/match-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: data.id })
            })
        } catch (err) {
            console.error('Failed to trigger match score:', err)
        }

        // Trigger Application Notification (notify employer team)
        try {
            await fetch('/api/notifications/application-notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: data.id,
                    jobId,
                    jobTitle,
                    candidateName: user.user_metadata?.full_name || user.email,
                    companyName,
                })
            })
        } catch (err) {
            console.error('Failed to trigger notification:', err)
        }

        toast.success('تم إرسال طلبك بنجاح! 🎉')
        setLoading(false)
        onClose()
        router.push('/candidate/applications')
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent dir="rtl" className="bg-navy-light border-gold/15 max-w-lg text-cream">
                <DialogHeader>
                    <DialogTitle className="text-cream text-xl text-right">
                        التقدم لوظيفة {jobTitle}
                    </DialogTitle>
                    <DialogDescription className="text-cream-dark/50 text-right">
                        لدى {companyName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* CV Status */}
                    <div className="p-4 rounded-lg bg-navy-lighter/50 border border-gold/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${candidateData?.cv_url ? 'bg-success/20' : 'bg-amber-500/20'}`}>
                                    {candidateData?.cv_url ? (
                                        <CheckCircle2 className="h-5 w-5 text-success" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-amber-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-cream font-medium">السيرة الذاتية</p>
                                    <p className="text-sm text-cream-dark/50">
                                        {candidateData?.cv_url ? 'سيتم إرفاق سيرتك الذاتية' : 'لم يتم رفع سيرة ذاتية'}
                                    </p>
                                </div>
                            </div>
                            {!candidateData?.cv_url && (
                                <Link href="/candidate/cv">
                                    <Button size="sm" variant="outline" className="border-gold/20 text-cream hover:bg-navy">
                                        <Upload className="h-4 w-4 me-1" />
                                        رفع
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Skills */}
                    {candidateData?.skills && candidateData.skills.length > 0 && (
                        <div>
                            <Label className="text-cream-dark/70 mb-2 block">مهاراتك</Label>
                            <div className="flex flex-wrap gap-2">
                                {candidateData.skills.slice(0, 8).map((skill, i) => (
                                    <Badge key={i} className="bg-gold/10 text-gold border-gold/30">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cover Letter */}
                    <div className="space-y-2">
                        <Label className="text-cream-dark/70">خطاب التقديم (اختياري)</Label>
                        <Textarea
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            placeholder="لماذا أنت مهتم بهذه الوظيفة؟ وما الذي يجعلك مرشحاً مناسباً؟"
                            rows={5}
                            className="bg-navy-lighter border-gold/15 text-cream resize-none text-right"
                        />
                        <p className="text-xs text-cream-dark/40">
                            خطاب تقديم مخصص يزيد من فرص قبولك
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-gold/15 text-cream-dark/70 hover:bg-navy hover:text-cream"
                    >
                        إلغاء
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={loading}
                        className="bg-gold hover:bg-gold-dark text-navy font-bold"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                جارِ الإرسال...
                            </>
                        ) : (
                            <>
                                <FileText className="me-2 h-4 w-4" />
                                إرسال الطلب
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
