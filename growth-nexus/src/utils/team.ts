import { SupabaseClient } from '@supabase/supabase-js'

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface CompanyAccess {
    companyId: string
    companyName: string
    role: TeamRole
    isOwner: boolean
    canManageJobs: boolean
    canEvaluate: boolean
    canInvite: boolean
    canManageSettings: boolean
}

/**
 * Get the company a user has access to (as owner or team member).
 * Returns null if user has no company access.
 */
export async function getCompanyForUser(
    supabase: SupabaseClient,
    userId: string
): Promise<CompanyAccess | null> {
    // First try: direct ownership (fast path)
    const { data: ownedCompany } = await supabase
        .from('companies')
        .select('id, name')
        .eq('owner_id', userId)
        .single()

    if (ownedCompany) {
        return {
            companyId: ownedCompany.id,
            companyName: ownedCompany.name,
            role: 'owner',
            isOwner: true,
            canManageJobs: true,
            canEvaluate: true,
            canInvite: true,
            canManageSettings: true,
        }
    }

    // Second try: team membership
    const { data: membership } = await supabase
        .from('company_members')
        .select('company_id, role, companies(name)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

    if (membership) {
        const role = membership.role as TeamRole
        return {
            companyId: membership.company_id,
            companyName: (membership.companies as any)?.name || '',
            role,
            isOwner: role === 'owner',
            canManageJobs: ['owner', 'admin'].includes(role),
            canEvaluate: ['owner', 'admin', 'member'].includes(role),
            canInvite: ['owner', 'admin'].includes(role),
            canManageSettings: role === 'owner',
        }
    }

    return null
}

/**
 * Quick check: does the user have access to a specific company?
 */
export async function hasCompanyAccess(
    supabase: SupabaseClient,
    userId: string,
    companyId: string
): Promise<CompanyAccess | null> {
    // Check ownership
    const { data: company } = await supabase
        .from('companies')
        .select('id, name, owner_id')
        .eq('id', companyId)
        .single()

    if (!company) return null

    if (company.owner_id === userId) {
        return {
            companyId: company.id,
            companyName: company.name,
            role: 'owner',
            isOwner: true,
            canManageJobs: true,
            canEvaluate: true,
            canInvite: true,
            canManageSettings: true,
        }
    }

    // Check membership
    const { data: membership } = await supabase
        .from('company_members')
        .select('role')
        .eq('company_id', companyId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

    if (membership) {
        const role = membership.role as TeamRole
        return {
            companyId: company.id,
            companyName: company.name,
            role,
            isOwner: role === 'owner',
            canManageJobs: ['owner', 'admin'].includes(role),
            canEvaluate: ['owner', 'admin', 'member'].includes(role),
            canInvite: ['owner', 'admin'].includes(role),
            canManageSettings: role === 'owner',
        }
    }

    return null
}
