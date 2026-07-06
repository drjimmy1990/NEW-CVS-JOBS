# GrowthNexus — Full Project Audit (2026-07-06)

> **Authoritative state-of-the-project document.** Produced by a 9-agent deep audit that read the
> actual source (frontend, ~44 API routes, `full schema.sql` + migrations, n8n guides, product docs,
> Stripe/auth, deployment). Where this doc and the older status files (`PLAN.MD`, `PROGRESS.md`,
> `ROADMAP.md`, `TODO.md`, `.old/*`) disagree, **trust this one** — the older docs drift
> (they variously call the stack Next 14 / 15 / 16 and mark the same features both "done" and "pending").
>
> Companion docs: [`NEXT_PHASES_ROADMAP_2026-07.md`](./NEXT_PHASES_ROADMAP_2026-07.md) ·
> [`LAUNCH_READINESS_CHECKLIST.md`](./LAUNCH_READINESS_CHECKLIST.md)

---

## 1. TL;DR

GrowthNexus (live at `jobs-test.uae4jobs.ae`) is a genuinely ambitious, **unusually complete** AI-first
recruitment platform for the UAE market — far beyond a typical MVP. Built by a solo developer over ~3 months
(~97 commits, Feb–May 2026) on **Next.js 16 / React 19 / Supabase / Stripe**, with all AI offloaded to a
single self-hosted **n8n** instance (`n8n.asra3.com`) driving **Google Gemini**. Four full portals
(candidate / employer / admin / public), ~26–27 Postgres tables under RLS, ~44 API routes, and deep
UAE-specific features: an Emiratisation/Nafis compliance suite, a company-verification wizard with OCR,
MOHRE-aligned contract automation, and bilingual Arabic/English skill matching.

**Honest completion: not ~98% as the team docs claim — closer to 55–65% of a *launchable* product.**
The build is broad, but the gap is concentrated in the parts that make it safe to take money and hold user
data:

- **Three independent paywall bypasses** (Stripe webhook has no signature check; owners can self-upgrade via RLS; job posting enforces no credits).
- **A live PII exposure** — every uploaded CV is world-readable (`Public can read resumes` storage policy).
- **The entire B2C paid-revenue layer is unbuilt** despite docs claiming ~60% (only Interview Self-Practice actually ships).
- **No transactional email, no tests, no CI/CD, no monitoring, no backups runbook, no rate limiting, no legal/privacy pages.**

None of this is a reason to be discouraged — the hard product surface exists. The remaining work is mostly
**hardening, wiring, and finishing**, not green-field feature building. See the roadmap doc for sequencing.

---

## 2. Architecture (as-built)

Four tiers:

**1) Frontend** — Next.js 16 App Router (React 19, React Compiler on). **Hardcoded Arabic-only, RTL-only**
UI (`lang="ar" dir="rtl"` in `layout.tsx`; `next-intl` is installed but *unused* — all copy is inline Arabic
literals). Custom Tailwind v4 "Warm Professional" theme (navy / champagne-gold / cream) over Radix primitives
in `src/components/ui`. Four portals, each with its own layout + sidebar. State is `useState` + server
components; **`zustand`, `@tanstack/react-query`, `react-hook-form`, `zod` are all dependencies but unused**.
Data flow is split: public/employer/admin pages are async server components reading Supabase directly;
interactive candidate tools are client components calling `fetch()` to `/api` routes.

**2) Backend** — ~44 `route.ts` files. Hybrid: ~half are **thin proxies** to per-feature n8n webhooks (all
AI/CV/interview work), half hold **real in-process logic** (analytics forecasting, emiratisation engine,
contract state machine, team RBAC, company risk scoring). Two Supabase clients: a cookie-bound SSR client
for RLS-scoped work, and a **service-role admin client** that deliberately bypasses RLS in ~8 routes.
**No schema validation anywhere** (no `zod`). Authorization is inconsistent — admin routes correctly gate on
`profiles.role==='admin'` (the model to copy), but several routes have **no auth at all** and most lean
entirely on Postgres RLS.

**3) Database** — Supabase/Postgres, ~26–27 tables. `profiles` (1:1 `auth.users`, role enum) is the root;
`candidates` and `companies` extend it; the core loop is **candidate → application → job → company** with
`unique(job_id, candidate_id)`. ~10 feature domains layered via ~27 migrations. Security is almost entirely
RLS + `SECURITY DEFINER` RPCs (`deduct_*`, `increment_*`, `save_interview_result`). **Auth model:** Supabase
SSR cookies, `getUser()` server-validated in `src/proxy.ts` (Next 16's renamed middleware). **Roles are
self-declared** — signup writes `role` into `user_metadata` and the middleware copies it into `profiles`
unchecked.

**4) AI / Automation** — n8n (`n8n.asra3.com`) is the AI backbone: one `n8n workflow.json` (~136 nodes,
~24 webhooks) calling Gemini + **Gotenberg** (HTML→PDF). Three trigger topologies:
- **(A)** app route → webhook (synchronous; most AI features),
- **(B)** n8n Cron → Supabase-direct (job-alerts, auto-apply — *no app call, no env var*),
- **(C)** Supabase DB webhook on `company_documents` INSERT → n8n (company-verify OCR).

Shared-secret auth via `x-webhook-secret = N8N_WEBHOOK_SECRET`. Every AI route ships a **local mock/heuristic
fallback** so the app never hard-crashes when n8n is down (a deliberate, double-edged decision — see risks).

**Deployment** — manual SSH to a **single VPS** (`178.18.254.38`, aaPanel + PM2 `growthnexus`:3000 + Nginx +
Let's Encrypt). The committed `vercel.json` is a red herring — its `contract-expiry` cron never fires on this
host. No CI/CD, no tests, no monitoring; migrations are hand-pasted into the Supabase SQL Editor.

---

## 3. Feature Matrix (honest status)

Legend: ✅ complete · 🟡 partial · 🔶 stub (scaffolding only) · ⬜ planned / not built

| Feature | Portal | Status | Notes |
|---|---|---|---|
| Public job board (internal + external interleaved, filters, sort, saved jobs) | Public | ✅ | `jobs/page.tsx` (434 lines), solid |
| Job detail + SEO metadata | Public | ✅ | `generateMetadata`, company info |
| **Apply flow (ApplyButton → ApplyModal)** | Public | 🟡 | Works, but **stale English + emerald/cyan theme** — breaks the design system on the *primary conversion CTA* |
| Companies directory + company profile | Public | ✅ | Server-rendered |
| Auth (login + candidate/employer register) | Public | ✅ | Role-based redirect; **but role is self-declared → escalation risk** |
| Candidate dashboard (completion, stats, Jaccard-matched jobs) | Candidate | ✅ | Uses `skill_aliases` for bilingual matching |
| CV hub + upload → n8n parse | Candidate | 🟡 | **Injects hardcoded mock skills** ("وضع تجريبي") when webhook env is a placeholder |
| CV Optimize (AI chat) + Builder + ATS convert | Candidate | ✅ | Real `cv-api.ts` pipeline; 503-hard-fails if n8n webhook unset |
| Interview practice (self-practice, B2C) | Candidate | 🟡 | UI + 3 routes + table built; reuses shared interview webhooks; credit gate disabled by `free_mode` |
| Applications list + automated AI interview | Candidate | ✅ | Ownership verified server-side |
| Profile / settings / saved-jobs | Candidate | 🟡 | Profile is great; **"delete account" is a no-op** (`settings/page.tsx:142` only signs out) |
| Messaging (2-pane chat) | Candidate/Employer | 🟡 | Real DB-backed, unread counts — but **poll/reload based, no realtime**; no message-notify |
| **B2C Rejection Analyzer** | Candidate | 🔶 | API + table + mock fallback exist; **candidate page NOT built** |
| **B2C Career Path Generator** | Candidate | 🔶 | API + table + mock; **page NOT built** |
| **B2C Skill Gap Analyzer** | Candidate | 🔶 | API + table + mock; **page NOT built** |
| **B2C Smart Job Alerts** | Candidate | 🔶 | CRUD API + tables; delivery depends on unbuilt email; **no page** |
| **B2C Auto-Apply** | Candidate | 🔶 | CRUD API + tables, but n8n workflow's 4 action nodes are "REMAINING TO BUILD" — **nothing auto-applies**; no page |
| B2C Voice Interview / Portfolio / Salary Coach / Application Kit | Candidate | ⬜ | Vision spec only, no code |
| Employer dashboard + jobs CRUD (AI job-desc wizard) | Employer | ✅ | Multi-step wizard, VerificationLock gating — **but job insert has no credit enforcement** |
| Applicants + candidate search + AI match/evaluate | Employer | ✅ | AI match score, SmartMatch (service-role search), committee flow |
| Emiratisation / Nafis suite (6 tabs) | Employer | 🟡 | Big module + clean `emiratisation-engine.ts`; **`emiratisation_profiles` empty by default → PDF export 404s** until seeded |
| Team / RBAC (owner/admin/member/viewer) | Employer | ✅ | Clean `getCompanyForUser` RBAC, invite existing users only |
| Contracts (templates, generate, tracking, candidate portal) | Employer | 🟡 | Rich state machine; **`track` PATCH lacks ownership check**; `pdf/[id]` returns HTML labeled as PDF; `contract_templates` has a **schema-drift column conflict** |
| Analytics + Forecasting Engine | Employer | ✅ | In-process heuristics (labeled "AI" but deterministic) |
| Company verification wizard + OCR gating | Employer | 🟡 | Wizard + risk scoring + OCR built; **register API has no auth**; no registry cross-check / OTP ownership proof |
| Landing pages / private apply links | Employer | 🟡 | Functional, but **stale English/slate theme**; no full editor |
| Employer subscription checkout + billing portal | Employer | 🟡 | Works (raw REST), **Stripe TEST mode**; **mock-success if secret unset** |
| Admin portal (8 pages) | Admin | ✅ | Strongest authz in the codebase; **but revenue always 0** (transactions never written) |
| **Stripe webhook → subscription sync** | Platform | 🔶 | **Signature verification is a no-op stub** + no idempotency = paywall bypass |
| **Job-posting entitlement enforcement** | Platform | 🔶 | **None** — `job_credits` never checked/decremented; free/expired employers post unlimited jobs |
| **transactions / revenue ledger** | Platform | 🔶 | Table + admin readers exist; **nothing ever writes to it** |
| CV unlock / `cv_view_credits` paywall | Platform | ⬜ | `cv_unlocks` table + column exist; no code spends them |
| Candidate one-off services on `/pricing` | Platform | ⬜ | "اطلب الآن" buttons have no `onClick`/checkout |
| External jobs scraper (LinkedIn/Bayt/Indeed) | Platform | 🟡 | Inbound ingest API ready; **scraper producer workflow NOT built** |
| Generic email (`gn-email-send`) + message/payment notify | Platform | ⬜ | Only contract-lifecycle email works — **systemic blocker** for all subscription B2C features |
| i18n (next-intl) / SEO structured data / E2E tests | Platform | ⬜ | Phase 12 at 0%; undercuts the stated bilingual value prop |
| CI/CD, automated tests, monitoring, backups | Platform | ⬜ | Zero tests, no pipeline, no APM/Sentry, no documented backup/restore |

---

## 4. Strengths (what's genuinely good)

- **Broad, working product for a solo 3-month build**: 4 full portals, ~26 tables, ~44 routes, real
  end-to-end candidate and employer journeys with DB persistence, empty states, and credit scaffolding.
- **Real UAE-market differentiation that is actually built**: the Emiratisation/Nafis suite
  (`emiratisation-engine.ts` is clean, pure-TS MOHRE logic), MOHRE-aligned contract automation with a proper
  state machine, bilingual matching via a seeded `skill_aliases` dictionary, and a verification wizard.
- **Disciplined RTL/Arabic implementation**: consistent logical CSS properties (`ms-/me-/ps-/pe-`,
  `rounded-ee/es`), a coherent custom design system on Radix.
- **Admin API surface is a model of correct authorization** — every admin route re-checks
  `profiles.role==='admin'` server-side before privileged writes, and company-verify writes an audit log.
  **This is the template the rest of the backend should follow.**
- **Real in-process business logic where it counts** — analytics forecasting, contract rendering/state
  machine, team RBAC, emiratisation math are genuine, testable code (not proxied to n8n).
- **Clean separation of AI concerns**: all LLM keys live in n8n, keeping Gemini credentials off the app
  server.

---

## 5. Critical Gaps (verified, with evidence)

Each item below was confirmed against the actual source.

1. **Stripe webhook does NOT verify signatures.** `verifyStripeSignature()` in
   `growth-nexus/src/app/api/stripe/webhook/route.ts:19-27` just `JSON.parse`s the body and ignores the
   `stripe-signature` header and `STRIPE_WEBHOOK_SECRET`. It then writes `subscription_tier` / `job_credits`
   via the service-role client keyed on attacker-controlled `metadata.company_id`. **Anyone can POST a forged
   `checkout.session.completed` to grant themselves "pro" + credits.** No idempotency either (replayed
   `invoice.paid` keeps extending expiry).

2. **No entitlement enforcement on the core monetized action.** Jobs are inserted **client-side**
   (`employer/jobs/new/page.tsx`) with `job_credits` read but never checked or decremented, no server route,
   and only a permissive "Owner can manage jobs" RLS policy. Free/expired employers post unlimited jobs.

3. **Owners can self-upgrade.** The `companies` UPDATE RLS policy has no column-level restriction, so an
   owner can set `subscription_tier='pro', job_credits=999` directly from the browser anon client — a third,
   independent paywall bypass.

4. **Public CV exposure (PDPL/GDPR).** `full schema.sql:497-498` defines
   `CREATE POLICY "Public can read resumes" ON storage.objects FOR SELECT TO public USING (bucket_id='resumes')`.
   **Every uploaded CV PDF (name, phone, email, work history, nationality) is world-readable** by anyone with
   or guessing the storage URL. This is a live personal-data breach under UAE Federal Decree-Law 45/2021.

5. **Account deletion is fake.** `candidate/settings/page.tsx:142-154` `handleDeleteAccount()` only calls
   `auth.signOut()` and tells the user to "contact support". No rows deleted, **no backend delete route
   exists** — the PDPL/GDPR right-to-erasure is unmet, and there's no admin tooling to service a request.

6. **Unmetered AI cost / no rate limiting.** All `*_free_mode` credit flags are seeded `'true'` (credits
   globally OFF) and there is **zero rate limiting** anywhere. Every authenticated user has unlimited free
   Gemini-via-n8n calls — a direct path to a surprise LLM bill and an AI-wide outage (financial DoS).

7. **Entire B2C paid-revenue layer unbuilt** despite docs claiming ~60%. Only Interview Self-Practice ships.
   Rejection Analyzer, Career Path, Skill Gap, Job Alerts, Auto-Apply have API routes + tables but **no
   candidate pages** and unbuilt/half-built workflows. This is the primary business case and it does not
   exist yet.

8. **Email is a systemic blocker.** No generic email provider/workflow (only contract-lifecycle SMTP works).
   Welcome, password-reset, job-alert digests, and every subscription B2C feature depend on email that
   cannot send.

9. **Monetization is inert even where wired.** Stripe is TEST mode, the `transactions` ledger is never
   written (admin revenue permanently 0), and credits are globally disabled.

10. **Corrupted migration.** ✅ **RESOLVED 2026-07-06.** `growth-nexus/supabase/migrations/20260224233000_landing_page_rpcs.sql`
    contained an Arabic history-lesson JSON array, **not SQL** — running the migrations folder in order threw.
    **Verified nuance:** the corruption was *isolated to that one standalone migration file*. Both consolidated
    schema files — root `full.sql` and `growth-nexus/full schema.sql` (byte-for-byte identical, 3639 lines) —
    always contained the correct landing-page RPCs and no corrupted content, so no schema data was ever lost.
    The migration file has been repaired with the real RPCs (using the *fixed* `upsert_private_candidate` that
    doesn't forge `auth.users` rows). Note: the consolidated files define `upsert_private_candidate` twice — a
    buggy original (line ~390) and the fixed version (line ~593); `CREATE OR REPLACE` run top-to-bottom means
    the fixed one wins.

11. **Unauthenticated side-effecting routes.** `/api/company/register` (no auth, trusts `userId` from body,
    service-role → identity spoofing) and `/api/notifications/application-notify` (no auth →
    notification/webhook spam/phishing).

12. **Secrets committed.** Real Supabase **service-role + anon JWTs** and the live URL are in
    `growth-nexus/.env.local` in the working tree; `N8N_WEBHOOK_SECRET` defaults to
    `change-me-to-a-strong-secret` and the production n8n URL is hardcoded as a fallback.

13. **No tests, CI/CD, monitoring, or backups.** Manual SSH deploy to a single VPS; recent commits are mostly
    DB column-name-mismatch fixes that tests would have caught.

---

## 6. Risk Register

| # | Risk | Severity | Mitigation (summary) |
|---|---|---|---|
| 1 | Public CV bucket = live PII breach (PDPL/GDPR) | **Critical** | Make `resumes` private; serve via short-TTL signed URLs; drop the public-read policy |
| 2 | 3 independent paywall bypasses (webhook sig / owner RLS / no credit check) | **Critical** | Stripe SDK `constructEvent` + idempotency table; billing columns service-role-only; server-side job-create route that decrements credits |
| 3 | Committed live service-role JWT + default webhook secret | **Critical** | Rotate keys + `N8N_WEBHOOK_SECRET` now; purge `.env.local` from history; add `.env.example` |
| 4 | Fake account deletion + no data export | **High** | Real cascade-delete route + `auth.admin.deleteUser`; data-export endpoint |
| 5 | Unmetered AI cost / financial DoS (no rate limit, free_mode on) | **High** | Rate limit all AI routes + per-user daily quota **before** turning credits on |
| 6 | Unauthenticated `company/register` & `application-notify` | **High** | Require `getUser()`, derive `userId` from session, rate-limit |
| 7 | Role self-declaration → admin escalation | **High** | Assign roles server-side; never copy `user_metadata.role` into `profiles` |
| 8 | ~~Corrupt migration~~ (✅ fixed 2026-07-06 — `full.sql` was always clean); unordered hand-applied migrations; `contract_templates` column conflict; stale `SCHEMA.SQL` | **High** | ~~Fix corrupt migration~~ done; resolve column conflict; one authoritative idempotent schema; adopt supabase CLI |
| 9 | No DB backup / restore runbook (single Supabase project, hand-pasted migrations) | **High** | Enable PITR + automated backups; write a restore runbook |
| 10 | n8n single point of failure; mock fallbacks fabricate results silently | **High** | Health checks + explicit "AI unavailable" states; never deduct credits on mock path; alert on failures |
| 11 | IDOR gaps relying only on RLS (`contracts/track` PATCH, `evaluation/submit`, `ai/match-score`) | Medium | Add in-code ownership checks; audit every RLS policy; add `zod` |
| 12 | Weak company verification (no registry cross-check / OTP ownership) | Medium | Add registry cross-check + phone-OTP before employer self-serve |
| 13 | SSRF via `cv/parse` `sourceUrl` fetch; PII in pm2 plaintext logs | Medium | Allowlist fetched URLs; redact PII from logs |
| 14 | No legal/privacy/terms pages, no consent capture | Medium | Publish Privacy Policy + Terms; consent at signup/CV-upload; data-retention policy |
| 15 | Cron auth fails open when `CRON_SECRET` unset; Vercel cron never fires on VPS | Medium | Fail-closed; add a real VPS system-cron/pinger |
| 16 | Missing indexes + FK `ON DELETE` gaps | Low | Cleanup migration before traffic grows |

---

## 7. Notable Doc/Status Drift (why to trust this audit over older docs)

- Team self-reports **~98% complete**; verified reality is **55–65% launchable**.
- `PROGRESS.md`/`ROADMAP.md` disagree with each other on B2C completion (17% vs 60%); code shows only
  Interview Practice built.
- Stack is called Next 14 / 15 / 16 across different docs; `package.json` says **16.1.6**.
- `B2C_DEPLOYMENT_TESTS.md` references a deployed B2C migration while `TODO.md`/`PROGRESS.md` mark every B2C
  page ❌.
- `vercel.json` implies Vercel hosting; the app actually runs on a PM2/Nginx VPS.

**Recommendation:** treat this file + the two companion docs as the single source of truth going forward, and
retire or clearly date-stamp the older status docs.
