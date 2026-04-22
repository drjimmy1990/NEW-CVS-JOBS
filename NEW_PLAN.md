# GrowthNexus - Master Implementation Plan (Updated)

This is the definitive, step-by-step master plan for the GrowthNexus platform. It merges the progress made so far with the new requirements for the B2B SaaS transition, UAE localization, and the 6-module architecture.

---

## ✅ Phases 1 - 4: Foundation (COMPLETED)
- **Phase 1: Environment & Auth:** Next.js, Supabase, RLS, Login/Register implemented.
- **Phase 2: Employer Core:** Basic dashboard, company profile, and standard job posting wizard built.
- **Phase 3: Public Job Board:** Homepage, job search, SEO routing, and apply functionality built.
- **Phase 4: Candidate Core:** Candidate dashboard, CV upload, and basic application tracking implemented.

---

## 🟡 Phase 5: ATS Pipeline & Job Enhancements (IN PROGRESS)
**Goal:** Enhance how employers interact with job listings and applicants.

### 5.1 Job Posting Enhancements
- **AI Assistant:** Integrate an AI button in `/employer/jobs/new` to auto-generate Job Titles, Descriptions, and Requirements based on a brief prompt.
- **Location & Nationality:** Replace free-text inputs with strict Dropdowns:
  - UAE Cities: Abu Dhabi, Dubai, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, Fujairah, Al Ain, Kalba, Hatta, Al Dhafra, Ruwais.
  - Nationality: Multi-select (All, UAE Nationals, GCC, Arab Nationals, Expats).
- **Confidentiality Update:** Modify the frontend and `public_jobs_view` so that hidden companies display their `company_type` (e.g., "Government Entity", "Semi-Government Entity") instead of a generic "Private Company".

### 5.2 Job Management & Employer Dashboard
- **Job Actions:** Implement UI to Pause, Duplicate, Share, and Promote (Boost) jobs from the employer dashboard.
- **Filtering & Sorting:** Add toggles to view Active, Paused, Closed, and Draft jobs. Sort by newest, oldest, or most applicants.
- **Notifications:** Create a notification dropdown for events like new applications or messages.

### 5.3 Advanced Application Pipeline (Kanban)
- **New Statuses:** Add "Offer" (`عرض وظيفي`) to the application columns.
- **Safe Rejection:** When dragging a candidate to "Rejected", trigger a confirmation modal.
- **Rejection Reasons:** Require the employer to select a reason (e.g., "Experience Mismatch", "Salary Expectations") which saves to the `applications` table for Analytics.
- **Candidate Filtering:** Allow employers to filter applicants within a job by Nationality, Specialization, Degree, Experience, and AI Match Score.

---

## 🛠 Phase 6: The 6 SaaS Modules & Automation (NEW)
**Goal:** Build the enterprise features that justify the B2B SaaS subscription.

### 6.1 Interview AI System
- Build a dedicated page where candidates can take automated AI interviews.
- Use `gn-interview-eval` n8n webhook to score the responses and append the report to the candidate's application profile for the employer to review.

### 6.2 Candidate Evaluation Committee
- Allow employers to invite team members to evaluate a candidate.
- Build a scorecard UI.
- Use `gn-committee-summary` webhook to aggregate scores and highlight discrepancies.

### 6.3 Offer & Contract Automation
- Build a template manager for employers to upload standard contracts.
- Use `gn-contract-gen` webhook to merge candidate details into the contract and send it via an e-sign provider.

### 6.4 Analytics & KPI Dashboard
- Build `/employer/analytics`.
- Aggregate data to show Time-to-Fill, Offer Acceptance Rate, and Rejection Reason breakdown.

### 6.5 Forecasting Engine
- Implement UI to show AI predictions (e.g., "This job will likely take 27 days to fill"). Data provided by backend/n8n analysis of historical DB trends.

### 6.6 Emiratisation Engine
- Build `/employer/emiratisation`.
- Show current UAE National headcount vs targets.
- Highlight candidates tagged as `candidate_type = 'emirati'` in the ATS view.

---

## 🏢 Phase 7: Verification & Monetization
**Goal:** Secure the platform and implement the billing logic.

### 7.1 Company Verification Flow (Trust Score)
- For companies registering with generic emails (e.g., @gmail.com), force a Trade License upload step.
- Trigger `gn-company-verify` webhook to perform OCR and registry matching.
- Restrict job posting privileges until verification is complete or conditionally approved.

### 7.2 SaaS Pricing & EdfaPay Integration
- Build a unified Pricing page that dynamically shows packages (Starter, Growth, Pro, Enterprise) *only* when the user intends to upgrade.
- Integrate EdfaPay checkout APIs.
- Handle fulfillment via the `gn-payment-verify` webhook (updating `companies.subscription_tier` and `job_credits`).

---

## 🌐 Phase 8: Polish, Localization & Launch
- Implement full RTL support and Arabic/English toggling via `next-intl`.
- Finalize SEO metadata and sitemaps.
- Comprehensive end-to-end testing of the employer and candidate flows.
