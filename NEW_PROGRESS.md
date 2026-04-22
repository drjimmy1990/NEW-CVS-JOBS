# GrowthNexus - NEW Progress Tracker

> Aligned with **NEW_PLAN.md** — Updated April 22, 2026

---

## 1. Database Schema & Enums (Phase 5 Migration)
- [x] Add `paused` to `job_status` enum.
- [x] Add `offer` to `app_status` enum.
- [x] Create `company_type_enum` (`government`, `semi_government`, `private`) and add column to `companies`.
- [x] Add `rejection_reason` TEXT column to `applications`.
- [x] Add `nationality_requirements` TEXT[] column to `jobs`.
- [x] Update `public_jobs_view` — show entity type for confidential listings.
- [x] Insert UAE cities reference data into `system_config`.
- [x] Insert nationality options into `system_config`.
- [x] Insert rejection reasons into `system_config`.

## 2. TypeScript Types & Constants
- [x] Update `types.ts` — new enums: `CompanyType`, `paused`, `offer`.
- [x] Add `UAE_CITIES`, `NATIONALITY_OPTIONS`, `REJECTION_REASONS` constants.
- [x] Add `rejection_reason` and `nationality_requirements` to interfaces.

## 3. Job Posting Enhancements
- [x] Replace location free-text with **UAE cities dropdown**.
- [x] Add **nationality multi-select** toggle buttons.
- [x] Add **skills tag input** (Enter to add, X to remove).
- [x] Add **AI Assist button** — wired to `/api/ai/job-description` → n8n webhook.
- [x] Switch currency from SAR to **AED (درهم)**.
- [x] Full Arabic localization of the wizard.

## 4. Employer Jobs Dashboard
- [x] Add **status filter tabs** (All, Active, Paused, Draft, Closed).
- [x] Add **sorting controls** (Newest, Oldest, Most Applicants).
- [x] Add **Pause/Resume** job action.
- [x] Add **Duplicate** job action (creates draft copy).
- [x] Add **Share** job action (copies public link).
- [x] Fix currency display from SAR to **AED (درهم)**.
- [x] Display **expiry date** as "آخر يوم للتقديم".
- [x] Full Arabic localization.

## 5. Application Pipeline
- [x] Add **"عرض وظيفي" (Offer)** status to pipeline columns.
- [x] Implement **confirmation modal** when rejecting a candidate.
- [x] Implement **rejection reason capture dialog** (select reason + optional notes).
- [x] Save rejection reason to database (`applications.rejection_reason`).
- [x] Display rejection reason on rejected applicant cards.
- [x] Add **search bar** (filter by name/email).
- [x] Add **status filter tabs** in applicants view.
- [x] Full Arabic localization.

## 6. New SaaS Module Pages
- [x] **Analytics Dashboard** (`/employer/analytics`) — KPI cards + rejection breakdown.
- [x] **Emiratisation Tracker** (`/employer/emiratisation`) — gauge, stats, MOHRE compliance alert.
- [x] Add both links to employer **sidebar navigation**.

## 7. Admin Panel (Phase 6)
- [x] Admin layout with `role === 'admin'` guard.
- [x] Admin Dashboard — KPI cards + recent users.
- [x] System Config — CRUD with inline editing, grouped by category.
- [x] Users Management — search, role filter, inline role change.
- [x] Companies Management — verify/reject, company type dropdown.
- [x] Jobs Moderation — force-close, feature/unfeature, status filters.
- [x] Transactions — all payments + total revenue.

## 8. n8n Guides (Phase 7)
- [x] Rewrote N8N_WORKFLOW_GUIDE.md — 11 workflows with node-by-node instructions.
- [x] Rewrote N8N_WEBHOOK_GUIDE.md — 11 webhook contracts with JSON specs.
- [x] Created `/api/ai/job-description` API route.

## 9. Stripe SaaS Billing (Phase 8A)
- [x] Database migration: Stripe columns on companies + profiles.
- [x] `/api/stripe/checkout` — Creates Stripe Checkout Session.
- [x] `/api/stripe/webhook` — Handles subscription lifecycle events.
- [x] `/api/stripe/portal` — Billing Portal for self-service management.
- [x] Redesigned `/pricing` — Features visible, prices hidden, Stripe checkout on CTA.
- [x] `/payment/success` + `/payment/cancel` pages.

## 10. Interview AI System (Phase 8B)
- [x] `/api/interview/questions` — AI question generation (n8n or mock).
- [x] `/api/interview/submit` — AI answer evaluation + DB save.
- [x] `/candidate/interview/[applicationId]` — Step wizard + score display.
- [x] Database: `auto_interview`, `interview_score`, `interview_report`.

## 11. Committee Evaluation (Phase 8C)
- [x] `committee_evaluations` table with RLS policies.
- [x] `/api/evaluation/submit` — Saves scorecard + triggers summary.
- [x] `/employer/evaluate/[applicationId]` — Criteria sliders + notes UI.
- [x] Auto-aggregation with outlier detection.

## 12. Remaining (Future Phases)
- [ ] **Offer & Contract Automation** — template manager + e-sign.
- [ ] **Forecasting Engine** — AI predictions UI.
- [ ] **Company Verification** — Trade License OCR + Trust Score.
- [ ] **Candidate B2C Services** — CV Analyzer, Builder, Career Path.
- [ ] **i18n** — full En/Ar toggling via `next-intl`.
- [ ] **SEO** — dynamic metadata, sitemap, OG images.
