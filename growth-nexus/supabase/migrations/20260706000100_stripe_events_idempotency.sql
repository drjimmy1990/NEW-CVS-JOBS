-- ==========================================
-- MIGRATION: Stripe webhook idempotency store
-- Run this in the Supabase SQL Editor.
-- ==========================================
-- Backs the dedupe logic in src/app/api/stripe/webhook/route.ts. Each Stripe
-- event id is inserted once; a duplicate insert (23505) means the event was
-- already processed, so the handler skips it — preventing replayed
-- invoice.paid events from repeatedly extending subscriptions or re-granting
-- credits.

CREATE TABLE IF NOT EXISTS public.stripe_events (
    id            text PRIMARY KEY,   -- Stripe event id (evt_...)
    type          text,
    processed_at  timestamptz NOT NULL DEFAULT now()
);

-- Only the service role (Stripe webhook) touches this table. Enable RLS with
-- no policies so anon/authenticated clients have no access; service_role
-- bypasses RLS.
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
