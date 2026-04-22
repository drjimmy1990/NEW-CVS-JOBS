# GrowthNexus - Master Implementation Plan (Updated)

This is the definitive, step-by-step master plan for the GrowthNexus platform. It merges the progress made so far with the new requirements for the B2B SaaS transition, UAE localization, and the 6-module architecture.

---

## ✅ Phases 1 - 4: Foundation (COMPLETED)
- **Phase 1: Environment & Auth:** Next.js, Supabase, RLS, Login/Register implemented.
- **Phase 2: Employer Core:** Basic dashboard, company profile, and standard job posting wizard built.
- **Phase 3: Public Job Board:** Homepage, job search, SEO routing, and apply functionality built.
- **Phase 4: Candidate Core:** Candidate dashboard, CV upload, and basic application tracking implemented.

---

## ✅ Phase 5: ATS Pipeline & Job Enhancements (COMPLETED)
- **Job Posting:** UAE cities dropdown, nationality multi-select, skills tags, AI assist, AED currency.
- **Job Management:** Pause/Resume/Duplicate/Share, filtering/sorting, Arabic localization.
- **Application Pipeline:** Offer status, rejection confirmation modal, rejection reasons, search/filter.
- **New Modules:** Analytics Dashboard + Emiratisation Tracker with sidebar navigation.

---

## ✅ Phase 6: Admin Panel (COMPLETED)
- Admin layout with `role === 'admin'` guard.
- Dashboard (KPI cards: users, companies, jobs, applications, transactions).
- System Config CRUD (inline editing, grouped by category).
- Users management (search, role filter, inline role change).
- Companies management (verify/reject, company type dropdown).
- Jobs moderation (force-close, feature/unfeature, status filters).
- Transactions viewer (all payments + total revenue).

---

## ✅ Phase 7: n8n Guides & AI API (COMPLETED)
- Rewrote N8N_WORKFLOW_GUIDE.md with 11 workflows (6 existing + 5 new).
- Rewrote N8N_WEBHOOK_GUIDE.md with full contracts for all 11 webhooks.
- Created `/api/ai/job-description` route (calls n8n → Gemini, falls back to mock).

---

## ✅ Phase 8: Stripe + Interview AI + Committee Evaluation (COMPLETED)

### 8A: Stripe SaaS Billing
- Database migration: `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `subscription_expires_at`.
- `/api/stripe/checkout` — Creates Stripe Checkout Session for tier-based subscriptions.
- `/api/stripe/webhook` — Handles lifecycle events (checkout complete, invoice paid, subscription updated/deleted).
- `/api/stripe/portal` — Billing Portal session for self-service subscription management.
- Redesigned `/pricing` — Features visible, prices hidden until checkout (per client requirement).
- `/payment/success` + `/payment/cancel` — Post-checkout pages.

### 8B: Interview AI System (n8n-backed)
- `/api/interview/questions` — Generates 5 interview questions via n8n or mock.
- `/api/interview/submit` — Sends answers to n8n for AI evaluation, saves scores.
- `/candidate/interview/[applicationId]` — Step-by-step interview wizard with score results.
- Database: `auto_interview`, `interview_score`, `interview_report` columns.

### 8C: Committee Evaluation (n8n-backed)
- `committee_evaluations` table with RLS policies.
- `/api/evaluation/submit` — Saves scorecard, triggers n8n summary when ≥2 evaluators.
- `/employer/evaluate/[applicationId]` — Scorecard UI with criteria sliders and notes.
- Auto-aggregation: average score, outlier detection, recommendation.

---

## 🛠 Phase 9: Offer & Contract Automation + Forecasting (NEXT)
### 9.1 Offer & Contract Automation
- Build contract template manager.
- Use `gn-contract-gen` webhook to merge candidate data into MOHRE-aligned templates.
- Document status tracking: sent → viewed → signed → declined → expired.
- E-sign integration (future).

### 9.2 Forecasting Engine
- Build AI predictions UI (time-to-fill, offer acceptance, hiring difficulty).
- Backed by n8n analysis of historical DB trends.

---

## 🛠 Phase 10: Verification, i18n & Launch
### 10.1 Company Verification Flow (Trust Score)
- Trade License upload step for companies with generic emails.
- `gn-company-verify` webhook: OCR → registry matching → trust score.

### 10.2 Candidate Services (B2C)
- CV Analyzer, CV Builder, Career Path Generator, Job Alerts.
- Stripe one-time payments + credit system.

### 10.3 i18n & SEO Polish
- Full RTL support and Arabic/English toggling via `next-intl`.
- Dynamic metadata, sitemaps, OG images.
- End-to-end testing.
