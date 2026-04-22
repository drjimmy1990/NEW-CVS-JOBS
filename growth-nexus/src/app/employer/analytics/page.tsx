import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Clock, Users, CheckCircle, XCircle } from 'lucide-react'

export default async function AnalyticsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div className="text-cream">يرجى تسجيل الدخول</div>

    // Fetch company jobs and applications for analytics
    const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user.id).single()
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

            {/* Rejection Reasons Breakdown */}
            {Object.keys(rejectionBreakdown).length > 0 && (
                <Card className="bg-navy-light border-gold/10">
                    <CardHeader><CardTitle className="text-cream text-lg">أسباب الرفض</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(rejectionBreakdown).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
                                <div key={reason} className="flex items-center justify-between">
                                    <span className="text-cream-dark/70 text-sm">{reason}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 h-2 bg-navy-lighter rounded-full overflow-hidden">
                                            <div className="h-full bg-red-400/50 rounded-full" style={{ width: `${Math.round((count / rejected) * 100)}%` }} />
                                        </div>
                                        <span className="text-cream text-sm font-medium w-8 text-left">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
