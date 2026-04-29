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
            toast.error('Please login to apply')
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
            toast.error('You have already applied to this job')
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
            toast.error('Failed to apply: ' + error.message)
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

        toast.success('Application submitted! 🎉')
        setLoading(false)
        onClose()
        router.push('/candidate/applications')
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-white text-xl">
                        Apply for {jobTitle}
                    </DialogTitle>
                    <DialogDescription>
                        at {companyName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* CV Status */}
                    <div className="p-4 rounded-lg bg-slate-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${candidateData?.cv_url ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                                    {candidateData?.cv_url ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-amber-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-white font-medium">Resume</p>
                                    <p className="text-sm text-slate-400">
                                        {candidateData?.cv_url ? 'Your CV will be attached' : 'No CV uploaded'}
                                    </p>
                                </div>
                            </div>
                            {!candidateData?.cv_url && (
                                <Link href="/candidate/cv">
                                    <Button size="sm" variant="outline" className="border-slate-700">
                                        <Upload className="h-4 w-4 mr-1" />
                                        Upload
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Skills */}
                    {candidateData?.skills && candidateData.skills.length > 0 && (
                        <div>
                            <Label className="text-slate-300 mb-2 block">Your Skills</Label>
                            <div className="flex flex-wrap gap-2">
                                {candidateData.skills.slice(0, 8).map((skill, i) => (
                                    <Badge key={i} className="bg-cyan-500/20 text-cyan-400">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cover Letter */}
                    <div className="space-y-2">
                        <Label className="text-slate-300">Cover Letter (Optional)</Label>
                        <Textarea
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            placeholder="Why are you interested in this role? What makes you a great fit?"
                            rows={5}
                            className="bg-slate-800 border-slate-700 text-white resize-none"
                        />
                        <p className="text-xs text-slate-500">
                            A personalized cover letter can increase your chances
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-slate-700 text-slate-300"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={loading}
                        className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <FileText className="mr-2 h-4 w-4" />
                                Submit Application
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
