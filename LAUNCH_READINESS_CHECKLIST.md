# GrowthNexus — Launch Readiness Checklist (2026-07-06)

> The concrete, actionable P0 gate for going live and taking real money. Every item is code-verified with a
> file pointer. **Do not open to real users, hold real CVs, or switch Stripe to live until every 🔴 item is
> checked.** Derived from [`PROJECT_AUDIT_2026-07.md`](./PROJECT_AUDIT_2026-07.md); sequenced in
> [`NEXT_PHASES_ROADMAP_2026-07.md`](./NEXT_PHASES_ROADMAP_2026-07.md).

Severity: 🔴 blocker · 🟠 high · 🟡 medium

---

## Progress log — 2026-07-06 (quick-wins pass)

**Landed in code** (verified: `npx tsc --noEmit` passes):
- ✅ Cron auth now **fails closed** when `CRON_SECRET` is unset.
- ✅ `/api/company/register` and `/api/notifications/application-notify` now **require an authenticated session** and derive/verify the user server-side (no more trusting the body).
- ✅ Stripe webhook now does **real HMAC signature verification + replay protection**, and **idempotency** via a `stripe_events` table. *Gated*: verification activates automatically the moment `STRIPE_WEBHOOK_SECRET` is set (i.e. when you switch to live keys) — inert and non-breaking until then.
- ✅ CV-upload **mock-skills injection removed** from the production path.
- ✅ Apply CTA (`ApplyButton` + `ApplyModal`) **re-themed to Arabic/RTL gold-navy**.

**Ready as migrations — you must run them in the Supabase SQL Editor to activate:**
- `20260224233000_landing_page_rpcs.sql` — **corrupted migration replaced** with the real RPCs.
- `20260706000000_restrict_company_billing_columns.sql` — blocks owners from self-upgrading `subscription_*`/`job_credits` (service-role only).
- `20260706000100_stripe_events_idempotency.sql` — backs the webhook dedupe.
- `20260706000200_add_missing_indexes.sql` — indexes for hot query paths.

**Deferred by request / needs coordination (NOT done this pass):**
- ⏸️ **Secret rotation** — skipped per your instruction; still required before real launch.
- ⏸️ **Private `resumes` bucket** — NOT flipped. Making it private is **not a safe quick win**: CVs are stored as permanent public URLs consumed by employer views *and* downloaded by your external n8n CV-parser. It needs a coordinated signed-URL rollout across the app **and** the n8n workflows, done as its own change (see Phase A / roadmap).
- ⏳ **Live-key items** (Stripe live mode, entitlement enforcement on job posting, transactions ledger) intentionally left for when live keys arrive.

---

## A. Data Privacy & PII (PDPL / GDPR)

- [ ] 🔴 **Public CV bucket.** ⏸️ *Deferred (2026-07-06) — needs coordinated rollout, NOT a safe one-liner.*
  `full schema.sql:497-498` — `Public can read resumes` makes every CV world-readable. Flipping it private
  breaks live employer CV viewing (DB stores permanent public URLs) **and** the external n8n CV-parser (it
  downloads the public URL). **Fix (own change):** add an owner-read storage policy + a service-role signed-URL
  access API, convert every read site (employer applicant views, candidate download) and the n8n trigger
  points to short-TTL signed URLs, *then* drop the public policy.
- [ ] 🔴 **Fake account deletion.** `growth-nexus/src/app/candidate/settings/page.tsx:142-154` only signs out.
  **Fix:** server route that cascade-deletes candidate/application/CV-storage rows + `auth.admin.deleteUser`;
  add a data-export endpoint.
- [ ] 🟠 **PII in logs.** `api/ai/smart-match/route.ts` (and match-score / cv-optimize) log candidate names,
  skills, and CV payloads to plaintext `pm2` logs with no rotation/redaction. **Fix:** remove/redact PII
  logging; rotate logs.
- [ ] 🟠 **No legal/consent surface.** No `/privacy`, `/terms`, or consent capture. **Fix:** publish Privacy
  Policy + Terms + data-retention policy; capture consent at signup and CV-upload.

## B. Billing & Paywall (three independent bypasses)

- [x] 🔴 **Stripe webhook signature not verified.** *(Done 2026-07-06.)* `verifyStripeSignature()` now does
  real HMAC-SHA256 verification + 5-min replay tolerance via Node `crypto`. **Activates automatically when
  `STRIPE_WEBHOOK_SECRET` is set** (switching to live keys); logs a warning and stays non-breaking until then.
- [x] 🔴 **No webhook idempotency.** *(Done 2026-07-06 — run migration `20260706000100_stripe_events_idempotency.sql`.)*
  Webhook now records each `event.id` in `stripe_events` and skips duplicates/replays.
- [x] 🔴 **Owners can self-upgrade via RLS.** *(Done 2026-07-06 — run migration `20260706000000_restrict_company_billing_columns.sql`.)*
  A BEFORE-UPDATE trigger preserves `subscription_*`/`job_credits`/`stripe_*` for any non-service-role writer.
- [ ] 🔴 **No job-posting entitlement enforcement.** `employer/jobs/new/page.tsx` inserts jobs client-side;
  `job_credits` never checked/decremented. **Fix:** server-side job-create route that verifies
  `subscription_status`/expiry and atomically decrements `job_credits`.
- [ ] 🔴 **Checkout "mock success".** `api/stripe/checkout/route.ts` returns `/payment/success?mock=true` if
  `STRIPE_SECRET_KEY` is unset; `/payment/success` unconditionally claims activation. **Fix:** fail if secret
  missing in prod; server-confirm subscription state before showing success.
- [ ] 🟠 **`transactions` ledger never written** → admin revenue always 0. **Fix:** write a ledger row on every
  Stripe event.

## C. Auth & Access Control

- [ ] 🔴 **Role self-declaration.** Signup writes `role` to `user_metadata`; `utils/supabase/middleware.ts`
  copies it into `profiles` unchecked → anyone can mint an `admin`. **Fix:** assign roles server-side only;
  ignore client-supplied role.
- [x] 🔴 **`/api/company/register` has no auth** *(Done 2026-07-06.)* Now requires `getUser()` and derives the
  owner strictly from the session; any body `userId` is ignored.
- [x] 🟠 **`/api/notifications/application-notify` has no auth** *(Done 2026-07-06.)* Now requires auth and
  verifies the application belongs to the calling candidate (403 otherwise). *(Rate-limiting still pending — see E.)*
- [ ] 🟠 **IDOR gaps relying only on RLS:** `contracts/track` PATCH (no company-ownership check),
  `evaluation/submit` (any user can submit for any application), `ai/match-score` (no ownership check).
  **Fix:** add explicit in-code ownership/membership checks; audit every RLS policy.
- [x] 🟡 **Cron auth fails open** when `CRON_SECRET` unset *(Done 2026-07-06.)* Now returns 503 and refuses to
  run when the secret is missing.

## D. Secrets

- [ ] 🔴 **Committed live secrets.** ⏸️ *Deferred by request (2026-07-06) — do before real launch.*
  `growth-nexus/.env.local` contains the Supabase **service-role JWT**, anon JWT, and live URL. **Fix:** rotate
  keys; purge `.env.local` from git history; commit `.env.example` only.
- [ ] 🔴 **Default webhook secret.** ⏸️ *Deferred by request (2026-07-06).* `N8N_WEBHOOK_SECRET` defaults to
  `change-me-to-a-strong-secret` and routes hardcode the prod n8n URL as a fallback. **Fix:** set a strong
  secret; remove hardcoded fallbacks.

## E. Abuse & Cost Controls

- [ ] 🔴 **No rate limiting anywhere** + all `*_free_mode` flags seeded `'true'` = unlimited free Gemini calls
  per user (financial DoS). **Fix:** rate-limit all AI/n8n proxy routes + per-user/day quota **before**
  turning credits on.
- [ ] 🟠 **Mock fallbacks fabricate AI output silently** (career paths, interview scores) when n8n is down.
  *(Partial 2026-07-06: the CV-upload mock-skills injection is removed. The AI-route mock fallbacks remain.)*
  **Fix:** explicit "AI temporarily unavailable" states; never deduct credits on the mock path; alert on n8n
  failures.
- [ ] 🟡 **SSRF via `cv/parse`.** `api/cv/parse/route.ts` fetches an arbitrary user-supplied `sourceUrl`
  server-side. **Fix:** allowlist/validate URLs. Also the client `NEXT_PUBLIC_N8N_CV_PARSER_WEBHOOK` takes
  `file_url`/`user_id` with no secret (IDOR) — move triggering server-side behind auth.

## F. Data Layer

- [x] 🔴 **Corrupted migration.** *(Done 2026-07-06.)* `20260224233000_landing_page_rpcs.sql` replaced with the
  real landing-page RPCs (the fixed `upsert_private_candidate` that doesn't forge auth users, plus
  `get_or_create_private_job` and `increment_landing_page_views`). **Verified:** the corruption was isolated to
  this one file — both `full.sql` and `full schema.sql` (byte-identical, 3639 lines) always had the correct
  RPCs and zero corrupted content, so no schema data was lost.
- [ ] 🟠 **`contract_templates` column conflict** (`name/html_content` vs `title/content_html`, IF-NOT-EXISTS
  race). **Fix:** one canonical definition; the app uses `name` + `html_content`.
- [ ] 🟠 **Stale `SCHEMA.SQL`** lacks ~20 tables and still shows SAR/Saudi defaults. **Fix:** one authoritative
  idempotent schema; adopt supabase CLI ordering; run migrations in deploy.
- [x] 🟡 **Missing indexes** *(Done 2026-07-06 — run migration `20260706000200_add_missing_indexes.sql`.)*
  Added indexes on `applications.status`/composites, `transactions.*`, `contracts.expires_at`, `jobs.*`,
  `notifications.user_id`, `external_jobs.is_active`. *(FK `ON DELETE` actions still pending — needs care to
  avoid orphan-vs-cascade decisions; left for the data-layer phase.)*

## G. Ops & Disaster Recovery

- [ ] 🔴 **No database backups / restore runbook** (single Supabase project, hand-pasted migrations). **Fix:**
  enable automated backups + PITR; write a restore runbook.
- [ ] 🟠 **No email transport** beyond contract lifecycle. **Fix:** build `gn-email-send` n8n workflow +
  provider (Resend/SendGrid).
- [ ] 🟠 **Vercel cron never fires on the VPS** (`vercel.json` is a red herring). **Fix:** add a real VPS
  system-cron / uptime pinger to hit `/api/cron/contract-expiry`.
- [ ] 🟡 **No tests / CI/CD / monitoring.** **Fix (post-launch minimum):** smoke tests on the core flows +
  Sentry + uptime monitor before scaling.

---

## Pre-launch sign-off

Launch only when **all 🔴 are checked** and 🟠 have a dated plan:

- [ ] All 🔴 Data Privacy items closed (CV bucket private, real deletion, no PII in logs, legal pages live)
- [ ] All 🔴 Billing items closed (signature verify + idempotency + entitlement enforcement + no mock success)
- [ ] All 🔴 Auth items closed (server-side roles, authenticated register)
- [ ] All 🔴 Secrets rotated + purged from history
- [ ] Rate limiting live **before** `free_mode` flipped off
- [ ] Corrupted migration fixed; clean schema builds from scratch; backups enabled
- [ ] Stripe moved to live mode with a working end-to-end paid test
