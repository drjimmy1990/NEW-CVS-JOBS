import { createClient } from '@/utils/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Building2, Briefcase, CreditCard, FileText, TrendingUp } from 'lucide-react'

export default async function AdminDashboard() {
    const supabase = await createClient()

    const [
        { count: usersCount },
        { count: companiesCount },
        { count: jobsCount },
        { count: appsCount },
        { count: txCount },
        { count: activeJobsCount },
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ])

    // Recent users
    const { data: recentUsers } = await supabase
        .from('profiles').select('full_name, email, role, created_at')
        .order('created_at', { ascending: false }).limit(5)

    const stats = [
        { label: 'إجمالي المستخدمين', value: usersCount || 0, icon: Users, color: 'text-blue-400' },
        { label: 'الشركات', value: companiesCount || 0, icon: Building2, color: 'text-gold' },
        { label: 'إجمالي الوظائف', value: jobsCount || 0, icon: Briefcase, color: 'text-purple-400' },
        { label: 'الوظائف النشطة', value: activeJobsCount || 0, icon: TrendingUp, color: 'text-success' },
        { label: 'الطلبات', value: appsCount || 0, icon: FileText, color: 'text-cyan-400' },
        { label: 'المعاملات', value: txCount || 0, icon: CreditCard, color: 'text-orange-400' },
    ]

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-cream">لوحة تحكم الإدارة</h1>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats.map(s => (
                    <Card key={s.label} className="bg-navy-light border-gold/10">
                        <CardContent className="p-6">
                            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                            <p className="text-2xl font-bold text-cream">{s.value}</p>
                            <p className="text-sm text-cream-dark/50">{s.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Users */}
            <Card className="bg-navy-light border-gold/10">
                <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-cream mb-4">آخر المسجلين</h2>
                    <div className="space-y-3">
                        {recentUsers?.map((u, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-gold/5 last:border-0">
                                <div>
                                    <p className="text-cream text-sm font-medium">{u.full_name || 'بدون اسم'}</p>
                                    <p className="text-cream-dark/40 text-xs">{u.email}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'employer' ? 'bg-gold/15 text-gold' : u.role === 'admin' ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/15 text-blue-400'}`}>
                                        {u.role === 'employer' ? 'صاحب عمل' : u.role === 'admin' ? 'مدير' : 'مرشح'}
                                    </span>
                                    <span className="text-cream-dark/30 text-xs">{new Date(u.created_at).toLocaleDateString('ar-AE')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
