'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UploadCloud, CheckCircle2, Loader2, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface PrivateApplyFormProps {
    landingPageId: string
    companyId: string
}

export function PrivateApplyForm({ landingPageId, companyId }: PrivateApplyFormProps) {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
    })
    const [file, setFile] = useState<File | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0]
        if (!selected) return
        if (selected.type !== 'application/pdf') {
            toast.error('Please upload a PDF file')
            return
        }
        if (selected.size > 5 * 1024 * 1024) {
            toast.error('File size must be under 5MB')
            return
        }
        setFile(selected)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) {
            toast.error('Please upload your CV')
            return
        }

        setLoading(true)

        try {
            // 1. Storage - Upload CV
            const fileExt = file.name.split('.').pop() || 'pdf'
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `resumes/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(filePath, file)

            if (uploadError) throw new Error('CV Upload failed: ' + uploadError.message)

            const { data: { publicUrl } } = supabase.storage
                .from('resumes')
                .getPublicUrl(filePath)

            // 2. Auth / Profiles Upsert (Find or Create User)
            // Note: Since this is an unauthenticated form, we cannot use admin auth APIs securely here.
            // We'll create a "shell profile" in candidates manually if they don't exist.

            // Wait, we need auth.uid() for the candidates table via RLS usually, 
            // but for a public form we might invoke a secure Edge Function or use an RPC if RLS blocks us.
            // We built an `upsert_candidate_from_form` RPC specifically for this scenario in SOP!

            // Let's call the RPC
            const { data: candidateId, error: rpcError } = await supabase.rpc('upsert_private_candidate', {
                p_email: formData.email,
                p_full_name: formData.fullName,
                p_cv_url: publicUrl
            })

            if (rpcError) throw new Error('Failed to process profile: ' + rpcError.message)

            // 3. Applications Table
            // To link the application, we need a hidden job for this landing page
            // Find or create the hidden job for this landing page
            const { data: hiddenJob, error: jobError } = await supabase.rpc('get_or_create_private_job', {
                p_company_id: companyId,
                p_landing_page_id: landingPageId
            })

            if (jobError) throw new Error('Failed to link job: ' + jobError.message)

            // Insert Application
            const { error: appError } = await supabase
                .from('applications')
                .insert({
                    job_id: hiddenJob,
                    candidate_id: candidateId,
                    resume_snapshot_url: publicUrl,
                    source: 'landing_page_token'
                })

            // (Optional) Call n8n Parser webhook async
            const webhookUrl = process.env.NEXT_PUBLIC_N8N_CV_PARSER_WEBHOOK
            if (webhookUrl && webhookUrl !== 'PLACEHOLDER') {
                fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        candidateId: candidateId,
                        cvUrl: publicUrl,
                        source: 'private_apply'
                    })
                }).catch(e => console.error("N8N Trigger Error", e))
            }

            if (appError) {
                // Check if it's a unique constraint violation (already applied)
                if (appError.code === '23505') {
                    toast.error('You have already applied via this link.')
                } else {
                    throw new Error('Application failed: ' + appError.message)
                }
            } else {
                setSuccess(true)
                toast.success('Application submitted successfully!')
            }

        } catch (err: any) {
            toast.error(err.message)
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-white">Application Received!</h3>
                <p className="text-slate-400">
                    Thank you, {formData.fullName}. Your application has been sent directly to the employer.
                </p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white">Full Name *</Label>
                <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email Address *</Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label className="text-white">Resume / CV (PDF) *</Label>
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-700 hover:border-slate-500 bg-slate-800/50'
                        }`}
                >
                    <input
                        type="file"
                        id="cv-upload"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <label
                        htmlFor="cv-upload"
                        className="cursor-pointer flex flex-col items-center justify-center gap-3"
                    >
                        {file ? (
                            <>
                                <FileText className="h-10 w-10 text-cyan-400" />
                                <div>
                                    <p className="text-sm font-medium text-cyan-400">{file.name}</p>
                                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <span className="text-xs text-slate-400 mt-2 underline">Click to change file</span>
                            </>
                        ) : (
                            <>
                                <UploadCloud className="h-10 w-10 text-slate-400" />
                                <div>
                                    <p className="text-sm font-medium text-white">Click to upload your CV</p>
                                    <p className="text-xs text-slate-500 mt-1">PDF only, max 5MB</p>
                                </div>
                            </>
                        )}
                    </label>
                </div>
            </div>

            <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20 py-6 text-lg"
                disabled={loading || !file}
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Submitting Application...
                    </>
                ) : (
                    'Submit Application'
                )}
            </Button>

            <p className="text-xs text-center text-slate-500">
                By submitting this form, you agree to our Terms of Service and allow the employer to view your resume.
            </p>
        </form>
    )
}
