import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
    Briefcase, Users, Eye, TrendingUp, 
    CheckCircle, Calendar, CreditCard, 
    Sparkles, Zap, ArrowUpRight, Star,
    BarChart3, UserCheck, ChevronRight
} from 'lucide-react'

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
            id, title, slug, status, views_count, applicants_count, is_featured, created_at,
            companies!inner (
                id,
                owner_id,
                name,
                job_credits,
                cv_view_credits
            )
        `)
        .eq('companies.owner_id', user.id)
        .order('created_at', { ascending: false })

    const totalJobs = jobs?.length || 0
    const activeJobs = jobs?.filter(j => j.status === 'active').length || 0
    const companyData = (jobs?.[0]?.companies as any) || null
    const companyName = companyData?.name || 'Your Company'
    const jobCredits = companyData?.job_credits || 0

    // Get job IDs for application counts
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
            title: 'Total Jobs',
            value: totalJobs,
            icon: Briefcase,
            color: 'from-cyan-400 to-blue-500',
            bgColor: 'from-cyan-500/10 to-blue-500/10',
        },
        {
            title: 'Active Jobs',
            value: activeJobs,
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
            title: 'Shortlisted',
            value: shortlistedCount || 0,
            icon: UserCheck,
            color: 'from-amber-400 to-orange-500',
            bgColor: 'from-amber-500/10 to-orange-500/10',
        },
        {
            title: 'Interviews',
            value: interviewCount || 0,
            icon: Calendar,
            color: 'from-rose-400 to-pink-500',
            bgColor: 'from-rose-500/10 to-pink-500/10',
        },
        {
            title: 'Job Credits',
            value: jobCredits,
            icon: CreditCard,
            color: 'from-indigo-400 to-violet-500',
            bgColor: 'from-indigo-500/10 to-violet-500/10',
        },
    ]

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-slate-400 mt-1">
                        Welcome back, {companyName}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/employer/jobs/new">
                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                            <Briefcase className="mr-2 h-4 w-4" />
                            Post a Job
                        </Button>
                    </Link>
                    <Link href="/pricing">
                        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Buy Credits
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Buy Credits Alert (if low) */}
            {jobCredits === 0 && (
                <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-medium text-white flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-400" />
                                No Job Credits Remaining
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Purchase job credits to post new positions and reach thousands of qualified candidates.
                            </p>
                        </div>
                        <Link href="/pricing">
                            <Button className="bg-amber-500 hover:bg-amber-600 text-white shrink-0">
                                Buy Job Credits
                                <ArrowUpRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Stats Grid (6 metrics) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="bg-slate-900 border-slate-800">
                        <CardContent className="p-5">
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.bgColor} w-fit mb-3`}>
                                <stat.icon className={`h-5 w-5 text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`} style={{color: `var(--tw-gradient-from)`}} />
                            </div>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            <p className="text-xs font-medium text-slate-500 mt-1">{stat.title}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Job Performance Table */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-white flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-cyan-500" />
                                Job Performance
                            </CardTitle>
                            <Link href="/employer/jobs" className="text-sm text-emerald-400 hover:text-emerald-300">
                                Manage all
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {jobs && jobs.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                <th className="text-left py-3 pr-4">Job Title</th>
                                                <th className="text-center py-3 px-2">Views</th>
                                                <th className="text-center py-3 px-2">Applicants</th>
                                                <th className="text-center py-3 px-2">Status</th>
                                                <th className="text-right py-3 pl-4">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {jobs.slice(0, 5).map((job) => (
                                                <tr key={job.id} className="border-b border-slate-800/50 last:border-0 group">
                                                    <td className="py-4 pr-4">
                                                        <Link href={`/jobs/${job.slug}`} className="text-white font-medium group-hover:text-emerald-400 transition-colors">
                                                            {job.title}
                                                        </Link>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            Posted {new Date(job.created_at).toLocaleDateString()}
                                                        </p>
                                                    </td>
                                                    <td className="text-center py-4 px-2">
                                                        <span className="text-slate-300 font-medium">{job.views_count || 0}</span>
                                                    </td>
                                                    <td className="text-center py-4 px-2">
                                                        <span className="text-slate-300 font-medium">{job.applicants_count || 0}</span>
                                                    </td>
                                                    <td className="text-center py-4 px-2">
                                                        <Badge className={
                                                            job.status === 'active' 
                                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' 
                                                            : job.status === 'draft'
                                                            ? 'bg-slate-500/20 text-slate-400 border-slate-500/20'
                                                            : 'bg-red-500/20 text-red-400 border-red-500/20'
                                                        }>
                                                            {job.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-right py-4 pl-4">
                                                        {!job.is_featured && job.status === 'active' && (
                                                            <button className="text-xs text-amber-400 hover:text-amber-300 border border-amber-500/20 px-2 py-1 rounded-md hover:bg-amber-500/10 transition-colors font-medium">
                                                                <Star className="h-3 w-3 inline mr-1" />
                                                                Promote
                                                            </button>
                                                        )}
                                                        {job.is_featured && (
                                                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/20">
                                                                <Star className="h-3 w-3 mr-1 inline" />
                                                                Featured
                                                            </Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Briefcase className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-400 mb-2">No jobs posted yet</p>
                                    <Link href="/employer/jobs/new">
                                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white mt-2">
                                            Post Your First Job
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
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-white text-base flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                Smart Candidate Matches
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Mock Candidates */}
                            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition-colors group">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-white font-medium text-sm">Sarah K.</p>
                                        <p className="text-xs text-slate-500">Senior React Developer • Dubai</p>
                                    </div>
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">92% Match</Badge>
                                </div>
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                    <Badge variant="outline" className="text-[10px] border-cyan-500/20 text-cyan-400 py-0">React</Badge>
                                    <Badge variant="outline" className="text-[10px] border-cyan-500/20 text-cyan-400 py-0">Next.js</Badge>
                                    <Badge variant="outline" className="text-[10px] border-cyan-500/20 text-cyan-400 py-0">TypeScript</Badge>
                                </div>
                                <Button variant="outline" size="sm" className="w-full mt-3 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 text-xs h-8">
                                    Invite to Apply
                                </Button>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition-colors group">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-white font-medium text-sm">Mohammed A.</p>
                                        <p className="text-xs text-slate-500">Full Stack Engineer • Abu Dhabi</p>
                                    </div>
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">87% Match</Badge>
                                </div>
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                    <Badge variant="outline" className="text-[10px] border-cyan-500/20 text-cyan-400 py-0">Node.js</Badge>
                                    <Badge variant="outline" className="text-[10px] border-cyan-500/20 text-cyan-400 py-0">Python</Badge>
                                    <Badge variant="outline" className="text-[10px] border-cyan-500/20 text-cyan-400 py-0">AWS</Badge>
                                </div>
                                <Button variant="outline" size="sm" className="w-full mt-3 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 text-xs h-8">
                                    Invite to Apply
                                </Button>
                            </div>

                            <Link href="/employer/candidates" className="block">
                                <Button variant="ghost" className="w-full text-slate-400 hover:text-white text-sm">
                                    Search Full Database
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* CV Database Access Upsell */}
                    <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                        <CardContent className="p-5 space-y-3">
                            <h3 className="text-indigo-400 font-semibold flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                CV Database Access
                            </h3>
                            <p className="text-sm text-slate-300">
                                Unlock unlimited access to our pool of 12,000+ qualified candidates.
                            </p>
                            <Button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                                Subscribe — 699 AED/mo
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
