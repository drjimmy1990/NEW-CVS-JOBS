# 🔌 GrowthNexus — N8N Webhooks Status

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
| 10 | **Company Verification** | `/gn-company-verify` | ❌ Not Started | OCR trade license → extract data → trust score |
| 11 | **Committee Summary** | `/gn-committee-summary` | ✅ Done | Webhook → Gemini → Code cleanup → Respond. Auto-triggers when 2+ evaluators submit |
| 12 | **Contract Generation** | `/gn-contract-gen` | 🔧 Code Ready | API route exists at `/api/contracts/generate`. **Needs n8n workflow (HTML→PDF→Storage)** |

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Done | 6 |
| ⚠️ Partial (n8n incomplete) | 1 |
| 🔧 Code Ready (needs n8n) | 1 |
| ❌ Not Started | 4 |

## Where Results Appear

| Feature | Candidate Sees | Employer Sees |
|---------|---------------|---------------|
| **CV Parser** | `/candidate/cv` — parsed skills, experience, education | `/employer/jobs/[id]/applicants` — in detail modal (AI Insights) |
| **Match Score** | — | Badge "تطابق 85%" on card + progress bar in detail modal |
| **Interview** | `/candidate/interview/[id]` — questions + results. Button "عرض نتيجة المقابلة" on `/candidate/applications` | Badge "مقابلة 78%" on card + full report in detail modal |
| **Notification** | — | 🔔 Bell icon in top bar with unread count + dropdown |
| **Committee** | — | Summary auto-saved to `applications.committee_summary` after 2+ evaluators |

## Next To Build (Priority Order)

### 1. Smart Candidate Matching (#7) — HIGH VALUE
Employer can search their candidate pool and AI ranks best matches for a job.

### 2. Company Verification (#10) — TRUST & COMPLIANCE
OCR trade license, extract company data, calculate trust score.

### 3. Contract Generation (#12) — n8n ONLY
Code exists. Just needs HTML→PDF n8n workflow.

### 4. Payment Verification (#9) — MONETIZATION
Stripe/EdfaPay webhook to fulfill subscriptions and credits.

### 5. Message Notification (#8) — NICE TO HAVE
Chat message notifications.

### 6. Application Notification (#6) — FINISH
Add Email/Telegram send node in existing n8n workflow.
