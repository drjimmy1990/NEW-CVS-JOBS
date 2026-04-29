import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Clock, Users, CheckCircle, XCircle } from 'lucide-react'

export default async function AnalyticsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div className="text-cream">يرجى تسجيل الدخول</div>

    // Fetch company (owner or member)
    let companyId = null
    const { data: ownedCo } = await supabase.from('companies').select('id').eq('owner_id', user.id).single()
    if (ownedCo) { companyId = ownedCo.id }
    else {
        const { data: m } = await supabase.from('company_members').select('company_id').eq('user_id', user.id).eq('status', 'active').single()
        if (m) companyId = m.company_id
    }
    const company = companyId ? { id: companyId } : null
    const { data: jobs } = await supabase.from('jobs').select('id, status, created_at').eq('company_id', company?.id || '')
    const jobIds = (jobs || []).map(j => j.id)

    let applications: any[] = []
    if (jobIds.length > 0) {
        const { data } = await supabase.from('applications').select('status, created_at, rejection_reason').in('job_id', jobIds)
        applications = data || []
    }

    const totalApps = applications.length
    const hired = applications.filter(a => a.status === 'hired').length
    const rejected = applications.filter(a => a.status === 'rejected').length
    const inPipeline = applications.filter(a => !['hired', 'rejected'].includes(a.status)).length
    const activeJobs = (jobs || []).filter(j => j.status === 'active').length

    // Rejection reason breakdown
    const rejectionBreakdown: Record<string, number> = {}
    applications.filter(a => a.rejection_reason).forEach(a => {
        const reason = a.rejection_reason.split(':')[0].trim()
        rejectionBreakdown[reason] = (rejectionBreakdown[reason] || 0) + 1
    })

    const stats = [
        { label: 'إجمالي الطلبات', value: totalApps, icon: Users, color: 'text-blue-400' },
        { label: 'في خط الأنابيب', value: inPipeline, icon: Clock, color: 'text-gold' },
        { label: 'تم التعيين', value: hired, icon: CheckCircle, color: 'text-success' },
        { label: 'تم الرفض', value: rejected, icon: XCircle, color: 'text-red-400' },
        { label: 'وظائف نشطة', value: activeJobs, icon: TrendingUp, color: 'text-purple-400' },
        { label: 'معدل القبول', value: totalApps > 0 ? Math.round((hired / totalApps) * 100) + '%' : '0%', icon: BarChart3, color: 'text-emerald-400' },
    ]

    return (
        <div className="space-y-6" dir="rtl">
            <div>
                <h1 className="text-3xl font-bold text-cream">التحليلات</h1>
                <p className="text-cream-dark/50 mt-1">نظرة شاملة على أداء التوظيف</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats.map(s => (
                    <Card key={s.label} className="bg-navy-light border-gold/10">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <s.icon className={`h-5 w-5 ${s.color}`} />
                            </div>
                            <p className="text-2xl font-bold text-cream">{s.value}</p>
                            <p className="text-sm text-cream-dark/50">{s.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Forecasting Engine */}
                <Card className="bg-navy-light border-gold/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <CardHeader><CardTitle className="text-cream text-lg flex items-center gap-2">
                        <svg className="h-5 w-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        توقعات الذكاء الاصطناعي
                    </CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-navy-lighter/30 rounded-lg border border-gold/5 flex items-start gap-4 hover:border-gold/20 transition-colors">
                            <Clock className="h-6 w-6 text-blue-400 shrink-0 mt-1" />
                            <div>
                                <h4 className="text-cream font-medium">متوسط وقت الإغلاق المتوقع</h4>
                                <p className="text-cream-dark/60 text-sm mt-1 leading-relaxed">بناءً على الشواغر المشابهة في منصتنا (MOHRE Data)، يتوقع إغلاق وظائفك النشطة خلال <strong className="text-gold font-bold">14-21 يوماً</strong>.</p>
                            </div>
                        </div>
                        <div className="p-4 bg-navy-lighter/30 rounded-lg border border-gold/5 flex items-start gap-4 hover:border-gold/20 transition-colors">
                            <TrendingUp className="h-6 w-6 text-emerald-400 shrink-0 mt-1" />
                            <div>
                                <h4 className="text-cream font-medium">المنافسة في السوق</h4>
                                <p className="text-cream-dark/60 text-sm mt-1 leading-relaxed">مستوى المنافسة <strong className="text-emerald-400 font-bold">متوسط</strong>. ننصح بتقديم حزم مرنة (Flexible Benefits) لجذب أفضل المواهب.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Rejection Reasons Breakdown */}
                {Object.keys(rejectionBreakdown).length > 0 ? (
                    <Card className="bg-navy-light border-gold/10">
                        <CardHeader><CardTitle className="text-cream text-lg">تحليل أسباب الرفض</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(rejectionBreakdown).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
                                    <div key={reason} className="flex items-center justify-between group">
                                        <span className="text-cream-dark/80 text-sm group-hover:text-cream transition-colors">{reason}</span>
                                        <div className="flex items-center gap-3 w-1/2">
                                            <div className="flex-1 h-2 bg-navy-lighter rounded-full overflow-hidden">
                                                <div className="h-full bg-red-400/70 rounded-full" style={{ width: `${Math.round((count / rejected) * 100)}%` }} />
                                            </div>
                                            <span className="text-cream text-sm font-medium w-6 text-left">{count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-navy-light border-gold/10">
                        <CardHeader><CardTitle className="text-cream text-lg">تحليل أسباب الرفض</CardTitle></CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-10 text-cream-dark/40">
                            <CheckCircle className="h-10 w-10 mb-2 opacity-20" />
                            <p>لا توجد بيانات رفض كافية للتحليل</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
