'use client'

import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowRight, ArrowLeft, Check, Briefcase, FileText, Eye, X, Sparkles, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { UAE_CITIES, NATIONALITY_OPTIONS } from '@/lib/types'
import type { JobType } from '@/lib/types'

const jobTypes: { value: JobType; label: string }[] = [
    { value: 'full_time', label: 'دوام كامل' },
    { value: 'part_time', label: 'دوام جزئي' },
    { value: 'contract', label: 'عقد مؤقت' },
    { value: 'remote', label: 'عن بعد' },
    { value: 'internship', label: 'تدريب' },
]

const experienceLevels = [
    'مبتدئ',
    'مبتدئ (1-2 سنوات)',
    'متوسط (3-5 سنوات)',
    'خبير (5+ سنوات)',
    'قيادي / مدير',
    'تنفيذي',
]

type JobFormData = {
    title: string
    description: string
    requirements: string
    location: string
    job_type: JobType
    salary_min: string
    salary_max: string
    experience_level: string
    is_confidential: boolean
    is_featured: boolean
    skills: string[]
    nationality_requirements: string[]
}

const initialFormData: JobFormData = {
    title: '',
    description: '',
    requirements: '',
    location: '',
    job_type: 'full_time',
    salary_min: '',
    salary_max: '',
    experience_level: '',
    is_confidential: false,
    is_featured: false,
    skills: [],
    nationality_requirements: ['all'],
}

export default function NewJobPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const [formData, setFormData] = useState<JobFormData>(initialFormData)
    const [skillInput, setSkillInput] = useState('')

    const updateField = (field: keyof JobFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const addSkill = () => {
        const trimmed = skillInput.trim()
        if (trimmed && !formData.skills.includes(trimmed)) {
            updateField('skills', [...formData.skills, trimmed])
            setSkillInput('')
        }
    }

    const removeSkill = (skill: string) => {
        updateField('skills', formData.skills.filter(s => s !== skill))
    }

    const toggleNationality = (value: string) => {
        if (value === 'all') {
            updateField('nationality_requirements', ['all'])
            return
        }
        let current = formData.nationality_requirements.filter(n => n !== 'all')
        if (current.includes(value)) {
            current = current.filter(n => n !== value)
        } else {
            current.push(value)
        }
        updateField('nationality_requirements', current.length === 0 ? ['all'] : current)
    }

    const handleAiAssist = async () => {
        if (!formData.title) {
            toast.error('أدخل المسمى الوظيفي أولاً')
            return
        }
        setAiLoading(true)
        // Simulated AI response - in production this would call an n8n webhook
        setTimeout(() => {
            const aiDescription = `نبحث عن ${formData.title} متميز/ة للانضمام إلى فريقنا. سيكون المرشح/ة مسؤولاً عن تطوير وتنفيذ الحلول التقنية المتقدمة، والعمل مع فريق متعدد التخصصات لتحقيق أهداف الشركة.\n\nالمهام الرئيسية:\n• تطوير وصيانة الأنظمة والتطبيقات\n• التعاون مع الفرق الأخرى لتحقيق الأهداف المشتركة\n• المشاركة في مراجعة الكود وتحسين الجودة\n• تقديم حلول مبتكرة للتحديات التقنية`
            const aiRequirements = `• خبرة لا تقل عن 3 سنوات في المجال\n• إجادة اللغتين العربية والإنجليزية\n• مهارات تواصل ممتازة\n• القدرة على العمل ضمن فريق\n• مهارات حل المشكلات والتفكير التحليلي`
            updateField('description', aiDescription)
            updateField('requirements', aiRequirements)
            setAiLoading(false)
            toast.success('تم توليد الوصف الوظيفي بنجاح!')
        }, 1500)
    }

    const canProceedStep1 = formData.title && formData.job_type && formData.location
    const canProceedStep2 = formData.description && formData.requirements

    const handleSubmit = async (publish: boolean = false) => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) { toast.error('يرجى تسجيل الدخول'); setLoading(false); return }

        let { data: company } = await supabase.from('companies').select('id, job_credits').eq('owner_id', user.id).single()

        if (!company) {
            const fullName = user.user_metadata?.full_name || 'My'
            const companySlug = fullName.toLowerCase().replace(/\s+/g, '-') + '-company-' + Date.now()
            const { data: newCompany, error: companyError } = await supabase
                .from('companies').insert({ owner_id: user.id, name: fullName + "'s Company", slug: companySlug })
                .select('id, job_credits').single()
            if (companyError) { toast.error('فشل إنشاء الشركة: ' + companyError.message); setLoading(false); return }
            company = newCompany
        }

        const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-\u0600-\u06FF]/g, '') + '-' + Date.now()
        const salary_min = formData.salary_min ? parseInt(formData.salary_min, 10) : null
        const salary_max = formData.salary_max ? parseInt(formData.salary_max, 10) : null

        const { error } = await supabase.from('jobs').insert({
            company_id: company.id,
            title: formData.title,
            slug,
            description: formData.description + '\n\nالمتطلبات:\n' + formData.requirements,
            location_city: formData.location,
            job_type: formData.job_type,
            salary_min,
            salary_max,
            currency: 'AED',
            skills_required: formData.skills.length > 0 ? formData.skills : null,
            nationality_requirements: formData.nationality_requirements.includes('all') ? null : formData.nationality_requirements,
            is_confidential: formData.is_confidential,
            is_featured: formData.is_featured,
            status: publish ? 'active' : 'draft',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }).select().single()

        if (error) { toast.error('فشل إنشاء الوظيفة: ' + error.message); setLoading(false); return }
        toast.success(publish ? 'تم نشر الوظيفة بنجاح!' : 'تم حفظ المسودة')
        router.push('/employer/jobs')
    }

    const steps = [
        { number: 1, title: 'المعلومات الأساسية', icon: Briefcase },
        { number: 2, title: 'الوصف والمتطلبات', icon: FileText },
        { number: 3, title: 'المراجعة والنشر', icon: Eye },
    ]

    return (
        <div className="max-w-3xl mx-auto space-y-6" dir="rtl">
            <div>
                <h1 className="text-3xl font-bold text-cream">نشر وظيفة جديدة</h1>
                <p className="text-cream-dark/50 mt-1">أكمل التفاصيل لإنشاء إعلان الوظيفة</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
                {steps.map((s, idx) => (
                    <div key={s.number} className="flex items-center">
                        <div className={`flex items-center gap-2 ${step >= s.number ? 'text-gold' : 'text-cream-dark/30'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${step > s.number ? 'bg-gold border-gold text-navy' : step === s.number ? 'border-gold text-gold' : 'border-cream-dark/20 text-cream-dark/30'}`}>
                                {step > s.number ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                            </div>
                            <span className={`font-medium ${step >= s.number ? 'text-cream' : 'text-cream-dark/30'}`}>{s.title}</span>
                        </div>
                        {idx < steps.length - 1 && <div className={`w-16 h-0.5 mx-4 ${step > s.number ? 'bg-gold' : 'bg-cream-dark/10'}`} />}
                    </div>
                ))}
            </div>
            <Progress value={(step / 3) * 100} className="h-1 bg-navy-lighter" />

            {/* Step 1: Basic Info */}
            {step === 1 && (
                <Card className="bg-navy-light border-gold/10">
                    <CardHeader>
                        <CardTitle className="text-cream">المعلومات الأساسية</CardTitle>
                        <CardDescription className="text-cream-dark/50">أدخل تفاصيل الوظيفة الأساسية</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-cream-dark">المسمى الوظيفي *</Label>
                            <Input value={formData.title} onChange={(e) => updateField('title', e.target.value)} placeholder="مثال: مطور برمجيات أول" className="bg-navy-lighter border-gold/10 text-cream" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-cream-dark">نوع الوظيفة *</Label>
                                <Select value={formData.job_type} onValueChange={(v) => updateField('job_type', v as JobType)}>
                                    <SelectTrigger className="bg-navy-lighter border-gold/10 text-cream"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-navy-light border-gold/10">
                                        {jobTypes.map((type) => (<SelectItem key={type.value} value={type.value} className="text-cream">{type.label}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-cream-dark">المدينة *</Label>
                                <Select value={formData.location} onValueChange={(v) => updateField('location', v)}>
                                    <SelectTrigger className="bg-navy-lighter border-gold/10 text-cream"><SelectValue placeholder="اختر المدينة" /></SelectTrigger>
                                    <SelectContent className="bg-navy-light border-gold/10">
                                        {UAE_CITIES.map((city) => (<SelectItem key={city} value={city} className="text-cream">{city}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-cream-dark">الحد الأدنى للراتب (درهم)</Label>
                                <Input type="number" value={formData.salary_min} onChange={(e) => updateField('salary_min', e.target.value)} placeholder="مثال: 8000" className="bg-navy-lighter border-gold/10 text-cream" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-cream-dark">الحد الأقصى للراتب (درهم)</Label>
                                <Input type="number" value={formData.salary_max} onChange={(e) => updateField('salary_max', e.target.value)} placeholder="مثال: 15000" className="bg-navy-lighter border-gold/10 text-cream" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-cream-dark">المستوى الوظيفي</Label>
                            <Select value={formData.experience_level} onValueChange={(v) => updateField('experience_level', v)}>
                                <SelectTrigger className="bg-navy-lighter border-gold/10 text-cream"><SelectValue placeholder="اختر المستوى" /></SelectTrigger>
                                <SelectContent className="bg-navy-light border-gold/10">
                                    {experienceLevels.map((level) => (<SelectItem key={level} value={level} className="text-cream">{level}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Nationality Requirements */}
                        <div className="space-y-2">
                            <Label className="text-cream-dark">الجنسية المطلوبة</Label>
                            <div className="flex flex-wrap gap-2">
                                {NATIONALITY_OPTIONS.map((opt) => (
                                    <button key={opt.value} type="button" onClick={() => toggleNationality(opt.value)}
                                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${formData.nationality_requirements.includes(opt.value) ? 'bg-gold/20 border-gold text-gold' : 'bg-navy-lighter border-gold/10 text-cream-dark/50 hover:border-gold/30'}`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="space-y-2">
                            <Label className="text-cream-dark">المهارات المطلوبة</Label>
                            <div className="flex gap-2">
                                <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                                    placeholder="أضف مهارة واضغط Enter" className="bg-navy-lighter border-gold/10 text-cream flex-1" />
                                <Button type="button" onClick={addSkill} variant="outline" className="border-gold/20 text-gold hover:bg-gold/10"><Plus className="h-4 w-4" /></Button>
                            </div>
                            {formData.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.skills.map((skill) => (
                                        <Badge key={skill} className="bg-gold/15 text-gold border-gold/20 gap-1">
                                            {skill}
                                            <button type="button" onClick={() => removeSkill(skill)}><X className="h-3 w-3" /></button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Toggles */}
                        <div className="space-y-4 pt-4 border-t border-gold/10">
                            <div className="flex items-center justify-between">
                                <div><Label className="text-cream-dark">إعلان سري</Label><p className="text-sm text-cream-dark/40">إخفاء اسم الشركة عن المتقدمين</p></div>
                                <Switch checked={formData.is_confidential} onCheckedChange={(v) => updateField('is_confidential', v)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div><Label className="text-cream-dark">إعلان مميز</Label><p className="text-sm text-cream-dark/40">تثبيت في أعلى القائمة (يستخدم رصيد مميز)</p></div>
                                <Switch checked={formData.is_featured} onCheckedChange={(v) => updateField('is_featured', v)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Description */}
            {step === 2 && (
                <Card className="bg-navy-light border-gold/10">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-cream">الوصف والمتطلبات</CardTitle>
                                <CardDescription className="text-cream-dark/50">اكتب وصفاً تفصيلياً للوظيفة</CardDescription>
                            </div>
                            <Button onClick={handleAiAssist} disabled={aiLoading || !formData.title} variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
                                {aiLoading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Sparkles className="me-2 h-4 w-4" />}
                                {aiLoading ? 'جاري التوليد...' : 'مساعد AI'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-cream-dark">الوصف الوظيفي *</Label>
                            <Textarea value={formData.description} onChange={(e) => updateField('description', e.target.value)} placeholder="اكتب وصفاً تفصيلياً للوظيفة والمسؤوليات..." rows={8} className="bg-navy-lighter border-gold/10 text-cream resize-none" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-cream-dark">المتطلبات *</Label>
                            <Textarea value={formData.requirements} onChange={(e) => updateField('requirements', e.target.value)} placeholder="اكتب المهارات والمؤهلات والخبرات المطلوبة..." rows={6} className="bg-navy-lighter border-gold/10 text-cream resize-none" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
                <Card className="bg-navy-light border-gold/10">
                    <CardHeader><CardTitle className="text-cream">مراجعة الإعلان</CardTitle><CardDescription className="text-cream-dark/50">تأكد من التفاصيل قبل النشر</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-sm text-cream-dark/50">المسمى الوظيفي</p><p className="text-cream font-medium">{formData.title}</p></div>
                            <div><p className="text-sm text-cream-dark/50">نوع الوظيفة</p><p className="text-cream font-medium">{jobTypes.find(t => t.value === formData.job_type)?.label}</p></div>
                            <div><p className="text-sm text-cream-dark/50">المدينة</p><p className="text-cream font-medium">{formData.location}</p></div>
                            <div><p className="text-sm text-cream-dark/50">الراتب (درهم)</p><p className="text-cream font-medium">{formData.salary_min || '-'} — {formData.salary_max || '-'}</p></div>
                            <div><p className="text-sm text-cream-dark/50">المستوى</p><p className="text-cream font-medium">{formData.experience_level || 'غير محدد'}</p></div>
                            <div>
                                <p className="text-sm text-cream-dark/50">الإعدادات</p>
                                <div className="flex gap-2 mt-1">
                                    {formData.is_confidential && <Badge className="bg-gold/15 text-gold border-gold/20">سري</Badge>}
                                    {formData.is_featured && <Badge className="bg-gold/15 text-gold border-gold/20">مميز</Badge>}
                                    {!formData.is_confidential && !formData.is_featured && <span className="text-cream-dark/40 text-sm">عادي</span>}
                                </div>
                            </div>
                        </div>
                        {formData.skills.length > 0 && (
                            <div className="pt-4 border-t border-gold/10">
                                <p className="text-sm text-cream-dark/50 mb-2">المهارات المطلوبة</p>
                                <div className="flex flex-wrap gap-2">{formData.skills.map(s => <Badge key={s} variant="outline" className="border-gold/20 text-cream-dark">{s}</Badge>)}</div>
                            </div>
                        )}
                        <div className="pt-4 border-t border-gold/10"><p className="text-sm text-cream-dark/50 mb-2">الوصف</p><p className="text-cream-dark whitespace-pre-wrap">{formData.description}</p></div>
                        <div className="pt-4 border-t border-gold/10"><p className="text-sm text-cream-dark/50 mb-2">المتطلبات</p><p className="text-cream-dark whitespace-pre-wrap">{formData.requirements}</p></div>
                    </CardContent>
                </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1} className="border-gold/20 text-cream-dark hover:bg-navy-lighter">
                    <ArrowRight className="me-2 h-4 w-4" />السابق
                </Button>
                {step < 3 ? (
                    <Button onClick={() => setStep(step + 1)} disabled={step === 1 ? !canProceedStep1 : !canProceedStep2} className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-navy font-bold">
                        التالي<ArrowLeft className="ms-2 h-4 w-4" />
                    </Button>
                ) : (
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => handleSubmit(false)} disabled={loading} className="border-gold/20 text-cream-dark hover:bg-navy-lighter">حفظ كمسودة</Button>
                        <Button onClick={() => handleSubmit(true)} disabled={loading} className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-navy font-bold">
                            {loading ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />جاري النشر...</> : <><Check className="me-2 h-4 w-4" />نشر الوظيفة</>}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
