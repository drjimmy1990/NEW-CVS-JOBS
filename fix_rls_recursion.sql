-- ============================================
-- FIX: Infinite Recursion in company_members RLS
-- Run this in Supabase SQL Editor
-- ============================================
-- Problem: company_members SELECT policy queries company_members itself,
-- causing infinite recursion when any other table's policy references company_members.
-- Fix: Use auth.uid() direct checks instead of self-referencing subqueries.

-- ==========================================
-- 1. DROP ALL EXISTING company_members POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Members can view company members" ON public.company_members;
DROP POLICY IF EXISTS "Owners and admins can invite members" ON public.company_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON public.company_members;
DROP POLICY IF EXISTS "Owners can remove members" ON public.company_members;

-- ==========================================
-- 2. RECREATE POLICIES WITHOUT SELF-REFERENCE
-- ==========================================

-- SELECT: Members can see their own rows + rows for companies they own
CREATE POLICY "Members can view company members"
ON public.company_members FOR SELECT
USING (
    user_id = auth.uid()
    OR company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
);

-- INSERT: Only company owners can invite
CREATE POLICY "Owners can invite members"
ON public.company_members FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
);

-- UPDATE: Company owners or the member themselves (to accept invitation)
CREATE POLICY "Owners and self can update members"
ON public.company_members FOR UPDATE
USING (
    user_id = auth.uid()
    OR company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
);

-- DELETE: Only company owners
CREATE POLICY "Owners can remove members"
ON public.company_members FOR DELETE
USING (
    company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
);

-- ==========================================
-- 3. FIX EMIRATISATION POLICIES TOO
-- ==========================================
-- These also reference company_members, but now that company_members
-- policies are non-recursive, they should work. However, let's use
-- the simpler pattern to be safe.

DROP POLICY IF EXISTS "Company owner can manage emiratisation profile" ON public.emiratisation_profiles;
DROP POLICY IF EXISTS "Team members can read emiratisation profile" ON public.emiratisation_profiles;
DROP POLICY IF EXISTS "Manage emiratisation profile" ON public.emiratisation_profiles;

CREATE POLICY "Manage emiratisation profile"
ON public.emiratisation_profiles FOR ALL
USING (
    company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
    OR company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

DROP POLICY IF EXISTS "Company owner can manage audit log" ON public.emiratisation_audit_log;
DROP POLICY IF EXISTS "Team members can read audit log" ON public.emiratisation_audit_log;
DROP POLICY IF EXISTS "Manage audit log" ON public.emiratisation_audit_log;

CREATE POLICY "Manage audit log"
ON public.emiratisation_audit_log FOR ALL
USING (
    company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
    OR company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- ==========================================
-- 4. RELOAD POSTGREST SCHEMA CACHE
-- ==========================================
NOTIFY pgrst, 'reload schema';
