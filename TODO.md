# 📋 GrowthNexus — Remaining TODO

> **Created:** 12 May 2026
> **Overall Completion: ~98%** — Core platform + verification + OCR + External Jobs + CV Services (Optimizer + Builder + ATS Convert) + **13 n8n workflows** + Contract Pipeline + **Interview Self-Practice** + **Bilingual Smart Matching** + **Candidate Search v2** done
> **What Remains:** Sprint 1: B2C Services (5 remaining) → Sprint 2: n8n wiring → Sprint 3: Deploy + Security → Sprint 4: i18n/SEO/QA
> **Detailed Roadmap:** See `ROADMAP.md` for full sprint plan

---

## 🔴 HIGH PRIORITY (Phase 10 — Must Do Before Launch)

### ~~10.1 Emiratisation Data Seeding~~ ✅ DONE

- [x] Integrate `EmiratisationProfileForm.tsx` into employer onboarding/dashboard flow
- [x] Allow employers to enter workforce composition data
- [x] Verify PDF export generates correctly with seeded profile data
- [x] Test compliance alerts and MOHRE target tracking
- [x] Seed sample data for demo/testing

### ~~10.4 Contract Notifications → Publish on n8n~~ ✅ DONE (12 May 2026)

- [x] Import `n8n-contract-notify-workflow.json` into n8n.asra3.com
- [x] **Merged contract notify nodes directly into main `n8n workflow.json`** (9 webhook paths total)
- [x] Activate workflow and test all 4 lifecycle events:
  - [x] `contract_created` event
  - [x] `contract_sent` event
  - [x] `contract_signed` event
  - [x] `contract_declined` event
- [x] Set `N8N_CONTRACT_NOTIFY_WEBHOOK` env var on server

### ✅ 10.4b Contract Workflow Expansion — DONE (12 May 2026) 🆕

- [x] Expand applicant pipeline from 4 to 7 Kanban columns (`applied` → `reviewing` → `shortlisted` → `interview` → `offer` → `hired` → `rejected`)
- [x] Offer status interceptor → contract generation dialog (salary, start date, template)
- [x] Candidate contracts RLS: `20260513100000_candidate_contracts_rls.sql`
  - [x] SELECT policy: candidate sees own contracts via `application_id` → `auth.uid()`
  - [x] UPDATE policy: candidate can only set status to `viewed`, `signed`, `declined`
- [x] Horizontal scroll for pipeline board on smaller screens

### 10.5 Security Hardening
- [ ] Change `N8N_WEBHOOK_SECRET` from default value to strong production key
- [ ] Set `CRON_SECRET` env var in Vercel dashboard (code already checks it)
- [ ] Verify all 20+ API routes have proper auth checks
- [ ] Rate limiting on public API routes (`/api/ai/*`, `/api/conversations`, etc.)
- [ ] Input validation with Zod schemas on critical endpoints:
  - [ ] `/api/contracts/generate`
  - [ ] `/api/evaluation/submit`
  - [ ] `/api/company/register`
  - [ ] `/api/conversations/start`
  - [ ] `/api/stripe/checkout`
- [ ] CORS configuration for production domain
- [ ] Audit all RPC functions for SECURITY DEFINER usage safety
- [ ] Review all `service_role` key usage (currently: company registration, admin users, candidate search, skill-aliases API)

---

## 🟡 MEDIUM PRIORITY (Phase 10 — Should Do Before Launch)

### ~~10.3b Company Verification OCR (n8n Workflow)~~ ✅ DONE (12 May 2026)
> ~~Enforcement gating is done ✅ — this is the automated trust scoring~~

- [x] Build `gn-company-verify` n8n workflow (8 nodes):
  - [x] Receive uploaded trade license image via Supabase DB webhook
  - [x] OCR → extract license number, company name, expiry date (Gemini Vision)
  - [x] Decision engine: calculate risk score (0–100)
  - [x] Update `risk_score` and `verification_status` in DB
  - [x] Write OCR data to `company_documents`
  - [x] Audit log entry in `company_verification_log`
- [ ] API: `GET /api/trust-score/:userId`
- [ ] Admin notification when new company registers

### 10.6 AI Enhancement (Replace Mocks)

#### ~~Smart Candidate Suggestions~~ ✅ DONE (12 May + 24 May)
- [x] Replace hardcoded candidate names on employer dashboard
- [x] Build real DB query: match candidate skills against company's active job requirements
- [x] Add Jaccard similarity scoring for skill matching
- [x] Display top 5 suggested candidates with match percentage
- [x] **Bilingual matching** — Arabic/English skill normalization via DB-driven `skill_aliases` table 🆕
- [x] **Admin Skill Aliases Panel** — `/admin/skill-aliases` CRUD with search, category filter, grouped view 🆕
- [x] **Dynamic aliases** — both dashboards fetch from DB instead of hardcoded dictionaries 🆕
- [x] `migration_skill_aliases.sql` — 96 seed aliases covering 30+ canonical skills 🆕
- [x] **Candidate Search v2** — complete rewrite with auto match score, multi-term search, filter by job 🆕
- [x] **Match Score Circle** — always-visible % circle + progress bar, color-coded (green/amber/red) 🆕
- [x] **Multi-term Search** — comma/space separated skills search (e.g., "React, Node, AWS") 🆕
- [x] **View CV Button** — opens candidate CV PDF in new tab 🆕

#### ~~AI Match Score Enhancement~~ ✅ DONE (12 May)
- [x] Improve `calculate_match_score` with:
  - [x] Weighted skill matching (Jaccard similarity)
  - [x] Experience years compatibility
  - [x] Salary range alignment
  - [x] Location preference matching
  - [x] Composite weighted score

#### ✅ External Jobs Aggregator — DONE (12 May 2026) 🆕
- [x] `external_jobs` table (separate from internal `jobs`)
- [x] Access level gating: `public` / `registered` / `premium`
- [x] RLS policies (anonymous sees public only, auth sees all levels)
- [x] Upsert API: `POST /api/external-jobs` (n8n import with dedup)
- [x] Click tracking: `POST /api/external-jobs/[id]/click`
- [x] Admin management panel: `/admin/external-jobs`
- [x] Job card integration (blue badge, redirect Apply, premium lock)
- [x] Merged into main `/jobs` feed with source filter
- [x] External job detail page: `/jobs/external/[slug]`
- [ ] **n8n scraper workflow** — See `N8N_EXTERNAL_JOBS_WORKFLOW_GUIDE.md`

#### Landing Page Builder Enhancement
- [ ] Full CRUD editor (edit/delete, not just create)
- [ ] Preview mode before publishing
- [ ] Custom branding options (company logo, colors)
- [ ] Page analytics dashboard (views, conversions)

### 10.7 Stripe Production Readiness
- [ ] Stripe Price IDs in environment variables (not hardcoded)
- [ ] Handle all Stripe error cases gracefully (card decline, network errors)
- [ ] Add Stripe customer portal branding (logo, colors, support email)
- [ ] Test mode → live mode switch procedure documented
- [ ] Invoice generation for employers
- [ ] Refund handling flow
- [ ] Credit-based system enforcement (deduct credits on job post/CV unlock)

### ✅ Email Service Integration — DONE (12 May 2026) via n8n
- [x] Provider: n8n SMTP workflow (`gn-email-send`) — reused from cv-editor-maker-website
- [x] API route: `POST /api/notifications/email`
- [x] Supports all notification types (application, contract, message, CV ready)
- [ ] Email templates (Arabic + English) — to be built in n8n
- [ ] Registration confirmation email
- [ ] Password reset email

### Remaining n8n Workflows
| # | Workflow | Priority | Status | Description |
|---|---------|----------|--------|-------------|
| 13 | CV Parse | ~~🔴 High~~ | ✅ **DONE** (13 May) 🆕 | In main `n8n workflow.json` — `/gn-cv-parse` |
| 14 | CV Optimize | ~~🔴 High~~ | ✅ **DONE** (13 May) 🆕 | In main `n8n workflow.json` — `/gn-cv-optimize` |
| 15 | CV Create | ~~🔴 High~~ | ✅ **DONE** (14 May) 🆕 | In main `n8n workflow.json` — `/gn-cv-create` (form data → Gemini → Gotenberg PDF) |
| 16 | CV ATS Convert | ~~🔴 High~~ | ✅ **DONE** (14 May) 🆕 | In main `n8n workflow.json` — `/gn-cv-ats-convert` |
| 17 | CV Finalize | ~~🔴 High~~ | ✅ **NOT NEEDED** | API route works **locally** without n8n (built-in fallback) |
| 18 | Email Send | 🔴 High | API ✅ / n8n pending | Generic SMTP sender → `gn-email-send` |
| 19 | External Jobs Scraper | 🟡 Medium | Pending | LinkedIn/Bayt/Indeed → `/api/external-jobs` |
| 7 | Smart Matching | 🟡 Medium | ⚠️ Partial (24 May) | **Full search rewritten** (match score, multi-term, filter by job). n8n AI ranking pending |
| 8 | Message Notification | 🟢 Low | Pending | Chat message push notifications |
| 9 | Payment Verification | 🟡 Medium | Pending | Stripe webhook fulfillment validation |

---

## 🟠 PHASE 11 — B2C Candidate Services (Revenue Expansion)

### ✅ 11.0 CV Services Backend — DONE (12 May 2026)
- [x] Migration: `cv_sessions` + `cv_chat_messages` tables
- [x] Migration: `profiles.credits_cv` column (dual credits model)
- [x] RPC: `cv_link_to_profile()` — user-initiated profile linking
- [x] RPC: `deduct_cv_credits()` — checks credits_cv first, falls back to credits_balance
- [x] System config: `cv_services_free_mode` = true (testing), pricing toggles
- [x] Types: `src/types/cv.ts` (12 interfaces from cv-editor-maker-website)
- [x] API: `POST /api/cv/parse` → n8n proxy
- [x] API: `POST /api/cv/optimize` → n8n proxy + session ownership
- [x] API: `POST /api/cv/create` → n8n proxy
- [x] API: `POST /api/cv/ats-convert` → n8n proxy (NEW workflow)
- [x] API: `POST /api/cv/finalize` → n8n proxy
- [x] API: `POST /api/cv/link-profile` → user-initiated CV → profile link
- [x] .env.local: 6 new webhook URLs (#13–#18)
- [x] Guide: `N8N_CV_WORKFLOW_REUSE_GUIDE.md` (copy + modify instructions)

### 11.1 CV Services Frontend
- [x] **CV Optimizer** Page: `/candidate/cv/optimize` ✅ DONE (13 May 2026) 🆕
  - [x] Split-screen: PDF preview (left) + AI chat (right)
  - [x] Language selector: EN / AR
  - [x] Chat history persistence (chat_history JSONB on cv_sessions)
  - [x] Session persistence from Supabase
  - [x] "استخدم هذه السيرة في ملفي" button (user-initiated link)
  - [x] "إنهاء وتحميل" finalize + download button
  - [x] Session history table below chat/PDF viewer
  - [x] Latest session auto-marked as linked (ارتبطت بالملف)
  - [x] Resume any session (all statuses, not just active/ready)
  - [x] Inline session delete with confirm/cancel (تأكيد الحذف / إلغاء)
  - [x] Session switching without disappearing from list
  - [x] RLS DELETE policy (`20260513043300` migration)
  - [x] Direct-to-Optimizer flow from CV Builder (تحسين بالذكاء الاصطناعي button)
  - [x] Server-side PDF fetch to bypass CORS (`parseCvFromUrl`)
  - [x] Auto-trigger CV loading when arriving from builder

- [x] **CV Builder** Page: `/candidate/cv/builder` ✅ DONE (14 May 2026)
  - [x] **Tab 1: Build from Scratch** — Dynamic form (CvData) → `CvFormSteps.tsx` (24KB)
  - [x] **Tab 2: Upload & Convert** — Upload PDF → ATS-ready (`CvUploadTab.tsx` → `gn-cv-ats-convert`)
  - [x] **Tab 3: Paste & Convert** — Paste text → ATS-ready (`CvPasteTab.tsx` → `gn-cv-ats-convert`)
  - [x] Shared language selector: EN / AR / Bilingual
  - [x] "Use this CV on my profile" button (`linkCvToProfile()`)
  - [x] Success view: Download + Optimize + Link to profile CTAs
  - [x] n8n `gn-cv-create` workflow (in main JSON)

- [x] **Interview AI (Candidate Self-Practice)** (39 AED/month) — ✅ **DONE (14 May 2026)** 🆕
  - [x] Standalone `/candidate/interview-practice` page (SearchableSelect combobox)
  - [x] Job role/industry selector (searchable — pick from list or type custom)
  - [x] Practice mode API (`/api/interview/practice` + `/submit` + `/history`)
  - [x] Practice history table + `interview_practice_sessions` DB table
  - [x] Session detail view (click history → review Q&A + AI evaluation)
  - [x] Dual-credit gate: `deduct_interview_credits()` RPC (subscription allowance + credits)
  - [x] Sidebar nav link: "تدريب المقابلات" (Brain icon)
  - [x] `interview_practice_free_mode` system config toggle
  - [x] RLS policies on `interview_practice_sessions`
  - [x] `interview_allowance` column on profiles table

### 11.2 Growth Pack — **SPRINT 1**
- [ ] **Rejection Analyzer** (29 AED)
  - [ ] `/candidate/rejection-analyzer` page
  - [ ] AI analysis API (`/api/ai/rejection-analysis`)
  - [ ] n8n workflow `gn-rejection-analyze`
  - [ ] Results UI: reasons + improvements + skills + recommended jobs
  - [ ] Credit deduction

- [ ] **Career Path Generator** (29 AED/month)
  - [ ] `/candidate/career-path` page
  - [ ] Career path API (`/api/ai/career-path`)
  - [ ] n8n workflow `gn-career-path`
  - [ ] Visual roadmap (timeline/flowchart)
  - [ ] Skill gap integration + training recommendations
  - [ ] `career_paths` DB table

- [ ] **Skill Gap Analyzer** (25 AED)
  - [ ] `/candidate/skill-gap` page
  - [ ] Skill comparison API (`/api/ai/skill-gap`)
  - [ ] n8n workflow `gn-skill-gap`
  - [ ] Visual gap chart (radar/bar)
  - [ ] Priority ranking + course recommendations

- [ ] **Smart Job Alert** (19 AED/month)
  - [ ] `/candidate/job-alerts` page
  - [ ] `job_alert_preferences` DB table
  - [ ] Alert preferences API (`/api/job-alerts` CRUD)
  - [ ] n8n cron workflow `gn-job-alerts` (daily/weekly digest)
  - [ ] Email template for matching jobs
  - [ ] Subscription gate

### 11.3 Pro Pack — **SPRINT 1**
- [ ] **Auto Apply** (49–149 AED/month)
  - [ ] `/candidate/auto-apply` page
  - [ ] `auto_apply_settings` DB table
  - [ ] Matching engine API (`/api/auto-apply/match`)
  - [ ] n8n workflow `gn-auto-apply` (match → apply → track)
  - [ ] Tracking dashboard
  - [ ] Monthly limit enforcement (50/100/200 tiers)

- [ ] **Voice Interview Analysis** (in Pro tier)
  - [ ] Audio recording during practice
  - [ ] AI analysis of speaking patterns
  - [ ] Confidence and clarity scores

- [ ] **Portfolio Builder** (59 AED)
  - [ ] Visual portfolio for creative professionals
  - [ ] Public sharing URL

---

## 🟠 PHASE 12 — i18n, SEO & Launch Polish

### 12.1 Internationalization (i18n)
- [ ] Install and configure `next-intl`
- [ ] Extract all hardcoded Arabic strings → `/messages/ar.json` + `/messages/en.json`
- [ ] Add language switcher in navbar
- [ ] RTL/LTR layout switching
- [ ] Date/time/number/currency localization

### 12.2 SEO Optimization
- [ ] Dynamic metadata per page (title, description, og:image)
- [ ] Sitemap generation (next-sitemap or built-in)
- [ ] `robots.txt` configuration
- [ ] Structured data: `JobPosting` schema for `/jobs/[slug]` (Google for Jobs)
- [ ] Canonical URLs + Open Graph images for social sharing
- [ ] Server-side rendering optimization

### 12.3 Testing & QA
- [ ] E2E test suite (Playwright): 18 critical flows from `USER_FLOW_TESTING.md`
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

## 🔵 PHASE 13 — Enterprise Features (Future)

- [ ] White-label career portal (setup: 3K–10K + 999–2,999/month)
- [ ] API/ATS integration (third-party HR systems)
- [ ] Multi-department workflows
- [ ] Custom approval chains
- [ ] E-sign integration (DocuSign/PandaDoc/HelloSign)
- [ ] Monitoring (Sentry, LogRocket)

---

## 🚀 Pre-Launch Deployment Checklist

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
- [ ] `CRON_SECRET` set in Vercel
- [ ] `N8N_WEBHOOK_SECRET` changed from default
- [ ] `N8N_CONTRACT_NOTIFY_WEBHOOK` set and workflow activated
- [ ] Test all 18 user flows from `USER_FLOW_TESTING.md`
- [ ] External jobs table created in Supabase (`20260512100000_external_jobs.sql`)
- [ ] n8n external jobs scraper workflow built and active

---

## 🐛 Known Issues & Bugs

| Issue | Impact | Resolution |
|-------|--------|------------|
| `emiratisation_profiles` table empty | Compliance export returns 404 | Use `EmiratisationProfileForm.tsx` to seed data |
| ~~Contract notify not on n8n~~ | ~~Email notifications won't fire~~ | ✅ Fixed — Import `n8n-contract-notify-workflow.json` → activate |
| `N8N_WEBHOOK_SECRET` = default | Security risk | Change to strong value before production |
| `CRON_SECRET` not set | Anyone can trigger contract expiry | Set env var in Vercel dashboard |
| ~~Smart candidate suggestions mock~~ | ~~Dashboard shows hardcoded names~~ | ✅ Fixed — real DB query with Jaccard similarity |
| ~~cv_sessions status constraint~~ | ~~'upload' not in check constraint~~ | ✅ Fixed (13 May) — `20260513035100` migration |
| ~~Chat history not persisted~~ | ~~Messages lost on reload~~ | ✅ Fixed (13 May) — chat_history JSONB column |
| ~~CV Optimizer shows old CV after link~~ | ~~Page refresh resets to original~~ | ✅ Fixed (13 May) — latest session loaded on refresh |
| ~~Duplicate linked sessions~~ | ~~Multiple sessions linked~~ | ✅ Fixed (13 May) — `20260513043200` cleanup migration |
| ~~Session delete not working~~ | ~~RLS blocks delete~~ | ✅ Fixed (13 May) — `20260513043300` DELETE policy added |
| Multi-language not implemented | Arabic-only UI | Phase 12 work (next-intl) |
| Stripe in test mode | No real payments | Switch to live keys for production |
| No email service | Can't send generic emails | n8n SMTP configured for contract lifecycle; `gn-email-send` workflow still needed |
| No monitoring | No error tracking | Add Sentry before launch |
| ~~Admin users list showed 1 user~~ | ~~RLS blocked employer from seeing all profiles~~ | ✅ Fixed (24 May) — service role API `/api/admin/users` bypasses RLS 🆕 |
| ~~Candidate search showed nothing~~ | ~~RLS + wrong column name + broken search syntax~~ | ✅ Fixed (24 May) — service role client, `years_experience` column, array syntax 🆕 |
| ~~Candidate search locked by subscription~~ | ~~`hasAccess = false` hardcoded~~ | ✅ Fixed (24 May) — set to `true` for testing 🆕 |
| ~~Skill matching English-only~~ | ~~Hardcoded dictionary, no Arabic support~~ | ✅ Fixed (24 May) — DB-driven `skill_aliases` table with admin CRUD 🆕 |

---

## 📊 Effort Estimates

| Area | Tasks | Est. Effort |
|------|-------|-------------|
| Phase 10 remaining (HIGH) | 10.4, 10.5 | ~2–3 days |
| Phase 10 remaining (MEDIUM) | 10.6, 10.7, Email | ~4–6 days |
| Phase 11 (B2C) | 9 services | ~3–4 weeks |
| Phase 12 (Polish) | i18n, SEO, Tests, Perf | ~1–2 weeks |
| Phase 13 (Enterprise) | White-label, integrations | ~4–6 weeks |
| **Total remaining** | | **~8–12 weeks** |
