import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Mail, FileText, Calendar, ExternalLink } from 'lucide-react'

const statusColors: Record<string, string> = {
    applied: 'bg-blue-500/20 text-blue-400',
    reviewing: 'bg-yellow-500/20 text-yellow-400',
    interview: 'bg-purple-500/20 text-purple-400',
    shortlisted: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
    hired: 'bg-green-500/20 text-green-400',
}

interface ApplicantsPageProps {
    params: Promise<{ id: string }>
}

export default async function ApplicantsPage({ params }: ApplicantsPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get job details
    const { data: job } = await supabase
        .from('jobs')
        .select(`
            *,
            companies!inner (
                id,
                owner_id,
                name
            )
        `)
        .eq('id', id)
        .eq('companies.owner_id', user.id)
        .single()

    if (!job) {
        redirect('/employer/jobs')
    }

    // Get applications for this job
    const { data: applications } = await supabase
        .from('applications')
        .select(`
            *,
            profiles:candidate_id (
                id,
                full_name,
                email
            ),
            candidates:candidate_id (
                headline,
                skills,
                cv_url
            )
        `)
        .eq('job_id', id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/employer/jobs">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">Applicants</h1>
                    <p className="text-slate-400 mt-1">
                        {job.title} • {applications?.length || 0} applicants
                    </p>
                </div>
            </div>

            {/* Applicants List */}
            {applications && applications.length > 0 ? (
                <div className="space-y-4">
                    {applications.map((app: any) => (
                        <Card key={app.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                            {app.profiles?.full_name?.charAt(0)?.toUpperCase() || 'C'}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-semibold text-white">
                                                    {app.profiles?.full_name || 'Candidate'}
                                                </h3>
                                                <Badge className={statusColors[app.status] || statusColors.applied}>
                                                    {app.status}
                                                </Badge>
                                            </div>

                                            {app.candidates?.headline && (
                                                <p className="text-slate-400 text-sm mb-2">{app.candidates.headline}</p>
                                            )}

                                            <div className="flex items-center gap-4 text-sm text-slate-400">
                                                {app.profiles?.email && (
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {app.profiles.email}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Applied {new Date(app.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {/* Skills */}
                                            {app.candidates?.skills && app.candidates.skills.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {app.candidates.skills.slice(0, 5).map((skill: string, i: number) => (
                                                        <Badge key={i} variant="outline" className="border-slate-600 text-slate-300">
                                                            {skill}
                                                        </Badge>
                                                    ))}
                                                    {app.candidates.skills.length > 5 && (
                                                        <Badge variant="outline" className="border-slate-600 text-slate-400">
                                                            +{app.candidates.skills.length - 5} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {app.candidates?.cv_url && (
                                            <a href={app.candidates.cv_url} target="_blank" rel="noopener noreferrer">
                                                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    View CV
                                                </Button>
                                            </a>
                                        )}
                                        {app.resume_snapshot_url && (
                                            <a href={app.resume_snapshot_url} target="_blank" rel="noopener noreferrer">
                                                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    Application CV
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Cover Letter */}
                                {app.cover_letter && (
                                    <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                                        <h4 className="text-sm font-medium text-slate-300 mb-2">Cover Letter</h4>
                                        <p className="text-slate-400 text-sm whitespace-pre-line">{app.cover_letter}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="py-16 text-center">
                        <User className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No applicants yet</h3>
                        <p className="text-slate-400 mb-6">
                            When candidates apply for this job, they'll appear here
                        </p>
                        <Link href="/employer/jobs">
                            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                                Back to Jobs
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
