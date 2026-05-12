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
