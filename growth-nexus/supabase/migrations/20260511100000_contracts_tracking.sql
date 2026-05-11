-- ============================================
-- GrowthNexus: Contract Tracking System
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. CONTRACTS TABLE
-- Tracks generated contracts linked to applications
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL,
    
    -- Contract Data
    rendered_html TEXT NOT NULL,
    salary NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'AED',
    start_date DATE NOT NULL,
    benefits TEXT,
    
    -- Status Machine: draft → sent → viewed → signed → declined → expired
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'declined', 'expired')),
    
    -- Tracking
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    decline_reason TEXT,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RLS POLICIES
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Employers can view contracts for their company
CREATE POLICY "Employers can view company contracts" ON public.contracts
FOR SELECT USING (
    company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
    OR company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- Employers can create contracts
CREATE POLICY "Employers can create contracts" ON public.contracts
FOR INSERT WITH CHECK (
    company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
    OR company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
);

-- Employers can update contract status
CREATE POLICY "Employers can update contracts" ON public.contracts
FOR UPDATE USING (
    company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
    OR company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_contracts_company ON public.contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_contracts_application ON public.contracts(application_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);

-- 4. TRIGGER: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_contracts_updated_at ON public.contracts;
CREATE TRIGGER trigger_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION update_contracts_updated_at();
