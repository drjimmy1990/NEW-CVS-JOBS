# 🔌 GrowthNexus — N8N Webhooks Status

## Legend
- ✅ **Done** = n8n workflow built + frontend code connected + tested
- 🔧 **Code Ready** = frontend API route exists, needs n8n workflow
- ❌ **Not Started** = no code, no workflow

---

| # | Webhook | Path | Status | Notes |
|---|---------|------|--------|-------|
| 1 | **CV Parser** | `/gn-cv-parser` | ✅ Done | Parses uploaded PDF CV → extracts skills, experience, education → saves to `candidates.resume_parsed_data` |
| 2 | **AI Job Description** | `/gn-ai-job-description` | ✅ Done | Employer clicks "AI Assist" → generates Arabic job description + requirements |
| 3 | **Match Score Calculator** | `/gn-match-score` | ✅ Done | Triggered on job application → AI compares candidate vs job → saves `ai_match_score` + `ai_analysis` to `applications` |
| 4 | **Interview Questions** | `/gn-interview-questions` | ✅ Done | Generates 5 AI interview questions based on job title/type. ⚠️ If LLM node errors, frontend falls back to mock questions |
| 5 | **Interview Evaluation** | `/gn-interview-eval` | ✅ Done | AI evaluates candidate answers → saves `interview_score` + `interview_report` via RPC. ⚠️ If LLM node errors, frontend falls back to random mock scores |
| 6 | **Application Notification** | `/gn-application-notify` | 🔧 Code Ready | In-app notification bell ✅ + API trigger on apply. **n8n needed only for email/Telegram** |
| 7 | **Smart Candidate Matching** | `/gn-smart-match` | ❌ Not Started | Employer searches for best candidates for a specific job from the candidates pool |
| 8 | **Message Notification** | `/gn-message-notify` | ❌ Not Started | Notify user when they receive a new message in the messaging system |
| 9 | **Payment Verification** | `/gn-payment-verify` | ❌ Not Started | Verify Stripe/EdfaPay payment and fulfill subscription or priority application |
| 10 | **Company Verification** | `/gn-company-verify` | ❌ Not Started | OCR trade license upload → extract company data → calculate trust score |
| 11 | **Committee Summary** | `/gn-committee-summary` | 🔧 Code Ready | API route at `/api/evaluation/submit`. Aggregates evaluator scores + detects outliers. **Needs n8n workflow** |
| 12 | **Contract Generation** | `/gn-contract-gen` | 🔧 Code Ready | API route at `/api/contracts/generate`. Generates MOHRE-aligned PDF contract. **Needs n8n workflow** |

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Done | 5 |
| 🔧 Code Ready (needs n8n workflow) | 3 |
| ❌ Not Started | 4 |

## Where Results Appear

| Feature | Candidate Sees | Employer Sees |
|---------|---------------|---------------|
| **CV Parser** | `/candidate/cv` — parsed skills, experience, education | `/employer/jobs/[id]/applicants` — in detail modal (AI Insights) |
| **Match Score** | — | Badge "تطابق 85%" on card + progress bar in detail modal |
| **Interview** | `/candidate/interview/[id]` — questions + results. Button "عرض نتيجة المقابلة" on `/candidate/applications` | Badge "مقابلة 78%" on card + full report in detail modal |

## Next Workflows to Build (Priority Order)

### 1. ~~Interview Questions (#4)~~ ✅
### 2. ~~Interview Evaluation (#5)~~ ✅
### 3. Committee Summary (#11)
### 4. Contract Generation (#12)
### 5. Application Notification (#6)
### 6. Remaining (#7, #8, #9, #10)
