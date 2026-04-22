# GrowthNexus - Complete Project Specification

## 1. Project Overview
GrowthNexus is an advanced AI-first Recruitment Operating System (SaaS) specifically designed for the UAE market. It connects employers (Government, Semi-Government, and Private Entities) with candidates using AI-driven matching, screening, and process automation. The platform evolves beyond a traditional job board by offering a complete end-to-end hiring workflow.

## 2. Technology Stack & Architecture
- **Frontend & Backend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui.
- **Database & Authentication:** Supabase (PostgreSQL, Row Level Security, Storage, Auth).
- **Automation & Orchestration:** n8n (Webhooks, API integrations, data processing).
- **AI Models:** Gemini / OpenAI (accessed via n8n and API routes for parsing, scoring, and content generation).
- **Payments:** EdfaPay (or Stripe/PayTabs) for processing SaaS subscriptions and one-time payments.

## 3. The 6 Core SaaS Modules (Pillars)
GrowthNexus will be structured around 6 foundational modules to justify the B2B SaaS pricing model:

1. **Interview AI System:**
   - Automatically generates interview questions tailored to the job description, seniority, and industry.
   - Evaluates text or voice responses from candidates.
   - Provides an AI-generated scorecard and hiring recommendation.
2. **Candidate Evaluation Committee:**
   - Multi-user dashboard for hiring panels.
   - Standardized scorecards for evaluating candidates.
   - AI highlights discrepancies in committee scoring and generates a final executive summary.
3. **Offer & Contract Automation:**
   - Dynamic generation of Offer Letters and UAE Ministry of Human Resources (MOHRE) aligned employment contracts using secure templates.
   - Integration with E-signature services.
   - Status tracking (Sent, Viewed, Signed, Declined).
4. **Analytics & KPI Dashboard:**
   - Executive-level metrics.
   - Tracks Time-to-Fill, Source of Hire, Offer Acceptance Rates, and pipeline bottlenecks.
5. **Forecasting Engine:**
   - AI predictive modeling.
   - Predicts how long a job will take to fill, the probability of a candidate accepting an offer, and future hiring demands based on historical data.
6. **Emiratisation Engine (UAE Specific):**
   - Real-time tracking of Emiratisation ratios against company size.
   - NAFIS integration readiness.
   - Automated matching of UAE National talent to help companies meet mandatory MOHRE targets.

## 4. n8n Workflows & Webhooks Directory
All heavy processing, AI communication, and cross-platform integrations are handled via n8n webhooks.

### Implemented / Core Webhooks:
1. **CV Parser (`gn-cv-parser`)**
   - *Trigger:* Candidate uploads a PDF CV.
   - *Action:* Downloads PDF, sends to AI to extract skills, experience, education, and summary into a structured JSON. Updates the `candidates` table in Supabase.
2. **Match Score Calculator (`gn-match-score`)**
   - *Trigger:* System loads job cards or employer views applications.
   - *Action:* Calculates a weighted percentage score based on skills overlap, experience, and location match.
3. **Application Notification (`gn-application-notify`)**
   - *Trigger:* Candidate applies to a job.
   - *Action:* Sends a confirmation email to the candidate and an alert email/notification to the employer.
4. **Smart Candidate Matching (`gn-smart-match`)**
   - *Trigger:* Employer clicks "Find Best Candidates".
   - *Action:* Queries the database for public candidates, scores them against job requirements, and returns the top 10 matches.
5. **Message Notification (`gn-message-notify`)**
   - *Trigger:* A new chat message is sent in the internal messaging system.
   - *Action:* Looks up recipient preferences and dispatches email/push notifications.
6. **Payment Verification (`gn-payment-verify`)**
   - *Trigger:* Redirect callback from the payment gateway.
   - *Action:* Verifies the transaction ID. Fulfills the purchase (e.g., adds job credits, boosts a profile, upgrades subscription).

### New Webhooks Required for SaaS Modules:
7. **Company Verification (`gn-company-verify`)**
   - *Trigger:* Employer registers without an official corporate email domain.
   - *Action:* Receives Trade License document, runs OCR, extracts registration numbers, and cross-references with UAE registries (NER, Invest in Dubai, TAMM) to assign a Trust Score.
8. **Interview AI Evaluator (`gn-interview-eval`)**
   - *Trigger:* Candidate submits an automated interview response.
   - *Action:* Analyzes response against the rubric, generates a score, and updates the application record.
9. **Committee Summarizer (`gn-committee-summary`)**
   - *Trigger:* Committee finishes voting on a candidate.
   - *Action:* Aggregates the multi-user scores, detects bias or outliers, and generates a cohesive final recommendation paragraph.
10. **Contract Generator (`gn-contract-gen`)**
    - *Trigger:* Employer moves candidate to "Hired/Offer" stage.
    - *Action:* Pulls candidate data and company details, merges them into a legal PDF template, and initiates the e-signature workflow.

## 5. Database Schema Overview (Supabase)
- **`profiles`**: User identity, roles (candidate, employer, admin), contact info.
- **`companies`**: Employer profiles, credits, subscription tiers, verified status, and `company_type` (Government, Semi-Government, Private).
- **`candidates`**: Job seeker profiles, parsed AI data, and UAE-specific fields (Candidate Type: Emirati/Resident, Emirates ID, Visa Status, Notice Period).
- **`jobs`**: Job listings, required skills (array), location, salary ranges, confidentiality flags, and `status` (active, paused, closed, draft).
- **`applications`**: Tracks the connection between candidates and jobs. Includes `status` (applied, reviewing, interview, shortlisted, offer, hired, rejected) and `rejection_reason`.
- **`saved_jobs` & `saved_candidates`**: Bookmarking functionality.
- **`conversations` & `messages`**: Internal chat system for employers and candidates.
- **`landing_pages`**: Private collection URLs for targeted hiring campaigns.
- **`transactions`**: Financial records linked to EdfaPay/Stripe.

## 6. Business & Pricing Model
The platform employs a hybrid pricing strategy to maximize revenue and match UAE market expectations:
- **B2B SaaS (Employers):**
  - Subscriptions: Starter (299 AED/mo), Growth (599 AED/mo), Pro (999 AED/mo), Enterprise (Custom).
  - Add-ons: Advanced Emiratisation Tracking, API Integration, Custom White-Labeling.
- **B2C (Candidates):**
  - One-time purchases: CV Analyzer & Optimizer, Full Application Kit, Salary Negotiation Coach.
  - Subscriptions: AI Interview Coaching, Career Path Generator.
- **UX Strategy:** Pricing is strategically hidden from public marketing pages. It is progressively disclosed when a user initiates a service or enters the checkout funnel.

## 7. Current Project Status
- **Completed (~55%):** Next.js setup, Supabase database schemas, RLS policies, User Auth, Basic Employer Dashboard, Job Posting flow, Public Job Board, Candidate CV Upload, and Application tracking.
- **Pending (~45%):** Transitioning to the SaaS B2B model, implementing the 6 core AI modules, UAE localization (Emiratisation fields, cities dropdown), advanced Employer filtering, and connecting the remaining n8n automation webhooks.
