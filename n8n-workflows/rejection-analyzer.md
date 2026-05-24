# Rejection Analyzer — n8n Workflow Guide

## Workflow Name: `gn-rejection-analyze`
## Type: API Proxy (Webhook → AI → Response)

---

## Trigger

| Field | Value |
|-------|-------|
| Node | Webhook |
| Method | POST |
| Path | `gn-rejection-analyze` |
| Authentication | Header Auth (`x-webhook-secret`) |

## Input Payload (from Next.js API)

```json
{
  "application_id": "uuid",
  "job": {
    "title": "مطور واجهات أمامية",
    "description": "نص الوصف الوظيفي (مقطوع عند 1500 حرف)",
    "skills_required": ["React", "TypeScript", "CSS"],
    "job_type": "full_time",
    "location": "دبي",
    "salary_range": "8000-12000 AED",
    "company_name": "شركة أبجد"
  },
  "candidate": {
    "skills": ["HTML", "CSS", "JavaScript"],
    "years_experience": 2,
    "headline": "مبرمج ويب",
    "education": []
  },
  "rejection_reason": "غير محدد"
}
```

## Workflow Nodes

```
1. Webhook (trigger)
   ↓
2. AI Agent (Gemini / OpenAI)
   ├── System Prompt: "أنت محلل توظيف خبير..."
   ├── User Message: Job + Candidate data
   └── Output: Structured JSON analysis
   ↓
3. Respond to Webhook
   └── Return analysis JSON
```

## AI System Prompt

```
أنت محلل توظيف خبير متخصص في سوق العمل الإماراتي.

المطلوب: حلل سبب رفض المرشح للوظيفة التالية وقدم تقريراً مفصلاً.

أجب بصيغة JSON فقط بالهيكل التالي:
{
  "likely_reasons": ["سبب1", "سبب2"],
  "improvement_areas": ["مجال1", "مجال2"],
  "missing_skills": ["مهارة1", "مهارة2"],
  "recommended_actions": ["إجراء1", "إجراء2"],
  "alternative_roles": ["وظيفة بديلة1", "وظيفة بديلة2"],
  "match_score": 45
}

القواعد:
- حلل التوافق بين مهارات المرشح ومتطلبات الوظيفة
- قدم أسباب واقعية بناءً على الفجوات المكتشفة
- اقترح خطوات عملية وقابلة للتنفيذ
- match_score هو نسبة التوافق من 0 إلى 100
- أجب باللغة العربية
```

## Expected Response

```json
{
  "analysis": {
    "likely_reasons": [...],
    "improvement_areas": [...],
    "missing_skills": [...],
    "recommended_actions": [...],
    "alternative_roles": [...],
    "match_score": 45
  }
}
```

## n8n Setup Steps

1. Create new Workflow → name `gn-rejection-analyze`
2. Add **Webhook** node → POST, path `gn-rejection-analyze`, Header Auth
3. Add **AI Agent** node (or Basic LLM Chain)
   - Model: Google Gemini 2.0 Flash (or OpenAI GPT-4o-mini)
   - System prompt: Copy from above
   - User message: `{{ JSON.stringify($json.body) }}`
4. Add **Code** node to parse AI response into clean JSON
5. Add **Respond to Webhook** node → Return parsed JSON
6. **Activate** the workflow
