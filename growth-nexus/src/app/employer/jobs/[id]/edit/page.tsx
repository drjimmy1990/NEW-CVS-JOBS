'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter as useNextRouter } from 'next/navigation'
import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface EditJobPageProps {
    params: Promise<{ id: string }>
}

export default function EditJobPage({ params }: EditJobPageProps) {
    const { id } = use(params)
    const router = useNextRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location_city: '',
        job_type: 'full_time',
        salary_min: '',
        salary_max: '',
        status: 'active',
        is_confidential: false,
        is_featured: false,
    })

    useEffect(() => {
        async function loadJob() {
            const { data: job, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !job) {
                toast.error('Job not found')
                router.push('/employer/jobs')
                return
            }

            setFormData({
                title: job.title || '',
                description: job.description || '',
                location_city: job.location_city || '',
                job_type: job.job_type || 'full_time',
                salary_min: job.salary_min?.toString() || '',
                salary_max: job.salary_max?.toString() || '',
                status: job.status || 'active',
                is_confidential: job.is_confidential || false,
                is_featured: job.is_featured || false,
            })
            setLoading(false)
        }
        loadJob()
    }, [id, router, supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const { error } = await supabase
            .from('jobs')
            .update({
                title: formData.title,
                description: formData.description,
                location_city: formData.location_city,
                job_type: formData.job_type,
                salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
                salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
                status: formData.status,
                is_confidential: formData.is_confidential,
                is_featured: formData.is_featured,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)

        if (error) {
            toast.error('Failed to update job: ' + error.message)
        } else {
            toast.success('Job updated successfully!')
            router.push('/employer/jobs')
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/employer/jobs">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">Edit Job</h1>
                    <p className="text-slate-400 mt-1">Update your job posting details</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white">Job Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-white">Job Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="bg-slate-800 border-slate-700 text-white"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-white">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="bg-slate-800 border-slate-700 text-white min-h-[200px]"
                                required
                            />
                        </div>

                        {/* Location & Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="location" className="text-white">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location_city}
                                    onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                                    className="bg-slate-800 border-slate-700 text-white"
                                    placeholder="e.g. Riyadh"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white">Job Type</Label>
                                <Select
                                    value={formData.job_type}
                                    onValueChange={(v) => setFormData({ ...formData, job_type: v })}
                                >
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        <SelectItem value="full_time">Full Time</SelectItem>
                                        <SelectItem value="part_time">Part Time</SelectItem>
                                        <SelectItem value="contract">Contract</SelectItem>
                                        <SelectItem value="remote">Remote</SelectItem>
                                        <SelectItem value="internship">Internship</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Salary */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="salary_min" className="text-white">Min Salary (SAR)</Label>
                                <Input
                                    id="salary_min"
                                    type="number"
                                    value={formData.salary_min}
                                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                                    className="bg-slate-800 border-slate-700 text-white"
                                    placeholder="e.g. 10000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="salary_max" className="text-white">Max Salary (SAR)</Label>
                                <Input
                                    id="salary_max"
                                    type="number"
                                    value={formData.salary_max}
                                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                                    className="bg-slate-800 border-slate-700 text-white"
                                    placeholder="e.g. 15000"
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label className="text-white">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(v) => setFormData({ ...formData, status: v })}
                            >
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-white">Confidential Hiring</Label>
                                    <p className="text-sm text-slate-400">Hide company name from candidates</p>
                                </div>
                                <Switch
                                    checked={formData.is_confidential}
                                    onCheckedChange={(v) => setFormData({ ...formData, is_confidential: v })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-white">Featured Job</Label>
                                    <p className="text-sm text-slate-400">Highlight in job listings</p>
                                </div>
                                <Switch
                                    checked={formData.is_featured}
                                    onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <Button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                            <Link href="/employer/jobs">
                                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}
