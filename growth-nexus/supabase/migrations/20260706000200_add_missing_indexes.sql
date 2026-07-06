-- ==========================================
-- MIGRATION: Add missing indexes on hot query paths
-- Run this in the Supabase SQL Editor.
-- ==========================================
-- Adds indexes for columns that are heavily filtered in dashboards, the
-- contract-expiry cron, and the admin transactions view but were previously
-- unindexed. All idempotent. If any column name differs in your DB, remove
-- that single line and re-run — each statement is independent.

-- Applications: status pills/filters + per-candidate status lookups
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_status ON public.applications (candidate_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_job_status ON public.applications (job_id, status);

-- Contracts: cron scans expired contracts; tracking filters by status
CREATE INDEX IF NOT EXISTS idx_contracts_expires_at ON public.contracts (expires_at);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts (status);

-- Jobs: employer dashboards filter by company + status
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs (company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs (status);

-- Notifications: bell + list scoped to user
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);

-- Transactions: admin ledger listing/sorting (currently fully unindexed)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions (created_at);

-- External jobs: public feed filters active listings
CREATE INDEX IF NOT EXISTS idx_external_jobs_is_active ON public.external_jobs (is_active);

NOTIFY pgrst, 'reload schema';
