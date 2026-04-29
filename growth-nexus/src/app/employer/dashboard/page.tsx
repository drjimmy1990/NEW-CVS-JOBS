import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
    Briefcase, Users, Eye, TrendingUp, 
    CheckCircle, Calendar, CreditCard, 
    Sparkles, Zap, ArrowUpRight, Star,
    BarChart3, UserCheck, ChevronLeft
} from 'lucide-react'

export default async function EmployerDashboard() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="text-cream">يرجى تسجيل الدخول</div>
    }

    // Get company access (owner or member)
    let companyId = null
    const { data: ownedCo } = await supabase
        .from('companies').select('id').eq('owner_id', user.id).single()
    if (ownedCo) {
        companyId = ownedCo.id
    } else {
        const { data: membership } = await supabase
            .from('company_members').select('company_id')
            .eq('user_id', user.id).eq('status', 'active').single()
        if (membership) companyId = membership.company_id
    }

    const { data: jobs } = companyId ? await supabase
        .from('jobs')
        .select(`
            id, title, slug, status, views_count, applicants_count, is_featured, created_at,
            companies!inner (
                id,
                owner_id,
                name,
                job_credits,
                cv_view_credits
            )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
    : { data: [] }

    const totalJobs = jobs?.length || 0
    const activeJobs = jobs?.filter(j => j.status === 'active').length || 0
    const companyData = (jobs?.[0]?.companies as any) || null
    const companyName = companyData?.name || 'شركتك'
    const jobCredits = companyData?.job_credits || 0

    const jobIds = jobs?.map(j => j.id) || []

    const { count: totalApplications } = jobIds.length > 0
        ? await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .in('job_id', jobIds)
        : { count: 0 }

    const { count: shortlistedCount } = jobIds.length > 0
        ? await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .in('job_id', jobIds)
            .eq('status', 'shortlisted')
        : { count: 0 }

    const { count: interviewCount } = jobIds.length > 0
        ? await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .in('job_id', jobIds)
            .eq('status', 'interview')
        : { count: 0 }

    const stats = [
        {
            title: 'إجمالي الوظائف',
            value: totalJobs,
            icon: Briefcase,
            color: 'text-gold',
            bgColor: 'bg-gold/10',
        },
        {
            title: 'وظائف نشطة',
            value: activeJobs,
            icon: TrendingUp,
            color: 'text-success',
            bgColor: 'bg-success/10',
        },
        {
            title: 'إجمالي المتقدمين',
            value: totalApplications || 0,
            icon: Users,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
        },
        {
            title: 'في القائمة المختصرة',
            value: shortlistedCount || 0,
            icon: UserCheck,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
        },
        {
            title: 'مقابلات',
            value: interviewCount || 0,
            icon: Calendar,
            color: 'text-rose-400',
            bgColor: 'bg-rose-500/10',
        },
        {
            title: 'رصيد الوظائف',
            value: jobCredits,
            icon: CreditCard,
            color: 'text-gold',
            bgColor: 'bg-gold/10',
        },
    ]

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return { label: 'نشطة', className: 'bg-success/20 text-success border-success/20' }
            case 'draft': return { label: 'مسودة', className: 'bg-cream-dark/20 text-cream-dark/60 border-cream-dark/20' }
            default: return { label: 'منتهية', className: 'bg-red-500/20 text-red-400 border-red-500/20' }
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-cream">لوحة التحكم</h1>
                    <p className="text-cream-dark/50 mt-1">
                        مرحباً مجدداً، {companyName}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/employer/jobs/new">
                        <Button className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-navy font-bold">
                            <Briefcase className="me-2 h-4 w-4" />
                            أنشر وظيفة
                        </Button>
                    </Link>
                    <Link href="/pricing">
                        <Button variant="outline" className="border-gold/20 text-cream-dark/60 hover:bg-gold/10 hover:text-gold">
                            <CreditCard className="me-2 h-4 w-4" />
                            شراء رصيد
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Buy Credits Alert (if low) */}
            {jobCredits === 0 && (
                <Card className="bg-gradient-to-r from-gold/10 to-gold/5 border-gold/30">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-medium text-cream flex items-center gap-2">
                                <Zap className="h-4 w-4 text-gold" />
                                لا يوجد رصيد وظائف
                            </h3>
                            <p className="text-sm text-cream-dark/50 mt-1">
                                اشترِ رصيد وظائف لنشر وظائف جديدة والوصول إلى آلاف المرشحين المؤهلين.
                            </p>
                        </div>
                        <Link href="/pricing">
                            <Button className="bg-gold hover:bg-gold-dark text-navy shrink-0 font-bold">
                                شراء رصيد وظائف
                                <ArrowUpRight className="ms-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Stats Grid (6 metrics) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="bg-navy-light border-gold/10">
                        <CardContent className="p-5">
                            <div className={`p-2.5 rounded-xl ${stat.bgColor} w-fit mb-3`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                            <p className="text-2xl font-bold text-cream">{stat.value}</p>
                            <p className="text-xs font-medium text-cream-dark/40 mt-1">{stat.title}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Job Performance Table */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="bg-navy-light border-gold/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-cream flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-gold" />
                                أداء الوظائف
                            </CardTitle>
                            <Link href="/employer/jobs" className="text-sm text-gold hover:text-gold-light">
                                إدارة الكل
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {jobs && jobs.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gold/10 text-xs font-medium text-cream-dark/40 uppercase tracking-wider">
                                                <th className="text-right py-3 pe-4">عنوان الوظيفة</th>
                                                <th className="text-center py-3 px-2">المشاهدات</th>
                                                <th className="text-center py-3 px-2">المتقدمين</th>
                                                <th className="text-center py-3 px-2">الحالة</th>
                                                <th className="text-left py-3 ps-4">إجراء</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {jobs.slice(0, 5).map((job) => {
                                                const status = getStatusBadge(job.status)
                                                return (
                                                <tr key={job.id} className="border-b border-gold/5 last:border-0 group">
                                                    <td className="py-4 pe-4">
                                                        <Link href={`/jobs/${job.slug}`} className="text-cream font-medium group-hover:text-gold transition-colors">
                                                            {job.title}
                                                        </Link>
                                                        <p className="text-xs text-cream-dark/40 mt-0.5">
                                                            نُشرت {new Date(job.created_at).toLocaleDateString('ar-AE')}
                                                        </p>
                                                    </td>
                                                    <td className="text-center py-4 px-2">
                                                        <span className="text-cream-dark font-medium">{job.views_count || 0}</span>
                                                    </td>
                                                    <td className="text-center py-4 px-2">
                                                        <span className="text-cream-dark font-medium">{job.applicants_count || 0}</span>
                                                    </td>
                                                    <td className="text-center py-4 px-2">
                                                        <Badge className={status.className}>
                                                            {status.label}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-left py-4 ps-4">
                                                        {!job.is_featured && job.status === 'active' && (
                                                            <button className="text-xs text-gold hover:text-gold-light border border-gold/20 px-2 py-1 rounded-md hover:bg-gold/10 transition-colors font-medium">
                                                                <Star className="h-3 w-3 inline me-1" />
                                                                ترقية
                                                            </button>
                                                        )}
                                                        {job.is_featured && (
                                                            <Badge className="bg-gold/20 text-gold border-gold/20">
                                                                <Star className="h-3 w-3 me-1 inline" />
                                                                مميزة
                                                            </Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Briefcase className="h-12 w-12 text-cream-dark/20 mx-auto mb-3" />
                                    <p className="text-cream-dark/50 mb-2">لم تُنشر وظائف بعد</p>
                                    <Link href="/employer/jobs/new">
                                        <Button className="bg-gold hover:bg-gold-dark text-navy mt-2 font-bold">
                                            أنشر أول وظيفة
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Smart Candidate Suggestions + Quick Actions */}
                <div className="space-y-6">
                    {/* Smart Candidate Suggestions */}
                    <Card className="bg-navy-light border-gold/10">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-cream text-base flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-gold" />
                                مرشحون مقترحون
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Mock Candidates */}
                            <div className="p-3 rounded-xl border border-gold/10 bg-navy/50 hover:border-gold/20 transition-colors group">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-cream font-medium text-sm">سارة ك.</p>
                                        <p className="text-xs text-cream-dark/40">مطورة React أولى • دبي</p>
                                    </div>
                                    <Badge className="bg-success/10 text-success border-success/20 text-xs">92% مطابقة</Badge>
                                </div>
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                    <Badge variant="outline" className="text-[10px] border-gold/20 text-gold py-0">React</Badge>
                                    <Badge variant="outline" className="text-[10px] border-gold/20 text-gold py-0">Next.js</Badge>
                                    <Badge variant="outline" className="text-[10px] border-gold/20 text-gold py-0">TypeScript</Badge>
                                </div>
                                <Button variant="outline" size="sm" className="w-full mt-3 border-gold/20 text-gold hover:bg-gold/10 text-xs h-8">
                                    دعوة للتقديم
                                </Button>
                            </div>

                            <div className="p-3 rounded-xl border border-gold/10 bg-navy/50 hover:border-gold/20 transition-colors group">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-cream font-medium text-sm">محمد أ.</p>
                                        <p className="text-xs text-cream-dark/40">مهندس Full Stack • أبوظبي</p>
                                    </div>
                                    <Badge className="bg-success/10 text-success border-success/20 text-xs">87% مطابقة</Badge>
                                </div>
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                    <Badge variant="outline" className="text-[10px] border-gold/20 text-gold py-0">Node.js</Badge>
                                    <Badge variant="outline" className="text-[10px] border-gold/20 text-gold py-0">Python</Badge>
                                    <Badge variant="outline" className="text-[10px] border-gold/20 text-gold py-0">AWS</Badge>
                                </div>
                                <Button variant="outline" size="sm" className="w-full mt-3 border-gold/20 text-gold hover:bg-gold/10 text-xs h-8">
                                    دعوة للتقديم
                                </Button>
                            </div>

                            <Link href="/employer/candidates" className="block">
                                <Button variant="ghost" className="w-full text-cream-dark/50 hover:text-cream text-sm">
                                    البحث في قاعدة البيانات
                                    <ChevronLeft className="ms-1 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* CV Database Access Upsell */}
                    <Card className="bg-gradient-to-br from-gold/10 to-gold/5 border-gold/30">
                        <CardContent className="p-5 space-y-3">
                            <h3 className="text-gold font-semibold flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                الوصول لقاعدة السير الذاتية
                            </h3>
                            <p className="text-sm text-cream-dark/60">
                                احصل على وصول غير محدود لأكثر من 12,000 مرشح مؤهل.
                            </p>
                            <Button className="w-full bg-gold hover:bg-gold-dark text-navy font-bold shadow-lg shadow-gold/20">
                                اشترك — 699 د.إ/شهر
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
