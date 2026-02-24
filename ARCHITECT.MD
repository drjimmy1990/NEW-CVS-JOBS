This document is the **Master Technical Blueprint** for the **GrowthNexus Recruitment Platform**. It serves as the single source of truth for the development lifecycle, defining the architecture, database structure, features, and automation logic required to build the system described in your SOP.

---

# 1. High-Level Architecture

The system operates as a **Two-Sided Marketplace (SaaS)** connecting Employers (B2B) and Job Seekers (B2C).

*   **Frontend:** **Next.js 14+ (App Router)**. Chosen for Server-Side Rendering (SSR) which is critical for Job Board SEO.
*   **Database & Auth:** **Supabase**. Handles real-time data, user management, and Row-Level Security (RLS).
*   **Automation Backend:** **n8n**. Acts as the middleware for complex logic (CV Parsing, Payment Processing, AI Matching).
*   **Styling:** **Tailwind CSS + Shadcn/UI** (Right-to-Left / Bi-lingual support built-in).

---

# 2. Database Schema Specification (Supabase)

This schema supports all SOP requirements, including Confidential Ads, Subscription Credits, and CV Management.

### A. Core Identity Tables
1.  **`profiles`** (Extends `auth.users`)
    *   `id`: UUID (PK).
    *   `email`: Text.
    *   `role`: Enum (`'candidate'`, `'employer'`, `'admin'`).
    *   `full_name`: Text.
    *   `avatar_url`: Text.
    *   `created_at`: Timestamp.

### B. Employer Module
2.  **`companies`**
    *   `id`: UUID.
    *   `owner_id`: UUID (FK to profiles).
    *   `name`: Text.
    *   `slug`: Text (Unique, for SEO URLs e.g., `/company/aramco`).
    *   `logo_url`: Text.
    *   `description`: Text.
    *   `subscription_tier`: Text (`'free'`, `'basic'`, `'premium'`).
    *   `job_credits`: Integer (Balance for posting jobs).
    *   `cv_view_credits`: Integer (Balance for downloading CVs).

3.  **`jobs`** (The Core Listing)
    *   `id`: UUID.
    *   `company_id`: UUID.
    *   `title`: Text.
    *   `slug`: Text (Unique SEO URL).
    *   `description`: Text (HTML/Rich Text).
    *   `location_city`: Text.
    *   `job_type`: Enum (`'full_time'`, `'part_time'`, `'remote'`).
    *   `salary_min`: Number.
    *   `salary_max`: Number.
    *   **`is_confidential`**: Boolean (SOP Requirement: If true, hides Company Name/Logo on frontend).
    *   **`is_featured`**: Boolean (SOP Requirement: Pins to top).
    *   **`status`**: Enum (`'active'`, `'expired'`, `'draft'`, `'closed'`).
    *   **`search_vector`**: TSVECTOR (For high-speed full-text search).
    *   `expires_at`: Timestamp.

4.  **`landing_pages`** (SOP Requirement: Private CV Collections)
    *   `id`: UUID.
    *   `company_id`: UUID.
    *   `token`: Text (Unique hash for the private URL).
    *   `title`: Text (Internal campaign name).
    *   `description`: Text (Job description shown to private candidates).
    *   `is_active`: Boolean.

### C. Candidate Module
5.  **`candidates`**
    *   `id`: UUID (FK to profiles).
    *   `headline`: Text (e.g., "Senior Accountant").
    *   `cv_url`: Text (Path to private storage bucket).
    *   **`parsed_data`**: JSONB (Stores AI-extracted skills, exp, education from n8n).
    *   `years_experience`: Integer.
    *   `current_company`: Text.
    *   `is_open_to_work`: Boolean.

6.  **`applications`**
    *   `id`: UUID.
    *   `job_id`: UUID.
    *   `candidate_id`: UUID.
    *   `status`: Enum (`'applied'`, `'screening'`, `'interview'`, `'rejected'`, `'offer'`).
    *   `cover_letter`: Text.
    *   `resume_snapshot`: Text (Link to the specific CV version used).

### D. System & Commerce
7.  **`system_config`**
    *   `key`: Text (e.g., `price_featured_ad`, `credits_per_job`).
    *   `value`: Text.
    *   `group`: Text.

8.  **`transactions`**
    *   `id`: UUID.
    *   `user_id`: UUID.
    *   `amount`: Decimal.
    *   `provider_ref`: Text (EdfaPay ID).
    *   `status`: Text (`'paid'`, `'failed'`).
    *   `metadata`: JSONB (What was bought? e.g., `{ "credits": 50 }`).

---

# 3. Detailed Service Specifications

These are the logic flows connecting the Frontend, Database, and n8n.

### Service A: The "Confidential Job" Logic (SOP Feature)
*   **Trigger:** Employer checks "Hide Company Name" during job posting.
*   **Database:** `jobs.is_confidential = true`.
*   **Security (RLS):**
    *   Create a Postgres View `public_jobs_view`.
    *   Logic: `IF is_confidential IS TRUE THEN company_name = 'Confidential Employer', logo = 'placeholder.png' ELSE company_name = companies.name`.
    *   **Frontend:** Queries the *View*, never the raw table, ensuring data privacy at the database level.

### Service B: n8n CV Parser & AI Matching
*   **Trigger:** Candidate uploads PDF.
*   **n8n Workflow:**
    1.  **Webhook:** Receives file.
    2.  **Extract Text:** PDF Reader node.
    3.  **AI Analysis (Gemini):** Prompt: "Extract skills, years of exp, and education into JSON format."
    4.  **Database Write:** Updates `candidates.parsed_data` column.
    5.  **Matching:** Runs a vector similarity check against active jobs and updates a `suggested_jobs` table.

### Service C: The "Private Landing Page" (SOP Feature)
*   **Employer Action:** "Create CV Collection Link".
*   **System:** Generates a unique UUID (e.g., `growthnexus.com/apply/a7b9-8c2d`).
*   **Frontend Logic:**
    *   This route is **NOINDEX** (hidden from Google).
    *   It does *not* require a user account to apply (Guest Apply).
    *   Submissions go directly to the Employer's dashboard as "Unsolicited Applications".

### Service D: Payment & Credits
*   **Logic:**
    *   Employers buy "Credit Packs".
    *   Posting a Standard Job = 1 Credit.
    *   Posting a Featured Job = 3 Credits.
    *   Viewing a Candidate's Phone Number = 1 CV Credit.
*   **n8n Workflow:**
    1.  **Webhook:** `initiate_payment` (User ID, Amount, Package ID).
    2.  **API:** Call EdfaPay. Return Redirect URL.
    3.  **Callback:** EdfaPay calls `payment_callback`.
    4.  **Fulfillment:** Update `companies.job_credits` based on the package bought.

---

# 4. Frontend Page Structure (Next.js App Router)

### 🌍 Public Zone (SEO Optimized)
*   `/` (Home): Search bar, Featured Jobs, Value Prop.
*   `/jobs`: Search results.
    *   *Features:* Sidebar filters (City, Salary, Remote), Sort by Date.
*   `/jobs/[slug]`: Job Description. "Apply" button checks auth status.
*   `/companies/[slug]`: Company profile page (Disabled for confidential companies).
*   `/pricing`: Packages for Employers.

### 👤 Candidate Zone (Protected)
*   `/candidate/dashboard`: Stats (Views on profile, Application status).
*   `/candidate/cv`: Upload/Update CV. AI Chat interface for "CV Optimization".
*   `/candidate/applications`: List of applied jobs with Status tags.
*   `/candidate/alerts`: Settings for email notifications.

### 🏢 Employer Zone (Protected)
*   `/employer/dashboard`: Analytics (Views per job, Total applicants).
*   `/employer/jobs`: Manage job postings (Edit, Archive, Delete).
*   `/employer/jobs/new`: Job Creation Wizard.
*   `/employer/jobs/[id]/edit`: Form to update existing jobs.
*   `/employer/jobs/[id]/applicants`: Applicant Tracking System (ATS).
    *   *Interactive List/Board:* Update candidate statuses ("Applied" -> "Interview" -> "Offer").
    *   *Candidate Details:* View parsed AI skills, cover letter, and CV.
*   `/employer/landing-pages`: Manage private collection links for off-platform sourcing.

### ⚙️ Admin Zone (Super User)
*   `/admin/config`: Manage `system_config` (Prices, Credit costs).
*   `/admin/users`: Moderate users.
*   `/admin/approvals`: (Optional) If you want to manually approve jobs before they go live.

---

# 5. Development Roadmap (Sprint Plan)

### Sprint 1: Foundation (Week 1) [✅ COMPLETED]
*   **Setup:** Next.js project, Tailwind, Shadcn/UI, Supabase Project.
*   **DB:** Execute SQL Schema. Setup RLS policies.
*   **Auth:** Build Login/Register pages with Role selection (Employer/Candidate).

### Sprint 2: The Core Job Engine (Week 2) [✅ COMPLETED]
*   **Employer:** Dashboard, "Post a Job", Job Management (Edit, Archive, Delete).
*   **Public:** Build "Job Search" page with filters.
*   **Security:** Implement the `public_jobs_view` for confidentiality.

### Sprint 3: Candidate & AI Integration (Week 3) [✅ COMPLETED]
*   **CV:** Build File Upload component.
*   **n8n:** Build the "Parse CV" webhook structure.
*   **Apply:** Build the 1-Click Application logic (Candidate -> Job link).

### Sprint 4: The ATS & Landing Pages (Week 4) [🔄 IN PROGRESS]
*   **Employer:** Build the interactive ATS (Update applicant statuses, view CVs).
*   **Candidate:** Build the "My Applications" tracking view. [✅ Done]
*   **Feature:** Implement "Private Landing Pages" for off-platform sourcing.

### Sprint 5: Commerce & Monetization (Week 5)
*   **n8n:** Build Payment workflows (EdfaPay).
*   **Logic:** Implement Credit deduction system for Job Posts and CV Views.
*   **Admin:** Build basic admin panel to view transactions.

### Sprint 6: Polish & Launch (Week 6)
*   **SEO:** Add Metadata, Sitemap.xml, Structured Data (Schema.org for Jobs).
*   **Localization:** Ensure all text is translatable (en/ar) using `next-intl`.
*   **Testing:** End-to-end testing of the "Confidential" flow and Payment flow.

---

# 6. Technical Requirements for You (To Start)

To proceed, ensure you have:
1.  **Google Cloud Console:** API Key for Gemini (for AI parsing).
2.  **EdfaPay:** Merchant credentials.
3.  **Supabase:** A fresh project URL and Anon Key.
4.  **n8n:** A self-hosted or cloud instance ready to import workflows.

This plan covers every aspect of the SOP and ensures a scalable, secure, and monetizable platform.