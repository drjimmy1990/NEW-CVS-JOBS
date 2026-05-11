'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save, Building2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { UAE_ECONOMIC_SECTORS, UAE_EMIRATES, type EmiratisationProfile } from '@/lib/emiratisation-engine'

interface Props {
    profile: Partial<EmiratisationProfile> | null
    companyId: string
    companyDefaults?: Record<string, any> | null
    onSaved: (profile: EmiratisationProfile) => void
}

export function EmiratisationProfileForm({ profile, companyId, companyDefaults, onSaved }: Props) {
    const [saving, setSaving] = useState(false)
    // Pre-fill from saved profile first, then company registration defaults, then empty
    const d = companyDefaults || {}
    const [form, setForm] = useState({
        company_type: profile?.company_type || d.company_type || 'private',
        economic_sector: profile?.economic_sector || d.economic_sector || '',
        emirate: profile?.emirate || d.emirate || '',
        trade_license_number: profile?.trade_license_number || d.trade_license_number || '',
        establishment_number: profile?.establishment_number || '',
        is_mohre_registered: profile?.is_mohre_registered || false,
        uses_nafis: profile?.uses_nafis || false,
        total_employees: profile?.total_employees || d.total_employees || 0,
        skilled_employees: profile?.skilled_employees || 0,
        unskilled_employees: profile?.unskilled_employees || 0,
        current_emiratis: profile?.current_emiratis || 0,
        emiratis_in_skilled: profile?.emiratis_in_skilled || 0,
        new_emiratis_this_year: profile?.new_emiratis_this_year || 0,
        resigned_emiratis_this_year: profile?.resigned_emiratis_this_year || 0,
    })

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/emiratisation/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (res.ok && data.profile) {
                toast.success('تم حفظ بيانات التوطين بنجاح')
                onSaved(data.profile)
            } else {
                toast.error(data.error || 'فشل الحفظ')
            }
        } catch {
            toast.error('حدث خطأ في الاتصال')
        }
        setSaving(false)
    }

    const updateNum = (field: string, value: string) => {
        const num = parseInt(value) || 0
        setForm(prev => ({ ...prev, [field]: num }))
    }

    return (
        <div className="space-y-6">
            {/* Company Info Section */}
            <Card className="bg-navy-light border-gold/10">
                <CardHeader>
                    <CardTitle className="text-cream flex items-center gap-2 text-lg">
                        <Building2 className="h-5 w-5 text-gold" />
                        بيانات الشركة
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Company Type */}
                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">نوع الشركة</Label>
                            <Select value={form.company_type} onValueChange={v => setForm({ ...form, company_type: v })}>
                                <SelectTrigger className="bg-navy border-gold/15 text-cream">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-navy-light border-gold/15">
                                    <SelectItem value="private" className="text-cream hover:bg-navy-lighter">خاصة</SelectItem>
                                    <SelectItem value="semi_government" className="text-cream hover:bg-navy-lighter">شبه حكومية</SelectItem>
                                    <SelectItem value="government" className="text-cream hover:bg-navy-lighter">حكومية</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Economic Sector */}
                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">القطاع الاقتصادي</Label>
                            <Select value={form.economic_sector} onValueChange={v => setForm({ ...form, economic_sector: v })}>
                                <SelectTrigger className="bg-navy border-gold/15 text-cream">
                                    <SelectValue placeholder="اختر القطاع" />
                                </SelectTrigger>
                                <SelectContent className="bg-navy-light border-gold/15 max-h-60">
                                    {UAE_ECONOMIC_SECTORS.map(s => (
                                        <SelectItem key={s} value={s} className="text-cream hover:bg-navy-lighter">{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Emirate */}
                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">الإمارة</Label>
                            <Select value={form.emirate} onValueChange={v => setForm({ ...form, emirate: v })}>
                                <SelectTrigger className="bg-navy border-gold/15 text-cream">
                                    <SelectValue placeholder="اختر الإمارة" />
                                </SelectTrigger>
                                <SelectContent className="bg-navy-light border-gold/15">
                                    {UAE_EMIRATES.map(e => (
                                        <SelectItem key={e} value={e} className="text-cream hover:bg-navy-lighter">{e}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Trade License Number */}
                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">رقم الرخصة التجارية</Label>
                            <Input value={form.trade_license_number} onChange={e => setForm({ ...form, trade_license_number: e.target.value })} placeholder="أدخل رقم الرخصة" className="bg-navy border-gold/15 text-cream" />
                        </div>

                        {/* Establishment Number */}
                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">رقم المنشأة (إن وجد)</Label>
                            <Input value={form.establishment_number} onChange={e => setForm({ ...form, establishment_number: e.target.value })} placeholder="أدخل رقم المنشأة" className="bg-navy border-gold/15 text-cream" />
                        </div>
                    </div>

                    {/* Toggle switches */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-navy/50 border border-gold/5">
                            <Label className="text-cream-dark/70">هل الشركة تابعة لوزارة الموارد البشرية؟</Label>
                            <Switch checked={form.is_mohre_registered} onCheckedChange={v => setForm({ ...form, is_mohre_registered: v })} />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-navy/50 border border-gold/5">
                            <Label className="text-cream-dark/70">هل الشركة تستخدم نافس؟</Label>
                            <Switch checked={form.uses_nafis} onCheckedChange={v => setForm({ ...form, uses_nafis: v })} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Workforce Size Section */}
            <Card className="bg-navy-light border-gold/10">
                <CardHeader>
                    <CardTitle className="text-cream flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5 text-gold" />
                        حجم الشركة والقوى العاملة
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">إجمالي عدد الموظفين</Label>
                            <Input type="number" min="0" value={form.total_employees} onChange={e => updateNum('total_employees', e.target.value)} className="bg-navy border-gold/15 text-cream" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">عدد الموظفين المهاريين (Skilled)</Label>
                            <Input type="number" min="0" value={form.skilled_employees} onChange={e => updateNum('skilled_employees', e.target.value)} className="bg-navy border-gold/15 text-cream" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">عدد الموظفين غير المهاريين</Label>
                            <Input type="number" min="0" value={form.unskilled_employees} onChange={e => updateNum('unskilled_employees', e.target.value)} className="bg-navy border-gold/15 text-cream" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">عدد المواطنين الحاليين</Label>
                            <Input type="number" min="0" value={form.current_emiratis} onChange={e => updateNum('current_emiratis', e.target.value)} className="bg-navy border-gold/15 text-cream" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">عدد المواطنين في الوظائف المهارية</Label>
                            <Input type="number" min="0" value={form.emiratis_in_skilled} onChange={e => updateNum('emiratis_in_skilled', e.target.value)} className="bg-navy border-gold/15 text-cream" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">عدد المواطنين الجدد خلال السنة</Label>
                            <Input type="number" min="0" value={form.new_emiratis_this_year} onChange={e => updateNum('new_emiratis_this_year', e.target.value)} className="bg-navy border-gold/15 text-cream" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">عدد المواطنين المستقيلين خلال السنة</Label>
                            <Input type="number" min="0" value={form.resigned_emiratis_this_year} onChange={e => updateNum('resigned_emiratis_this_year', e.target.value)} className="bg-navy border-gold/15 text-cream" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-start">
                <Button onClick={handleSave} disabled={saving} className="bg-gold hover:bg-gold-dark text-navy font-bold px-8">
                    {saving ? (
                        <><Loader2 className="me-2 h-4 w-4 animate-spin" />جارِ الحفظ...</>
                    ) : (
                        <><Save className="me-2 h-4 w-4" />حفظ بيانات التوطين</>
                    )}
                </Button>
            </div>
        </div>
    )
}
