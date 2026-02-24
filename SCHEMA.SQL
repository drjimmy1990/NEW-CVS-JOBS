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

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
    USING (auth.uid () = id);

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT
WITH
    CHECK (auth.uid () = id);

-- Companies RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read companies" ON public.companies FOR
SELECT USING (true);

CREATE POLICY "Owner can insert company" ON public.companies FOR INSERT
WITH
    CHECK (auth.uid () = owner_id);

CREATE POLICY "Owner can update company" ON public.companies
FOR UPDATE
    USING (auth.uid () = owner_id);

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

CREATE POLICY "Candidate can insert" ON public.applications FOR INSERT
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

CREATE POLICY "Employer can update application status" ON public.applications
FOR UPDATE
    USING (
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