-- 1. EXTENSIONS
-- Enable UUIDs for keys
create extension if not exists "uuid-ossp";
-- Enable Full Text Search (Critical for Job Board Search)
create extension if not exists "pg_trgm";

-- 2. ENUMS (Strict Typing)
create type user_role as enum ('candidate', 'employer', 'admin');

create type job_type as enum ('full_time', 'part_time', 'contract', 'remote', 'internship');

create type job_status as enum ('draft', 'active', 'expired', 'closed', 'archived');

create type app_status as enum ('applied', 'reviewing', 'interview', 'shortlisted', 'rejected', 'hired');

-- 3. PROFILES (Identity Layer)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    role user_role default 'candidate',
    full_name text,
    avatar_url text,
    phone text,
    credits_balance int default 0, -- For Candidate Services (CV Review)
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 4. COMPANIES (Employer Data)
create table public.companies (
    id uuid primary key default uuid_generate_v4 (),
    owner_id uuid references public.profiles (id),
    name text not null,
    slug text unique not null, -- SEO: /company/google
    logo_url text,
    website text,
    description text,
    industry text,
    size_range text, -- e.g. "10-50 employees"
    is_verified boolean default false,
    subscription_tier text default 'free', -- free, basic, premium
    job_credits int default 0, -- Balance for posting jobs
    cv_view_credits int default 0, -- Balance for viewing candidate phones
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 5. CANDIDATES (Job Seeker Data)
create table public.candidates (
    id uuid references public.profiles (id) primary key,
    headline text, -- e.g. "Senior React Developer"
    cv_url text, -- Path to file in Supabase Storage
    resume_parsed_data jsonb, -- The AI extraction result (Work Exp, Education)
    skills text [], -- Array for fast matching e.g. ['React', 'Node']
    years_experience int default 0,
    city text,
    country text default 'Saudi Arabia',
    linkedin_url text,
    portfolio_url text,
    is_public boolean default true, -- Allow recruiters to find them
    updated_at timestamptz default now()
);

-- 6. JOBS (The Listing)
create table public.jobs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id),
  title text not null,
  slug text unique not null, -- SEO: /jobs/senior-react-dev-123
  description text not null, -- HTML content
  job_type job_type default 'full_time',
  location_city text not null,
  location_country text default 'Saudi Arabia',
  salary_min int,
  salary_max int,
  currency text default 'SAR',
  skills_required text[], -- Array for matching

-- Logic Flags
is_confidential boolean default false, -- SOP: Hides Company Name
is_featured boolean default false, -- SOP: Pins to top

-- Stats & Status
views_count int default 0,
applicants_count int default 0,
status job_status default 'active',

-- Search Optimization


search_vector tsvector, -- Auto-generated for high speed search
  
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. APPLICATIONS (The Connection)


create table public.applications (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references public.jobs(id) on delete cascade,
  candidate_id uuid references public.candidates(id),
  
  cover_letter text,
  status app_status default 'applied',

-- Snapshot: We store the CV URL *at the time of application*
-- so if the user changes their CV later, this application stays relevant.
resume_snapshot_url text,

-- Source tracking (Did they come from a private Landing Page?)


source text default 'platform', -- 'platform' or 'landing_page_token'
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(job_id, candidate_id) -- Prevent double applying
);

-- 8. LANDING PAGES (SOP Page 4 - Private Collections)
create table public.landing_pages (
    id uuid primary key default uuid_generate_v4 (),
    company_id uuid references public.companies (id),
    title text not null, -- Internal name (e.g. "Q4 Hiring Campaign")
    token text unique not null, -- Random string for URL
    job_description text,
    is_active boolean default true,
    views_count int default 0,
    created_at timestamptz default now()
);

-- 9. TRANSACTIONS (Commerce)
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id),
  amount decimal(10,2) not null,
  currency text default 'SAR',
  status text default 'pending', -- pending, paid, failed

-- What did they buy?
type text not null, -- 'job_pack', 'cv_service', 'featured_upgrade'
package_id text, -- e.g. 'basic_pack'

-- Payment Provider Data


provider_id text default 'edfapay',
  provider_tx_ref text, 
  
  created_at timestamptz default now()
);

-- 10. SYSTEM CONFIG (Dynamic Settings)
create table public.system_config (
    key text primary key,
    value text not null,
    description text,
    group_name text, -- 'pricing', 'general'
    is_secret boolean default false -- If true, RLS hides this from public
);

-- ==========================================
-- 🛡️ SECURITY & PERFORMANCE LAYER
-- ==========================================

-- A. The Secure Public View (Crucial for Confidential Jobs)
-- Frontend uses this view to fetch jobs. It automatically sanitizes data.
create or replace view public.public_jobs_view as
select
    j.id,
    j.title,
    j.slug,
    j.job_type,
    j.location_city,
    j.salary_min,
    j.salary_max,
    j.skills_required,
    j.is_featured,
    j.created_at,
    j.expires_at,
    -- Confidentiality Logic
    case
        when j.is_confidential then 'Confidential Company'
        else c.name
    end as company_name,
    case
        when j.is_confidential then null
        else c.logo_url
    end as company_logo,
    case
        when j.is_confidential then null
        else c.slug
    end as company_slug
from public.jobs j
    join public.companies c on j.company_id = c.id
where
    j.status = 'active'
    and j.expires_at > now();

-- B. Indexes (For Speed)
-- These ensure the dashboard loads fast even with 100k+ rows
create index idx_jobs_status on public.jobs (status);

create index idx_jobs_company on public.jobs (company_id);

create index idx_apps_job on public.applications (job_id);

create index idx_apps_candidate on public.applications (candidate_id);

create index idx_jobs_search on public.jobs using gin (search_vector);
-- Fast Search

-- C. Auto-Update Timestamp Function
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Apply Triggers
create trigger update_profiles_modtime before update on public.profiles for each row execute procedure update_updated_at_column();

create trigger update_companies_modtime before update on public.companies for each row execute procedure update_updated_at_column();

create trigger update_jobs_modtime before update on public.jobs for each row execute procedure update_updated_at_column();

create trigger update_applications_modtime before update on public.applications for each row execute procedure update_updated_at_column();

-- D. Initial Data (System Config)
insert into
    public.system_config (
        key,
        value,
        group_name,
        description
    )
values (
        'price_job_single',
        '100',
        'pricing',
        'Price for 1 job credit (SAR)'
    ),
    (
        'price_featured_addon',
        '50',
        'pricing',
        'Price to feature a job (SAR)'
    ),
    (
        'credits_new_employer',
        '1',
        'onboarding',
        'Free credits given to new companies'
    );

-- ==========================================
-- 🛡️ ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR
SELECT USING (auth.uid () = id);

CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid () = id);

CREATE POLICY "Users can insert own profile" ON public.profiles FOR
INSERT
WITH
    CHECK (auth.uid () = id);

-- Companies RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read companies" ON public.companies FOR
SELECT USING (true);

CREATE POLICY "Owner can insert company" ON public.companies FOR
INSERT
WITH
    CHECK (auth.uid () = owner_id);

CREATE POLICY "Owner can update company" ON public.companies FOR
UPDATE USING (auth.uid () = owner_id);

-- Jobs RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active jobs" ON public.jobs FOR
SELECT USING (status = 'active');

CREATE POLICY "Owner can manage jobs" ON public.jobs FOR ALL USING (
    company_id IN (
        SELECT id
        FROM public.companies
        WHERE
            owner_id = auth.uid ()
    )
);

-- Candidates RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read public candidates" ON public.candidates FOR
SELECT USING (is_public = true);

CREATE POLICY "Owner can manage own candidate profile" ON public.candidates FOR ALL USING (auth.uid () = id);

-- Applications RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidate can insert" ON public.applications FOR
INSERT
WITH
    CHECK (candidate_id = auth.uid ());

CREATE POLICY "Candidate can read own applications" ON public.applications FOR
SELECT USING (candidate_id = auth.uid ());

CREATE POLICY "Employer can read applications for their jobs" ON public.applications FOR
SELECT USING (
        job_id IN (
            SELECT id
            FROM public.jobs
            WHERE
                company_id IN (
                    SELECT id
                    FROM public.companies
                    WHERE
                        owner_id = auth.uid ()
                )
        )
    );

CREATE POLICY "Employer can update application status" ON public.applications FOR
UPDATE USING (
    job_id IN (
        SELECT id
        FROM public.jobs
        WHERE
            company_id IN (
                SELECT id
                FROM public.companies
                WHERE
                    owner_id = auth.uid ()
            )
    )
);

-- Landing Pages RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage landing pages" ON public.landing_pages FOR ALL USING (
    company_id IN (
        SELECT id
        FROM public.companies
        WHERE
            owner_id = auth.uid ()
    )
);

CREATE POLICY "Public can read active landing pages" ON public.landing_pages FOR
SELECT USING (is_active = true);

-- Transactions RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions" ON public.transactions FOR
SELECT USING (auth.uid () = user_id);

-- System Config RLS (Admin only for secrets)
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read non-secret config" ON public.system_config FOR
SELECT USING (is_secret = false);

-- 1. Add Source Tracking to Applications
alter table public.applications
add column if not exists source text default 'platform';

-- 2. Upsert Candidate from Private Form
create or replace function upsert_private_candidate(
  p_email text,
  p_full_name text,
  p_cv_url text
) returns uuid as $$
declare
  v_candidate_id uuid;
begin
  select id into v_candidate_id from public.profiles where email = p_email;
  
  if v_candidate_id is null then
    v_candidate_id := gen_random_uuid();
    insert into public.profiles (id, email, full_name, role)
    values (v_candidate_id, p_email, p_full_name, 'candidate');
    
    insert into public.candidates (id, cv_url, is_public)
    values (v_candidate_id, p_cv_url, false);
  else
    update public.candidates set cv_url = p_cv_url where id = v_candidate_id;
  end if;

  return v_candidate_id;
end;
$$ language plpgsql security definer;

-- 3. Get or Create Private Tracking Job
create or replace function get_or_create_private_job(
  p_company_id uuid,
  p_landing_page_id uuid
) returns uuid as $$
declare
  v_job_id uuid;
  v_slug text;
begin
  v_slug := 'private-campaign-' || p_landing_page_id;

  select id into v_job_id from public.jobs where slug = v_slug;

  if v_job_id is null then
    insert into public.jobs (
      company_id, title, slug, description, location_city, status, job_type
    ) values (
      p_company_id, 
      'Private Campaign Applicants', 
      v_slug, 
      'Hidden job used to collect applicants from custom landing page links.', 
      'Remote', 
      'archived', 
      'full_time'
    ) returning id into v_job_id;
  end if;

  return v_job_id;
end;
$$ language plpgsql security definer;

-- 4. Increment Views Logic
create or replace function increment_landing_page_views(page_id uuid)
returns void as $$
begin
  update public.landing_pages
  set views_count = views_count + 1
  where id = page_id;
end;
$$ language plpgsql security definer;

-- 1. Create the new enum
create type candidate_type_enum as enum ('emirati', 'resident');

-- 2. Add the new columns to the candidates table
alter table public.candidates
add column candidate_type candidate_type_enum default 'resident';

alter table public.candidates
add column residence_emirate text,
add column family_book_emirate text,
add column visa_status text,
add column nationality text;

-- 3. Update the default country
alter table public.candidates
alter column country
set default 'United Arab Emirates';

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own resumes" ON storage.objects FOR INSERT TO authenticated
WITH
    CHECK (
        bucket_id = 'resumes'
        AND (storage.foldername (name)) [1] = auth.uid ()::text
    );

-- Allow authenticated users to update/replace their own resumes
CREATE POLICY "Users can update own resumes" ON storage.objects
FOR UPDATE
    TO authenticated USING (
        bucket_id = 'resumes'
        AND (storage.foldername (name)) [1] = auth.uid ()::text
    );

-- Allow authenticated users to delete their own resumes
CREATE POLICY "Users can delete own resumes" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'resumes'
    AND (storage.foldername (name)) [1] = auth.uid ()::text
);

-- Allow public read access (for download links)
CREATE POLICY "Public can read resumes" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'resumes');

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
ADD COLUMN IF NOT EXISTS military_service_status text;
-- 'completed', 'exempt', 'in_progress', null

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
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    candidate_id uuid REFERENCES public.candidates (id) ON DELETE CASCADE NOT NULL,
    job_id uuid REFERENCES public.jobs (id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (candidate_id, job_id)
);

-- RLS for saved_jobs
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can manage own saved jobs" ON public.saved_jobs FOR ALL USING (candidate_id = auth.uid ());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_jobs_candidate ON public.saved_jobs (candidate_id);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON public.saved_jobs (job_id);

-- ==========================================
-- 3. CREATE SAVED_CANDIDATES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.saved_candidates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    employer_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE NOT NULL,
    candidate_id uuid REFERENCES public.candidates (id) ON DELETE CASCADE NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (employer_id, candidate_id)
);

-- RLS for saved_candidates
ALTER TABLE public.saved_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can manage own saved candidates" ON public.saved_candidates FOR ALL USING (employer_id = auth.uid ());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_candidates_employer ON public.saved_candidates (employer_id);

CREATE INDEX IF NOT EXISTS idx_saved_candidates_candidate ON public.saved_candidates (candidate_id);

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
ALTER TABLE public.transactions
ALTER COLUMN currency
SET DEFAULT 'AED';

-- Update any existing SAR defaults to AED
UPDATE public.jobs SET currency = 'AED' WHERE currency = 'SAR';

UPDATE public.transactions
SET
    currency = 'AED'
WHERE
    currency = 'SAR';

-- Update system_config pricing descriptions
UPDATE public.system_config
SET
    description =
REPLACE (description, 'SAR', 'AED')
WHERE
    description LIKE '%SAR%';

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

-- ============================================
-- GrowthNexus: Messaging System Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    participant_1 UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    unread_count_1 INTEGER DEFAULT 0, -- unread count for participant_1
    unread_count_2 INTEGER DEFAULT 0, -- unread count for participant_2
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (participant_1, participant_2)
);

-- 2. Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    conversation_id UUID NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON public.conversations (participant_1);

CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON public.conversations (participant_2);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages (conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages (created_at);

-- 4. Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations FOR
SELECT USING (
        auth.uid () IN (participant_1, participant_2)
    );

CREATE POLICY "Users can insert conversations they participate in" ON public.conversations FOR
INSERT
WITH
    CHECK (
        auth.uid () IN (participant_1, participant_2)
    );

CREATE POLICY "Users can update their own conversations" ON public.conversations FOR
UPDATE USING (
    auth.uid () IN (participant_1, participant_2)
);

-- 6. RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR
SELECT USING (
        conversation_id IN (
            SELECT id
            FROM public.conversations
            WHERE
                auth.uid () IN (participant_1, participant_2)
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR
INSERT
WITH
    CHECK (
        auth.uid () = sender_id
        AND conversation_id IN (
            SELECT id
            FROM public.conversations
            WHERE
                auth.uid () IN (participant_1, participant_2)
        )
    );

CREATE POLICY "Users can mark messages as read" ON public.messages FOR
UPDATE USING (
    conversation_id IN (
        SELECT id
        FROM public.conversations
        WHERE
            auth.uid () IN (participant_1, participant_2)
    )
);

-- 7. CV Unlocks table (for paywall)
CREATE TABLE IF NOT EXISTS public.cv_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    employer_id UUID NOT NULL REFERENCES public.profiles (id),
    candidate_id UUID NOT NULL REFERENCES public.candidates (id),
    unlocked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (employer_id, candidate_id)
);

ALTER TABLE public.cv_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view their unlocks" ON public.cv_unlocks FOR
SELECT USING (auth.uid () = employer_id);

CREATE POLICY "Employers can insert unlocks" ON public.cv_unlocks FOR
INSERT
WITH
    CHECK (auth.uid () = employer_id);

-- ============================================
-- GrowthNexus: Messaging Update Unread Triggers
-- Run this in Supabase SQL Editor
-- ============================================

-- Function to update unread counts in conversations
CREATE OR REPLACE FUNCTION public.update_unread_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update unread_count_1 (where participant_1 is NOT the sender and message is not read)
    UPDATE public.conversations c
    SET unread_count_1 = (
        SELECT count(*)
        FROM public.messages m
        WHERE m.conversation_id = c.id
          AND m.sender_id != c.participant_1
          AND m.is_read = false
    )
    WHERE c.id = COALESCE(NEW.conversation_id, OLD.conversation_id);

    -- Update unread_count_2 (where participant_2 is NOT the sender and message is not read)
    UPDATE public.conversations c
    SET unread_count_2 = (
        SELECT count(*)
        FROM public.messages m
        WHERE m.conversation_id = c.id
          AND m.sender_id != c.participant_2
          AND m.is_read = false
    )
    WHERE c.id = COALESCE(NEW.conversation_id, OLD.conversation_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on insert, update, or delete of messages
DROP TRIGGER IF EXISTS update_unread_counts_trigger ON public.messages;

CREATE TRIGGER update_unread_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_unread_counts();

-- ==========================================
-- 004_applicants_count_trigger.sql
-- ==========================================

-- Function to recalculate the applicants_count on a job whenever an application is added, removed, or changed.
CREATE OR REPLACE FUNCTION update_job_applicants_count()
RETURNS TRIGGER AS $$
DECLARE
  v_job_id UUID;
  v_count INT;
BEGIN
  -- Determine the related job_id
  IF TG_OP = 'DELETE' THEN
    v_job_id := OLD.job_id;
  ELSE
    v_job_id := NEW.job_id;
  END IF;

  -- Recalculate the total number of applications for this job
  SELECT count(*) INTO v_count
  FROM public.applications
  WHERE job_id = v_job_id;

  -- Update the jobs table
  UPDATE public.jobs
  SET applicants_count = v_count,
      updated_at = now()
  WHERE id = v_job_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to fire the function after INSERT, UPDATE (if job_id changes), or DELETE
DROP TRIGGER IF EXISTS trigger_update_job_applicants_count ON public.applications;

CREATE TRIGGER trigger_update_job_applicants_count
AFTER INSERT OR DELETE OR UPDATE OF job_id
ON public.applications
FOR EACH ROW
EXECUTE FUNCTION update_job_applicants_count();

-- Optional: Run a backfill to correct any existing discrepancies
UPDATE public.jobs j
SET
    applicants_count = (
        SELECT count(*)
        FROM public.applications a
        WHERE
            a.job_id = j.id
    );

-- ============================================
-- GrowthNexus Phase 5: SaaS Enhancements Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. ADD 'paused' to job_status enum
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'paused';

-- 2. ADD 'offer' to app_status enum
ALTER TYPE app_status ADD VALUE IF NOT EXISTS 'offer' BEFORE 'hired';

-- 3. ADD company_type enum and column
DO $$ BEGIN
  CREATE TYPE company_type_enum AS ENUM ('government', 'semi_government', 'private');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS company_type company_type_enum DEFAULT 'private';

-- 4. ADD rejection_reason to applications
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 5. ADD nationality_requirements to jobs (multi-select)
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS nationality_requirements TEXT[];

-- 6. ADD skills_required if missing (already exists but ensure)
-- Already in schema, skip

-- 7. UPDATE public_jobs_view to show entity type for confidential listings
-- Must DROP first because PostgreSQL cannot rename/reorder columns with CREATE OR REPLACE VIEW
DROP VIEW IF EXISTS public.public_jobs_view;

CREATE VIEW public.public_jobs_view AS
SELECT
    j.id,
    j.title,
    j.slug,
    j.job_type,
    j.location_city,
    j.salary_min,
    j.salary_max,
    j.currency,
    j.skills_required,
    j.nationality_requirements,
    j.is_featured,
    j.created_at,
    j.expires_at,
    j.applicants_count,
    -- Confidentiality Logic: show entity type instead of generic text
    CASE
        WHEN j.is_confidential
        AND c.company_type = 'government' THEN 'جهة حكومية'
        WHEN j.is_confidential
        AND c.company_type = 'semi_government' THEN 'جهة شبه حكومية'
        WHEN j.is_confidential THEN 'جهة خاصة'
        ELSE c.name
    END AS company_name,
    CASE
        WHEN j.is_confidential THEN NULL
        ELSE c.logo_url
    END AS company_logo,
    CASE
        WHEN j.is_confidential THEN NULL
        ELSE c.slug
    END AS company_slug
FROM public.jobs j
    JOIN public.companies c ON j.company_id = c.id
WHERE
    j.status = 'active'
    AND (
        j.expires_at IS NULL
        OR j.expires_at > now()
    );

-- 8. INSERT UAE cities into system_config for reference
INSERT INTO
    public.system_config (
        key,
        value,
        group_name,
        description
    )
VALUES (
        'uae_cities',
        '["أبوظبي","دبي","الشارقة","عجمان","أم القيوين","رأس الخيمة","الفجيرة","العين","كلباء","حتا","الظفرة","الرويس"]',
        'location',
        'UAE cities list for job posting dropdown'
    ) ON CONFLICT (key) DO
UPDATE
SET
    value = EXCLUDED.value;

-- 9. INSERT nationality options into system_config
INSERT INTO
    public.system_config (
        key,
        value,
        group_name,
        description
    )
VALUES (
        'nationality_options',
        '[{"value":"all","label":"جميع الجنسيات"},{"value":"uae","label":"مواطنون إماراتيون"},{"value":"gcc","label":"دول الخليج"},{"value":"arab","label":"الجنسيات العربية"},{"value":"expat","label":"الجنسيات الأجنبية"}]',
        'hiring',
        'Nationality filter options for job posting'
    ) ON CONFLICT (key) DO
UPDATE
SET
    value = EXCLUDED.value;

-- 10. INSERT rejection reasons into system_config
INSERT INTO
    public.system_config (
        key,
        value,
        group_name,
        description
    )
VALUES (
        'rejection_reasons',
        '[{"value":"not_suitable","label":"غير مناسب"},{"value":"low_experience","label":"خبرة قليلة"},{"value":"salary_mismatch","label":"راتب غير مناسب"},{"value":"overqualified","label":"مؤهلات أعلى من المطلوب"},{"value":"location_mismatch","label":"الموقع غير مناسب"},{"value":"skills_gap","label":"فجوة في المهارات"},{"value":"other","label":"سبب آخر"}]',
        'hiring',
        'Predefined rejection reason options'
    ) ON CONFLICT (key) DO
UPDATE
SET
    value = EXCLUDED.value;

-- Phase 8: Stripe Billing + Interview AI + Committee Evaluation
-- Run this migration after 20260422000000_phase5_enhancements.sql

-- ============================================
-- 8A: Stripe Billing Columns
-- ============================================

-- Stripe fields on companies (employer subscriptions)
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Stripe fields on profiles (candidate one-time purchases)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- ============================================
-- 8B: Interview AI Columns
-- ============================================

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS auto_interview BOOLEAN DEFAULT false;

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS interview_score INTEGER;

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS interview_report JSONB;

-- ============================================
-- 8C: Committee Evaluation
-- ============================================

CREATE TABLE IF NOT EXISTS committee_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    application_id UUID REFERENCES applications (id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES profiles (id),
    scores JSONB NOT NULL,
    notes TEXT,
    total_score INTEGER,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (application_id, evaluator_id)
);

ALTER TABLE committee_evaluations ENABLE ROW LEVEL SECURITY;

-- Evaluators can manage their own evaluations
CREATE POLICY "evaluators_own" ON committee_evaluations FOR ALL USING (evaluator_id = auth.uid ());

-- Employers can read evaluations for their jobs
CREATE POLICY "employers_read_evaluations" ON committee_evaluations FOR
SELECT USING (
        application_id IN (
            SELECT a.id
            FROM
                applications a
                JOIN jobs j ON a.job_id = j.id
                JOIN companies c ON j.company_id = c.id
            WHERE
                c.owner_id = auth.uid ()
        )
    );

-- Committee summary stored on applications
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS committee_summary JSONB;

-- ============================================
-- Stripe pricing reference in system_config
-- ============================================

INSERT INTO
    system_config (
        key,
        value,
        description,
        group_name
    )
VALUES (
        'stripe_starter_monthly',
        '349',
        'Starter plan monthly price (AED)',
        'pricing'
    ),
    (
        'stripe_growth_monthly',
        '799',
        'Growth plan monthly price (AED)',
        'pricing'
    ),
    (
        'stripe_pro_monthly',
        '1499',
        'Pro plan monthly price (AED)',
        'pricing'
    ),
    (
        'stripe_starter_yearly',
        '3490',
        'Starter plan yearly price (AED)',
        'pricing'
    ),
    (
        'stripe_growth_yearly',
        '7990',
        'Growth plan yearly price (AED)',
        'pricing'
    ),
    (
        'stripe_pro_yearly',
        '14990',
        'Pro plan yearly price (AED)',
        'pricing'
    ) ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Job Views Atomic Increment Function
-- ============================================

CREATE OR REPLACE FUNCTION increment_job_views(job_id_input UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.jobs
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = job_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow users to read their own profile
CREATE POLICY "Users read own profile" ON profiles FOR
SELECT USING (auth.uid () = id);

-- Phase 9: Contract Automation
-- Creates the contract_templates table and seed data

CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    company_id UUID REFERENCES public.companies (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Employers can read system templates (company_id IS NULL) and their own templates
CREATE POLICY "Employers can view system and own templates" ON public.contract_templates FOR
SELECT USING (
        company_id IS NULL
        OR company_id IN (
            SELECT id
            FROM public.companies
            WHERE
                owner_id = auth.uid ()
        )
    );

-- Employers can insert their own templates
CREATE POLICY "Employers can insert own templates" ON public.contract_templates FOR
INSERT
WITH
    CHECK (
        company_id IN (
            SELECT id
            FROM public.companies
            WHERE
                owner_id = auth.uid ()
        )
    );

-- Employers can update their own templates
CREATE POLICY "Employers can update own templates" ON public.contract_templates FOR
UPDATE USING (
    company_id IN (
        SELECT id
        FROM public.companies
        WHERE
            owner_id = auth.uid ()
    )
);

-- Employers can delete their own templates
CREATE POLICY "Employers can delete own templates" ON public.contract_templates FOR DELETE USING (
    company_id IN (
        SELECT id
        FROM public.companies
        WHERE
            owner_id = auth.uid ()
    )
);

-- Insert Default MOHRE Template
INSERT INTO
    public.contract_templates (
        name,
        html_content,
        company_id
    )
VALUES (
        'عقد عمل قياسي - وزارة الموارد البشرية (MOHRE)',
        '<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: "Arial", sans-serif; padding: 40px; line-height: 1.6; }
        h1 { text-align: center; color: #0A1628; border-bottom: 2px solid #C8973A; padding-bottom: 10px; }
        .details { margin-top: 30px; }
        .details p { margin: 10px 0; font-size: 16px; }
        .signature { margin-top: 60px; display: flex; justify-content: space-between; }
        .sig-box { width: 40%; text-align: center; border-top: 1px solid #333; padding-top: 10px; }
    </style>
</head>
<body>
    <h1>عقد عمل محدد المدة</h1>
    
    <div class="details">
        <p><strong>الطرف الأول (صاحب العمل):</strong> {{company_name}}</p>
        <p><strong>الطرف الثاني (العامل):</strong> {{candidate_name}}</p>
        <p><strong>المسمى الوظيفي:</strong> {{position}}</p>
        <p><strong>الراتب الإجمالي:</strong> {{salary}} درهم إماراتي</p>
        <p><strong>تاريخ المباشرة:</strong> {{start_date}}</p>
    </div>

    <div class="terms">
        <h3>الشروط والأحكام:</h3>
        <ol>
            <li>يخضع هذا العقد لقوانين وزارة الموارد البشرية والتوطين في دولة الإمارات العربية المتحدة.</li>
            <li>فترة التجربة محددة بـ 6 أشهر تبدأ من تاريخ المباشرة.</li>
            <li>المزايا الإضافية: {{benefits}}</li>
        </ol>
    </div>

    <div class="signature">
        <div class="sig-box">توقيع الطرف الأول<br>{{company_name}}</div>
        <div class="sig-box">توقيع الطرف الثاني<br>{{candidate_name}}</div>
    </div>
</body>
</html>',
        NULL
    ) ON CONFLICT DO NOTHING;

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS ai_match_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_analysis TEXT;

-- ==========================================
-- Save Interview Results (Bypass RLS)
-- ==========================================
-- This function allows saving interview results
-- from the candidate's session without needing
-- a service role key.

CREATE OR REPLACE FUNCTION save_interview_result(
    p_application_id UUID,
    p_interview_score INTEGER,
    p_interview_report JSONB
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.applications
    SET 
        interview_score = p_interview_score,
        interview_report = p_interview_report
    WHERE id = p_application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure candidates can read their own interview data
-- and employers can read interview data for their job applicants

-- ==========================================
-- MIGRATION: Company Team Members
-- ==========================================
-- Adds multi-user team support for companies.
-- Each company can have multiple members with roles.

-- ==========================================
-- 1. CREATE COMPANY_MEMBERS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    company_id UUID REFERENCES public.companies (id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
    invited_by UUID REFERENCES auth.users (id),
    invited_email TEXT,
    invited_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active', -- 'pending', 'active', 'revoked'
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (company_id, user_id)
);

-- ==========================================
-- 2. RLS POLICIES
-- ==========================================

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Members can see other members of their company
CREATE POLICY "Members can view company members" ON public.company_members FOR
SELECT USING (
        company_id IN (
            SELECT company_id
            FROM public.company_members
            WHERE
                user_id = auth.uid ()
                AND status = 'active'
        )
        OR user_id = auth.uid ()
    );

-- Only owners and admins can insert (invite)
CREATE POLICY "Owners and admins can invite members" ON public.company_members FOR
INSERT
WITH
    CHECK (
        company_id IN (
            SELECT company_id
            FROM public.company_members
            WHERE
                user_id = auth.uid ()
                AND status = 'active'
                AND role IN ('owner', 'admin')
        )
        OR company_id IN (
            SELECT id
            FROM public.companies
            WHERE
                owner_id = auth.uid ()
        )
    );

-- Only owners and admins can update (change role, accept)
CREATE POLICY "Owners and admins can update members" ON public.company_members FOR
UPDATE USING (
    company_id IN (
        SELECT company_id
        FROM public.company_members
        WHERE
            user_id = auth.uid ()
            AND status = 'active'
            AND role IN ('owner', 'admin')
    )
    OR user_id = auth.uid () -- Members can accept their own invitation
);

-- Only owners can delete (remove members)
CREATE POLICY "Owners can remove members" ON public.company_members FOR DELETE USING (
    company_id IN (
        SELECT company_id
        FROM public.company_members
        WHERE
            user_id = auth.uid ()
            AND status = 'active'
            AND role IN ('owner', 'admin')
    )
);

-- ==========================================
-- 3. INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_company_members_company ON public.company_members (company_id);

CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members (user_id);

CREATE INDEX IF NOT EXISTS idx_company_members_status ON public.company_members (status);

-- ==========================================
-- 4. AUTO-POPULATE EXISTING OWNERS
-- ==========================================
-- Every existing company owner becomes a team member with 'owner' role

INSERT INTO
    public.company_members (
        company_id,
        user_id,
        role,
        status,
        accepted_at
    )
SELECT id, owner_id, 'owner', 'active', now()
FROM public.companies
WHERE
    owner_id IS NOT NULL ON CONFLICT (company_id, user_id) DO NOTHING;

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

-- ==========================================
-- MIGRATION: Notifications System
-- ==========================================
-- In-app notifications for employers and candidates

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'new_application', 'interview_complete', 'status_change', 'message', 'system'
    title TEXT NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}', -- { job_id, application_id, candidate_name, etc. }
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR
SELECT USING (user_id = auth.uid ());

CREATE POLICY "Users can update own notifications" ON public.notifications FOR
UPDATE USING (user_id = auth.uid ());

-- System can insert via SECURITY DEFINER function
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_body TEXT DEFAULT NULL,
    p_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (p_user_id, p_type, p_title, p_body, p_data)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (user_id, is_read)
WHERE
    is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications (created_at DESC);

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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES public.companies (id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_emiratisation_profiles_company ON public.emiratisation_profiles (company_id);

CREATE INDEX IF NOT EXISTS idx_emiratisation_audit_company ON public.emiratisation_audit_log (company_id);

CREATE INDEX IF NOT EXISTS idx_emiratisation_audit_created ON public.emiratisation_audit_log (created_at DESC);

-- 4. RLS
ALTER TABLE public.emiratisation_profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.emiratisation_audit_log ENABLE ROW LEVEL SECURITY;

-- Emiratisation Profiles: Owner or team member can read/write
CREATE POLICY "Company owner can manage emiratisation profile" ON public.emiratisation_profiles FOR ALL USING (
    company_id IN (
        SELECT id
        FROM public.companies
        WHERE
            owner_id = auth.uid ()
    )
);

CREATE POLICY "Team members can read emiratisation profile" ON public.emiratisation_profiles FOR
SELECT USING (
        company_id IN (
            SELECT company_id
            FROM public.company_members
            WHERE
                user_id = auth.uid ()
                AND status = 'active'
        )
    );

-- Audit Log: Owner or team member can read
CREATE POLICY "Company owner can manage audit log" ON public.emiratisation_audit_log FOR ALL USING (
    company_id IN (
        SELECT id
        FROM public.companies
        WHERE
            owner_id = auth.uid ()
    )
);

CREATE POLICY "Team members can read audit log" ON public.emiratisation_audit_log FOR
SELECT USING (
        company_id IN (
            SELECT company_id
            FROM public.company_members
            WHERE
                user_id = auth.uid ()
                AND status = 'active'
        )
    );

-- 5. Auto-update trigger for emiratisation_profiles
CREATE TRIGGER update_emiratisation_profiles_modtime
    BEFORE UPDATE ON public.emiratisation_profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

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
salary NUMERIC(12, 2) NOT NULL,
currency TEXT DEFAULT 'AED',
start_date DATE NOT NULL,
benefits TEXT,

-- Status Machine: draft → sent → viewed → signed → declined → expired
status TEXT DEFAULT 'draft' CHECK (
    status IN (
        'draft',
        'sent',
        'viewed',
        'signed',
        'declined',
        'expired'
    )
),

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
CREATE POLICY "Employers can view company contracts" ON public.contracts FOR
SELECT USING (
        company_id IN (
            SELECT id
            FROM public.companies
            WHERE
                owner_id = auth.uid ()
        )
        OR company_id IN (
            SELECT company_id
            FROM public.company_members
            WHERE
                user_id = auth.uid ()
                AND status = 'active'
        )
    );

-- Employers can create contracts
CREATE POLICY "Employers can create contracts" ON public.contracts FOR
INSERT
WITH
    CHECK (
        company_id IN (
            SELECT id
            FROM public.companies
            WHERE
                owner_id = auth.uid ()
        )
        OR company_id IN (
            SELECT company_id
            FROM public.company_members
            WHERE
                user_id = auth.uid ()
                AND status = 'active'
                AND role IN ('owner', 'admin')
        )
    );

-- Employers can update contract status
CREATE POLICY "Employers can update contracts" ON public.contracts FOR
UPDATE USING (
    company_id IN (
        SELECT id
        FROM public.companies
        WHERE
            owner_id = auth.uid ()
    )
    OR company_id IN (
        SELECT company_id
        FROM public.company_members
        WHERE
            user_id = auth.uid ()
            AND status = 'active'
            AND role IN ('owner', 'admin')
    )
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_contracts_company ON public.contracts (company_id);

CREATE INDEX IF NOT EXISTS idx_contracts_application ON public.contracts (application_id);

CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts (status);

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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES public.companies (id) ON DELETE CASCADE NOT NULL UNIQUE,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES public.companies (id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES public.companies (id) ON DELETE CASCADE NOT NULL,
    application_id UUID REFERENCES public.applications (id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES public.contract_templates (id) ON DELETE SET NULL,
    rendered_html TEXT NOT NULL,
    salary NUMERIC(12, 2) NOT NULL,
    currency TEXT DEFAULT 'AED',
    start_date DATE NOT NULL,
    benefits TEXT,
    status TEXT DEFAULT 'draft' CHECK (
        status IN (
            'draft',
            'sent',
            'viewed',
            'signed',
            'declined',
            'expired'
        )
    ),
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    decline_reason TEXT,
    created_by UUID REFERENCES auth.users (id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CONTRACT TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES public.companies (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_html TEXT NOT NULL,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. COMPANY MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    company_id UUID REFERENCES public.companies (id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    invited_by UUID REFERENCES auth.users (id),
    invited_email TEXT,
    invited_at TIMESTAMPTZ DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (company_id, user_id)
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
    EXISTS (
        SELECT 1
        FROM public.companies
        WHERE
            id = company_id
            AND owner_id = auth.uid ()
    )
    OR EXISTS (
        SELECT 1
        FROM public.company_members
        WHERE
            company_id = emiratisation_profiles.company_id
            AND user_id = auth.uid ()
            AND status = 'active'
    )
);

-- Audit Log Policies
CREATE POLICY "Manage audit log" ON public.emiratisation_audit_log FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.companies
        WHERE
            id = company_id
            AND owner_id = auth.uid ()
    )
    OR EXISTS (
        SELECT 1
        FROM public.company_members
        WHERE
            company_id = emiratisation_audit_log.company_id
            AND user_id = auth.uid ()
            AND status = 'active'
    )
);

-- Contracts Policies
DROP POLICY IF EXISTS "Employers can view company contracts" ON public.contracts;

DROP POLICY IF EXISTS "Employers can create contracts" ON public.contracts;

DROP POLICY IF EXISTS "Employers can update contracts" ON public.contracts;

CREATE POLICY "Manage company contracts" ON public.contracts FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.companies
        WHERE
            id = company_id
            AND owner_id = auth.uid ()
    )
    OR EXISTS (
        SELECT 1
        FROM public.company_members
        WHERE
            company_id = contracts.company_id
            AND user_id = auth.uid ()
            AND status = 'active'
    )
);

-- 9. ADD INDEXES
CREATE INDEX IF NOT EXISTS idx_emiratisation_profiles_company ON public.emiratisation_profiles (company_id);

CREATE INDEX IF NOT EXISTS idx_emiratisation_audit_company ON public.emiratisation_audit_log (company_id);

CREATE INDEX IF NOT EXISTS idx_emiratisation_audit_created ON public.emiratisation_audit_log (created_at DESC);

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
CREATE POLICY "Members can view company members" ON public.company_members FOR
SELECT USING (
        user_id = auth.uid ()
        OR company_id IN (
            SELECT id
            FROM public.companies
            WHERE
                owner_id = auth.uid ()
        )
    );

-- INSERT: Only company owners can invite
CREATE POLICY "Owners can invite members" ON public.company_members FOR
INSERT
WITH
    CHECK (
        company_id IN (
            SELECT id
            FROM public.companies
            WHERE
                owner_id = auth.uid ()
        )
    );

-- UPDATE: Company owners or the member themselves (to accept invitation)
CREATE POLICY "Owners and self can update members" ON public.company_members FOR
UPDATE USING (
    user_id = auth.uid ()
    OR company_id IN (
        SELECT id
        FROM public.companies
        WHERE
            owner_id = auth.uid ()
    )
);

-- DELETE: Only company owners
CREATE POLICY "Owners can remove members" ON public.company_members FOR DELETE USING (
    company_id IN (
        SELECT id
        FROM public.companies
        WHERE
            owner_id = auth.uid ()
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

CREATE POLICY "Manage emiratisation profile" ON public.emiratisation_profiles FOR ALL USING (
    company_id IN (
        SELECT id
        FROM public.companies
        WHERE
            owner_id = auth.uid ()
    )
    OR company_id IN (
        SELECT company_id
        FROM public.company_members
        WHERE
            user_id = auth.uid ()
            AND status = 'active'
    )
);

DROP POLICY IF EXISTS "Company owner can manage audit log" ON public.emiratisation_audit_log;

DROP POLICY IF EXISTS "Team members can read audit log" ON public.emiratisation_audit_log;

DROP POLICY IF EXISTS "Manage audit log" ON public.emiratisation_audit_log;

CREATE POLICY "Manage audit log" ON public.emiratisation_audit_log FOR ALL USING (
    company_id IN (
        SELECT id
        FROM public.companies
        WHERE
            owner_id = auth.uid ()
    )
    OR company_id IN (
        SELECT company_id
        FROM public.company_members
        WHERE
            user_id = auth.uid ()
            AND status = 'active'
    )
);

-- ==========================================
-- 4. RELOAD POSTGREST SCHEMA CACHE
-- ==========================================
NOTIFY pgrst, 'reload schema';

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
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending_verification' CHECK (
    verification_status IN (
        'pending_verification',
        'email_verified',
        'documents_submitted',
        'under_review',
        'verified',
        'trusted',
        'limited',
        'rejected',
        'suspended'
    )
),
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'unknown' CHECK (
    risk_level IN (
        'unknown',
        'low',
        'medium',
        'high'
    )
),
ADD COLUMN IF NOT EXISTS email_domain TEXT,
ADD COLUMN IF NOT EXISTS is_email_official BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users (id),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Extended sector
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS sub_industry TEXT,
ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'private' CHECK (
    entity_type IN (
        'government',
        'semi_government',
        'private',
        'recruitment_agency'
    )
);

-- ==========================================
-- 2. COMPANY DOCUMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.company_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES public.companies (id) ON DELETE CASCADE NOT NULL,
    document_type TEXT NOT NULL CHECK (
        document_type IN (
            'trade_license',
            'official_document',
            'proof_of_activity',
            'registration_certificate',
            'other'
        )
    ),
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    ocr_data JSONB,
    ocr_status TEXT DEFAULT 'pending' CHECK (
        ocr_status IN (
            'pending',
            'processing',
            'completed',
            'failed'
        )
    ),
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    uploaded_by UUID REFERENCES auth.users (id)
);

-- ==========================================
-- 3. COMPANY BLACKLIST TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.company_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    email_domain TEXT,
    phone TEXT,
    license_number TEXT,
    ip_address TEXT,
    reason TEXT NOT NULL,
    added_by UUID REFERENCES auth.users (id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 4. COMPANY VERIFICATION LOG (Admin Audit)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.company_verification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    company_id UUID REFERENCES public.companies (id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES auth.users (id),
    action TEXT NOT NULL CHECK (
        action IN (
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
        )
    ),
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
CREATE POLICY "Company owners can manage documents" ON public.company_documents FOR ALL USING (
    company_id IN (
        SELECT id
        FROM public.companies
        WHERE
            owner_id = auth.uid ()
    )
    OR company_id IN (
        SELECT company_id
        FROM public.company_members
        WHERE
            user_id = auth.uid ()
            AND status = 'active'
    )
);

-- Blacklist: admin only
CREATE POLICY "Admins can manage blacklist" ON public.company_blacklist FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);

-- Verification Log: company owners can read their own, admins can read/write all
CREATE POLICY "Company owners can view their verification log" ON public.company_verification_log FOR
SELECT USING (
        company_id IN (
            SELECT id
            FROM public.companies
            WHERE
                owner_id = auth.uid ()
        )
    );

CREATE POLICY "Admins can manage verification log" ON public.company_verification_log FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);

-- ==========================================
-- 6. INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_companies_verification_status ON public.companies (verification_status);

CREATE INDEX IF NOT EXISTS idx_companies_entity_type ON public.companies (entity_type);

CREATE INDEX IF NOT EXISTS idx_companies_risk_level ON public.companies (risk_level);

CREATE INDEX IF NOT EXISTS idx_companies_email_domain ON public.companies (email_domain);

CREATE INDEX IF NOT EXISTS idx_company_documents_company ON public.company_documents (company_id);

CREATE INDEX IF NOT EXISTS idx_company_documents_type ON public.company_documents (document_type);

CREATE INDEX IF NOT EXISTS idx_company_blacklist_domain ON public.company_blacklist (email_domain);

CREATE INDEX IF NOT EXISTS idx_company_blacklist_license ON public.company_blacklist (license_number);

CREATE INDEX IF NOT EXISTS idx_company_verification_log_company ON public.company_verification_log (company_id);

CREATE INDEX IF NOT EXISTS idx_company_verification_log_created ON public.company_verification_log (created_at DESC);

-- ==========================================
-- 7. AUTO-VERIFY EXISTING COMPANIES
-- ==========================================
-- All companies created before this migration get auto-verified
-- so existing employers are not disrupted.

UPDATE public.companies
SET
    verification_status = 'verified',
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
WHERE
    verification_status = 'pending_verification'
    OR verification_status IS NULL;

-- ==========================================
-- 8. STORAGE BUCKET FOR COMPANY DOCUMENTS
-- ==========================================

INSERT INTO
    storage.buckets (id, name, public)
VALUES (
        'company_documents',
        'company_documents',
        false
    ) ON CONFLICT (id) DO NOTHING;

-- RLS for storage
CREATE POLICY "Company owners can upload documents" ON storage.objects FOR
INSERT
    TO authenticated
WITH
    CHECK (
        bucket_id = 'company_documents'
    );

CREATE POLICY "Company owners can view own documents"
ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'company_documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all documents" ON storage.objects FOR
SELECT TO authenticated USING (
        bucket_id = 'company_documents'
        AND EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE
                id = auth.uid ()
                AND role = 'admin'
        )
    );

-- ==========================================
-- 9. RELOAD POSTGREST SCHEMA CACHE
-- ==========================================
NOTIFY pgrst, 'reload schema';

-- ==========================================
-- 🧠 MIGRATION: Enhanced Match Score Algorithm
-- ==========================================
-- Run this in Supabase SQL Editor
--
-- Adds: Missing columns for matching + Enhanced composite score function
-- Safe: Uses IF NOT EXISTS / CREATE OR REPLACE — idempotent
-- ==========================================

-- ==========================================
-- 1. ENSURE CANDIDATE PREFERENCE COLUMNS EXIST
-- ==========================================

ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS expected_salary text,
ADD COLUMN IF NOT EXISTS open_to_remote boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_location text,
ADD COLUMN IF NOT EXISTS preferred_job_type text DEFAULT 'full_time';

-- ==========================================
-- 2. ENSURE JOB EXPERIENCE LEVEL COLUMN EXISTS
-- ==========================================

ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS experience_level text;

-- ==========================================
-- 3. ENHANCED calculate_match_score FUNCTION
-- ==========================================
-- Composite weighted algorithm:
--   Skills (Jaccard Similarity) : 45%
--   Experience Compatibility    : 25%
--   Salary Alignment            : 15%
--   Location Match              : 15%
-- ==========================================

CREATE OR REPLACE FUNCTION calculate_match_score(
  p_job_id uuid,
  p_candidate_id uuid
) RETURNS integer AS $$
DECLARE
  -- Job fields
  v_job_skills text[];
  v_job_exp_level text;
  v_job_salary_min int;
  v_job_salary_max int;
  v_job_city text;
  v_job_type text;

  -- Candidate fields
  v_cand_skills text[];
  v_cand_years int;
  v_cand_salary_text text;
  v_cand_salary numeric;
  v_cand_city text;
  v_cand_emirate text;
  v_cand_preferred_location text;
  v_cand_open_remote boolean;

  -- Scoring variables
  v_skill_score numeric := 0;
  v_exp_score numeric := 0;
  v_salary_score numeric := 0;
  v_location_score numeric := 0;
  v_final_score numeric := 0;

  -- Skill calculation helpers
  v_intersection int := 0;
  v_union_size int := 0;

  -- Experience calculation helpers
  v_required_years int := 0;
  v_exp_diff int := 0;
BEGIN
  -- ========================================
  -- FETCH JOB DATA
  -- ========================================
  SELECT 
    skills_required,
    experience_level,
    salary_min,
    salary_max,
    location_city,
    job_type::text
  INTO 
    v_job_skills,
    v_job_exp_level,
    v_job_salary_min,
    v_job_salary_max,
    v_job_city,
    v_job_type
  FROM public.jobs 
  WHERE id = p_job_id;

  -- ========================================
  -- FETCH CANDIDATE DATA
  -- ========================================
  SELECT 
    skills,
    years_experience,
    expected_salary,
    city,
    residence_emirate,
    preferred_location,
    open_to_remote
  INTO 
    v_cand_skills,
    v_cand_years,
    v_cand_salary_text,
    v_cand_city,
    v_cand_emirate,
    v_cand_preferred_location,
    v_cand_open_remote
  FROM public.candidates 
  WHERE id = p_candidate_id;

  -- ========================================
  -- PILLAR 1: SKILLS (Jaccard Similarity) — 45%
  -- ========================================
  IF v_job_skills IS NOT NULL AND v_cand_skills IS NOT NULL 
     AND array_length(v_job_skills, 1) > 0 AND array_length(v_cand_skills, 1) > 0 THEN
    
    -- Count intersection (case-insensitive)
    SELECT COUNT(*) INTO v_intersection
    FROM unnest(v_job_skills) js
    WHERE EXISTS (
      SELECT 1 FROM unnest(v_cand_skills) cs 
      WHERE LOWER(TRIM(cs)) = LOWER(TRIM(js))
    );

    -- Calculate union size
    SELECT COUNT(DISTINCT LOWER(TRIM(s))) INTO v_union_size
    FROM (
      SELECT unnest(v_job_skills) AS s
      UNION ALL
      SELECT unnest(v_cand_skills) AS s
    ) combined;

    IF v_union_size > 0 THEN
      v_skill_score := (v_intersection::numeric / v_union_size::numeric) * 100;
    END IF;
  END IF;

  -- ========================================
  -- PILLAR 2: EXPERIENCE COMPATIBILITY — 25%
  -- ========================================
  IF v_job_exp_level IS NOT NULL AND v_cand_years IS NOT NULL THEN
    -- Extract required years from Arabic experience level text
    -- Patterns: 'مبتدئ (1-2 سنوات)' → 1, 'متوسط (3-5 سنوات)' → 3, 'خبير (5+ سنوات)' → 5
    v_required_years := COALESCE(
      NULLIF(
        regexp_replace(
          (regexp_match(v_job_exp_level, '(\d+)'))[1],
          '[^0-9]', '', 'g'
        ), ''
      )::int,
      0
    );

    IF v_required_years = 0 THEN
      -- No specific requirement (e.g., 'مبتدئ' with no numbers) → full score
      v_exp_score := 100;
    ELSIF v_cand_years >= v_required_years THEN
      -- Meets or exceeds requirement → full score
      v_exp_score := 100;
    ELSE
      -- Shortfall: deduct 20 points per missing year, minimum 0
      v_exp_diff := v_required_years - v_cand_years;
      v_exp_score := GREATEST(0, 100 - (v_exp_diff * 20));
    END IF;
  ELSIF v_job_exp_level IS NULL THEN
    -- No experience requirement → give neutral score
    v_exp_score := 70;
  END IF;

  -- ========================================
  -- PILLAR 3: SALARY ALIGNMENT — 15%
  -- ========================================
  -- Parse expected_salary (text) → numeric, safely
  IF v_cand_salary_text IS NOT NULL AND v_cand_salary_text != '' THEN
    v_cand_salary := NULLIF(regexp_replace(v_cand_salary_text, '[^0-9.]', '', 'g'), '')::numeric;
  END IF;

  IF v_cand_salary IS NOT NULL AND v_job_salary_max IS NOT NULL AND v_job_salary_max > 0 THEN
    IF v_cand_salary <= v_job_salary_max THEN
      -- Within budget → full score
      v_salary_score := 100;
    ELSIF v_cand_salary <= v_job_salary_max * 1.2 THEN
      -- Up to 20% over budget → partial score (linear decay)
      v_salary_score := GREATEST(0, 100 - ((v_cand_salary - v_job_salary_max) / (v_job_salary_max * 0.2)) * 100);
    ELSE
      -- Over 20% above budget → 0
      v_salary_score := 0;
    END IF;
  ELSIF v_job_salary_max IS NULL OR v_cand_salary IS NULL THEN
    -- No salary data → neutral score
    v_salary_score := 60;
  END IF;

  -- ========================================
  -- PILLAR 4: LOCATION MATCH — 15%
  -- ========================================
  IF v_job_type = 'remote' THEN
    -- Remote job → everyone matches
    v_location_score := 100;
  ELSIF v_cand_open_remote = true AND v_job_type = 'remote' THEN
    v_location_score := 100;
  ELSIF v_job_city IS NOT NULL THEN
    IF LOWER(TRIM(COALESCE(v_cand_city, ''))) = LOWER(TRIM(v_job_city)) THEN
      -- Exact city match
      v_location_score := 100;
    ELSIF LOWER(TRIM(COALESCE(v_cand_emirate, ''))) = LOWER(TRIM(v_job_city)) THEN
      -- Emirate matches job city
      v_location_score := 100;
    ELSIF LOWER(TRIM(COALESCE(v_cand_preferred_location, ''))) = LOWER(TRIM(v_job_city)) THEN
      -- Preferred location matches
      v_location_score := 90;
    ELSIF v_cand_open_remote = true THEN
      -- Open to remote, different city → partial credit
      v_location_score := 50;
    ELSE
      -- No location match
      v_location_score := 0;
    END IF;
  ELSE
    -- No job city specified → neutral
    v_location_score := 60;
  END IF;

  -- ========================================
  -- COMPOSITE WEIGHTED SCORE
  -- ========================================
  v_final_score := (
    (v_skill_score * 0.45) +
    (v_exp_score * 0.25) +
    (v_salary_score * 0.15) +
    (v_location_score * 0.15)
  );

  RETURN LEAST(100, GREATEST(0, ROUND(v_final_score)::int));
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================
-- 4. INDEX FOR FASTER SIMILAR JOBS QUERIES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_jobs_skills_gin ON public.jobs USING GIN (skills_required);

CREATE INDEX IF NOT EXISTS idx_jobs_location_city ON public.jobs (location_city);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs (status);

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
external_id text, -- LinkedIn job ID, Bayt ID, etc.
source_platform text NOT NULL, -- 'linkedin', 'bayt', 'gulftalen', 'indeed'
source_url text NOT NULL, -- Original job link (Apply button redirects here)

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
access_level text DEFAULT 'public', -- 'public' | 'registered' | 'premium'
is_active boolean DEFAULT true, -- Admin can deactivate
is_featured boolean DEFAULT false, -- Pin to top

-- Stats
views_count int DEFAULT 0,
clicks_count int DEFAULT 0, -- "Apply" click counter

-- SEO
slug text UNIQUE,

-- Timestamps
posted_at timestamptz, -- Original posting date from source
scraped_at timestamptz DEFAULT now(),
expires_at timestamptz DEFAULT(now() + interval '30 days'), -- 30-day default expiry
created_at timestamptz DEFAULT now(),
updated_at timestamptz DEFAULT now(),

-- Prevent duplicate imports
UNIQUE(source_platform, external_id) );

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
CREATE POLICY "anon_read_public_external_jobs" ON public.external_jobs FOR
SELECT TO anon USING (
        is_active = true
        AND access_level = 'public'
        AND (
            expires_at IS NULL
            OR expires_at > now()
        )
    );

-- Authenticated users: public + registered jobs (not expired)
CREATE POLICY "auth_read_external_jobs" ON public.external_jobs FOR
SELECT TO authenticated USING (
        is_active = true
        AND access_level IN (
            'public', 'registered', 'premium'
        )
        AND (
            expires_at IS NULL
            OR expires_at > now()
        )
    );

-- Admin: full CRUD access (all jobs, even inactive/expired)
CREATE POLICY "admin_full_external_jobs" ON public.external_jobs FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE
                id = auth.uid ()
                AND role = 'admin'
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

-- ==========================================
-- ==========================================
-- PHASE 11: B2C CV SERVICES
-- Migration: 20260513000000_cv_services.sql
-- ==========================================
-- ==========================================

-- 1. Add credits_cv to profiles (dual credits model)
--    Workflows check credits_cv first, fallback to credits_balance
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS credits_cv INTEGER DEFAULT 0;

-- ==========================================
-- CV SESSIONS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.cv_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

-- Session classification
session_type TEXT DEFAULT 'optimize' CHECK (
    session_type IN (
        'optimize',
        'create',
        'ats_convert'
    )
),
input_mode TEXT DEFAULT 'upload' CHECK (
    input_mode IN ('upload', 'form', 'paste')
),
language TEXT DEFAULT 'en' CHECK (
    language IN ('en', 'ar', 'bilingual')
),

-- Status lifecycle
status TEXT DEFAULT 'active' CHECK (
    status IN (
        'active',
        'processing',
        'ready',
        'downloaded',
        'archived'
    )
),

-- File URLs
original_pdf_url TEXT,
latest_draft_url TEXT,
final_pdf_url TEXT,

-- Content
text_content TEXT, form_data JSONB, parsed_data JSONB,

-- Profile linking (user-initiated, NOT automatic)
linked_to_profile BOOLEAN DEFAULT false, linked_at TIMESTAMPTZ,

-- Metadata
created_at TIMESTAMPTZ DEFAULT now() );

-- ==========================================
-- CV CHAT MESSAGES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.cv_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    session_id UUID REFERENCES public.cv_sessions (id) ON DELETE CASCADE NOT NULL,
    sender TEXT CHECK (
        sender IN ('user', 'ai', 'system')
    ) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_cv_sessions_user ON public.cv_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_cv_sessions_status ON public.cv_sessions (status);

CREATE INDEX IF NOT EXISTS idx_cv_chat_session ON public.cv_chat_messages (session_id);

CREATE INDEX IF NOT EXISTS idx_cv_chat_created ON public.cv_chat_messages (created_at);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.cv_sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cv_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cv sessions" ON public.cv_sessions FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert own cv sessions" ON public.cv_sessions FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update own cv sessions" ON public.cv_sessions FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can view own cv chat" ON public.cv_chat_messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.cv_sessions
            WHERE
                cv_sessions.id = cv_chat_messages.session_id
                AND cv_sessions.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can insert own cv chat" ON public.cv_chat_messages FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.cv_sessions
            WHERE
                cv_sessions.id = cv_chat_messages.session_id
                AND cv_sessions.user_id = auth.uid ()
        )
    );

CREATE POLICY "Admins can view all cv sessions" ON public.cv_sessions FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all cv chat" ON public.cv_chat_messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                id = auth.uid ()
                AND role = 'admin'
        )
    );

-- ==========================================
-- LINK CV TO PROFILE (User-Initiated)
-- Called when user clicks "Use this CV on my profile"
-- ==========================================

CREATE OR REPLACE FUNCTION public.cv_link_to_profile(
  p_session_id UUID,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT final_pdf_url, parsed_data, status
  INTO v_session
  FROM public.cv_sessions
  WHERE id = p_session_id AND user_id = p_user_id;
  
  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;
  
  IF v_session.final_pdf_url IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'CV not finalized yet');
  END IF;
  
  UPDATE public.candidates
  SET 
    cv_url = v_session.final_pdf_url,
    resume_parsed_data = COALESCE(v_session.parsed_data, resume_parsed_data),
    skills = COALESCE(
      (SELECT array_agg(s) FROM jsonb_array_elements_text(v_session.parsed_data->'skills') AS s),
      skills
    ),
    updated_at = now()
  WHERE id = p_user_id;
  
  UPDATE public.cv_sessions
  SET linked_to_profile = true, linked_at = now()
  WHERE id = p_session_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'CV linked to your profile',
    'cv_url', v_session.final_pdf_url
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- CREDIT DEDUCTION (Dual: credits_cv → credits_balance)
-- ==========================================

CREATE OR REPLACE FUNCTION public.deduct_cv_credits(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  v_cv_credits INTEGER;
  v_balance INTEGER;
  v_free_mode TEXT;
BEGIN
  SELECT value INTO v_free_mode 
  FROM system_config WHERE key = 'cv_services_free_mode';
  
  IF v_free_mode = 'true' THEN
    RETURN true;
  END IF;

  SELECT credits_cv, credits_balance 
  INTO v_cv_credits, v_balance
  FROM public.profiles WHERE id = p_user_id;
  
  IF v_cv_credits >= p_amount THEN
    UPDATE public.profiles SET credits_cv = credits_cv - p_amount WHERE id = p_user_id;
    RETURN true;
  END IF;
  
  IF v_balance >= p_amount THEN
    UPDATE public.profiles SET credits_balance = credits_balance - p_amount WHERE id = p_user_id;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- SYSTEM CONFIG — CV Service Settings
-- ==========================================

INSERT INTO
    public.system_config (
        key,
        value,
        description,
        group_name
    )
VALUES (
        'cv_services_enabled',
        'true',
        'Master toggle for CV Builder/Optimizer',
        'cv_services'
    ),
    (
        'cv_services_free_mode',
        'true',
        'If true, skip credit checks (for testing)',
        'cv_services'
    ),
    (
        'cv_optimize_cost',
        '1',
        'Credits per CV optimization session',
        'cv_services'
    ),
    (
        'cv_create_cost',
        '1',
        'Credits per CV creation',
        'cv_services'
    ),
    (
        'cv_ats_convert_cost',
        '1',
        'Credits per ATS conversion',
        'cv_services'
    ) ON CONFLICT (key) DO NOTHING;

NOTIFY pgrst, 'reload schema';

-- ============================================
-- GrowthNexus: Candidate Contracts RLS Policy
-- Allows candidates to read/update their own contracts
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Candidate can VIEW contracts linked to their applications
CREATE POLICY "Candidates can view own contracts" ON public.contracts FOR
SELECT USING (
        application_id IN (
            SELECT id
            FROM public.applications
            WHERE
                candidate_id = auth.uid ()
        )
    );

-- 2. Candidate can UPDATE contract status (sign/decline only)
-- This allows the candidate to change status to 'viewed', 'signed', or 'declined'
CREATE POLICY "Candidates can update own contract status" ON public.contracts FOR
UPDATE USING (
    application_id IN (
        SELECT id
        FROM public.applications
        WHERE
            candidate_id = auth.uid ()
    )
)
WITH
    CHECK (
        -- Candidates can only set these specific statuses
        status IN (
            'viewed',
            'signed',
            'declined'
        )
    );