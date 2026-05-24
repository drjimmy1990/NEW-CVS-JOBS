import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET — list user's alert preferences + recent history
export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: preferences } = await supabase
        .from('job_alert_preferences')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const { data: history } = await supabase
        .from('job_alert_history')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(20)

    return NextResponse.json({
        preferences: preferences || [],
        history: history || [],
    })
}

// POST — create new alert preference
export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { alert_name, keywords, skills, job_types, locations, salary_min, salary_max, frequency } = body

    if (!alert_name?.trim()) {
        return NextResponse.json({ error: 'اسم التنبيه مطلوب' }, { status: 400 })
    }

    // Check max limit from system_config
    const { data: maxConfig } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'job_alerts_max_per_user')
        .single()

    const maxAlerts = parseInt(maxConfig?.value || '3')

    const { count } = await supabase
        .from('job_alert_preferences')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

    if ((count || 0) >= maxAlerts) {
        return NextResponse.json({
            error: `لا يمكن إنشاء أكثر من ${maxAlerts} تنبيهات`,
        }, { status: 400 })
    }

    const { data, error } = await supabase
        .from('job_alert_preferences')
        .insert({
            user_id: user.id,
            alert_name: alert_name.trim(),
            keywords: keywords || [],
            skills: skills || [],
            job_types: job_types || [],
            locations: locations || [],
            salary_min: salary_min || null,
            salary_max: salary_max || null,
            frequency: frequency || 'daily',
        })
        .select()
        .single()

    if (error) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'يوجد تنبيه بنفس الاسم بالفعل' }, { status: 409 })
        }
        console.error('[job-alerts] Insert error:', error.message)
        return NextResponse.json({ error: 'فشل إنشاء التنبيه' }, { status: 500 })
    }

    return NextResponse.json({ success: true, preference: data })
}

// PATCH — update alert preference
export async function PATCH(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { data, error } = await supabase
        .from('job_alert_preferences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

    if (error) {
        console.error('[job-alerts] Update error:', error.message)
        return NextResponse.json({ error: 'فشل تحديث التنبيه' }, { status: 500 })
    }

    return NextResponse.json({ success: true, preference: data })
}

// DELETE — remove alert preference
export async function DELETE(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { error } = await supabase
        .from('job_alert_preferences')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('[job-alerts] Delete error:', error.message)
        return NextResponse.json({ error: 'فشل حذف التنبيه' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
