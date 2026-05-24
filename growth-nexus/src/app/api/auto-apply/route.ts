import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET — get user's auto apply settings + stats + recent log
export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: settings } = await supabase
        .from('auto_apply_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

    const { data: log } = await supabase
        .from('auto_apply_log')
        .select('*, jobs(title, companies(name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)

    return NextResponse.json({
        settings: settings || null,
        log: log || [],
    })
}

// POST — create/update settings (upsert)
export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
        is_active, target_roles, target_skills, target_locations,
        target_job_types, min_salary, min_match_score,
        max_applications_per_month, cover_letter_template, exclude_companies,
    } = body

    // Check if settings exist
    const { data: existing } = await supabase
        .from('auto_apply_settings')
        .select('id')
        .eq('user_id', user.id)
        .single()

    const payload = {
        user_id: user.id,
        is_active: is_active ?? false,
        target_roles: target_roles || [],
        target_skills: target_skills || [],
        target_locations: target_locations || [],
        target_job_types: target_job_types || [],
        min_salary: min_salary || null,
        min_match_score: min_match_score ?? 60,
        max_applications_per_month: max_applications_per_month ?? 50,
        cover_letter_template: cover_letter_template || null,
        exclude_companies: exclude_companies || [],
        updated_at: new Date().toISOString(),
    }

    let result
    if (existing) {
        const { data, error } = await supabase
            .from('auto_apply_settings')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .single()
        if (error) {
            console.error('[auto-apply] Update error:', error.message)
            return NextResponse.json({ error: 'فشل تحديث الإعدادات' }, { status: 500 })
        }
        result = data
    } else {
        const { data, error } = await supabase
            .from('auto_apply_settings')
            .insert(payload)
            .select()
            .single()
        if (error) {
            console.error('[auto-apply] Insert error:', error.message)
            return NextResponse.json({ error: 'فشل إنشاء الإعدادات' }, { status: 500 })
        }
        result = data
    }

    return NextResponse.json({ success: true, settings: result })
}

// DELETE — disable auto apply
export async function DELETE() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
        .from('auto_apply_settings')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)

    if (error) {
        console.error('[auto-apply] Disable error:', error.message)
        return NextResponse.json({ error: 'فشل إيقاف التقديم التلقائي' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
