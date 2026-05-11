import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET: Fetch single contract for the authenticated candidate
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Fetch the contract with its application
        const { data: contract, error } = await supabase
            .from('contracts')
            .select(`
                id, status, salary, currency, start_date, benefits,
                rendered_html,
                sent_at, viewed_at, signed_at, declined_at, expires_at,
                decline_reason, created_at,
                applications ( id, candidate_id, jobs ( title, companies ( name ) ) ),
                contract_templates ( name )
            `)
            .eq('id', id)
            .single()

        if (error || !contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
        }

        // Verify this contract belongs to the candidate
        const appData = contract as any
        if (appData.applications?.candidate_id !== user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        return NextResponse.json({
            contract: {
                id: contract.id,
                status: contract.status,
                salary: contract.salary,
                currency: contract.currency,
                start_date: contract.start_date,
                benefits: contract.benefits,
                rendered_html: contract.rendered_html,
                sent_at: contract.sent_at,
                viewed_at: contract.viewed_at,
                signed_at: contract.signed_at,
                declined_at: contract.declined_at,
                expires_at: contract.expires_at,
                decline_reason: contract.decline_reason,
                created_at: contract.created_at,
                company_name: appData.applications?.jobs?.companies?.name || 'شركة',
                job_title: appData.applications?.jobs?.title || 'وظيفة',
                template_name: (contract as any).contract_templates?.name || 'قالب',
            }
        })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// PATCH: Candidate updates contract status (viewed, signed, declined)
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { status, decline_reason } = body

        // Validate allowed statuses for candidates
        const allowedStatuses = ['viewed', 'signed', 'declined']
        if (!allowedStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Candidates can only set: ${allowedStatuses.join(', ')}` },
                { status: 400 }
            )
        }

        // Fetch the contract to verify ownership and current status
        const { data: existingContract, error: fetchErr } = await supabase
            .from('contracts')
            .select('id, status, application_id, applications ( candidate_id )')
            .eq('id', id)
            .single()

        if (fetchErr || !existingContract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
        }

        const existing = existingContract as any
        if (existing.applications?.candidate_id !== user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        // Validate status transitions
        const validTransitions: Record<string, string[]> = {
            sent: ['viewed'],
            viewed: ['signed', 'declined'],
        }

        const allowed = validTransitions[existing.status]
        if (!allowed || !allowed.includes(status)) {
            return NextResponse.json(
                { error: `Cannot transition from '${existing.status}' to '${status}'` },
                { status: 400 }
            )
        }

        // Build update payload
        const updates: any = { status }
        if (status === 'viewed') updates.viewed_at = new Date().toISOString()
        if (status === 'signed') updates.signed_at = new Date().toISOString()
        if (status === 'declined') {
            if (!decline_reason) {
                return NextResponse.json({ error: 'Decline reason is required' }, { status: 400 })
            }
            updates.declined_at = new Date().toISOString()
            updates.decline_reason = decline_reason
        }

        const { data: updatedContract, error: updateErr } = await supabase
            .from('contracts')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (updateErr) {
            return NextResponse.json({ error: updateErr.message }, { status: 500 })
        }

        // If signed, update application status to 'hired'
        if (status === 'signed' && updatedContract) {
            await supabase
                .from('applications')
                .update({ status: 'hired' })
                .eq('id', updatedContract.application_id)
        }

        return NextResponse.json({ contract: updatedContract })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
