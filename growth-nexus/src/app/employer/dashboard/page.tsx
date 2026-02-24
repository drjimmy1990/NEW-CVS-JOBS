import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, Users, Eye, TrendingUp } from 'lucide-react'

export default async function EmployerDashboard() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="text-white">Please login</div>
    }

    // Fetch jobs directly by joining to companies where owner_id matches the user
    const { data: jobs } = await supabase
        .from('jobs')
        .select(`
            id,
            status,
            companies!inner (
                id,
                owner_id,
                name,
                job_credits
            )
        `)
        .eq('companies.owner_id', user.id)

    const totalJobs = jobs?.length || 0
    const activeJobs = jobs?.filter(j => j.status === 'active').length || 0
    // Note: companies is a single object when using !inner, not an array
    const companyData = (jobs?.[0]?.companies as any) || null
    const companyName = companyData?.name || 'Your Company'
    const jobCredits = companyData?.job_credits || 0

    // Get job IDs for application count
    const jobIds = jobs?.map(j => j.id) || []

    const { count: totalApplications } = jobIds.length > 0
        ? await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .in('job_id', jobIds)
        : { count: 0 }

    const stats = [
        {
            title: 'Total Jobs Posted',
            value: totalJobs || 0,
            icon: Briefcase,
            color: 'from-cyan-400 to-blue-500',
            bgColor: 'from-cyan-500/10 to-blue-500/10',
        },
        {
            title: 'Active Listings',
            value: activeJobs || 0,
            icon: TrendingUp,
            color: 'from-emerald-400 to-teal-500',
            bgColor: 'from-emerald-500/10 to-teal-500/10',
        },
        {
            title: 'Total Applicants',
            value: totalApplications || 0,
            icon: Users,
            color: 'from-purple-400 to-pink-500',
            bgColor: 'from-purple-500/10 to-pink-500/10',
        },
        {
            title: 'Job Credits',
            value: jobCredits,
            icon: Eye,
            color: 'from-orange-400 to-red-500',
            bgColor: 'from-orange-500/10 to-red-500/10',
        },
    ]

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 mt-1">
                    Welcome back, {companyName}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card
                        key={stat.title}
                        className={`bg-gradient-to-br ${stat.bgColor} border-slate-800`}
                    >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                                <stat.icon className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-white">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/employer/jobs/new"
                        className="p-4 rounded-lg border border-slate-700 hover:border-cyan-500 hover:bg-cyan-500/5 transition-all group"
                    >
                        <Briefcase className="h-8 w-8 text-cyan-400 mb-3" />
                        <h3 className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                            Post a New Job
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                            Create a new job listing
                        </p>
                    </a>
                    <a
                        href="/employer/jobs"
                        className="p-4 rounded-lg border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group"
                    >
                        <Users className="h-8 w-8 text-emerald-400 mb-3" />
                        <h3 className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                            View Candidates
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                            Review applications
                        </p>
                    </a>
                    <a
                        href="/employer/settings"
                        className="p-4 rounded-lg border border-slate-700 hover:border-purple-500 hover:bg-purple-500/5 transition-all group"
                    >
                        <Eye className="h-8 w-8 text-purple-400 mb-3" />
                        <h3 className="font-medium text-white group-hover:text-purple-400 transition-colors">
                            Company Profile
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                            Update your company info
                        </p>
                    </a>
                </CardContent>
            </Card>
        </div>
    )
}
