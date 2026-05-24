-- ============================================
-- B2C Services Migration
-- Features: Rejection Analyzer, Career Path, Skill Gap, Job Alerts, Auto Apply
-- Created: 24 May 2026
-- ============================================

-- ============================================
-- 0. Generic B2C Credit Deduction RPC
-- Supports per-service free_mode toggle via system_config
-- ============================================
CREATE OR REPLACE FUNCTION public.deduct_b2c_credits(
    p_user_id UUID,
    p_service TEXT,
    p_amount INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    v_balance INTEGER;
    v_free_mode TEXT;
BEGIN
    -- Check free mode toggle per service
    SELECT value INTO v_free_mode 
    FROM system_config WHERE key = p_service || '_free_mode';
    
    IF v_free_mode = 'true' THEN
        RETURN true;
    END IF;

    SELECT COALESCE(credits_balance, 0) INTO v_balance
    FROM public.profiles WHERE id = p_user_id;
    
    IF v_balance >= p_amount THEN
        UPDATE public.profiles 
        SET credits_balance = credits_balance - p_amount 
        WHERE id = p_user_id;
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 1. Rejection Analyzer
-- Stores analysis result on existing applications table
-- ============================================
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS rejection_analysis JSONB DEFAULT NULL;

INSERT INTO system_config (key, value, description) VALUES
    ('rejection_analyzer_free_mode', 'true', 'Skip credit check for rejection analysis (testing)'),
    ('rejection_analyzer_cost', '1', 'Credits per rejection analysis')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 2. Career Path Sessions
-- ============================================
CREATE TABLE IF NOT EXISTS public.career_path_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "current_role" TEXT NOT NULL,
    target_role TEXT,
    industry TEXT NOT NULL,
    years_experience INTEGER DEFAULT 0,
    "current_skills" TEXT[] DEFAULT '{}',
    result JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.career_path_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own career paths"
    ON public.career_path_sessions FOR SELECT    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own career paths"
    ON public.career_path_sessions FOR INSERT     WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own career paths"
    ON public.career_path_sessions FOR UPDATE     USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own career paths"
    ON public.career_path_sessions FOR DELETE     USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_career_path_user
    ON public.career_path_sessions(user_id, created_at DESC);

INSERT INTO system_config (key, value, description) VALUES
    ('career_path_free_mode', 'true', 'Skip credit check for career path (testing)'),
    ('career_path_cost', '1', 'Credits per career path generation')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 3. Skill Gap Analyses
-- ============================================
CREATE TABLE IF NOT EXISTS public.skill_gap_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_job_title TEXT NOT NULL,
    target_skills TEXT[] DEFAULT '{}',
    candidate_skills TEXT[] DEFAULT '{}',
    result JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.skill_gap_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skill gaps"
    ON public.skill_gap_analyses FOR SELECT    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skill gaps"
    ON public.skill_gap_analyses FOR INSERT     WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skill gaps"
    ON public.skill_gap_analyses FOR UPDATE     USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skill gaps"
    ON public.skill_gap_analyses FOR DELETE     USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_skill_gap_user
    ON public.skill_gap_analyses(user_id, created_at DESC);

INSERT INTO system_config (key, value, description) VALUES
    ('skill_gap_free_mode', 'true', 'Skip credit check for skill gap (testing)'),
    ('skill_gap_cost', '1', 'Credits per skill gap analysis')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 4. Job Alert Preferences + History
-- ============================================
CREATE TABLE IF NOT EXISTS public.job_alert_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_name TEXT DEFAULT 'التنبيه الرئيسي',
    keywords TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    job_types TEXT[] DEFAULT '{}',
    locations TEXT[] DEFAULT '{}',
    salary_min INTEGER,
    salary_max INTEGER,
    frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'instant')),
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, alert_name)
);

ALTER TABLE public.job_alert_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
    ON public.job_alert_preferences FOR SELECT    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts"
    ON public.job_alert_preferences FOR INSERT     WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts"
    ON public.job_alert_preferences FOR UPDATE     USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts"
    ON public.job_alert_preferences FOR DELETE     USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.job_alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preference_id UUID REFERENCES public.job_alert_preferences(id) ON DELETE SET NULL,
    jobs_matched INTEGER DEFAULT 0,
    jobs_sent JSONB DEFAULT '[]',
    sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.job_alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alert history"
    ON public.job_alert_history FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_job_alert_user
    ON public.job_alert_preferences(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_job_alert_history_user
    ON public.job_alert_history(user_id, sent_at DESC);

INSERT INTO system_config (key, value, description) VALUES
    ('job_alerts_free_mode', 'true', 'Skip subscription check for job alerts (testing)'),
    ('job_alerts_max_per_user', '3', 'Max alert preferences per user')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 5. Auto Apply Settings + Log
-- ============================================
CREATE TABLE IF NOT EXISTS public.auto_apply_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    target_roles TEXT[] DEFAULT '{}',
    target_skills TEXT[] DEFAULT '{}',
    target_locations TEXT[] DEFAULT '{}',
    target_job_types TEXT[] DEFAULT '{}',
    min_salary INTEGER,
    min_match_score INTEGER DEFAULT 60,
    max_applications_per_month INTEGER DEFAULT 50,
    applications_this_month INTEGER DEFAULT 0,
    cover_letter_template TEXT,
    exclude_companies TEXT[] DEFAULT '{}',
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.auto_apply_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own auto apply"
    ON public.auto_apply_settings FOR SELECT    USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own auto apply"
    ON public.auto_apply_settings FOR INSERT     WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own auto apply"
    ON public.auto_apply_settings FOR UPDATE     USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.auto_apply_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    match_score INTEGER,
    status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'skipped', 'failed', 'duplicate')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.auto_apply_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own auto apply log"
    ON public.auto_apply_log FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_auto_apply_user
    ON public.auto_apply_settings(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_auto_apply_log_user
    ON public.auto_apply_log(user_id, created_at DESC);

INSERT INTO system_config (key, value, description) VALUES
    ('auto_apply_free_mode', 'true', 'Skip subscription check for auto apply (testing)'),
    ('auto_apply_tier_basic', '50', 'Monthly limit for basic tier'),
    ('auto_apply_tier_pro', '100', 'Monthly limit for pro tier'),
    ('auto_apply_tier_premium', '200', 'Monthly limit for premium tier')
ON CONFLICT (key) DO NOTHING;
