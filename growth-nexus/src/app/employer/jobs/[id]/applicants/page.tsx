import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ApplicantsList } from '@/components/employer/ApplicantsList'

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
    const { data: applications, error: appError } = await supabase
        .from('applications')
        .select(`
            *,
            candidates:candidate_id (
                id,
                headline,
                skills,
                cv_url,
                resume_parsed_data
            )
        `)
        .eq('job_id', id)
        .order('created_at', { ascending: false })

    console.log('[applicants] job_id:', id, '| count:', applications?.length, '| error:', appError?.message)

    // Enrich with profile data (full_name, email) from profiles table
    let enrichedApplications = applications || []
    if (applications && applications.length > 0) {
        const candidateIds = applications.map((a: any) => a.candidate_id)
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', candidateIds)

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
        enrichedApplications = applications.map((app: any) => ({
            ...app,
            profiles: profileMap.get(app.candidate_id) || { full_name: 'مرشح', email: '' }
        }))
    }

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
                        {job.title} • {enrichedApplications.length} applicants
                    </p>
                </div>
            </div>

            {/* Interactive Applicants List */}
            <ApplicantsList initialApplicants={enrichedApplications} />
        </div>
    )
}
