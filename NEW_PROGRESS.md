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
- [x] Add **AI Assist button** for auto-generating description.
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

## 7. Remaining (Future Phases)
- [ ] **Interview AI System** — automated interview page.
- [ ] **Committee Evaluation** — multi-user scorecard.
- [ ] **Contract Automation** — template manager + e-sign.
- [ ] **Forecasting Engine** — AI predictions UI.
- [ ] **Company Verification** — Trade License upload + OCR.
- [ ] **SaaS Pricing & Payments** — EdfaPay subscription flow.
- [ ] **i18n** — full En/Ar toggling via `next-intl`.
- [ ] **SEO** — dynamic metadata, sitemap.
