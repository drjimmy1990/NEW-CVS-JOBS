'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Loader2, ArrowRight, ArrowLeft, Check, Briefcase, FileText, Eye } from 'lucide-react'
import { toast } from 'sonner'
import type { JobType } from '@/lib/types'

const jobTypes: { value: JobType; label: string }[] = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'remote', label: 'Remote' },
    { value: 'internship', label: 'Internship' },
]

const experienceLevels = [
    'Entry Level',
    'Junior (1-2 years)',
    'Mid-Level (3-5 years)',
    'Senior (5+ years)',
    'Lead/Manager',
    'Executive',
]

type JobFormData = {
    title: string
    description: string
    requirements: string
    location: string
    job_type: JobType
    salary_range: string
    experience_level: string
    is_confidential: boolean
    is_featured: boolean
}

const initialFormData: JobFormData = {
    title: '',
    description: '',
    requirements: '',
    location: '',
    job_type: 'full_time',
    salary_range: '',
    experience_level: '',
    is_confidential: false,
    is_featured: false,
}

export default function NewJobPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<JobFormData>(initialFormData)

    const updateField = (field: keyof JobFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const canProceedStep1 = formData.title && formData.job_type && formData.location
    const canProceedStep2 = formData.description && formData.requirements

    const handleSubmit = async (publish: boolean = false) => {
        setLoading(true)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error('Please login to continue')
            setLoading(false)
            return
        }

        // Get company
        let { data: company } = await supabase
            .from('companies')
            .select('id, job_credits')
            .eq('owner_id', user.id)
            .single()

        // Auto-create company if not found
        if (!company) {
            const fullName = user.user_metadata?.full_name || 'My'
            const companySlug = fullName.toLowerCase().replace(/\s+/g, '-') + '-company-' + Date.now()

            const { data: newCompany, error: companyError } = await supabase
                .from('companies')
                .insert({
                    owner_id: user.id,
                    name: fullName + "'s Company",
                    slug: companySlug
                })
                .select('id, job_credits')
                .single()

            if (companyError) {
                toast.error('Failed to create company: ' + companyError.message)
                setLoading(false)
                return
            }

            company = newCompany
        }

        // Generate slug
        const slug = formData.title.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '') + '-' + Date.now()

        const { data: job, error } = await supabase
            .from('jobs')
            .insert({
                company_id: company.id,
                title: formData.title,
                slug: slug,
                description: formData.description + '\n\nRequirements:\n' + formData.requirements,
                location_city: formData.location,
                job_type: formData.job_type,
                salary_min: formData.salary_range ? parseInt(formData.salary_range.replace(/\D/g, '')) || null : null,
                is_confidential: formData.is_confidential,
                is_featured: formData.is_featured,
                status: publish ? 'active' : 'draft',
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            })
            .select()
            .single()

        if (error) {
            toast.error('Failed to create job: ' + error.message)
            setLoading(false)
            return
        }

        toast.success(publish ? 'Job published successfully!' : 'Job saved as draft')
        router.push('/employer/jobs')
    }

    const steps = [
        { number: 1, title: 'Basic Info', icon: Briefcase },
        { number: 2, title: 'Description', icon: FileText },
        { number: 3, title: 'Review', icon: Eye },
    ]

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Post a New Job</h1>
                <p className="text-slate-400 mt-1">
                    Fill in the details to create your job posting
                </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
                {steps.map((s, idx) => (
                    <div key={s.number} className="flex items-center">
                        <div className={`flex items-center gap-2 ${step >= s.number ? 'text-cyan-400' : 'text-slate-500'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${step > s.number
                                ? 'bg-cyan-500 border-cyan-500 text-white'
                                : step === s.number
                                    ? 'border-cyan-500 text-cyan-400'
                                    : 'border-slate-600 text-slate-500'
                                }`}>
                                {step > s.number ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                            </div>
                            <span className={`font-medium ${step >= s.number ? 'text-white' : 'text-slate-500'}`}>
                                {s.title}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`w-16 h-0.5 mx-4 ${step > s.number ? 'bg-cyan-500' : 'bg-slate-700'}`} />
                        )}
                    </div>
                ))}
            </div>

            <Progress value={(step / 3) * 100} className="h-1 bg-slate-800" />

            {/* Step 1: Basic Info */}
            {step === 1 && (
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white">Basic Information</CardTitle>
                        <CardDescription>Enter the essential details about the position</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Job Title *</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => updateField('title', e.target.value)}
                                placeholder="e.g., Senior Software Engineer"
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Job Type *</Label>
                                <Select value={formData.job_type} onValueChange={(v) => updateField('job_type', v as JobType)}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        {jobTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value} className="text-white">
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Location *</Label>
                                <Input
                                    value={formData.location}
                                    onChange={(e) => updateField('location', e.target.value)}
                                    placeholder="e.g., Riyadh, Saudi Arabia"
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Salary Range</Label>
                                <Input
                                    value={formData.salary_range}
                                    onChange={(e) => updateField('salary_range', e.target.value)}
                                    placeholder="e.g., $80,000 - $120,000"
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Experience Level</Label>
                                <Select value={formData.experience_level} onValueChange={(v) => updateField('experience_level', v)}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                        <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        {experienceLevels.map((level) => (
                                            <SelectItem key={level} value={level} className="text-white">
                                                {level}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-4 pt-4 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-slate-300">Confidential Listing</Label>
                                    <p className="text-sm text-slate-500">Hide company name from candidates</p>
                                </div>
                                <Switch
                                    checked={formData.is_confidential}
                                    onCheckedChange={(v) => updateField('is_confidential', v)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-slate-300">Featured Job</Label>
                                    <p className="text-sm text-slate-500">Boost visibility (uses featured credits)</p>
                                </div>
                                <Switch
                                    checked={formData.is_featured}
                                    onCheckedChange={(v) => updateField('is_featured', v)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Description */}
            {step === 2 && (
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white">Job Description</CardTitle>
                        <CardDescription>Provide details about the role and requirements</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Description *</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => updateField('description', e.target.value)}
                                placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                                rows={6}
                                className="bg-slate-800 border-slate-700 text-white resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-300">Requirements *</Label>
                            <Textarea
                                value={formData.requirements}
                                onChange={(e) => updateField('requirements', e.target.value)}
                                placeholder="List the skills, qualifications, and experience required..."
                                rows={6}
                                className="bg-slate-800 border-slate-700 text-white resize-none"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white">Review Your Job Posting</CardTitle>
                        <CardDescription>Confirm the details before publishing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-500">Job Title</p>
                                <p className="text-white font-medium">{formData.title}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Job Type</p>
                                <p className="text-white font-medium">
                                    {jobTypes.find(t => t.value === formData.job_type)?.label}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Location</p>
                                <p className="text-white font-medium">{formData.location}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Salary Range</p>
                                <p className="text-white font-medium">{formData.salary_range || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Experience Level</p>
                                <p className="text-white font-medium">{formData.experience_level || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Settings</p>
                                <div className="flex gap-2">
                                    {formData.is_confidential && (
                                        <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                                            Confidential
                                        </span>
                                    )}
                                    {formData.is_featured && (
                                        <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                                            Featured
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <p className="text-sm text-slate-500 mb-2">Description</p>
                            <p className="text-slate-300 whitespace-pre-wrap">{formData.description}</p>
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <p className="text-sm text-slate-500 mb-2">Requirements</p>
                            <p className="text-slate-300 whitespace-pre-wrap">{formData.requirements}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    disabled={step === 1}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>

                {step < 3 ? (
                    <Button
                        onClick={() => setStep(step + 1)}
                        disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                    >
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handleSubmit(false)}
                            disabled={loading}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                            Save as Draft
                        </Button>
                        <Button
                            onClick={() => handleSubmit(true)}
                            disabled={loading}
                            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Publish Job
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
