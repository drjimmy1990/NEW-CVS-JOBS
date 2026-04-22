import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { title, job_type, location, experience_level, skills } = body

    if (!title) {
        return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    const webhookUrl = process.env.N8N_AI_JOB_DESC_WEBHOOK

    if (webhookUrl) {
        try {
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET || '',
                },
                body: JSON.stringify({ title, job_type, location, experience_level, skills }),
            })
            const data = await res.json()
            return NextResponse.json(data)
        } catch {
            // Fall through to mock if webhook fails
        }
    }

    // Mock AI response when n8n is not configured
    const jobTypeLabels: Record<string, string> = {
        full_time: 'دوام كامل', part_time: 'دوام جزئي', contract: 'عقد مؤقت',
        remote: 'عن بعد', internship: 'تدريب',
    }

    const description = `نبحث عن ${title} متميز/ة للانضمام إلى فريقنا${location ? ` في ${location}` : ''}. هذه وظيفة ${jobTypeLabels[job_type] || 'دوام كامل'} تتطلب شخصاً مبدعاً وذا خبرة عالية.

سيكون المرشح/ة مسؤولاً عن:
• تطوير وتنفيذ الحلول المتقدمة في مجال التخصص
• التعاون مع فرق متعددة التخصصات لتحقيق أهداف المؤسسة
• المساهمة في تحسين العمليات والإجراءات الداخلية
• تقديم تقارير دورية عن سير العمل والإنجازات
• المشاركة في التخطيط الاستراتيجي وتطوير الأعمال${skills?.length ? `\n• استخدام التقنيات الحديثة بما فيها ${skills.join('، ')}` : ''}`

    const requirements = `• ${experience_level || 'خبرة مناسبة'} في المجال
• إجادة اللغتين العربية والإنجليزية تحدثاً وكتابة
• مهارات تواصل وقيادة ممتازة
• القدرة على العمل ضمن فريق وتحت ضغط
• مهارات تحليلية وحل المشكلات${skills?.length ? `\n• إتقان: ${skills.join('، ')}` : ''}
• شهادة جامعية في التخصص ذي الصلة
• الإلمام بمعايير وأنظمة العمل في الإمارات`

    return NextResponse.json({ success: true, description, requirements })
}
