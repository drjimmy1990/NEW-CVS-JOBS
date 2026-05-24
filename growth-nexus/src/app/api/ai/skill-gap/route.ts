import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { target_job_id, target_job_title, target_skills } = await request.json()

    if (!target_job_id && !target_job_title) {
        return NextResponse.json({ error: 'target_job_id or target_job_title is required' }, { status: 400 })
    }

    // --- Credit check ---
    const { data: hasCredits, error: creditError } = await supabase.rpc('deduct_b2c_credits', {
        p_user_id: user.id,
        p_service: 'skill_gap',
        p_amount: 1,
    })

    if (creditError) {
        console.error('[skill-gap] Credit check error:', creditError.message)
        return NextResponse.json({ error: 'Credit check failed' }, { status: 500 })
    }

    if (!hasCredits) {
        return NextResponse.json({
            error: 'لا يوجد رصيد كافٍ. يرجى شحن رصيدك أو الاشتراك في خطة.',
            code: 'INSUFFICIENT_CREDITS',
        }, { status: 402 })
    }

    // --- Load candidate skills ---
    const { data: candidate } = await supabase
        .from('candidates')
        .select('skills, years_experience, headline')
        .eq('id', user.id)
        .single()

    const candidateSkills: string[] = candidate?.skills || []

    // --- Load target job skills (if job_id provided) ---
    let jobTitle = target_job_title || ''
    let jobSkills: string[] = target_skills || []

    if (target_job_id) {
        const { data: job } = await supabase
            .from('jobs')
            .select('title, skills_required, description')
            .eq('id', target_job_id)
            .single()

        if (job) {
            jobTitle = job.title
            jobSkills = job.skills_required || []
        }
    }

    // --- Create analysis row ---
    const { data: session, error: insertError } = await supabase
        .from('skill_gap_analyses')
        .insert({
            user_id: user.id,
            target_job_title: jobTitle,
            target_skills: jobSkills,
            candidate_skills: candidateSkills,
            status: 'pending',
        })
        .select('id')
        .single()

    if (insertError || !session) {
        console.error('[skill-gap] Insert error:', insertError?.message)
        return NextResponse.json({ error: 'Failed to create analysis' }, { status: 500 })
    }

    // --- Send to n8n ---
    const webhookUrl = process.env.N8N_SKILL_GAP_WEBHOOK
    let result = null

    if (webhookUrl) {
        try {
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET || '',
                },
                body: JSON.stringify({
                    session_id: session.id,
                    target_job_title: jobTitle,
                    target_skills: jobSkills,
                    candidate_skills: candidateSkills,
                    years_experience: candidate?.years_experience || 0,
                }),
            })
            const data = await res.json()
            if (data.result || data.match_percentage !== undefined) {
                result = data.result || data
            }
        } catch (err) {
            console.error('[skill-gap] n8n webhook error:', err)
        }
    }

    // Fallback mock analysis
    if (!result) {
        const matched = candidateSkills.filter(cs =>
            jobSkills.some(js =>
                js.toLowerCase().includes(cs.toLowerCase()) ||
                cs.toLowerCase().includes(js.toLowerCase())
            )
        )
        const missing = jobSkills.filter(js =>
            !candidateSkills.some(cs =>
                js.toLowerCase().includes(cs.toLowerCase()) ||
                cs.toLowerCase().includes(js.toLowerCase())
            )
        )
        const matchPct = jobSkills.length > 0
            ? Math.round((matched.length / jobSkills.length) * 100)
            : 0

        result = {
            match_percentage: matchPct,
            matched_skills: matched.map(s => ({ skill: s, level: 'strong' })),
            missing_skills: missing.map((s, i) => ({
                skill: s,
                priority: i < 2 ? 'critical' : i < 4 ? 'important' : 'nice_to_have',
                learning_time: i < 2 ? '1-2 شهر' : '2-4 أشهر',
                resources: [],
            })),
            transferable_skills: candidateSkills
                .filter(cs => !matched.includes(cs))
                .slice(0, 3)
                .map(cs => ({
                    from_skill: cs,
                    applicable_to: jobTitle,
                    relevance: 'متوسط',
                })),
            action_plan: missing.slice(0, 5).map((s, i) => ({
                priority: i + 1,
                skill: s,
                action: `تعلم ${s} من خلال دورات تدريبية متخصصة`,
                timeline: i < 2 ? 'شهر واحد' : 'شهرين',
                resource: 'Udemy / Coursera',
            })),
        }
    }

    // --- Save result ---
    await supabase
        .from('skill_gap_analyses')
        .update({ result, status: 'completed' })
        .eq('id', session.id)

    return NextResponse.json({
        success: true,
        session_id: session.id,
        result,
    })
}

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase
        .from('skill_gap_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

    return NextResponse.json({ sessions: data || [] })
}
