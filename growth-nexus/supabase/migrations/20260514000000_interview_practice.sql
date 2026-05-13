-- ============================================
-- Interview Practice Sessions
-- Self-service AI interview practice for candidates
-- Supports: per-use credits AND subscription (interview_allowance)
-- ============================================

-- 1. Interview practice sessions table
CREATE TABLE IF NOT EXISTS public.interview_practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_role TEXT NOT NULL,
    industry TEXT NOT NULL,
    language TEXT DEFAULT 'ar',
    questions JSONB DEFAULT '[]',
    answers JSONB DEFAULT '[]',
    score INTEGER,
    report JSONB,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- 2. RLS policies
ALTER TABLE public.interview_practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own practice sessions"
    ON public.interview_practice_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice sessions"
    ON public.interview_practice_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice sessions"
    ON public.interview_practice_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own practice sessions"
    ON public.interview_practice_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Credit deduction RPC
-- Supports dual model:
--   a) Subscription: profiles.interview_allowance > 0 → use that first (no charge)
--   b) Per-use credits: fallback to credits_balance
--   c) Free mode: skip all checks (for testing)
CREATE OR REPLACE FUNCTION public.deduct_interview_credits(
    p_user_id UUID,
    p_amount INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    v_allowance INTEGER;
    v_balance INTEGER;
    v_free_mode TEXT;
BEGIN
    -- Check free mode toggle
    SELECT value INTO v_free_mode 
    FROM system_config WHERE key = 'interview_practice_free_mode';
    
    IF v_free_mode = 'true' THEN
        RETURN true;
    END IF;

    SELECT COALESCE(interview_allowance, 0), COALESCE(credits_balance, 0)
    INTO v_allowance, v_balance
    FROM public.profiles WHERE id = p_user_id;
    
    -- Priority 1: Subscription allowance (monthly interviews included in plan)
    IF v_allowance >= p_amount THEN
        UPDATE public.profiles SET interview_allowance = interview_allowance - p_amount WHERE id = p_user_id;
        RETURN true;
    END IF;
    
    -- Priority 2: General credits balance (pay-per-use)
    IF v_balance >= p_amount THEN
        UPDATE public.profiles SET credits_balance = credits_balance - p_amount WHERE id = p_user_id;
        RETURN true;
    END IF;
    
    -- No credits available
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add interview_allowance column to profiles (for subscription model)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS interview_allowance INTEGER DEFAULT 0;

COMMENT ON COLUMN public.profiles.interview_allowance IS 'Monthly interview practice sessions included in subscription plan. Reset on billing cycle.';

-- 5. System config entries
INSERT INTO system_config (key, value, description) VALUES
    ('interview_practice_free_mode', 'true', 'Skip credit check for interview practice (testing mode)'),
    ('interview_practice_cost', '1', 'Credits per practice session when not in free mode')
ON CONFLICT (key) DO NOTHING;

-- 6. Index for performance
CREATE INDEX IF NOT EXISTS idx_interview_practice_user 
    ON public.interview_practice_sessions(user_id, created_at DESC);
