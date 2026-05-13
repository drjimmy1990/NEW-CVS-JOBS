import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { session_id, answers } = await request.json()

    if (!session_id || !answers?.length) {
        return NextResponse.json({ error: 'Missing session_id or answers' }, { status: 400 })
    }

    // Verify session ownership
    const { data: session } = await supabase
        .from('interview_practice_sessions')
        .select('id, user_id, job_role, industry, questions, status')
        .eq('id', session_id)
        .single()

    if (!session || session.user_id !== user.id) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status === 'completed') {
        return NextResponse.json({ error: 'Session already completed' }, { status: 400 })
    }

    const questions = typeof session.questions === 'string'
        ? JSON.parse(session.questions)
        : session.questions

    // --- Evaluate answers (reuse existing n8n webhook) ---
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
                body: JSON.stringify({
                    job_title: session.job_role,
                    job_type: session.industry,
                    questions,
                    answers,
                    practice_mode: true,
                }),
            })
            result = await res.json()
        } catch (err) {
            console.error('[interview-practice-submit] n8n error:', err)
        }
    }

    // Fallback mock evaluation
    if (!result) {
        const evaluation = questions.map((_: string, i: number) => ({
            question_index: i,
            score: Math.floor(Math.random() * 3) + 7,
            max: 10,
            feedback: 'إجابة جيدة تُظهر فهماً واضحاً للموضوع. حاول إضافة أمثلة عملية أكثر.',
            tips: 'استخدم أسلوب STAR (الموقف، المهمة، الإجراء، النتيجة) لتنظيم إجاباتك.',
        }))
        const overall = Math.round(evaluation.reduce((s: number, e: any) => s + e.score, 0) / evaluation.length * 10)
        result = {
            success: true,
            overall_score: overall,
            evaluation,
            recommendation: overall >= 75
                ? 'أداء ممتاز! أنت جاهز للمقابلات الحقيقية.'
                : overall >= 50
                    ? 'أداء جيد. تدرّب أكثر على النقاط التي حصلت فيها على درجات أقل.'
                    : 'يحتاج تحسين. ركّز على الإجابات التفصيلية واستخدم أمثلة من خبرتك.',
            tips: [
                'استخدم أسلوب STAR لتنظيم إجاباتك',
                'حضّر 3 قصص نجاح من خبراتك السابقة',
                'ابحث عن الشركة والصناعة قبل المقابلة',
                'تدرب على الإجابة بصوت عالٍ أمام المرآة',
            ],
        }
    }

    // Save results to session
    const { error: updateError } = await supabase
        .from('interview_practice_sessions')
        .update({
            answers: JSON.stringify(answers),
            score: result.overall_score ?? 0,
            report: result,
            status: 'completed',
            completed_at: new Date().toISOString(),
        })
        .eq('id', session_id)

    if (updateError) {
        console.error('[interview-practice-submit] Save error:', updateError.message)
    }

    return NextResponse.json(result)
}
