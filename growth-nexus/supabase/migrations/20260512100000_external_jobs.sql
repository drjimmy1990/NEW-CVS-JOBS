-- ==========================================
-- 🌐 MIGRATION: External Jobs Aggregator
-- ==========================================
-- Run in Supabase SQL Editor
--
-- Creates external_jobs table for scraped jobs from LinkedIn, Bayt, etc.
-- Features: access_level gating, click tracking, auto-expiry
-- Safe: All IF NOT EXISTS / CREATE OR REPLACE — idempotent
-- ==========================================

-- ==========================================
-- 1. EXTERNAL JOBS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.external_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Source tracking (from n8n scraper)
  external_id text,                        -- LinkedIn job ID, Bayt ID, etc.
  source_platform text NOT NULL,           -- 'linkedin', 'bayt', 'gulftalen', 'indeed'
  source_url text NOT NULL,                -- Original job link (Apply button redirects here)
  
  -- Job details (scraped data)
  title text NOT NULL,
  company_name text,                       -- Scraped company name (NOT a FK)
  company_logo_url text,                   -- Scraped logo URL
  description text,
  job_type text DEFAULT 'full_time',       -- full_time, part_time, contract, remote, internship
  location_city text,
  location_country text DEFAULT 'UAE',
  salary_min int,
  salary_max int,
  currency text DEFAULT 'AED',
  skills_required text[],                  -- Array for matching
  experience_level text,
  
  -- Admin controls
  access_level text DEFAULT 'public',      -- 'public' | 'registered' | 'premium'
  is_active boolean DEFAULT true,          -- Admin can deactivate
  is_featured boolean DEFAULT false,       -- Pin to top
  
  -- Stats
  views_count int DEFAULT 0,
  clicks_count int DEFAULT 0,             -- "Apply" click counter
  
  -- SEO
  slug text UNIQUE,
  
  -- Timestamps
  posted_at timestamptz,                   -- Original posting date from source
  scraped_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),  -- 30-day default expiry
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate imports
  UNIQUE(source_platform, external_id)
);

-- ==========================================
-- 2. INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_ext_jobs_active ON public.external_jobs (is_active);
CREATE INDEX IF NOT EXISTS idx_ext_jobs_access ON public.external_jobs (access_level);
CREATE INDEX IF NOT EXISTS idx_ext_jobs_source ON public.external_jobs (source_platform);
CREATE INDEX IF NOT EXISTS idx_ext_jobs_city ON public.external_jobs (location_city);
CREATE INDEX IF NOT EXISTS idx_ext_jobs_skills ON public.external_jobs USING GIN (skills_required);
CREATE INDEX IF NOT EXISTS idx_ext_jobs_created ON public.external_jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ext_jobs_slug ON public.external_jobs (slug);
CREATE INDEX IF NOT EXISTS idx_ext_jobs_expires ON public.external_jobs (expires_at);

-- ==========================================
-- 3. ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.external_jobs ENABLE ROW LEVEL SECURITY;

-- Anonymous users: only active public jobs that haven't expired
CREATE POLICY "anon_read_public_external_jobs"
  ON public.external_jobs FOR SELECT TO anon
  USING (
    is_active = true 
    AND access_level = 'public'
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Authenticated users: public + registered jobs (not expired)
CREATE POLICY "auth_read_external_jobs"
  ON public.external_jobs FOR SELECT TO authenticated
  USING (
    is_active = true 
    AND access_level IN ('public', 'registered', 'premium')
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Admin: full CRUD access (all jobs, even inactive/expired)
CREATE POLICY "admin_full_external_jobs"
  ON public.external_jobs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- 4. CLICK TRACKING RPC
-- ==========================================

CREATE OR REPLACE FUNCTION increment_external_job_clicks(job_id_input uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.external_jobs
  SET clicks_count = clicks_count + 1
  WHERE id = job_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. VIEW COUNT RPC
-- ==========================================

CREATE OR REPLACE FUNCTION increment_external_job_views(job_id_input uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.external_jobs
  SET views_count = views_count + 1
  WHERE id = job_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. AUTO-UPDATE TIMESTAMP TRIGGER
-- ==========================================

CREATE TRIGGER update_external_jobs_updated_at
  BEFORE UPDATE ON public.external_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 7. NOTIFY POSTGREST
-- ==========================================

NOTIFY pgrst, 'reload schema';
