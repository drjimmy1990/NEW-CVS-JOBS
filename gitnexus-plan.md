Based on thorough codebase analysis across 149 files, here is the **detailed completion plan** for GrowthNexus.

---

# 📋 GrowthNexus — Detailed Completion Plan

---

## 🔴 PHASE 1: CRITICAL — Missing Core Pages (Week 1-2)

These pages have API routes ready but **no UI exists yet**.

### 1.1 Committee Evaluation Page
**File needed:** `src/app/employer/evaluate/[id]/page.tsx`
**Status:** ❌ File does NOT exist (confirmed via grep)
**API ready:** `POST /api/evaluation/submit` ✅

```
What to build:
├── 5-criteria slider panel (Technical, Communication, Experience, Cultural Fit, Overall)
├── Notes textarea per criterion
├── Submit button → POST /api/evaluation/submit
├── Auto-aggregation display when ≥2 evaluators submit
├── Outlier detection visual indicator
└── Back button to return to applicant pipeline
```

**Effort:** 1-2 days

### 1.2 AI Interview Page
**File needed:** `src/app/candidate/interview/[id]/page.tsx`
**Status:** ❌ File does NOT exist (confirmed via grep)
**APIs ready:** `/api/interview/questions` ✅, `/api/interview/submit` ✅

```
What to build:
├── Step 1: Instructions panel (explain format, timer)
├── Step 2: Question display (one at a time, fetched from API)
├── Step 3: Answer input (textarea with timer)
├── Step 4: Review all answers before submission
├── Step 5: Submit → POST /api/interview/submit
├── Result display: overall score + per-question feedback
├── Progress bar (question X of Y)
└── Arabic RTL layout
```

**Effort:** 2-3 days

### 1.3 Admin Panel Pages
**Status:** ❌ No admin UI pages exist. Only API routes exist.

```
Pages needed:
├── src/app/admin/dashboard/page.tsx          → Platform KPIs
├── src/app/admin/users/page.tsx              → User management (search, role filter, inline edit)
├── src/app/admin/companies/page.tsx          → Verify/reject companies
├── src/app/admin/jobs/page.tsx               → Job moderation (force-close, feature)
├── src/app/admin/transactions/page.tsx       → Payment tracking
└── src/app/admin/config/page.tsx             → System config CRUD
```

**Effort:** 3-4 days (can reuse employer dashboard patterns)

### 1.4 Landing Pages
**Status:** ❌ Minimal UI. DB migration exists (`20260224233000_landing_page_rpcs.sql`)

```
Pages needed:
├── src/app/employer/landing-pages/page.tsx          → List all landing pages
├── src/app/employer/landing-pages/new/page.tsx       → Create/edit landing page
└── src/app/landing-pages/[slug]/page.tsx             → Public-facing SEO page
```

**Effort:** 2-3 days

---

## 🟠 PHASE 2: HIGH PRIORITY — n8n Integration (Week 2-3)

All 11 n8n workflows are documented but **running in mock/fallback mode**.

### 2.1 Environment Variables Needed
```env
# Add to .env
N8N_BASE_URL=https://your-n8n-instance.com
N8N_WEBHOOK_SECRET=your-strong-secret
N8N_AI_JOB_DESC_WEBHOOK=https://your-n8n.com/webhook/gn-ai-job-desc
N8N_MATCH_SCORE_WEBHOOK=https://your-n8n.com/webhook/gn-match-score
N8N_INTERVIEW_QUESTIONS_WEBHOOK=https://your-n8n.com/webhook/gn-interview-questions
N8N_INTERVIEW_EVAL_WEBHOOK=https://your-n8n.com/webhook/gn-interview-eval
N8N_COMMITTEE_SUMMARY_WEBHOOK=https://your-n8n.com/webhook/gn-committee-summary
N8N_APPLICATION_NOTIFY_WEBHOOK=https://your-n8n.com/webhook/gn-app-notify
N8N_CONTRACT_GEN_WEBHOOK=https://your-n8n.com/webhook/gn-contract-gen
N8N_CV_PARSER_WEBHOOK=https://your-n8n.com/webhook/gn-cv-parser
N8N_COMPANY_VERIFY_WEBHOOK=https://your-n8n.com/webhook/gn-company-verify
```

### 2.2 Workflow Connection Checklist

| # | Workflow | Endpoint | Current State | Action |
|---|----------|----------|---------------|--------|
| 1 | CV Parser | `/api/candidate/cv` triggers webhook | Mock fallback | Deploy n8n workflow, set env var |
| 2 | Match Score | `/api/ai/match-score` | Calls webhook but needs live URL | Deploy + configure |
| 3 | App Notification | `/api/notifications/application-notify` | Has webhook call | Deploy + configure |
| 4 | Smart Matching | Same as #2 | — | — |
| 5 | Message Notification | No endpoint yet | ❌ Not built | Build webhook trigger |
| 6 | Payment Verification | `/api/stripe/webhook` | Uses Stripe directly | Add n8n notification step |
| 7 | AI Job Description | `/api/ai/job-description` | Calls webhook | Deploy + configure |
| 8 | Company Verification | No endpoint | ❌ Not built | Build endpoint + connect |
| 9 | Interview AI Eval | `/api/interview/submit` | Calls webhook | Deploy + configure |
| 10 | Committee Summary | `/api/evaluation/submit` | Calls webhook | Deploy + configure |
| 11 | Contract Generation | `/api/contracts/generate` | Calls webhook | Deploy + configure |

### 2.3 Missing n8n Triggers (Need Building)

**Message Notification (Workflow 5):**
```
Trigger: New message in /api/conversations/start or message insert
Action: Send email/Telegram to the other participant
```

**Company Verification (Workflow 8):**
```
File needed: src/app/api/company/verify/route.ts (doesn't exist)
Trigger: Employer uploads trade license
Action: OCR extraction → verification → update company.verified_at
```

**Effort:** 1-2 weeks (including n8n instance setup)

---

## 🟡 PHASE 3: HIGH PRIORITY — Contract & Compliance (Week 3-4)

### 3.1 Contract Template Manager UI
```
File: src/app/employer/contracts/page.tsx (NEW)
├── List all contract templates
├── Create/edit template (HTML editor)
├── Preview template
├── Set as default
└── The DB table contract_templates exists, the UI does not
```

### 3.2 Contract Workflow UI
```
File: src/app/employer/jobs/[id]/contracts/page.tsx (NEW)
├── Generate contract for hired applicant
├── Select template
├── Fill: salary, start date, benefits
├── POST to /api/contracts/generate (exists ✅)
├── Track status: Draft → Sent → Viewed → Signed → Declined
└── Status field needs adding to DB (new migration)
```

### 3.3 E-Signature Integration
```
Options: DocuSign, PandaDoc, or HelloSign API
├── Embed signature widget in contract page
├── Webhook callback on signature completion
├── Update application status to 'hired' on signature
└── Store signed PDF in Supabase Storage
```

### 3.4 Trust Score System
```
New DB table: trust_scores
├── Score calculation based on:
│   ├── Verified documents (+20)
│   ├── Profile completion % (+15)
│   ├── Verified email/phone (+10)
│   ├── Past hire rate (+25)
│   └── Employer ratings (+30)
├── Display on candidate profile
├── Filter candidates by minimum trust score
└── API: GET /api/trust-score/:userId
```

**Effort:** 2-3 weeks

---

## 🔵 PHASE 4: MEDIUM PRIORITY — AI & Intelligence (Week 4-5)

### 4.1 Forecasting Engine
```
File: src/app/employer/analytics/page.tsx (EXISTS but static mock data)

Backend needed:
├── /api/analytics/forecasting/route.ts (NEW)
│   ├── Time-to-fill prediction (based on similar jobs)
│   ├── Offer acceptance probability
│   ├── Hiring difficulty score
│   └── Salary benchmarking
├── Connect to n8n Workflow for AI predictions
└── Store predictions in DB for caching

UI needed:
├── Replace static "14-21 days" with live AI predictions
├── Add prediction confidence indicator
├── Historical accuracy tracking
└── Comparison charts (your jobs vs market)
```

### 4.2 AI Match Score Enhancement
```
Current: /api/ai/match-score returns basic mock
Needs:
├── Real skill matching algorithm (Jaccard similarity on skills)
├── Experience level compatibility check
├── Location preference matching
├── Salary expectation alignment
├── Education match scoring
└── Weighted composite score with explanation
```

### 4.3 Smart Candidate Suggestions (Replace Mocks)
```
Current: employer/dashboard shows hardcoded "سارة ك." and "محمد أ."
Needs:
├── Query candidates table with filtering
├── Score each candidate against open jobs
├── Sort by match score descending
├── Paginate results
└── "Invite to Apply" button → creates application
```

### 4.4 Career Path Generator
```
File: src/app/candidate/career-path/page.tsx (NEW)
├── Input: current skills, experience, goals
├── AI analysis of growth trajectory
├── Suggested skill gaps to fill
├── Recommended job progression path
└── Training/course recommendations
```

**Effort:** 2-3 weeks

---

## 🟢 PHASE 5: MEDIUM PRIORITY — Candidate Services (Week 5-6)

### 5.1 CV Builder
```
File: src/app/candidate/cv/builder/page.tsx (NEW)
├── Template selection (3-5 professional templates)
├── Section editor: Personal Info, Summary, Experience, Education, Skills
├── Drag-and-drop reordering
├── Live preview
├── Export to PDF
├── Save/edit multiple CV versions
└── Auto-fill from parsed data (reverse of current flow)
```

### 5.2 CV Analyzer (Paid Service)
```
├── One-time payment via Stripe (separate from subscription)
├── Deep AI analysis of uploaded CV
├── ATS compatibility score
├── Keyword optimization suggestions
├── Formatting improvements
├── Industry-specific recommendations
└── Comparison against top-performing CVs
```

### 5.3 Job Alerts System
```
├── /api/job-alerts/subscribe (NEW endpoint)
├── Candidate selects: job type, location, skills, salary range
├── Daily/weekly digest email via n8n
├── Push notification for exact matches
└── Manage alerts page: src/app/candidate/job-alerts/page.tsx
```

### 5.4 Auto-Apply Service
```
Current: Just a UI card with "اشترك — 49 د.إ/شهر" button
Needs:
├── Backend automation (n8n workflow)
├── Matching algorithm to find suitable jobs
├── Auto-submit application with CV
├── Monthly limit (50 applications as stated)
├── Dashboard to track auto-applied jobs
└── Opt-out/manage auto-applied jobs
```

**Effort:** 2-3 weeks

---

## 🟣 PHASE 6: POLISH & LAUNCH READINESS (Week 6-7)

### 6.1 Internationalization (i18n)
```
├── Install next-intl
├── Extract all hardcoded Arabic strings
├── Create /messages/ar.json and /messages/en.json
├── Add language switcher in navbar
├── RTL/LTR layout switching
├── Date/time localization
└── Number/currency formatting
```

### 6.2 SEO Optimization
```
├── Dynamic metadata per page (title, description, og:image)
├── Sitemap generation (next-sitemap or built-in)
├── robots.txt
├── Structured data (JobPosting schema for /jobs/[slug])
├── Canonical URLs
├── Open Graph images for social sharing
└── Server-side rendering optimization
```

### 6.3 Stripe Production Readiness
```
├── Webhook signature verification (currently mocked)
├── Stripe Price IDs in environment variables
├── Handle all Stripe error cases
├── Add Stripe customer portal branding
├── Test mode → live mode switch
├── Invoice generation for employers
└── Refund handling
```

### 6.4 Performance & Security
```
├── Add rate limiting to all API routes
├── Implement CORS properly
├── Add input validation (Zod schemas)
├── Optimize Supabase queries with proper indexes
├── Add caching layer (Redis or in-memory)
├── Image optimization for company logos
└── Lighthouse audit + fixes
```

**Effort:** 1-2 weeks

---

## 🔵 PHASE 7: TESTING & DEPLOYMENT (Week 7-8)

### 7.1 End-to-End Tests (from CRITICAL_TESTS.md)

| # | Test Scenario | Priority |
|---|--------------|----------|
| 1 | Migration verification | 🔴 Critical |
| 2 | Team page appearance | 🔴 Critical |
| 3 | Invite — email NOT registered | 🔴 Critical |
| 4 | Invite — employer email (normal case) | 🔴 Critical |
| 5 | Invite — candidate email (warning case) | 🟡 High |
| 6 | Invite — duplicate email | 🔴 Critical |
| 7 | Remove member | 🔴 Critical |
| 8 | Cannot remove owner | 🔴 Critical |
| 9 | Re-invite removed member | 🟡 High |
| 10 | Role permissions (viewer restrictions) | 🔴 Critical |
| 11 | Existing employer pages regression | 🔴 Critical |

```
Recommended tools:
├── Playwright (E2E) — for user flows
├── Vitest/Jest (Unit) — for utility functions
└── Cypress (optional) — for complex UI interactions
```

### 7.2 Additional Tests Needed
```
├── Auth flow tests (login, register, role redirect)
├── Stripe checkout flow (mock Stripe API)
├── API route tests (all 12+ endpoints)
├── Component tests (critical UI components)
├── Database query tests (RLS policies)
└── Load testing for n8n webhook endpoints
```

### 7.3 Deployment Checklist
```
├── Production Supabase project configured
├── Stripe live keys configured
├── n8n instance deployed (self-hosted or cloud)
├── All environment variables set
├── Domain + SSL configured
├── Email service configured (Resend/SendGrid)
├── Monitoring (Sentry, LogRocket)
├── Backup strategy for Supabase
└── CDN configuration for static assets
```

**Effort:** 1-2 weeks

---

## 📊 Summary Timeline

```
Week 1-2   🔴 Phase 1: Missing Core Pages (evaluate, interview, admin, landing)
Week 2-3   🟠 Phase 2: n8n Integration + missing webhook endpoints
Week 3-4   🟡 Phase 3: Contracts + Compliance (templates, e-sign, trust scores)
Week 4-5   🔵 Phase 4: AI Forecasting + Smart Matching + Career Path
Week 5-6   🟢 Phase 5: CV Builder + CV Analyzer + Job Alerts + Auto-Apply
Week 6-7   🟣 Phase 6: i18n + SEO + Stripe Production + Security
Week 7-8   🔵 Phase 7: Tests (11 critical + E2E) + Deployment
```

---

## 📈 Priority Matrix

| | High Impact | Low Impact |
|---|---|---|
| **High Effort** | Phase 2 (n8n), Phase 3 (Contracts) | Phase 4 (AI Forecasting) |
| **Low Effort** | Phase 1 (Missing Pages), Phase 7 (Tests) | Phase 6 (i18n, SEO polish) |

**Recommended order:** Phase 1 → Phase 7 (tests) → Phase 2 → Phase 3 → Phase 6 → Phase 4 → Phase 5

---

## ⚠️ Key Risks

| Risk | Mitigation |
|------|-----------|
| n8n instance not available | All endpoints have mock fallbacks — ship with mocks, activate later |
| Stripe webhook security | Implement signature verification before going live |
| Arabic RTL edge cases | Test all components with long Arabic text strings |
| Supabase RLS bypass | Audit all RPC functions and service role usage |
| No email provider | Integrate Resend or SendGrid before launch |

---

**Bottom line:** The platform's skeleton is solid (~80% complete). The remaining 20% is concentrated in **5 missing page components**, **n8n wiring**, **contract automation**, **testing**, and **launch polish**. Phases 1 and 7 should be done first since they unblock everything else and ensure existing work is reliable.