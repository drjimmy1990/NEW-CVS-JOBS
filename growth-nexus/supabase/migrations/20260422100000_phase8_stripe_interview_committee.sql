-- Phase 8: Stripe Billing + Interview AI + Committee Evaluation
-- Run this migration after 20260422000000_phase5_enhancements.sql

-- ============================================
-- 8A: Stripe Billing Columns
-- ============================================

-- Stripe fields on companies (employer subscriptions)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Stripe fields on profiles (candidate one-time purchases)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- ============================================
-- 8B: Interview AI Columns
-- ============================================

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS auto_interview BOOLEAN DEFAULT false;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_score INTEGER;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_report JSONB;

-- ============================================
-- 8C: Committee Evaluation
-- ============================================

CREATE TABLE IF NOT EXISTS committee_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES profiles(id),
    scores JSONB NOT NULL,
    notes TEXT,
    total_score INTEGER,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(application_id, evaluator_id)
);

ALTER TABLE committee_evaluations ENABLE ROW LEVEL SECURITY;

-- Evaluators can manage their own evaluations
CREATE POLICY "evaluators_own" ON committee_evaluations
    FOR ALL USING (evaluator_id = auth.uid());

-- Employers can read evaluations for their jobs
CREATE POLICY "employers_read_evaluations" ON committee_evaluations
    FOR SELECT USING (
        application_id IN (
            SELECT a.id FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN companies c ON j.company_id = c.id
            WHERE c.owner_id = auth.uid()
        )
    );

-- Committee summary stored on applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS committee_summary JSONB;

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

-- ============================================
-- Stripe pricing reference in system_config
-- ============================================

INSERT INTO system_config (key, value, description, group_name) VALUES
    ('stripe_starter_monthly', '349', 'Starter plan monthly price (AED)', 'pricing'),
    ('stripe_growth_monthly', '799', 'Growth plan monthly price (AED)', 'pricing'),
    ('stripe_pro_monthly', '1499', 'Pro plan monthly price (AED)', 'pricing'),
    ('stripe_starter_yearly', '3490', 'Starter plan yearly price (AED)', 'pricing'),
    ('stripe_growth_yearly', '7990', 'Growth plan yearly price (AED)', 'pricing'),
    ('stripe_pro_yearly', '14990', 'Pro plan yearly price (AED)', 'pricing')
ON CONFLICT (key) DO NOTHING;
