# 🗺️ GrowthNexus — Production Roadmap

> **Created:** 14 May 2026
> **Last Updated:** 14 May 2026 — 01:24 AM
> **Current Status:** ~98% complete — all core platform + 13 n8n workflows + Interview Self-Practice done
> **Source of Truth:** `PLAN.MD` + `TODO.md` + `webhooks_status.md`
> **Execution Strategy:** Build all B2C revenue features → Wire remaining n8n → Deploy → Polish

---

## 📊 Overall Completion Snapshot

| Area | Status | % |
|------|--------|---|
| Core Platform (Auth, Jobs, Applications, Messages) | ✅ Done | 100% |
| ATS Pipeline (7 Kanban columns, rejections, contracts) | ✅ Done | 100% |
| Admin Panel (Users, Companies, Jobs, Config, Transactions) | ✅ Done | 100% |
| n8n AI Workflows (13 webhook paths in single JSON) | ✅ Done | 100% |
| CV Services (Optimizer + Builder + ATS Convert) | ✅ Done | 100% |
| Company Verification (OCR + Enforcement Gating) | ✅ Done | 100% |
| Contract System (Generation + Tracking + Candidate Portal) | ✅ Done | 100% |
| External Jobs Aggregator (API + Admin + Feed) | ✅ Done (scraper pending) | 90% |
| Interview AI (Application-triggered) | ✅ Done | 100% |
| Analytics + Forecasting + Emiratisation | ✅ Done | 100% |
| **B2C Paid Services (Phase 11)** | 🔧 In Progress | ~17% (Interview Practice ✅) |
| **Security Hardening** | ❌ Not Started | 0% |
| **Production Deployment** | ❌ Not Started | 0% |
| **i18n + SEO + Testing (Phase 12)** | ❌ Not Started | 0% |

---

## 🔴 Sprint 1: B2C Candidate Services (Revenue Features)

> **Goal:** Build all paid B2C services that generate recurring revenue
> **Estimated Effort:** 5–8 days
> **Monthly Revenue Potential:** ~200+ AED per active candidate

---

### ~~1.1 Interview AI Self-Practice (39 AED/month)~~ ✅ DONE (14 May 2026)

> **Priority:** ✅ COMPLETE — Highest-priced recurring B2C service
> **Existing Assets:** Interview engine (questions API + evaluation API + n8n workflows) already working for employer-triggered flow

#### What Was Built
- ✅ `/api/interview/questions` — Generates 5 AI questions based on job title/type
- ✅ `/api/interview/submit` — AI evaluates answers, returns score + per-question feedback
- ✅ `/candidate/interview/[applicationId]/page.tsx` — Full interview wizard UI (224 lines)
- ✅ n8n `gn-interview-questions` + `gn-interview-eval` workflows
- ✅ `save_interview_result` RPC (SECURITY DEFINER)
- ✅ `/candidate/interview-practice` standalone page (SearchableSelect combobox UI)
- ✅ `/api/interview/practice` — Practice mode API (credit-gated)
- ✅ `/api/interview/practice/submit` — Evaluation + session save
- ✅ `/api/interview/practice/history` — User session history + credit balance
- ✅ `interview_practice_sessions` DB table + RLS policies
- ✅ `deduct_interview_credits()` RPC — dual-model (subscription + credits)
- ✅ Searchable combobox dropdowns (type to filter OR enter custom value)
- ✅ Session detail view — click history to review Q&A + AI feedback
- ✅ Sidebar nav link: "تدريب المقابلات"
- ✅ `system_config.interview_practice_free_mode` toggle for testing

---

### 1.2 Rejection Analyzer (29 AED one-time)

> **Priority:** 🔴 HIGH — Directly addresses candidate pain point
> **Revenue Model:** Per-analysis credit charge

#### What Needs Building

| Task | Type | Details |
|------|------|---------|
| `/candidate/rejection-analyzer` page | Frontend | Dashboard showing rejected applications + analysis CTA |
| Analysis API route | API | `/api/ai/rejection-analysis` → n8n or direct Gemini call |
| n8n workflow `gn-rejection-analyze` | n8n | Webhook → Load application + job + candidate data → Gemini analysis → Respond |
| Analysis result UI | Frontend | Cards: "Why rejected", "What to improve", "Skills to add", "Recommended jobs" |
| Credit deduction | Feature | 29 AED = 1 analysis credit |
| Store analysis results | DB | Save to `rejection_analyses` table or JSONB on `applications` |

#### Gemini Prompt Strategy
```
Input: { candidate_skills, job_requirements, rejection_reason, interview_score, match_score }
Output: {
  likely_reasons: string[],          // Why they were rejected
  improvement_areas: string[],       // What to work on
  missing_skills: string[],          // Skills gap
  recommended_actions: string[],     // Concrete next steps
  similar_jobs_strategy: string      // How to approach similar jobs
}
```

---

### 1.3 Career Path Generator (29 AED/month)

> **Priority:** 🟡 MEDIUM — Recurring revenue, high perceived value
> **Revenue Model:** Monthly subscription

#### What Needs Building

| Task | Type | Details |
|------|------|---------|
| `/candidate/career-path` page | Frontend | Input form + AI-generated career roadmap visualization |
| Career path API | API | `/api/ai/career-path` → Gemini generates trajectory |
| n8n workflow `gn-career-path` | n8n | Webhook → Load profile → Gemini career analysis → Respond |
| Roadmap visualization | UI | Timeline/flowchart showing: Current Role → Next Steps → 5-Year Goal |
| Skill gap integration | Feature | Show which skills are needed for each career step |
| Training recommendations | Feature | Link to courses/certifications per skill gap |
| Save/update career plan | DB | `career_paths` table (user_id, current_role, target_role, roadmap JSONB, created_at) |
| Monthly refresh | Feature | Subscription allows monthly plan updates |

#### User Flow
```
Candidate → /candidate/career-path
  → Input: Current skills, experience, job title, career goals
  → Subscription/credit check (29 AED/month)
  → AI generates: Growth trajectory + skill gaps + training plan
  → Visual roadmap: Current → Step 1 → Step 2 → Target Role
  → Each step shows: required skills, recommended certifications, estimated timeline
  → Save to profile for future reference
```

---

### 1.4 Skill Gap Analyzer (25 AED one-time)

> **Priority:** 🟡 MEDIUM — Complements Career Path Generator
> **Revenue Model:** Per-analysis credit charge

#### What Needs Building

| Task | Type | Details |
|------|------|---------|
| `/candidate/skill-gap` page | Frontend | Compare skills vs target job requirements |
| Skill comparison API | API | `/api/ai/skill-gap` → Gemini analysis |
| n8n workflow `gn-skill-gap` | n8n | Webhook → Load candidate skills + target job → Gemini compare → Respond |
| Visual gap chart | UI | Radar/bar chart showing current vs required skill levels |
| Priority ranking | Feature | AI ranks which skills to develop first (by impact on employability) |
| Course recommendations | Feature | Suggest Udemy/Coursera/LinkedIn Learning for each gap |

#### User Flow
```
Candidate → /candidate/skill-gap
  → Select target job from existing jobs OR enter custom job title
  → Credit check (25 AED)
  → AI compares: candidate.skills[] vs job.skills_required[]
  → Results: Gap chart + priority list + course recommendations
  → Save analysis
```

---

### 1.5 Smart Job Alert (19 AED/month)

> **Priority:** 🟡 MEDIUM — Low-effort recurring revenue
> **Revenue Model:** Monthly subscription
> **Dependencies:** n8n cron workflow + email service

#### What Needs Building

| Task | Type | Details |
|------|------|---------|
| `/candidate/job-alerts` page | Frontend | Configure alert criteria (skills, location, salary range, job type) |
| Alert preferences DB | Migration | `job_alert_preferences` table (user_id, skills[], locations[], salary_min/max, frequency, active) |
| Alert preferences API | API | `/api/job-alerts` CRUD |
| n8n cron workflow `gn-job-alerts` | n8n | Daily/weekly: Query new jobs → Match against preferences → Send email digest |
| Email template | n8n | "New matching jobs" email with job cards |
| Subscription gate | Feature | Only active subscribers get alerts |
| Alert history | UI | Show past alerts sent |

#### n8n Workflow
```
Schedule Trigger (daily 08:00 UTC)
  → Query all active subscribers from job_alert_preferences
  → For each subscriber:
    → Query new jobs matching their criteria (posted in last 24h/7d)
    → If matches found: Send email digest via SMTP
    → Log alert sent
```

---

### 1.6 Auto Apply (49–149 AED/month)

> **Priority:** 🟠 LOWER — Complex, high-effort feature
> **Revenue Model:** Tiered monthly subscription (50/100/200 apps per month)

#### What Needs Building

| Task | Type | Details |
|------|------|---------|
| `/candidate/auto-apply` page | Frontend | Settings + tracking dashboard |
| Auto-apply preferences | DB | `auto_apply_settings` table (criteria, monthly_limit, applied_count, active) |
| Matching engine | API | `/api/auto-apply/match` → Find suitable jobs |
| Auto-submit workflow | n8n | `gn-auto-apply` — Match → Apply → Track |
| Application tracking | UI | Dashboard showing auto-applied jobs + status |
| Monthly limit enforcement | Feature | Reset counter on billing cycle |
| Opt-out per job | Feature | Candidate can exclude specific companies/jobs |

#### Tiers
| Tier | Price | Applications/Month |
|------|-------|-------------------|
| Basic | 49 AED | 50 |
| Standard | 99 AED | 100 |
| Premium | 149 AED | 200 |

---

## 🟡 Sprint 2: n8n Infrastructure Completion

> **Goal:** Wire remaining n8n workflows
> **Estimated Effort:** 1–2 days

---

### 2.1 External Jobs Scraper Workflow

| Task | Details |
|------|---------|
| Build n8n scraper | Schedule → Scrape LinkedIn/Bayt/Indeed → Transform → POST `/api/external-jobs` |
| Source sites | LinkedIn Jobs (via RSS/API), Bayt.com, Indeed UAE |
| Dedup logic | `UNIQUE(source_platform, external_id)` prevents duplicates |
| Schedule | Every 6 hours |
| Guide | `N8N_EXTERNAL_JOBS_WORKFLOW_GUIDE.md` has full build instructions |

### 2.2 Email Send Workflow

| Task | Details |
|------|---------|
| Build `gn-email-send` | Webhook → SMTP Node → Send email |
| Use case | Generic email sender for: welcome, alerts, notifications, marketing |
| API route | `/api/notifications/email` already exists |
| SMTP config | Use n8n's built-in SMTP node (already configured for contract emails) |

---

## 🔴 Sprint 3: Production Deployment & Security

> **Goal:** Go live on VPS with hardened security
> **Estimated Effort:** 1–2 days

---

### 3.1 VPS Deployment

| Task | Command/Action |
|------|----------------|
| SSH into VPS | `ssh root@178.18.254.38` |
| Pull latest code | `cd /www/wwwroot/jobs-test.uae4jobs.ae && git pull` |
| Install dependencies | `npm install` |
| Production build | `NODE_OPTIONS="--max-old-space-size=2048" npm run build` |
| Restart PM2 | `pm2 restart growthnexus` |
| Verify | `curl https://jobs-test.uae4jobs.ae` |

### 3.2 n8n Workflow Activation

| Task | Action |
|------|--------|
| Import workflow | Upload `n8n workflow.json` to `n8n.asra3.com` |
| Activate all webhooks | Toggle all 13 webhook paths to active |
| Verify webhook URLs | Test each URL returns 200 |
| Update `.env` on VPS | Set all `N8N_*_WEBHOOK` env vars to `n8n.asra3.com` URLs |

### 3.3 Security Hardening

| Task | Priority | Action |
|------|----------|--------|
| `N8N_WEBHOOK_SECRET` | 🔴 CRITICAL | Change from `gn-secret-2024` to strong random string (32+ chars) |
| `CRON_SECRET` | 🔴 CRITICAL | Set in VPS env vars — protects `/api/cron/contract-expiry` |
| Zod validation | 🟡 HIGH | Add input schemas on: `/api/cv/*`, `/api/interview/*`, `/api/external-jobs` |
| Rate limiting | 🟡 HIGH | Add `next-rate-limit` or custom middleware on public API routes |
| CORS | 🟡 MEDIUM | Lock down to `jobs-test.uae4jobs.ae` + `n8n.asra3.com` |
| Auth audit | 🟡 MEDIUM | Verify all API routes check `getUser()` |

### 3.4 Stripe Production

| Task | Action |
|------|--------|
| Switch to live keys | Replace `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` |
| Create live products | Create 3 price IDs (Starter, Growth, Pro) in Stripe Dashboard |
| Webhook endpoint | Register `https://jobs-test.uae4jobs.ae/api/stripe/webhook` |
| Test payment flow | Complete one real payment cycle |
| Invoice setup | Enable Stripe invoicing for employers |

---

## 🟢 Sprint 4: Polish & Launch

> **Goal:** i18n, SEO, and quality assurance
> **Estimated Effort:** 3–5 days

---

### 4.1 Internationalization (i18n)

| Task | Details |
|------|---------|
| Install `next-intl` | Package + Next.js middleware configuration |
| Extract Arabic strings | Create `/messages/ar.json` from all hardcoded strings |
| Create English file | `/messages/en.json` — translate all Arabic strings |
| Language switcher | Navbar dropdown (🇦🇪 العربية / 🇬🇧 English) |
| RTL/LTR switching | CSS `dir="rtl"` ↔ `dir="ltr"` |
| Date/number localization | Format dates, numbers, currency per locale |

### 4.2 SEO Optimization

| Task | Details |
|------|---------|
| Dynamic metadata | `generateMetadata()` on all pages |
| Sitemap | `next-sitemap` or built-in `/sitemap.xml` |
| robots.txt | Allow search engines |
| Structured data | `JobPosting` schema on `/jobs/[slug]` (Google for Jobs) |
| Open Graph | OG images for social sharing |

### 4.3 Testing & QA

| Task | Details |
|------|---------|
| E2E tests | Playwright: 11 critical scenarios from `CRITICAL_TESTS.md` |
| API tests | All 20+ API endpoints |
| RLS audit | Verify all Supabase policies |
| Load testing | n8n webhook endpoints under stress |
| Lighthouse | Target 90+ all categories |

---

## 📅 Timeline Estimate

| Sprint | Focus | Duration | Target |
|--------|-------|----------|--------|
| **Sprint 1** | B2C Services (6 features) | 5–8 days | Revenue generation |
| **Sprint 2** | n8n Workflows (2 remaining) | 1–2 days | Infrastructure |
| **Sprint 3** | Deploy + Security + Stripe | 1–2 days | Go live |
| **Sprint 4** | i18n + SEO + Testing | 3–5 days | Quality assurance |
| **Total** | | **10–17 days** | **Full production launch** |

---

## 💰 Revenue Projection (B2C Services)

| Service | Price | Model | Monthly Revenue (100 users) |
|---------|-------|-------|----------------------------|
| Interview Practice | 39 AED/mo | Subscription | 3,900 AED |
| Rejection Analyzer | 29 AED | One-time | 2,900 AED |
| Career Path | 29 AED/mo | Subscription | 2,900 AED |
| Skill Gap | 25 AED | One-time | 2,500 AED |
| Job Alerts | 19 AED/mo | Subscription | 1,900 AED |
| Auto Apply | 99 AED/mo (avg) | Subscription | 9,900 AED |
| **Total** | | | **~24,100 AED/mo** |

> Plus B2B employer subscriptions: 349–2,999 AED/mo per company

---

## 🔗 Key Files Reference

| File | Purpose |
|------|---------|
| `PLAN.MD` | Master architecture plan |
| `TODO.md` | Detailed task checklist |
| `PROGRESS.md` | What's done, what's not |
| `webhooks_status.md` | n8n webhook mapping |
| `USER_FLOW_TESTING.md` | Manual test guide |
| `n8n workflow.json` | All 13 n8n workflows (136 nodes) |
| `N8N_EXTERNAL_JOBS_WORKFLOW_GUIDE.md` | Scraper build guide |
| `N8N_CV_WORKFLOW_REUSE_GUIDE.md` | CV workflow reuse guide |
| `DEPLOYMENT_GUIDE.md` | VPS deployment steps |
