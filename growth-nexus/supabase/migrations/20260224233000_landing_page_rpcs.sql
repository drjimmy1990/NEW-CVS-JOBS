-- ==========================================
-- MIGRATION: Landing Page RPCs (private application campaigns)
-- Run this in the Supabase SQL Editor.
-- ==========================================
-- NOTE (2026-07-06): This file previously contained non-SQL content
-- (an unrelated JSON array) which broke a clean migration run. It has been
-- restored to the real landing-page RPCs used by /apply/[token] and
-- src/components/candidate/PrivateApplyForm.tsx. Idempotent (CREATE OR REPLACE).

-- Applications need a source tag for private-campaign attribution.
ALTER TABLE public.applications
    ADD COLUMN IF NOT EXISTS source text DEFAULT 'platform';

-- ------------------------------------------------------------------
-- 1. upsert_private_candidate
-- Links a private-form applicant to an existing profile, or creates a
-- profile/candidate for a PRE-CREATED auth user (passed as p_auth_user_id).
-- It NEVER forges an auth.users row (the old version did, violating the FK) —
-- the Server Action must create the guest auth user first via the Admin API.
-- ------------------------------------------------------------------
-- SAFE RE-RUN: drop any older 3-argument overload first. Without this, a DB that
-- already ran the original migration would keep the 3-arg version AND gain this
-- 4-arg one, and the app's 3-argument .rpc() call would become ambiguous
-- ("function is not unique"). Dropping it leaves only the fixed version; the
-- 3-arg call then resolves to it (p_auth_user_id defaults to NULL).
DROP FUNCTION IF EXISTS public.upsert_private_candidate(text, text, text);

CREATE OR REPLACE FUNCTION public.upsert_private_candidate(
    p_email text,
    p_full_name text,
    p_cv_url text,
    p_auth_user_id uuid DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
    v_candidate_id uuid;
BEGIN
    SELECT id INTO v_candidate_id FROM public.profiles WHERE email = p_email;

    IF v_candidate_id IS NULL THEN
        IF p_auth_user_id IS NULL THEN
            RAISE EXCEPTION 'No existing user found and no auth_user_id provided. Create the auth user first via Server Action.';
        END IF;

        v_candidate_id := p_auth_user_id;

        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (v_candidate_id, p_email, p_full_name, 'candidate');

        INSERT INTO public.candidates (id, cv_url, is_public)
        VALUES (v_candidate_id, p_cv_url, false);
    ELSE
        UPDATE public.candidates SET cv_url = p_cv_url WHERE id = v_candidate_id;
    END IF;

    RETURN v_candidate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------
-- 2. get_or_create_private_job
-- Returns a hidden, archived "Private Campaign" job for a landing page,
-- creating it on first use so private applicants have a job to attach to.
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_or_create_private_job(
    p_company_id uuid,
    p_landing_page_id uuid
) RETURNS uuid AS $$
DECLARE
    v_job_id uuid;
    v_slug text;
BEGIN
    v_slug := 'private-campaign-' || p_landing_page_id;

    SELECT id INTO v_job_id FROM public.jobs WHERE slug = v_slug;

    IF v_job_id IS NULL THEN
        INSERT INTO public.jobs (
            company_id, title, slug, description, location_city, status, job_type
        ) VALUES (
            p_company_id,
            'Private Campaign Applicants',
            v_slug,
            'Hidden job used to collect applicants from custom landing page links.',
            'Remote',
            'archived',
            'full_time'
        ) RETURNING id INTO v_job_id;
    END IF;

    RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------
-- 3. increment_landing_page_views
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_landing_page_views(page_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.landing_pages
    SET views_count = views_count + 1
    WHERE id = page_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
