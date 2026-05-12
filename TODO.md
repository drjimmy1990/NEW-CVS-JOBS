# 📋 GrowthNexus — Remaining TODO

> **Created:** 12 May 2026
> **Overall Completion: ~91%** — Core platform + verification + OCR workflow done
> **What Remains:** Phase 10 completion (~45% left), Phase 11 (B2C), Phase 12 (i18n/SEO/QA), Phase 13 (Enterprise)

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
- [x] Activate workflow and test all 4 lifecycle events:
  - [x] `contract_created` event
  - [x] `contract_sent` event
  - [x] `contract_signed` event
  - [x] `contract_declined` event
- [x] Set `N8N_CONTRACT_NOTIFY_WEBHOOK` env var on server

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
- [ ] Review all `service_role` key usage (currently: company registration)

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

#### ~~Smart Candidate Suggestions~~ ✅ DONE (12 May)
- [x] Replace hardcoded candidate names on employer dashboard
- [x] Build real DB query: match candidate skills against company's active job requirements
- [x] Add Jaccard similarity scoring for skill matching
- [x] Display top 5 suggested candidates with match percentage

#### ~~AI Match Score Enhancement~~ ✅ DONE (12 May)
- [x] Improve `calculate_match_score` with:
  - [x] Weighted skill matching (Jaccard similarity)
  - [x] Experience years compatibility
  - [x] Salary range alignment
  - [x] Location preference matching
  - [x] Composite weighted score

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

### Email Service Integration
- [ ] Choose provider: Resend or SendGrid
- [ ] Integrate transactional emails:
  - [ ] Registration confirmation
  - [ ] Password reset
  - [ ] Application notifications (to employer)
  - [ ] Contract status changes (to candidate)
  - [ ] Interview invitation
  - [ ] Team member invitation
- [ ] Email templates (Arabic + English)

### Remaining n8n Workflows
| # | Workflow | Priority | Description |
|---|---------|----------|-------------|
| 7 | Smart Matching | 🟡 Medium | AI ranks best candidates from talent pool |
| 8 | Message Notification | 🟢 Low | Chat message push notifications |
| 9 | Payment Verification | 🟡 Medium | Stripe webhook fulfillment validation |
| 6 | App Notification (enhance) | 🟢 Low | Add email/Telegram to existing workflow |

---

## 🟠 PHASE 11 — B2C Candidate Services (Revenue Expansion)

### 11.1 Starter Pack
- [ ] **CV Analyzer** (25 AED one-time)
  - [ ] Page: `/candidate/cv/analyze`
  - [ ] Deep AI analysis, ATS compatibility score
  - [ ] Keyword optimization suggestions
  - [ ] Formatting tips and fix recommendations
  - [ ] Payment gate (Stripe one-time charge)

- [ ] **CV Builder** (39 AED one-time)
  - [ ] Page: `/candidate/cv/builder`
  - [ ] 3–5 professional templates
  - [ ] Drag-and-drop section ordering
  - [ ] Live preview with template switching
  - [ ] PDF export with Arabic font support
  - [ ] Payment gate

- [ ] **Interview AI (Candidate Self-Practice)** (39 AED/month)
  - [ ] Adapt existing employer interview flow for candidate self-service
  - [ ] Practice by job role / industry
  - [ ] AI feedback on answers
  - [ ] Subscription gate

### 11.2 Growth Pack
- [ ] **Rejection Analyzer** (29 AED)
  - [ ] AI analysis of why candidate was rejected
  - [ ] Improvement tips based on rejection reasons
  - [ ] Comparison with successful candidates (anonymized)

- [ ] **Career Path Generator** (29 AED/month)
  - [ ] Input current skills + career goals
  - [ ] AI generates growth trajectory
  - [ ] Skill gap identification
  - [ ] Training/certification recommendations

- [ ] **Skill Gap Analyzer** (25 AED)
  - [ ] Compare current skills vs target job requirements
  - [ ] Priority ranking of skills to develop
  - [ ] Course/resource recommendations

- [ ] **Smart Job Alert** (19 AED/month)
  - [ ] Configurable matching criteria
  - [ ] Email/push for matching jobs
  - [ ] Daily/weekly digest via n8n
  - [ ] Page: `/candidate/job-alerts`

### 11.3 Pro Pack
- [ ] **Auto Apply** (49–149 AED/month)
  - [ ] n8n workflow: match → auto-submit → track
  - [ ] 50 applications/month limit
  - [ ] Detailed tracking dashboard

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

---

## 🐛 Known Issues & Bugs

| Issue | Impact | Resolution |
|-------|--------|------------|
| `emiratisation_profiles` table empty | Compliance export returns 404 | Use `EmiratisationProfileForm.tsx` to seed data |
| Contract notify not on n8n | Email notifications won't fire | Import `n8n-contract-notify-workflow.json` → activate |
| `N8N_WEBHOOK_SECRET` = default | Security risk | Change to strong value before production |
| `CRON_SECRET` not set | Anyone can trigger contract expiry | Set env var in Vercel dashboard |
| Smart candidate suggestions mock | Dashboard shows hardcoded names | ✅ Fixed — real DB query with Jaccard similarity |
| Multi-language not implemented | Arabic-only UI | Phase 12 work (next-intl) |
| Stripe in test mode | No real payments | Switch to live keys for production |
| No email service | Can't send emails | Integrate Resend or SendGrid |
| No monitoring | No error tracking | Add Sentry before launch |

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
