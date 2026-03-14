'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
    User, 
    Briefcase, 
    GraduationCap, 
    Lightbulb, 
    MapPin, 
    Save,
    Plus,
    Trash2,
    Calendar,
    Building2,
    Image as ImageIcon,
    Loader2,
    X
} from 'lucide-react'
import { toast } from 'sonner'

export default function CandidateProfilePage() {
    const [activeTab, setActiveTab] = useState('personal')
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    // Form States
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        candidate_type: 'emirati',
        residence_emirate: 'دبي',
        family_book_emirate: 'أبوظبي',
        visa_status: '',
        nationality: '',
        headline: '',
    })

    const [experiences, setExperiences] = useState<any[]>([])
    const [education, setEducation] = useState<any[]>([])
    const [skills, setSkills] = useState<string[]>([])
    const [newSkill, setNewSkill] = useState('')
    const [languages, setLanguages] = useState<{ name: string; level: string }[]>([
        { name: 'العربية', level: 'native' },
    ])
    const [preferences, setPreferences] = useState({
        preferred_job_type: 'full_time',
        preferred_location: 'دبي',
        expected_salary: '',
        open_to_remote: false,
    })

    useEffect(() => {
        async function loadProfile() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setUserId(user.id)

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            const { data: candidate } = await supabase
                .from('candidates')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profile) {
                setFormData(prev => ({
                    ...prev,
                    full_name: profile.full_name || '',
                    email: user.email || '',
                    phone: profile.phone || '',
                }))
            }

            if (candidate) {
                setFormData(prev => ({
                    ...prev,
                    candidate_type: candidate.candidate_type || 'emirati',
                    residence_emirate: candidate.residence_emirate || 'دبي',
                    family_book_emirate: candidate.family_book_emirate || '',
                    visa_status: candidate.visa_status || '',
                    nationality: candidate.nationality || '',
                    headline: candidate.headline || '',
                }))
                setSkills(candidate.skills || [])
                setExperiences(candidate.experience || [])
                setEducation(candidate.education || [])
                setLanguages(candidate.languages || [{ name: 'العربية', level: 'native' }])
                setPreferences({
                    preferred_job_type: candidate.preferred_job_type || 'full_time',
                    preferred_location: candidate.preferred_location || 'دبي',
                    expected_salary: candidate.expected_salary || '',
                    open_to_remote: candidate.open_to_remote || false,
                })
            }

            setLoading(false)
        }
        loadProfile()
    }, [])

    const handleSave = async () => {
        if (!userId) return
        setIsSaving(true)

        const supabase = createClient()

        // Update profiles table
        await supabase
            .from('profiles')
            .update({
                full_name: formData.full_name,
                phone: formData.phone,
            })
            .eq('id', userId)

        // Update candidates table
        await supabase
            .from('candidates')
            .update({
                headline: formData.headline,
                candidate_type: formData.candidate_type,
                residence_emirate: formData.residence_emirate,
                family_book_emirate: formData.candidate_type === 'emirati' ? formData.family_book_emirate : null,
                visa_status: formData.candidate_type === 'resident' ? formData.visa_status : null,
                nationality: formData.candidate_type === 'resident' ? formData.nationality : null,
                skills,
                experience: experiences,
                education,
                languages,
                preferred_job_type: preferences.preferred_job_type,
                preferred_location: preferences.preferred_location,
                expected_salary: preferences.expected_salary,
                open_to_remote: preferences.open_to_remote,
            })
            .eq('id', userId)

        toast.success('تم حفظ الملف الشخصي بنجاح')
        setIsSaving(false)
    }

    const addExperience = () => {
        setExperiences(prev => [...prev, { id: Date.now(), title: '', company: '', start: '', end: '', description: '' }])
    }

    const removeExperience = (id: number) => {
        setExperiences(prev => prev.filter(e => e.id !== id))
    }

    const addEducation = () => {
        setEducation(prev => [...prev, { id: Date.now(), degree: '', institution: '', year: '', field: '' }])
    }

    const removeEducation = (id: number) => {
        setEducation(prev => prev.filter(e => e.id !== id))
    }

    const addSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills(prev => [...prev, newSkill.trim()])
            setNewSkill('')
        }
    }

    const removeSkill = (skill: string) => {
        setSkills(prev => prev.filter(s => s !== skill))
    }

    const addLanguage = () => {
        setLanguages(prev => [...prev, { name: '', level: 'beginner' }])
    }

    const tabs = [
        { id: 'personal', label: 'المعلومات الشخصية', icon: User },
        { id: 'experience', label: 'الخبرة', icon: Briefcase },
        { id: 'education', label: 'التعليم', icon: GraduationCap },
        { id: 'skills', label: 'المهارات واللغات', icon: Lightbulb },
        { id: 'preferences', label: 'تفضيلات العمل', icon: MapPin },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-cream">تعديل الملف الشخصي</h1>
                    <p className="text-cream-dark/50 mt-1">
                        أكمل ملفك الشخصي للحصول على توصيات وظائف مخصصة.
                    </p>
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-gold hover:bg-gold-dark text-navy min-w-[120px] font-bold"
                >
                    {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <Save className="me-2 h-4 w-4" />
                            حفظ التغييرات
                        </>
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive 
                                    ? 'bg-navy-lighter text-gold border border-gold/20 shadow-sm shadow-gold/5' 
                                    : 'text-cream-dark/50 hover:bg-navy-lighter/50 hover:text-cream border border-transparent'
                                }`}
                            >
                                <Icon className={`h-5 w-5 ${isActive ? 'text-gold' : 'text-cream-dark/30'}`} />
                                <span className="font-medium text-sm">{tab.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    {/* ==================== PERSONAL INFO TAB ==================== */}
                    {activeTab === 'personal' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Avatar Section */}
                            <Card className="bg-navy-light border-gold/10">
                                <CardContent className="p-6 flex items-center gap-6">
                                    <div className="h-24 w-24 rounded-full bg-navy border-2 border-gold/20 flex flex-col items-center justify-center text-cream-dark/40 overflow-hidden relative group cursor-pointer">
                                        <User className="h-10 w-10 mb-1" />
                                        <span className="text-[10px] font-medium uppercase tracking-wider">صورة</span>
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ImageIcon className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-cream font-medium mb-1">الصورة الشخصية</h3>
                                        <p className="text-sm text-cream-dark/40 mb-4 max-w-sm">
                                            ارفع صورة احترافية لتجعل ملفك مميزاً. الصيغ المدعومة: JPG, PNG.
                                        </p>
                                        <div className="flex gap-3">
                                            <Button size="sm" variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
                                                رفع صورة
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                                                إزالة
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Basic Details */}
                            <Card className="bg-navy-light border-gold/10">
                                <CardHeader>
                                    <CardTitle className="text-cream text-xl">البيانات الأساسية</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-cream-dark/70">العنوان المهني</Label>
                                        <Input 
                                            className="bg-navy border-gold/15 text-cream" 
                                            placeholder="مثال: مطور React أول"
                                            value={formData.headline}
                                            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-cream-dark/70">الاسم الكامل</Label>
                                            <Input 
                                                className="bg-navy border-gold/15 text-cream" 
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-cream-dark/70">البريد الإلكتروني</Label>
                                            <Input className="bg-navy border-gold/15 text-cream" type="email" value={formData.email} disabled />
                                            <p className="text-xs text-cream-dark/30">تواصل مع الدعم لتغيير البريد.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-cream-dark/70">رقم الهاتف</Label>
                                            <Input 
                                                className="bg-navy border-gold/15 text-cream" 
                                                type="tel" 
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Residency & Status */}
                            <Card className="bg-navy-light border-gold/10 overflow-hidden relative">
                                <div className="absolute top-0 start-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl"></div>
                                <CardHeader>
                                    <CardTitle className="text-cream text-xl flex items-center justify-between">
                                        حالة الإقامة
                                        <Badge className="bg-gold/20 text-gold border-gold/30">
                                            {formData.candidate_type === 'emirati' ? 'مواطن إماراتي' : 'مقيم في الإمارات'}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6 relative z-10">
                                    <div className="flex gap-4 p-1 bg-navy rounded-lg inline-flex mb-4 border border-gold/10">
                                        <button 
                                            onClick={() => setFormData({...formData, candidate_type: 'emirati'})}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${formData.candidate_type === 'emirati' ? 'bg-navy-lighter text-gold' : 'text-cream-dark/40 hover:text-cream'}`}
                                        >
                                            مواطن 🇦🇪
                                        </button>
                                        <button 
                                            onClick={() => setFormData({...formData, candidate_type: 'resident'})}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${formData.candidate_type === 'resident' ? 'bg-navy-lighter text-gold' : 'text-cream-dark/40 hover:text-cream'}`}
                                        >
                                            مقيم 🌍
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-cream-dark/70">إمارة الإقامة</Label>
                                            <select 
                                                className="w-full flex h-10 rounded-md border border-gold/15 bg-navy px-3 py-2 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
                                                value={formData.residence_emirate}
                                                onChange={(e) => setFormData({...formData, residence_emirate: e.target.value})}
                                            >
                                                <option>دبي</option>
                                                <option>أبوظبي</option>
                                                <option>الشارقة</option>
                                                <option>عجمان</option>
                                                <option>رأس الخيمة</option>
                                                <option>الفجيرة</option>
                                                <option>أم القيوين</option>
                                            </select>
                                        </div>

                                        {formData.candidate_type === 'emirati' ? (
                                            <div className="space-y-2 animate-in fade-in duration-300">
                                                <Label className="text-gold">إمارة خلاصة القيد</Label>
                                                <select 
                                                    className="w-full flex h-10 rounded-md border border-gold/30 bg-navy px-3 py-2 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
                                                    value={formData.family_book_emirate}
                                                    onChange={(e) => setFormData({...formData, family_book_emirate: e.target.value})}
                                                >
                                                    <option>أبوظبي</option>
                                                    <option>دبي</option>
                                                    <option>الشارقة</option>
                                                    <option>عجمان</option>
                                                    <option>رأس الخيمة</option>
                                                    <option>الفجيرة</option>
                                                    <option>أم القيوين</option>
                                                </select>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-2 animate-in fade-in duration-300">
                                                    <Label className="text-cream-dark/70">حالة التأشيرة</Label>
                                                    <select 
                                                        className="w-full flex h-10 rounded-md border border-gold/15 bg-navy px-3 py-2 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
                                                        value={formData.visa_status}
                                                        onChange={(e) => setFormData({...formData, visa_status: e.target.value})}
                                                    >
                                                        <option value="">اختر حالة التأشيرة</option>
                                                        <option value="employment">تأشيرة عمل</option>
                                                        <option value="golden">التأشيرة الذهبية</option>
                                                        <option value="freelance">تأشيرة حرة</option>
                                                        <option value="tourist">تأشيرة سياحة (أبحث عن عمل)</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2 animate-in fade-in duration-300">
                                                    <Label className="text-cream-dark/70">الجنسية</Label>
                                                    <Input 
                                                        className="bg-navy border-gold/15 text-cream" 
                                                        placeholder="مثال: مصري، أردني..."
                                                        value={formData.nationality}
                                                        onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* ==================== EXPERIENCE TAB ==================== */}
                    {activeTab === 'experience' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-cream">الخبرة العملية</h2>
                                <Button size="sm" onClick={addExperience} className="bg-gold hover:bg-gold-dark text-navy font-bold">
                                    <Plus className="h-4 w-4 me-2" />
                                    إضافة خبرة
                                </Button>
                            </div>

                            {experiences.length === 0 && (
                                <Card className="bg-navy-light border-gold/10 border-dashed">
                                    <CardContent className="p-12 text-center">
                                        <Briefcase className="h-12 w-12 text-cream-dark/20 mx-auto mb-3" />
                                        <p className="text-cream-dark/40">لم تُضف أي خبرة بعد</p>
                                    </CardContent>
                                </Card>
                            )}

                            {experiences.map((exp, idx) => (
                                <Card key={exp.id} className="bg-navy-light border-gold/10 group hover:border-gold/20 transition-colors">
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="mt-1 bg-navy p-2 rounded-lg">
                                                    <Building2 className="h-5 w-5 text-cream-dark/40" />
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-cream-dark/70">المسمى الوظيفي</Label>
                                                        <Input 
                                                            className="bg-navy border-gold/15 text-cream"
                                                            value={exp.title}
                                                            onChange={(e) => {
                                                                const updated = [...experiences]
                                                                updated[idx].title = e.target.value
                                                                setExperiences(updated)
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-cream-dark/70">الشركة</Label>
                                                        <Input 
                                                            className="bg-navy border-gold/15 text-cream"
                                                            value={exp.company}
                                                            onChange={(e) => {
                                                                const updated = [...experiences]
                                                                updated[idx].company = e.target.value
                                                                setExperiences(updated)
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-cream-dark/70">من</Label>
                                                        <Input 
                                                            className="bg-navy border-gold/15 text-cream" 
                                                            placeholder="2020"
                                                            value={exp.start}
                                                            onChange={(e) => {
                                                                const updated = [...experiences]
                                                                updated[idx].start = e.target.value
                                                                setExperiences(updated)
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-cream-dark/70">إلى</Label>
                                                        <Input 
                                                            className="bg-navy border-gold/15 text-cream" 
                                                            placeholder="حتى الآن"
                                                            value={exp.end}
                                                            onChange={(e) => {
                                                                const updated = [...experiences]
                                                                updated[idx].end = e.target.value
                                                                setExperiences(updated)
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => removeExperience(exp.id)}
                                                className="text-cream-dark/30 hover:text-rose-400 hover:bg-rose-500/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* ==================== EDUCATION TAB ==================== */}
                    {activeTab === 'education' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-cream">التعليم</h2>
                                <Button size="sm" onClick={addEducation} className="bg-gold hover:bg-gold-dark text-navy font-bold">
                                    <Plus className="h-4 w-4 me-2" />
                                    إضافة تعليم
                                </Button>
                            </div>

                            {education.length === 0 && (
                                <Card className="bg-navy-light border-gold/10 border-dashed">
                                    <CardContent className="p-12 text-center">
                                        <GraduationCap className="h-12 w-12 text-cream-dark/20 mx-auto mb-3" />
                                        <p className="text-cream-dark/40">لم تُضف أي شهادات بعد</p>
                                    </CardContent>
                                </Card>
                            )}

                            {education.map((edu, idx) => (
                                <Card key={edu.id} className="bg-navy-light border-gold/10 group hover:border-gold/20 transition-colors">
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="mt-1 bg-navy p-2 rounded-lg">
                                                    <GraduationCap className="h-5 w-5 text-cream-dark/40" />
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-cream-dark/70">الدرجة العلمية</Label>
                                                        <select 
                                                            className="w-full flex h-10 rounded-md border border-gold/15 bg-navy px-3 py-2 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
                                                            value={edu.degree}
                                                            onChange={(e) => {
                                                                const updated = [...education]
                                                                updated[idx].degree = e.target.value
                                                                setEducation(updated)
                                                            }}
                                                        >
                                                            <option value="">اختر الدرجة</option>
                                                            <option value="high_school">ثانوية عامة</option>
                                                            <option value="diploma">دبلوم</option>
                                                            <option value="bachelors">بكالوريوس</option>
                                                            <option value="masters">ماجستير</option>
                                                            <option value="phd">دكتوراه</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-cream-dark/70">التخصص</Label>
                                                        <Input 
                                                            className="bg-navy border-gold/15 text-cream"
                                                            placeholder="مثال: هندسة البرمجيات"
                                                            value={edu.field}
                                                            onChange={(e) => {
                                                                const updated = [...education]
                                                                updated[idx].field = e.target.value
                                                                setEducation(updated)
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-cream-dark/70">المؤسسة التعليمية</Label>
                                                        <Input 
                                                            className="bg-navy border-gold/15 text-cream"
                                                            placeholder="مثال: جامعة الإمارات"
                                                            value={edu.institution}
                                                            onChange={(e) => {
                                                                const updated = [...education]
                                                                updated[idx].institution = e.target.value
                                                                setEducation(updated)
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-cream-dark/70">سنة التخرج</Label>
                                                        <Input 
                                                            className="bg-navy border-gold/15 text-cream"
                                                            placeholder="2024"
                                                            value={edu.year}
                                                            onChange={(e) => {
                                                                const updated = [...education]
                                                                updated[idx].year = e.target.value
                                                                setEducation(updated)
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => removeEducation(edu.id)}
                                                className="text-cream-dark/30 hover:text-rose-400 hover:bg-rose-500/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* ==================== SKILLS & LANGUAGES TAB ==================== */}
                    {activeTab === 'skills' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Skills Section */}
                            <Card className="bg-navy-light border-gold/10">
                                <CardHeader>
                                    <CardTitle className="text-cream text-xl">المهارات</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-3">
                                        <Input 
                                            className="bg-navy border-gold/15 text-cream flex-1"
                                            placeholder="اكتب مهارة... (مثال: React, Python)"
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                        />
                                        <Button onClick={addSkill} className="bg-gold hover:bg-gold-dark text-navy font-bold">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((skill) => (
                                            <Badge key={skill} className="bg-gold/10 text-gold border-gold/20 px-3 py-1.5 text-sm gap-2">
                                                {skill}
                                                <button onClick={() => removeSkill(skill)} className="hover:text-red-400 transition-colors">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                        {skills.length === 0 && (
                                            <p className="text-cream-dark/30 text-sm">لم تُضف مهارات بعد — أضف مهاراتك لتحسين مطابقة الوظائف.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Languages Section */}
                            <Card className="bg-navy-light border-gold/10">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-cream text-xl">اللغات</CardTitle>
                                    <Button size="sm" variant="outline" onClick={addLanguage} className="border-gold/20 text-gold hover:bg-gold/10">
                                        <Plus className="h-4 w-4 me-1" />
                                        إضافة لغة
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {languages.map((lang, idx) => (
                                        <div key={idx} className="flex gap-4 items-end">
                                            <div className="flex-1 space-y-2">
                                                <Label className="text-cream-dark/70">اللغة</Label>
                                                <Input 
                                                    className="bg-navy border-gold/15 text-cream"
                                                    value={lang.name}
                                                    onChange={(e) => {
                                                        const updated = [...languages]
                                                        updated[idx].name = e.target.value
                                                        setLanguages(updated)
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <Label className="text-cream-dark/70">المستوى</Label>
                                                <select 
                                                    className="w-full flex h-10 rounded-md border border-gold/15 bg-navy px-3 py-2 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
                                                    value={lang.level}
                                                    onChange={(e) => {
                                                        const updated = [...languages]
                                                        updated[idx].level = e.target.value
                                                        setLanguages(updated)
                                                    }}
                                                >
                                                    <option value="beginner">مبتدئ</option>
                                                    <option value="intermediate">متوسط</option>
                                                    <option value="advanced">متقدم</option>
                                                    <option value="native">لغة أم</option>
                                                </select>
                                            </div>
                                            {idx > 0 && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => setLanguages(prev => prev.filter((_, i) => i !== idx))}
                                                    className="text-cream-dark/30 hover:text-rose-400 mb-0.5"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* ==================== JOB PREFERENCES TAB ==================== */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Card className="bg-navy-light border-gold/10">
                                <CardHeader>
                                    <CardTitle className="text-cream text-xl">تفضيلات العمل</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-cream-dark/70">نوع الوظيفة المفضل</Label>
                                            <select 
                                                className="w-full flex h-10 rounded-md border border-gold/15 bg-navy px-3 py-2 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
                                                value={preferences.preferred_job_type}
                                                onChange={(e) => setPreferences({...preferences, preferred_job_type: e.target.value})}
                                            >
                                                <option value="full_time">دوام كامل</option>
                                                <option value="part_time">دوام جزئي</option>
                                                <option value="contract">عقد</option>
                                                <option value="remote">عن بُعد</option>
                                                <option value="internship">تدريب</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-cream-dark/70">الموقع المفضل</Label>
                                            <select 
                                                className="w-full flex h-10 rounded-md border border-gold/15 bg-navy px-3 py-2 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold"
                                                value={preferences.preferred_location}
                                                onChange={(e) => setPreferences({...preferences, preferred_location: e.target.value})}
                                            >
                                                <option>دبي</option>
                                                <option>أبوظبي</option>
                                                <option>الشارقة</option>
                                                <option>عجمان</option>
                                                <option>رأس الخيمة</option>
                                                <option>أي مكان في الإمارات</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-cream-dark/70">الراتب المتوقع (د.إ شهرياً)</Label>
                                            <Input 
                                                className="bg-navy border-gold/15 text-cream"
                                                placeholder="مثال: 15000"
                                                value={preferences.expected_salary}
                                                onChange={(e) => setPreferences({...preferences, expected_salary: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-cream-dark/70">العمل عن بُعد</Label>
                                            <div className="flex items-center gap-3 mt-2">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={preferences.open_to_remote}
                                                        onChange={(e) => setPreferences({...preferences, open_to_remote: e.target.checked})}
                                                    />
                                                    <div className="w-11 h-6 bg-navy-lighter peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:end-[2px] after:bg-white after:border-cream-dark/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                                                </label>
                                                <span className="text-sm text-cream-dark/50">
                                                    {preferences.open_to_remote ? 'مفتوح للعمل عن بُعد' : 'أفضل العمل من المكتب'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
