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

        // 1. Fetch the job details
        const { data: job, error: jobError } = await adminClient
            .from('jobs')
            .select('id, title, description, skills_required, job_type, location, salary_min, salary_max, experience_min, nationality_required')
            .eq('id', job_id)
            .single()

        if (jobError || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        // 2. Fetch candidates (either specific IDs or all public)
        let candidateQuery = adminClient
            .from('candidates')
            .select('id, headline, skills, years_experience, residence_emirate, cv_url, nationality, candidate_type, resume_parsed_data')
            .eq('is_public', true)
            .limit(limit)

        if (candidate_ids && candidate_ids.length > 0) {
            candidateQuery = candidateQuery.in('id', candidate_ids)
        }

        const { data: rawCandidates } = await candidateQuery

        if (!rawCandidates || rawCandidates.length === 0) {
            return NextResponse.json({ error: 'No candidates found', rankings: [] }, { status: 200 })
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

        const n8nPayload = {
            job: {
                id: job.id,
                title: job.title,
                description: job.description,
                skills_required: job.skills_required || [],
                job_type: job.job_type,
                location: job.location,
                salary_range: job.salary_min && job.salary_max
                    ? `${job.salary_min}-${job.salary_max} AED`
                    : null,
                experience_min: job.experience_min,
                nationality_required: job.nationality_required,
            },
            candidates: candidateSummaries,
            employer_id: user.id,
        }

        console.log('[smart-match] Sending', candidateSummaries.length, 'candidates to n8n for job:', job.title)

        const n8nResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-secret': webhookSecret,
            },
            body: JSON.stringify(n8nPayload),
        })

        if (!n8nResponse.ok) {
            console.error('[smart-match] n8n error:', n8nResponse.status)
            // Fallback: return basic Jaccard ranking
            return NextResponse.json({
                success: true,
                source: 'fallback',
                message: 'n8n unavailable, using local matching',
                rankings: candidateSummaries.map(c => ({
                    candidate_id: c.id,
                    name: c.name,
                    score: calculateLocalScore(c.skills, job.skills_required || []),
                    reasoning: 'تطابق المهارات المحلي (n8n غير متاح)',
                    strengths: c.skills.filter((s: string) =>
                        (job.skills_required || []).some((js: string) =>
                            s.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(s.toLowerCase())
                        )
                    ),
                    gaps: (job.skills_required || []).filter((js: string) =>
                        !c.skills.some((s: string) =>
                            s.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(s.toLowerCase())
                        )
                    ),
                })).sort((a: any, b: any) => b.score - a.score),
            })
        }

        const aiResult = await n8nResponse.json()
        console.log('[smart-match] n8n returned:', JSON.stringify(aiResult).slice(0, 300))

        return NextResponse.json({
            success: true,
            source: 'ai',
            ...aiResult,
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
