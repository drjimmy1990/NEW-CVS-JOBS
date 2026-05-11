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

    // If no profile exists yet, pre-fill defaults from company registration data
    if (!profile) {
        const { data: company } = await supabase
            .from('companies')
            .select('entity_type, emirate, trade_license_number, employee_count_range, industry')
            .eq('id', companyId)
            .single()

        // Map registration entity_type to emiratisation company_type
        const typeMap: Record<string, string> = {
            'government': 'government',
            'semi_government': 'semi_government',
            'private': 'private',
            'recruitment_agency': 'private',
        }

        // Map sub-cities to parent emirate (UAE_CITIES → UAE_EMIRATES)
        const cityToEmirate: Record<string, string> = {
            'أبوظبي': 'أبوظبي',
            'دبي': 'دبي',
            'الشارقة': 'الشارقة',
            'عجمان': 'عجمان',
            'أم القيوين': 'أم القيوين',
            'رأس الخيمة': 'رأس الخيمة',
            'الفجيرة': 'الفجيرة',
            // Sub-cities mapping
            'العين': 'أبوظبي',
            'الظفرة': 'أبوظبي',
            'الرويس': 'أبوظبي',
            'كلباء': 'الشارقة',
            'حتا': 'دبي',
        }

        // Map registration industry (English key) → emiratisation economic_sector (Arabic)
        const industryToSector: Record<string, string> = {
            'banking': 'المصارف والخدمات المالية',
            'insurance': 'التأمين',
            'technology': 'المعلومات والاتصالات',
            'real_estate': 'العقارات',
            'hospitality': 'السياحة والضيافة',
            'food_beverage': 'السياحة والضيافة',
            'retail': 'التجزئة',
            'logistics': 'النقل والخدمات اللوجستية',
            'aviation_travel': 'النقل والخدمات اللوجستية',
            'healthcare': 'الصحة',
            'education': 'التعليم',
            'universities': 'التعليم',
            'schools': 'التعليم',
            'construction': 'المقاولات والبناء',
            'engineering': 'المقاولات والبناء',
            'investment': 'المصارف والخدمات المالية',
            'oil_gas_energy': 'الطاقة والمرافق',
            'media_marketing': 'الإعلام والترفيه',
            'hr_consulting': 'خدمات الأعمال',
            'government_services': 'خدمات أخرى',
            'other': 'خدمات أخرى',
        }

        // Parse employee_count_range to a rough total_employees number
        const parseEmployeeCount = (range: string | null): number => {
            if (!range) return 0
            // Use midpoint of range for pre-fill
            if (range.includes('1000+') || range.includes('+1000')) return 1000
            if (range.includes('501-1000')) return 750
            if (range.includes('201-500')) return 350
            if (range.includes('51-200')) return 125
            if (range.includes('11-50')) return 30
            if (range.includes('1-10')) return 5
            const match = range.match(/(\d+)/)
            return match ? parseInt(match[1]) : 0
        }

        const defaults = {
            company_type: typeMap[company?.entity_type || ''] || 'private',
            emirate: cityToEmirate[company?.emirate || ''] || company?.emirate || '',
            trade_license_number: company?.trade_license_number || '',
            total_employees: parseEmployeeCount(company?.employee_count_range),
            economic_sector: industryToSector[company?.industry || ''] || '',
        }

        return NextResponse.json({ profile: null, company_id: companyId, defaults })
    }

    return NextResponse.json({ profile, company_id: companyId })
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
