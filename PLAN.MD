# 📋 GrowthNexus — Master Plan

> **Last Updated:** 11 May 2026
> **Current Phase: 10 (Verification, i18n & Launch)**
> **Completed: 9 of 10 phases**

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
- Auth (Supabase), RLS, Login/Register
- Employer core: Dashboard, settings, job wizard
- Public job board: Homepage, search, SEO, apply
- Candidate: CV upload + AI parse, applications, profile

### Phase 5: ATS Pipeline & UAE Enhancements
- UAE cities dropdown, nationality multi-select, skills tags
- Job management: pause/resume/duplicate/share, filters
- Pipeline: offer → hired flow, rejection reasons, confirmation modals
- Analytics dashboard + Emiratisation tracker

### Phase 6: Admin Panel
- KPI dashboard, user/company/job management
- System config CRUD, transactions viewer

### Phase 7: n8n Guides & AI APIs
- 11 workflow guides, webhook contracts
- AI job description generator with mock fallback

### Phase 8: Stripe + Interview AI + Committee
- Stripe SaaS billing (checkout + portal + webhook)
- Interview AI (5 questions + AI evaluation + score)
- Committee evaluation (multi-evaluator + outlier detection)

### Phase 9: Contract & Compliance (Latest)
- Contract generation with n8n notification events
- Employer tracking dashboard + PDF download
- **Candidate contract portal** (list + view/sign/decline)
- **PDF generation API** (Arabic font support)
- **Auto-expiry cron** via vercel.json (daily 06:00 UTC)
- **N8N workflow blueprint** for 4-part email automation
- Emiratisation module (profile form, dashboard, gauges, export)

---

## 🔧 Phase 10: Verification, i18n & Launch (CURRENT)

### 10.1 Emiratisation Data Seeding ⚡ HIGH PRIORITY
> **Blocker:** `emiratisation_profiles` table is empty → compliance export returns 404

**Tasks:**
- [ ] Integrate `EmiratisationProfileForm.tsx` into dashboard flow
- [ ] Allow employers to enter workforce composition data
- [ ] Verify PDF export generates correctly with profile data
- [ ] Test compliance alerts and MOHRE target tracking

### 10.2 Forecasting Engine
> **Status:** Widget exists with mock data

**Tasks:**
- [ ] Connect `ForecastingWidget.tsx` to live database metrics
- [ ] Build AI predictions: time-to-fill, offer acceptance, hiring difficulty
- [ ] Optional: n8n workflow for historical trend analysis

### 10.3 Company Verification Flow (Trust Score)
> **Status:** Not started — medium priority

**Tasks:**
- [ ] Trade license upload UI for employers with generic emails
- [ ] Build `gn-company-verify` n8n workflow: OCR → registry matching → trust score
- [ ] 5-layer verification: upload → OCR → registry check → classification → decision
- [ ] UAE registry sources: NER, Invest in Dubai, TAMM, free zone registrars

### 10.4 Remaining N8N Workflows
| # | Workflow | Priority | Description |
|---|---------|----------|-------------|
| 7 | Smart Matching | 🟡 Medium | AI ranks best candidates from talent pool |
| 6 | App Notification | 🟢 Low | Add email/Telegram node to existing workflow |
| 8 | Message Notification | 🟢 Low | Chat message notifications |
| 9 | Payment Verification | 🟡 Medium | Stripe webhook fulfillment |

### 10.5 Security Hardening
- [ ] Change `N8N_WEBHOOK_SECRET` from default value
- [ ] Verify all API routes have proper auth checks
- [ ] Run 2 pending SQL migrations (team members + notifications)
- [ ] Set `CRON_SECRET` for contract expiry endpoint

### 10.6 i18n & SEO
- [ ] Full RTL support and Arabic/English toggling
- [ ] Dynamic meta tags, sitemaps, OG images
- [ ] Structured data for job postings (Google for Jobs)

---

## Future Phases

### Phase 11: B2C Candidate Services
Based on the business strategy doc (منصة التوظيف), launch in order:

**Phase 11.1 — Starter Pack:**
- CV Analyzer (25 AED one-time)
- CV Builder (39 AED one-time)
- Interview AI for candidates (39 AED/month)

**Phase 11.2 — Growth Pack:**
- Rejection Analyzer (29 AED)
- Career Path Generator (29 AED/month)
- Skill Gap Analyzer (25 AED)
- Smart Job Alert (19 AED/month)

**Phase 11.3 — Pro Pack:**
- Auto Apply (49–149 AED/month)
- Voice Interview Analysis (in Pro tier)
- Portfolio Builder (59 AED)

### Phase 12: Enterprise Features
- White-label career portal (setup: 3K–10K + 999–2,999/month)
- API/ATS integration
- Multi-department workflows
- Custom approval chains

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
6. **Match score percentage** (AI-calculated)

UI requirements noted:
- Prices hidden until service selection or checkout
- AI-suggested job titles and descriptions
- Skills field in job posting
- Job edit capability for employers
- Company name display logic (hidden → show "Private/Government")
- Application deadline clearly visible
- Cities as dropdown list (12 UAE cities)
- Nationality as multi-select
- AED currency throughout
- Job Boost/Promote feature
- Pause/Resume job toggle
- Share/Duplicate job buttons
- Filter: Active/Closed/Draft + Sort options
- Notification badge for new applicants
- Offer/Hired status in pipeline
- Rejection confirmation popup with reason

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