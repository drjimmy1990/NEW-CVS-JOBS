-- ============================================
-- GrowthNexus: Emiratisation & Candidates Missing Schema Fixes
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. ADD MISSING COLUMNS TO CANDIDATES TABLE
-- (These were supposed to be added in 001_uae_schema_fixes.sql)
ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS candidate_type text DEFAULT 'resident',
ADD COLUMN IF NOT EXISTS nafis_registered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS emirates_id text,
ADD COLUMN IF NOT EXISTS military_service_status text,
ADD COLUMN IF NOT EXISTS visa_expiry date,
ADD COLUMN IF NOT EXISTS notice_period text,
ADD COLUMN IF NOT EXISTS need_sponsorship boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS residence_emirate text,
ADD COLUMN IF NOT EXISTS family_book_emirate text,
ADD COLUMN IF NOT EXISTS visa_status text,
ADD COLUMN IF NOT EXISTS nationality text,
ADD COLUMN IF NOT EXISTS profile_views_count int DEFAULT 0;

-- 2. EMIRATISATION PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.emiratisation_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
    company_type TEXT DEFAULT 'private',
    economic_sector TEXT,
    emirate TEXT,
    trade_license_number TEXT,
    establishment_number TEXT,
    is_mohre_registered BOOLEAN DEFAULT false,
    uses_nafis BOOLEAN DEFAULT false,
    total_employees INTEGER DEFAULT 0,
    skilled_employees INTEGER DEFAULT 0,
    unskilled_employees INTEGER DEFAULT 0,
    current_emiratis INTEGER DEFAULT 0,
    emiratis_in_skilled INTEGER DEFAULT 0,
    new_emiratis_this_year INTEGER DEFAULT 0,
    resigned_emiratis_this_year INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. EMIRATISATION AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.emiratisation_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL,
    rendered_html TEXT NOT NULL,
    salary NUMERIC(12, 2) NOT NULL,
    currency TEXT DEFAULT 'AED',
    start_date DATE NOT NULL,
    benefits TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'declined', 'expired')),
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    decline_reason TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CONTRACT TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_html TEXT NOT NULL,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. COMPANY MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    invited_by UUID REFERENCES auth.users(id),
    invited_email TEXT,
    invited_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, user_id)
);

-- 7. ENABLE RLS
ALTER TABLE public.emiratisation_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emiratisation_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- 8. CREATE SAFE POLICIES (Using EXISTS instead of IN to prevent complex subquery issues)

-- Drop existing policies if they exist to prevent errors
DROP POLICY IF EXISTS "Company owner can manage emiratisation profile" ON public.emiratisation_profiles;
DROP POLICY IF EXISTS "Team members can read emiratisation profile" ON public.emiratisation_profiles;
DROP POLICY IF EXISTS "Company owner can manage audit log" ON public.emiratisation_audit_log;
DROP POLICY IF EXISTS "Team members can read audit log" ON public.emiratisation_audit_log;

-- Emiratisation Profiles Policies
CREATE POLICY "Manage emiratisation profile" ON public.emiratisation_profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.company_members WHERE company_id = emiratisation_profiles.company_id AND user_id = auth.uid() AND status = 'active')
);

-- Audit Log Policies
CREATE POLICY "Manage audit log" ON public.emiratisation_audit_log FOR ALL USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.company_members WHERE company_id = emiratisation_audit_log.company_id AND user_id = auth.uid() AND status = 'active')
);

-- Contracts Policies
DROP POLICY IF EXISTS "Employers can view company contracts" ON public.contracts;
DROP POLICY IF EXISTS "Employers can create contracts" ON public.contracts;
DROP POLICY IF EXISTS "Employers can update contracts" ON public.contracts;

CREATE POLICY "Manage company contracts" ON public.contracts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.company_members WHERE company_id = contracts.company_id AND user_id = auth.uid() AND status = 'active')
);

-- 9. ADD INDEXES
CREATE INDEX IF NOT EXISTS idx_emiratisation_profiles_company ON public.emiratisation_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_emiratisation_audit_company ON public.emiratisation_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_emiratisation_audit_created ON public.emiratisation_audit_log(created_at DESC);
