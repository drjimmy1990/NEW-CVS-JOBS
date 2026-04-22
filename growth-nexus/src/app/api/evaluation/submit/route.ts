import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { application_id, scores, notes, total_score } = await request.json()

    if (!application_id || !scores?.length) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Save evaluation
    const { error } = await supabase.from('committee_evaluations').upsert({
        application_id,
        evaluator_id: user.id,
        scores,
        notes,
        total_score,
    }, { onConflict: 'application_id,evaluator_id' })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Check if all evaluators have submitted (check count)
    const { data: allEvals } = await supabase
        .from('committee_evaluations')
        .select('evaluator_id, scores, total_score, profiles!committee_evaluations_evaluator_id_fkey(full_name)')
        .eq('application_id', application_id)

    // If >= 2 evaluators, trigger summary
    if (allEvals && allEvals.length >= 2) {
        const evalScores = allEvals.map((e: any) => ({
            evaluator_id: e.evaluator_id,
            evaluator_name: e.profiles?.full_name || 'Unknown',
            score: e.total_score,
            notes: '',
        }))

        const webhookUrl = process.env.N8N_COMMITTEE_SUMMARY_WEBHOOK

        let summary: any = null

        if (webhookUrl) {
            try {
                const res = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET || '',
                    },
                    body: JSON.stringify({ application_id, scores: evalScores }),
                })
                summary = await res.json()
            } catch { /* fall through to mock */ }
        }

        if (!summary) {
            // Mock summary
            const avg = Math.round(evalScores.reduce((s: number, e: any) => s + e.score, 0) / evalScores.length)
            summary = {
                success: true,
                average_score: avg,
                median_score: avg,
                recommendation: avg >= 75 ? 'تأهيل المرشح للعرض الوظيفي' : 'يحتاج مراجعة إضافية',
                outliers: [],
                summary: `تم تقييم المرشح من ${evalScores.length} أعضاء لجنة. المتوسط ${avg}%.`,
            }
        }

        // Save summary to application
        await supabase.from('applications').update({
            committee_summary: summary,
        }).eq('id', application_id)
    }

    return NextResponse.json({
        success: true,
        evaluations_count: allEvals?.length || 1,
        message: 'تم حفظ التقييم',
    })
}
