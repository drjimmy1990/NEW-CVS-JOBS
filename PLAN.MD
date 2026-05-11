# 📋 GrowthNexus — Master Plan

> **Last Updated:** 12 May 2026 — 02:18 AM
> **Current Phase: 10 (Integration, Security & Launch)**
> **Completed: 9 of 12 phases (Phase 10 at ~70%)**
> **Source of Truth:** `full.sql` + GitNexus (2065 symbols, 111 flows)

---

## Platform Vision

GrowthNexus is an **AI Recruitment Operating System** for the UAE market, serving both:
- **B2B (Employers):** SaaS subscription for recruitment operations — screening, interviews, contracts, compliance, analytics
- **B2C (Candidates):** AI-powered career tools — CV analysis, interview prep, job matching

### 6-Module Architecture
1. **Recruitment Core** — Jobs, Applicants, Screening, Pipelines
2. **Interview AI** — Question generation, scoring, panel evaluation
3. **Offer & Contract Automation** — Templates, tracking, e-sign, candidate portal, PDF
4. **Analytics & KPIs** — Dashboards, reports, hiring metrics
5. **Forecasting Engine** — Time-to-fill, offer acceptance, hiring difficulty predictions
6. **Emiratisation Engine** — Localization ratio, target tracking, compliance alerts

---

## ✅ Completed Phases (1–9)

### Phase 1–4: Foundation
- Auth (Supabase), RLS, Login/Register with role-based redirects
- Middleware: Route protection, RBAC, auto-profile creation, auto-company creation
- Employer core: Dashboard (6 KPI cards), settings, job wizard
- Public job board: Homepage, search, SEO, apply, company profiles
- Candidate: CV upload + AI parse, applications, profile, saved jobs

### Phase 5: ATS Pipeline & UAE Enhancements
- UAE cities dropdown (12 cities), nationality multi-select, skills tags, AED currency
- Job management: pause/resume/duplicate/share, status filters (All/Active/Paused/Draft/Closed)
- Pipeline: 7 statuses (applied → hired), rejection reasons (7 predefined), confirmation modals
- Analytics dashboard + Emiratisation tracker (MOHRE gauge)
- `public_jobs_view` with confidentiality logic (shows جهة حكومية / شبه حكومية / خاصة)

### Phase 6: Admin Panel
- KPI dashboard, user/company/job management, role filter
- System config CRUD (inline editing, grouped), transactions viewer

### Phase 7: n8n Guides & AI APIs
- 11 workflow guides, webhook contracts documented
- AI job description generator + match score calculator (both with mock fallback)
- CV Parser webhook (PDF → Gemini → Supabase)

### Phase 8: Stripe + Interview AI + Committee
- Stripe SaaS billing (3-tier checkout + portal + webhook lifecycle)
- Interview AI: 5 questions + AI evaluation + score + wizard UI
- Committee evaluation: multi-evaluator + outlier detection + auto-summary
- Pricing page (features visible, prices hidden until checkout)
- `save_interview_result` RPC (SECURITY DEFINER — bypasses RLS for candidate session)

### Phase 9: Contract & Compliance
- Contract generation with n8n notification events (4 lifecycle events)
- Employer tracking dashboard (pipeline: draft → sent → viewed → signed → declined → expired)
- **Candidate contract portal** (list + view/sign/decline)
- **PDF generation API** (Arabic font support via `/api/contracts/pdf/[id]`)
- **Auto-expiry cron** via vercel.json (daily 06:00 UTC)
- **Contract templates** (MOHRE standard + custom per company)
- **N8N workflow blueprint** (`n8n-contract-notify-workflow.json`)
- **Emiratisation module** (profile form, 6-tab dashboard, gauges, PDF export, audit log)
- **Forecasting Engine** — live Supabase data: 7 KPIs from jobs + applications tables
- **Team management** — `company_members` table, invite/remove, 4 roles (owner/admin/member/viewer)
- **Notifications system** — in-app bell, `notifications` table, `create_notification` RPC
- **Landing pages** — list, create new, public `/apply/[token]` route

---

## 🔧 Phase 10: Integration, Security & Launch (CURRENT)

### ~~10.1 Emiratisation Data Seeding~~ ✅ COMPLETE (12 May 2026)

**Delivered:**
- [x] Integrate `EmiratisationProfileForm.tsx` into employer onboarding/dashboard flow
- [x] Allow employers to enter workforce composition data
- [x] Verify PDF export generates correctly with profile data
- [x] Test compliance alerts and MOHRE target tracking

### 10.2 Forecasting Engine ✅ COMPLETE
> **Status:** Fully connected to live Supabase data (jobs + applications tables)

**Delivered:**
- [x] `GET /api/analytics/forecasting` — queries real DB, computes 7 metrics
- [x] `ForecastingWidget.tsx` — displays all predictions with Arabic UI
- [x] Time-to-fill, Offer acceptance rate, Hiring difficulty score
- [x] 4-stage conversion funnel, 30-day projections, Salary benchmarking
- [x] 6-month monthly trend (jobs + applications per month)

### ~~10.6 Smart Candidate Suggestions~~ ✅ COMPLETE (12 May 2026)
> **Status:** Mock data replaced with real DB queries

**Delivered:**
- [x] Server-side query: collects `skills_required` from company jobs, matches against `candidates.skills[]`
- [x] Jaccard similarity scoring (intersection ÷ union × 100)
- [x] Top 5 candidates displayed with real names, headlines, skills
- [x] Empty state when no jobs or no matching candidates
- [x] Privacy: only `is_public = true` candidates shown

### 10.3 Company Verification Flow (Trust Score) ✅ COMPLETE
> **Status:** Foundation, UI, Enforcement Gating, and OCR Workflow all complete

**Delivered:**
- [x] 7-step employer registration wizard (`/register/employer`)
- [x] Employer layout gating via `VerificationBanner` (restricts jobs/candidates access based on status)
- [x] Extended `companies` table with `verification_status` (9 states), `entity_type`, `risk_score`
- [x] Admin Panel rewrite (`/admin/companies`) with full status control and audit logging
- [x] Database tables: `company_documents`, `company_verification_log`, `company_blacklist` + Storage bucket `company_documents`

**Verification Enforcement Gating ✅ COMPLETE (12 May 2026):**
- [x] `VerificationContext` + `useVerification()` hook — shared state across employer dashboard
- [x] `VerificationLock` (client) + `VerificationLockServer` (server) — reusable lock UI components
- [x] Job publish gating — unverified can save drafts, blocked from publishing
- [x] Candidate search (`/employer/candidates`) — server-side blocked
- [x] Messages (`/employer/messages`) — client-side blocked
- [x] Saved candidates (`/employer/saved-candidates`) — client-side blocked
- [x] Dashboard CTA gating — lock icon replaces "Post Job" button
- [x] Auto-create company bypass removed from job wizard
- [x] All new companies default to `under_review` (no auto-verification)
- [x] Server-side API protection: `POST /api/conversations/start` returns 403 for unverified
- [x] Fixed pre-existing Next.js 16 params typing in admin verify route

**n8n OCR Workflow ✅ COMPLETE (12 May 2026):**
- [x] `gn-company-verify` n8n workflow (8 nodes): Webhook → Download Doc → Gemini OCR → Decision Engine → 3× Supabase updates (company, document, audit log)
- [x] Supabase DB webhook triggers on `company_documents` INSERT
- [x] Gemini Vision extracts: `official_name`, `trade_license_number`, `expiry_date`
- [x] Auto risk scoring: base 80, -40 if no license number, -30 if expired
- [x] Auto status assignment: `trusted` / `limited` / `under_review`
- [x] Parallel DB writes: `companies` (risk/status), `company_documents` (ocr_data), `company_verification_log` (audit)

**Tasks Remaining:**
- [ ] API: `GET /api/trust-score/:userId`

### 10.4 Remaining N8N Workflows
| # | Workflow | Priority | Description |
|---|---------|----------|-------------|
| 12 | Contract Notifications | 🔴 High | **Blueprint ready** (`n8n-contract-notify-workflow.json`). ⚠️ **Not published on n8n yet** — import → activate → test 4 events |
| 7 | Smart Matching | 🟡 Medium | AI ranks best candidates from talent pool |
| 6 | App Notification | 🟢 Low | Add email/Telegram node to existing workflow |
| 8 | Message Notification | 🟢 Low | Chat message notifications (`/api/conversations/start` trigger) |
| 9 | Payment Verification | 🟡 Medium | Stripe webhook fulfillment |

### 10.5 Security Hardening
- [ ] Change `N8N_WEBHOOK_SECRET` from default value to strong production key
- [ ] Verify all API routes have proper auth checks
- [ ] Set `CRON_SECRET` env var in **Vercel dashboard** (code already checks it — `api/cron/contract-expiry/route.ts:L9-12`)
- [ ] Rate limiting on all public API routes
- [ ] Input validation with Zod schemas on critical endpoints
- [ ] CORS configuration for production domain

### 10.6 AI Enhancement (Replace Mocks)
> **Status:** Several AI features use mock/fallback data that should be connected to real models

- [ ] **Smart Candidate Suggestions** — employer dashboard shows hardcoded candidates → replace with real DB query + match scoring
- [ ] **AI Match Score Enhancement** — add real skill matching (Jaccard similarity), experience compatibility, salary alignment, weighted composite score
- [ ] **Landing Page Builder** — pages exist (list + new) → enhance with full CRUD editor, preview, custom branding

### 10.7 Stripe Production Readiness
- [ ] Stripe Price IDs in environment variables (not hardcoded)
- [ ] Handle all Stripe error cases gracefully
- [ ] Add Stripe customer portal branding
- [ ] Test mode → live mode switch
- [ ] Invoice generation for employers
- [ ] Refund handling flow

---

## Phase 11: B2C Candidate Services

Based on the business strategy doc (منصة التوظيف), launch in order:

### Phase 11.1 — Starter Pack
| Service | Price | Status | Details |
|---------|-------|--------|---------|
| CV Analyzer | 25 AED one-time | ❌ Not Started | Deep AI analysis, ATS score, keyword optimization, formatting tips |
| CV Builder | 39 AED one-time | ❌ Not Started | 3-5 templates, drag-drop sections, live preview, PDF export |
| Interview AI (Candidate) | 39 AED/month | ❌ Not Started | Already built for employer flow — adapt for candidate self-practice |

### Phase 11.2 — Growth Pack
| Service | Price | Status | Details |
|---------|-------|--------|---------|
| Rejection Analyzer | 29 AED | ❌ Not Started | AI analysis of why candidate was rejected + improvement tips |
| Career Path Generator | 29 AED/month | ❌ Not Started | Input skills/goals → AI growth trajectory + skill gaps + training |
| Skill Gap Analyzer | 25 AED | ❌ Not Started | Compare current skills vs target job requirements |
| Smart Job Alert | 19 AED/month | ❌ Not Started | Email/push for matching jobs, daily/weekly digest via n8n |

### Phase 11.3 — Pro Pack
| Service | Price | Status | Details |
|---------|-------|--------|---------|
| Auto Apply | 49–149 AED/month | ❌ Not Started | n8n workflow: match → auto-submit → track (50 apps/month limit) |
| Voice Interview Analysis | In Pro tier | ❌ Not Started | Audio recording analysis for interview prep |
| Portfolio Builder | 59 AED | ❌ Not Started | Visual portfolio for creative professionals |

---

## Phase 12: i18n, SEO & Launch Polish

### 12.1 Internationalization (i18n)
- [ ] Install and configure `next-intl`
- [ ] Extract all hardcoded Arabic strings → `/messages/ar.json` + `/messages/en.json`
- [ ] Add language switcher in navbar
- [ ] RTL/LTR layout switching
- [ ] Date/time/number/currency localization

### 12.2 SEO Optimization
- [ ] Dynamic metadata per page (title, description, og:image)
- [ ] Sitemap generation (next-sitemap or built-in)
- [ ] robots.txt
- [ ] Structured data: `JobPosting` schema for `/jobs/[slug]` (Google for Jobs)
- [ ] Canonical URLs + Open Graph images for social sharing
- [ ] Server-side rendering optimization

### 12.3 Testing & QA
- [ ] E2E test suite (Playwright): 11 critical scenarios from `CRITICAL_TESTS.md`
- [ ] API route unit tests (all 20+ endpoints)
- [ ] Component tests for critical UI components
- [ ] Database query tests (RLS policies)
- [ ] Load testing for n8n webhook endpoints

### 12.4 Performance & Optimization
- [ ] Lighthouse audit + fixes (target 90+ all categories)
- [ ] Optimize Supabase queries with proper indexes
- [ ] Add caching layer (Redis or in-memory) for frequently accessed data
- [ ] Image optimization for company logos (next/image)

---

## Phase 13: Enterprise Features (Future)

- White-label career portal (setup: 3K–10K + 999–2,999/month)
- API/ATS integration (third-party HR systems)
- Multi-department workflows
- Custom approval chains
- E-sign integration (DocuSign/PandaDoc/HelloSign)
- Monitoring (Sentry, LogRocket)
- Email service (Resend/SendGrid)

---

## B2B Pricing Strategy (from business docs)

| Tier | Price (AED/month) | Jobs | CVs/month | Users |
|------|-------------------|------|-----------|-------|
| Starter | 349 | 3 | 300 | 2 |
| Growth | 799 | 10 | 1,500 | 5 |
| Pro | 1,499 | 25 | 5,000 | 15 |
| Enterprise | 2,999+ | Unlimited | Custom | Custom |

**Add-ons:**
- Contract & E-sign: 199–399/month
- Forecasting: 249–499/month
- Emiratisation: 299–699/month
- Extra users: 39–79/user/month

---

## Candidate Screening Criteria (from الفرز doc)

AI screening ranks candidates by:
1. **Nationality** (configurable per job)
2. **Specialization** match
3. **Qualification type** match
4. **Years of experience** match
5. **CV summary** relevance
6. **Match score percentage** (AI-calculated via `calculate_match_score` RPC)

UI requirements noted:
- Prices hidden until service selection or checkout
- AI-suggested job titles and descriptions
- Skills field in job posting
- Job edit capability for employers
- Company name display logic (hidden → show "Private/Government")
- Application deadline clearly visible
- Cities as dropdown list (12 UAE cities from `system_config`)
- Nationality as multi-select (from `system_config`)
- AED currency throughout
- Job Boost/Promote feature
- Pause/Resume job toggle
- Share/Duplicate job buttons
- Filter: Active/Closed/Draft + Sort options
- Notification badge for new applicants (via `NotificationBell` component)
- Offer/Hired status in pipeline
- Rejection confirmation popup with reason (7 predefined from `system_config`)

---

## Database Schema (from full.sql — ALL APPLIED)

### Core Tables (14 total)
| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User identity, roles, credits | ✅ |
| `companies` | Employer data, Stripe, subscription | ✅ |
| `candidates` | CV, skills, UAE fields (12 columns), views | ✅ |
| `jobs` | Listings, search_vector, status, skills | ✅ |
| `applications` | Pipeline (7 statuses), interview data, match score | ✅ |
| `saved_jobs` | Candidate bookmarks | ✅ |
| `saved_candidates` | Employer bookmarks | ✅ |
| `conversations` | Chat system (unread counts) | ✅ |
| `messages` | Chat messages | ✅ |
| `landing_pages` | Private campaign URLs | ✅ |
| `transactions` | Financial records (AED) | ✅ |
| `system_config` | Dynamic settings (pricing, cities, nationalities) | ✅ |
| `committee_evaluations` | Multi-evaluator scoring | ✅ |
| `contract_templates` | MOHRE + custom templates | ✅ |
| `contracts` | Status machine (6 states), tracking, PDF | ✅ |
| `emiratisation_profiles` | Workforce data, MOHRE compliance | ✅ |
| `emiratisation_audit_log` | Change tracking | ✅ |
| `company_members` | Team roles (4 roles), invites | ✅ |
| `notifications` | In-app notifications, types | ✅ |
| `cv_unlocks` | Paywall for CV viewing | ✅ |

### Views
- `public_jobs_view` — Secure view with confidentiality logic + Arabic entity type

### Functions/RPCs (8)
| Function | Purpose |
|----------|---------|
| `upsert_private_candidate` | Guest user CV submission (with auth_user_id) |
| `get_or_create_private_job` | Hidden job for landing page tracking |
| `increment_landing_page_views` | Atomic view counter |
| `increment_candidate_views` | Profile view counter |
| `increment_job_views` | Job view counter |
| `calculate_match_score` | Skill-based matching (% score) |
| `save_interview_result` | Bypass RLS for candidate interview saves |
| `get_user_company` | Returns company for user (owner OR member) |
| `create_notification` | Insert notification via SECURITY DEFINER |
| `update_updated_at_column` | Auto-timestamp trigger |
| `update_unread_counts` | Messaging unread counter trigger |
| `update_job_applicants_count` | Auto-count applications per job |

### Indexes (20+)
All critical columns indexed: job status, company, applications, candidates, search vector, notifications (unread), contracts, emiratisation.

### RLS Policies
- **Infinite recursion fix applied** for `company_members` (non-self-referencing)
- All 20 tables have RLS enabled
- Emiratisation tables use EXISTS pattern for safety

---

## Deployment

| Component | Details |
|-----------|---------|
| **Hosting** | aaPanel VPS (178.18.254.38) |
| **Domain** | `jobs-test.uae4jobs.ae` |
| **Process** | PM2 (`growthnexus`) |
| **SSL** | Let's Encrypt |
| **CI/CD** | `deploy.sh` (git pull → build → restart) |
| **Cron** | vercel.json: contract expiry daily 06:00 UTC |
| **n8n** | `n8n.asra3.com` (Coolify-managed) |
| **Email** | Not configured yet — needs Resend/SendGrid |
| **Monitoring** | Not configured yet — needs Sentry |

---

## Deployment Checklist (Pre-Launch)

- [ ] Production Supabase project configured
- [ ] All `full.sql` queries confirmed applied
- [ ] Stripe live keys configured (not test mode)
- [ ] n8n instance deployed with all webhook URLs in `.env`
- [ ] All environment variables set (see PROGRESS.md for full list)
- [ ] Domain + SSL configured
- [ ] Email service configured (Resend/SendGrid)
- [ ] Monitoring configured (Sentry, LogRocket)
- [ ] Backup strategy for Supabase
- [ ] CDN configuration for static assets
- [ ] CRON_SECRET set in Vercel
- [ ] N8N_WEBHOOK_SECRET changed from default

---

## 📊 Priority Matrix

|  | High Impact | Low Impact |
|---|---|---|
| **Low Effort** | 10.1 Emiratisation seeding, 10.5 Security | 12.2 SEO basics |
| **High Effort** | 10.3 Company Verification, 10.4 n8n wiring | 11.x B2C Services |

**Recommended execution order:**
1. ~~10.3a (Verification enforcement)~~ ✅ Done (12 May)
2. 10.1 (Emiratisation seeding) — unblocks compliance
3. 10.4 (Contract notify n8n publish) — blueprint already ready
4. 10.5 (Security hardening) — production requirement
5. 10.6 (AI enhancement / mock replacement) — quality improvement
6. 10.7 (Stripe production) — monetization
7. 10.3b (Company verification OCR) — trust & compliance
8. 12.x (i18n + SEO + testing) — launch polish
9. 11.x (B2C services) — revenue expansion

---

## ⚠️ Key Risks

| Risk | Mitigation |
|------|------------|
| n8n instance not available | All endpoints have mock fallbacks — ship with mocks, activate later |
| Stripe webhook security | Implement signature verification before going live |
| Arabic RTL edge cases | Test all components with long Arabic text strings |
| Supabase RLS bypass | Audit all RPC functions and service role usage |
| No email provider | Integrate Resend or SendGrid before launch |
| Contract notify not on n8n | Import blueprint JSON and activate — code already done |
| CRON_SECRET not set | Anyone can call `/api/cron/contract-expiry` — set in Vercel dashboard |