# 🔄 GrowthNexus — User Flow Testing Guide

> **Last Updated:** 13 May 2026 — 07:50 AM
> **Source of Truth:** GitNexus (2731 symbols, 130 flows) + `full.sql` (26 tables, 16 RPCs)
> **Instructions:** Test each flow in order. Mark ✅ for working, ❌ for broken.
> Items marked 🔗 use **n8n webhooks** — they work with mock data if n8n is offline.
> Items marked 🔒 require **company verification** — only verified employers can access.

---

## Flow 1: Employer Registration & Setup

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Click "Create Account" | `/register` | Registration form appears | |
| 2 | Fill: name, email, password, select "Employer" | | Form accepts data | |
| 3 | Submit registration | | Redirect to `/register/employer` (7-Step Wizard) | |
| 4 | Step 1: Account Data | | Name & Job Title | |
| 5 | Step 2: Entity Type | | Gov, Semi-gov, Private, Recruitment Agency | |
| 6 | Step 3: Industry | | Main sector and sub-sector | |
| 7 | Step 4: Company Data | | License, Employee count, City, Contact info | |
| 8 | Step 5: Email Verification | | Domain match check (or skipped if generic) | |
| 9 | Step 6: Document Upload | | Upload Trade License (stored in `company_documents`) | |
| 10 | Step 7: Pending Approval | | Redirect to dashboard with `VerificationBanner` | |
| 11 | Dashboard limited access | `/employer/dashboard` | Cannot publish jobs or see candidates until verified | |
| 12 | 🔒 Post Job button shows lock icon | `/employer/dashboard` | "التوثيق مطلوب للنشر" instead of CTA | |
| 13 | 🔒 Candidates page blocked | `/employer/candidates` | `VerificationLockServer` full-page block | |
| 14 | 🔒 Messages page blocked | `/employer/messages` | `VerificationLock` full-page block | |
| 15 | 🔒 Saved candidates blocked | `/employer/saved-candidates` | `VerificationLock` full-page block | |

---

## Flow 2: Post a Job (with AI Assistant)

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Click "Post New Job" | `/employer/jobs/new` | 3-step wizard | |
| 2 | Enter title: "Frontend Developer" | | Field fills | |
| 3 | Select type: "Full-time" | | Selection set (from `job_type` enum) | |
| 4 | Select location: "Dubai" from dropdown | | UAE city selected (12 cities from `system_config`) | |
| 5 | 🔗 Click "✨ AI Assistant" | | Description + requirements auto-filled | |
| 6 | Add skills: type "React" + Enter | | Tag appears (stored in `skills_required` array) | |
| 7 | Select nationality: "All Nationalities" | | Button selected (from `system_config`) | |
| 8 | Enter salary: 15,000 – 25,000 AED | | Currency shows AED | |
| 9 | 🔒 Next → Review → Publish | | **Blocked if unverified** — can only save draft | |
| 9a| ✅ Next → Review → Publish (verified) | | Redirect to job list | |
| 10 | Verify job shows as "Active" | `/employer/jobs` | Job card visible ✅ | |
| 11 | Verify `search_vector` populated | | Full-text search works | |

---

## Flow 3: Job Management

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | ⏸ Pause a job | Status → "paused" (from `job_status` enum) | |
| 2 | ▶ Resume job | Status → "active" | |
| 3 | 📋 Duplicate job | New draft job created | |
| 4 | 🔗 Share job | "Link copied" message | |
| 5 | Use tab filters: All / Active / Paused / Draft / Closed | List filters | |
| 6 | Use sort: Newest / Oldest / Most Applicants | Order changes | |
| 7 | Job views counter increments on visit | `increment_job_views` RPC called | |

---

## Flow 4: Candidate Registration & CV Upload

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Register as candidate | `/register` | Select "Job Seeker" | |
| 2 | Go to profile | `/candidate/profile` | Profile form | |
| 3 | Fill: name, phone, location, skills | | Fields save | |
| 4 | Fill UAE fields: candidate_type, nationality, emirate | | UAE-specific fields save | |
| 5 | Upload CV (PDF) | `/candidate/cv` | File uploads to `resumes` bucket | |
| 6 | 🔗 AI auto-parses CV | | Skills + experience extracted to `resume_parsed_data` | |
| 7 | Check dashboard | `/candidate/dashboard` | Stats cards display | |

---

## Flow 5: Browse Jobs & Apply

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Browse jobs | `/jobs` | Job list with search + filters | |
| 2 | Confidential jobs show entity type | | "جهة حكومية" / "جهة خاصة" (not company name) | |
| 3 | Click a job | `/jobs/[slug]` | Full detail page | |
| 4 | View count increments | | `views_count` +1 via RPC | |
| 5 | Click "Apply Now" | | Apply modal opens | |
| 6 | Confirm application | | "Applied successfully" message | |
| 7 | `resume_snapshot_url` saved | | CV URL frozen at time of application | |
| 8 | 🔗 Application notification sent | | Employer gets in-app notification | |
| 9 | 🔗 Match score calculated | | Score badge appears (via `calculate_match_score` or AI) | |
| 10 | Check my applications | `/candidate/applications` | Job listed | |
| 11 | Duplicate application blocked | | `unique(job_id, candidate_id)` constraint | |

---

## Flow 6: AI Interview

> **Prerequisite:** Job must have `auto_interview = true`

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | After applying, click "Start AI Interview" | `/candidate/interview/[appId]` | Interview page loads | |
| 2 | 🔗 Questions load | | 5 AI-generated questions | |
| 3 | Answer question 1 (20+ characters) | | Character counter shows | |
| 4 | Click "Next" for each question | | Progress bar fills | |
| 5 | Submit all 5 answers | | Loading... | |
| 6 | 🔗 AI evaluates answers | | Score + per-question feedback | |
| 7 | Results saved via `save_interview_result` RPC | | `interview_score` + `interview_report` on application | |
| 8 | View results page | | Percentage + recommendation | |
| 9 | Return to same URL | | Saved results (no re-take) | |

---

## Flow 7: Employer Reviews Applicants

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Go to job applicants | `/employer/jobs/[id]/applicants` | 7-column Kanban pipeline | |
| 2 | View candidate cards | | Cards in "Applied" (تم التقديم) column | |
| 3 | `applicants_count` auto-calculated | | Trigger updates job count | |
| 4 | If interviewed, see score badge | | Score number on card | |
| 5 | Move to "قيد المراجعة" (Reviewing) | | Card moves, status updated | |
| 6 | Move to "في القائمة القصيرة" (Shortlisted) | | Card moves | |
| 7 | Move to "مقابلة" (Interview) | | Card moves | |
| 8 | Move to "مرفوض" (Rejected) | | **Confirmation popup** | |
| 9 | Select rejection reason + confirm | | Card moves, `rejection_reason` saved (7 options) | |
| 10 | Move to "عرض وظيفي" (Offer) | | **Contract generation dialog opens** (salary, start date, template) 🆕 | |
| 11 | Fill contract details + generate | | Contract created in `contracts` table | |
| 12 | Move to "تم التعيين" (Hired) | | Final status | |

---

## Flow 8: Committee Evaluation

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Go to evaluation page | `/employer/evaluate/[appId]` | Scorecard loads | |
| 2 | See candidate name + job | | Correct info | |
| 3 | Rate 5 criteria (sliders 1-10): | | |
| | - Technical Skills | | Number updates | |
| | - Communication | | Number updates | |
| | - Work Experience | | Number updates | |
| | - Cultural Fit | | Number updates | |
| | - Overall Rating | | Number updates | |
| 4 | Add notes (optional) | | Text accepted | |
| 5 | Submit evaluation | | "Evaluation saved" — `committee_evaluations` row created | |
| 6 | Verify `unique(application_id, evaluator_id)` | | Can't submit twice | |
| 7 | Login as 2nd evaluator, rate same person | | 2nd evaluation saves | |
| 8 | 🔗 Committee summary auto-generated | | Average + recommendation → `committee_summary` on application | |

---

## Flow 9: Contract Generation & Tracking

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Move applicant to "Offer" status | | Contract generate button appears | |
| 2 | Select template (MOHRE or custom) | | Template from `contract_templates` | |
| 3 | Generate contract | | Contract created in `contracts` table | |
| 4 | 🔗 `contract_created` n8n event fires | | Event fired via main workflow Switch node ✅ |
| 5 | Go to contract tracking | `/employer/contracts/track` | Contract list loads | |
| 6 | Send contract to candidate | | Status → "sent", `sent_at` timestamp | |
| 7 | 🔗 `contract_sent` n8n event fires | | Event fired via main workflow Switch node ✅ |
| 8 | Download contract PDF | | PDF file downloads (Arabic fonts) | |

---

## Flow 10: Candidate Contract Portal

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Login as candidate with pending contract | | | |
| 2 | Click "العقود" in sidebar | `/candidate/contracts` | Contract list | |
| 3 | Click on a contract | `/candidate/contracts/[id]` | Contract details + rendered HTML | |
| 4 | Download PDF | | PDF downloads via `/api/contracts/pdf/[id]` | |
| 5 | Click "Accept & Sign" | | Confirmation modal | |
| 6 | Confirm signature | | Status → "signed", `signed_at` set | |
| 7 | 🔗 `contract_signed` n8n event fires | | Event fired via main workflow Switch node ✅ |
| 8 | **OR** Click "Decline" | | Reason modal | |
| 9 | Enter reason + confirm | | Status → "declined", `decline_reason` saved | |
| 10 | 🔗 `contract_declined` n8n event fires | | Event fired via main workflow Switch node ✅ |

---

## Flow 11: Analytics & Emiratisation

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Go to analytics | `/employer/analytics` | KPI cards load | |
| 2 | View: total applications, interviews, offers, hire rate | | Numbers from DB | |
| 3 | View rejection reasons analysis | | Chart or list (7 predefined reasons) | |
| 4 | Go to forecasting widget | | 7 live metrics from DB | |
| 5 | Go to emiratisation | `/employer/emiratisation` | 6-tab dashboard | |
| 6 | View: total employees, nationals, ratio, target | | Numbers + MOHRE gauge | |
| 7 | Fill emiratisation profile form | | Data saves to `emiratisation_profiles` | |
| 8 | Change tracked in audit log | | `emiratisation_audit_log` row created | |
| 9 | Export PDF report | | PDF generates (needs seeded data) | |

---

## Flow 12: Stripe Subscription

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Go to pricing | `/pricing` | 3 plans + features | |
| 2 | Note: prices NOT visible (features only) | | No AED amounts shown | |
| 3 | Click "Choose Plan" on Pro | | Redirect to Stripe Checkout | |
| 4 | Use test card: `4242 4242 4242 4242` | | Payment succeeds | |
| 5 | Redirect to `/payment/success` | | Success page with buttons | |
| 6 | Check DB: `subscription_tier` + `stripe_customer_id` updated | | In `companies` table | |
| 7 | Settings → Billing Portal | | Stripe Portal opens | |

---

## Flow 13: Admin Panel

> **Setup:** `UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';`

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Login as admin | `/login` | Redirect to `/admin/dashboard` | |
| 2 | Dashboard | `/admin/dashboard` | KPI: users, companies, jobs, apps | |
| 3 | Users management | `/admin/users` | Search + role filter + inline change | |
| 4 | Companies verification | `/admin/companies` | Update `verification_status` and `risk_score` | |
| 4a| Check Audit Log | | API records changes in `company_verification_log` | |
| 5 | Jobs moderation | `/admin/jobs` | Feature/close jobs | |
| 6 | System config | `/admin/config` | Inline edit settings (grouped) | |
| 7 | Transactions | `/admin/transactions` | Payment history + revenue | |

---

## Flow 14: Messages

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | 🔒 As unverified employer, go to messages | `/employer/messages` | `VerificationLock` blocks page | |
| 1a| As verified employer, go to messages | `/employer/messages` | Conversation list | |
| 2 | Start conversation with candidate | | Message field appears | |
| 3 | Send message | | Message shows in chat | |
| 4 | Unread count updates automatically | | `update_unread_counts` trigger fires | |
| 5 | As candidate, check messages | `/candidate/messages` | Employer message visible | |
| 6 | Reply | | Conversation updates | |
| 7 | 🔒 API: `POST /api/conversations/start` (unverified) | | Returns 403 with verification message | |

---

## Flow 15: Landing Pages

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Go to landing pages | `/employer/landing-pages` | Page list | |
| 2 | Create new page | `/employer/landing-pages/new` | Builder form | |
| 3 | View public page via shared link | `/apply/[token]` | Landing page works | |
| 4 | Candidate applies via landing page | | Application with `source = 'landing_page_token'` | |
| 5 | `views_count` increments | | `increment_landing_page_views` RPC | |
| 6 | Hidden job created for tracking | | `get_or_create_private_job` RPC | |

---

## Flow 16: Team Management

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Go to team page | `/employer/team` | Team member list | |
| 2 | Invite member by email | | `company_members` row with status=pending | |
| 3 | Invited user logs in | | Auto-accepted, status → active | |
| 4 | Change member role | | Role updated (owner/admin/member/viewer) | |
| 5 | Remove member | | Row deleted (only owner can) | |
| 6 | Cannot remove self (owner) | | Error message | |
| 7 | Viewer can only read | | Write operations blocked | |

---

## Flow 17: Notifications

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | NotificationBell visible in navbar | | Bell icon with unread count | |
| 2 | New application triggers notification | | `create_notification` RPC fires | |
| 3 | Click bell → dropdown | | Recent notifications listed | |
| 4 | Click notification → mark as read | | `is_read = true` via PATCH | |
| 5 | API: `GET /api/notifications` | | Returns unread notifications | |
| 6 | API: `PATCH /api/notifications` | | Marks notifications as read | |

---

## Contract Expiry Cron (Auto)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | Cron runs daily at 06:00 UTC | `/api/cron/contract-expiry` | |
| 2 | Contracts with status "sent" + `expires_at` passed | | Status → "expired" | |
| 3 | Bearer token `CRON_SECRET` required | | Unauthorized without token | |
| 4 | ⚠️ Set `CRON_SECRET` in Vercel dashboard | | Currently unset | |

---

## Test Card (Stripe)

| Field | Value |
|-------|-------|
| Card Number | `4242 4242 4242 4242` |
| Expiry | Any future date |
| CVC | Any 3 digits |
| ZIP | Any number |

---

## Admin Setup

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

## N8N Webhook Summary

| # | Webhook | Path | Used In | Status |
|---|---------|------|---------|--------|
| 1 | CV Parser | `/webhook/gn-cv-parser` | CV upload | ✅ |
| 2 | AI Job Description | `/webhook/gn-ai-job-description` | Job wizard | ✅ |
| 3 | Match Score | `/webhook/gn-match-score` | Application submission | ✅ |
| 4 | Interview Questions | `/webhook/gn-interview-questions` | AI interview | ✅ |
| 5 | Interview Evaluation | `/webhook/gn-interview-eval` | Answer scoring | ✅ |
| 6 | App Notification | `/webhook/gn-application-notify` | New application | ⚠️ Partial |
| 7 | Smart Matching | `/webhook/gn-smart-match` | Candidate search | ❌ |
| 8 | Message Notification | `/webhook/gn-message-notify` | Chat messages | ❌ |
| 9 | Payment Verification | `/webhook/gn-payment-verify` | Payment fulfillment | ❌ |
| 10 | Company Verification | `/webhook/gn-company-verify` | Trade license OCR | ✅ |
| 11 | Committee Summary | `/webhook/gn-committee-summary` | Panel evaluation | ✅ |
| 12 | Contract Notifications | (direct fetch) | Contract lifecycle | ✅ |
| 13 | Contract Generation | `/webhook/gn-contract-gen` | Contract PDF | 🔧 Code Ready |
| 14 | External Jobs Import | `/api/external-jobs` | Scraped job import | 🔧 Code Ready |
| 15 | CV Parse (Optimizer) | `/webhook/gn-cv-parse` | CV Optimizer upload | ✅ 🆕 |
| 16 | CV Optimize | `/webhook/gn-cv-optimize` | AI chat + CV rewrite | ✅ 🆕 |
| 17 | CV ATS Convert | `/webhook/gn-cv-ats-convert` | PDF/Text → ATS-ready CV | ✅ 🆕 |

> **Note:** All webhooks work with mock/fallback data when n8n is offline.
> **CV Parse (#15), CV Optimize (#16), and CV ATS Convert (#17) are separate dedicated workflow files.**

---

## Flow 18: Verification Enforcement Gate Testing 🔒

> **Added:** 12 May 2026 — Tests the enforcement gating system

### 18.1 Unverified Employer (status: `under_review` or `pending_verification`)

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Register new employer | `/register/employer` | Company created with `under_review` status | |
| 2 | Dashboard header CTA | `/employer/dashboard` | Lock icon + "التوثيق مطلوب للنشر" (no Post Job button) | |
| 3 | Empty state CTA | `/employer/dashboard` | "حفظ مسودة وظيفة" (outline button, no Publish) | |
| 4 | Navigate to New Job | `/employer/jobs/new` | Form loads, Publish button hidden | |
| 5 | Fill job form + save | `/employer/jobs/new` | Draft saved (status: `draft`) | |
| 6 | Navigate to candidates | `/employer/candidates` | `VerificationLockServer` — full page blocked | |
| 7 | Navigate to saved candidates | `/employer/saved-candidates` | `VerificationLock` — full page blocked | |
| 8 | Navigate to messages | `/employer/messages` | `VerificationLock` — full page blocked | |
| 9 | API: `POST /api/conversations/start` | | 403 response: verification required | |
| 10 | Direct URL to `/employer/candidates` | | Still blocked (server-side check) | |

### 18.2 Rejected Employer (status: `rejected`)

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Set company `verification_status` = `rejected` | DB | | |
| 2 | Navigate to New Job | `/employer/jobs/new` | Full page lock — cannot even save draft | |
| 3 | All gated pages blocked | All | Same as unverified but with rejection message | |

### 18.3 Verified Employer (status: `verified` or `trusted`)

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Set company `verification_status` = `verified` via admin | DB | | |
| 2 | Dashboard header CTA | `/employer/dashboard` | Full "أنشر وظيفة" button visible | |
| 3 | Navigate to New Job + Publish | `/employer/jobs/new` | Publish button active, job goes live | |
| 4 | Navigate to candidates | `/employer/candidates` | Candidate search loads normally | |
| 5 | Navigate to messages | `/employer/messages` | Chat interface loads | |
| 6 | Navigate to saved candidates | `/employer/saved-candidates` | Saved list loads | |
| 7 | API: `POST /api/conversations/start` | | Conversation created successfully | |

---

## Flow 19: Smart Candidate Suggestions (AI Match Engine) ✨

> **Added:** 12 May 2026 — Documents how suggested candidates on employer dashboard are sourced

### Data Pipeline

```
Candidate signs up → Fills profile (headline, skills[], city) → is_public = true
                                          ↓
Employer posts jobs → skills_required[] set on each job
                                          ↓
Dashboard server query:
  1. Collect all skills_required from company's jobs
  2. Query candidates WHERE is_public = true AND skills IS NOT NULL (limit 50)
  3. Calculate Jaccard similarity: matched_skills ÷ union_of_skills × 100
  4. Sort by match % descending → return top 5
```

### Test Steps

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Register as candidate | `/register` | Select "Job Seeker" | |
| 2 | Fill profile: name, headline, skills | `/candidate/profile` | Skills saved to `candidates.skills[]` | |
| 3 | Set `is_public = true` (default) | | Candidate discoverable | |
| 4 | Login as employer (verified) | `/employer/dashboard` | Dashboard loads | |
| 5 | Post job with `skills_required` | `/employer/jobs/new` | e.g., ["React", "TypeScript"] | |
| 6 | Return to dashboard | `/employer/dashboard` | "مرشحون مقترحون" section | |
| 7 | Matching candidates appear | | Real names from DB, match % calculated | |
| 8 | No jobs = empty state | | "أنشر وظائف لاقتراح مرشحين مطابقين" shown | |
| 9 | No matching skills = empty state | | Same empty state message | |
| 10 | Candidate sets `is_public = false` | | Candidate hidden from suggestions | |

### Key Details

- **Source:** Real users from `candidates` table joined with `profiles` for names
- **NOT mock data** — previously was hardcoded (سارة ك., محمد أ.), replaced 12 May 2026
- **Scoring:** Jaccard similarity (intersection ÷ union of skill sets)
- **Limit:** Top 5 candidates, max 50 queried per request
- **Privacy:** Only `is_public = true` candidates shown
- **Skills displayed:** Up to 4 skills per candidate card

---

## Database Tables Reference (from full.sql)

| Table | Rows Policy | Key Columns |
|-------|-------------|-------------|
| `profiles` | User = own | email, role, credits_balance, stripe_customer_id |
| `companies` | Public read | name, slug, company_type, stripe_*, subscription_* |
| `candidates` | Public if is_public | skills[], candidate_type, UAE fields (12 cols) |
| `jobs` | Public if active | search_vector, skills_required[], nationality_requirements[] |
| `applications` | Candidate own + employer | status (7 values), interview_score, committee_summary |
| `saved_jobs` | Candidate own | job_id, candidate_id |
| `saved_candidates` | Employer own | employer_id, candidate_id |
| `conversations` | Participants only | unread_count_1/2, last_message |
| `messages` | Conversation participants | sender_id, is_read |
| `landing_pages` | Owner + public read | token (unique URL), views_count |
| `transactions` | User own | amount, currency (AED), provider_id |
| `system_config` | Non-secret = public | key-value pairs (pricing, cities, nationalities, rejections) |
| `committee_evaluations` | Evaluator own + employer | scores (JSONB), total_score |
| `contract_templates` | System + own | html_content, MOHRE default |
| `contracts` | Company members + **candidate RLS** 🆕 | status (6 states), salary, sent/signed/declined timestamps. Candidate: SELECT own + UPDATE to viewed/signed/declined |
| `emiratisation_profiles` | Company owner/members | 7 workforce fields, MOHRE registration |
| `emiratisation_audit_log` | Company owner/members | field_name, old_value, new_value |
| `company_members` | Own rows + owner | role (4 values), status, invited_email |
| `notifications` | User own | type, title, body, data (JSONB) |
| `cv_unlocks` | Employer own | employer_id, candidate_id |
| `company_documents` | Employer own + admin | trade licenses, status |
| `company_verification_log`| Employer read + admin | tracking admin approvals and status changes |
| `company_blacklist` | Admin only | blocked domains and licenses |
| `external_jobs` | Anon(public) + Auth(all levels) | scraped jobs, source_platform, access_level, clicks/views |
| `cv_sessions` | User own | CV session tracking, session_type, language, linked_to_profile 🆕 |
| `cv_chat_messages` | User own | CV optimizer chat history, sender (user/ai/system) 🆕 |

---

## Flow 20: External Jobs Aggregator 🌐

> **Added:** 12 May 2026 — Tests the external jobs import, display, and management flow

### 20.1 API Import (n8n → GrowthNexus)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | POST `/api/external-jobs` without secret | 401 Unauthorized | |
| 2 | POST with valid secret + 1 job | `{"success": true, "imported": 1}` | |
| 3 | POST same job again (same `external_id` + `source_platform`) | `{"updated": 1}` (upsert, no duplicate) | |
| 4 | POST with missing `title` or `source_url` | Error in `errors[]` array | |
| 5 | POST batch of 5 jobs | `{"imported": 5, "total": 5}` | |

### 20.2 Public Display (/jobs Feed)

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Visit `/jobs` as anonymous | `/jobs` | External jobs appear every 5th card with blue badge | |
| 2 | Blue badge shows source platform | | e.g., "LinkedIn", "Bayt.com" | |
| 3 | Filter sidebar: select "LinkedIn" | | Only LinkedIn external jobs + all internal jobs | |
| 4 | Filter sidebar: select "من المنصة فقط" | | Only internal platform jobs | |
| 5 | Click external job card | | Opens `/jobs/external/[slug]` detail page | |

### 20.3 External Job Detail Page

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | View external job detail | `/jobs/external/[slug]` | Full job description, company info, source badge | |
| 2 | Click "تقدم على الموقع" (Apply) | | Opens `source_url` in new tab | |
| 3 | Click tracking increments | | `clicks_count` +1 via RPC | |
| 4 | Premium job (not logged in) | | "اشترك للتقديم" → redirects to `/pricing` | |

### 20.4 Admin Management

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Navigate to admin panel | `/admin/external-jobs` | List of all external jobs | |
| 2 | Filter by platform | | Shows only selected platform's jobs | |
| 3 | Toggle access level (public → premium) | | Job now shows lock icon for non-subscribers | |
| 4 | Toggle active/inactive | | Inactive jobs hidden from `/jobs` feed | |
| 5 | Toggle featured | | Featured jobs appear first in feed | |
| 6 | Delete job | | Job removed from database | |

### 20.5 Access Level Gating

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | `access_level = 'public'` + anonymous user | Job visible + Apply button works | |
| 2 | `access_level = 'registered'` + anonymous user | Job NOT visible (hidden by RLS) | |
| 3 | `access_level = 'registered'` + logged-in user | Job visible + Apply button works | |
| 4 | `access_level = 'premium'` + any user | Job visible but Apply locked + "اشترك" CTA | |

### Key Details

- **Source:** `external_jobs` table (separate from `jobs`)
- **Auth:** `N8N_WEBHOOK_SECRET` header or body field
- **Dedup:** `UNIQUE(source_platform, external_id)` prevents duplicates
- **Merge:** External jobs interleaved every 5th position in `/jobs` feed
- **Tracking:** `increment_external_job_clicks` + `increment_external_job_views` RPCs
- **Admin:** Full CRUD at `/admin/external-jobs`
- **Guide:** See `N8N_EXTERNAL_JOBS_WORKFLOW_GUIDE.md` for n8n build instructions

---

## Flow 21: CV Optimizer (AI Chat + PDF Rewrite) 🧠

> **Added:** 13 May 2026 — Tests the full CV optimization workflow with AI chat, PDF generation, session management, and profile linking

### 21.1 Upload & Parse

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Navigate to CV Optimizer | `/candidate/cv/optimize` | Page loads with upload area | |
| 2 | Upload PDF file | | File uploaded to n8n via `/api/cv/parse` | |
| 3 | 🔗 n8n `/gn-cv-parse` fires | | PDF downloaded → text extracted → Gemini parse → cv_session created | |
| 4 | PDF viewer shows document | | Left panel displays uploaded PDF | |
| 5 | AI chat shows parsed summary | | Right panel shows initial AI response about parsed CV | |
| 6 | cv_session created in DB | | `session_type: optimize`, `status: active`, `language` set | |

### 21.2 AI Chat & Optimization

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Type chat message (general question) | | AI responds in user's language (no CV modification) | |
| 2 | Type modification request (e.g., "حسن قسم المهارات") | | AI rewrites CV HTML + generates new PDF via Gotenberg | |
| 3 | 🔗 n8n `/gn-cv-optimize` fires | | Credit check → Gemini LLM → Gotenberg PDF → session update | |
| 4 | PDF viewer updates | | New optimized PDF displayed in left panel | |
| 5 | Chat history preserved | | All messages visible in chat panel | |
| 6 | Page reload preserves chat | | Chat history loaded from `cv_sessions.chat_history` JSONB | |

### 21.3 Session Management

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Session history table visible | | Table below chat/PDF shows all user's sessions | |
| 2 | Resume any session (any status) | | Click "استئناف" → session loads in viewer (works for active, ready, downloaded, archived) | |
| 3 | Switch between sessions | | Previous session returns to table automatically (no disappearing) | |
| 4 | Delete stale session | | Click "حذف" → inline confirm ("تأكيد الحذف" / "إلغاء") → session removed from DB + UI | |
| 5 | RLS DELETE policy | | `20260513043300` migration: users can only delete own sessions | |

### 21.4 Finalize & Link

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Click "إنهاء وتحميل" | | PDF downloads to user's device | |
| 2 | Click "استخدم هذه السيرة في ملفي" | | `cv_link_to_profile()` RPC fires | |
| 3 | Profile updated | | `candidates.resume_url` updated to optimized PDF URL | |
| 4 | Session marked as linked | | `cv_sessions.linked_to_profile = true` | |
| 5 | Previous linked sessions unlinked | | Only latest session is `linked_to_profile = true` | |
| 6 | Page refresh shows latest CV | | Optimizer loads the linked session’s PDF, not original | |

### 21.5 Credit System

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | `cv_services_free_mode = true` | No credits deducted | |
| 2 | `cv_services_free_mode = false` + user has `credits_cv` | Deduct from `credits_cv` first | |
| 3 | `credits_cv = 0` + user has `credits_balance` | Fallback to `credits_balance` | |
| 4 | Both credits = 0 | Error message: insufficient credits | |

### Key Details

- **Route:** `/candidate/cv/optimize`
- **API Routes:** `/api/cv/parse` → `/api/cv/optimize`
- **n8n Workflows:** `gn-cv-parse` (parse) + `gn-cv-optimize` (chat/modify)
- **DB Tables:** `cv_sessions` (session tracking) + `cv_chat_messages` (deprecated, using chat_history JSONB)
- **PDF Engine:** Gotenberg (HTML → PDF conversion)
- **Language:** CV content always English, chat replies in user's language
- **Credits:** `deduct_cv_credits()` RPC with dual-balance fallback
- **Migrations:** `20260513035100` (status fix + chat_history), `20260513041200` (cleanup), `20260513043200` (dedup linked), `20260513043300` (DELETE RLS policy)

---

## Flow 22: CV Builder → ATS Convert → Optimizer Flow 🔄

> **Added:** 13 May 2026 — Tests the direct generation flow from CV Builder to AI Optimizer

### 22.1 ATS Conversion

| # | Step | Route | Expected | Result |
|---|------|-------|----------|---------|
| 1 | Navigate to CV Builder | `/candidate/cv/builder` | Page loads with upload tab | |
| 2 | Upload PDF or paste text | | Content sent to n8n `/gn-cv-ats-convert` | |
| 3 | 🔗 n8n ATS Convert fires | | Gemini reformat → Gotenberg PDF → Supabase Storage upload | |
| 4 | Success view shows download + optimize buttons | | Two CTAs: “تحميل” and “تحسين بالذكاء الاصطناعي” | |

### 22.2 Direct-to-Optimizer Flow

| # | Step | Route | Expected | Result |
|---|------|-------|----------|---------|
| 1 | Click “تحسين بالذكاء الاصطناعي” | `/candidate/cv/optimize?sourceSessionId=xxx` | Auto-navigates to optimizer with session ID | |
| 2 | Server-side PDF fetch (CORS bypass) | | Backend fetches PDF from n8n storage via `parseCvFromUrl` | |
| 3 | Auto-trigger parse | | `handleUseExisting()` fires automatically, no manual button click needed | |
| 4 | CV loads in optimizer | | PDF viewer shows ATS-converted CV, AI chat ready | |
| 5 | Old sessions NOT auto-resumed | | Fresh `sourceSessionId` takes priority over any stale session | |

### Key Details

- **n8n Workflow:** `gn-cv-ats-convert` — separate dedicated workflow file
- **Filename Convention:** `CV_{userId}.pdf` for consistent naming in Supabase storage
- **CORS Solution:** Server-side PDF fetch via `/api/cv/parse` with `sourceUrl` parameter
- **Session Linking:** `sourceSessionId` query param connects builder output to optimizer input
- **RLS:** DELETE policy added via `20260513043300` migration
