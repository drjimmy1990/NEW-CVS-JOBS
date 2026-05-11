import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
    classifyCompany,
    calculateGap,
    getComplianceStatus,
    generateAlerts,
    generateActionPlan,
    type EmiratisationProfile,
} from '@/lib/emiratisation-engine'

/**
 * POST /api/emiratisation/export
 * Generates export data for PDF/Excel reports.
 * Body: { format: 'pdf' | 'excel', type: 'compliance' | 'gap' | 'candidates' | 'jobs' }
 * 
 * NOTE: Actual PDF/Excel rendering is done client-side using jsPDF/xlsx.
 * This API returns structured data for the client to render.
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve company
    let companyId: string | null = null
    const { data: owned } = await supabase.from('companies').select('id, name').eq('owner_id', user.id).single()
    if (owned) {
        companyId = owned.id
    } else {
        const { data: member } = await supabase
            .from('company_members')
            .select('company_id, companies(id, name)')
            .eq('user_id', user.id).eq('status', 'active').single()
        if (member) companyId = member.company_id
    }
    if (!companyId) return NextResponse.json({ error: 'No company found' }, { status: 404 })

    const body = await request.json()
    const { type } = body

    // Fetch emiratisation profile
    const { data: profileData } = await supabase
        .from('emiratisation_profiles')
        .select('*')
        .eq('company_id', companyId)
        .single()

    if (!profileData) {
        return NextResponse.json({ error: 'No emiratisation profile found' }, { status: 404 })
    }

    const profile: EmiratisationProfile = profileData as EmiratisationProfile

    // Fetch company name
    const { data: company } = await supabase.from('companies').select('name').eq('id', companyId).single()
    const companyName = company?.name || 'الشركة'

    switch (type) {
        case 'compliance': {
            const category = classifyCompany(profile.total_employees)
            const gap = calculateGap(profile)
            const compliance = getComplianceStatus(profile)
            const alerts = generateAlerts(profile)

            return NextResponse.json({
                report: {
                    title: 'تقرير التزام التوطين',
                    companyName,
                    date: new Date().toISOString(),
                    category,
                    compliance,
                    gap,
                    alerts: alerts.map(a => ({ title: a.title, description: a.description, severity: a.severity })),
                    profile: {
                        total_employees: profile.total_employees,
                        skilled_employees: profile.skilled_employees,
                        current_emiratis: profile.current_emiratis,
                        emiratis_in_skilled: profile.emiratis_in_skilled,
                    },
                },
            })
        }

        case 'gap': {
            const gap = calculateGap(profile)
            const actionPlan = generateActionPlan(profile)

            return NextResponse.json({
                report: {
                    title: 'تقرير فجوة التوطين',
                    companyName,
                    date: new Date().toISOString(),
                    gap,
                    actionPlan,
                    profile: {
                        total_employees: profile.total_employees,
                        skilled_employees: profile.skilled_employees,
                        current_emiratis: profile.current_emiratis,
                        emiratis_in_skilled: profile.emiratis_in_skilled,
                        new_emiratis_this_year: profile.new_emiratis_this_year,
                        resigned_emiratis_this_year: profile.resigned_emiratis_this_year,
                    },
                },
            })
        }

        case 'candidates': {
            // Fetch emirati candidates
            const { data: candidates } = await supabase
                .from('candidates')
                .select('id, headline, skills, years_experience, residence_emirate, profiles:id(full_name)')
                .eq('candidate_type', 'emirati')
                .eq('is_public', true)
                .limit(50)

            return NextResponse.json({
                report: {
                    title: 'تقرير المرشحين المواطنين المقترحين',
                    companyName,
                    date: new Date().toISOString(),
                    candidates: (candidates || []).map((c: any) => ({
                        name: c.profiles?.full_name || 'مرشح',
                        headline: c.headline || '',
                        skills: (c.skills || []).join(', '),
                        experience: c.years_experience || 0,
                        location: c.residence_emirate || '',
                    })),
                },
            })
        }

        case 'jobs': {
            // Fetch company jobs
            const { data: jobs } = await supabase
                .from('jobs')
                .select('title, status, location_city, job_type')
                .eq('company_id', companyId)
                .eq('status', 'active')

            return NextResponse.json({
                report: {
                    title: 'تقرير الوظائف المناسبة للتوطين',
                    companyName,
                    date: new Date().toISOString(),
                    jobs: (jobs || []).map(j => ({
                        title: j.title,
                        location: j.location_city,
                        type: j.job_type,
                        status: j.status,
                    })),
                },
            })
        }

        default:
            return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
}
