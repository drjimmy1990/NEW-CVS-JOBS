import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * POST /api/ai/smart-match
 * 
 * AI-powered semantic candidate matching.
 * Sends candidates + job data to n8n → Gemini for deep analysis.
 * Returns ranked candidates with AI reasoning.
 * 
 * Body: { job_id: string, candidate_ids?: string[], limit?: number }
 */
export async function POST(req: Request) {
    try {
        const { job_id, candidate_ids, limit = 20 } = await req.json()

        if (!job_id) {
            return NextResponse.json({ error: 'job_id is required' }, { status: 400 })
        }

        // Auth check
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Use admin client to bypass RLS
        const adminClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Fetch the job details (using actual DB column names)
        console.log('[smart-match] Looking up job_id:', job_id)
        const { data: job, error: jobError } = await adminClient
            .from('jobs')
            .select('id, title, description, skills_required, job_type, location_city, location_country, salary_min, salary_max, currency')
            .eq('id', job_id)
            .single()

        console.log('[smart-match] Job lookup:', job ? `Found: ${job.title}` : 'NOT FOUND', '| Error:', jobError?.message || 'none')

        if (jobError || !job) {
            return NextResponse.json({ error: `الوظيفة غير موجودة (${jobError?.message || 'unknown'})`, rankings: [] }, { status: 200 })
        }

        // 2. Fetch candidates (specific IDs from page, or all public)
        let candidateQuery = adminClient
            .from('candidates')
            .select('id, headline, skills, years_experience, residence_emirate, cv_url, nationality, candidate_type, resume_parsed_data')
            .limit(limit)

        if (candidate_ids && candidate_ids.length > 0) {
            // Employer passed specific IDs from the page — no need to filter by is_public
            candidateQuery = candidateQuery.in('id', candidate_ids)
        } else {
            // No specific IDs — only show public candidates
            candidateQuery = candidateQuery.eq('is_public', true)
        }

        const { data: rawCandidates, error: candidateError } = await candidateQuery

        console.log('[smart-match] Candidates found:', rawCandidates?.length || 0, '| Error:', candidateError?.message || 'none')

        if (!rawCandidates || rawCandidates.length === 0) {
            return NextResponse.json({ error: 'لا يوجد مرشحين', rankings: [] }, { status: 200 })
        }

        // 3. Fetch profiles for names
        const ids = rawCandidates.map(c => c.id)
        const { data: profiles } = await adminClient
            .from('profiles')
            .select('id, full_name')
            .in('id', ids)

        const profileMap: Record<string, string> = {}
        profiles?.forEach(p => { profileMap[p.id] = p.full_name })

        // 4. Build candidate summaries for AI
        const candidateSummaries = rawCandidates.map(c => {
            const parsed = typeof c.resume_parsed_data === 'string'
                ? (() => { try { return JSON.parse(c.resume_parsed_data) } catch { return {} } })()
                : (c.resume_parsed_data || {})

            const skills = Array.isArray(c.skills) ? c.skills
                : typeof c.skills === 'string'
                    ? (() => { try { return JSON.parse(c.skills) } catch { return [] } })()
                    : []

            return {
                id: c.id,
                name: profileMap[c.id] || 'مرشح',
                headline: c.headline || '',
                skills: skills,
                years_experience: c.years_experience || 0,
                location: c.residence_emirate || '',
                nationality: c.nationality || '',
                education: parsed.education || [],
                summary: parsed.summary || '',
                cv_url: c.cv_url || null,
            }
        })

        // 5. Send to n8n for AI ranking
        const n8nWebhookUrl = process.env.N8N_SMART_MATCH_WEBHOOK || 'https://n8n.asra3.com/webhook/gn-smart-match'
        const webhookSecret = process.env.N8N_WEBHOOK_SECRET || 'change-me-to-a-strong-secret'

        // Extract skills from description if skills_required is empty
        let jobSkills = Array.isArray(job.skills_required) ? job.skills_required : []
        if (jobSkills.length === 0 && job.description) {
            // Fetch all known skills from skill_aliases table
            const { data: allAliases } = await adminClient
                .from('skill_aliases')
                .select('alias, canonical')

            if (allAliases && allAliases.length > 0) {
                const descLower = job.description.toLowerCase()
                const matchedCanonicals = new Set<string>()

                for (const row of allAliases) {
                    if (descLower.includes(row.alias.toLowerCase())) {
                        matchedCanonicals.add(row.canonical)
                    }
                }

                // Also check canonical names directly in description
                const uniqueCanonicals = [...new Set(allAliases.map(a => a.canonical))]
                for (const canonical of uniqueCanonicals) {
                    if (descLower.includes(canonical.toLowerCase())) {
                        matchedCanonicals.add(canonical)
                    }
                }

                jobSkills = [...matchedCanonicals]
                console.log('[smart-match] Extracted skills from description via skill_aliases:', jobSkills)
            }
        }

        const n8nPayload = {
            job: {
                id: job.id,
                title: job.title,
                description: job.description,
                skills_required: jobSkills,
                job_type: job.job_type,
                location: job.location_city || '',
                country: job.location_country || '',
                salary_range: job.salary_min && job.salary_max
                    ? `${job.salary_min}-${job.salary_max} ${job.currency || 'AED'}`
                    : null,
            },
            candidates: candidateSummaries,
            employer_id: user.id,
        }

        console.log('[smart-match] Sending', candidateSummaries.length, 'candidates to n8n for job:', job.title)
        console.log('[smart-match] Job skills:', JSON.stringify(jobSkills))

        // Helper: build local fallback rankings (uses jobSkills already extracted above)
        const buildFallbackRankings = () => {
            return candidateSummaries.map(c => {
                const score = calculateLocalScore(c.skills, jobSkills)
                console.log('[smart-match] Fallback score for', c.name, ':', score, '| candidate skills:', c.skills.slice(0, 5), '| job skills:', jobSkills.slice(0, 5))
                return {
                    candidate_id: c.id,
                    name: c.name,
                    score,
                    reasoning: 'تطابق المهارات المحلي',
                    recommendation: score >= 70 ? 'مناسب جداً' : score >= 40 ? 'مناسب جزئياً' : 'غير مناسب',
                    strengths: c.skills.filter((s: string) =>
                        jobSkills.some((js: string) =>
                            s.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(s.toLowerCase())
                        )
                    ),
                    gaps: jobSkills.filter((js: string) =>
                        !c.skills.some((s: string) =>
                            s.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(s.toLowerCase())
                        )
                    ),
                }
            }).sort((a: any, b: any) => b.score - a.score)
        }

        let n8nResponse: Response
        try {
            n8nResponse = await fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-secret': webhookSecret,
                },
                body: JSON.stringify(n8nPayload),
            })
            console.log('[smart-match] n8n response status:', n8nResponse.status)
        } catch (fetchError: any) {
            console.error('[smart-match] n8n fetch failed:', fetchError.message)
            return NextResponse.json({
                success: true,
                source: 'fallback',
                message: 'n8n unreachable',
                rankings: buildFallbackRankings(),
            })
        }

        if (!n8nResponse.ok) {
            console.error('[smart-match] n8n error:', n8nResponse.status)
            return NextResponse.json({
                success: true,
                source: 'fallback',
                message: 'n8n returned error, using local matching',
                rankings: buildFallbackRankings(),
            })
        }

        const aiResult = await n8nResponse.json()
        console.log('[smart-match] n8n returned:', JSON.stringify(aiResult).slice(0, 300))

        // Check if n8n returned actual rankings or just an async confirmation
        if (aiResult.rankings && Array.isArray(aiResult.rankings) && aiResult.rankings.length > 0) {
            // AI returned real rankings
            return NextResponse.json({
                success: true,
                source: 'ai',
                ...aiResult,
            })
        }

        // n8n returned 200 but no rankings (async mode: "Workflow was started")
        console.log('[smart-match] n8n did not return rankings, falling back to local matching')
        return NextResponse.json({
            success: true,
            source: 'fallback',
            message: 'n8n async mode — using local matching',
            rankings: buildFallbackRankings(),
        })

    } catch (error: any) {
        console.error('[smart-match] Error:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Fallback local scoring when n8n is unavailable
function calculateLocalScore(candidateSkills: string[], jobSkills: string[]): number {
    if (jobSkills.length === 0) return 0
    const cLower = candidateSkills.map(s => s.toLowerCase())
    const jLower = jobSkills.map(s => s.toLowerCase())
    const matched = jLower.filter(js => cLower.some(cs => cs.includes(js) || js.includes(cs)))
    return Math.round((matched.length / jLower.length) * 100)
}
