# GrowthNexus — Next Phases Roadmap (2026-07-06)

> The prioritized development plan derived from the [full audit](./PROJECT_AUDIT_2026-07.md). It merges the
> team's *intended* roadmap (from `PLAN.MD`/`ROADMAP.md`/`B2C_FEATURES_PLAN.md` + the Arabic vision specs)
> with the *actual* gaps found in the code, and re-sequences them by a single principle:
>
> ### Guiding principle
> **"Legally and operationally safe to hold real user data and take money" comes *before* "monetize more of
> it."** A platform that leaks CVs, can't delete a user, has no backups, and has uncapped AI cost must not be
> adding new paid features first. Harden → make money real → finish the revenue layer → scale.
>
> Companion: [`LAUNCH_READINESS_CHECKLIST.md`](./LAUNCH_READINESS_CHECKLIST.md) is the actionable P0 checklist
> for Phases A–C.

---

## Phase overview

| Phase | Theme | Priority | Effort | Blocks |
|---|---|---|---|---|
| **A** | Security, Privacy & Billing Hardening | 🔴 P0 — now | M–L | Launch & revenue |
| **B** | Make Monetization Real | 🔴 P0 — now | M | Revenue |
| **C** | Data Layer, Email & Legal/Compliance | 🔴 P0 — now | M | Phase D + launch |
| **D** | Finish the B2C Revenue Layer | 🟠 P1 — next | L | — |
| **E** | Consistency, Trust & Missing Producers | 🟠 P1 — next | L | — |
| **F** | Production Maturity — Tests, CI/CD, Monitoring, i18n/SEO | 🟡 P2 — later | XL | Scale |
| **G** | Enterprise & B2B Expansion | 🟡 P2 — later | XL | — |

**Do Phases A + B + C before opening to real users or flipping Stripe to live.** They are almost entirely
hardening/wiring, not new features — most are code-verified, low-ambiguity fixes.

---

## Phase A — Security, Privacy & Billing Hardening 🔴 P0

**Goal:** close every paywall bypass, stop the live PII exposure, and make identity/roles/secrets trustworthy
so the platform can safely take money and hold user data.

1. **Kill the public CV exposure.** Drop the `Public can read resumes` storage policy
   (`full schema.sql:497`); make the `resumes` bucket private; serve CVs to authorized viewers only via
   short-TTL **signed URLs**. *(Verified live PII breach — do this first.)*
2. **Fix Stripe webhook verification.** Adopt the Stripe SDK; use `webhooks.constructEvent` with
   `STRIPE_WEBHOOK_SECRET`; add a `stripe_events` dedupe table for idempotency
   (`api/stripe/webhook/route.ts:19`).
3. **Enforce job-posting entitlements server-side.** Add a job-creation API route that checks
   `subscription_status`/expiry and **atomically decrements `job_credits`**; stop the client-side
   `jobs.insert` in `employer/jobs/new/page.tsx`.
4. **Lock down billing columns in RLS.** Remove owner write access to `subscription_*` / `job_credits` on
   `companies` (service-role-only) so owners can't self-upgrade from the browser.
5. **Implement real account deletion + data export.** Server route that cascades
   candidate/application/CV-storage rows + `auth.admin.deleteUser`, plus a data-export endpoint (PDPL/GDPR
   erasure + portability). Replace the `handleDeleteAccount` no-op (`candidate/settings/page.tsx:142`).
6. **Add abuse & cost controls *before* turning credits on.** Rate-limit all AI/n8n proxy routes and add a
   hard per-user/day quota. (Sequence this ahead of Phase B — otherwise flipping `free_mode` off is the first
   time anyone discovers the unmetered-cost problem, in production.)
7. **Authenticate side-effecting routes.** Require `getUser()` on `/api/company/register` and
   `/api/notifications/application-notify`; derive `userId` from the session, never the body.
8. **Stop trusting self-declared roles.** Assign roles server-side (DB trigger/admin action); never copy
   `user_metadata.role` into `profiles` (`utils/supabase/middleware.ts`).
9. **Rotate & purge secrets.** Rotate the Supabase service-role/anon keys and `N8N_WEBHOOK_SECRET`; remove
   `.env.local` from git history; commit only a `.env.example`; remove hardcoded default secrets and n8n URL
   fallbacks.
10. **Fail-closed cron auth.** Change `if (cronSecret && auth !== ...)` to reject when `CRON_SECRET` is
    missing (`api/cron/contract-expiry/route.ts`).

**Rationale:** Three independent paths currently give paid features away free; CVs are world-readable; a
leaked service-role key exposes the whole DB; users can't be deleted. All code-verified. No launch is
defensible until these close.

---

## Phase B — Make Monetization Real 🔴 P0

**Goal:** turn the wired-but-inert billing into an actual revenue system with a financial ledger.

1. Move Stripe to **live mode** with live price IDs and confirmed webhook fulfillment.
2. **Write to the `transactions` ledger** on every Stripe event so admin revenue is real and reconcilable
   against Stripe (currently always 0).
3. **Flip `*_free_mode` flags off deliberately** and verify credit deduction/enforcement end-to-end — and
   only deduct when a *real* n8n response was returned (never on the mock path).
4. **Server-confirm subscription state on `/payment/success`** instead of unconditionally claiming
   activation.
5. Remove or implement the dead candidate one-off buttons on `/pricing`.

**Rationale:** Stripe is test-mode, the ledger is never written, and credits are globally disabled — the
business cannot earn or report money until this closes. Depends on Phase A's rate-limiting being in place.

---

## Phase C — Data Layer, Email & Legal/Compliance 🔴 P0

**Goal:** a reproducible schema, a working email transport that many features depend on, and the legal
surface a UAE launch requires.

1. ✅ **Fix the corrupted migration** `20260224233000_landing_page_rpcs.sql` — *done 2026-07-06.* Replaced with
   the real RPCs from `full schema.sql`. Verified the corruption was isolated to this one file; both `full.sql`
   and `full schema.sql` were always clean (no data lost).
2. **Resolve the `contract_templates` column conflict** (`name/html_content` vs `title/content_html`) and
   reconcile `SCHEMA.SQL` with `full schema.sql` into **one authoritative idempotent schema**; adopt supabase
   CLI migration ordering and run migrations as part of deploy.
3. **Configure backups + PITR** on the Supabase project and write a restore runbook. *(Given hand-pasted
   migrations are the norm, a bad paste currently has no recovery path.)*
4. **Build the generic `gn-email-send` n8n workflow + provider** (Resend/SendGrid) and verify
   `/api/notifications/email`.
5. **Publish legal pages**: Privacy Policy, Terms of Service, and a documented data-retention policy; add
   consent capture at signup + CV-upload; redact PII from `pm2` logs.

**Rationale:** A clean DB cannot currently be built from the migrations folder; no email means welcome/reset/
alerts/digests silently fail (a hard blocker for Phase D); privacy/terms/consent are launch prerequisites in
the UAE, not "later" items.

---

## Phase D — Finish the B2C Revenue Layer 🟠 P1

**Goal:** ship the paid candidate services the business case is built on, using **Interview Self-Practice as
the reference implementation** (it's the one that actually works).

1. Build candidate **pages** for Rejection Analyzer, Career Path, Skill Gap (APIs + tables already exist).
2. Complete the **n8n Gemini workflows** for those three; remove reliance on mock output.
3. Finish the **Auto-Apply** n8n workflow's 4 remaining action nodes (cover letter, INSERT application/log,
   UPDATE settings) and build its page.
4. Build the **Smart Job Alerts** n8n schedule workflow + candidate page (depends on Phase C email).
5. Add explicit **"AI unavailable"** states so mocks never masquerade as real results.

**Rationale:** Team docs claim ~60% but only Interview Practice is real. Backend scaffolding exists, so effort
is mostly frontend + n8n. This is the biggest vision-vs-build gap and the intended B2C revenue.

---

## Phase E — Consistency, Trust & Missing Producers 🟠 P1

**Goal:** remove the stale-English screens, strengthen the UAE trust story, and connect built-but-unfed
pipelines.

1. **Migrate the stale English/slate cluster** to the Arabic/RTL/gold-navy system: `ApplyButton`/`ApplyModal`
   (the primary conversion CTA), `PrivateApplyForm`, the landing-pages module, `/apply/[token]`.
2. **Remove the CV-upload mock-skills fallback** from the production path (or gate behind an explicit dev
   flag).
3. **Build the external-jobs scraper n8n workflow** (LinkedIn/Bayt/Indeed → `/api/external-jobs`; the ingest
   API is already ready).
4. **Strengthen company verification** with the official-registry cross-check (NER / Invest in Dubai / TAMM)
   + phone-OTP ownership proof — the real anti-fraud layer the spec describes.
5. **Seed `emiratisation_profiles`** so compliance exports stop 404-ing; add **realtime messaging** via
   `supabase.channel()`.
6. Add missing **DB indexes** (`applications.status`, `transactions.*`, `contracts.expires_at`, messages
   unread) and FK `ON DELETE` actions.

**Rationale:** The Apply CTA is the primary conversion surface and it visibly breaks the design system;
verification and Emiratisation are marquee UAE differentiators that are currently hollow; the scraper has no
producer.

---

## Phase F — Production Maturity 🟡 P2

**Goal:** make the platform operable and scalable, and deliver the stated bilingual value prop.

1. Add **`zod` validation** across mutating routes; add unit/integration tests + **Playwright E2E** for the
   ~18 core flows.
2. Stand up **CI/CD** (build/lint/test gate) and an atomic, rollback-capable deploy; add **Sentry + uptime
   monitoring**.
3. Implement **`next-intl` (ar/en)** + language switcher; add **JobPosting structured data**, sitemap, OG for
   Google-for-Jobs **SEO**.
4. Remove dead dependencies (`zustand`, `react-query`, `react-hook-form`, `zod` scaffolding, unused
   `next-intl`) **or** adopt them intentionally.

**Rationale:** Zero tests + manual single-VPS deploys + no observability is unsustainable past a handful of
users; i18n/SEO (Phase 12, currently 0%) unlocks the English market and organic acquisition. Correctly
sequenced *after* the product earns money and is safe.

---

## Phase G — Enterprise & B2B Expansion 🟡 P2

**Goal:** pursue the highest-margin B2B products from the Arabic vision spec once the core is stable and
profitable.

1. **Bulk AI CV screening** (volume-metered), **Smart Job Distribution** / omnichannel publishing.
2. **White-label career portals**; third-party ATS/HR API integration; **DocuSign/PandaDoc/HelloSign** e-sign.
3. **Salary Negotiation Coach** + **Full Application Kit** bundle (vision items dropped from current phase
   tracking).
4. **MOHRE brokerage-licensing review** + a formal **Rules Engine** layer to guarantee AI never authors
   contract clauses (the guardrail the spec flags but no code enforces).

**Rationale:** Strategically valuable (White-label is ranked highest-profit) but out of scope until launch,
hardening, and B2C revenue are proven. Includes the regulatory guardrail the Arabic spec calls for.

---

## Quick wins — status (updated 2026-07-06)

Most of this list is **done**; run the four migrations to activate the DB-side ones. See
[`LAUNCH_READINESS_CHECKLIST.md`](./LAUNCH_READINESS_CHECKLIST.md) → "Progress log" for details.

- [x] Fix the **corrupted migration** so the migrations folder runs clean. *(replaced)*
- [x] Make **cron auth fail-closed**. *(code)*
- [x] Add `getUser()` to `company/register` and `application-notify`. *(code)*
- [ ] **Rotate** the committed Supabase + n8n secrets. ⏸️ *Deferred by request — still required before launch.*
- [x] Restrict the **`companies` UPDATE RLS** so owners can't self-upgrade. *(migration `20260706000000` — run it)*
- [ ] Drop the **public `resumes`** policy and switch CV reads to signed URLs. ⏸️ *Deferred — not a safe
      one-liner (couples to employer views + the external n8n CV-parser); needs its own coordinated change.*
- [x] Stop the **CV-upload mock-skills** injection in the production path. *(code)*
- [x] Re-theme **ApplyButton/ApplyModal** to Arabic/RTL gold-navy. *(code)*
- [x] Add the handful of **missing indexes**. *(migration `20260706000200` — run it)*

**Bonus (ready for live keys):** the Stripe webhook now has real **HMAC signature verification + replay
protection + idempotency** (migration `20260706000100`), inert until `STRIPE_WEBHOOK_SECRET` is set — so the
only thing standing between you and secure billing is the live keys.

### Migrations to run in the Supabase SQL Editor (in order)
1. `20260224233000_landing_page_rpcs.sql` *(re-run — was corrupt)*
2. `20260706000000_restrict_company_billing_columns.sql`
3. `20260706000100_stripe_events_idempotency.sql`
4. `20260706000200_add_missing_indexes.sql`

---

## What *not* to do next

- **Don't build more paid features (Phase D/G) before Phase A.** Adding revenue features to a platform that
  leaks CVs and can't delete a user increases legal exposure per user.
- **Don't flip `free_mode` off before rate-limiting exists** (Phase A #6) — you'd expose the unmetered-cost
  problem in production.
- **Don't rely on the mock fallbacks as "done."** They make outages invisible and fabricate AI output; treat
  any feature whose n8n workflow is unbuilt as *not shipped*.
