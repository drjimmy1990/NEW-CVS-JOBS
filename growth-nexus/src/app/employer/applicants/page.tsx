import { createClient } from '@/utils/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Filter } from 'lucide-react'
import { ApplicantCard } from '@/components/employer/ApplicantCard'

export default async function ApplicantsPage({
    searchParams,
}: {
    searchParams: Promise<{ job?: string }>
}) {
    const params = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="text-cream">يرجى تسجيل الدخول</div>
    }

    // Get employer's company
    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!company) {
        return <div className="text-cream">لم يتم العثور على شركة</div>
    }

    // Get employer's jobs
    const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

    const jobIds = (jobs || []).map(j => j.id)

    if (jobIds.length === 0) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-cream">خط سير المتقدمين</h1>
                    <p className="text-cream-dark/50 mt-1">لم يتم نشر أي وظائف بعد.</p>
                </div>
            </div>
        )
    }

    // Build filter
    const filterJobIds = (params.job && params.job !== 'all') ? [params.job] : jobIds

    // Get applications
    const { data: applications } = await supabase
        .from('applications')
        .select('id, job_id, candidate_id, status, resume_snapshot_url, created_at')
        .in('job_id', filterJobIds)
        .order('created_at', { ascending: false })

    // Job title map
    const jobTitles: Record<string, string> = {}
    ;(jobs || []).forEach(j => { jobTitles[j.id] = j.title })

    // Profile name + CV map
    const candidateIds = [...new Set((applications || []).map(a => a.candidate_id).filter(Boolean))]
    const candidateNames: Record<string, string> = {}
    const candidateCVs: Record<string, string | null> = {}

    if (candidateIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', candidateIds)
        if (profiles) {
            profiles.forEach(p => { candidateNames[p.id] = p.full_name || 'مرشح' })
        }

        const { data: candidates } = await supabase
            .from('candidates')
            .select('id, cv_url')
            .in('id', candidateIds)
        if (candidates) {
            candidates.forEach(c => { candidateCVs[c.id] = c.cv_url })
        }
    }

    // Group by status for kanban
    const statuses = ['applied', 'reviewing', 'interview', 'shortlisted']
    const statusConfig: Record<string, { title: string; color: string }> = {
        applied: { title: 'تم التقديم', color: 'bg-cream-dark/40' },
        reviewing: { title: 'قيد المراجعة', color: 'bg-blue-500' },
        interview: { title: 'مقابلة', color: 'bg-gold' },
        shortlisted: { title: 'القائمة المختصرة', color: 'bg-success' },
    }

    const groupedApplications = statuses.map(status => ({
        id: status,
        ...statusConfig[status],
        candidates: (applications || [])
            .filter((app: any) => app.status === status)
            .map((app: any) => ({
                id: app.id,
                candidateId: app.candidate_id,
                name: candidateNames[app.candidate_id] || 'مرشح',
                role: jobTitles[app.job_id] || '',
                date: new Date(app.created_at).toLocaleDateString('ar-AE'),
                cvUrl: app.resume_snapshot_url || candidateCVs[app.candidate_id] || null,
                status: app.status,
            })),
    }))

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-cream">خط سير المتقدمين</h1>
                    <p className="text-cream-dark/50 mt-1">
                        أدر المتقدمين عبر جميع مراحل عملية التوظيف.
                    </p>
                </div>
                <div className="flex gap-3">
                    <form className="flex gap-2">
                        <select 
                            name="job"
                            defaultValue={params.job || 'all'}
                            className="flex h-10 rounded-md border border-gold/15 bg-navy px-3 py-2 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold min-w-[200px]"
                        >
                            <option value="all">جميع الوظائف</option>
                            {(jobs || []).map((job) => (
                                <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                        </select>
                        <Button type="submit" size="sm" className="bg-gold hover:bg-gold-dark text-navy font-bold h-10 px-4">
                            <Filter className="h-4 w-4 me-1" />
                            فلتر
                        </Button>
                    </form>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 min-h-[500px]">
                {groupedApplications.map((column) => (
                    <div key={column.id} className="space-y-4">
                        {/* Column Header */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <div className={`h-3 w-3 rounded-full ${column.color}`}></div>
                                <h3 className="font-semibold text-cream text-sm">{column.title}</h3>
                                <Badge variant="outline" className="border-gold/15 text-cream-dark/40 text-xs">
                                    {column.candidates.length}
                                </Badge>
                            </div>
                        </div>

                        {/* Cards */}
                        <div className="space-y-3">
                            {column.candidates.map((candidate) => (
                                <ApplicantCard
                                    key={candidate.id}
                                    applicationId={candidate.id}
                                    candidateId={candidate.candidateId}
                                    candidateName={candidate.name}
                                    jobTitle={candidate.role}
                                    date={candidate.date}
                                    currentStatus={candidate.status}
                                    cvUrl={candidate.cvUrl}
                                />
                            ))}

                            {column.candidates.length === 0 && (
                                <div className="border-2 border-dashed border-gold/10 rounded-xl p-8 text-center">
                                    <p className="text-cream-dark/30 text-sm">لا يوجد مرشحون</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
