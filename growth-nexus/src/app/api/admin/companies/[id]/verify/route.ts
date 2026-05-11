import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { status, notes, old_status } = body

        const supabase = await createClient()

        // 1. Verify admin role
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 2. Update company status
        const updateData: any = {
            verification_status: status,
            verification_notes: notes || null,
        }

        if (status === 'verified' || status === 'trusted') {
            updateData.verified_at = new Date().toISOString()
            updateData.verified_by = user.id
        } else if (status === 'rejected') {
            updateData.rejected_at = new Date().toISOString()
            updateData.rejection_reason = notes || null
        }

        const { error: updateError } = await supabase
            .from('companies')
            .update(updateData)
            .eq('id', id)

        if (updateError) throw updateError

        // 3. Create Audit Log Entry
        const { error: logError } = await supabase
            .from('company_verification_log')
            .insert({
                company_id: id,
                admin_id: user.id,
                action: 'status_change',
                old_status: old_status || 'unknown',
                new_status: status,
                notes: notes || null
            })

        if (logError) {
            console.error('Failed to write audit log:', logError)
            // We don't fail the request if just the log fails, but it's noted
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Verification API Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
