-- ==========================================
-- MIGRATION: Company Team Members
-- ==========================================
-- Adds multi-user team support for companies.
-- Each company can have multiple members with roles.

-- ==========================================
-- 1. CREATE COMPANY_MEMBERS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',  -- 'owner', 'admin', 'member', 'viewer'
    invited_by UUID REFERENCES auth.users(id),
    invited_email TEXT,
    invited_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active',  -- 'pending', 'active', 'revoked'
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, user_id)
);

-- ==========================================
-- 2. RLS POLICIES
-- ==========================================

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Members can see other members of their company
CREATE POLICY "Members can view company members"
ON public.company_members FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM public.company_members WHERE user_id = auth.uid() AND status = 'active'
    )
    OR user_id = auth.uid()
);

-- Only owners and admins can insert (invite)
CREATE POLICY "Owners and admins can invite members"
ON public.company_members FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM public.company_members 
        WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
    OR company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
);

-- Only owners and admins can update (change role, accept)
CREATE POLICY "Owners and admins can update members"
ON public.company_members FOR UPDATE
USING (
    company_id IN (
        SELECT company_id FROM public.company_members 
        WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
    OR user_id = auth.uid()  -- Members can accept their own invitation
);

-- Only owners can delete (remove members)
CREATE POLICY "Owners can remove members"
ON public.company_members FOR DELETE
USING (
    company_id IN (
        SELECT company_id FROM public.company_members 
        WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
);

-- ==========================================
-- 3. INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_company_members_company ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_status ON public.company_members(status);

-- ==========================================
-- 4. AUTO-POPULATE EXISTING OWNERS
-- ==========================================
-- Every existing company owner becomes a team member with 'owner' role

INSERT INTO public.company_members (company_id, user_id, role, status, accepted_at)
SELECT id, owner_id, 'owner', 'active', now()
FROM public.companies
WHERE owner_id IS NOT NULL
ON CONFLICT (company_id, user_id) DO NOTHING;

-- ==========================================
-- 5. HELPER FUNCTION: Get company for user
-- ==========================================
-- Returns the company a user belongs to (as owner OR member)

CREATE OR REPLACE FUNCTION get_user_company(p_user_id UUID)
RETURNS TABLE (
    company_id UUID,
    company_name TEXT,
    member_role TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- First check ownership
    SELECT c.id, c.name, 'owner'::TEXT
    FROM public.companies c
    WHERE c.owner_id = p_user_id
    UNION ALL
    -- Then check membership
    SELECT cm.company_id, c.name, cm.role
    FROM public.company_members cm
    JOIN public.companies c ON c.id = cm.company_id
    WHERE cm.user_id = p_user_id AND cm.status = 'active' AND cm.role != 'owner'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
