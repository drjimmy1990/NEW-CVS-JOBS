import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getCompanyForUser } from '@/utils/team'

// GET — List team members
export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await getCompanyForUser(supabase, user.id)
    if (!access) return NextResponse.json({ error: 'No company' }, { status: 404 })

    const { data: members } = await supabase
        .from('company_members')
        .select('id, user_id, role, status, invited_email, invited_at, accepted_at, profiles:user_id(full_name, email)')
        .eq('company_id', access.companyId)
        .order('created_at', { ascending: true })

    return NextResponse.json({ members: members || [], myRole: access.role })
}

// POST — Invite a member
export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await getCompanyForUser(supabase, user.id)
    if (!access) return NextResponse.json({ error: 'No company' }, { status: 404 })
    if (!access.canInvite) return NextResponse.json({ error: 'لا تملك صلاحية دعوة أعضاء' }, { status: 403 })

    const { email, role = 'member' } = await request.json()
    if (!email) return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 })

    // Check if user exists in profiles
    const { data: targetProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('email', email)
        .single()

    if (!targetProfile) {
        return NextResponse.json({ 
            error: 'لم يتم العثور على مستخدم بهذا البريد الإلكتروني. يجب أن يكون لديه حساب مسجل أولاً.' 
        }, { status: 404 })
    }

    const isCandidate = targetProfile.role === 'candidate'

    // Check if already a member
    const { data: existing } = await supabase
        .from('company_members')
        .select('id, status')
        .eq('company_id', access.companyId)
        .eq('user_id', targetProfile.id)
        .single()

    if (existing) {
        if (existing.status === 'active') {
            return NextResponse.json({ error: 'هذا المستخدم عضو بالفعل في الفريق' }, { status: 409 })
        }
        // Reactivate revoked membership
        await supabase.from('company_members')
            .update({ status: 'active', role, accepted_at: new Date().toISOString() })
            .eq('id', existing.id)
        return NextResponse.json({ success: true, message: 'تمت إعادة تفعيل العضوية' })
    }

    // Create membership (auto-active since user exists)
    const { error } = await supabase.from('company_members').insert({
        company_id: access.companyId,
        user_id: targetProfile.id,
        role: ['admin', 'member', 'viewer'].includes(role) ? role : 'member',
        invited_by: user.id,
        invited_email: email,
        status: 'active',
        accepted_at: new Date().toISOString(),
    })

    if (error) {
        console.error('[team/invite] Error:', error.message)
        return NextResponse.json({ error: 'فشل في إضافة العضو' }, { status: 500 })
    }

    return NextResponse.json({ 
        success: true, 
        message: `تمت إضافة ${targetProfile.full_name || email} إلى الفريق بصلاحية ${role}`,
        warning: isCandidate ? `⚠️ هذا الحساب مسجل كمرشح — سيتمكن من الوصول للوحة تحكم الشركة بالإضافة لحسابه كمرشح` : undefined,
    })
}

// DELETE — Remove a member
export async function DELETE(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await getCompanyForUser(supabase, user.id)
    if (!access) return NextResponse.json({ error: 'No company' }, { status: 404 })
    if (!access.canInvite) return NextResponse.json({ error: 'لا تملك صلاحية إدارة الأعضاء' }, { status: 403 })

    const { memberId } = await request.json()
    if (!memberId) return NextResponse.json({ error: 'Missing memberId' }, { status: 400 })

    // Prevent removing owner
    const { data: member } = await supabase
        .from('company_members')
        .select('role, user_id')
        .eq('id', memberId)
        .single()

    if (member?.role === 'owner') {
        return NextResponse.json({ error: 'لا يمكن إزالة مالك الشركة' }, { status: 403 })
    }

    const { error } = await supabase
        .from('company_members')
        .update({ status: 'revoked' })
        .eq('id', memberId)
        .eq('company_id', access.companyId)

    if (error) {
        return NextResponse.json({ error: 'فشل في إزالة العضو' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'تمت إزالة العضو من الفريق' })
}
