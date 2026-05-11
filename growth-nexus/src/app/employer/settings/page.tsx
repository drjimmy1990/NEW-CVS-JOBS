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
import { Loader2, Save, Building2, Globe, Users, Upload, MapPin, Phone, Linkedin, FileText, Shield } from 'lucide-react'
import { toast } from 'sonner'

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
    { value: '1-10', label: '1-10 موظفين' },
    { value: '11-50', label: '11-50 موظف' },
    { value: '51-200', label: '51-200 موظف' },
    { value: '201-500', label: '201-500 موظف' },
    { value: '500+', label: '+500 موظف' },
]

const emirates = [
    { value: 'Abu Dhabi', label: 'أبوظبي' },
    { value: 'Dubai', label: 'دبي' },
    { value: 'Sharjah', label: 'الشارقة' },
    { value: 'Ajman', label: 'عجمان' },
    { value: 'RAK', label: 'رأس الخيمة' },
    { value: 'Fujairah', label: 'الفجيرة' },
    { value: 'UAQ', label: 'أم القيوين' },
]

const entityTypes = [
    { value: 'government', label: 'جهة حكومية' },
    { value: 'semi_government', label: 'جهة شبه حكومية' },
    { value: 'private', label: 'قطاع خاص' },
    { value: 'recruitment_agency', label: 'وكالة توظيف' },
]

export default function CompanySettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [company, setCompany] = useState<Record<string, any>>({})

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

        const { error } = await supabase
            .from('companies')
            .update({
                name: company.name,
                official_name: company.official_name,
                trade_name: company.trade_name,
                description: company.description,
                website: company.website,
                linkedin_url: company.linkedin_url,
                industry: company.industry,
                sub_industry: company.sub_industry,
                employee_count_range: company.employee_count_range,
                emirate: company.emirate,
                city: company.city,
                address: company.address,
                phone: company.phone,
                contact_person_name: company.contact_person_name,
                contact_person_title: company.contact_person_title,
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
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-3xl font-bold text-cream">إعدادات الشركة</h1>
                <p className="text-cream-dark/50 mt-1">
                    بيانات الشركة محفوظة من التسجيل — يمكنك تعديلها في أي وقت
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">

                {/* === Section 1: Company Identity === */}
                <Card className="bg-navy-light border-gold/10">
                    <CardHeader>
                        <CardTitle className="text-cream flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-gold" />
                            بيانات الشركة
                        </CardTitle>
                        <CardDescription className="text-cream-dark/40">
                            الاسم والوصف ونوع الجهة — من بيانات التسجيل
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Official Name + Trade Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="official_name" className="text-cream-dark/70">الاسم الرسمي *</Label>
                                <Input
                                    id="official_name"
                                    value={company.official_name || company.name || ''}
                                    onChange={(e) => setCompany({ ...company, official_name: e.target.value, name: e.target.value })}
                                    required
                                    className="bg-navy border-gold/15 text-cream"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="trade_name" className="text-cream-dark/70">الاسم التجاري</Label>
                                <Input
                                    id="trade_name"
                                    value={company.trade_name || ''}
                                    onChange={(e) => setCompany({ ...company, trade_name: e.target.value })}
                                    className="bg-navy border-gold/15 text-cream"
                                />
                            </div>
                        </div>

                        {/* Entity Type (read-only display) */}
                        <div className="space-y-2">
                            <Label className="text-cream-dark/70 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                نوع الجهة
                            </Label>
                            <Select
                                value={company.entity_type || ''}
                                onValueChange={(value) => setCompany({ ...company, entity_type: value })}
                            >
                                <SelectTrigger className="bg-navy border-gold/15 text-cream">
                                    <SelectValue placeholder="نوع الجهة" />
                                </SelectTrigger>
                                <SelectContent className="bg-navy-light border-gold/15">
                                    {entityTypes.map((t) => (
                                        <SelectItem key={t.value} value={t.value} className="text-cream hover:bg-navy-lighter">
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                    عدد الموظفين
                                </Label>
                                <Select
                                    value={company.employee_count_range || company.size_range || ''}
                                    onValueChange={(value) => setCompany({ ...company, employee_count_range: value })}
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
                    </CardContent>
                </Card>

                {/* === Section 2: Contact & Location === */}
                <Card className="bg-navy-light border-gold/10">
                    <CardHeader>
                        <CardTitle className="text-cream flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-gold" />
                            الموقع ومعلومات الاتصال
                        </CardTitle>
                        <CardDescription className="text-cream-dark/40">
                            بيانات العنوان والتواصل — محفوظة من التسجيل
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Emirate & City */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-cream-dark/70">الإمارة</Label>
                                <Select
                                    value={company.emirate || ''}
                                    onValueChange={(value) => setCompany({ ...company, emirate: value })}
                                >
                                    <SelectTrigger className="bg-navy border-gold/15 text-cream">
                                        <SelectValue placeholder="اختر الإمارة" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-navy-light border-gold/15">
                                        {emirates.map((em) => (
                                            <SelectItem key={em.value} value={em.value} className="text-cream hover:bg-navy-lighter">
                                                {em.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city" className="text-cream-dark/70">المدينة</Label>
                                <Input
                                    id="city"
                                    value={company.city || ''}
                                    onChange={(e) => setCompany({ ...company, city: e.target.value })}
                                    placeholder="مثال: المنطقة الحرة - جبل علي"
                                    className="bg-navy border-gold/15 text-cream"
                                />
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-cream-dark/70">العنوان</Label>
                            <Input
                                id="address"
                                value={company.address || ''}
                                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                                placeholder="العنوان الكامل"
                                className="bg-navy border-gold/15 text-cream"
                            />
                        </div>

                        {/* Phone & Website */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-cream-dark/70 flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    رقم الهاتف
                                </Label>
                                <Input
                                    id="phone"
                                    value={company.phone || ''}
                                    onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                                    placeholder="+971 XX XXX XXXX"
                                    className="bg-navy border-gold/15 text-cream"
                                />
                            </div>
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
                        </div>

                        {/* LinkedIn */}
                        <div className="space-y-2">
                            <Label htmlFor="linkedin" className="text-cream-dark/70 flex items-center gap-2">
                                <Linkedin className="h-4 w-4" />
                                صفحة LinkedIn
                            </Label>
                            <Input
                                id="linkedin"
                                type="url"
                                value={company.linkedin_url || ''}
                                onChange={(e) => setCompany({ ...company, linkedin_url: e.target.value })}
                                placeholder="https://linkedin.com/company/yourcompany"
                                className="bg-navy border-gold/15 text-cream"
                            />
                        </div>

                        {/* Contact Person */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contact_name" className="text-cream-dark/70">اسم جهة الاتصال</Label>
                                <Input
                                    id="contact_name"
                                    value={company.contact_person_name || ''}
                                    onChange={(e) => setCompany({ ...company, contact_person_name: e.target.value })}
                                    className="bg-navy border-gold/15 text-cream"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact_title" className="text-cream-dark/70">المسمى الوظيفي</Label>
                                <Input
                                    id="contact_title"
                                    value={company.contact_person_title || ''}
                                    onChange={(e) => setCompany({ ...company, contact_person_title: e.target.value })}
                                    className="bg-navy border-gold/15 text-cream"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* === Section 3: License (Read-only) === */}
                {(company.trade_license_number || company.trade_license_expiry) && (
                    <Card className="bg-navy-light border-gold/10">
                        <CardHeader>
                            <CardTitle className="text-cream flex items-center gap-2">
                                <FileText className="h-5 w-5 text-gold" />
                                بيانات الترخيص
                            </CardTitle>
                            <CardDescription className="text-cream-dark/40">
                                هذه البيانات محفوظة من التسجيل — للتعديل تواصل مع الدعم
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-cream-dark/70">رقم الرخصة التجارية</Label>
                                    <Input
                                        value={company.trade_license_number || ''}
                                        disabled
                                        className="bg-navy/50 border-gold/10 text-cream-dark/60"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-cream-dark/70">تاريخ انتهاء الرخصة</Label>
                                    <Input
                                        value={company.trade_license_expiry || ''}
                                        disabled
                                        className="bg-navy/50 border-gold/10 text-cream-dark/60"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* === Section 4: Logo Upload === */}
                <Card className="bg-navy-light border-gold/10">
                    <CardHeader>
                        <CardTitle className="text-cream flex items-center gap-2">
                            <Upload className="h-5 w-5 text-gold" />
                            شعار الشركة
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="border-2 border-dashed border-gold/15 rounded-lg p-8 text-center hover:border-gold/30 transition-colors cursor-pointer">
                            <Upload className="h-8 w-8 text-cream-dark/20 mx-auto mb-2" />
                            <p className="text-sm text-cream-dark/40">
                                انقر لرفع الشعار (PNG, JPG حتى 2 ميجابايت)
                            </p>
                            <p className="text-xs text-cream-dark/30 mt-1">
                                مقاس موصى به: 200×200 بكسل
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex justify-start">
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
            </form>
        </div>
    )
}
