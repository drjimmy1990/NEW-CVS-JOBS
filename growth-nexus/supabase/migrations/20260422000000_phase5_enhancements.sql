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
CREATE OR REPLACE VIEW public.public_jobs_view AS
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
        WHEN j.is_confidential AND c.company_type = 'government' THEN 'جهة حكومية'
        WHEN j.is_confidential AND c.company_type = 'semi_government' THEN 'جهة شبه حكومية'
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
    AND (j.expires_at IS NULL OR j.expires_at > now());

-- 8. INSERT UAE cities into system_config for reference
INSERT INTO public.system_config (key, value, group_name, description) VALUES
  ('uae_cities', '["أبوظبي","دبي","الشارقة","عجمان","أم القيوين","رأس الخيمة","الفجيرة","العين","كلباء","حتا","الظفرة","الرويس"]', 'location', 'UAE cities list for job posting dropdown')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 9. INSERT nationality options into system_config
INSERT INTO public.system_config (key, value, group_name, description) VALUES
  ('nationality_options', '[{"value":"all","label":"جميع الجنسيات"},{"value":"uae","label":"مواطنون إماراتيون"},{"value":"gcc","label":"دول الخليج"},{"value":"arab","label":"الجنسيات العربية"},{"value":"expat","label":"الجنسيات الأجنبية"}]', 'hiring', 'Nationality filter options for job posting')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 10. INSERT rejection reasons into system_config
INSERT INTO public.system_config (key, value, group_name, description) VALUES
  ('rejection_reasons', '[{"value":"not_suitable","label":"غير مناسب"},{"value":"low_experience","label":"خبرة قليلة"},{"value":"salary_mismatch","label":"راتب غير مناسب"},{"value":"overqualified","label":"مؤهلات أعلى من المطلوب"},{"value":"location_mismatch","label":"الموقع غير مناسب"},{"value":"skills_gap","label":"فجوة في المهارات"},{"value":"other","label":"سبب آخر"}]', 'hiring', 'Predefined rejection reason options')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
