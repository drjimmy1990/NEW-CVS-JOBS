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
import { Loader2, Save, Building2, Globe, Users, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { Company } from '@/lib/types'

const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Retail',
    'Manufacturing',
    'Consulting',
    'Real Estate',
    'Hospitality',
    'Other'
]

const companySizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '500+ employees'
]

export default function CompanySettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [company, setCompany] = useState<Partial<Company>>({})

    useEffect(() => {
        loadCompany()
    }, [])

    const loadCompany = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data } = await supabase
                .from('companies')
                .select('*')
                .eq('owner_id', user.id)
                .single()

            if (data) {
                setCompany(data)
            }
        }
        setLoading(false)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error('Please login to continue')
            setSaving(false)
            return
        }

        // Generate slug from company name
        const slug = company.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || ''

        const { error } = await supabase
            .from('companies')
            .update({
                name: company.name,
                slug: slug + '-' + company.id?.slice(0, 8),
                description: company.description,
                website: company.website,
                industry: company.industry,
                size_range: company.size_range,
            })
            .eq('owner_id', user.id)

        if (error) {
            toast.error('Failed to save: ' + error.message)
        } else {
            toast.success('Company profile updated successfully!')
            router.refresh()
        }

        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold text-white">Company Settings</h1>
                <p className="text-slate-400 mt-1">
                    Update your company profile information
                </p>
            </div>

            <form onSubmit={handleSave}>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-cyan-500" />
                            Company Profile
                        </CardTitle>
                        <CardDescription>
                            This information will be displayed on your job postings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Company Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-300">Company Name *</Label>
                            <Input
                                id="name"
                                value={company.name || ''}
                                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                placeholder="Acme Corporation"
                                required
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-slate-300">About</Label>
                            <Textarea
                                id="description"
                                value={company.description || ''}
                                onChange={(e) => setCompany({ ...company, description: e.target.value })}
                                placeholder="Tell candidates about your company, culture, and what makes you unique..."
                                rows={4}
                                className="bg-slate-800 border-slate-700 text-white resize-none"
                            />
                        </div>

                        {/* Website */}
                        <div className="space-y-2">
                            <Label htmlFor="website" className="text-slate-300 flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Website
                            </Label>
                            <Input
                                id="website"
                                type="url"
                                value={company.website || ''}
                                onChange={(e) => setCompany({ ...company, website: e.target.value })}
                                placeholder="https://www.yourcompany.com"
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>

                        {/* Industry & Size */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Industry</Label>
                                <Select
                                    value={company.industry || ''}
                                    onValueChange={(value) => setCompany({ ...company, industry: value })}
                                >
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                        <SelectValue placeholder="Select industry" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        {industries.map((ind) => (
                                            <SelectItem key={ind} value={ind} className="text-white hover:bg-slate-700">
                                                {ind}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Company Size
                                </Label>
                                <Select
                                    value={company.size_range || ''}
                                    onValueChange={(value) => setCompany({ ...company, size_range: value })}
                                >
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                        <SelectValue placeholder="Select size" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        {companySizes.map((size) => (
                                            <SelectItem key={size} value={size} className="text-white hover:bg-slate-700">
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Logo Upload Placeholder */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Company Logo</Label>
                            <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-cyan-500/50 transition-colors cursor-pointer">
                                <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">
                                    Click to upload logo (PNG, JPG up to 2MB)
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Recommended: 200x200 pixels
                                </p>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
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
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}
