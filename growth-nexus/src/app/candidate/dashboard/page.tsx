import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Eye, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default async function CandidateDashboard() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Get profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    // Get candidate data
    const { data: candidate } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', user?.id)
        .single()

    // Get applications
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

    const stats = [
        {
            title: 'Total Applications',
            value: totalApplications || 0,
            icon: Briefcase,
            color: 'from-emerald-400 to-teal-500',
            bgColor: 'from-emerald-500/10 to-teal-500/10',
        },
        {
            title: 'Interviews',
            value: interviewCount || 0,
            icon: CheckCircle,
            color: 'from-purple-400 to-pink-500',
            bgColor: 'from-purple-500/10 to-pink-500/10',
        },
        {
            title: 'Profile Views',
            value: 0, // TODO: Implement view tracking
            icon: Eye,
            color: 'from-cyan-400 to-blue-500',
            bgColor: 'from-cyan-500/10 to-blue-500/10',
        },
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'applied': return 'bg-slate-500/20 text-slate-400'
            case 'reviewing': return 'bg-blue-500/20 text-blue-400'
            case 'interview': return 'bg-yellow-500/20 text-yellow-400'
            case 'shortlisted': return 'bg-emerald-500/20 text-emerald-400'
            case 'rejected': return 'bg-red-500/20 text-red-400'
            case 'hired': return 'bg-green-500/20 text-green-400'
            default: return 'bg-slate-500/20 text-slate-400'
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 mt-1">
                    Welcome back, {profile?.full_name || 'Candidate'}
                </p>
            </div>

            {/* CV Alert */}
            {!candidate?.cv_url && (
                <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-white">Complete Your Profile</h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Upload your CV to start applying for jobs
                            </p>
                        </div>
                        <Link
                            href="/candidate/cv"
                            className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
                        >
                            Upload CV
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Recent Applications */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white">Recent Applications</CardTitle>
                    <Link
                        href="/candidate/applications"
                        className="text-sm text-emerald-400 hover:text-emerald-300"
                    >
                        View all
                    </Link>
                </CardHeader>
                <CardContent>
                    {applications && applications.length > 0 ? (
                        <div className="space-y-4">
                            {applications.map((app: any) => (
                                <div
                                    key={app.id}
                                    className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                                >
                                    <div>
                                        <h4 className="font-medium text-white">{app.jobs?.title}</h4>
                                        <p className="text-sm text-slate-400">{app.jobs?.companies?.name}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={getStatusColor(app.status)}>
                                            {app.status}
                                        </Badge>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Briefcase className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400">No applications yet</p>
                            <Link
                                href="/jobs"
                                className="text-sm text-emerald-400 hover:text-emerald-300 mt-2 inline-block"
                            >
                                Browse jobs to get started
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
