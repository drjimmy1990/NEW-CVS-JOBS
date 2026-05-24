import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { current_role, target_role, industry, years_experience } = await request.json()

    if (!current_role?.trim() || !industry?.trim()) {
        return NextResponse.json({ error: 'current_role and industry are required' }, { status: 400 })
    }

    // --- Credit check ---
    const { data: hasCredits, error: creditError } = await supabase.rpc('deduct_b2c_credits', {
        p_user_id: user.id,
        p_service: 'career_path',
        p_amount: 1,
    })

    if (creditError) {
        console.error('[career-path] Credit check error:', creditError.message)
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

    // --- Create session ---
    const { data: session, error: insertError } = await supabase
        .from('career_path_sessions')
        .insert({
            user_id: user.id,
            current_role: current_role.trim(),
            target_role: target_role?.trim() || null,
            industry: industry.trim(),
            years_experience: years_experience || candidate?.years_experience || 0,
            current_skills: candidate?.skills || [],
            status: 'pending',
        })
        .select('id')
        .single()

    if (insertError || !session) {
        console.error('[career-path] Insert error:', insertError?.message)
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    // --- Send to n8n ---
    const webhookUrl = process.env.N8N_CAREER_PATH_WEBHOOK
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
                    current_role: current_role.trim(),
                    target_role: target_role?.trim() || '',
                    industry: industry.trim(),
                    years_experience: years_experience || candidate?.years_experience || 0,
                    current_skills: candidate?.skills || [],
                }),
            })
            const data = await res.json()
            if (data.result || data.career_path) {
                result = data.result || data
            }
        } catch (err) {
            console.error('[career-path] n8n webhook error:', err)
        }
    }

    // Fallback mock result
    if (!result) {
        const yrs = years_experience || candidate?.years_experience || 0
        const curSkills = candidate?.skills || []
        const targetLabel = target_role || 'قائد فريق ' + current_role

        result = {
            current_assessment: {
                level: yrs <= 2 ? 'مبتدئ' : yrs <= 5 ? 'متوسط' : 'متقدم',
                strengths: curSkills.slice(0, 4),
                gaps: ['القيادة', 'إدارة المشاريع', 'التواصل المتقدم'].filter(g => !curSkills.includes(g)),
            },
            career_path: [
                {
                    year: 1,
                    role: current_role + ' أول',
                    skills_to_learn: ['إدارة المهام', 'العمل الجماعي'],
                    certifications: ['شهادة مهنية في ' + industry],
                    salary_range: `${(yrs + 1) * 5000}-${(yrs + 2) * 5000} AED`,
                },
                {
                    year: 2,
                    role: 'أخصائي ' + current_role,
                    skills_to_learn: ['القيادة', 'التحليل'],
                    certifications: ['PMP أو ما يعادلها'],
                    salary_range: `${(yrs + 3) * 5000}-${(yrs + 4) * 5000} AED`,
                },
                {
                    year: 3,
                    role: targetLabel,
                    skills_to_learn: ['إدارة الفريق', 'التخطيط الاستراتيجي'],
                    certifications: ['ماجستير إدارة أعمال (اختياري)'],
                    salary_range: `${(yrs + 5) * 5000}-${(yrs + 7) * 5000} AED`,
                },
                {
                    year: 5,
                    role: 'مدير ' + industry,
                    skills_to_learn: ['الإدارة العليا', 'الابتكار'],
                    certifications: ['برنامج قيادي متقدم'],
                    salary_range: `${(yrs + 8) * 5000}-${(yrs + 12) * 5000} AED`,
                },
            ],
            training_recommendations: [
                { name: 'دورة القيادة الفعالة', provider: 'Coursera', cost: '200 AED', duration: '6 أسابيع', priority: 'عالية' },
                { name: 'إدارة المشاريع الاحترافية', provider: 'Udemy', cost: '150 AED', duration: '4 أسابيع', priority: 'عالية' },
                { name: 'مهارات التواصل المتقدم', provider: 'LinkedIn Learning', cost: 'مجاني', duration: '3 أسابيع', priority: 'متوسطة' },
            ],
            market_insights: {
                demand_level: 'مرتفع',
                growth_rate: '15% سنوياً',
                avg_salary_uae: `${(yrs + 3) * 4000} AED`,
            },
        }
    }

    // --- Save result ---
    await supabase
        .from('career_path_sessions')
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
        .from('career_path_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

    return NextResponse.json({ sessions: data || [] })
}
