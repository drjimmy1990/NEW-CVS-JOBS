import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { job_role, industry, language = 'ar' } = await request.json()

    if (!job_role?.trim() || !industry?.trim()) {
        return NextResponse.json({ error: 'Job role and industry are required' }, { status: 400 })
    }

    // --- Credit check ---
    const { data: hasCredits, error: creditError } = await supabase.rpc('deduct_interview_credits', {
        p_user_id: user.id,
        p_amount: 1,
    })

    if (creditError) {
        console.error('[interview-practice] Credit check error:', creditError.message)
        return NextResponse.json({ error: 'Credit check failed' }, { status: 500 })
    }

    if (!hasCredits) {
        return NextResponse.json({
            error: 'لا يوجد رصيد كافٍ. يرجى شحن رصيدك أو الاشتراك في خطة.',
            code: 'INSUFFICIENT_CREDITS',
        }, { status: 402 })
    }

    // --- Create practice session ---
    const { data: session, error: insertError } = await supabase
        .from('interview_practice_sessions')
        .insert({
            user_id: user.id,
            job_role: job_role.trim(),
            industry: industry.trim(),
            language,
            status: 'in_progress',
            credits_used: 1,
        })
        .select('id')
        .single()

    if (insertError || !session) {
        console.error('[interview-practice] Insert error:', insertError?.message)
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    // --- Generate questions (reuse existing n8n webhook) ---
    const webhookUrl = process.env.N8N_INTERVIEW_QUESTIONS_WEBHOOK
    let questions: string[] = []

    if (webhookUrl) {
        try {
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET || '',
                },
                body: JSON.stringify({
                    job_title: job_role,
                    job_type: industry,
                    practice_mode: true,
                }),
            })
            const data = await res.json()
            if (data.questions) questions = data.questions
        } catch (err) {
            console.error('[interview-practice] n8n webhook error:', err)
        }
    }

    // Fallback mock questions
    if (!questions.length) {
        questions = [
            `حدثنا عن خبرتك في مجال ${job_role} وأبرز إنجازاتك في صناعة ${industry}.`,
            'كيف تتعامل مع ضغط العمل والمواعيد النهائية الضيقة؟',
            'صف موقفاً واجهت فيه تحدياً كبيراً في عملك. كيف تعاملت معه؟',
            'ما هي أهم المهارات التي تمتلكها وتجعلك مميزاً في هذا المجال؟',
            'أين ترى نفسك مهنياً بعد 3 سنوات؟',
        ]
    }

    // Save questions to session
    await supabase
        .from('interview_practice_sessions')
        .update({ questions: JSON.stringify(questions) })
        .eq('id', session.id)

    return NextResponse.json({
        success: true,
        sessionId: session.id,
        questions,
    })
}
