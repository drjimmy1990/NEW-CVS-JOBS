-- ============================================
-- GrowthNexus: Applicant List View — Schema Additions
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. ADD MISSING COLUMNS TO CANDIDATES TABLE
ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS education_level text,       -- بكالوريوس، ماجستير، دكتوراه
ADD COLUMN IF NOT EXISTS specialization text,         -- تخصص المؤهل
ADD COLUMN IF NOT EXISTS last_job_title text,          -- آخر وظيفة
ADD COLUMN IF NOT EXISTS experience jsonb DEFAULT '[]'::jsonb,    -- خبرات العمل [{title, company, start, end}]
ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'::jsonb,     -- التعليم [{degree, field, institution, year}]
ADD COLUMN IF NOT EXISTS languages jsonb DEFAULT '[]'::jsonb;     -- اللغات [{name, level}]

-- 2. ADD COLUMNS TO APPLICATIONS TABLE
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS match_score int,              -- نسبة التطابق 0-100
ADD COLUMN IF NOT EXISTS ai_summary jsonb;             -- ملخص AI {"top_skills":[], "top_experiences":[]}
