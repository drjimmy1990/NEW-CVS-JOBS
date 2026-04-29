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
    { value: 'Technology', label: 'التكنولوجيا' },
    { value: 'Healthcare', label: 'الرعاية الصحية' },
    { value: 'Finance', label: 'المالية والبنوك' },
    { value: 'Education', label: 'التعليم' },
    { value: 'Retail', label: 'التجزئة' },
    { value: 'Manufacturing', label: 'التصنيع' },
    { value: 'Consulting', label: 'الاستشارات' },
    { value: 'Real Estate', label: 'العقارات' },
    { value: 'Hospitality', label: 'الضيافة' },
    { value: 'Other', label: 'أخرى' },
]

const companySizes = [
    { value: '1-10 employees', label: '1-10 موظفين' },
    { value: '11-50 employees', label: '11-50 موظف' },
    { value: '51-200 employees', label: '51-200 موظف' },
    { value: '201-500 employees', label: '201-500 موظف' },
    { value: '500+ employees', label: '+500 موظف' },
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
            } else {
                // Check team membership
                const { data: membership } = await supabase
                    .from('company_members')
                    .select('company_id, companies(*)')
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .single()
                if (membership?.companies) {
                    setCompany(membership.companies as any)
                }
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
            toast.error('يرجى تسجيل الدخول')
            setSaving(false)
            return
        }

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
            .eq('id', company.id)

        if (error) {
            toast.error('فشل الحفظ: ' + error.message)
        } else {
            toast.success('تم تحديث ملف الشركة بنجاح!')
            router.refresh()
        }

        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold text-cream">إعدادات الشركة</h1>
                <p className="text-cream-dark/50 mt-1">
                    حدّث معلومات ملف شركتك
                </p>
            </div>

            <form onSubmit={handleSave}>
                <Card className="bg-navy-light border-gold/10">
                    <CardHeader>
                        <CardTitle className="text-cream flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-gold" />
                            ملف الشركة
                        </CardTitle>
                        <CardDescription className="text-cream-dark/40">
                            هذه المعلومات ستظهر في إعلانات وظائفك
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Company Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-cream-dark/70">اسم الشركة *</Label>
                            <Input
                                id="name"
                                value={company.name || ''}
                                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                placeholder="شركة النمو"
                                required
                                className="bg-navy border-gold/15 text-cream"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-cream-dark/70">عن الشركة</Label>
                            <Textarea
                                id="description"
                                value={company.description || ''}
                                onChange={(e) => setCompany({ ...company, description: e.target.value })}
                                placeholder="أخبر المرشحين عن شركتك وثقافتها وما يميزها..."
                                rows={4}
                                className="bg-navy border-gold/15 text-cream resize-none"
                            />
                        </div>

                        {/* Website */}
                        <div className="space-y-2">
                            <Label htmlFor="website" className="text-cream-dark/70 flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                الموقع الإلكتروني
                            </Label>
                            <Input
                                id="website"
                                type="url"
                                value={company.website || ''}
                                onChange={(e) => setCompany({ ...company, website: e.target.value })}
                                placeholder="https://www.yourcompany.com"
                                className="bg-navy border-gold/15 text-cream"
                            />
                        </div>

                        {/* Industry & Size */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-cream-dark/70">القطاع</Label>
                                <Select
                                    value={company.industry || ''}
                                    onValueChange={(value) => setCompany({ ...company, industry: value })}
                                >
                                    <SelectTrigger className="bg-navy border-gold/15 text-cream">
                                        <SelectValue placeholder="اختر القطاع" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-navy-light border-gold/15">
                                        {industries.map((ind) => (
                                            <SelectItem key={ind.value} value={ind.value} className="text-cream hover:bg-navy-lighter">
                                                {ind.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-cream-dark/70 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    حجم الشركة
                                </Label>
                                <Select
                                    value={company.size_range || ''}
                                    onValueChange={(value) => setCompany({ ...company, size_range: value })}
                                >
                                    <SelectTrigger className="bg-navy border-gold/15 text-cream">
                                        <SelectValue placeholder="اختر الحجم" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-navy-light border-gold/15">
                                        {companySizes.map((size) => (
                                            <SelectItem key={size.value} value={size.value} className="text-cream hover:bg-navy-lighter">
                                                {size.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Logo Upload */}
                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">شعار الشركة</Label>
                            <div className="border-2 border-dashed border-gold/15 rounded-lg p-8 text-center hover:border-gold/30 transition-colors cursor-pointer">
                                <Upload className="h-8 w-8 text-cream-dark/20 mx-auto mb-2" />
                                <p className="text-sm text-cream-dark/40">
                                    انقر لرفع الشعار (PNG, JPG حتى 2 ميجابايت)
                                </p>
                                <p className="text-xs text-cream-dark/30 mt-1">
                                    مقاس موصى به: 200×200 بكسل
                                </p>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-start pt-4">
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-gold hover:bg-gold-dark text-navy font-bold"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                        جارِ الحفظ...
                                    </>
                                ) : (
                                    <>
                                        <Save className="me-2 h-4 w-4" />
                                        حفظ التغييرات
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
