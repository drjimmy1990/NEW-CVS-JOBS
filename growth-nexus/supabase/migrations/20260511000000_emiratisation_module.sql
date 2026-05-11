-- ============================================
-- GrowthNexus: Emiratisation / Nafis Compliance Module
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. EMIRATISATION PROFILES TABLE
-- Stores company workforce data for Emiratisation calculations
CREATE TABLE IF NOT EXISTS public.emiratisation_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,

    -- Company Emiratisation Info
    company_type TEXT DEFAULT 'private', -- private, semi_government, government
    economic_sector TEXT,
    emirate TEXT,
    trade_license_number TEXT,
    establishment_number TEXT,
    is_mohre_registered BOOLEAN DEFAULT false,
    uses_nafis BOOLEAN DEFAULT false,

    -- Workforce Size
    total_employees INTEGER DEFAULT 0,
    skilled_employees INTEGER DEFAULT 0,
    unskilled_employees INTEGER DEFAULT 0,
    current_emiratis INTEGER DEFAULT 0,
    emiratis_in_skilled INTEGER DEFAULT 0,
    new_emiratis_this_year INTEGER DEFAULT 0,
    resigned_emiratis_this_year INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. AUDIT LOG TABLE
-- Every change to emiratisation data is tracked
CREATE TABLE IF NOT EXISTS public.emiratisation_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_emiratisation_profiles_company ON public.emiratisation_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_emiratisation_audit_company ON public.emiratisation_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_emiratisation_audit_created ON public.emiratisation_audit_log(created_at DESC);

-- 4. RLS
ALTER TABLE public.emiratisation_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emiratisation_audit_log ENABLE ROW LEVEL SECURITY;

-- Emiratisation Profiles: Owner or team member can read/write
CREATE POLICY "Company owner can manage emiratisation profile"
    ON public.emiratisation_profiles FOR ALL USING (
        company_id IN (
            SELECT id FROM public.companies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Team members can read emiratisation profile"
    ON public.emiratisation_profiles FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.company_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Audit Log: Owner or team member can read
CREATE POLICY "Company owner can manage audit log"
    ON public.emiratisation_audit_log FOR ALL USING (
        company_id IN (
            SELECT id FROM public.companies WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Team members can read audit log"
    ON public.emiratisation_audit_log FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.company_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- 5. Auto-update trigger for emiratisation_profiles
CREATE TRIGGER update_emiratisation_profiles_modtime
    BEFORE UPDATE ON public.emiratisation_profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
