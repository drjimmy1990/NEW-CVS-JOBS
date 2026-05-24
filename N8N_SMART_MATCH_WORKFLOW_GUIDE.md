# 🧠 N8N Smart Match AI Workflow — Setup Guide

> **Workflow File:** `n8n-smart-match-workflow.json`
> **Webhook Path:** `/webhook/gn-smart-match`
> **API Route:** `POST /api/ai/smart-match`
> **Env Var:** `N8N_SMART_MATCH_WEBHOOK`

---

## Architecture

```
Employer clicks "AI Match" on candidates page
        ↓
POST /api/ai/smart-match { job_id, candidate_ids?, limit? }
        ↓
API fetches job + candidates from Supabase (service role)
        ↓
Sends batch to n8n webhook: { job: {...}, candidates: [...] }
        ↓
n8n → Build Prompt → Gemini 2.0 Flash → Parse JSON → Respond
        ↓
Returns: { rankings: [{ candidate_id, score, reasoning, strengths, gaps, recommendation }] }
        ↓
Frontend displays AI scores + Arabic reasoning
```

## Flow Diagram

```
[Webhook] → [Build AI Prompt] → [Gemini Rank] → [Parse AI Response] → [Respond]
   POST        Code node           LLM node         Code node          JSON
```

---

## Setup Steps

### 1. Import Workflow

1. Open **n8n.asra3.com** → Workflows → Import from File
2. Select `n8n-smart-match-workflow.json`
3. Click **Import**

### 2. Configure Credentials

1. Click on the **"Gemini Rank"** node
2. Set credentials to your Google Gemini API key
3. Model: `models/gemini-2.0-flash` (fast + cheap)

### 3. Configure Webhook Auth

1. Click on the **"Webhook"** node
2. Authentication: **Header Auth**
3. Header Name: `x-webhook-secret`
4. Header Value: Same as `N8N_WEBHOOK_SECRET` in `.env.local`

### 4. Update Environment Variable

```bash
# In .env.local on the server:
N8N_SMART_MATCH_WEBHOOK=https://n8n.asra3.com/webhook/gn-smart-match
```

### 5. Activate Workflow

1. Toggle the workflow to **Active**
2. Test with the test payload below

---

## Test Payload

```json
{
  "job": {
    "id": "test-job-1",
    "title": "مطور واجهات أمامية",
    "description": "نبحث عن مطور React خبير لبناء تطبيقات ويب حديثة",
    "skills_required": ["React", "TypeScript", "Node.js", "CSS"],
    "job_type": "full_time",
    "location": "Dubai",
    "salary_range": "15000-25000 AED",
    "experience_min": 3,
    "nationality_required": "All"
  },
  "candidates": [
    {
      "id": "candidate-1",
      "name": "أحمد محمد",
      "headline": "مطور Full Stack",
      "skills": ["React", "Node.js", "Python", "MongoDB", "TypeScript"],
      "years_experience": 5,
      "location": "Dubai",
      "nationality": "مصري",
      "education": ["بكالوريوس علوم حاسب"],
      "summary": "مطور خبير بتطوير تطبيقات الويب"
    },
    {
      "id": "candidate-2",
      "name": "سارة علي",
      "headline": "صيدلانية",
      "skills": ["إدارة", "خدمة عملاء", "Excel"],
      "years_experience": 3,
      "location": "Abu Dhabi",
      "nationality": "إماراتي",
      "education": ["بكالوريوس صيدلة"],
      "summary": "صيدلانية بخبرة في المبيعات"
    }
  ],
  "employer_id": "test-employer"
}
```

### Expected Response

```json
{
  "rankings": [
    {
      "candidate_id": "candidate-1",
      "name": "أحمد محمد",
      "score": 92,
      "reasoning": "يمتلك أحمد خبرة قوية في React و TypeScript و Node.js وهي المهارات الأساسية المطلوبة. خبرته 5 سنوات تتجاوز الحد الأدنى المطلوب. موقعه في دبي يتوافق مع موقع الوظيفة.",
      "strengths": ["React", "TypeScript", "Node.js"],
      "gaps": ["CSS"],
      "recommendation": "مناسب جداً"
    },
    {
      "candidate_id": "candidate-2",
      "name": "سارة علي",
      "score": 8,
      "reasoning": "مؤهلات سارة في الصيدلة لا تتوافق مع متطلبات الوظيفة التقنية. لا تمتلك أي من المهارات البرمجية المطلوبة.",
      "strengths": [],
      "gaps": ["React", "TypeScript", "Node.js", "CSS"],
      "recommendation": "غير مناسب"
    }
  ]
}
```

---

## What Makes This "Smart" vs Basic Matching

| Feature | Basic (Jaccard) | AI Smart Match |
|---------|----------------|----------------|
| **Skill Matching** | Exact keyword match | Semantic — "React" ↔ "Frontend" ↔ "Vue.js" |
| **Experience** | Number comparison | Context-aware — "3 years React" > "5 years PHP" for React job |
| **Education** | Not considered | Degree relevance analyzed |
| **Nationality** | Not considered | UAE market preferences applied |
| **Output** | % number only | Score + Arabic reasoning + strengths + gaps |
| **Speed** | Instant | ~3-5 seconds (Gemini API call) |

---

## Fallback Behavior

If n8n is **offline or errors**, the API route automatically falls back to local Jaccard matching:

```typescript
// In route.ts:
if (!n8nResponse.ok) {
    // Returns basic Jaccard scores instead
    return NextResponse.json({
        success: true,
        source: 'fallback',
        rankings: localCalculation...
    })
}
```

---

## Merging into Main Workflow

To merge into the main `n8n workflow.json` (optional):

1. Open the main workflow in n8n
2. Add a new **Webhook** node with path `gn-smart-match`
3. Copy the 3 subsequent nodes (Build Prompt → Gemini → Parse → Respond)
4. Connect them in sequence
5. This adds Smart Match as webhook path #14 in the main workflow

---

## Cost Estimate

| Model | Input Tokens (~) | Output Tokens (~) | Cost per Call |
|-------|-------------------|-------------------|---------------|
| Gemini 2.0 Flash | ~2,000 | ~1,000 | ~$0.001 |
| **Monthly (100 calls)** | | | **~$0.10** |

Very cheap! Gemini Flash is ideal for this use case.
