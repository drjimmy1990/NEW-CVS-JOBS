import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { notifyContractEvent } from '@/lib/contract-notify'

// GET: List all contracts for a company
export async function GET(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')

        let query = supabase
            .from('contracts')
            .select(`
                id, status, salary, currency, start_date, benefits,
                sent_at, viewed_at, signed_at, declined_at, expires_at,
                decline_reason, created_at,
                applications ( id, jobs ( title ), candidate_id ),
                contract_templates ( name )
            `)
            .order('created_at', { ascending: false })

        if (status && status !== 'all') {
            query = query.eq('status', status)
        }

        const { data: contracts, error } = await query
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Fetch candidate names
        const candidateIds = [...new Set(
            (contracts || [])
                .map((c: any) => c.applications?.candidate_id)
                .filter(Boolean)
        )]

        let candidateMap: Record<string, string> = {}
        if (candidateIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', candidateIds)
            if (profiles) {
                profiles.forEach((p: any) => { candidateMap[p.id] = p.full_name })
            }
        }

        const enriched = (contracts || []).map((c: any) => ({
            ...c,
            candidate_name: candidateMap[c.applications?.candidate_id] || 'مرشح',
            job_title: c.applications?.jobs?.title || 'وظيفة',
            template_name: c.contract_templates?.name || 'قالب محذوف',
        }))

        return NextResponse.json({ contracts: enriched })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST: Create a new contract
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { application_id, template_id, salary, start_date, benefits, company_id } = body

        if (!application_id || !template_id || !salary || !start_date || !company_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Fetch template HTML
        const { data: template } = await supabase
            .from('contract_templates')
            .select('html_content')
            .eq('id', template_id)
            .single()

        if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

        // Fetch application context
        const { data: app } = await supabase
            .from('applications')
            .select('id, candidate_id, jobs ( title, companies ( name ) )')
            .eq('id', application_id)
            .single()

        const appData = app as any
        const { data: candidateProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', appData?.candidate_id)
            .single()

        // Render HTML with placeholders
        const rendered = template.html_content
            .replace(/\{\{company_name\}\}/g, appData?.jobs?.companies?.name || '')
            .replace(/\{\{candidate_name\}\}/g, candidateProfile?.full_name || '')
            .replace(/\{\{position\}\}/g, appData?.jobs?.title || '')
            .replace(/\{\{salary\}\}/g, salary.toLocaleString())
            .replace(/\{\{start_date\}\}/g, start_date)
            .replace(/\{\{benefits\}\}/g, benefits || '')

        const { data: contract, error } = await supabase
            .from('contracts')
            .insert({
                company_id,
                application_id,
                template_id,
                rendered_html: rendered,
                salary,
                start_date,
                benefits,
                created_by: user.id,
                status: 'draft',
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ contract }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// PATCH: Update contract status
export async function PATCH(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { id, status, decline_reason } = body

        if (!id || !status) return NextResponse.json({ error: 'ID and status required' }, { status: 400 })

        const updates: any = { status }
        if (status === 'sent') updates.sent_at = new Date().toISOString()
        if (status === 'viewed') updates.viewed_at = new Date().toISOString()
        if (status === 'signed') updates.signed_at = new Date().toISOString()
        if (status === 'declined') {
            updates.declined_at = new Date().toISOString()
            updates.decline_reason = decline_reason
        }

        const { data: contract, error } = await supabase
            .from('contracts')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        // If signed, update application status to 'hired'
        if (status === 'signed' && contract) {
            await supabase
                .from('applications')
                .update({ status: 'hired' })
                .eq('id', contract.application_id)
        }

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Fire n8n notification for relevant status changes
        if (contract && ['sent', 'signed', 'declined'].includes(status)) {
            // Fetch context for the notification
            const { data: contractCtx } = await supabase
                .from('contracts')
                .select('salary, currency, start_date, applications ( candidate_id, jobs ( title, companies ( name ) ) )')
                .eq('id', id)
                .single()

            if (contractCtx) {
                const ctx = contractCtx as any
                const candidateId = ctx.applications?.candidate_id
                const { data: candidateProfile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', candidateId)
                    .single()

                const eventMap: Record<string, 'contract_sent' | 'contract_signed' | 'contract_declined'> = {
                    sent: 'contract_sent',
                    signed: 'contract_signed',
                    declined: 'contract_declined',
                }

                notifyContractEvent({
                    event_type: eventMap[status],
                    contract_id: id,
                    candidate_name: candidateProfile?.full_name || 'مرشح',
                    company_name: ctx.applications?.jobs?.companies?.name || '',
                    job_title: ctx.applications?.jobs?.title || '',
                    salary: Number(ctx.salary),
                    currency: ctx.currency || 'AED',
                    start_date: ctx.start_date,
                    decline_reason: decline_reason || null,
                })
            }
        }

        return NextResponse.json({ contract })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
