# 🔄 GrowthNexus — N8N Webhook Integration Guide (v2)

> Complete webhook contract reference for all 11 workflows.
> Updated: April 22, 2026 — Phase 7

---

## Quick Reference

| # | Webhook Path | Env Variable | Trigger |
|---|---|---|---|
| 1 | `/gn-cv-parser` | `NEXT_PUBLIC_N8N_CV_PARSER_WEBHOOK` | Candidate uploads CV |
| 2 | `/gn-match-score` | `N8N_MATCH_SCORE_WEBHOOK` | Application submitted |
| 3 | `/gn-application-notify` | `N8N_APPLICATION_NOTIFY_WEBHOOK` | Application submitted |
| 4 | `/gn-smart-match` | `N8N_SMART_MATCH_WEBHOOK` | Employer clicks "أفضل المرشحين" |
| 5 | `/gn-message-notify` | `N8N_MESSAGE_NOTIFY_WEBHOOK` | New chat message |
| 6 | `/gn-payment-verify` | `N8N_PAYMENT_VERIFY_WEBHOOK` | Post-payment callback |
| 7 | `/gn-ai-job-description` | `N8N_AI_JOB_DESC_WEBHOOK` | Employer clicks "مساعد AI" |
| 8 | `/gn-company-verify` | `N8N_COMPANY_VERIFY_WEBHOOK` | Company registers non-corporate email |
| 9 | `/gn-interview-eval` | `N8N_INTERVIEW_EVAL_WEBHOOK` | Candidate submits auto-interview |
| 10 | `/gn-committee-summary` | `N8N_COMMITTEE_SUMMARY_WEBHOOK` | All committee members finish scoring |
| 11 | `/gn-contract-gen` | `N8N_CONTRACT_GEN_WEBHOOK` | Employer moves candidate to "Offer" |

---

## 1. CV Parser Webhook

**Env Variable:** `NEXT_PUBLIC_N8N_CV_PARSER_WEBHOOK`
**Triggered by:** Candidate uploads PDF CV on `/candidate/cv`
**Method:** `POST`

### Request (Next.js → n8n)
```json
{
  "file_url": "https://xxx.supabase.co/storage/v1/object/public/resumes/user-id/timestamp-file.pdf",
  "user_id": "uuid-of-the-candidate"
}
```

### Expected Response (n8n → Next.js)
```json
{
  "success": true,
  "parsed_data": {
    "skills": ["JavaScript", "React", "Node.js"],
    "experience_years": 5,
    "education": ["بكالوريوس في علوم الحاسوب - جامعة الإمارات"],
    "summary": "مطور برمجيات ذو خبرة 5 سنوات في تطوير الويب",
    "languages": ["العربية", "الإنجليزية"],
    "certifications": ["AWS Certified Developer"]
  }
}
```

### What n8n should do:
1. Download the PDF from `file_url`
2. Send to AI (Gemini/OpenAI) to extract structured data
3. Update `candidates` table: `resume_parsed_data`, `skills`, `experience_years`
4. Return response

---

## 2. Match Score Webhook

**Env Variable:** `N8N_MATCH_SCORE_WEBHOOK`
**Triggered by:** Server-side after application submission
**Method:** `POST`

### Request
```json
{
  "job_id": "uuid", "candidate_id": "uuid",
  "job_skills_required": ["React", "TypeScript"],
  "candidate_skills": ["React", "JavaScript", "Node.js"],
  "job_experience_min": 3, "candidate_experience_years": 5,
  "job_location": "دبي", "candidate_location": "دبي"
}
```

### Response
```json
{
  "success": true,
  "match_score": 85,
  "breakdown": { "skills_match": 67, "experience_match": 100, "location_match": 100 }
}
```

### Logic:
- Skills overlap: `intersection / job_skills.length * 100` (weight: 50%)
- Experience: if `candidate >= job` → 100 (weight: 30%)
- Location: same city → 100, else 50 (weight: 20%)

---

## 3. Application Notification Webhook

**Env Variable:** `N8N_APPLICATION_NOTIFY_WEBHOOK`
**Triggered by:** Candidate applies to a job
**Method:** `POST`

### Request
```json
{
  "application_id": "uuid", "job_id": "uuid",
  "job_title": "مطور React أول",
  "candidate_id": "uuid", "candidate_name": "سارة خليل",
  "candidate_email": "sara@example.com",
  "employer_id": "uuid", "company_name": "شركة النمو",
  "applied_at": "2026-03-14T18:30:00Z"
}
```

### Response
```json
{
  "success": true,
  "notifications_sent": { "employer_email": true, "candidate_confirmation_email": true }
}
```

---

## 4. Smart Candidate Matching Webhook

**Env Variable:** `N8N_SMART_MATCH_WEBHOOK`
**Triggered by:** Employer clicks "عرض أفضل المرشحين"
**Method:** `POST`

### Request
```json
{
  "job_id": "uuid", "job_title": "مطور React أول",
  "skills_required": ["React", "TypeScript"],
  "experience_min": 3, "location": "دبي", "limit": 10
}
```

### Response
```json
{
  "success": true,
  "candidates": [
    { "candidate_id": "uuid", "name": "سارة خليل", "match_score": 95, "skills": ["React", "TypeScript"], "experience_years": 6, "city": "دبي" }
  ]
}
```

---

## 5. Message Notification Webhook

**Env Variable:** `N8N_MESSAGE_NOTIFY_WEBHOOK`
**Triggered by:** New message sent in chat
**Method:** `POST`

### Request
```json
{
  "message_id": "uuid", "conversation_id": "uuid",
  "sender_id": "uuid", "sender_name": "شركة النمو", "sender_role": "employer",
  "recipient_id": "uuid", "recipient_email": "sara@example.com",
  "message_preview": "مرحباً سارة، نود دعوتك لمقابلة...",
  "sent_at": "2026-03-14T18:30:00Z"
}
```

### Response
```json
{ "success": true, "channels": { "email": true } }
```

---

## 6. Payment Verification Webhook

**Env Variable:** `N8N_PAYMENT_VERIFY_WEBHOOK`
**Triggered by:** After payment gateway redirects back to app
**Method:** `POST`

### Request
```json
{
  "transaction_id": "txn_abc123", "user_id": "uuid", "user_role": "employer",
  "product_type": "job_credits",
  "product_details": { "package": "10_credits", "amount_aed": 299 },
  "payment_gateway": "edfapay", "gateway_session_id": "session_xxx"
}
```

### Response
```json
{
  "success": true, "verified": true,
  "fulfillment": { "credits_added": 10, "new_balance": 15, "receipt_url": "https://..." }
}
```

### Product Types
| `product_type` | Who | What n8n does |
|---|---|---|
| `job_credits` | Employer | Add credits to `companies.job_credits` |
| `featured_upgrade` | Employer | Set `jobs.is_featured = true` + expiry |
| `priority_apply` | Candidate | Set `applications.is_priority = true` |
| `cv_unlock` | Employer | Insert into `cv_unlocks` |
| `cv_database` | Employer | Set `companies.cv_database_access = true` |
| `profile_boost` | Candidate | Set `candidates.is_boosted = true` + expiry |
| `cv_review` | Candidate | Insert into `cv_review_orders` |
| `saas_subscription` | Employer | Update `companies.subscription_tier` + set expiry |

---

## 7. AI Job Description Generator ⭐ NEW

**Env Variable:** `N8N_AI_JOB_DESC_WEBHOOK`
**Triggered by:** Employer clicks "مساعد AI" in job posting wizard
**Method:** `POST`

### Request
```json
{
  "title": "مطور React أول",
  "job_type": "full_time",
  "location": "دبي",
  "experience_level": "متوسط (3-5 سنوات)",
  "skills": ["React", "TypeScript"]
}
```

### Response
```json
{
  "success": true,
  "description": "نبحث عن مطور React أول متميز/ة للانضمام إلى فريقنا في دبي...\n\nالمهام الرئيسية:\n• ...",
  "requirements": "• خبرة لا تقل عن 3 سنوات في React\n• إجادة TypeScript\n• ..."
}
```

### What n8n should do:
1. Receive job metadata
2. Send to Gemini/OpenAI with system prompt: "أنت خبير توظيف في الإمارات. اكتب وصفاً وظيفياً احترافياً بالعربية..."
3. Return structured `description` + `requirements`

---

## 8. Company Verification ⭐ NEW

**Env Variable:** `N8N_COMPANY_VERIFY_WEBHOOK`
**Triggered by:** Company registers with non-corporate email domain
**Method:** `POST`

### Request
```json
{
  "company_id": "uuid",
  "company_name": "شركة النمو للتقنية",
  "trade_license_url": "https://xxx.supabase.co/storage/v1/object/public/licenses/xxx.pdf",
  "owner_email": "user@gmail.com"
}
```

### Response
```json
{
  "success": true,
  "trust_score": 85,
  "verified": true,
  "extracted": {
    "registration_no": "1234567",
    "entity_name": "شركة النمو للتقنية ذ.م.م",
    "license_expiry": "2027-12-31"
  }
}
```

### What n8n should do:
1. Download the PDF/image from `trade_license_url`
2. OCR via Gemini Vision to extract registration number and entity name
3. (Optional) Cross-check with UAE registry API
4. Calculate trust score and update `companies.is_verified`
5. Return extracted data

---

## 9. Interview AI Evaluation ⭐ NEW

**Env Variable:** `N8N_INTERVIEW_EVAL_WEBHOOK`
**Triggered by:** Candidate submits automated interview answers
**Method:** `POST`

### Request
```json
{
  "application_id": "uuid",
  "job_id": "uuid",
  "job_title": "مدير مشاريع",
  "questions": [
    "كيف تتعامل مع فريق متعدد الجنسيات؟",
    "ما هي أكبر تحديات إدارة المشاريع التي واجهتها؟"
  ],
  "answers": [
    "أركز على التواصل الواضح واحترام الثقافات...",
    "واجهت تحدي تأخر المشروع بسبب..."
  ]
}
```

### Response
```json
{
  "success": true,
  "overall_score": 78,
  "evaluation": [
    { "question_index": 0, "score": 8, "max": 10, "feedback": "إجابة ممتازة تُظهر وعياً ثقافياً..." },
    { "question_index": 1, "score": 7, "max": 10, "feedback": "جيد، لكن يفتقر لأمثلة محددة..." }
  ],
  "recommendation": "مرشح جيد — يُنصح بالمتابعة مع مقابلة شخصية"
}
```

### What n8n should do:
1. Send Q&A pairs to AI with rubric: fluency, relevance, depth, professionalism
2. Generate per-question scores and feedback
3. Update `applications` with interview score (future column)
4. Return structured evaluation

---

## 10. Committee Summary ⭐ NEW

**Env Variable:** `N8N_COMMITTEE_SUMMARY_WEBHOOK`
**Triggered by:** All committee members complete their scorecards
**Method:** `POST`

### Request
```json
{
  "application_id": "uuid",
  "candidate_name": "سارة خليل",
  "position": "مطور React أول",
  "scores": [
    { "evaluator_id": "uuid", "evaluator_name": "أحمد", "score": 85, "notes": "مرشحة ممتازة..." },
    { "evaluator_id": "uuid", "evaluator_name": "فاطمة", "score": 72, "notes": "خبرة كافية لكن..." },
    { "evaluator_id": "uuid", "evaluator_name": "خالد", "score": 90, "notes": "أفضل مرشح..." }
  ]
}
```

### Response
```json
{
  "success": true,
  "average_score": 82,
  "median_score": 85,
  "recommendation": "تأهيل المرشحة للعرض الوظيفي",
  "outliers": [
    { "evaluator_name": "فاطمة", "score": 72, "deviation": -10, "flag": "below_average" }
  ],
  "summary": "تم تقييم سارة خليل من 3 أعضاء لجنة. المتوسط 82%..."
}
```

### What n8n should do:
1. Calculate average, median, std deviation
2. Flag outlier scores (>1.5σ from mean)
3. Generate AI summary of consensus and disagreements
4. Return structured report

---

## 11. Contract/Offer Generation ⭐ NEW

**Env Variable:** `N8N_CONTRACT_GEN_WEBHOOK`
**Triggered by:** Employer moves candidate to "عرض وظيفي" (Offer) status
**Method:** `POST`

### Request
```json
{
  "application_id": "uuid",
  "company_name": "شركة النمو للتقنية",
  "candidate_name": "سارة خليل",
  "position": "مطور React أول",
  "salary": 15000,
  "currency": "AED",
  "start_date": "2026-06-01",
  "probation_months": 6,
  "benefits": ["تأمين صحي", "إجازة سنوية 30 يوم", "بدل سكن"],
  "template_id": "uae_mohre_default"
}
```

### Response
```json
{
  "success": true,
  "contract_url": "https://xxx.supabase.co/storage/v1/object/public/contracts/app-uuid.pdf",
  "offer_letter_url": "https://xxx.supabase.co/storage/v1/object/public/contracts/app-uuid-offer.pdf"
}
```

### What n8n should do:
1. Load MOHRE-aligned template (Arabic)
2. Merge candidate/company/salary data into template
3. Generate PDF via Puppeteer or similar
4. Upload to Supabase Storage
5. Return download URLs

---

## 🔐 Security

All server-side webhooks (no `NEXT_PUBLIC_` prefix) require:
```
Headers: { "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET }
```

### `.env.local` full webhook list
```env
# Client-side
NEXT_PUBLIC_N8N_CV_PARSER_WEBHOOK=https://your-n8n.com/webhook/gn-cv-parser

# Server-side (all require x-webhook-secret header)
N8N_MATCH_SCORE_WEBHOOK=https://your-n8n.com/webhook/gn-match-score
N8N_APPLICATION_NOTIFY_WEBHOOK=https://your-n8n.com/webhook/gn-application-notify
N8N_SMART_MATCH_WEBHOOK=https://your-n8n.com/webhook/gn-smart-match
N8N_MESSAGE_NOTIFY_WEBHOOK=https://your-n8n.com/webhook/gn-message-notify
N8N_PAYMENT_VERIFY_WEBHOOK=https://your-n8n.com/webhook/gn-payment-verify
N8N_AI_JOB_DESC_WEBHOOK=https://your-n8n.com/webhook/gn-ai-job-description
N8N_COMPANY_VERIFY_WEBHOOK=https://your-n8n.com/webhook/gn-company-verify
N8N_INTERVIEW_EVAL_WEBHOOK=https://your-n8n.com/webhook/gn-interview-eval
N8N_COMMITTEE_SUMMARY_WEBHOOK=https://your-n8n.com/webhook/gn-committee-summary
N8N_CONTRACT_GEN_WEBHOOK=https://your-n8n.com/webhook/gn-contract-gen
N8N_WEBHOOK_SECRET=your-shared-secret-here
```

---

## 📁 API Routes That Call Webhooks

| API Route / Page | Webhook(s) Used | When |
|---|---|---|
| `candidate/cv/page.tsx` (client) | CV Parser | CV upload |
| `api/apply/route.ts` | Application Notify + Match Score | Job application |
| `api/messages/route.ts` | Message Notify | New message |
| `api/payment/verify/route.ts` | Payment Verify | Post-payment |
| `employer/dashboard` (server) | Smart Match | Dashboard load |
| `employer/jobs/new` → API route | AI Job Description | "مساعد AI" click |
| `employer/settings` → API route | Company Verify | Trade license upload |
| Interview page → API route | Interview Eval | Interview submission |
| Applicants → status change | Contract Gen | Move to "Offer" |
| Committee page → API route | Committee Summary | All reviews complete |
