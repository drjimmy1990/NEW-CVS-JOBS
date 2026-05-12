# 🔌 GrowthNexus — N8N Webhooks Status

> **Last Updated:** 12 May 2026 — 02:18 AM

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
| 12 | **Contract Notifications** | Direct fetch via `contract-notify.ts` | ✅ Done | 4 events: created / sent / signed / declined. S2S auth via `N8N_WEBHOOK_SECRET`. Blueprint: `n8n-contract-notify-workflow.json`. |
| 13 | **Contract Generation** | `/gn-contract-gen` | 🔧 Code Ready | API route at `/api/contracts/generate` works end-to-end. PDF via `/api/contracts/pdf/[id]`. **Optional: n8n workflow for HTML→PDF if needed** |

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Done | 8 |
| ⚠️ Partial / Code Ready | 2 |
| ❌ Not Started | 3 |

## Where Results Appear

| Feature | Candidate Sees | Employer Sees |
|---------|---------------|---------------|
| **CV Parser** | `/candidate/cv` — parsed skills, experience, education | `/employer/jobs/[id]/applicants` — in detail modal (AI Insights) |
| **Match Score** | — | Badge "تطابق 85%" on card + progress bar in detail modal |
| **Interview** | `/candidate/interview/[id]` — questions + results. Button "عرض نتيجة المقابلة" on `/candidate/applications` | Badge "مقابلة 78%" on card + full report in detail modal |
| **Notification** | — | 🔔 Bell icon in top bar with unread count + dropdown |
| **Committee** | — | Summary auto-saved to `applications.committee_summary` after 2+ evaluators |
| **Contract Notify** | Email on contract sent / reminder | Email on contract signed / declined |
| **Contract PDF** | `/candidate/contracts/[id]` — download PDF | `/employer/contracts/track` — download PDF |

## Next To Build (Priority Order)

### 1. Smart Candidate Matching (#7) — HIGH VALUE
Employer can search their candidate pool and AI ranks best matches for a job.

### ~~2. Company Verification (#10)~~ ✅ DONE
~~OCR trade license, extract company data, calculate trust score.~~

### 3. Payment Verification (#9) — MONETIZATION
Stripe/EdfaPay webhook to fulfill subscriptions and credits.

### 4. Application Notification (#6) — FINISH
Add Email/Telegram send node in existing n8n workflow.

### 5. Message Notification (#8) — NICE TO HAVE
Chat message notifications.
