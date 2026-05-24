# 🔌 GrowthNexus — N8N Webhooks Status

> **Last Updated:** 24 May 2026 — 06:00 AM
> **Roadmap:** See `ROADMAP.md` for sprint execution plan

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
| 7 | **Smart Candidate Matching** | `/gn-smart-match` | ⚠️ Partial | **Full candidate search DONE** — auto match score (circle + progress bar), multi-term search, filter by job, case-insensitive partial match. n8n AI ranking pending |
| 8 | **Message Notification** | `/gn-message-notify` | ❌ Not Started | Notify user when they receive a new message |
| 9 | **Payment Verification** | `/gn-payment-verify` | ❌ Not Started | Verify Stripe/EdfaPay → fulfill subscription/credits |
| 10 | **Company Verification** | `/gn-company-verify` | ✅ Done | Webhook → HTTP Download → Gemini OCR → Decision Engine (risk scoring) → 3× Supabase updates (company status, doc OCR data, audit log). Triggered by Supabase DB webhook on `company_documents` INSERT |
| 11 | **Committee Summary** | `/gn-committee-summary` | ✅ Done | Webhook → Gemini → Code cleanup → Respond. Auto-triggers when 2+ evaluators submit |
| 12 | **Contract Notifications** | (direct fetch) | ✅ Done | **Merged into main `n8n workflow.json`**. 4 events: created / sent / signed / declined. Switch node routes to 4 email templates. S2S auth via `N8N_WEBHOOK_SECRET`. |
| 13 | **Contract Generation** | `/gn-contract-gen` | 🔧 Code Ready | API route at `/api/contracts/generate` works end-to-end. PDF via `/api/contracts/pdf/[id]`. **Optional: n8n workflow for HTML→PDF if needed** |
| 14 | **External Jobs Import** | `/api/external-jobs` | 🔧 Code Ready | Upsert API for scraped jobs (LinkedIn/Bayt/Indeed). S2S auth via `N8N_WEBHOOK_SECRET`. Admin panel at `/admin/external-jobs`. **Needs: n8n scraper workflow** |
| 15 | **CV Parse (GrowthNexus)** | `/gn-cv-parse` | ✅ Done 🆕 | Webhook → HTTP Download PDF → Extract Text → Gemini Parse → Create cv_session → Respond. Separate workflow from #1, dedicated to CV Optimizer feature |
| 16 | **CV Optimize** | `/gn-cv-optimize` | ✅ Done 🆕 | Webhook → Load session + config → Credit check → Gemini LLM (chat vs modification) → Gotenberg HTML→PDF → Supabase session update → Respond. Full AI chat + CV rewrite engine |
| 17 | **CV ATS Convert** | `/gn-cv-ats-convert` | ✅ Done 🆕 | In main `n8n workflow.json`. Webhook → IF PDF → Extract text → Gemini reformat → Gotenberg PDF → Supabase Storage → Create cv_session → Respond. Supports PDF upload + raw text input |
| 18 | **CV Create (Builder)** | `/gn-cv-create` | ✅ Done 🆕 | In main `n8n workflow.json`. Webhook → Load profile + config → Gemini LLM → Gotenberg HTML→PDF → Supabase Storage → Create cv_session → Respond. Form data → professional PDF |
| — | **CV Finalize** | `/api/cv/finalize` | ✅ No n8n needed | API route works **locally** — marks session `ready`, returns best download URL. n8n webhook is optional fallback (commented out in .env) |

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Done / No n8n needed | 14 |
| ⚠️ Partial / Code Ready | 3 |
| ❌ Not Started | 2 |

## n8n Workflow JSON Files

| File | Contains | Status |
|------|----------|--------|
| `n8n workflow.json` | **Single main workflow** — **13 webhook paths** (136 nodes total). Contains ALL workflows: CV Parser, AI Job Desc, Match Score, Interview Q/Eval, Committee, App Notify, Company Verify, Contract Notify, CV Parse, CV Optimize, CV ATS Convert, CV Create | ✅ Active |
| `n8n-contract-notify-workflow.json` | ⚠️ **Legacy standalone** — superceded by contract notify nodes in main workflow | 🔄 Merged into main |

> **Note:** ALL 13 workflows are inside a **single** `n8n workflow.json` file (136 nodes). **CV Finalize does NOT need an n8n workflow** — the API route handles everything locally.

## CV Optimizer Workflow Details (New — 13 May 2026) 🆕

### `/gn-cv-parse` — CV Parse Pipeline
```
Webhook → HTTP Download PDF → Extract from File (text) → Gemini Parse
       → Create cv_session in Supabase (status: active, session_type: optimize)
       → Respond with { sessionId, textContent, language }
```

### `/gn-cv-optimize` — Optimization Engine
```
Webhook (prompt, sessionId, language, chatHistory)
       → Load session from Supabase
       → Load system_config (cv_optimize_cost, cv_services_free_mode)
       → Credit check (free mode OR deduct_cv_credits RPC)
       → Gemini LLM Analysis:
           - Chat-only → reply in user's language
           - CV Modification → rewrite CV HTML (English) + reply in user's language
       → If modification: Gotenberg HTML→PDF conversion
       → Update cv_session (latest_draft_url, text_content)
       → Save chat_history to cv_session
       → Respond with { replyMessage, cvHtml?, pdfUrl?, creditDeducted }
```

**Key Design Decisions:**
- CV content is ALWAYS in English regardless of chat language
- Chat replies match the user's selected language (EN/AR)
- Credits: `credits_cv` first, fallback to `credits_balance`
- Free mode toggle via `system_config.cv_services_free_mode`
- PDF generation via Gotenberg (external service)

## Where Results Appear

| Feature | Candidate Sees | Employer Sees |
|---------|---------------|---------------|
| **CV Parser** | `/candidate/cv` — parsed skills, experience, education | `/employer/jobs/[id]/applicants` — in detail modal (AI Insights) |
| **CV Optimizer** 🆕 | `/candidate/cv/optimize` — split-screen PDF viewer + AI chat, session history table | — |
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

### ~~1. CV Create~~ ✅ DONE (14 May 2026)
~~n8n workflow for CV Builder form data → PDF.~~

### ~~2. CV ATS Convert~~ ✅ DONE (14 May 2026)
~~n8n workflow for ATS-ready CV conversion.~~

### 3. External Jobs Scraper (#14) — HIGH VALUE
Build n8n scraper workflow for LinkedIn/Bayt/Indeed → `/api/external-jobs`.
See: `N8N_EXTERNAL_JOBS_WORKFLOW_GUIDE.md`

### ~~4. Smart Candidate Matching (#7)~~ ⚠️ PARTIAL (24 May 2026)
~~Employer can search their candidate pool and AI ranks best matches for a job.~~
**Done:** Full candidate search rewritten — auto match score vs ALL employer jobs (circle + progress bar, color-coded), multi-term search (comma/space), filter by job dropdown, case-insensitive partial match, CV PDF viewer, separate DB queries (no FK join). Bilingual Jaccard on dashboards.
**Remaining:** n8n AI-powered ranking workflow for deeper semantic matching.

### ~~5. Company Verification (#10)~~ ✅ DONE
~~OCR trade license, extract company data, calculate trust score.~~

### 6. Payment Verification (#9) — MONETIZATION
Stripe/EdfaPay webhook to fulfill subscriptions and credits.

### 7. Application Notification (#6) — FINISH
Add Email/Telegram send node in existing n8n workflow.

### 8. Message Notification (#8) — NICE TO HAVE
Chat message notifications.

### ~~9. CV Finalize~~ — ✅ NOT NEEDED
~~API route works locally without n8n workflow.~~

---

## 📅 Sprint 1 — Upcoming B2C Webhooks (Not Yet Built)

> These n8n workflows will be built during Sprint 1 (B2C Revenue Services).
> Each needs: Webhook node + Gemini LLM + Supabase read/write + Respond node.

| # | Webhook | Path | Service | Price |
|---|---------|------|---------|-------|
| 19 | Interview Practice | `/webhook/gn-interview-practice` | Self-practice questions + eval | 39 AED/mo |
| 20 | Rejection Analyzer | `/webhook/gn-rejection-analyze` | AI analysis of rejections | 29 AED |
| 21 | Career Path | `/webhook/gn-career-path` | AI career trajectory | 29 AED/mo |
| 22 | Skill Gap | `/webhook/gn-skill-gap` | Skill comparison analysis | 25 AED |
| 23 | Job Alerts (cron) | `/webhook/gn-job-alerts` | Daily/weekly job digest | 19 AED/mo |
| 24 | Auto Apply | `/webhook/gn-auto-apply` | Auto-submit applications | 49–149 AED/mo |

### Sprint 2 — Infrastructure Webhooks
| # | Webhook | Path | Service | Status |
|---|---------|------|---------|--------|
| 25 | External Jobs Scraper | Schedule trigger | LinkedIn/Bayt/Indeed scraper | 🔧 Guide ready |
| 26 | Email Send | `/webhook/gn-email-send` | Generic SMTP sender | 🔧 API ready |
