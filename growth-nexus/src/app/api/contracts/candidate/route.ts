import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET: List all contracts for the authenticated candidate
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Get all applications for this candidate
        const { data: applications } = await supabase
            .from('applications')
            .select('id')
            .eq('candidate_id', user.id)

        if (!applications || applications.length === 0) {
            return NextResponse.json({ contracts: [] })
        }

        const applicationIds = applications.map(a => a.id)

        // Fetch contracts linked to those applications
        const { data: contracts, error } = await supabase
            .from('contracts')
            .select(`
                id, status, salary, currency, start_date, benefits,
                rendered_html,
                sent_at, viewed_at, signed_at, declined_at, expires_at,
                decline_reason, created_at,
                applications ( id, jobs ( title, companies ( name ) ) ),
                contract_templates ( name )
            `)
            .in('application_id', applicationIds)
            .in('status', ['sent', 'viewed', 'signed', 'declined', 'expired'])
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[Candidate Contracts] Error:', error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const enriched = (contracts || []).map((c: any) => ({
            id: c.id,
            status: c.status,
            salary: c.salary,
            currency: c.currency,
            start_date: c.start_date,
            benefits: c.benefits,
            sent_at: c.sent_at,
            viewed_at: c.viewed_at,
            signed_at: c.signed_at,
            declined_at: c.declined_at,
            expires_at: c.expires_at,
            decline_reason: c.decline_reason,
            created_at: c.created_at,
            company_name: c.applications?.jobs?.companies?.name || 'شركة',
            job_title: c.applications?.jobs?.title || 'وظيفة',
            template_name: c.contract_templates?.name || 'قالب',
        }))

        return NextResponse.json({ contracts: enriched })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
