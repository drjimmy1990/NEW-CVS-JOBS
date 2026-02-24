import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Briefcase } from 'lucide-react'
import { JobsList } from '@/components/employer/JobsList'

export default async function MyJobsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="text-white">Please login</div>
    }

    // Fetch jobs directly by joining to companies where owner_id matches the user
    const { data: jobs } = await supabase
        .from('jobs')
        .select(`
            *,
            companies!inner (
                id,
                owner_id,
                name
            )
        `)
        .eq('companies.owner_id', user.id)
        .order('created_at', { ascending: false })

    // Get application counts for each job
    const jobsWithCounts = await Promise.all(
        (jobs || []).map(async (job) => {
            const { count } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('job_id', job.id)
            return { ...job, applicant_count: count || 0 }
        })
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">My Jobs</h1>
                    <p className="text-slate-400 mt-1">
                        Manage your job postings
                    </p>
                </div>
                <Link href="/employer/jobs/new">
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Post New Job
                    </Button>
                </Link>
            </div>

            {/* Jobs List */}
            {jobsWithCounts && jobsWithCounts.length > 0 ? (
                <JobsList jobs={jobsWithCounts} />
            ) : (
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="py-16 text-center">
                        <Briefcase className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No jobs posted yet</h3>
                        <p className="text-slate-400 mb-6">
                            Start attracting top talent by posting your first job
                        </p>
                        <Link href="/employer/jobs/new">
                            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                                <Plus className="mr-2 h-4 w-4" />
                                Post Your First Job
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
