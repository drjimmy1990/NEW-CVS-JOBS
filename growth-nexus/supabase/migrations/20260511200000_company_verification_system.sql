-- ============================================
-- GrowthNexus: Company Verification System
-- Run this in Supabase SQL Editor
-- ============================================

-- ==========================================
-- 1. EXTEND companies TABLE
-- ==========================================

-- Registration data (from wizard)
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS official_name TEXT,
ADD COLUMN IF NOT EXISTS trade_name TEXT,
ADD COLUMN IF NOT EXISTS trade_license_number TEXT,
ADD COLUMN IF NOT EXISTS trade_license_expiry DATE,
ADD COLUMN IF NOT EXISTS emirate TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS contact_person_name TEXT,
ADD COLUMN IF NOT EXISTS contact_person_title TEXT,
ADD COLUMN IF NOT EXISTS employee_count_range TEXT;

-- Verification system
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending_verification'
  CHECK (verification_status IN (
    'pending_verification',
    'email_verified',
    'documents_submitted',
    'under_review',
    'verified',
    'trusted',
    'limited',
    'rejected',
    'suspended'
  )),
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'unknown'
  CHECK (risk_level IN ('unknown', 'low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS email_domain TEXT,
ADD COLUMN IF NOT EXISTS is_email_official BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Extended sector
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS sub_industry TEXT,
ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'private'
  CHECK (entity_type IN ('government', 'semi_government', 'private', 'recruitment_agency'));

-- ==========================================
-- 2. COMPANY DOCUMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.company_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN (
        'trade_license',
        'official_document',
        'proof_of_activity',
        'registration_certificate',
        'other'
    )),
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    ocr_data JSONB,
    ocr_status TEXT DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    uploaded_by UUID REFERENCES auth.users(id)
);

-- ==========================================
-- 3. COMPANY BLACKLIST TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.company_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_domain TEXT,
    phone TEXT,
    license_number TEXT,
    ip_address TEXT,
    reason TEXT NOT NULL,
    added_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 4. COMPANY VERIFICATION LOG (Admin Audit)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.company_verification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL CHECK (action IN (
        'submitted',
        'email_verified',
        'documents_uploaded',
        'review_started',
        'approved',
        'rejected',
        'requested_docs',
        'limited',
        'suspended',
        'blacklisted',
        'resubmitted',
        'trusted'
    )),
    old_status TEXT,
    new_status TEXT,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 5. RLS POLICIES
-- ==========================================

ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_verification_log ENABLE ROW LEVEL SECURITY;

-- Company Documents: company owners and members can manage
CREATE POLICY "Company owners can manage documents"
ON public.company_documents FOR ALL USING (
    company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
    OR company_id IN (
        SELECT company_id FROM public.company_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- Blacklist: admin only
CREATE POLICY "Admins can manage blacklist"
ON public.company_blacklist FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Verification Log: company owners can read their own, admins can read/write all
CREATE POLICY "Company owners can view their verification log"
ON public.company_verification_log FOR SELECT USING (
    company_id IN (
        SELECT id FROM public.companies WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage verification log"
ON public.company_verification_log FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ==========================================
-- 6. INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_companies_verification_status
ON public.companies(verification_status);

CREATE INDEX IF NOT EXISTS idx_companies_entity_type
ON public.companies(entity_type);

CREATE INDEX IF NOT EXISTS idx_companies_risk_level
ON public.companies(risk_level);

CREATE INDEX IF NOT EXISTS idx_companies_email_domain
ON public.companies(email_domain);

CREATE INDEX IF NOT EXISTS idx_company_documents_company
ON public.company_documents(company_id);

CREATE INDEX IF NOT EXISTS idx_company_documents_type
ON public.company_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_company_blacklist_domain
ON public.company_blacklist(email_domain);

CREATE INDEX IF NOT EXISTS idx_company_blacklist_license
ON public.company_blacklist(license_number);

CREATE INDEX IF NOT EXISTS idx_company_verification_log_company
ON public.company_verification_log(company_id);

CREATE INDEX IF NOT EXISTS idx_company_verification_log_created
ON public.company_verification_log(created_at DESC);

-- ==========================================
-- 7. AUTO-VERIFY EXISTING COMPANIES
-- ==========================================
-- All companies created before this migration get auto-verified
-- so existing employers are not disrupted.

UPDATE public.companies
SET verification_status = 'verified',
    verified_at = now(),
    risk_level = 'low',
    risk_score = 80,
    entity_type = COALESCE(
        CASE company_type
            WHEN 'government' THEN 'government'
            WHEN 'semi_government' THEN 'semi_government'
            WHEN 'private' THEN 'private'
        END,
        'private'
    )
WHERE verification_status = 'pending_verification'
  OR verification_status IS NULL;

-- ==========================================
-- 8. STORAGE BUCKET FOR COMPANY DOCUMENTS
-- ==========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('company_documents', 'company_documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage
CREATE POLICY "Company owners can upload documents"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'company_documents'
);

CREATE POLICY "Company owners can view own documents"
ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'company_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'company_documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ==========================================
-- 9. RELOAD POSTGREST SCHEMA CACHE
-- ==========================================
NOTIFY pgrst, 'reload schema';
