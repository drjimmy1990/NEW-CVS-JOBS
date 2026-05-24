import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { UAE_CITIES } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Search, MapPin,
    Briefcase, Heart, Eye, Filter
} from 'lucide-react'
import Link from 'next/link'

export default async function CandidateSearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; location?: string; experience?: string; job_id?: string }>
}) {
    const params = await searchParams
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        const { redirect } = await import('next/navigation')
        redirect('/login')
    }
    const userId = user!.id

    // Use service role client to bypass RLS
    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get employer's company to load their jobs for the job filter dropdown
    const { data: ownedCo } = await adminClient
        .from('companies').select('id').eq('owner_id', userId).single()
    let companyId = ownedCo?.id || null
    if (!companyId) {
        const { data: membership } = await adminClient
            .from('company_members')
            .select('company_id')
            .eq('user_id', userId).eq('status', 'active').single()
        companyId = membership?.company_id || null
    }

    // Load employer's active jobs for the "filter by job" dropdown
    let employerJobs: { id: string; title: string; skills_required: string[] }[] = []
    if (companyId) {
        const { data: jobs } = await adminClient
            .from('jobs')
            .select('id, title, skills_required')
            .eq('company_id', companyId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(20)
        employerJobs = jobs || []
    }

    // Get the selected job's required skills (for matching)
    let selectedJobSkills: string[] = []
    let selectedJobTitle = ''
    if (params.job_id && employerJobs.length > 0) {
        const selectedJob = employerJobs.find(j => j.id === params.job_id)
        if (selectedJob) {
            selectedJobSkills = selectedJob.skills_required || []
            selectedJobTitle = selectedJob.title
        }
    }

    // Fetch ALL public candidates (no PostgREST array filters — we filter in JS for reliability)
    const { data: rawCandidates, error } = await adminClient
        .from('candidates')
        .select('id, headline, skills, years_experience, residence_emirate, is_public, cv_url')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(200)

    // Separately fetch profiles for these candidates (more reliable than foreign key join)
    const candidateIds = (rawCandidates || []).map(c => c.id)
    let profilesMap: Record<string, { full_name: string; avatar_url: string | null }> = {}
    if (candidateIds.length > 0) {
        const { data: profiles } = await adminClient
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', candidateIds)
        profiles?.forEach(p => {
            profilesMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url }
        })
    }

    // Build candidate list with profiles attached
    let candidates = (rawCandidates || []).map(c => ({
        ...c,
        full_name: profilesMap[c.id]?.full_name || 'مرشح',
        avatar_url: profilesMap[c.id]?.avatar_url || null,
        // Parse skills: handle both text[] and JSON string
        parsedSkills: Array.isArray(c.skills)
            ? c.skills as string[]
            : typeof c.skills === 'string'
                ? (() => { try { return JSON.parse(c.skills) } catch { return [] } })()
                : [],
        matchPercent: 0,
    }))

    // --- CLIENT-SIDE FILTERING (reliable, case-insensitive) ---

    // 1. Text search filter — supports multiple terms separated by comma or space
    if (params.q) {
        const terms = params.q.split(/[,،\s]+/).map(t => t.trim().toLowerCase()).filter(Boolean)
        if (terms.length > 0) {
            candidates = candidates.filter(c => {
                return terms.some(q => {
                    if (c.headline && c.headline.toLowerCase().includes(q)) return true
                    if (c.full_name.toLowerCase().includes(q)) return true
                    if (c.parsedSkills.some((s: string) => s.toLowerCase().includes(q))) return true
                    return false
                })
            })
        }
    }

    // 2. Location filter
    if (params.location) {
        candidates = candidates.filter(c => c.residence_emirate === params.location)
    }

    // 3. Experience filter
    if (params.experience) {
        if (params.experience === '0-2') {
            candidates = candidates.filter(c => (c.years_experience || 0) >= 0 && (c.years_experience || 0) <= 2)
        } else if (params.experience === '3-5') {
            candidates = candidates.filter(c => (c.years_experience || 0) >= 3 && (c.years_experience || 0) <= 5)
        } else if (params.experience === '6+') {
            candidates = candidates.filter(c => (c.years_experience || 0) >= 6)
        }
    }

    // 4. Smart Match Score — always calculate against employer's jobs
    // Helper: compute match % between candidate skills and a set of job skills
    function computeMatch(candidateSkills: string[], jobSkills: string[]): number {
        if (jobSkills.length === 0) return 0
        const cLower = candidateSkills.map(s => s.toLowerCase())
        const jLower = jobSkills.map(s => s.toLowerCase())
        const matched = jLower.filter(js => cLower.some((cs: string) => cs.includes(js) || js.includes(cs)))
        return Math.round((matched.length / jLower.length) * 100)
    }

    if (selectedJobSkills.length > 0) {
        // Match against the SELECTED job specifically
        candidates = candidates.map(c => ({
            ...c,
            matchPercent: computeMatch(c.parsedSkills, selectedJobSkills),
            bestJobTitle: selectedJobTitle,
        }))
    } else if (employerJobs.length > 0) {
        // Auto-match against ALL employer jobs — show the BEST match
        candidates = candidates.map(c => {
            let bestPercent = 0
            let bestTitle = ''
            for (const job of employerJobs) {
                const pct = computeMatch(c.parsedSkills, job.skills_required || [])
                if (pct > bestPercent) {
                    bestPercent = pct
                    bestTitle = job.title
                }
            }
            return { ...c, matchPercent: bestPercent, bestJobTitle: bestTitle }
        })
    }

    // Sort by match score (highest first), then by experience
    candidates.sort((a, b) => {
        if (b.matchPercent !== a.matchPercent) return b.matchPercent - a.matchPercent
        return (b.years_experience || 0) - (a.years_experience || 0)
    })

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-cream">البحث عن مرشحين</h1>
                <p className="text-cream-dark/50 mt-1">
                    ابحث في قاعدة بيانات المرشحين المسجلين في المنصة.
                </p>
            </div>

            {/* Job Filter — Select one of your jobs to find matching candidates */}
            {employerJobs.length > 0 && (
                <Card className="bg-gradient-to-r from-gold/10 to-gold/5 border-gold/30">
                    <CardContent className="p-4">
                        <form className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2 text-gold text-sm font-medium shrink-0">
                                <Filter className="h-4 w-4" />
                                <span>مرشحون حسب الوظيفة:</span>
                            </div>
                            <select
                                name="job_id"
                                defaultValue={params.job_id || ''}
                                className="flex-1 h-10 rounded-md border border-gold/20 bg-navy px-3 py-2 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold min-w-[200px]"
                            >
                                <option value="">جميع المرشحين (بدون تصفية بوظيفة)</option>
                                {employerJobs.map(job => (
                                    <option key={job.id} value={job.id}>{job.title}</option>
                                ))}
                            </select>
                            <Button type="submit" size="sm" className="bg-gold hover:bg-gold-dark text-navy font-bold">
                                تصفية
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Search Bar + Filters */}
            <Card className="bg-navy-light border-gold/10">
                <CardContent className="p-6">
                    <form className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-dark/40" />
                            <Input
                                name="q"
                                defaultValue={params.q}
                                placeholder="ابحث بالمهارة، المسمى الوظيفي، أو كلمة مفتاحية..."
                                className="ps-10 bg-navy border-gold/10 text-cream placeholder:text-cream-dark/30"
                            />
                        </div>
                        <div className="flex gap-3">
                            <select
                                name="location"
                                defaultValue={params.location || ''}
                                className="flex h-10 rounded-md border border-gold/10 bg-navy px-3 py-2 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold min-w-[140px]"
                            >
                                <option value="">جميع المواقع</option>
                                {UAE_CITIES.map(city => (
                                    <option key={city.value} value={city.value}>{city.labelAr}</option>
                                ))}
                            </select>
                            <select
                                name="experience"
                                defaultValue={params.experience || ''}
                                className="flex h-10 rounded-md border border-gold/10 bg-navy px-3 py-2 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold min-w-[140px]"
                            >
                                <option value="">الخبرة</option>
                                <option value="0-2">0-2 سنوات</option>
                                <option value="3-5">3-5 سنوات</option>
                                <option value="6+">+6 سنوات</option>
                            </select>
                            <Button type="submit" className="bg-gold hover:bg-gold-dark text-navy font-bold">
                                بحث
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Selected Job Info */}
            {selectedJobTitle && (
                <div className="flex items-center gap-2 text-sm text-gold">
                    <Briefcase className="h-4 w-4" />
                    <span>يتم ترتيب المرشحين حسب تطابقهم مع وظيفة: <strong>{selectedJobTitle}</strong></span>
                </div>
            )}

            {/* Results */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-cream-dark/40">يُعرض {candidates?.length || 0} مرشحين</p>
                </div>

                {candidates && candidates.length > 0 ? (
                    candidates.map((candidate: any) => (
                        <Card key={candidate.id} className="bg-navy-light border-gold/10 hover:border-gold/20 transition-colors group">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    {/* Match Score Circle */}
                                    {employerJobs.length > 0 && (
                                        <div className="shrink-0 flex flex-col items-center gap-1">
                                            <div className={`relative h-16 w-16 rounded-full flex items-center justify-center border-[3px] ${
                                                candidate.matchPercent >= 70 ? 'border-emerald-500/60 text-emerald-400' :
                                                candidate.matchPercent >= 40 ? 'border-amber-500/60 text-amber-400' :
                                                'border-red-500/40 text-red-400'
                                            }`}>
                                                <span className="text-lg font-bold">{candidate.matchPercent}%</span>
                                            </div>
                                            <span className="text-[9px] text-cream-dark/30 text-center max-w-[80px] truncate">
                                                {candidate.bestJobTitle || 'تطابق'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Candidate Info */}
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/20 flex items-center justify-center text-cream font-bold text-lg shrink-0">
                                            {(candidate.full_name || 'م').charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-cream">
                                                    {candidate.full_name}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-cream-dark/50 mt-0.5">{candidate.headline || 'باحث عن عمل'}</p>
                                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-cream-dark/40">
                                                {candidate.residence_emirate && (
                                                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {candidate.residence_emirate}</span>
                                                )}
                                                {candidate.years_experience != null && (
                                                    <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {candidate.years_experience} سنوات خبرة</span>
                                                )}
                                            </div>
                                            {/* Match Progress Bar */}
                                            {employerJobs.length > 0 && (
                                                <div className="mt-3 max-w-xs">
                                                    <div className="h-1.5 rounded-full bg-navy overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${
                                                                candidate.matchPercent >= 70 ? 'bg-emerald-500' :
                                                                candidate.matchPercent >= 40 ? 'bg-amber-500' :
                                                                'bg-red-500'
                                                            }`}
                                                            style={{ width: `${candidate.matchPercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex gap-1.5 mt-3 flex-wrap">
                                                {(candidate.parsedSkills || []).slice(0, 6).map((skill: string) => (
                                                    <Badge key={skill} variant="outline" className="text-[10px] border-gold/20 text-gold py-0">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                                {(candidate.parsedSkills || []).length > 6 && (
                                                    <Badge variant="outline" className="text-[10px] border-cream-dark/10 text-cream-dark/30 py-0">
                                                        +{candidate.parsedSkills.length - 6}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 md:flex-col md:items-end shrink-0">
                                        {candidate.cv_url ? (
                                            <a href={candidate.cv_url} target="_blank" rel="noopener noreferrer">
                                                <Button size="sm" className="bg-gold hover:bg-gold-dark text-navy font-bold">
                                                    <Eye className="h-4 w-4 me-1.5" />
                                                    عرض الملف
                                                </Button>
                                            </a>
                                        ) : (
                                            <Button size="sm" className="bg-gold/50 text-navy font-bold cursor-not-allowed" disabled>
                                                <Eye className="h-4 w-4 me-1.5" />
                                                لا يوجد سيرة
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-cream-dark/40 hover:text-cream"
                                        >
                                            <Heart className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="bg-navy-light border-gold/10">
                        <CardContent className="p-12 text-center">
                            <Search className="h-12 w-12 text-cream-dark/20 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-cream mb-1">لم يتم العثور على مرشحين</h3>
                            <p className="text-cream-dark/40">حاول تعديل معايير البحث أو تأكد من وجود مرشحين مسجلين</p>
                            {error && (
                                <p className="text-red-400/60 text-xs mt-3 font-mono" dir="ltr">Debug: {error.message}</p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
