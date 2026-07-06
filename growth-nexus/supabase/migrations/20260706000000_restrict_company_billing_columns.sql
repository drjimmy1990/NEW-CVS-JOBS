-- ==========================================
-- MIGRATION: Restrict owner-writable billing columns on companies
-- Run this in the Supabase SQL Editor.
-- ==========================================
-- PROBLEM: the "Owner can update company" RLS policy has no column-level
-- restriction, so a company owner could set subscription_tier='pro',
-- job_credits=999, subscription_status='active' directly from the browser
-- (anon/authenticated client), bypassing Stripe entirely.
--
-- FIX: a BEFORE UPDATE trigger that resets the billing columns to their
-- previous values for any non-service-role caller. Only the service_role
-- (used by the Stripe webhook) may change them. RLS still governs WHO can
-- update the row at all; this trigger governs WHICH columns they may change.

CREATE OR REPLACE FUNCTION public.protect_company_billing_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- service_role (Stripe webhook) is allowed to mutate billing columns.
    IF auth.role() = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- For everyone else, preserve the existing billing values.
    NEW.subscription_tier       := OLD.subscription_tier;
    NEW.subscription_status     := OLD.subscription_status;
    NEW.subscription_expires_at := OLD.subscription_expires_at;
    NEW.job_credits             := OLD.job_credits;
    NEW.cv_view_credits         := OLD.cv_view_credits;
    NEW.stripe_customer_id      := OLD.stripe_customer_id;
    NEW.stripe_subscription_id  := OLD.stripe_subscription_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_company_billing ON public.companies;

CREATE TRIGGER trg_protect_company_billing
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_company_billing_columns();

NOTIFY pgrst, 'reload schema';
