# 🏗️ GrowthNexus - Architecture & AI Context Document

## 1. Project Overview
**Name:** GrowthNexus (UAE Jobs Portal)
**Purpose:** An AI-powered, hyper-localized recruitment platform for the United Arab Emirates (UAE). It connects job seekers (Candidates) with Employers (Companies) through smart matching, AI CV parsing, and private landing pages.
**Target Audience:** UAE Residents and Emiratis (Locals), and UAE-based Employers.
**Language & Layout:** Arabic (Primary) and English. **Must support RTL (Right-to-Left) layout.**

## 2. Technology Stack
*   **Framework:** Next.js 16.1.6 (App Router, React 19).
*   **Styling:** Tailwind CSS v4 + Custom Animations (`tw-animate-css`).
*   **UI Components:** shadcn/ui (Radix UI primitives).
*   **Database & Auth:** Supabase (PostgreSQL, Auth, Storage for CVs/Logos, RLS Policies, RPCs).
*   **State & Forms:** React Hook Form, Zod (Validation), Zustand (State).
*   **Automation/AI:** N8N Webhooks (for AI CV Parsing via OpenAI).

## 3. Current State vs. Client Target State (CRITICAL CONTEXT)
There is currently a discrepancy between the codebase and the client's final requirements:
*   **Current Codebase State:** Built as an MVP using default shadcn/ui styles (Slate/Emerald/Cyan), LTR (Left-to-Right) English text, with heavily mocked/dummy data in the UI (e.g., hardcoded candidate lists, simulated match scores).
*   **Target Client State:** The client provided pure HTML/CSS templates (`uae-jobs-portal.html`, `jobseeker-dashboard.html`) and a PDF of requirements. 
*   **Target Aesthetics:** 
    *   **Direction:** RTL (Arabic).
    *   **Color Palette:** Navy (`#0A1628`), Gold (`#C8973A`), Cream (`#FAF6EE`), Success Green (`#1DB87E`).
*   **AI Directive:** When generating new UI or refactoring existing pages, migrate away from the default Shadcn Slate theme towards the Client's Navy/Gold RTL templates. Replace dummy data arrays with actual Supabase data fetching.

## 4. Database Architecture (Supabase)
The database is built on PostgreSQL with strict Row Level Security (RLS).
*   `profiles`: Base identity table linked to `auth.users`. Contains `role` (enum: candidate, employer, admin).
*   `companies`: Employer profiles. Tracks `job_credits` and `cv_view_credits`.
*   `candidates`: Job seeker profiles. Contains `cv_url`, `resume_parsed_data` (JSONB), and UAE-specific fields (`candidate_type` enum: emirati/resident, `visa_status`, `residence_emirate`).
*   `jobs`: The job postings. Contains `search_vector` (Full Text Search), `status` (active/draft/closed), and flags (`is_confidential`, `is_featured`).
*   `applications`: Links `jobs` to `candidates`. Includes `status` enum (applied, reviewing, interview, shortlisted, hired, rejected) and `resume_snapshot_url`.
*   `landing_pages`: Generates private, shareable UUID tokens for off-platform sourcing.
*   `transactions`: Logs payments and credit purchases.

## 5. Core Business Logic & Monetization (From PDF)
The platform is heavily monetized via micro-transactions. The AI must account for these paywalls and features in future development:

### 💼 Employer Monetization & Features
*   **Job Posting:** Costs `job_credits` (e.g., 199 AED / job).
*   **Featured Jobs:** Upgrading a job for higher visibility (49 - 79 AED).
*   **CV Database Access:** Employers cannot see candidate contact info unless they have an active subscription (699 - 2999 AED/mo) or pay a one-time unlock fee (15 AED / candidate).
*   **Private Landing Pages:** Creating hidden job links that bypass the public board.

### 👤 Candidate Monetization & Features
*   **Priority Apply:** Pay 5 AED to bump an application to the top of the employer's list.
*   **Auto-Apply Service:** Bot applies to matching jobs automatically (49 - 149 AED/mo).
*   **Profile Boost:** Rank higher in employer candidate searches (29 - 79 AED).
*   **AI CV Analysis & Pro Review:** Paid services to parse and optimize CVs for ATS (25 - 75 AED).

## 6. Known Technical Debt & Critical Bugs
*   **Private Apply RPC Bug:** The `upsert_private_candidate` Postgres function attempts to insert directly into `public.profiles` with a random UUID. This violates the Foreign Key constraint to `auth.users`. **Fix needed:** Use Supabase Admin Auth API via a Next.js Server Action to create guest users safely.
*   **Mocked Data:** The Candidate Dashboard, Employer Kanban Board (`app/employer/applicants`), and Candidate Search (`app/employer/candidates`) currently map over hardcoded JS arrays. These must be replaced with Supabase queries.
*   **Match Score & Competition Algorithm:** Currently using `Math.random()` and string-length math. Needs a real Postgres function comparing `candidate.skills` to `job.skills_required`.
*   **View Counting:** Increments are happening directly in Server Components, which fails due to Next.js caching. Needs to be moved to Client-side `useEffect` API calls.

## 7. AI Development Roadmap & Action Plan
When asked to develop or fix a feature, follow this priority order:

1.  **Phase 1: DB Schema & Auth Fixes.** Ensure the database perfectly matches the PDF requirements (Add Emirates ID, Nafis, Visa Expiry to `candidates`). Fix the guest application RPC bug. Add `saved_jobs` and `saved_candidates` tables.
2.  **Phase 2: UI/UX Migration (RTL & Theme).** Convert the current App Router layouts to support RTL (Arabic). Apply the Navy/Gold CSS variables to Shadcn components. Translate the provided HTML templates into React components.
3.  **Phase 3: Wire up Data (Remove Mocks).** Replace all static arrays in dashboards and search pages with Server Actions / Supabase SSR queries.
4.  **Phase 4: Match Engine & AI.** Build the logic for `Match Score: 85%` by comparing JSONB skills. Wire the CV upload component to the actual N8N webhook.
5.  **Phase 5: Payments (Stripe/PayTabs).** Build the `transactions` API. Create checkout sessions for Priority Apply, Job Credits, and CV unlocks.

## 8. Rules for the AI Agent
*   **Server Components First:** Default to React Server Components (`async function Page()`) and fetch data using `@supabase/ssr` on the server.
*   **Client Components:** Only use `"use client"` for interactivity (forms, modals, hooks, state).
*   **TypeScript:** Always use strict typing. Reference `lib/types.ts` for database shapes.
*   **Styling:** Use Tailwind CSS. Utilize `cn()` utility from `lib/utils.ts` for conditional class merging.
*   **Security:** Respect RLS. Do not expose `NEXT_PUBLIC_SUPABASE_ANON_KEY` to sensitive mutations; rely on authenticated user context.
