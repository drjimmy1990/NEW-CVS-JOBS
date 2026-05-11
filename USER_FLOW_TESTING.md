# 🔄 GrowthNexus — User Flow Testing Guide

> **Last Updated:** 11 May 2026
> **Instructions:** Test each flow in order. Mark ✅ for working, ❌ for broken.
> Items marked 🔗 use **n8n webhooks** — they work with mock data if n8n is offline.

---

## Flow 1: Employer Registration & Setup

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Click "Create Account" | `/register` | Registration form appears | |
| 2 | Fill: name, email, password, select "Employer" | | Form accepts data | |
| 3 | Submit registration | | Redirect to `/employer/dashboard` | |
| 4 | Go to company settings | `/employer/settings` | Company form loads | |
| 5 | Fill: company name, industry, description, size | | Fields save | |
| 6 | Upload company logo | | Logo displays | |

---

## Flow 2: Post a Job (with AI Assistant)

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Click "Post New Job" | `/employer/jobs/new` | 3-step wizard | |
| 2 | Enter title: "Frontend Developer" | | Field fills | |
| 3 | Select type: "Full-time" | | Selection set | |
| 4 | Select location: "Dubai" from dropdown | | UAE city selected | |
| 5 | 🔗 Click "✨ AI Assistant" | | Description + requirements auto-filled | |
| 6 | Add skills: type "React" + Enter | | Tag appears | |
| 7 | Select nationality: "All Nationalities" | | Button selected | |
| 8 | Enter salary: 15,000 – 25,000 AED | | Currency shows AED | |
| 9 | Next → Review → Publish | | Redirect to job list | |
| 10 | Verify job shows as "Active" | `/employer/jobs` | Job card visible ✅ | |

---

## Flow 3: Job Management

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | ⏸ Pause a job | Status → "Paused" | |
| 2 | ▶ Resume job | Status → "Active" | |
| 3 | 📋 Duplicate job | New draft job created | |
| 4 | 🔗 Share job | "Link copied" message | |
| 5 | Use tab filters: All / Active / Paused / Draft / Closed | List filters | |
| 6 | Use sort: Newest / Oldest / Most Applicants | Order changes | |

---

## Flow 4: Candidate Registration & CV Upload

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Register as candidate | `/register` | Select "Job Seeker" | |
| 2 | Go to profile | `/candidate/profile` | Profile form | |
| 3 | Fill: name, phone, location, skills | | Fields save | |
| 4 | Upload CV (PDF) | `/candidate/cv` | File uploads | |
| 5 | 🔗 AI auto-parses CV | | Skills + experience extracted | |
| 6 | Check dashboard | `/candidate/dashboard` | Stats cards display | |

---

## Flow 5: Browse Jobs & Apply

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Browse jobs | `/jobs` | Job list with search + filters | |
| 2 | Click a job | `/jobs/[slug]` | Full detail page | |
| 3 | Refresh page | | View count +1 | |
| 4 | Click "Apply Now" | | Apply modal opens | |
| 5 | Confirm application | | "Applied successfully" message | |
| 6 | 🔗 Application notification sent | | Employer gets notified | |
| 7 | 🔗 Match score calculated | | Score badge appears | |
| 8 | Check my applications | `/candidate/applications` | Job listed | |

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
| 7 | View results page | | Percentage + recommendation | |
| 8 | Return to same URL | | Saved results (no re-take) | |

---

## Flow 7: Employer Reviews Applicants

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Go to job applicants | `/employer/jobs/[id]/applicants` | Pipeline columns | |
| 2 | View candidate cards | | Cards in "Applied" column | |
| 3 | If interviewed, see score badge | | Score number on card | |
| 4 | Move to "Reviewing" | | Card moves | |
| 5 | Move to "Shortlisted" | | Card moves | |
| 6 | Move to "Rejected" | | **Confirmation popup** | |
| 7 | Select rejection reason + confirm | | Card moves, reason saved | |
| 8 | Move to "Offer" | | Card moves to offer column | |

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
| 5 | Submit evaluation | | "Evaluation saved" | |
| 6 | Login as 2nd evaluator, rate same person | | 2nd evaluation saves | |
| 7 | 🔗 Committee summary auto-generated | | Average + recommendation | |

---

## Flow 9: Contract Generation & Tracking

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Move applicant to "Offer" status | | Contract generate button appears | |
| 2 | Generate contract | | Contract created in DB | |
| 3 | 🔗 `contract_created` n8n event fires | | Notification sent | |
| 4 | Go to contract tracking | `/employer/contracts/track` | Contract list loads | |
| 5 | Send contract to candidate | | Status → "sent" | |
| 6 | 🔗 `contract_sent` n8n event fires | | Email notification | |
| 7 | Download contract PDF | | PDF file downloads | |

---

## Flow 10: Candidate Contract Portal ⭐ NEW

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Login as candidate with pending contract | | | |
| 2 | Click "العقود" in sidebar | `/candidate/contracts` | Contract list | |
| 3 | Click on a contract | `/candidate/contracts/[id]` | Contract details | |
| 4 | Download PDF | | PDF downloads | |
| 5 | Click "Accept & Sign" | | Confirmation modal | |
| 6 | Confirm signature | | Status → "signed" | |
| 7 | 🔗 `contract_signed` n8n event fires | | Email notification | |
| 8 | **OR** Click "Decline" | | Reason modal | |
| 9 | Enter reason + confirm | | Status → "declined" | |
| 10 | 🔗 `contract_declined` n8n event fires | | Email notification | |

---

## Flow 11: Analytics & Emiratisation

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Go to analytics | `/employer/analytics` | KPI cards load | |
| 2 | View: total applications, interviews, offers, hire rate | | Numbers from DB | |
| 3 | View rejection reasons analysis | | Chart or list | |
| 4 | Go to emiratisation | `/employer/emiratisation` | Gauge + statistics | |
| 5 | View: total employees, nationals, ratio, target | | Numbers + MOHRE alert | |
| 6 | Fill emiratisation profile form | | Data saves | |

---

## Flow 12: Stripe Subscription

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Go to pricing | `/pricing` | 3 plans + features | |
| 2 | Note: prices NOT visible (features only) | | No AED amounts shown | |
| 3 | Click "Choose Plan" on Pro | | Redirect to Stripe Checkout | |
| 4 | Use test card: `4242 4242 4242 4242` | | Payment succeeds | |
| 5 | Redirect to `/payment/success` | | Success page with buttons | |
| 6 | Check DB: `subscription_tier` updated | | In `companies` table | |
| 7 | Settings → Billing Portal | | Stripe Portal opens | |

---

## Flow 13: Admin Panel

> **Setup:** `UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';`

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Login as admin | `/login` | Redirect to `/admin/dashboard` | |
| 2 | Dashboard | `/admin/dashboard` | KPI: users, companies, jobs, apps | |
| 3 | Users management | `/admin/users` | Search + role filter + inline change | |
| 4 | Companies management | `/admin/companies` | Verify/reject companies | |
| 5 | Jobs moderation | `/admin/jobs` | Feature/close jobs | |
| 6 | System config | `/admin/config` | Inline edit settings | |
| 7 | Transactions | `/admin/transactions` | Payment history + revenue | |

---

## Flow 14: Messages

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | As employer, go to messages | `/employer/messages` | Conversation list | |
| 2 | Start conversation with candidate | | Message field appears | |
| 3 | Send message | | Message shows in chat | |
| 4 | As candidate, check messages | `/candidate/messages` | Employer message visible | |
| 5 | Reply | | Conversation updates | |

---

## Flow 15: Landing Pages

| # | Step | Route | Expected | Result |
|---|------|-------|----------|--------|
| 1 | Go to landing pages | `/employer/landing-pages` | Page list | |
| 2 | Create new page | `/employer/landing-pages/new` | Builder wizard | |
| 3 | View public page via shared link | `/apply/[token]` | Landing page works | |

---

## Contract Expiry Cron (Auto)

| # | Step | Expected | Result |
|---|------|----------|--------|
| 1 | Cron runs daily at 06:00 UTC | `/api/cron/contract-expiry` | |
| 2 | Contracts older than 7 days with status "sent" | | Status → "expired" | |
| 3 | Bearer token `CRON_SECRET` required | | Unauthorized without token | |

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

| # | Webhook | Path | Used In |
|---|---------|------|---------|
| 1 | CV Parser | `/webhook/gn-cv-parser` | CV upload |
| 2 | AI Job Description | `/webhook/gn-ai-job-description` | Job wizard |
| 3 | Match Score | `/webhook/gn-match-score` | Application submission |
| 4 | Interview Questions | `/webhook/gn-interview-questions` | AI interview |
| 5 | Interview Evaluation | `/webhook/gn-interview-eval` | Answer scoring |
| 6 | App Notification | `/webhook/gn-application-notify` | New application |
| 7 | Smart Matching | `/webhook/gn-smart-match` | Candidate search |
| 8 | Message Notification | `/webhook/gn-message-notify` | Chat messages |
| 9 | Payment Verification | `/webhook/gn-payment-verify` | Payment fulfillment |
| 10 | Company Verification | `/webhook/gn-company-verify` | Trade license OCR |
| 11 | Committee Summary | `/webhook/gn-committee-summary` | Panel evaluation |
| 12 | Contract Notifications | (direct fetch) | Contract lifecycle |

> **Note:** All webhooks work with mock/fallback data when n8n is offline.
