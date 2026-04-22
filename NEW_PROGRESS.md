# GrowthNexus - Progress Tracker

## 1. Database & Schema Updates
- [x] Migrate default currency to AED across tables.
- [x] Add UAE-specific candidate fields (Emirates ID, Nafis, Visa status, etc.).
- [x] Implement initial `calculate_match_score` function.
- [x] Setup Messaging (`conversations`, `messages`) & Saved Items (`saved_jobs`, `saved_candidates`).
- [ ] Update `app_status` enum to include `offer` (عرض وظيفي).
- [ ] Add `rejection_reason` column to `applications` table.
- [ ] Update `job_status` enum to include `paused`.
- [ ] Add `company_type` enum (government, semi_government, private) to `companies`.
- [ ] Add `nationality_requirements` (array) to `jobs` table.

## 2. Job Posting & Management Enhancements
- [ ] **AI Assistant:** Integrate AI to suggest Job Title, Description, and Requirements in the posting form.
- [ ] **Location Fields:** Update City input to a strict Dropdown of UAE cities.
- [ ] **Nationality Field:** Add a multi-select Dropdown for target nationalities.
- [ ] **Job Actions:** Implement UI and backend logic for:
  - [ ] Promote/Boost Job (Payment integration via n8n).
  - [ ] Pause / Resume Job.
  - [ ] Duplicate Job.
  - [ ] Share Job.
- [ ] **Confidentiality:** Update `public_jobs_view` to display entity type (e.g., "Government Entity") instead of just "Confidential Company".
- [ ] **Expiry:** Ensure Expiry Date is clearly labelled as "Last day to apply".

## 3. Employer Dashboard & Candidate Filtering
- [ ] **Job List Controls:** Add Filters (Active, Closed, Draft, Paused) and Sorting (Newest, Oldest, Most Applicants).
- [ ] **Notifications:** Build a notification UI for events like "5 new applicants".
- [ ] **Candidate Filtering:** Build advanced filter panel for applicants (Nationality, Specialization, Degree, Experience, Match Score).
- [ ] **CV Summary:** Display an AI-generated summary of the candidate's CV on their applicant card.

## 4. Application Pipeline (Kanban)
- [ ] **New Stage:** Add "Offer" column to the application tracking board.
- [ ] **Safe Rejection:** Implement confirmation modal when dragging/marking a candidate as "Rejected".
- [ ] **Rejection Reasons:** Build UI to capture reason upon rejection and save to database.

## 5. Pricing & SaaS Presentation
- [ ] **Hide Upfront Pricing:** Remove direct pricing displays from public landing pages.
- [ ] **Checkout Flow:** Display pricing only upon module selection or checkout.
- [ ] **SaaS Plans Structure:** Scaffold UI for Subscription Packages (Starter, Growth, Pro, Enterprise).

## 6. Core Modules (Scaffolding & Initial Logic)
- [ ] **Interview AI:** Scaffold interface for generating questions and evaluating text/audio answers.
- [ ] **Committee Evaluation:** Scaffold UI for multi-user scoring and evaluation criteria.
- [ ] **Contract Automation:** Design templates for automated Offer Letters.
- [ ] **Emiratisation Dashboard:** Build UI to track Emirati hires vs total headcount targets.
- [ ] **Analytics Dashboard:** Build UI for Time-to-fill, Offer acceptance rates, and Applicant drop-off.
- [ ] **Company Verification:** Scaffold document upload flow for Trade Licenses and OCR extraction logic.
