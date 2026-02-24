This is the **Detailed Development Steps Plan** for the GrowthNexus Recruitment Platform. It is divided into **7 Phases**. We will follow this strictly to ensure the architecture is robust and nothing from the SOP is missed.

---

### 🚀 Phase 0: Environment & Foundation Setup [✅ COMPLETED]
**Goal:** Initialize the tech stack and prepare the development environment.

*   **0.1. Initialize Next.js Project**
    *   Create project: `npx create-next-app@latest growth-nexus --typescript --tailwind --eslint`
    *   Install Core UI: `npx shadcn-ui@latest init` (Default settings).
    *   Install Components: `npx shadcn-ui@latest add button card input label select badge dialog dropdown-menu avatar separator sheet`.
    *   Install Libraries: `npm install @supabase/supabase-js @supabase/ssr lucide-react clsx tailwind-merge next-intl`.

*   **0.2. Supabase Initialization**
    *   Create a new Supabase Project.
    *   Go to **Project Settings > API**. Copy `URL` and `ANON_KEY` to your local `.env.local` file.
    *   Go to **Authentication > Providers**. Enable Email/Password. Disable "Confirm Email" for faster dev (re-enable for prod).

*   **0.3. n8n Setup**
    *   Ensure your n8n instance is running.
    *   Create 3 placeholder workflows (empty for now):
        1.  `gn-cv-parser`
        2.  `gn-payment-init`
        3.  `gn-payment-callback`

---

### 🗄️ Phase 1: Database Schema & Authentication [✅ COMPLETED]
**Goal:** Build the backend structure and user role management.

*   **1.1. Execute Master SQL Script**
    *   Run the full SQL script provided in the previous Blueprint in the Supabase SQL Editor.
    *   *Verify:* Check that tables `profiles`, `companies`, `candidates`, `jobs`, `applications`, `system_config` exist.

*   **1.2. Row Level Security (RLS) Policies**
    *   **Profiles:** `Users can read own profile`. `Users can update own profile`.
    *   **Companies:** `Public can read`. `Employer can update own company`.
    *   **Jobs:** `Public can read active jobs`. `Employer can insert/update own jobs`.
    *   **Applications:** `Candidate can insert`. `Employer can read applications for their jobs`.

*   **1.3. Authentication Logic (Next.js)**
    *   Create `utils/supabase/server.ts` and `client.ts` (Standard Next.js Supabase setup).
    *   Create `middleware.ts`: Implement logic to protect `/employer/*` and `/candidate/*` routes based on user role.
    *   **Build Page:** `/login`: Simple form (Email/Pass).
    *   **Build Page:** `/register`: Form with toggle **[I am a Candidate] / [I am an Employer]**.
    *   *Logic:* On register, trigger Supabase Auth. Then, insert into `public.profiles` with the correct `role`.

---

### 🏢 Phase 2: Employer Core (The Supply Side) [✅ COMPLETED]
**Goal:** Allow companies to build profiles and post jobs.

*   **2.1. Employer Dashboard Shell**
    *   Route: `/employer/dashboard`.
    *   Create `DashboardLayout` (Sidebar with links: Jobs, Candidates, Settings).

*   **2.2. Company Profile Management**
    *   Route: `/employer/settings`.
    *   Form: Logo Upload (Supabase Storage), Name, Description, Website.
    *   *Action:* `UPDATE companies SET ... WHERE owner_id = user.id`.

*   **2.3. Job Posting Wizard (Crucial)**
    *   Route: `/employer/jobs/new`.
    *   **Step 1 (Details):** Inputs for Title, Description (Rich Text), Location, Salary.
    *   **Step 2 (Settings):**
        *   Checkbox: `is_confidential` (Hide my company name).
        *   Checkbox: `is_featured` (Pin to top - costs extra).
    *   **Step 3 (Logic):**
        *   Check `companies.job_credits > 0`.
        *   If yes: `INSERT into jobs`, `DECREMENT credits`.
        *   If no: Show "Insufficient Credits" modal (link to Pricing).

*   **2.4. My Jobs List**
    *   Route: `/employer/jobs`.
    *   Table displaying Active, Expired, and Draft jobs.
    *   Action: "Close Job" (Update status to `closed`).

---

### 🌍 Phase 3: The Public Job Board (SEO) [✅ COMPLETED]
**Goal:** Display jobs to the world securely.

*   **3.1. Database Security View**
    *   Ensure the `public_jobs_view` (SQL View) is working. This is what hides confidential data.

*   **3.2. Job Search Page**
    *   Route: `/jobs` (and `/` Home).
    *   **Server Component:** Fetch data from `public_jobs_view`.
    *   **Filters Sidebar:** City, Job Type, Salary Range.
    *   *Implementation:* Update URL params (`?city=Riyadh&type=remote`) to filter the SQL query.

*   **3.3. Job Details Page**
    *   Route: `/jobs/[slug]`.
    *   Display Title, Description.
    *   **Confidential Logic:**
        *   If `is_confidential === true`: Show generic icon, "Private Company". Disable link to company profile.
        *   Else: Show Company Logo, Link to `/companies/[slug]`.

*   **3.4. Apply Logic**
    *   "Apply Now" Button.
    *   If Guest -> Redirect to Login.
    *   If Candidate -> Open "Easy Apply" Modal (shows stored CV).

---

### 👤 Phase 4: Candidate Core & AI Integration [✅ COMPLETED]
**Goal:** Job seekers profile and AI CV parsing.

*   **4.1. Candidate Dashboard**
    *   Route: `/candidate/dashboard`.
    *   Stats: "Jobs Applied", "Profile Views".

*   **4.2. CV Management (The AI Part)**
    *   Route: `/candidate/cv`.
    *   **Upload Component:** User uploads PDF.
    *   **Process:**
        1.  Upload file to Supabase Storage (`resumes` bucket).
        2.  Trigger n8n Webhook (`gn-cv-parser`) with File URL + User ID.
    *   **n8n Workflow Construction:**
        *   Node 1: Download PDF.
        *   Node 2: PDF Reader (Extract Text).
        *   Node 3: Gemini API. *Prompt: "Extract skills, experience (years), and education as JSON."*
        *   Node 4: Supabase Update. `UPDATE candidates SET parsed_data = $JSON WHERE id = $UserId`.
    *   **Frontend:** Auto-refresh page to show "Extracted Skills" tags.

*   **4.3. My Applications**
    *   Route: `/candidate/applications`.
    *   List of jobs applied to.
    *   Badges: `Applied` (Gray), `Reviewing` (Blue), `Interview` (Yellow), `Rejected` (Red).

---

### 🤝 Phase 5: The ATS System (Interaction) [🔄 IN PROGRESS]
**Goal:** Connect candidates to employers.

*   **5.1. Employer Candidate View (Completed)**
    *   Route: `/employer/jobs/[id]/applicants`.
    *   Displays all applications for a specific job with Candidate details and CV links.

*   **5.2. Interactive ATS Status Board (Next)**
    *   Add functionality to `/employer/jobs/[id]/applicants` to change `applications.status`.
    *   **UI Update:** Dropdown or drag-and-drop to move candidates between `Applied`, `Reviewing`, `Interview`, `Shortlisted`, `Rejected`, `Hired`.
    *   **Action:** Server action to update Supabase array/table.

*   **5.3. Candidate Details Modal**
    *   When Employer clicks a candidate:
    *   Show full parsed CV JSON data (from Phase 4).
    *   Provide easy access to the Cover Letter and original CV PDF.

*   **5.4. Landing Pages (Private Collections)**
    *   Route: `/employer/landing-pages`.
    *   Button: "Create Collection Link".
    *   Generates link: `growthnexus.com/apply/xyz-token`.
    *   Build Public Page: `/apply/[token]`. Simple form (Name, Email, Upload CV).
    *   *Logic:* Inserts into `candidates` (if new) and `applications` directly without requiring normal candidate registration.

---

### 💰 Phase 6: Monetization & Payments
**Goal:** Handle EdfaPay and Credits.

*   **6.1. Admin Configuration**
    *   Route: `/admin/config`.
    *   Table to edit `system_config`.
    *   Keys: `price_basic_pack` (100 SAR), `credits_basic_pack` (5).

*   **6.2. Pricing Page**
    *   Route: `/pricing`.
    *   Cards displaying packages.
    *   Button: "Buy Now".

*   **6.3. n8n Payment Workflow**
    *   **Trigger:** Webhook from Pricing Page.
    *   **Node:** Supabase Select (Get Price from Config).
    *   **Node:** HTTP Request (EdfaPay Initiate).
    *   **Response:** Return Redirect URL to frontend.

*   **6.4. Payment Callback**
    *   Create Page: `/payment/callback`.
    *   **n8n Workflow:**
        *   Validate Hash.
        *   If Success: `UPDATE companies SET job_credits = job_credits + X`.
        *   Insert row into `transactions`.

---

### ✨ Phase 7: Polish & Launch
**Goal:** Production readiness.

*   **7.1. Localization (En/Ar)**
    *   Wrap all text strings in `t('key')`.
    *   Implement `next-intl` to toggle between English and Arabic.
    *   Ensure `dir="rtl"` is applied when Arabic is selected.

*   **7.2. SEO Configuration**
    *   Dynamic Metadata for Job Pages (`generateMetadata` in Next.js).
    *   Generate `sitemap.xml`.

*   **7.3. Final Testing**
    *   Create a clean "Employer" account. Buy credits. Post a job.
    *   Create a "Candidate" account. Parse CV. Apply.
    *   Check Employer ATS to see the application.

---

**Ready to start Phase 0?** I can generate the folder structure and `package.json` now.