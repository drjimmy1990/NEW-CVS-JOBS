# 🔌 GrowthNexus — N8N Webhooks Status

> **Last Updated:** 12 May 2026 — 10:15 PM

## Legend
- ✅ **Done** = n8n workflow built + frontend code connected + tested
- 🔧 **Code Ready** = frontend API route exists, needs n8n workflow
- ⚠️ **Partial** = n8n workflow exists but incomplete
- ❌ **Not Started** = no code, no workflow

---

| # | Webhook | Path | Status | Notes |
|---|---------|------|--------|-------|
| 1 | **CV Parser** | `/gn-cv-parser` | ✅ Done | Webhook → HTTP → Extract PDF → Gemini → Code → Supabase Update → Respond |
| 2 | **AI Job Description** | `/gn-ai-job-description` | ✅ Done | Webhook → Gemini → Code cleanup → Respond |
| 3 | **Match Score Calculator** | `/gn-match-score` | ✅ Done | Webhook → Gemini → Code → Supabase Update (ai_match_score + ai_analysis) → Respond |
| 4 | **Interview Questions** | `/gn-interview-questions` | ✅ Done | Webhook → Gemini → Code cleanup → Respond. ⚠️ Fallback to mock if LLM errors |
| 5 | **Interview Evaluation** | `/gn-interview-eval` | ✅ Done | Webhook → Gemini → Code cleanup → Respond. ⚠️ Fallback to mock if LLM errors |
| 6 | **Application Notification** | `/gn-application-notify` | ⚠️ Partial | In-app bell ✅ + n8n gets owner profile. **Missing: Email/Telegram send node** |
| 7 | **Smart Candidate Matching** | `/gn-smart-match` | ❌ Not Started | Employer searches for best candidates from pool |
| 8 | **Message Notification** | `/gn-message-notify` | ❌ Not Started | Notify user when they receive a new message |
| 9 | **Payment Verification** | `/gn-payment-verify` | ❌ Not Started | Verify Stripe/EdfaPay → fulfill subscription/credits |
| 10 | **Company Verification** | `/gn-company-verify` | ✅ Done | Webhook → HTTP Download → Gemini OCR → Decision Engine (risk scoring) → 3× Supabase updates (company status, doc OCR data, audit log). Triggered by Supabase DB webhook on `company_documents` INSERT |
| 11 | **Committee Summary** | `/gn-committee-summary` | ✅ Done | Webhook → Gemini → Code cleanup → Respond. Auto-triggers when 2+ evaluators submit |
| 12 | **Contract Notifications** | `/gn-contract-notify` | ✅ Done | **Merged into main `n8n workflow.json`**. 4 events: created / sent / signed / declined. Switch node routes to 4 email templates. S2S auth via `N8N_WEBHOOK_SECRET`. |
| 13 | **Contract Generation** | `/gn-contract-gen` | 🔧 Code Ready | API route at `/api/contracts/generate` works end-to-end. PDF via `/api/contracts/pdf/[id]`. **Optional: n8n workflow for HTML→PDF if needed** |
| 14 | **External Jobs Import** | `/api/external-jobs` | 🔧 Code Ready | Upsert API for scraped jobs (LinkedIn/Bayt/Indeed). S2S auth via `N8N_WEBHOOK_SECRET`. Admin panel at `/admin/external-jobs`. **Needs: n8n scraper workflow** |

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Done | 8 |
| ⚠️ Partial / Code Ready | 3 |
| ❌ Not Started | 3 |

## n8n Workflow JSON Files

| File | Contains | Status |
|------|----------|--------|
| `n8n workflow.json` | **Main workflow** — 9 webhook paths (CV Parser, AI Job Desc, Match Score, Interview Q/Eval, Committee, App Notify, Company Verify, **Contract Notify** 🆕) | ✅ Active |
| `n8n-contract-notify-workflow.json` | ⚠️ **Legacy standalone** — superceded by contract notify nodes in main workflow | 🔄 Merged into main |

> **Note:** Contract notification nodes (Webhook8, Code in JavaScript7, Switch, Send email1–4) are now integrated directly into the main `n8n workflow.json`. The separate `n8n-contract-notify-workflow.json` is no longer needed for import.

## Where Results Appear

| Feature | Candidate Sees | Employer Sees |
|---------|---------------|---------------|
| **CV Parser** | `/candidate/cv` — parsed skills, experience, education | `/employer/jobs/[id]/applicants` — in detail modal (AI Insights) |
| **Match Score** | — | Badge "تطابق 85%" on card + progress bar in detail modal |
| **Interview** | `/candidate/interview/[id]` — questions + results. Button "عرض نتيجة المقابلة" on `/candidate/applications` | Badge "مقابلة 78%" on card + full report in detail modal |
| **Notification** | — | 🔔 Bell icon in top bar with unread count + dropdown |
| **Committee** | — | Summary auto-saved to `applications.committee_summary` after 2+ evaluators |
| **Contract Notify** | Email on contract created / sent | Email on contract signed / declined |
| **External Jobs** | Blue badge on `/jobs` page, source attribution, redirect Apply | Admin panel at `/admin/external-jobs` for management |
| **Contract PDF** | `/candidate/contracts/[id]` — download PDF | `/employer/contracts/track` — download PDF |

## Contract Notification Events (in main workflow)

| Event | Email To | Subject | Template Color |
|-------|----------|---------|----------------|
| `contract_created` | Candidate | عرض وظيفي جديد من {company} — {job} | Gold (#c4a035) |
| `contract_sent` | Candidate | عقدك جاهز للمراجعة — {company} | Blue (#3b82f6) |
| `contract_signed` | Employer | 🎉 {candidate} وقّع على العقد — {job} | Green (#22c55e) |
| `contract_declined` | Employer | ❌ {candidate} رفض العقد — {job} | Red (#ef4444) |

## Next To Build (Priority Order)

### 1. External Jobs Scraper (#14) — HIGH VALUE 🆕
Build n8n scraper workflow for LinkedIn/Bayt/Indeed → `/api/external-jobs`.
See: `N8N_EXTERNAL_JOBS_WORKFLOW_GUIDE.md`

### 2. Smart Candidate Matching (#7) — HIGH VALUE
Employer can search their candidate pool and AI ranks best matches for a job.

### ~~3. Company Verification (#10)~~ ✅ DONE
~~OCR trade license, extract company data, calculate trust score.~~

### 4. Payment Verification (#9) — MONETIZATION
Stripe/EdfaPay webhook to fulfill subscriptions and credits.

### 5. Application Notification (#6) — FINISH
Add Email/Telegram send node in existing n8n workflow.

### 6. Message Notification (#8) — NICE TO HAVE
Chat message notifications.
