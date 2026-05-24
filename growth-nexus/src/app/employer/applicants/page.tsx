import { createClient } from '@/utils/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Filter, LayoutList, Columns3 } from 'lucide-react'
import { ApplicantCard } from '@/components/employer/ApplicantCard'
import { ApplicantListView } from '@/components/employer/ApplicantListView'
import Link from 'next/link'

export type ApplicantData = {
    id: string
    candidateId: string
    name: string
    headline: string
    role: string
    date: string
    cvUrl: string | null
    status: string
    yearsExperience: number
    city: string
    nationality: string
    educationLevel: string
    specialization: string
    lastJobTitle: string
    skills: string[]
    matchScore: number | null
    aiSummary: { top_skills?: string[]; top_experiences?: string[] } | null
}

export default async function ApplicantsPage({
    searchParams,
}: {
    searchParams: Promise<{ job?: string; status?: string; view?: string }>
}) {
    const params = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="text-cream">يرجى تسجيل الدخول</div>
    }

    // Get employer's company (owner or team member)
    let company: any = null
    const { data: ownedCompany } = await supabase
        .from('companies').select('id').eq('owner_id', user.id).single()

    if (ownedCompany) {
        company = ownedCompany
    } else {
        const { data: membership } = await supabase
            .from('company_members').select('company_id')
            .eq('user_id', user.id).eq('status', 'active').single()
        if (membership) company = { id: membership.company_id }
    }

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
                    <h1 className="text-3xl font-bold text-cream">المتقدمين</h1>
                    <p className="text-cream-dark/50 mt-1">لم يتم نشر أي وظائف بعد.</p>
                </div>
            </div>
        )
    }

    // Build filter
    const filterJobIds = (params.job && params.job !== 'all') ? [params.job] : jobIds

    // Get applications with expanded data
    let appQuery = supabase
        .from('applications')
        .select('id, job_id, candidate_id, status, resume_snapshot_url, created_at, match_score, ai_summary')
        .in('job_id', filterJobIds)
        .order('created_at', { ascending: false })

    // Status filter
    if (params.status && params.status !== 'all') {
        appQuery = appQuery.eq('status', params.status)
    }

    const { data: applications } = await appQuery

    // Job title map
    const jobTitles: Record<string, string> = {}
    ;(jobs || []).forEach(j => { jobTitles[j.id] = j.title })

    // Fetch candidate details (expanded)
    const candidateIds = [...new Set((applications || []).map(a => a.candidate_id).filter(Boolean))]
    const candidateNames: Record<string, string> = {}
    const candidateDetails: Record<string, any> = {}

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
            .select('id, cv_url, headline, years_experience, city, nationality, skills, education_level, specialization, last_job_title')
            .in('id', candidateIds)
        if (candidates) {
            candidates.forEach(c => { candidateDetails[c.id] = c })
        }
    }

    // Build unified applicant data
    const allApplicants: ApplicantData[] = (applications || []).map((app: any) => {
        const c = candidateDetails[app.candidate_id] || {}
        return {
            id: app.id,
            candidateId: app.candidate_id,
            name: candidateNames[app.candidate_id] || 'مرشح',
            headline: c.headline || '',
            role: jobTitles[app.job_id] || '',
            date: new Date(app.created_at).toLocaleDateString('ar-AE'),
            cvUrl: app.resume_snapshot_url || c.cv_url || null,
            status: app.status,
            yearsExperience: c.years_experience || 0,
            city: c.city || '',
            nationality: c.nationality || '',
            educationLevel: c.education_level || '',
            specialization: c.specialization || '',
            lastJobTitle: c.last_job_title || '',
            skills: c.skills || [],
            matchScore: app.match_score || null,
            aiSummary: app.ai_summary || null,
        }
    })

    // View mode
    const viewMode = params.view || 'list'

    // Kanban grouping (only when in kanban mode)
    const statuses = ['applied', 'reviewing', 'shortlisted', 'interview', 'offer', 'hired', 'rejected']
    const statusConfig: Record<string, { title: string; color: string }> = {
        applied: { title: 'تم التقديم', color: 'bg-cream-dark/40' },
        reviewing: { title: 'قيد المراجعة', color: 'bg-blue-500' },
        shortlisted: { title: 'القائمة المختصرة', color: 'bg-emerald-500' },
        interview: { title: 'مقابلة', color: 'bg-purple-500' },
        offer: { title: 'عرض وظيفي', color: 'bg-gold' },
        hired: { title: 'تم التعيين', color: 'bg-green-500' },
        rejected: { title: 'مرفوض', color: 'bg-red-500' },
    }

    const groupedApplications = statuses.map(status => ({
        id: status,
        ...statusConfig[status],
        candidates: allApplicants.filter(a => a.status === status),
    }))

    // Status filter pills
    const statusFilters = [
        { id: 'all', label: 'الكل' },
        { id: 'applied', label: 'تم التقديم' },
        { id: 'reviewing', label: 'قيد المراجعة' },
        { id: 'shortlisted', label: 'القائمة المختصرة' },
        { id: 'interview', label: 'مقابلة' },
        { id: 'offer', label: 'عرض وظيفي' },
        { id: 'hired', label: 'تم التعيين' },
        { id: 'rejected', label: 'مرفوض' },
    ]

    // Build URL helper preserving params
    function buildUrl(overrides: Record<string, string>) {
        const p = new URLSearchParams()
        const merged = { job: params.job || 'all', status: params.status || 'all', view: viewMode, ...overrides }
        Object.entries(merged).forEach(([k, v]) => { if (v && v !== 'all' && k !== 'view') p.set(k, v); if (k === 'view') p.set(k, v) })
        return `/employer/applicants?${p.toString()}`
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-cream">المتقدمين</h1>
                    <p className="text-cream-dark/50 mt-1">
                        إدارة جميع المتقدمين — {allApplicants.length} طلب
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    {/* View Toggle */}
                    <div className="flex bg-navy-lighter rounded-lg border border-gold/10 p-0.5">
                        <Link
                            href={buildUrl({ view: 'list' })}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${viewMode === 'list' ? 'bg-gold/20 text-gold' : 'text-cream-dark/50 hover:text-cream-dark/80'}`}
                        >
                            <LayoutList className="h-4 w-4" />
                            قائمة
                        </Link>
                        <Link
                            href={buildUrl({ view: 'kanban' })}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${viewMode === 'kanban' ? 'bg-gold/20 text-gold' : 'text-cream-dark/50 hover:text-cream-dark/80'}`}
                        >
                            <Columns3 className="h-4 w-4" />
                            كانبان
                        </Link>
                    </div>

                    {/* Job Filter */}
                    <form className="flex gap-2">
                        <input type="hidden" name="view" value={viewMode} />
                        {params.status && params.status !== 'all' && <input type="hidden" name="status" value={params.status} />}
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

            {/* Status Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
                {statusFilters.map(sf => (
                    <Link
                        key={sf.id}
                        href={buildUrl({ status: sf.id })}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                            (params.status || 'all') === sf.id
                                ? 'bg-gold/20 text-gold border-gold/30'
                                : 'bg-navy-lighter text-cream-dark/50 border-gold/5 hover:border-gold/15'
                        }`}
                    >
                        {sf.label}
                        {sf.id !== 'all' && (
                            <span className="ms-1 text-xs opacity-60">
                                ({allApplicants.filter(a => sf.id === 'all' || a.status === sf.id).length})
                            </span>
                        )}
                    </Link>
                ))}
            </div>

            {/* Content */}
            {viewMode === 'list' ? (
                /* ===== LIST VIEW ===== */
                <ApplicantListView applicants={allApplicants} />
            ) : (
                /* ===== KANBAN VIEW ===== */
                <div className="overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-max">
                        {groupedApplications.map((column) => (
                            <div key={column.id} className="w-[220px] space-y-4 flex-shrink-0">
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
                                            headline={candidate.headline}
                                            yearsExperience={candidate.yearsExperience}
                                            city={candidate.city}
                                            nationality={candidate.nationality}
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
            )}
        </div>
    )
}
