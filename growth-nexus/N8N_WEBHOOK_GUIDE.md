# 🔄 GrowthNexus — N8N Webhook Integration Guide

This document describes every webhook used in GrowthNexus, including:
- The **trigger** (when it fires)
- The **request JSON** your Next.js app sends to n8n
- The **response JSON** n8n must return to the app

---

## 1. CV Parser Webhook

**Env Variable:** `NEXT_PUBLIC_N8N_CV_PARSER_WEBHOOK`
**Triggered by:** Candidate uploads a PDF CV on `/candidate/cv`  
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
    "skills": ["JavaScript", "React", "Node.js", "TypeScript", "SQL"],
    "experience_years": 5,
    "education": ["بكالوريوس في علوم الحاسوب - جامعة الإمارات"],
    "summary": "مطور برمجيات ذو خبرة 5 سنوات في تطوير الويب",
    "languages": ["العربية", "الإنجليزية"],
    "certifications": ["AWS Certified Developer"]
  }
}
```

### What n8n should do:
1. **Receive** the webhook with `file_url` and `user_id`
2. **Download** the PDF from the `file_url`
3. **Send to AI** (Gemini/OpenAI) to extract structured data
4. **Write to Supabase** — Update the `candidates` table:
   ```sql
   UPDATE candidates 
   SET 
     resume_parsed_data = '{...parsed_data json...}',
     skills = ARRAY['JavaScript', 'React', ...],
     experience_years = 5
   WHERE id = 'user_id';
   ```
5. **Return** the response JSON above

---

## 2. Match Score Webhook

**Env Variable:** `N8N_MATCH_SCORE_WEBHOOK`  
**Triggered by:** Server-side when loading job cards for a logged-in candidate  
**Method:** `POST`

### Request (Next.js → n8n)
```json
{
  "job_id": "uuid-of-the-job",
  "candidate_id": "uuid-of-the-candidate",
  "job_skills_required": ["React", "TypeScript", "Node.js"],
  "candidate_skills": ["React", "JavaScript", "Python", "Node.js"],
  "job_experience_min": 3,
  "candidate_experience_years": 5,
  "job_location": "دبي",
  "candidate_location": "دبي"
}
```

### Expected Response (n8n → Next.js)
```json
{
  "success": true,
  "match_score": 85,
  "breakdown": {
    "skills_match": 67,
    "experience_match": 100,
    "location_match": 100
  }
}
```

### What n8n should do:
1. **Calculate skills overlap:** `intersection(job_skills, candidate_skills) / job_skills.length * 100`
2. **Check experience:** if `candidate_experience >= job_experience_min` → 100, else proportional
3. **Check location:** if same → 100, else 50
4. **Weighted average:** `skills_match * 0.5 + experience_match * 0.3 + location_match * 0.2`
5. **Write to Supabase** — Update the `applications` table if an application exists:
   ```sql
   UPDATE applications 
   SET match_score = 85
   WHERE job_id = 'job_id' AND candidate_id = 'candidate_id';
   ```
6. **Return** the response JSON above

---

## 3. Application Notification Webhook

**Env Variable:** `N8N_APPLICATION_NOTIFY_WEBHOOK`  
**Triggered by:** Candidate applies to a job (after inserting into `applications` table)  
**Method:** `POST`

### Request (Next.js → n8n)
```json
{
  "application_id": "uuid-of-the-application",
  "job_id": "uuid-of-the-job",
  "job_title": "مطور React أول",
  "candidate_id": "uuid-of-the-candidate",
  "candidate_name": "سارة خليل",
  "candidate_email": "sara@example.com",
  "employer_id": "uuid-of-the-employer",
  "company_name": "شركة النمو",
  "applied_at": "2026-03-14T18:30:00Z"
}
```

### Expected Response (n8n → Next.js)
```json
{
  "success": true,
  "message": "Notifications sent",
  "notifications_sent": {
    "employer_email": true,
    "candidate_confirmation_email": true,
    "whatsapp": false
  }
}
```

### What n8n should do:
1. **Send email to employer:** "مرشح جديد تقدم لوظيفة {job_title}" with candidate name and link
2. **Send confirmation email to candidate:** "تم تقديم طلبك لوظيفة {job_title} في {company_name}"
3. **Optional: WhatsApp notification** to employer via WhatsApp API
4. **Trigger match score calculation** (call webhook #2 internally)
5. **Return** the response JSON above

---

## 4. Smart Candidate Matching Webhook

**Env Variable:** `N8N_SMART_MATCH_WEBHOOK`  
**Triggered by:** Employer clicks "عرض أفضل المرشحين" on employer dashboard  
**Method:** `POST`

### Request (Next.js → n8n)
```json
{
  "job_id": "uuid-of-the-job",
  "job_title": "مطور React أول",
  "skills_required": ["React", "TypeScript", "Node.js"],
  "experience_min": 3,
  "location": "دبي",
  "limit": 10
}
```

### Expected Response (n8n → Next.js)
```json
{
  "success": true,
  "candidates": [
    {
      "candidate_id": "uuid",
      "name": "سارة خليل",
      "headline": "مطورة React أولى",
      "match_score": 95,
      "skills": ["React", "TypeScript", "Node.js", "GraphQL"],
      "experience_years": 6,
      "city": "دبي"
    },
    {
      "candidate_id": "uuid",
      "name": "محمد الراشد",
      "headline": "مهندس Full Stack",
      "match_score": 88,
      "skills": ["React", "Python", "Node.js", "AWS"],
      "experience_years": 4,
      "city": "أبوظبي"
    }
  ]
}
```

### What n8n should do:
1. **Query Supabase** — Get all public candidates with overlapping skills
2. **Calculate match score** for each candidate against the job
3. **Sort by match score** descending
4. **Return** top `limit` candidates

---

## 5. Message Notification Webhook

**Env Variable:** `N8N_MESSAGE_NOTIFY_WEBHOOK`  
**Triggered by:** New message is sent in the messaging system  
**Method:** `POST`

### Request (Next.js → n8n)
```json
{
  "message_id": "uuid-of-the-message",
  "conversation_id": "uuid-of-the-conversation",
  "sender_id": "uuid-of-sender",
  "sender_name": "شركة النمو",
  "sender_role": "employer",
  "recipient_id": "uuid-of-recipient",
  "recipient_email": "sara@example.com",
  "message_preview": "مرحباً سارة، نود دعوتك لمقابلة...",
  "sent_at": "2026-03-14T18:30:00Z"
}
```

### Expected Response (n8n → Next.js)
```json
{
  "success": true,
  "message": "Notification delivered",
  "channels": {
    "email": true,
    "push": false
  }
}
```

### What n8n should do:
1. **Send email** to recipient: "لديك رسالة جديدة من {sender_name}"
2. **Optional: Push notification** if mobile app is connected
3. **Return** the response JSON above

---

## 6. Payment Verification Webhook

**Env Variable:** `N8N_PAYMENT_VERIFY_WEBHOOK`  
**Triggered by:** After payment gateway redirects back to app  
**Method:** `POST`

### Request (Next.js → n8n)
```json
{
  "transaction_id": "uuid-or-gateway-ref",
  "user_id": "uuid-of-the-user",
  "user_role": "employer",
  "product_type": "job_credits",
  "product_details": {
    "package": "10_credits",
    "amount_aed": 299
  },
  "payment_gateway": "stripe",
  "gateway_session_id": "cs_test_abc123"
}
```

### Expected Response (n8n → Next.js)
```json
{
  "success": true,
  "verified": true,
  "fulfillment": {
    "credits_added": 10,
    "new_balance": 15,
    "receipt_url": "https://pay.stripe.com/receipts/xxx"
  }
}
```

### Product Types Reference:
| `product_type` | Description | `product_details` |
|---|---|---|
| `job_credits` | Employer buys job posting credits | `{ "package": "5_credits", "amount_aed": 149 }` |
| `featured_upgrade` | Employer promotes a job listing | `{ "job_id": "uuid", "duration_days": 7, "amount_aed": 99 }` |
| `priority_apply` | Candidate pays for priority application | `{ "job_id": "uuid", "amount_aed": 5 }` |
| `cv_unlock` | Employer unlocks a candidate's full profile | `{ "candidate_id": "uuid", "amount_aed": 15 }` |
| `cv_database` | Employer subscribes to CV database access | `{ "plan": "monthly", "amount_aed": 699 }` |
| `profile_boost` | Candidate boosts their profile visibility | `{ "duration_days": 7, "amount_aed": 29 }` |
| `cv_review` | Candidate orders professional CV review | `{ "amount_aed": 199 }` |

### What n8n should do:
1. **Verify payment** with the payment gateway API (Stripe/PayTabs)
2. **If verified:** Update Supabase:
   - For `job_credits`: Add credits to `companies.job_credits_remaining`
   - For `featured_upgrade`: Set `jobs.is_featured = true` and `jobs.featured_until`
   - For `priority_apply`: Set `applications.is_priority = true`
   - For `cv_unlock`: Insert into `cv_unlocks` table
   - For `cv_database`: Set `companies.cv_database_access = true`
   - For `profile_boost`: Set `candidates.is_boosted = true` and `candidates.boosted_until`
   - For `cv_review`: Create order in `cv_review_orders` table
3. **Send confirmation email** to user
4. **Return** the response JSON above

---

## 🔑 Security Notes

1. **Server-side only webhooks** (N8N_MATCH_SCORE, N8N_APPLICATION_NOTIFY, etc.) do NOT have `NEXT_PUBLIC_` prefix — they are called from API routes, not the browser
2. **Client-side webhooks** (NEXT_PUBLIC_N8N_CV_PARSER) are accessible from the browser — n8n should validate the user_id against Supabase auth
3. Consider adding a **shared secret header** for authentication:
   ```
   Headers: { "x-webhook-secret": "your-shared-secret" }
   ```

---

## 📁 API Routes That Call Webhooks

| API Route | Webhook Used | When |
|---|---|---|
| `candidate/cv/page.tsx` (client) | CV Parser | CV upload |
| `api/apply/route.ts` | Application Notify + Match Score | Job application |
| `api/messages/route.ts` | Message Notify | New message |
| `api/payment/verify/route.ts` | Payment Verify | Post-payment |
| `employer/dashboard` (server) | Smart Match | Dashboard load |
