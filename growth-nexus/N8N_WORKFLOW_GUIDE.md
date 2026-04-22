# 🔧 GrowthNexus — N8N Workflow Build Guide (v2)

> Step-by-step guide to build all 11 n8n workflows.
> Updated: April 22, 2026 — Phase 7

For each workflow: **Webhook URL**, **Node flow**, **Incoming JSON**, **Response JSON**, and **exact node configuration**.

---

## Workflow 1: CV Parser

**Env:** `NEXT_PUBLIC_N8N_CV_PARSER_WEBHOOK` | **Path:** `/gn-cv-parser`

### Node Flow
```
[Webhook] → [HTTP Request: Download PDF] → [Gemini: Extract Data] → [Supabase: Update Candidate] → [Respond to Webhook]
```

1. **Webhook** — POST, path `/gn-cv-parser`, Response Mode: "Last Node"
2. **HTTP Request** — GET `{{ $json.file_url }}`, Response Format: File
3. **Gemini/OpenAI** — System prompt: "You are a CV parser. Extract: skills[], experience_years, education[], summary (Arabic), languages[], certifications[]. Return ONLY valid JSON."
4. **Supabase Update** — Table `candidates`, filter `id = {{ $('Webhook').item.json.user_id }}`, set `resume_parsed_data`, `skills`, `experience_years`
5. **Respond** — Return `{ success: true, parsed_data: {...} }`

---

## Workflow 2: Match Score Calculator

**Env:** `N8N_MATCH_SCORE_WEBHOOK` | **Path:** `/gn-match-score`

### Node Flow
```
[Webhook] → [Code: Calculate Score] → [Supabase: Update Application] → [Respond to Webhook]
```

**Code Node (JavaScript):**
```javascript
const jobSkills = $input.item.json.job_skills_required || [];
const candidateSkills = $input.item.json.candidate_skills || [];
const intersection = jobSkills.filter(s => candidateSkills.map(c => c.toLowerCase()).includes(s.toLowerCase()));
const skillsMatch = jobSkills.length > 0 ? Math.round((intersection.length / jobSkills.length) * 100) : 50;
const expMatch = $input.item.json.candidate_experience_years >= $input.item.json.job_experience_min ? 100
  : Math.round(($input.item.json.candidate_experience_years / $input.item.json.job_experience_min) * 100);
const locMatch = $input.item.json.job_location === $input.item.json.candidate_location ? 100 : 50;
const score = Math.round(skillsMatch * 0.5 + expMatch * 0.3 + locMatch * 0.2);
return { match_score: score, breakdown: { skills_match: skillsMatch, experience_match: expMatch, location_match: locMatch } };
```

---

## Workflow 3: Application Notification

**Env:** `N8N_APPLICATION_NOTIFY_WEBHOOK` | **Path:** `/gn-application-notify`

### Node Flow
```
[Webhook] → [Supabase: Get Employer Email] → [Email: Employer] + [Email: Candidate] → [Respond]
```

**Employer Email Subject:** `مرشح جديد تقدم لوظيفة: {{ $json.job_title }}`
**Candidate Email Subject:** `تم تقديم طلبك لوظيفة {{ $json.job_title }}`

---

## Workflow 4: Smart Candidate Matching

**Env:** `N8N_SMART_MATCH_WEBHOOK` | **Path:** `/gn-smart-match`

### Node Flow
```
[Webhook] → [Supabase: Query Public Candidates] → [Code: Score & Sort] → [Respond]
```

Query `candidates` where `is_public = true`, score each against `skills_required`, sort desc, take top `limit`.

---

## Workflow 5: Message Notification

**Env:** `N8N_MESSAGE_NOTIFY_WEBHOOK` | **Path:** `/gn-message-notify`

### Node Flow
```
[Webhook] → [Supabase: Get Recipient Email] → [Email] → [Respond]
```

---

## Workflow 6: Payment Verification

**Env:** `N8N_PAYMENT_VERIFY_WEBHOOK` | **Path:** `/gn-payment-verify`

### Node Flow
```
[Webhook] → [HTTP: Verify with Gateway] → [Switch: By product_type] → [Supabase: Fulfill] → [Email: Confirmation] → [Respond]
```

Switch branches: `job_credits` → add to `companies.job_credits`, `featured_upgrade` → set `is_featured`, `priority_apply` → set `is_priority`, `cv_unlock` → insert `cv_unlocks`, `saas_subscription` → update `subscription_tier`.

---

## Workflow 7: AI Job Description Generator ⭐ NEW

**Env:** `N8N_AI_JOB_DESC_WEBHOOK` | **Path:** `/gn-ai-job-description`

### Node Flow
```
[Webhook] → [Gemini: Generate Description] → [Respond to Webhook]
```

1. **Webhook** — POST, path `/gn-ai-job-description`, Header Auth: `x-webhook-secret`
2. **Gemini/OpenAI** — System prompt:
   ```
   أنت خبير توظيف في سوق العمل الإماراتي. المطلوب:
   1. اكتب وصفاً وظيفياً احترافياً بالعربية للوظيفة التالية
   2. اكتب قائمة المتطلبات والمؤهلات المطلوبة
   
   المسمى: {{ $json.title }}
   النوع: {{ $json.job_type }}
   المدينة: {{ $json.location }}
   المستوى: {{ $json.experience_level }}
   المهارات: {{ $json.skills }}
   
   أعد JSON فقط بالشكل: { "description": "...", "requirements": "..." }
   ```
3. **Respond** — `{ success: true, description: "...", requirements: "..." }`

---

## Workflow 8: Company Verification ⭐ NEW

**Env:** `N8N_COMPANY_VERIFY_WEBHOOK` | **Path:** `/gn-company-verify`

### Node Flow
```
[Webhook] → [HTTP: Download License] → [Gemini Vision: OCR] → [Code: Calculate Trust Score] → [Supabase: Update Company] → [Respond]
```

1. **Webhook** — POST, Header Auth
2. **HTTP Request** — GET `{{ $json.trade_license_url }}`, Response: File
3. **Gemini Vision** — Prompt: "Extract from this UAE trade license: registration_number, entity_name, license_expiry, license_type. Return JSON only."
4. **Code Node** — Calculate trust score:
   ```javascript
   let score = 0;
   if ($input.item.json.registration_no) score += 40;
   if ($input.item.json.entity_name) score += 30;
   if ($input.item.json.license_expiry) {
     const expiry = new Date($input.item.json.license_expiry);
     if (expiry > new Date()) score += 30; else score += 10;
   }
   return { trust_score: score, verified: score >= 70 };
   ```
5. **Supabase Update** — `companies`, set `is_verified`, `trust_score` (add column if needed)
6. **Respond** — Full extracted data + trust score

---

## Workflow 9: Interview AI Evaluation ⭐ NEW

**Env:** `N8N_INTERVIEW_EVAL_WEBHOOK` | **Path:** `/gn-interview-eval`

### Node Flow
```
[Webhook] → [Code: Format Q&A] → [Gemini: Evaluate] → [JSON Parse] → [Respond]
```

1. **Webhook** — POST, Header Auth
2. **Code Node** — Format questions + answers into evaluation prompt
3. **Gemini/OpenAI** — System prompt:
   ```
   أنت خبير تقييم مقابلات توظيف. قيّم إجابات المرشح على كل سؤال.
   لكل سؤال أعطِ: score (1-10), feedback (بالعربية).
   ثم أعطِ overall_score و recommendation.
   أعد JSON فقط.
   ```
4. **Respond** — Structured evaluation with per-question scores

---

## Workflow 10: Committee Summary ⭐ NEW

**Env:** `N8N_COMMITTEE_SUMMARY_WEBHOOK` | **Path:** `/gn-committee-summary`

### Node Flow
```
[Webhook] → [Code: Statistical Analysis] → [Gemini: Generate Summary] → [Respond]
```

1. **Webhook** — POST, Header Auth
2. **Code Node** — Calculate average, median, std deviation, flag outliers:
   ```javascript
   const scores = $input.item.json.scores.map(s => s.score);
   const avg = scores.reduce((a,b) => a+b, 0) / scores.length;
   const sorted = [...scores].sort((a,b) => a-b);
   const median = sorted[Math.floor(sorted.length / 2)];
   const stdDev = Math.sqrt(scores.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / scores.length);
   const outliers = $input.item.json.scores.filter(s => Math.abs(s.score - avg) > 1.5 * stdDev);
   return { average_score: Math.round(avg), median_score: median, std_dev: Math.round(stdDev), outliers };
   ```
3. **Gemini** — Generate Arabic summary of consensus and disagreements
4. **Respond** — Stats + AI summary + recommendation

---

## Workflow 11: Contract/Offer Generation ⭐ NEW

**Env:** `N8N_CONTRACT_GEN_WEBHOOK` | **Path:** `/gn-contract-gen`

### Node Flow
```
[Webhook] → [Supabase: Get Template] → [Code: Merge Data] → [HTML to PDF] → [Supabase Storage: Upload] → [Respond]
```

1. **Webhook** — POST, Header Auth
2. **Supabase** — Fetch contract template HTML from `system_config` or templates table
3. **Code Node** — Replace placeholders: `{{candidate_name}}`, `{{position}}`, `{{salary}}`, `{{start_date}}`, `{{benefits}}`
4. **HTML to PDF** — Use n8n's HTML node or external service
5. **Supabase Storage** — Upload to `contracts/` bucket
6. **Respond** — `{ contract_url: "...", offer_letter_url: "..." }`

---

## 🔐 Security: Header Auth Setup

On every webhook node:
- Authentication: "Header Auth"
- Header Name: `x-webhook-secret`
- Header Value: same as `N8N_WEBHOOK_SECRET` in `.env.local`

In Next.js API routes:
```typescript
const res = await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-secret': process.env.N8N_WEBHOOK_SECRET!
  },
  body: JSON.stringify(payload)
});
```

---

## 🗄️ Supabase Tables Referenced

| Table | Key Columns Used |
|---|---|
| `candidates` | `id`, `skills[]`, `experience_years`, `resume_parsed_data`, `is_public`, `candidate_type` |
| `profiles` | `id`, `email`, `full_name`, `role` |
| `applications` | `id`, `job_id`, `candidate_id`, `status`, `match_score`, `rejection_reason`, `is_priority` |
| `jobs` | `id`, `title`, `skills_required[]`, `nationality_requirements[]`, `is_featured`, `status` |
| `companies` | `id`, `owner_id`, `name`, `company_type`, `is_verified`, `job_credits`, `subscription_tier` |
| `transactions` | `id`, `user_id`, `amount`, `currency`, `status`, `type` |
| `cv_unlocks` | `employer_id`, `candidate_id` |
| `system_config` | `key`, `value`, `group_name` |
