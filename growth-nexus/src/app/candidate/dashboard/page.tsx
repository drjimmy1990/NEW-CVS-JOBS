import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Eye, Clock, CheckCircle, ChevronLeft, Zap, Download, TrendingUp, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function CandidateDashboard() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    const { data: candidate } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', user?.id)
        .single()

    const { data: applications } = await supabase
        .from('applications')
        .select(`
      *,
      jobs (
        title,
        company_id,
        companies (name)
      )
    `)
        .eq('candidate_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)

    const { count: totalApplications } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('candidate_id', user?.id)

    const { count: interviewCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('candidate_id', user?.id)
        .eq('status', 'interview')

    const profileViews = (candidate as any)?.profile_views_count || 0

    const stats = [
        {
            title: 'إجمالي الطلبات',
            value: totalApplications || 0,
            icon: Briefcase,
            color: 'text-gold',
            bgColor: 'bg-gold/10',
        },
        {
            title: 'المقابلات',
            value: interviewCount || 0,
            icon: CheckCircle,
            color: 'text-success',
            bgColor: 'bg-success/10',
        },
        {
            title: 'مشاهدات الملف',
            value: profileViews,
            icon: Eye,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
        },
    ]

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'applied': return { label: 'تم التقديم', className: 'bg-cream-dark/20 text-cream-dark/60' }
            case 'reviewing': return { label: 'قيد المراجعة', className: 'bg-blue-500/20 text-blue-400' }
            case 'interview': return { label: 'مقابلة', className: 'bg-gold/20 text-gold' }
            case 'shortlisted': return { label: 'قائمة مختصرة', className: 'bg-success/20 text-success' }
            case 'rejected': return { label: 'مرفوض', className: 'bg-red-500/20 text-red-400' }
            case 'hired': return { label: 'مُعيّن', className: 'bg-success/20 text-success' }
            default: return { label: status, className: 'bg-cream-dark/20 text-cream-dark/60' }
        }
    }

    let completionPercentage = 45;
    if (candidate?.cv_url) completionPercentage += 25;
    if (candidate?.headline) completionPercentage += 10;
    if (profile?.avatar_url) completionPercentage += 5;
    
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-cream">لوحة التحكم</h1>
                <p className="text-cream-dark/50 mt-1">
                    مرحباً مجدداً، {profile?.full_name || 'باحث عن عمل'}
                </p>
            </div>

            {/* Profile Completion Widget */}
            <Card className="bg-navy-light border-gold/10">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-cream">اكتمال الملف الشخصي</h3>
                                <span className="font-bold text-gold">{completionPercentage}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-navy-lighter rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${completionPercentage}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-cream-dark/50 mt-3">
                                {completionPercentage < 100 
                                    ? "أكمل ملفك الشخصي لزيادة فرصك في أن يلاحظك أفضل المجندين." 
                                    : "ممتاز! ملفك الشخصي مكتمل وجاهز."}
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-3 min-w-[200px]">
                            {completionPercentage < 100 ? (
                                <Link href="/candidate/cv">
                                    <Button className="w-full bg-gold hover:bg-gold-dark text-navy font-bold">
                                        تحديث الملف
                                        <ChevronLeft className="ms-1 h-4 w-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <Link href="/jobs">
                                    <Button className="w-full bg-gradient-to-r from-gold to-gold-light text-navy hover:from-gold-dark hover:to-gold font-bold">
                                        ابحث عن وظائف
                                        <ChevronLeft className="ms-1 h-4 w-4" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* CV Alert */}
            {!candidate?.cv_url && (
                <Card className="bg-gradient-to-r from-gold/10 to-gold/5 border-gold/30">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-medium text-cream flex items-center gap-2">
                                <Zap className="h-4 w-4 text-gold" />
                                سيرة ذاتية مفقودة
                            </h3>
                            <p className="text-sm text-cream-dark/50 mt-1">
                                ارفع سيرتك الذاتية لتتمكن من التقديم على الوظائف مباشرة بنقرة واحدة.
                            </p>
                        </div>
                        <Link
                            href="/candidate/cv"
                            className="px-4 py-2 shrink-0 rounded-lg border border-gold text-gold font-medium hover:bg-gold/10 transition-colors text-sm"
                        >
                            ارفع سيرتك الذاتية
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="bg-navy-light border-gold/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-cream-dark/50">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-cream">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Recent Applications & Recommended Jobs */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="bg-navy-light border-gold/10">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-cream">آخر الطلبات</CardTitle>
                            <Link
                                href="/candidate/applications"
                                className="text-sm text-gold hover:text-gold-light"
                            >
                                عرض الكل
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {applications && applications.length > 0 ? (
                                <div className="space-y-4">
                                    {applications.map((app: any) => {
                                        const statusInfo = getStatusInfo(app.status)
                                        return (
                                        <div
                                            key={app.id}
                                            className="flex items-center justify-between p-4 rounded-lg bg-navy/50 border border-gold/10"
                                        >
                                            <div>
                                                <h4 className="font-medium text-cream">{app.jobs?.title}</h4>
                                                <p className="text-sm text-cream-dark/40">{app.jobs?.companies?.name}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge className={statusInfo.className}>
                                                    {statusInfo.label}
                                                </Badge>
                                                <span className="text-xs text-cream-dark/30 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(app.created_at).toLocaleDateString('ar-AE')}
                                                </span>
                                            </div>
                                        </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Briefcase className="h-12 w-12 text-cream-dark/20 mx-auto mb-3" />
                                    <p className="text-cream-dark/50">لا توجد طلبات بعد</p>
                                    <Link
                                        href="/jobs"
                                        className="text-sm text-gold hover:text-gold-light mt-2 inline-block"
                                    >
                                        تصفح الوظائف للبدء
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recommended Jobs */}
                    <Card className="bg-navy-light border-gold/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-cream flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-gold" />
                                وظائف مقترحة لك
                            </CardTitle>
                            <Link
                                href="/jobs"
                                className="text-sm text-gold hover:text-gold-light"
                            >
                                عرض جميع المطابقات
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Job 1 */}
                                <div className="p-4 rounded-xl border border-gold/10 bg-navy/50 hover:border-gold/20 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-medium text-gold group-hover:text-gold-light transition-colors cursor-pointer">مطور React أول</h4>
                                            <p className="text-sm text-cream-dark/40 mt-0.5">TechCorp MEA • دبي، الإمارات</p>
                                        </div>
                                        <Badge className="bg-gold/10 text-gold border-gold/20 font-medium">95% مطابقة</Badge>
                                    </div>
                                    <div className="flex items-center gap-4 mt-4 text-xs text-cream-dark/40">
                                        <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> دوام كامل</span>
                                        <span className="flex items-center gap-1.5">20,000 - 30,000 د.إ</span>
                                    </div>
                                </div>
                                {/* Job 2 */}
                                <div className="p-4 rounded-xl border border-gold/10 bg-navy/50 hover:border-gold/20 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-medium text-gold group-hover:text-gold-light transition-colors cursor-pointer">قائد فريق Frontend</h4>
                                            <p className="text-sm text-cream-dark/40 mt-0.5">InnovateX • أبوظبي، الإمارات</p>
                                        </div>
                                        <Badge className="bg-gold/10 text-gold border-gold/20 font-medium">88% مطابقة</Badge>
                                    </div>
                                    <div className="flex items-center gap-4 mt-4 text-xs text-cream-dark/40">
                                        <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> دوام كامل</span>
                                        <span className="flex items-center gap-1.5">25,000 - 35,000 د.إ</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Visibility & Auto Apply */}
                <div className="space-y-6 mt-8 lg:mt-0">
                    {/* Profile Visibility Toggle */}
                    <Card className="bg-navy-light border-gold/10">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-cream text-base flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-5 w-5 text-gold" />
                                    ظهور الملف الشخصي
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" defaultChecked />
                                  <div className="w-11 h-6 bg-navy-lighter peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:end-[2px] after:bg-white after:border-cream-dark/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                                </label>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-cream-dark/50">
                                اسمح لأصحاب العمل والمجندين بالعثور على ملفك في قاعدة بيانات السير الذاتية.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Auto Apply Service */}
                    <Card className="bg-gradient-to-br from-gold/10 to-gold/5 border-gold/30">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-gold text-base flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                خدمة التقديم التلقائي
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-cream-dark/60">
                                دع مساعدنا الذكي يتقدم لـ 50 وظيفة مطابقة كل شهر نيابة عنك.
                            </p>
                            <Button className="w-full bg-gold hover:bg-gold-dark text-navy font-bold shadow-lg shadow-gold/20">
                                اشترك — 49 د.إ/شهر
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
