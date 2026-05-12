# 🔧 n8n CV Workflow Reuse Guide — From CV Maker to GrowthNexus

> **Purpose:** Step-by-step guide to copy 5 working n8n workflows from `cv-editor-maker-website` + build 1 new workflow for ATS conversion  
> **Total Workflows:** 6 (5 copied + 1 new)

---

## 📋 Source & Destination

| | CV Maker (Source) | GrowthNexus (Destination) |
|---|---|---|
| **n8n Instance** | `https://n8n.khalidbusiness.giize.com` | `https://n8n.asra3.com` |
| **Supabase** | `https://supabase.khalidbusiness.giize.com` | `https://cqahtitdamlunqjxeyeo.supabase.co` |
| **DB Schema** | `profiles(credits_cv, credits_chat)` | `profiles(credits_cv, credits_balance)` — dual model |
| **User Roles** | `TEXT ('user', 'admin')` | `ENUM ('candidate', 'employer', 'admin')` |
| **Chat table** | `chat_messages` | `cv_chat_messages` |

---

## 🔑 Global Modifications (Apply to ALL Workflows)

Before doing per-workflow changes, apply these globally:

### 1. Supabase Credentials
In every Supabase node across all workflows:
- **URL:** `https://cqahtitdamlunqjxeyeo.supabase.co`
- **Service Role Key:** (from `.env.local` → `SUPABASE_SERVICE_ROLE_KEY`)

### 2. Webhook Authentication
Every Webhook node:
- **Authentication:** Header Auth
- **Header Name:** `X-Webhook-Secret`
- **Header Value:** Same as `N8N_WEBHOOK_SECRET` in `.env.local`

### 3. Credit Logic (NEW: Dual Credits)
GrowthNexus uses the `deduct_cv_credits()` RPC function which checks `credits_cv` first, then falls back to `credits_balance`. 

**Option A (Recommended):** Replace credit-check nodes with a single Supabase RPC call:
```sql
SELECT deduct_cv_credits(userId, 1) AS success;
```

**Option B:** If keeping inline SQL in n8n, change:
```sql
-- OLD (CV Maker):
UPDATE profiles SET credits_cv = credits_cv - 1 WHERE id = $userId AND credits_cv > 0

-- NEW (GrowthNexus):
UPDATE profiles SET credits_cv = credits_cv - 1 WHERE id = $userId AND credits_cv > 0
-- IF no rows affected:
UPDATE profiles SET credits_balance = credits_balance - 1 WHERE id = $userId AND credits_balance > 0
```

### 4. Free Mode Toggle
During testing, you can skip credit checks entirely. Add this check to each workflow's credit node:
```sql
SELECT value FROM system_config WHERE key = 'cv_services_free_mode';
-- If value = 'true' → skip credit deduction, proceed directly
```

---

## 🔄 Workflow 1: `parse-cv` → `gn-cv-parse`

**What it does:** Receives PDF → AI extracts text → creates `cv_sessions` row → returns text + sessionId

**Original path:** `/webhook/parse-cv`  
**New path:** `/webhook/gn-cv-parse`

### .env.local:
```env
N8N_CV_PARSE_WEBHOOK=https://n8n.asra3.com/webhook/gn-cv-parse
```

### Nodes to modify:

| Node | Change |
|------|--------|
| Webhook | Path → `gn-cv-parse`, add `language` to expected body fields |
| Supabase: Create Session | INSERT INTO `cv_sessions` — add `language`, `input_mode = 'upload'`, `session_type = 'optimize'` |
| Supabase: Store Text | UPDATE `cv_sessions` SET `text_content = ...` |
| Credit Check | Use `deduct_cv_credits()` RPC or check `cv_services_free_mode` |

### Expected Input:
```json
{
  "userId": "uuid",
  "pdfBase64": "base64-encoded-pdf",
  "language": "en"    // NEW: "en" | "ar" | "bilingual"
}
```

### Expected Output:
```json
{
  "sessionId": "uuid",
  "text": "extracted CV text...",
  "language": "en"
}
```

### How to copy:
1. `n8n.khalidbusiness.giize.com` → find `parse-cv` → **Download as JSON**
2. `n8n.asra3.com` → **Import from File** → Rename to `GN - CV Parse`
3. Apply global modifications (Supabase creds, webhook auth)
4. Update INSERT to include `language`, `session_type`, `input_mode`
5. **Activate**

---

## 🔄 Workflow 2: `optimize-cv` → `gn-cv-optimize`

**What it does:** AI chat loop — takes session + user prompt → AI improves CV → returns updated text/PDF

**Original path:** `/webhook/optimize-cv`  
**New path:** `/webhook/gn-cv-optimize`

### .env.local:
```env
N8N_CV_OPTIMIZE_WEBHOOK=https://n8n.asra3.com/webhook/gn-cv-optimize
```

### Nodes to modify:

| Node | Change |
|------|--------|
| Webhook | Path → `gn-cv-optimize`, add `language` field |
| Chat Message INSERT | Table: `chat_messages` → **`cv_chat_messages`** |
| AI Prompt | Add language instruction: see prompt template below |
| Credit Check | Use `deduct_cv_credits()` RPC |
| Session Update | UPDATE `cv_sessions` — compatible, no change needed |

### Language-aware AI Prompt:
Add this to the system prompt in the AI node:
```
{{#if language === 'ar'}}
Write all CV content in formal Arabic (فصحى). Use Arabic section headers.
{{else if language === 'bilingual'}}
Write the CV with section headers in both English and Arabic. Primary content in English with Arabic translations.
{{else}}
Write all CV content in professional English.
{{/if}}
```

### Expected Input:
```json
{
  "sessionId": "uuid",
  "currentText": "full CV text",
  "userPrompt": "Optimize this for ATS",
  "language": "en"
}
```

### Expected Output:
```json
{
  "type": "pdf_update",
  "message": "I've optimized your CV for ATS compatibility...",
  "optimizedText": "full optimized CV text",
  "pdfBase64": "base64-encoded-pdf"
}
```

---

## 🔄 Workflow 3: `create-cv` → `gn-cv-create`

**What it does:** Takes structured CvData form → AI generates professional PDF

**Original path:** `/webhook/create-cv`  
**New path:** `/webhook/gn-cv-create`

### .env.local:
```env
N8N_CV_CREATE_WEBHOOK=https://n8n.asra3.com/webhook/gn-cv-create
```

### Nodes to modify:

| Node | Change |
|------|--------|
| Webhook | Path → `gn-cv-create`, add `language` field |
| Session INSERT | Add `session_type = 'create'`, `input_mode = 'form'`, `language`, `form_data = cvDataJson` |
| AI Prompt | Add language instruction (same as optimize) |
| Storage Upload | Verify bucket name exists (`cv-files` or `resumes`) |
| Credit Check | Use `deduct_cv_credits()` RPC |

### Expected Input:
```json
{
  "userId": "uuid",
  "language": "ar",
  "cvData": {
    "fullName": "أحمد محمد",
    "jobTitle": "مهندس برمجيات",
    "experience": [...],
    "education": [...],
    "skills": [...]
  }
}
```

### Expected Output:
```json
{
  "sessionId": "uuid",
  "downloadUrl": "https://supabase.../cv-files/uuid/cv.pdf",
  "parsedData": {
    "skills": ["React", "Node.js"],
    "yearsExperience": 5
  }
}
```

---

## 🔄 Workflow 4: `finalize-cv` → `gn-cv-finalize`

**What it does:** Marks session as downloaded, returns final download URL

**Original path:** `/webhook/finalize-cv`  
**New path:** `/webhook/gn-cv-finalize`

### .env.local:
```env
N8N_CV_FINALIZE_WEBHOOK=https://n8n.asra3.com/webhook/gn-cv-finalize
```

### Nodes to modify:

| Node | Change |
|------|--------|
| Webhook | Path → `gn-cv-finalize` |
| Session UPDATE | `status = 'downloaded'`, `final_pdf_url = storageUrl` — compatible |
| Credit Check | Use `deduct_cv_credits()` if applicable |

> [!IMPORTANT]
> The **auto-link step** (updating `candidates.cv_url`) is handled by the Next.js API route `/api/cv/finalize`, NOT in the n8n workflow. This keeps the workflow simple and the auto-link logic in one place.

### Expected Input:
```json
{
  "sessionId": "uuid",
  "userId": "uuid"
}
```

### Expected Output:
```json
{
  "downloadUrl": "https://supabase.../cv-files/uuid/final-cv.pdf",
  "sessionId": "uuid"
}
```

---

## 🔄 Workflow 5: `send-email-reply` → `gn-email-send`

**What it does:** Generic SMTP email sender

**Original path:** `/webhook/send-email-reply`  
**New path:** `/webhook/gn-email-send`

### .env.local:
```env
N8N_EMAIL_SEND_WEBHOOK=https://n8n.asra3.com/webhook/gn-email-send
```

### Nodes to modify:

| Node | Change |
|------|--------|
| Webhook | Path → `gn-email-send` |
| SMTP/Email Node | Update SMTP credentials for GrowthNexus domain |
| From Address | `noreply@yourdomain.com` |

### No schema changes — this is a pure SMTP relay.

### Expected Input:
```json
{
  "to": "candidate@example.com",
  "subject": "Your CV is ready!",
  "message": "<h1>Download your CV</h1><p>Your ATS-optimized CV is ready.</p>",
  "type": "cv_ready"
}
```

---

## 🆕 Workflow 6: `gn-cv-ats-convert` (BUILD NEW — Not Copied)

> This is a **NEW workflow** that doesn't exist in CV Maker. Build it from scratch in `n8n.asra3.com`.

### .env.local:
```env
N8N_CV_ATS_CONVERT_WEBHOOK=https://n8n.asra3.com/webhook/gn-cv-ats-convert
```

### What it does:
Takes a raw CV (PDF or pasted text) → AI extracts structured data → AI rewrites in ATS-optimized format → generates professional PDF → returns download URL + structured data

### Flow Diagram:
```
Webhook → [If PDF: Extract Text] → AI Extract Data → AI ATS Rewrite → PDF Generate → Store in Supabase → Return
```

### Node-by-Node Build Guide:

#### Node 1: Webhook
- **Method:** POST
- **Path:** `gn-cv-ats-convert`
- **Authentication:** Header Auth (`X-Webhook-Secret`)
- **Expected body:**
```json
{
  "inputType": "pdf",           // "pdf" or "text"
  "pdfBase64": "base64...",     // only if inputType=pdf
  "rawText": "CV text...",      // only if inputType=text
  "userId": "uuid",
  "language": "en"              // "en" | "ar" | "bilingual"
}
```

#### Node 2: IF Node (Check inputType)
- **Condition:** `{{ $json.inputType === 'pdf' }}`
- **True branch:** Go to Node 3 (PDF to text)
- **False branch:** Go to Node 4 (Skip extraction, use rawText)

#### Node 3: AI — Extract Text from PDF (True Branch Only)
- **Model:** Gemini 2.0 / GPT-4o
- **Prompt:**
```
Extract all text from this PDF document. Preserve the structure and content accurately.
Return only the extracted text, no commentary.
```
- **Input:** The PDF binary (decode from base64)
- **Output:** Raw text content

#### Node 4: Set Node — Merge Text
- Combine output: `text = Node3.output || $json.rawText`

#### Node 5: AI — Extract Structured Data
- **Model:** Gemini 2.0 / GPT-4o
- **System Prompt:**
```
You are a professional CV/Resume parser. Analyze the following CV text and extract structured data.

Return a JSON object with this EXACT structure:
{
  "fullName": "string",
  "email": "string or empty",
  "phone": "string or empty",
  "currentTitle": "most recent job title",
  "summary": "professional summary in 2-3 sentences",
  "skills": ["skill1", "skill2", ...],
  "yearsExperience": number (estimate from work history),
  "experience": [
    {"title": "Job Title", "company": "Company", "duration": "Jan 2020 - Present"}
  ],
  "education": [
    {"degree": "BSc Computer Science", "institution": "University Name", "year": "2018"}
  ]
}

Be thorough. Extract ALL skills mentioned. Estimate years of experience from the date ranges.
```
- **User Message:** `{{ $json.text }}`
- **Output:** Parsed JSON (→ stored as `parsed_data`)

#### Node 6: AI — ATS Rewrite
- **Model:** Gemini 2.0 / GPT-4o
- **System Prompt:**
```
You are an expert ATS (Applicant Tracking System) CV writer.

Rewrite the following CV following these ATS best practices:
1. Use clear, standard section headers (Experience, Education, Skills, etc.)
2. Include keywords from the original CV
3. Quantify achievements where possible (added X%, managed Y people)
4. Use reverse chronological order
5. No tables, graphics, columns, or special formatting
6. Use bullet points for experience descriptions
7. Include a strong professional summary at the top
8. List skills as comma-separated keywords for ATS parsing

{{#if language === 'ar'}}
Write the entire CV in formal Arabic (فصحى). Use Arabic section headers: 
الملخص المهني، الخبرات العملية، التعليم، المهارات، اللغات
{{else if language === 'bilingual'}}
Write section headers in both English and Arabic. Content primarily in English.
Example: "Professional Summary | الملخص المهني"
{{else}}
Write the entire CV in professional English.
{{/if}}

IMPORTANT: Return ONLY the CV text, ready for PDF generation. No commentary.
```
- **User Message:** `{{ JSON.stringify($json.parsedData) }}`

#### Node 7: PDF Generator
- **Use:** HTML-to-PDF node or external API
- **Input:** The ATS-optimized text from Node 6
- **Template:** Clean, single-column, ATS-friendly layout
- **Output:** PDF binary

#### Node 8: Supabase — Upload PDF
- **Action:** Upload to Storage
- **Bucket:** `cv-files`
- **Path:** `{{ $json.userId }}/ats-{{ Date.now() }}.pdf`
- **File:** PDF binary from Node 7

#### Node 9: Supabase — Create Session
```sql
INSERT INTO cv_sessions (user_id, session_type, input_mode, language, status, text_content, parsed_data, final_pdf_url)
VALUES ($userId, 'ats_convert', $inputMode, $language, 'ready', $originalText, $parsedData, $pdfUrl)
RETURNING id
```

#### Node 10: Respond to Webhook
```json
{
  "sessionId": "{{ $json.id }}",
  "downloadUrl": "{{ $json.pdfUrl }}",
  "parsedData": {
    "fullName": "...",
    "skills": ["React", "Node.js", ...],
    "yearsExperience": 5,
    "experience": [...],
    "education": [...]
  }
}
```

### Complete n8n JSON Structure:
```
Webhook → IF(inputType) → [PDF: AI Extract] → Set(merge) → AI(parse) → AI(ATS rewrite) → PDF Gen → Storage Upload → DB Insert → Respond
```

---

## 📦 Complete .env.local Additions

Add these to `growth-nexus/.env.local`:

```env
# ===== CV Services (Phase 11) =====

# 13. CV Parser — extracts text from uploaded PDF
N8N_CV_PARSE_WEBHOOK=https://n8n.asra3.com/webhook/gn-cv-parse

# 14. CV Optimizer — AI chat loop to improve CV
N8N_CV_OPTIMIZE_WEBHOOK=https://n8n.asra3.com/webhook/gn-cv-optimize

# 15. CV Creator — generates PDF from structured form data
N8N_CV_CREATE_WEBHOOK=https://n8n.asra3.com/webhook/gn-cv-create

# 16. CV ATS Converter — upload/paste → ATS-ready CV (NEW WORKFLOW)
N8N_CV_ATS_CONVERT_WEBHOOK=https://n8n.asra3.com/webhook/gn-cv-ats-convert

# 17. CV Finalize — marks complete + auto-links to candidate profile
N8N_CV_FINALIZE_WEBHOOK=https://n8n.asra3.com/webhook/gn-cv-finalize

# 18. Email Sender — generic SMTP via n8n
N8N_EMAIL_SEND_WEBHOOK=https://n8n.asra3.com/webhook/gn-email-send
```

---

## ⚠️ Critical Modifications Checklist

Before activating each workflow, verify ALL of these:

### For ALL 6 Workflows:
- [ ] Supabase URL updated to `cqahtitdamlunqjxeyeo.supabase.co`
- [ ] Supabase Service Role Key updated
- [ ] Webhook path renamed to `gn-*` convention
- [ ] Header Auth enabled with `N8N_WEBHOOK_SECRET`

### For Copied Workflows (1-5):
- [ ] Credit logic → uses `deduct_cv_credits()` RPC or respects `cv_services_free_mode`
- [ ] Chat table → `chat_messages` renamed to `cv_chat_messages`
- [ ] Session INSERT includes `language`, `session_type`, `input_mode`
- [ ] AI prompts include language conditional logic
- [ ] Storage bucket `cv-files` exists in GrowthNexus Supabase

### For New Workflow (6 — ATS Convert):
- [ ] All 10 nodes built and connected
- [ ] AI model credentials configured (Gemini/GPT API key)
- [ ] PDF generator node configured (HTML-to-PDF)
- [ ] Storage bucket `cv-files` exists
- [ ] Parsed data JSON structure matches `CvParsedData` TypeScript type
- [ ] Language switching works in AI prompts (test AR, EN, Bilingual)

---

## 🧪 Testing Each Workflow

### Test Order:

**1. Email Send** (simplest — no DB):
```bash
curl -X POST https://n8n.asra3.com/webhook/gn-email-send \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{"to":"your@email.com","subject":"Test","message":"Hello from GrowthNexus"}'
```

**2. CV Parse** (needs PDF + DB write):
```bash
# Convert a test PDF to base64 first:
# base64 test-cv.pdf > test-cv-base64.txt
curl -X POST https://n8n.asra3.com/webhook/gn-cv-parse \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{"userId":"test-uuid","pdfBase64":"<base64>","language":"en"}'
```
✅ Check: `cv_sessions` table has new row with `session_type='optimize'`

**3. CV Optimize** (needs active session):
```bash
curl -X POST https://n8n.asra3.com/webhook/gn-cv-optimize \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{"sessionId":"<from-step-2>","currentText":"John Doe, Software Engineer...","userPrompt":"Optimize for ATS","language":"en"}'
```
✅ Check: `cv_chat_messages` table has AI response row

**4. CV ATS Convert** (test with text paste):
```bash
curl -X POST https://n8n.asra3.com/webhook/gn-cv-ats-convert \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{"inputType":"text","rawText":"Ahmad Mohamed\nSoftware Engineer\n5 years experience in React and Node.js\nBSc Computer Science","userId":"test-uuid","language":"ar"}'
```
✅ Check: Returns `parsedData` with extracted skills + Arabic PDF download URL

**5. CV Create** (needs form data):
```bash
curl -X POST https://n8n.asra3.com/webhook/gn-cv-create \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{"userId":"test-uuid","language":"en","cvData":{"fullName":"Test User","jobTitle":"Engineer","experience":[],"education":[],"skills":[{"name":"React"}]}}'
```
✅ Check: Returns `downloadUrl` with valid PDF

**6. CV Finalize** (needs active session):
```bash
curl -X POST https://n8n.asra3.com/webhook/gn-cv-finalize \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{"sessionId":"<from-any-above>","userId":"test-uuid"}'
```
✅ Check: `cv_sessions.status = 'downloaded'`, `final_pdf_url` populated

**7. Auto-Link Test** (API route, not n8n):
- After finalize, the Next.js API calls `cv_auto_link()` RPC
- ✅ Check: `candidates.cv_url` matches `cv_sessions.final_pdf_url`
- ✅ Check: `candidates.skills` updated with extracted skills

---

## 🗺️ Architecture After Full Integration

```
┌──────────────────────────────────────────────────────────────┐
│                    GrowthNexus Frontend                       │
│                                                               │
│  ┌────────────────────┐    ┌──────────────────────────────┐  │
│  │   CV Optimizer      │    │       CV Builder              │  │
│  │ /candidate/cv-opt   │    │  /candidate/cv-builder        │  │
│  │                     │    │                                │  │
│  │ [Upload PDF]        │    │ Tab 1: Build from Scratch     │  │
│  │ [AI Chat Panel]     │    │ Tab 2: Upload → ATS Convert   │  │
│  │ [Language: EN/AR]   │    │ Tab 3: Paste → ATS Convert    │  │
│  │ [Download Final]    │    │ [Language: EN/AR/Bilingual]    │  │
│  └─────────┬──────────┘    └──────────┬─────────────────────┘  │
└────────────┼───────────────────────────┼────────────────────────┘
             │                           │
    ┌────────▼────────┐    ┌────────────▼──────────────┐
    │ /api/cv/parse    │    │ /api/cv/create            │
    │ /api/cv/optimize │    │ /api/cv/ats-convert  🆕   │
    │ /api/cv/finalize │    │ /api/cv/finalize          │
    └────────┬────────┘    └────────────┬──────────────┘
             │                           │
    ┌────────▼───────────────────────────▼──────────────┐
    │              n8n.asra3.com (6 workflows)           │
    │                                                     │
    │  gn-cv-parse  │  gn-cv-optimize  │  gn-cv-create  │
    │  gn-cv-ats-convert 🆕  │  gn-cv-finalize           │
    │  gn-email-send                                      │
    └────────────────────┬────────────────────────────────┘
                         │
    ┌────────────────────▼────────────────────────────────┐
    │          Supabase (GrowthNexus Production)           │
    │                                                      │
    │  ┌────────────┐  ┌──────────────────┐               │
    │  │cv_sessions  │  │cv_chat_messages  │               │
    │  │(with lang)  │  │(AI chat history) │               │
    │  └──────┬─────┘  └─────────────────┘               │
    │         │ auto-link (RPC)                            │
    │  ┌──────▼──────────────────────────┐                │
    │  │ candidates                       │                │
    │  │  cv_url ← auto-updated!         │                │
    │  │  skills[] ← auto-extracted!     │                │
    │  │  resume_parsed_data ← enriched! │                │
    │  └─────────────────────────────────┘                │
    └──────────────────────────────────────────────────────┘
```

---

## Summary: All 6 Workflows

| # | Workflow | Source | Action | Key Modification |
|---|----------|--------|--------|------------------|
| 1 | `gn-cv-parse` | Copy from CV Maker | Extract text from PDF | Add `language`, rename tables |
| 2 | `gn-cv-optimize` | Copy from CV Maker | AI chat loop | `chat_messages` → `cv_chat_messages`, add language prompts |
| 3 | `gn-cv-create` | Copy from CV Maker | Form → PDF | Add `language`, `form_data`, `session_type` |
| 4 | `gn-cv-ats-convert` | **BUILD NEW** 🆕 | Raw CV → ATS PDF | 10-node workflow, includes parsing + rewriting |
| 5 | `gn-cv-finalize` | Copy from CV Maker | Mark done, return URL | No schema changes, auto-link done in API |
| 6 | `gn-email-send` | Copy from CV Maker | SMTP email | Only change SMTP creds + webhook path |
