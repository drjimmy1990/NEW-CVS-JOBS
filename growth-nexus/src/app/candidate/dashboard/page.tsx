import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Eye, Clock, CheckCircle, ChevronRight, Zap, Download, TrendingUp, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
            trend: '+2 this wk'
        },
        {
            title: 'Interviews',
            value: interviewCount || 0,
            icon: CheckCircle,
            color: 'from-purple-400 to-pink-500',
            bgColor: 'from-purple-500/10 to-pink-500/10',
            trend: '1 pending'
        },
        {
            title: 'Profile Views',
            value: 124, // Mock value
            icon: Eye,
            color: 'from-cyan-400 to-blue-500',
            bgColor: 'from-cyan-500/10 to-blue-500/10',
            trend: '+12% this wk'
        },
        {
            title: 'CV Downloads',
            value: 18, // Mock value
            icon: Download,
            color: 'from-amber-400 to-orange-500',
            bgColor: 'from-amber-500/10 to-orange-500/10',
            trend: '+3 this wk'
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

    // Calculate mock profile completion for now 
    // In production, evaluate fields: avatar, headline, summary, experience, education, skills, cv_url
    let completionPercentage = 45;
    if (candidate?.cv_url) completionPercentage += 25;
    if (candidate?.headline) completionPercentage += 10;
    if (profile?.avatar_url) completionPercentage += 5;
    // ... other fields
    
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 mt-1">
                    Welcome back, {profile?.full_name || 'Candidate'}
                </p>
            </div>

            {/* Profile Completion Widget */}
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-white">Profile Completion</h3>
                                <span className="font-bold text-emerald-400">{completionPercentage}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${completionPercentage}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-slate-400 mt-3">
                                {completionPercentage < 100 
                                    ? "Complete your profile to increase your chances of being noticed by top recruiters." 
                                    : "Outstanding! Your profile is fully complete and ready to impress."}
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-3 min-w-[200px]">
                            {completionPercentage < 100 ? (
                                <Link href="/candidate/cv">
                                    <Button className="w-full bg-white text-slate-900 hover:bg-slate-200">
                                        Update Profile
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <Link href="/jobs">
                                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600">
                                        Find Jobs
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* CV Alert */}
            {!candidate?.cv_url && (
                <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-medium text-white flex items-center gap-2">
                                <Zap className="h-4 w-4 text-emerald-400" />
                                Missing Resume
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Upload your CV to apply for jobs directly with one click.
                            </p>
                        </div>
                        <Link
                            href="/candidate/cv"
                            className="px-4 py-2 shrink-0 rounded-lg border border-emerald-500 text-emerald-500 font-medium hover:bg-emerald-500/10 transition-colors text-sm"
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Recent Applications & Recommended Jobs */}
                <div className="lg:col-span-2 space-y-8">
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

                    {/* Recommended Jobs */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-white flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-amber-500" />
                                Recommended for You
                            </CardTitle>
                            <Link
                                href="/jobs"
                                className="text-sm text-emerald-400 hover:text-emerald-300"
                            >
                                Browse all matches
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Job 1 */}
                                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors cursor-pointer">Senior React Developer</h4>
                                            <p className="text-sm text-slate-400 mt-0.5">TechCorp MEA • Dubai, UAE</p>
                                        </div>
                                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-medium">95% Match</Badge>
                                    </div>
                                    <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Full-time</span>
                                        <span className="flex items-center gap-1.5">20,000 - 30,000 AED</span>
                                    </div>
                                </div>
                                {/* Job 2 */}
                                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:border-slate-700 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-medium text-emerald-400 group-hover:text-emerald-300 transition-colors cursor-pointer">Frontend Technical Lead</h4>
                                            <p className="text-sm text-slate-400 mt-0.5">InnovateX • Abu Dhabi, UAE</p>
                                        </div>
                                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-medium">88% Match</Badge>
                                    </div>
                                    <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Full-time</span>
                                        <span className="flex items-center gap-1.5">25,000 - 35,000 AED</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Visibility & Auto Apply */}
                <div className="space-y-6 mt-8 lg:mt-0">
                    {/* Profile Visibility Toggle */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-white text-base flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-5 w-5 text-cyan-500" />
                                    Profile Visibility
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" defaultChecked />
                                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-400">
                                Allow top employers and recruiters to discover your profile in our CV database.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Auto Apply Service */}
                    <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-indigo-400 text-base flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                Auto Apply Service
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-300">
                                Let our AI assistant apply to 50 matching jobs every month on your behalf.
                            </p>
                            <Button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                                Subscribe — 49 AED/mo
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
