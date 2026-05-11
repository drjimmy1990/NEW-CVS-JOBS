# 📊 GrowthNexus — Progress Report

> **Last Updated:** 12 May 2026 — 01:00 AM
> **Overall Completion: ~89%** (core platform + verification enforcement done, B2C services + polish remaining)
> **Repo:** `https://github.com/drjimmy1990/NEW-CVS-JOBS`
> **Live Site:** `https://jobs-test.uae4jobs.ae`
> **GitNexus:** 2065 symbols, 111 execution flows (indexed at commit `f99777f`)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript 5 |
| UI | Shadcn/ui + Custom Arabic RTL Components |
| Database | Supabase (Auth + DB + Storage + RLS) |
| AI Automation | n8n Webhooks → Google Gemini |
| Payments | Stripe (Checkout + Portal + Webhook) |
| Deployment | aaPanel VPS + PM2 + Nginx Reverse Proxy |
| Code Intelligence | GitNexus (2065 symbols, 111 execution flows) |

---

## Phase Completion

| Phase | Description | Status | Progress |
|-------|-------------|--------|----------|
| 0 | Environment Setup | ✅ Done | 100% |
| 1 | Database & Auth (Login, Register, RLS) | ✅ Done | 100% |
| 2 | Employer Core (Dashboard, Settings, Jobs) | ✅ Done | 100% |
| 3 | Public Job Board (Homepage, Search, Apply) | ✅ Done | 100% |
| 4 | Candidate Core (CV, Applications, Profile) | ✅ Done | 100% |
| 5 | ATS Pipeline & UAE Enhancements | ✅ Done | 100% |
| 6 | Admin Panel (Users, Companies, Jobs, Config) | ✅ Done | 100% |
| 7 | n8n Guides & AI APIs | ✅ Done | 100% |
| 8 | Stripe + Interview AI + Committee Evaluation | ✅ Done | 100% |
| 9 | Contract, Compliance & Team | ✅ Done | 100% |
| 10 | Integration, Security & Launch | 🔧 In Progress | ~55% |
| 11 | B2C Candidate Services | ❌ Not Started | 0% |
| 12 | i18n, SEO & Launch Polish | ❌ Not Started | 0% |

---

## Module Status (GitNexus Clusters)

| Module | Symbols | Status | Key Features |
|--------|---------|--------|-------------|
| **UI** | 110 | ✅ Complete | Shadcn components, RTL, Arabic layout |
| **Emiratisation** | 60 | ✅ Complete | Profile form, gauges, compliance dashboard, export, audit |
| **Templates** | 34 | ✅ Complete | Contract templates, offer letters, MOHRE standard |
| **CV** | 26 | ✅ Complete | Upload, AI parse, skills extraction |
| **Export** | 10 | ✅ Built | PDF export (needs profile data seeded) |
| **Login** | 10 | ✅ Complete | Auth, register, role-based redirects |
| **Team** | 9 | ✅ Complete | Invite, remove, 4 roles (owner/admin/member/viewer) |
| **Messages** | 8 | ✅ Complete | Conversation system, unread counts |
| **New** | 7 | ✅ Complete | Job creation wizard, landing page creation |
| **Profile** | 6 | ✅ Complete | Candidate + company profiles |
| **Layout** | 5 | ✅ Complete | Employer + candidate + admin layouts |
| **Companies** | 5 | ✅ Complete | Management, verification status gating, 7-step wizard |
| **Verification** | 8 | ✅ Complete | Admin approval panel, `company_documents` bucket, audit log, **enforcement gating (11 files)** |
| **Forecasting** | — | ✅ Complete | Live DB metrics, 7 KPIs, predictions widget |
| **Contracts** | — | ✅ Complete | Generate, track, candidate portal, PDF, cron |
| **Notifications** | — | ✅ Complete | In-app bell, application notify, DB table |

---

## Pages Built (55+ routes)

### Public (6 pages)
| Page | Route | Status |
|------|-------|--------|
| Landing Page | `/` | ✅ |
| Job Listings | `/jobs` | ✅ |
| Job Detail | `/jobs/[slug]` | ✅ |
| Company Profile | `/company/[slug]` | ✅ |
| Pricing Plans | `/pricing` | ✅ |
| Apply via Landing Page | `/apply/[token]` | ✅ |

### Candidate Dashboard (9 pages)
| Page | Route | Status |
|------|-------|--------|
| Dashboard | `/candidate/dashboard` | ✅ |
| CV Upload & AI Parse | `/candidate/cv` | ✅ |
| Profile | `/candidate/profile` | ✅ |
| Applications | `/candidate/applications` | ✅ |
| AI Interview | `/candidate/interview/[id]` | ✅ |
| Saved Jobs | `/candidate/saved-jobs` | ✅ |
| Messages | `/candidate/messages` | ✅ |
| Contracts List | `/candidate/contracts` | ✅ |
| Contract View/Sign | `/candidate/contracts/[id]` | ✅ |

### Candidate — Not Built Yet (Phase 11)
| Page | Route | Status |
|------|-------|--------|
| CV Builder | `/candidate/cv/builder` | ❌ Phase 11 |
| CV Analyzer | `/candidate/cv/analyze` | ❌ Phase 11 |
| Career Path | `/candidate/career-path` | ❌ Phase 11 |
| Job Alerts | `/candidate/job-alerts` | ❌ Phase 11 |

### Employer Dashboard (16 pages)
| Page | Route | Status |
|------|-------|--------|
| Dashboard | `/employer/dashboard` | ✅ (Gated by verification) |
| Job List | `/employer/jobs` | ✅ |
| New Job (AI Wizard) | `/employer/jobs/new` | ✅ |
| Applicants Pipeline | `/employer/jobs/[id]/applicants` | ✅ |
| All Applicants | `/employer/applicants` | ✅ |
| Candidate Search | `/employer/candidates` | ✅ |
| Saved Candidates | `/employer/saved-candidates` | ✅ |
| Committee Evaluation | `/employer/evaluate/[appId]` | ✅ |
| Analytics & KPIs | `/employer/analytics` | ✅ |
| Emiratisation | `/employer/emiratisation` | ✅ |
| Contracts (Templates) | `/employer/contracts` | ✅ |
| Contract Tracking | `/employer/contracts/track` | ✅ (+ PDF download) |
| Landing Pages (List) | `/employer/landing-pages` | ✅ |
| Landing Pages (New) | `/employer/landing-pages/new` | ✅ |
| Team Management | `/employer/team` | ✅ |
| Messages | `/employer/messages` | ✅ |
| Settings | `/employer/settings` | ✅ |

### Admin Panel (6 pages)
| Page | Route | Status |
|------|-------|--------|
| Dashboard (KPI) | `/admin/dashboard` | ✅ |
| Users | `/admin/users` | ✅ |
| Companies | `/admin/companies` | ✅ (Verification Panel) |
| Jobs | `/admin/jobs` | ✅ |
| Transactions | `/admin/transactions` | ✅ |
| System Config | `/admin/config` | ✅ |

---

## API Routes (20+)

| Route | Method | Status |
|-------|--------|--------|
| `/api/ai/job-description` | POST | ✅ (n8n + mock fallback) |
| `/api/ai/match-score` | POST | ✅ (n8n + mock fallback) |
| `/api/interview/questions` | POST | ✅ (n8n + mock fallback) |
| `/api/interview/submit` | POST | ✅ (n8n + mock fallback) |
| `/api/evaluation/submit` | POST | ✅ (n8n + auto-summary) |
| `/api/contracts/generate` | POST | ✅ (+ n8n notifications) |
| `/api/contracts/track` | GET/PATCH | ✅ (+ n8n notifications) |
| `/api/contracts/candidate` | GET | ✅ |
| `/api/contracts/candidate/[id]` | GET/PATCH | ✅ |
| `/api/contracts/pdf/[id]` | GET | ✅ (Arabic fonts) |
| `/api/contracts/templates` | GET/POST/DELETE | ✅ |
| `/api/cron/contract-expiry` | GET | ✅ (vercel.json daily) |
| `/api/analytics/forecasting` | GET | ✅ (live DB — 7 metrics) |
| `/api/conversations` | GET/POST | ✅ |
| `/api/notifications` | GET/PATCH | ✅ |
| `/api/notifications/application-notify` | POST | ✅ (+ n8n + DB notification) |
| `/api/stripe/checkout` | POST | ✅ |
| `/api/stripe/portal` | POST | ✅ |
| `/api/stripe/webhook` | POST | ✅ |
| `/api/emiratisation/profile` | GET/POST | ✅ |
| `/api/emiratisation/export` | GET | ✅ |
| `/api/team` | GET/POST/DELETE | ✅ |

---

## N8N Webhooks Status

| # | Webhook | Status | Notes |
|---|---------|--------|-------|
| 1 | CV Parser | ✅ Done | PDF → Gemini → Supabase |
| 2 | AI Job Description | ✅ Done | Gemini → Respond |
| 3 | Match Score | ✅ Done | Gemini → Supabase Update |
| 4 | Interview Questions | ✅ Done | Gemini → Respond |
| 5 | Interview Evaluation | ✅ Done | Gemini → Respond |
| 6 | Application Notification | ⚠️ Partial | In-app ✅, n8n webhook ✅, Email/Telegram missing |
| 7 | Smart Matching | ❌ Not Started | AI candidate pool search |
| 8 | Message Notification | ❌ Not Started | Chat notifications |
| 9 | Payment Verification | ❌ Not Started | Stripe fulfillment |
| 10 | Company Verification | ✅ Done | Webhook → Download → Gemini OCR → Decision Engine → 3× Supabase |
| 11 | Committee Summary | ✅ Done | Gemini → Respond |
| 12 | Contract Notifications | ⚠️ Code Ready | Blueprint exists (`n8n-contract-notify-workflow.json`). **Not published on n8n yet** |

### Summary: 7 Done, 2 Partial/Code Ready, 3 Not Started

> **See `webhooks_status.md` for full details**

---

## Contract Pipeline ✅ COMPLETE

| Component | Status | Details |
|-----------|--------|---------|
| Contract Generate API | ✅ | `POST /api/contracts/generate` + n8n event |
| Contract Tracking API | ✅ | `GET/PATCH /api/contracts/track` + n8n events |
| Contract Templates API | ✅ | `GET/POST/DELETE /api/contracts/templates` |
| Employer Tracking UI | ✅ | Pipeline: draft → sent → viewed → signed → declined → expired |
| PDF Download (Employer) | ✅ | Download button on tracking page |
| Candidate Portal (List) | ✅ | `/candidate/contracts` — view all contracts |
| Candidate Portal (View) | ✅ | `/candidate/contracts/[id]` — sign/decline with modal |
| PDF Generation API | ✅ | `/api/contracts/pdf/[id]` — Arabic font support |
| N8N Notifications | ⚠️ | `contract-notify.ts` → 4 events. **N8N workflow not published yet** |
| Auto-Expiry Cron | ✅ | `/api/cron/contract-expiry` — daily via vercel.json |
| N8N Workflow Blueprint | ✅ | `n8n-contract-notify-workflow.json` ready to import |
| MOHRE Default Template | ✅ | Seeded in `full.sql` with Arabic HTML |

---

## Forecasting Engine ✅ COMPLETE

| Component | Status |
|-----------|--------|
| `GET /api/analytics/forecasting` | ✅ Live DB queries |
| Time-to-fill (avg days) | ✅ From real hired applications |
| Offer acceptance rate | ✅ hired ÷ (offered + hired) |
| Hiring difficulty (low/med/high) | ✅ Based on applicants/job |
| Conversion funnel (4-stage) | ✅ applied → reviewed → interview → hire |
| 30-day predictions | ✅ Conservative projections |
| Salary benchmarking | ✅ Avg min/max from company jobs |
| 6-month trend | ✅ Monthly jobs + applications |
| `ForecastingWidget.tsx` | ✅ Arabic UI with all metrics |

---

## Smart Candidate Suggestions ✅ COMPLETE (12 May 2026)

> **Previously:** Hardcoded mock data (سارة ك., محمد أ.) — **Replaced with real DB queries**

| Component | Status |
|-----------|--------|
| Data source | ✅ Real `candidates` table + `profiles` (signed-up users) |
| Skill matching | ✅ Jaccard similarity: `candidates.skills[]` vs `jobs.skills_required[]` |
| Privacy filter | ✅ Only `is_public = true` candidates shown |
| Scoring | ✅ Match % = (matched ÷ union) × 100 |
| Display | ✅ Top 5 candidates, up to 4 skills each |
| Empty state | ✅ "أنشر وظائف لاقتراح مرشحين مطابقين" when no matches |

---

## Database Schema (from full.sql — Source of Truth)

### Tables (23)
`profiles` · `companies` · `candidates` · `jobs` · `applications` · `saved_jobs` · `saved_candidates` · `conversations` · `messages` · `landing_pages` · `transactions` · `system_config` · `committee_evaluations` · `contract_templates` · `contracts` · `emiratisation_profiles` · `emiratisation_audit_log` · `company_members` · `notifications` · `cv_unlocks` · `company_documents` · `company_blacklist` · `company_verification_log`

### Enums (4)
`user_role` (candidate/employer/admin) · `job_type` (5 values) · `job_status` (5 values incl. paused) · `app_status` (6 values incl. offer) · `candidate_type_enum` (emirati/resident) · `company_type_enum` (3 values)

### Views (1)
`public_jobs_view` — Secure view with Arabic confidentiality labels (جهة حكومية / شبه حكومية / خاصة)

### Functions/RPCs (12)
`upsert_private_candidate` · `get_or_create_private_job` · `increment_landing_page_views` · `increment_candidate_views` · `increment_job_views` · `calculate_match_score` · `save_interview_result` · `get_user_company` · `create_notification` · `update_updated_at_column` · `update_unread_counts` · `update_job_applicants_count`

### Migrations (14 — ALL IN full.sql)
| Migration | Status |
|-----------|--------|
| `001_uae_schema_fixes.sql` | ✅ In full.sql |
| `002_messaging_system.sql` | ✅ In full.sql |
| `004_applicants_count_trigger.sql` | ✅ In full.sql |
| `20260224233000_landing_page_rpcs.sql` | ✅ In full.sql |
| `20260314222000_messaging_unread_triggers.sql` | ✅ In full.sql |
| `20260422000000_phase5_enhancements.sql` | ✅ In full.sql |
| `20260422100000_phase8_stripe_interview_committee.sql` | ✅ In full.sql |
| `20260429000000_phase9_contract_automation.sql` | ✅ In full.sql |
| `20260429010000_save_interview_rpc.sql` | ✅ In full.sql |
| `20260429020000_company_team_members.sql` | ✅ In full.sql |
| `20260429030000_notifications_system.sql` | ✅ In full.sql |
| `20260511000000_emiratisation_module.sql` | ✅ In full.sql |
| `20260511100000_contracts_tracking.sql` | ✅ In full.sql |
| `ai_analysis.sql` | ✅ In full.sql |
| RLS infinite recursion fix | ✅ In full.sql (at end) |

> **Note:** `full.sql` is the canonical source of truth. Every query the user has executed is recorded there. All 14 migration files + RLS fixes are included.

---

## What's Done vs What Remains

### ✅ Completed (Core Platform ~87%)

| Area | Status |
|------|--------|
| Auth system (login/register/role-based) | ✅ |
| Middleware (route protection + RBAC) | ✅ |
| Employer dashboard + KPIs | ✅ |
| Candidate dashboard + profile completion | ✅ |
| Job CRUD (create/edit/list/detail) | ✅ |
| Application pipeline (7 statuses) | ✅ |
| AI interview wizard + scoring | ✅ |
| Committee evaluation (multi-evaluator) | ✅ |
| Stripe checkout + webhook + portal | ✅ |
| Team management (4 roles, invite/remove) | ✅ |
| In-app messaging + unread counts | ✅ |
| Notifications system (bell + DB + API) | ✅ |
| Admin panel (6 pages) | ✅ |
| CV upload + AI parsing | ✅ (mock fallback) |
| Emiratisation tracker (6-tab + audit log) | ✅ |
| Analytics + rejection analysis | ✅ |
| Forecasting engine (live data, 7 metrics) | ✅ |
| Contract lifecycle (generate → track → sign → PDF → expire) | ✅ |
| Contract templates (MOHRE + custom) | ✅ |
| Candidate contract portal | ✅ |
| Landing pages (list + create + public apply) | ✅ |
| Pricing page + 3-tier plans | ✅ |
| 14 SQL migrations (ALL in full.sql) | ✅ |
| 20+ shadcn/ui components | ✅ |
| Responsive RTL design (Arabic-first) | ✅ |
| 23 DB tables with RLS + indexes | ✅ |
| 12 RPC functions | ✅ |
| Company Verification Engine | ✅ |
| RLS infinite recursion fix | ✅ |
| **Verification Enforcement Gating** (12 May 2026) | ✅ |
| — VerificationContext (shared state) | ✅ |
| — VerificationLock + VerificationLockServer | ✅ |
| — Job publish gating (draft-only for unverified) | ✅ |
| — Candidate search blocked for unverified | ✅ |
| — Messages blocked for unverified | ✅ |
| — Saved candidates blocked for unverified | ✅ |
| — Dashboard CTA gating | ✅ |
| — Auto-create company bypass removed | ✅ |
| — All companies default to `under_review` | ✅ |
| — Server-side API protection (conversations) | ✅ |

### ⏳ Still Needed (~13%)

| Feature | Priority | Phase |
|---------|----------|-------|
| **Contract notify → publish on n8n** | 🔴 High | 10 |
| ~~Emiratisation data seeding~~ | ~~🔴 High~~ | ~~10~~ ✅ Done (12 May) |
| **Security hardening** (secrets, Zod, rate limiting) | 🔴 High | 10 |
| ~~Company verification enforcement~~ | ~~🟡 Medium~~ | ~~10~~ ✅ Done (12 May) |
| **Smart candidate suggestions (replace mocks)** | 🟡 Medium | 10 |
| **AI match score enhancement** | 🟡 Medium | 10 |
| **Landing page builder (full CRUD)** | 🟡 Medium | 10 |
| **Stripe production readiness** | 🟡 Medium | 10 |
| **Company verification OCR (n8n workflow)** | 🟡 Medium | 10 |
| **Email service integration** | 🟡 Medium | 10 |
| **Landing page builder (full CRUD)** | 🟡 Medium | 10 |
| **Stripe production readiness** | 🟡 Medium | 10 |
| **CV Builder** | 🟠 Phase 11 | 11 |
| **CV Analyzer (paid)** | 🟠 Phase 11 | 11 |
| **Career Path Generator** | 🟠 Phase 11 | 11 |
| **Job Alerts** | 🟠 Phase 11 | 11 |
| **Auto-Apply Service** | 🟠 Phase 11 | 11 |
| **i18n (`next-intl`)** | 🟠 Phase 12 | 12 |
| **SEO (sitemap, OG, structured data)** | 🟠 Phase 12 | 12 |
| **E2E tests (Playwright)** | 🟠 Phase 12 | 12 |
| **n8n remaining workflows (4)** | 🟢 Low | 10 |

---

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# N8N (7 active webhooks)
NEXT_PUBLIC_N8N_CV_PARSER_WEBHOOK=
N8N_AI_JOB_DESC_WEBHOOK=
N8N_MATCH_SCORE_WEBHOOK=
N8N_INTERVIEW_QUESTIONS_WEBHOOK=
N8N_INTERVIEW_EVAL_WEBHOOK=
N8N_COMMITTEE_SUMMARY_WEBHOOK=
N8N_APPLICATION_NOTIFY_WEBHOOK=

# Contract Notifications
N8N_CONTRACT_NOTIFY_WEBHOOK=     # ⚠️ Not published on n8n yet
N8N_WEBHOOK_SECRET=              # ⚠️ Change from default!

# Contract Expiry Cron
CRON_SECRET=                     # ⚠️ Set in Vercel dashboard
NEXT_PUBLIC_APP_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_PRICE_ID=
STRIPE_GROWTH_PRICE_ID=
STRIPE_PRO_PRICE_ID=
```

---

## Deployment Info

| Item | Value |
|------|-------|
| VPS | `178.18.254.38` — aaPanel |
| Live URL | `https://jobs-test.uae4jobs.ae` |
| App Path | `/www/wwwroot/jobs-test.uae4jobs.ae/` |
| Process Manager | PM2 (`growthnexus`) |
| Deploy Script | `deploy.sh` in app root |
| SSL | Let's Encrypt via aaPanel |
| n8n | `n8n.asra3.com` (Coolify-managed) |

---

## Known Issues & Blockers

| Issue | Impact | Resolution |
|-------|--------|------------|
| `emiratisation_profiles` table empty | Compliance export returns 404 | Use `EmiratisationProfileForm.tsx` to seed data |
| Contract notify not on n8n | Email notifications won't fire | Import `n8n-contract-notify-workflow.json` → activate |
| `N8N_WEBHOOK_SECRET` = default | Security risk | Change to strong value before production |
| `CRON_SECRET` not set | Anyone can trigger contract expiry | Set env var in Vercel dashboard |
| Smart candidate suggestions mock | Dashboard shows hardcoded names | Replace with real DB query |
| Multi-language not implemented | Arabic-only UI | Phase 12 work (next-intl) |
| Stripe in test mode | No real payments | Switch to live keys for production |
| No email service | Can't send emails | Integrate Resend or SendGrid |
