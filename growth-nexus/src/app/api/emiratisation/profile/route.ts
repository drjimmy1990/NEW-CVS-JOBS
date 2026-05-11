import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/emiratisation/profile
 * Returns the emiratisation profile for the authenticated user's company.
 */
export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve company (owner or team member)
    const companyId = await resolveCompanyId(supabase, user.id)
    if (!companyId) return NextResponse.json({ error: 'No company found' }, { status: 404 })

    const { data: profile } = await supabase
        .from('emiratisation_profiles')
        .select('*')
        .eq('company_id', companyId)
        .single()

    return NextResponse.json({ profile: profile || null, company_id: companyId })
}

/**
 * POST /api/emiratisation/profile
 * Creates or updates the emiratisation profile, logging changes to audit log.
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const companyId = await resolveCompanyId(supabase, user.id)
    if (!companyId) return NextResponse.json({ error: 'No company found' }, { status: 404 })

    const body = await request.json()
    const profileData = {
        company_id: companyId,
        company_type: body.company_type || 'private',
        economic_sector: body.economic_sector || null,
        emirate: body.emirate || null,
        trade_license_number: body.trade_license_number || null,
        establishment_number: body.establishment_number || null,
        is_mohre_registered: body.is_mohre_registered ?? false,
        uses_nafis: body.uses_nafis ?? false,
        total_employees: body.total_employees || 0,
        skilled_employees: body.skilled_employees || 0,
        unskilled_employees: body.unskilled_employees || 0,
        current_emiratis: body.current_emiratis || 0,
        emiratis_in_skilled: body.emiratis_in_skilled || 0,
        new_emiratis_this_year: body.new_emiratis_this_year || 0,
        resigned_emiratis_this_year: body.resigned_emiratis_this_year || 0,
    }

    // Fetch existing profile for audit log diff
    const { data: existing } = await supabase
        .from('emiratisation_profiles')
        .select('*')
        .eq('company_id', companyId)
        .single()

    // Upsert
    const { data: saved, error } = await supabase
        .from('emiratisation_profiles')
        .upsert(
            existing ? { ...profileData, id: existing.id } : profileData,
            { onConflict: 'company_id' }
        )
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Audit log: record changed fields
    if (existing) {
        const auditFields = [
            'company_type', 'economic_sector', 'emirate', 'trade_license_number',
            'establishment_number', 'is_mohre_registered', 'uses_nafis',
            'total_employees', 'skilled_employees', 'unskilled_employees',
            'current_emiratis', 'emiratis_in_skilled', 'new_emiratis_this_year',
            'resigned_emiratis_this_year',
        ] as const

        const auditEntries = auditFields
            .filter(field => String(existing[field] ?? '') !== String(profileData[field] ?? ''))
            .map(field => ({
                company_id: companyId,
                user_id: user.id,
                field_name: field,
                old_value: String(existing[field] ?? ''),
                new_value: String(profileData[field] ?? ''),
            }))

        if (auditEntries.length > 0) {
            await supabase.from('emiratisation_audit_log').insert(auditEntries)
        }
    }

    return NextResponse.json({ profile: saved })
}

// Helper: resolve company ID for owner or team member
async function resolveCompanyId(supabase: any, userId: string): Promise<string | null> {
    const { data: owned } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', userId)
        .single()
    if (owned) return owned.id

    const { data: member } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()
    return member?.company_id || null
}
