-- ==========================================
-- 🇦🇪 MIGRATION 001: UAE Schema Fixes
-- ==========================================
-- Run this in Supabase SQL Editor
-- Adds: UAE-specific candidate fields, saved items tables, 
-- fixes upsert_private_candidate RPC, and migrates currency to AED

-- ==========================================
-- 1. ADD UAE-SPECIFIC CANDIDATE COLUMNS
-- ==========================================

-- Emirati-specific fields
ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS emirates_id text,
ADD COLUMN IF NOT EXISTS nafis_registered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS military_service_status text; -- 'completed', 'exempt', 'in_progress', null

-- Resident-specific fields
ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS visa_expiry date,
ADD COLUMN IF NOT EXISTS notice_period text, -- '1_week', '1_month', '2_months', '3_months', 'immediate'
ADD COLUMN IF NOT EXISTS need_sponsorship boolean DEFAULT false;

-- Shared UAE fields (already partially exist from previous migration, using IF NOT EXISTS)
ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS candidate_type candidate_type_enum DEFAULT 'resident';

ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS residence_emirate text,
ADD COLUMN IF NOT EXISTS family_book_emirate text,
ADD COLUMN IF NOT EXISTS visa_status text,
ADD COLUMN IF NOT EXISTS nationality text;

-- ==========================================
-- 2. CREATE SAVED_JOBS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id uuid REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
    job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(candidate_id, job_id)
);

-- RLS for saved_jobs
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can manage own saved jobs"
ON public.saved_jobs FOR ALL
USING (candidate_id = auth.uid());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_jobs_candidate ON public.saved_jobs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON public.saved_jobs(job_id);

-- ==========================================
-- 3. CREATE SAVED_CANDIDATES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.saved_candidates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    candidate_id uuid REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(employer_id, candidate_id)
);

-- RLS for saved_candidates
ALTER TABLE public.saved_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can manage own saved candidates"
ON public.saved_candidates FOR ALL
USING (employer_id = auth.uid());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_candidates_employer ON public.saved_candidates(employer_id);
CREATE INDEX IF NOT EXISTS idx_saved_candidates_candidate ON public.saved_candidates(candidate_id);

-- ==========================================
-- 4. FIX upsert_private_candidate RPC
-- ==========================================
-- The old version tried to INSERT into profiles with a random UUID, 
-- which violates the FK to auth.users.
-- 
-- NEW approach: If the candidate email already exists in profiles, 
-- use that ID. If not, we CANNOT create a profile row without a 
-- corresponding auth.users row. Instead, the Next.js Server Action 
-- should use the Supabase Admin API to create a guest user first,
-- then call this function.
--
-- This function now ONLY handles the case where the user already exists.
-- For new guest users, the Server Action creates the auth user first.

CREATE OR REPLACE FUNCTION upsert_private_candidate(
  p_email text,
  p_full_name text,
  p_cv_url text,
  p_auth_user_id uuid DEFAULT NULL -- NEW: optionally pass the pre-created auth user ID
) RETURNS uuid AS $$
DECLARE
  v_candidate_id uuid;
BEGIN
  -- Try to find existing user by email
  SELECT id INTO v_candidate_id FROM public.profiles WHERE email = p_email;
  
  IF v_candidate_id IS NULL THEN
    -- If no existing user found, we need an auth user ID
    IF p_auth_user_id IS NULL THEN
      RAISE EXCEPTION 'No existing user found and no auth_user_id provided. Create the auth user first via Server Action.';
    END IF;
    
    -- Use the pre-created auth user ID
    v_candidate_id := p_auth_user_id;
    
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (v_candidate_id, p_email, p_full_name, 'candidate');
    
    INSERT INTO public.candidates (id, cv_url, is_public)
    VALUES (v_candidate_id, p_cv_url, false);
  ELSE
    -- Existing user: just update their CV
    UPDATE public.candidates SET cv_url = p_cv_url WHERE id = v_candidate_id;
  END IF;

  RETURN v_candidate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. MIGRATE CURRENCY DEFAULTS TO AED
-- ==========================================

-- Jobs table
ALTER TABLE public.jobs ALTER COLUMN currency SET DEFAULT 'AED';

-- Transactions table  
ALTER TABLE public.transactions ALTER COLUMN currency SET DEFAULT 'AED';

-- Update any existing SAR defaults to AED
UPDATE public.jobs SET currency = 'AED' WHERE currency = 'SAR';
UPDATE public.transactions SET currency = 'AED' WHERE currency = 'SAR';

-- Update system_config pricing descriptions
UPDATE public.system_config 
SET description = REPLACE(description, 'SAR', 'AED')
WHERE description LIKE '%SAR%';

-- ==========================================
-- 6. ADD PRIORITY APPLICATION SUPPORT
-- ==========================================

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS is_priority boolean DEFAULT false;

-- ==========================================
-- 7. ADD PROFILE VIEWS TRACKING TO CANDIDATES 
-- ==========================================

ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS profile_views_count int DEFAULT 0;

-- Function to safely increment profile views (called from client-side API)
CREATE OR REPLACE FUNCTION increment_candidate_views(p_candidate_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.candidates
  SET profile_views_count = profile_views_count + 1
  WHERE id = p_candidate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 8. MATCH SCORE FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION calculate_match_score(
  p_job_id uuid,
  p_candidate_id uuid
) RETURNS integer AS $$
DECLARE
  v_job_skills text[];
  v_candidate_skills text[];
  v_matched int;
  v_total int;
BEGIN
  SELECT skills_required INTO v_job_skills FROM public.jobs WHERE id = p_job_id;
  SELECT skills INTO v_candidate_skills FROM public.candidates WHERE id = p_candidate_id;
  
  -- If either has no skills, return 0
  IF v_job_skills IS NULL OR v_candidate_skills IS NULL THEN
    RETURN 0;
  END IF;
  
  v_total := array_length(v_job_skills, 1);
  IF v_total IS NULL OR v_total = 0 THEN
    RETURN 0;
  END IF;
  
  -- Count matching skills (case-insensitive)
  SELECT COUNT(*) INTO v_matched
  FROM unnest(v_job_skills) js
  WHERE EXISTS (
    SELECT 1 FROM unnest(v_candidate_skills) cs 
    WHERE LOWER(TRIM(cs)) = LOWER(TRIM(js))
  );
  
  -- Return percentage (0-100)
  RETURN LEAST(100, (v_matched * 100) / v_total);
END;
$$ LANGUAGE plpgsql STABLE;
