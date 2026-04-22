import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const { job_id, job_title, job_type } = await request.json()

    if (!job_title) {
        return NextResponse.json({ error: 'Job title required' }, { status: 400 })
    }

    const webhookUrl = process.env.N8N_INTERVIEW_QUESTIONS_WEBHOOK

    if (webhookUrl) {
        try {
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET || '',
                },
                body: JSON.stringify({ job_id, job_title, job_type }),
            })
            const data = await res.json()
            return NextResponse.json(data)
        } catch { /* fall through to mock */ }
    }

    // Mock questions when n8n not configured
    const questions = [
        `حدثنا عن خبرتك في مجال ${job_title} وأبرز إنجازاتك.`,
        'كيف تتعامل مع ضغط العمل والمواعيد النهائية الضيقة؟',
        'صف موقفاً اضطررت فيه للعمل ضمن فريق متعدد التخصصات. كيف أدرت التواصل؟',
        'ما الذي يجعلك المرشح الأمثل لهذه الوظيفة؟',
        'أين ترى نفسك مهنياً بعد 3 سنوات؟',
    ]

    return NextResponse.json({ success: true, questions })
}
