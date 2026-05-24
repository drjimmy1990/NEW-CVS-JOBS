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

    // --- SUGGESTED JOBS (Bilingual Jaccard skill matching) ---
    const jobTypeLabels: Record<string, string> = {
        full_time: 'دوام كامل',
        part_time: 'دوام جزئي',
        contract: 'عقد',
        remote: 'عن بُعد',
        internship: 'تدريب',
    }

    // Bilingual skill dictionary: Arabic → English canonical form
    const skillAliases: Record<string, string> = {
        // Programming & Frameworks
        'رياكت': 'react', 'ريأكت': 'react', 'react.js': 'react', 'reactjs': 'react',
        'نود': 'node.js', 'نود جي اس': 'node.js', 'nodejs': 'node.js',
        'جافاسكريبت': 'javascript', 'جافا سكريبت': 'javascript', 'js': 'javascript',
        'تايب سكريبت': 'typescript', 'تايبسكريبت': 'typescript', 'ts': 'typescript',
        'بايثون': 'python', 'بيثون': 'python',
        'جافا': 'java',
        'سي شارب': 'c#', 'سي #': 'c#',
        'بي اتش بي': 'php', 'فيو': 'vue', 'فيو جي اس': 'vue', 'vue.js': 'vue', 'vuejs': 'vue',
        'أنجولار': 'angular', 'انجولار': 'angular',
        'نيكست': 'next.js', 'نكست': 'next.js', 'nextjs': 'next.js',
        'فلاتر': 'flutter', 'سويفت': 'swift', 'كوتلن': 'kotlin',
        'لارافل': 'laravel', 'دجانجو': 'django', 'جانجو': 'django',
        // Databases
        'قواعد بيانات': 'databases', 'قواعد البيانات': 'databases',
        'ماي اس كيو ال': 'mysql', 'بوستجرس': 'postgresql', 'بوستقريس': 'postgresql',
        'مونجو': 'mongodb', 'مونقو': 'mongodb', 'mongo': 'mongodb',
        // Cloud & DevOps
        'أمازون': 'aws', 'امازون': 'aws', 'سحابة': 'cloud', 'الحوسبة السحابية': 'cloud',
        'دوكر': 'docker', 'كوبرنيتس': 'kubernetes',
        // Design & UI
        'تصميم': 'design', 'تصميم واجهات': 'ui/ux', 'تجربة المستخدم': 'ux',
        'واجهة المستخدم': 'ui', 'فيجما': 'figma', 'فوتوشوب': 'photoshop',
        'أدوبي': 'adobe', 'ادوبي': 'adobe', 'اليستريتور': 'illustrator',
        // General
        'إدارة المشاريع': 'project management', 'ادارة المشاريع': 'project management',
        'إدارة الفريق': 'team management', 'ادارة الفريق': 'team management',
        'التسويق الرقمي': 'digital marketing', 'تسويق رقمي': 'digital marketing',
        'التسويق': 'marketing', 'تسويق': 'marketing',
        'تحليل البيانات': 'data analysis', 'تحليل بيانات': 'data analysis',
        'الذكاء الاصطناعي': 'ai', 'ذكاء اصطناعي': 'ai', 'artificial intelligence': 'ai',
        'تعلم الآلة': 'machine learning', 'تعلم آلي': 'machine learning', 'ml': 'machine learning',
        'أمن المعلومات': 'cybersecurity', 'امن المعلومات': 'cybersecurity',
        'المبيعات': 'sales', 'مبيعات': 'sales',
        'خدمة العملاء': 'customer service', 'خدمة عملاء': 'customer service',
        'المحاسبة': 'accounting', 'محاسبة': 'accounting',
        'الموارد البشرية': 'hr', 'موارد بشرية': 'hr', 'human resources': 'hr',
        'إدارة الأعمال': 'business management', 'ادارة الاعمال': 'business management',
        'الترجمة': 'translation', 'ترجمة': 'translation',
        'كتابة المحتوى': 'content writing', 'كتابة محتوى': 'content writing',
        'تحسين محركات البحث': 'seo', 'سيو': 'seo',
        'إكسل': 'excel', 'اكسل': 'excel',
        'وورد': 'word', 'باوربوينت': 'powerpoint',
    }

    // Normalize a skill to its canonical English form
    const normalizeSkill = (skill: string): string => {
        const lower = skill.toLowerCase().trim()
        return skillAliases[lower] || lower
    }

    let suggestedJobs: { id: string; title: string; slug: string; companyName: string; location_city: string | null; salary_min: number | null; salary_max: number | null; jobTypeLabel: string; matchPercent: number }[] = []

    const candidateSkills = (candidate?.skills || []).map((s: string) => normalizeSkill(s))

    if (candidateSkills.length > 0) {
        const { data: activeJobs } = await supabase
            .from('jobs')
            .select('id, title, slug, skills_required, job_type, location_city, salary_min, salary_max, companies(name)')
            .eq('status', 'active')
            .limit(50)

        if (activeJobs && activeJobs.length > 0) {
            const candidateSkillSet = new Set(candidateSkills)

            const scored = activeJobs.map((job: any) => {
                const jobSkills = (job.skills_required || []).map((s: string) => normalizeSkill(s))
                const matched = jobSkills.filter((s: string) => candidateSkillSet.has(s)).length
                const union = new Set([...candidateSkillSet, ...jobSkills]).size
                const matchPercent = union > 0 ? Math.round((matched / union) * 100) : 0
                return {
                    id: job.id,
                    title: job.title,
                    slug: job.slug,
                    companyName: job.companies?.name || 'شركة',
                    location_city: job.location_city,
                    salary_min: job.salary_min,
                    salary_max: job.salary_max,
                    jobTypeLabel: jobTypeLabels[job.job_type] || 'دوام كامل',
                    matchPercent,
                }
            })

            suggestedJobs = scored
                .filter(j => j.matchPercent > 0)
                .sort((a, b) => b.matchPercent - a.matchPercent)
                .slice(0, 5)
        }
    }
    
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

                    {/* Recommended Jobs — Real DB matching */}
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
                            {suggestedJobs.length > 0 ? (
                                <div className="space-y-4">
                                    {suggestedJobs.map((job) => (
                                        <Link key={job.id} href={`/jobs/${job.slug}`} className="block">
                                            <div className="p-4 rounded-xl border border-gold/10 bg-navy/50 hover:border-gold/20 transition-colors group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-medium text-gold group-hover:text-gold-light transition-colors">{job.title}</h4>
                                                        <p className="text-sm text-cream-dark/40 mt-0.5">{job.companyName} • {job.location_city || 'الإمارات'}</p>
                                                    </div>
                                                    <Badge className="bg-gold/10 text-gold border-gold/20 font-medium">{job.matchPercent}% مطابقة</Badge>
                                                </div>
                                                <div className="flex items-center gap-4 mt-4 text-xs text-cream-dark/40">
                                                    <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {job.jobTypeLabel}</span>
                                                    {(job.salary_min || job.salary_max) && (
                                                        <span className="flex items-center gap-1.5">
                                                            {job.salary_min ? job.salary_min.toLocaleString() : '—'} - {job.salary_max ? job.salary_max.toLocaleString() : '—'} د.إ
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Sparkles className="h-8 w-8 mx-auto mb-2 text-gold/30" />
                                    <p className="text-cream-dark/50 text-sm">ارفع سيرتك الذاتية لنقترح لك وظائف مطابقة</p>
                                    <Link href="/candidate/cv" className="text-sm text-gold hover:text-gold-light mt-2 inline-block">
                                        ارفع سيرتك الذاتية
                                    </Link>
                                </div>
                            )}
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
                                <div
                                  style={{
                                    width: 44,
                                    height: 24,
                                    borderRadius: 12,
                                    backgroundColor: candidate?.is_public !== false ? '#22c55e' : '#334155',
                                    position: 'relative',
                                    flexShrink: 0,
                                  }}
                                >
                                  <span style={{
                                    position: 'absolute',
                                    top: 2,
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    backgroundColor: 'white',
                                    transition: 'transform 0.2s',
                                    ...(candidate?.is_public !== false
                                      ? { left: 22 }
                                      : { left: 2 }
                                    ),
                                  }} />
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-cream-dark/50">
                                {candidate?.is_public !== false
                                  ? 'ملفك مرئي لأصحاب العمل والمجندين في قاعدة بيانات السير الذاتية.'
                                  : 'ملفك مخفي. لن يظهر في نتائج البحث.'
                                }
                            </p>
                            <Link
                                href="/candidate/settings"
                                className="inline-flex items-center gap-1.5 mt-3 text-xs text-gold hover:text-gold-light transition-colors"
                            >
                                تغيير من الإعدادات
                                <ChevronLeft className="h-3 w-3" />
                            </Link>
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
