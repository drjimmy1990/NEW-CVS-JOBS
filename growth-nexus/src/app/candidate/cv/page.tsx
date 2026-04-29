'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Upload,
    FileText,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Download,
    Trash2,
    Brain
} from 'lucide-react'
import { toast } from 'sonner'

type ParsedData = {
    skills?: string[]
    experience_years?: number
    education?: string[]
    summary?: string
}

export default function CVPage() {
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [parsing, setParsing] = useState(false)
    const [cvUrl, setCvUrl] = useState<string | null>(null)
    const [parsedData, setParsedData] = useState<ParsedData | null>(null)
    const [cvUpdatedAt, setCvUpdatedAt] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadCandidateData()
    }, [])

    const loadCandidateData = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data: candidate } = await supabase
                .from('candidates')
                .select('cv_url, resume_parsed_data, skills, updated_at')
                .eq('id', user.id)
                .single()

            if (candidate) {
                setCvUrl(candidate.cv_url)
                setParsedData(candidate.resume_parsed_data as ParsedData)
                setCvUpdatedAt(candidate.updated_at)
            }
        }
        setLoading(false)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.type !== 'application/pdf') {
            toast.error('يرجى رفع ملف PDF')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('حجم الملف يجب أن يكون أقل من 10 ميجابايت')
            return
        }

        setUploading(true)
        setUploadProgress(0)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error('يرجى تسجيل الدخول')
            setUploading(false)
            return
        }

        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90))
        }, 200)

        const fileName = `${user.id}/${Date.now()}-${file.name}`
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('resumes')
            .upload(fileName, file, { upsert: true })

        clearInterval(progressInterval)

        if (uploadError) {
            toast.error('فشل الرفع: ' + uploadError.message)
            setUploading(false)
            return
        }

        const { data: urlData } = supabase
            .storage
            .from('resumes')
            .getPublicUrl(fileName)

        const publicUrl = urlData.publicUrl

        const { error: updateError } = await supabase
            .from('candidates')
            .upsert({
                id: user.id,
                cv_url: publicUrl,
                updated_at: new Date().toISOString()
            })

        if (updateError) {
            await supabase.from('candidates').insert({
                id: user.id,
                cv_url: publicUrl
            })
        }

        setUploadProgress(100)
        setCvUrl(publicUrl)
        setCvUpdatedAt(new Date().toISOString())
        toast.success('تم رفع السيرة الذاتية بنجاح!')
        setUploading(false)

        triggerAIParsing(publicUrl, user.id)
    }

    const triggerAIParsing = async (fileUrl: string, userId: string) => {
        setParsing(true)

        try {
            const webhookUrl = process.env.NEXT_PUBLIC_N8N_CV_PARSER_WEBHOOK

            if (!webhookUrl || webhookUrl.includes('your-n8n-domain') || webhookUrl.includes('example.com')) {
                toast.info('تحليل الذكاء الاصطناعي سيكون متاحاً عند تكوين webhook')

                setTimeout(() => {
                    const mockParsed: ParsedData = {
                        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL'],
                        experience_years: 3,
                        education: ['بكالوريوس في علوم الحاسوب'],
                        summary: 'مطور برمجيات ذو خبرة مع تركيز على تقنيات الويب.'
                    }
                    setParsedData(mockParsed)
                    setParsing(false)
                    toast.success('تم تحليل السيرة الذاتية! (وضع تجريبي)')
                }, 2000)
                return
            }

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_url: fileUrl,
                    user_id: userId
                })
            })

            if (response.ok) {
                toast.success('تم تحليل السيرة الذاتية بنجاح!')
                await loadCandidateData()
            } else {
                toast.error('فشل تحليل الذكاء الاصطناعي')
            }
        } catch (error) {
            console.error('AI parsing error:', error)
            toast.error('تحليل الذكاء الاصطناعي غير متاح مؤقتاً')
        } finally {
            setParsing(false)
        }
    }

    const deleteCV = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            await supabase
                .from('candidates')
                .update({ cv_url: null, resume_parsed_data: null })
                .eq('id', user.id)

            setCvUrl(null)
            setParsedData(null)
            setCvUpdatedAt(null)
            toast.success('تم حذف السيرة الذاتية')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-cream">سيرتي الذاتية</h1>
                <p className="text-cream-dark/50 mt-1">
                    ارفع سيرتك الذاتية للاستخراج الذكي للمهارات وإدارة ملفك
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="xl:col-span-2 space-y-6">

            {/* Upload Section */}
            <Card className="bg-navy-light border-gold/10">
                <CardHeader>
                    <CardTitle className="text-cream flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gold" />
                        رفع السيرة الذاتية
                    </CardTitle>
                    <CardDescription className="text-cream-dark/40">
                        ارفع ملف PDF (حد أقصى 10 ميجابايت). سيقوم الذكاء الاصطناعي باستخراج مهاراتك تلقائياً.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!cvUrl ? (
                        <div
                            className="border-2 border-dashed border-gold/15 rounded-lg p-12 text-center hover:border-gold/30 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            {uploading ? (
                                <div className="space-y-4">
                                    <Loader2 className="h-12 w-12 mx-auto text-gold animate-spin" />
                                    <p className="text-cream-dark/60">جارِ الرفع...</p>
                                    <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                                </div>
                            ) : (
                                <>
                                    <Upload className="h-12 w-12 mx-auto text-cream-dark/20 mb-4" />
                                    <p className="text-cream-dark/60 mb-2">
                                        اسحب سيرتك الذاتية هنا أو انقر للتصفح
                                    </p>
                                    <p className="text-sm text-cream-dark/30">
                                        صيغة PDF، حد أقصى 10 ميجابايت
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="border border-success/30 bg-success/5 p-6 rounded-xl relative overflow-hidden group">
                            <div className="absolute top-0 start-0 bg-success text-white text-[10px] font-bold px-2 py-0.5 rounded-be-lg z-10">
                                السيرة النشطة
                            </div>
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-success/20 rounded-xl relative">
                                        <div className="absolute inset-0 bg-success/20 rounded-xl animate-ping opacity-75"></div>
                                        <FileText className="h-8 w-8 text-success relative z-10" />
                                    </div>
                                    <div>
                                        <p className="text-cream font-semibold text-lg">سيرتي_الذاتية.pdf</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-sm text-cream-dark/50 flex items-center gap-1">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                                تم التحقق والتحليل
                                            </span>
                                            {cvUpdatedAt && (
                                                <span className="text-sm text-cream-dark/30">
                                                    تحديث {new Date(cvUpdatedAt).toLocaleDateString('ar-AE')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-gold/15 bg-navy-lighter hover:bg-navy text-cream flex-1 md:flex-none"
                                        onClick={() => window.open(cvUrl || '', '_blank')}
                                    >
                                        <Download className="h-4 w-4 me-2" />
                                        تحميل
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-gold hover:bg-gold-dark text-navy font-bold flex-1 md:flex-none"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-4 w-4 me-2" />
                                        استبدال
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500 hover:text-rose-300"
                                        onClick={deleteCV}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* AI Parsing Status */}
            {parsing && (
                <Card className="bg-gradient-to-r from-purple-500/20 to-gold/20 border-purple-500/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/30 rounded-full animate-pulse">
                                <Brain className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-cream font-medium">الذكاء الاصطناعي يحلل سيرتك...</p>
                                <p className="text-sm text-cream-dark/50">
                                    استخراج المهارات والخبرة والتعليم
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Parsed Skills */}
            {parsedData && (
                <Card className="bg-navy-light border-gold/10">
                    <CardHeader>
                        <CardTitle className="text-cream flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-gold" />
                            الملف المستخرج بالذكاء الاصطناعي
                        </CardTitle>
                        <CardDescription className="text-cream-dark/40">
                            هذه التفاصيل تم استخراجها تلقائياً من سيرتك الذاتية
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {parsedData.skills && parsedData.skills.length > 0 && (
                            <div>
                                <Label className="text-cream-dark/70">المهارات</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {parsedData.skills.map((skill, i) => (
                                        <Badge
                                            key={i}
                                            className="bg-gold/10 text-gold border-gold/30"
                                        >
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {parsedData.experience_years && (
                            <div>
                                <Label className="text-cream-dark/70">الخبرة</Label>
                                <p className="text-cream mt-1">
                                    {parsedData.experience_years} سنوات
                                </p>
                            </div>
                        )}

                        {parsedData.education && parsedData.education.length > 0 && (
                            <div>
                                <Label className="text-cream-dark/70">التعليم</Label>
                                <ul className="mt-1 space-y-1">
                                    {parsedData.education.map((edu, i) => (
                                        <li key={i} className="text-cream">{edu}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {parsedData.summary && (
                            <div>
                                <Label className="text-cream-dark/70">الملخص</Label>
                                <p className="text-cream-dark/60 mt-1">{parsedData.summary}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Tips */}
            <Card className="bg-navy-light/50 border-gold/10">
                <CardContent className="p-6">
                    <h3 className="text-cream font-medium mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-gold" />
                        نصائح لسيرة ذاتية أفضل
                    </h3>
                    <ul className="text-sm text-cream-dark/40 space-y-2">
                        <li>• استخدم تنسيقاً واضحاً واحترافياً</li>
                        <li>• ضع مهاراتك بشكل بارز لتحسين الاستخراج الذكي</li>
                        <li>• أدرج إنجازات محددة بالأرقام</li>
                        <li>• اجعلها مختصرة (صفحة إلى صفحتين كحد أقصى)</li>
                    </ul>
                </CardContent>
            </Card>
            </div>

            {/* Sidebar Upsells */}
            <div className="space-y-6 mt-8 xl:mt-0">
                {/* Profile Boost Upsell */}
                <Card className="bg-gradient-to-b from-gold/10 to-gold/5 border-gold/30 overflow-hidden relative">
                    <div className="absolute top-0 start-0 bg-gold text-navy text-xs font-bold px-3 py-1 rounded-be-lg z-10">
                        الأكثر طلباً
                    </div>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-gold text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            تعزيز الملف الشخصي
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-cream-dark/60">
                            اجعل ملفك يظهر في أعلى نتائج بحث مسؤولي التوظيف.
                        </p>
                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gold/30 bg-gold/10 hover:border-gold hover:bg-gold/20 transition-colors text-right group">
                                <div className="flex flex-col">
                                    <span className="text-cream font-medium group-hover:text-gold transition-colors">تعزيز 7 أيام</span>
                                    <span className="text-xs text-gold/80">3 أضعاف مشاهدات الملف</span>
                                </div>
                                <span className="font-bold text-gold">29 د.إ</span>
                            </button>
                            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-gold/15 bg-navy-lighter/50 hover:border-gold/30 hover:bg-navy-lighter transition-colors text-right group">
                                <div className="flex flex-col">
                                    <span className="text-cream font-medium group-hover:text-gold transition-colors">تعزيز 30 يوم</span>
                                    <span className="text-xs text-cream-dark/40">أفضل قيمة للوصول الأوسع</span>
                                </div>
                                <span className="font-bold text-cream">79 د.إ</span>
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Professional CV Review */}
                <Card className="bg-gradient-to-br from-gold/10 to-navy-lighter border-gold/20">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-gold text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            مراجعة احترافية
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-cream-dark/60">
                            دع خبراءنا يراجعون سيرتك الذاتية ويعيدون كتابتها لتجاوز أنظمة ATS.
                        </p>
                        <ul className="text-sm text-cream-dark/50 space-y-2 mb-6">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-gold" />
                                تحسين لأنظمة ATS
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-gold" />
                                خطاب تقديم مخصص
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-gold" />
                                تسليم خلال 24 ساعة
                            </li>
                        </ul>
                        <Button className="w-full bg-gold hover:bg-gold-dark text-navy font-bold shadow-lg shadow-gold/20">
                            مراجعة احترافية — 199 د.إ
                        </Button>
                    </CardContent>
                </Card>
            </div>
            </div>
        </div>
    )
}
