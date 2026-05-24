import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { application_id } = await request.json()

    if (!application_id?.trim()) {
        return NextResponse.json({ error: 'application_id is required' }, { status: 400 })
    }

    // --- Load application (must be rejected) ---
    const { data: application, error: appError } = await supabase
        .from('applications')
        .select('*, jobs(id, title, description, skills_required, job_type, location_city, salary_min, salary_max, company_id, companies(name))')
        .eq('id', application_id)
        .eq('candidate_id', user.id)
        .single()

    if (appError || !application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (application.status !== 'rejected') {
        return NextResponse.json({ error: 'Only rejected applications can be analyzed' }, { status: 400 })
    }

    // Already analyzed? Return cached result
    if (application.rejection_analysis) {
        return NextResponse.json({
            success: true,
            analysis: application.rejection_analysis,
            cached: true,
        })
    }

    // --- Credit check ---
    const { data: hasCredits, error: creditError } = await supabase.rpc('deduct_b2c_credits', {
        p_user_id: user.id,
        p_service: 'rejection_analyzer',
        p_amount: 1,
    })

    if (creditError) {
        console.error('[rejection-analyzer] Credit check error:', creditError.message)
        return NextResponse.json({ error: 'Credit check failed' }, { status: 500 })
    }

    if (!hasCredits) {
        return NextResponse.json({
            error: 'لا يوجد رصيد كافٍ. يرجى شحن رصيدك أو الاشتراك في خطة.',
            code: 'INSUFFICIENT_CREDITS',
        }, { status: 402 })
    }

    // --- Load candidate data ---
    const { data: candidate } = await supabase
        .from('candidates')
        .select('skills, years_experience, headline, resume_parsed_data')
        .eq('id', user.id)
        .single()

    // --- Send to n8n ---
    const webhookUrl = process.env.N8N_REJECTION_ANALYZER_WEBHOOK
    let analysis = null

    const job = application.jobs
    const payload = {
        application_id,
        job: {
            title: job?.title || '',
            description: (job?.description || '').replace(/<[^>]*>/g, '').slice(0, 1500),
            skills_required: job?.skills_required || [],
            job_type: job?.job_type || '',
            location: job?.location_city || '',
            salary_range: job?.salary_min && job?.salary_max
                ? `${job.salary_min}-${job.salary_max} AED`
                : 'N/A',
            company_name: job?.companies?.name || '',
        },
        candidate: {
            skills: candidate?.skills || [],
            years_experience: candidate?.years_experience || 0,
            headline: candidate?.headline || '',
            education: candidate?.resume_parsed_data?.education || [],
        },
        rejection_reason: application.rejection_reason || 'غير محدد',
    }

    if (webhookUrl) {
        try {
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET || '',
                },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (data.analysis || data.likely_reasons) {
                analysis = data.analysis || data
            }
        } catch (err) {
            console.error('[rejection-analyzer] n8n webhook error:', err)
        }
    }

    // Fallback mock analysis
    if (!analysis) {
        const missingSkills = (job?.skills_required || []).filter(
            (s: string) => !(candidate?.skills || []).some(
                (cs: string) => cs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(cs.toLowerCase())
            )
        )

        analysis = {
            likely_reasons: [
                application.rejection_reason || 'لم يتم تحديد سبب واضح من صاحب العمل',
                missingSkills.length > 0 ? `نقص في المهارات المطلوبة: ${missingSkills.join('، ')}` : null,
                (candidate?.years_experience || 0) < 2 ? 'خبرة محدودة مقارنة بالمتقدمين الآخرين' : null,
            ].filter(Boolean),
            improvement_areas: [
                'تحسين السيرة الذاتية لتتوافق مع متطلبات الوظيفة',
                'التركيز على المهارات التقنية المطلوبة في الوصف الوظيفي',
                'إضافة مشاريع أو شهادات تدعم ترشحك',
            ],
            missing_skills: missingSkills,
            recommended_actions: [
                'راجع وصف الوظيفة وقارنه بسيرتك الذاتية',
                'طوّر المهارات الناقصة من خلال دورات تدريبية',
                'تواصل مع محترفين في نفس المجال للحصول على نصائح',
                'تقدم لوظائف مشابهة تناسب مستوى خبرتك الحالي',
            ],
            alternative_roles: [
                `${job?.title || 'وظيفة'} مبتدئ`,
                'متدرب في نفس المجال',
                'مساعد في القسم المتعلق',
            ],
            match_score: Math.max(20, 100 - (missingSkills.length * 15)),
        }
    }

    // --- Save analysis to application ---
    const { error: updateError } = await supabase
        .from('applications')
        .update({ rejection_analysis: analysis })
        .eq('id', application_id)
        .eq('candidate_id', user.id)

    if (updateError) {
        console.error('[rejection-analyzer] Save error:', updateError.message, 'code:', updateError.code)
    }

    return NextResponse.json({
        success: true,
        analysis,
        cached: false,
    })
}
