import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
    ArrowLeft, MapPin, Briefcase, Building2, DollarSign,
    Globe, ExternalLink, Clock, Eye, Lock
} from 'lucide-react'
import { ExternalApplyButton } from '@/components/external/ExternalApplyButton'

interface Props {
    params: Promise<{ slug: string }>
}

const typeLabels: Record<string, string> = {
    full_time: 'دوام كامل',
    part_time: 'دوام جزئي',
    contract: 'عقد',
    remote: 'عن بُعد',
    internship: 'تدريب',
}

const platformLabels: Record<string, string> = {
    linkedin: 'LinkedIn',
    bayt: 'Bayt.com',
    gulftalen: 'GulfTalent',
    indeed: 'Indeed',
    glassdoor: 'Glassdoor',
}

export default async function ExternalJobDetailPage({ params }: Props) {
    const { slug } = await params
    const decodedSlug = decodeURIComponent(slug)
    const supabase = await createClient()

    const { data: job } = await supabase
        .from('external_jobs')
        .select('*')
        .eq('slug', decodedSlug)
        .single()

    if (!job) {
        notFound()
    }

    // Increment view count
    await supabase.rpc('increment_external_job_views', { job_id_input: job.id }).then()

    // Check if user is logged in (for premium gating)
    const { data: { user } } = await supabase.auth.getUser()
    const isLoggedIn = !!user

    // Check premium access
    const isPremiumLocked = job.access_level === 'premium' && !isLoggedIn
    // TODO: check if user has active subscription for premium

    const postedDate = job.posted_at
        ? new Date(job.posted_at).toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' })
        : null

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="container mx-auto px-4 py-8">
                {/* Back Link */}
                <Link
                    href="/jobs"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    العودة للوظائف
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header Card */}
                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="p-8">
                                <div className="flex items-start gap-6">
                                    {/* Company Logo */}
                                    <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                                        {job.company_logo_url ? (
                                            <img src={job.company_logo_url} alt={job.company_name || ''} className="w-full h-full object-cover rounded-2xl" />
                                        ) : (
                                            <Building2 className="h-10 w-10 text-slate-500" />
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <h1 className="text-3xl font-bold text-white">{job.title}</h1>
                                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                <Globe className="h-3 w-3 me-1" />
                                                خارجي — {platformLabels[job.source_platform] || job.source_platform}
                                            </Badge>
                                        </div>

                                        {job.company_name && (
                                            <p className="text-lg text-slate-400 mb-4">{job.company_name}</p>
                                        )}

                                        <div className="flex flex-wrap gap-3">
                                            {job.location_city && (
                                                <span className="flex items-center gap-1.5 text-sm text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {job.location_city}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5 text-sm text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
                                                <Briefcase className="h-3.5 w-3.5" />
                                                {typeLabels[job.job_type] || job.job_type}
                                            </span>
                                            {(job.salary_min || job.salary_max) && (
                                                <span className="flex items-center gap-1.5 text-sm text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
                                                    <DollarSign className="h-3.5 w-3.5" />
                                                    {job.salary_min && job.salary_max
                                                        ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ${job.currency}`
                                                        : job.salary_max
                                                            ? `حتى ${job.salary_max.toLocaleString()} ${job.currency}`
                                                            : `من ${job.salary_min?.toLocaleString()} ${job.currency}`
                                                    }
                                                </span>
                                            )}
                                            {job.experience_level && (
                                                <span className="flex items-center gap-1.5 text-sm text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
                                                    {job.experience_level}
                                                </span>
                                            )}
                                            {postedDate && (
                                                <span className="flex items-center gap-1.5 text-sm text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {postedDate}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Description */}
                        {job.description && (
                            <Card className="bg-slate-900 border-slate-800">
                                <CardContent className="p-8">
                                    <h2 className="text-xl font-bold text-white mb-4">الوصف الوظيفي</h2>
                                    <div
                                        className="text-slate-300 leading-relaxed prose prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: job.description }}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Skills */}
                        {job.skills_required && job.skills_required.length > 0 && (
                            <Card className="bg-slate-900 border-slate-800">
                                <CardContent className="p-8">
                                    <h2 className="text-xl font-bold text-white mb-4">المهارات المطلوبة</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {job.skills_required.map((skill: string, i: number) => (
                                            <Badge key={i} variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-3 py-1.5">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Apply Card */}
                        <Card className="bg-slate-900 border-slate-800 shadow-xl shadow-blue-500/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-md z-10 flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {platformLabels[job.source_platform] || job.source_platform}
                            </div>
                            <CardContent className="p-6 pt-10 text-center flex flex-col items-center">
                                <h3 className="text-xl font-bold text-white mb-2">التقديم عبر الموقع الأصلي</h3>
                                <p className="text-sm text-slate-400 mb-4">
                                    سيتم توجيهك إلى {platformLabels[job.source_platform] || job.source_platform} للتقديم
                                </p>

                                <div className="text-sm text-slate-400 mb-6 flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    <span>{job.views_count || 0} مشاهدة</span>
                                </div>

                                {isPremiumLocked ? (
                                    <div className="w-full space-y-3">
                                        <div className="flex items-center justify-center gap-2 text-gold text-sm">
                                            <Lock className="h-4 w-4" />
                                            <span>متاح للأعضاء المميزين فقط</span>
                                        </div>
                                        <Link href="/pricing" className="block">
                                            <Button className="w-full bg-gradient-to-r from-gold to-gold-light text-navy font-bold">
                                                اشترك الآن
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <ExternalApplyButton
                                        jobId={job.id}
                                        sourceUrl={job.source_url}
                                        platform={platformLabels[job.source_platform] || job.source_platform}
                                    />
                                )}

                                <Separator className="my-4 bg-slate-800" />

                                <p className="text-xs text-slate-500">
                                    هذه الوظيفة منشورة على {platformLabels[job.source_platform] || job.source_platform}. 
                                    GrowthNexus يعرضها كخدمة للمستخدمين.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Source Info */}
                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-bold text-white mb-3">معلومات المصدر</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">المصدر</span>
                                        <span className="text-white">{platformLabels[job.source_platform] || job.source_platform}</span>
                                    </div>
                                    {job.company_name && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">الشركة</span>
                                            <span className="text-white">{job.company_name}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">الموقع</span>
                                        <span className="text-white">{job.location_city || 'غير محدد'}</span>
                                    </div>
                                    {postedDate && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">تاريخ النشر</span>
                                            <span className="text-white">{postedDate}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-10 mt-16">
                <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
                    © 2026 GrowthNexus. جميع الحقوق محفوظة.
                </div>
            </footer>
        </div>
    )
}
