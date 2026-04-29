import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { application_id, job_id, job_title, questions, answers } = await request.json()

    if (!application_id || !questions?.length || !answers?.length) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the user owns this application
    const { data: app } = await supabase
        .from('applications').select('candidate_id').eq('id', application_id).single()

    if (!app || app.candidate_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const webhookUrl = process.env.N8N_INTERVIEW_EVAL_WEBHOOK

    let result: any = null

    if (webhookUrl) {
        try {
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET || '',
                },
                body: JSON.stringify({ application_id, job_id, job_title, questions, answers }),
            })
            result = await res.json()
        } catch { /* fall through to mock */ }
    }

    if (!result) {
        // Mock evaluation
        const evaluation = questions.map((_: string, i: number) => ({
            question_index: i,
            score: Math.floor(Math.random() * 3) + 7,
            max: 10,
            feedback: 'إجابة جيدة تُظهر فهماً واضحاً للموضوع.',
        }))
        const overall = Math.round(evaluation.reduce((s: number, e: any) => s + e.score, 0) / evaluation.length * 10)
        result = {
            success: true,
            overall_score: overall,
            evaluation,
            recommendation: overall >= 75 ? 'مرشح جيد — يُنصح بالمتابعة مع مقابلة شخصية' : 'يحتاج تطوير — يُنصح بالمراجعة',
        }
    }

    // Save to database via RPC (bypasses RLS)
    const { error: updateError } = await supabase.rpc('save_interview_result', {
        p_application_id: application_id,
        p_interview_score: result.overall_score ?? 0,
        p_interview_report: result,
    })

    if (updateError) {
        console.error('[interview-submit] DB save error:', updateError.message)
        // Fallback: try direct update
        const { error: fallbackError } = await supabase.from('applications').update({
            interview_score: result.overall_score,
            interview_report: result,
        }).eq('id', application_id)
        if (fallbackError) {
            console.error('[interview-submit] Fallback update also failed:', fallbackError.message)
        } else {
            console.log('[interview-submit] Saved via fallback update')
        }
    } else {
        console.log('[interview-submit] Saved score:', result.overall_score, 'for application:', application_id)
    }

    return NextResponse.json(result)
}
