# 🔧 GrowthNexus — N8N Workflow Build Guide

This is your step-by-step guide to build each n8n workflow.  
For each workflow you'll find:
- **The webhook URL** (from `.env.local`)
- **Node flow** in plain words — build these nodes in order, left to right
- **The JSON the app sends** to the webhook
- **The JSON the webhook must return** to the app

---

## Workflow 1: CV Parser

**Env:** `NEXT_PUBLIC_N8N_CV_PARSER_WEBHOOK`  
**Trigger:** Candidate uploads a PDF on `/candidate/cv`

### Node Flow

```
[Webhook] → [HTTP Request: Download PDF] → [Gemini/OpenAI: Extract Data] → [Supabase: Update Candidate] → [Respond to Webhook]
```

1. **Webhook (Trigger)**
   - Method: POST
   - Path: `/gn-cv-parser`
   - Authentication: None (or Header Auth with shared secret)
   - Response Mode: "Last Node"

2. **HTTP Request — Download PDF**
   - Method: GET
   - URL: `{{ $json.file_url }}`
   - Response Format: File
   - This downloads the PDF from Supabase Storage

3. **AI Agent / Gemini / OpenAI**
   - Model: Gemini 2.0 Flash or GPT-4o
   - Operation: Send the PDF binary as attachment
   - System Prompt:
     ```
     You are a CV parser. Extract the following from this CV and return ONLY valid JSON:
     {
       "skills": ["skill1", "skill2"],
       "experience_years": number,
       "education": ["degree - university"],
       "summary": "one line summary in Arabic",
       "languages": ["Arabic", "English"],
       "certifications": ["cert name"]
     }
     ```
   - Parse the AI response with a JSON Parse node if needed

4. **Supabase — Update Candidate**
   - Operation: Update Row
   - Table: `candidates`
   - Filter: `id` equals `{{ $('Webhook').item.json.user_id }}`
   - Fields to update:
     - `resume_parsed_data` = the full parsed JSON object
     - `skills` = the `skills` array from parsed data
     - `experience_years` = the `experience_years` from parsed data

5. **Respond to Webhook**
   - Return the JSON below

### Incoming JSON (App → n8n)
```json
{
  "file_url": "https://xxx.supabase.co/storage/v1/object/public/resumes/user-id/1710000000-cv.pdf",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Response JSON (n8n → App)
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

---

## Workflow 2: Match Score Calculator

**Env:** `N8N_MATCH_SCORE_WEBHOOK`  
**Trigger:** Server-side when loading job cards for a logged-in candidate

### Node Flow

```
[Webhook] → [Code: Calculate Score] → [Supabase: Update Application] → [Respond to Webhook]
```

1. **Webhook (Trigger)**
   - Method: POST
   - Path: `/gn-match-score`
   - Response Mode: "Last Node"

2. **Code Node — Calculate Match Score**
   - Language: JavaScript
   - Logic:
     ```javascript
     const jobSkills = $input.item.json.job_skills_required || [];
     const candidateSkills = $input.item.json.candidate_skills || [];
     const jobExpMin = $input.item.json.job_experience_min || 0;
     const candidateExp = $input.item.json.candidate_experience_years || 0;
     const jobLocation = $input.item.json.job_location || '';
     const candidateLocation = $input.item.json.candidate_location || '';

     // Skills match: intersection / job skills count
     const intersection = jobSkills.filter(s => 
       candidateSkills.map(c => c.toLowerCase()).includes(s.toLowerCase())
     );
     const skillsMatch = jobSkills.length > 0 
       ? Math.round((intersection.length / jobSkills.length) * 100) 
       : 50;

     // Experience match
     const experienceMatch = candidateExp >= jobExpMin ? 100 
       : Math.round((candidateExp / jobExpMin) * 100);

     // Location match
     const locationMatch = jobLocation === candidateLocation ? 100 : 50;

     // Weighted average
     const matchScore = Math.round(
       skillsMatch * 0.5 + experienceMatch * 0.3 + locationMatch * 0.2
     );

     return {
       match_score: matchScore,
       breakdown: { skills_match: skillsMatch, experience_match: experienceMatch, location_match: locationMatch }
     };
     ```

3. **Supabase — Update Application** (Optional — only if application exists)
   - Operation: Update Row
   - Table: `applications`
   - Filter: `job_id` equals `{{ $('Webhook').item.json.job_id }}` AND `candidate_id` equals `{{ $('Webhook').item.json.candidate_id }}`
   - Fields: `match_score` = calculated score

4. **Respond to Webhook**
   - Return the JSON below

### Incoming JSON (App → n8n)
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

### Response JSON (n8n → App)
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

---

## Workflow 3: Application Notification

**Env:** `N8N_APPLICATION_NOTIFY_WEBHOOK`  
**Trigger:** Candidate applies to a job (after the `applications` row is inserted)

### Node Flow

```
[Webhook] → [Switch: Check Roles] → [Send Email to Employer] + [Send Email to Candidate] → [Respond to Webhook]
```

1. **Webhook (Trigger)**
   - Method: POST
   - Path: `/gn-application-notify`
   - Response Mode: "Last Node"

2. **Send Email — To Employer**
   - Use: Gmail node, or SMTP node, or SendGrid node
   - To: You need to query employer email. Either:
     - Add `employer_email` to the incoming JSON, OR
     - Add a Supabase node before this to fetch `profiles.email` where `id = employer_id`
   - Subject: `مرشح جديد تقدم لوظيفة: {{ $json.job_title }}`
   - Body (HTML):
     ```html
     <div dir="rtl" style="font-family: Arial, sans-serif;">
       <h2>مرشح جديد! 🎉</h2>
       <p>تقدم <strong>{{ $json.candidate_name }}</strong> لوظيفة <strong>{{ $json.job_title }}</strong></p>
       <p>تاريخ التقديم: {{ $json.applied_at }}</p>
       <a href="https://yourapp.com/employer/applicants">مراجعة الطلب →</a>
     </div>
     ```

3. **Send Email — To Candidate**
   - To: `{{ $json.candidate_email }}`
   - Subject: `تم تقديم طلبك لوظيفة {{ $json.job_title }}`
   - Body:
     ```html
     <div dir="rtl" style="font-family: Arial, sans-serif;">
       <h2>تم تقديم طلبك بنجاح ✅</h2>
       <p>تقدمت لوظيفة <strong>{{ $json.job_title }}</strong> في <strong>{{ $json.company_name }}</strong></p>
       <p>سنقوم بإشعارك عند تحديث حالة طلبك.</p>
       <a href="https://yourapp.com/candidate/applications">تتبع طلباتك →</a>
     </div>
     ```

4. **Respond to Webhook**

### Incoming JSON (App → n8n)
```json
{
  "application_id": "uuid-of-application",
  "job_id": "uuid-of-job",
  "job_title": "مطور React أول",
  "candidate_id": "uuid-of-candidate",
  "candidate_name": "سارة خليل",
  "candidate_email": "sara@example.com",
  "employer_id": "uuid-of-employer",
  "company_name": "شركة النمو",
  "applied_at": "2026-03-14T18:30:00Z"
}
```

### Response JSON (n8n → App)
```json
{
  "success": true,
  "message": "Notifications sent",
  "notifications_sent": {
    "employer_email": true,
    "candidate_confirmation_email": true
  }
}
```

---

## Workflow 4: Smart Candidate Matching

**Env:** `N8N_SMART_MATCH_WEBHOOK`  
**Trigger:** Employer clicks "عرض أفضل المرشحين" on dashboard

### Node Flow

```
[Webhook] → [Supabase: Query Public Candidates] → [Code: Score Each Candidate] → [Code: Sort & Limit] → [Respond to Webhook]
```

1. **Webhook (Trigger)**
   - Method: POST
   - Path: `/gn-smart-match`
   - Response Mode: "Last Node"

2. **Supabase — Query Candidates**
   - Operation: Get Many Rows
   - Table: `candidates`
   - Filter: `is_public` = true
   - Also join `profiles` to get `full_name`
   - Select: `id, headline, skills, experience_years, residence_emirate`
   - Limit: 100 (we'll filter in next step)

3. **Code Node — Score Each Candidate**
   - Loop through each candidate
   - For each: calculate overlap between `$('Webhook').item.json.skills_required` and candidate's `skills`
   - Assign a `match_score` percentage
   - Filter out candidates below 30% match

4. **Code Node — Sort and Limit**
   - Sort by `match_score` descending
   - Take top N candidates (use `$('Webhook').item.json.limit` or default 10)
   - Format into the response structure

5. **Respond to Webhook**

### Incoming JSON (App → n8n)
```json
{
  "job_id": "uuid-of-job",
  "job_title": "مطور React أول",
  "skills_required": ["React", "TypeScript", "Node.js"],
  "experience_min": 3,
  "location": "دبي",
  "limit": 10
}
```

### Response JSON (n8n → App)
```json
{
  "success": true,
  "candidates": [
    {
      "candidate_id": "uuid-1",
      "name": "سارة خليل",
      "headline": "مطورة React أولى",
      "match_score": 95,
      "skills": ["React", "TypeScript", "Node.js", "GraphQL"],
      "experience_years": 6,
      "city": "دبي"
    },
    {
      "candidate_id": "uuid-2",
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

---

## Workflow 5: Message Notification

**Env:** `N8N_MESSAGE_NOTIFY_WEBHOOK`  
**Trigger:** A new message is sent in the chat

### Node Flow

```
[Webhook] → [Supabase: Get Recipient Email] → [Send Email Notification] → [Respond to Webhook]
```

1. **Webhook (Trigger)**
   - Method: POST
   - Path: `/gn-message-notify`
   - Response Mode: "Last Node"

2. **Supabase — Get Recipient Profile**
   - Operation: Get Single Row
   - Table: `profiles`
   - Filter: `id` equals `{{ $json.recipient_id }}`
   - Select: `email, full_name`

3. **Send Email**
   - To: recipient email from Supabase
   - Subject: `رسالة جديدة من {{ $('Webhook').item.json.sender_name }}`
   - Body:
     ```html
     <div dir="rtl" style="font-family: Arial, sans-serif;">
       <h3>لديك رسالة جديدة 💬</h3>
       <p><strong>من:</strong> {{ sender_name }}</p>
       <p><strong>الرسالة:</strong> {{ message_preview }}...</p>
       <a href="https://yourapp.com/candidate/messages">فتح المحادثة →</a>
     </div>
     ```

4. **Respond to Webhook**

### Incoming JSON (App → n8n)
```json
{
  "message_id": "uuid-of-message",
  "conversation_id": "uuid-of-conversation",
  "sender_id": "uuid-of-sender",
  "sender_name": "شركة النمو",
  "sender_role": "employer",
  "recipient_id": "uuid-of-recipient",
  "message_preview": "مرحباً سارة، نود دعوتك لمقابلة...",
  "sent_at": "2026-03-14T18:30:00Z"
}
```

### Response JSON (n8n → App)
```json
{
  "success": true,
  "message": "Notification delivered",
  "channels": {
    "email": true
  }
}
```

---

## Workflow 6: Payment Verification

**Env:** `N8N_PAYMENT_VERIFY_WEBHOOK`  
**Trigger:** After payment gateway redirects user back to the app

### Node Flow

```
[Webhook] → [Switch: By product_type] → [Branch A/B/C...] → [Supabase: Fulfill] → [Send Confirmation Email] → [Respond to Webhook]
```

1. **Webhook (Trigger)**
   - Method: POST
   - Path: `/gn-payment-verify`
   - Response Mode: "Last Node"

2. **HTTP Request — Verify with Payment Gateway** (Optional if using Stripe)
   - Method: GET
   - URL: `https://api.stripe.com/v1/checkout/sessions/{{ $json.gateway_session_id }}`
   - Auth: Bearer Token (Stripe secret key)
   - Check: `payment_status === 'paid'`

3. **Switch Node — By product_type**
   - Route based on `{{ $json.product_type }}`:
     - `job_credits` → Branch A
     - `featured_upgrade` → Branch B
     - `priority_apply` → Branch C
     - `cv_unlock` → Branch D
     - `cv_database` → Branch E
     - `profile_boost` → Branch F
     - `cv_review` → Branch G

4. **Branch A: Job Credits**
   - Supabase → Update `companies` table
   - Filter: `owner_id` = `{{ $json.user_id }}`
   - Set: `job_credits_remaining` = current + `{{ $json.product_details.package.split('_')[0] }}`

5. **Branch B: Featured Upgrade**
   - Supabase → Update `jobs` table
   - Filter: `id` = `{{ $json.product_details.job_id }}`
   - Set: `is_featured` = true, `featured_until` = NOW + duration_days

6. **Branch C: Priority Apply**
   - Supabase → Update `applications` table
   - Filter: `job_id` = `{{ $json.product_details.job_id }}` AND `candidate_id` = `{{ $json.user_id }}`
   - Set: `is_priority` = true

7. **Branch D: CV Unlock**
   - Supabase → Insert into `cv_unlocks` table
   - `employer_id` = `{{ $json.user_id }}`, `candidate_id` = `{{ $json.product_details.candidate_id }}`

8. **Branch E: CV Database Access**
   - Supabase → Update `companies` table
   - Set: `cv_database_access` = true, `cv_database_until` = NOW + 30 days

9. **Branch F: Profile Boost**
   - Supabase → Update `candidates` table
   - Filter: `id` = `{{ $json.user_id }}`
   - Set: `is_boosted` = true, `boosted_until` = NOW + duration_days

10. **Branch G: CV Review**
    - Supabase → Insert into `cv_review_orders` table
    - Send internal notification to review team

11. **Send Confirmation Email**
    - To: user email (fetch from `profiles` if needed)
    - Subject: `تأكيد الدفع — GrowthNexus`
    - Body with order details and receipt URL

12. **Respond to Webhook**

### Incoming JSON (App → n8n)
```json
{
  "transaction_id": "txn_abc123",
  "user_id": "uuid-of-user",
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

### Response JSON (n8n → App)
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

### Product Types Quick Reference

| `product_type` | Who | Price | What n8n does |
|---|---|---|---|
| `job_credits` | Employer | 149-499 AED | Add credits to `companies.job_credits_remaining` |
| `featured_upgrade` | Employer | 99 AED | Set `jobs.is_featured = true` + expiry |
| `priority_apply` | Candidate | 5 AED | Set `applications.is_priority = true` |
| `cv_unlock` | Employer | 15 AED | Insert into `cv_unlocks` |
| `cv_database` | Employer | 699 AED/mo | Set `companies.cv_database_access = true` |
| `profile_boost` | Candidate | 29-79 AED | Set `candidates.is_boosted = true` + expiry |
| `cv_review` | Candidate | 199 AED | Insert order, notify review team |

---

## 🗄️ Supabase Tables Referenced

Make sure these tables/columns exist before building the workflows:

| Table | Key Columns Used by Webhooks |
|---|---|
| `candidates` | `id`, `skills[]`, `experience_years`, `resume_parsed_data`, `is_public`, `headline`, `residence_emirate`, `is_boosted`, `boosted_until` |
| `profiles` | `id`, `email`, `full_name`, `avatar_url`, `role` |
| `applications` | `id`, `job_id`, `candidate_id`, `match_score`, `is_priority`, `status` |
| `jobs` | `id`, `title`, `skills_required[]`, `is_featured`, `featured_until` |
| `companies` | `id`, `owner_id`, `name`, `job_credits_remaining`, `cv_database_access`, `cv_database_until` |
| `conversations` | `id`, `participant_1`, `participant_2`, `last_message`, `last_message_at` |
| `messages` | `id`, `conversation_id`, `sender_id`, `content`, `is_read` |

### Tables You May Need to Create

```sql
-- CV Unlocks (for per-candidate paywall)
CREATE TABLE IF NOT EXISTS cv_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES profiles(id),
  candidate_id UUID REFERENCES candidates(id),
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employer_id, candidate_id)
);

-- CV Review Orders
CREATE TABLE IF NOT EXISTS cv_review_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID REFERENCES profiles(id),
  participant_2 UUID REFERENCES profiles(id),
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  unread_count_1 INTEGER DEFAULT 0,
  unread_count_2 INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE cv_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_review_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users see own unlocks" ON cv_unlocks FOR SELECT USING (auth.uid() = employer_id);
CREATE POLICY "Users see own review orders" ON cv_review_orders FOR SELECT USING (auth.uid() = candidate_id);
CREATE POLICY "Users see own conversations" ON conversations FOR ALL USING (auth.uid() IN (participant_1, participant_2));
CREATE POLICY "Users see own messages" ON messages FOR ALL USING (
  conversation_id IN (SELECT id FROM conversations WHERE auth.uid() IN (participant_1, participant_2))
);
CREATE POLICY "Users insert messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
```

---

## 🔐 Security Tip

Add a Header Auth check on each webhook:
- In n8n Webhook node → Authentication: "Header Auth"
- Header Name: `x-webhook-secret`
- Header Value: a random string you also put in your `.env.local`

Then in your Next.js API routes, add the header:
```typescript
fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET!
  },
  body: JSON.stringify(payload)
})
```
