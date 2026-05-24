# Skill Gap Analyzer — n8n Workflow Guide

## Workflow Name: `gn-skill-gap`
## Type: API Proxy (Webhook → AI → Response)

---

## Trigger

| Field | Value |
|-------|-------|
| Node | Webhook |
| Method | POST |
| Path | `gn-skill-gap` |
| Authentication | Header Auth (`x-webhook-secret`) |

## Input Payload

```json
{
  "session_id": "uuid",
  "target_job_title": "مطور واجهات أمامية",
  "target_skills": ["React", "TypeScript", "Next.js", "CSS", "Git"],
  "candidate_skills": ["HTML", "CSS", "JavaScript", "jQuery"],
  "years_experience": 2
}
```

## Workflow Nodes

```
1. Webhook (trigger)
   ↓
2. AI Agent (Gemini / OpenAI)
   ├── System Prompt: "أنت مستشار تطوير مهني..."
   ├── User Message: Target + Candidate skills
   └── Output: Structured gap analysis JSON
   ↓
3. Respond to Webhook
   └── Return result JSON
```

## AI System Prompt

```
أنت مستشار تطوير مهني خبير في سوق العمل الإماراتي.

المطلوب: قارن مهارات المرشح مع متطلبات الوظيفة المستهدفة.

أجب بصيغة JSON فقط:
{
  "match_percentage": 40,
  "matched_skills": [
    { "skill": "CSS", "level": "strong" }
  ],
  "missing_skills": [
    {
      "skill": "React",
      "priority": "critical",
      "learning_time": "شهر واحد",
      "resources": ["دورة React على Udemy", "مشاريع تطبيقية على GitHub"]
    }
  ],
  "transferable_skills": [
    { "from_skill": "jQuery", "applicable_to": "React", "relevance": "متوسط" }
  ],
  "action_plan": [
    {
      "priority": 1,
      "skill": "React",
      "action": "ابدأ بدورة React المجانية على scrimba.com",
      "timeline": "4 أسابيع",
      "resource": "Scrimba"
    }
  ]
}

القواعد:
- priority القيم: "critical" | "important" | "nice_to_have"
- level القيم: "strong" | "moderate" | "basic"
- match_percentage حسابها: (matched / total_required) × 100
- اقترح موارد تعليمية حقيقية
- أجب باللغة العربية
```

## Expected Response

```json
{
  "result": {
    "match_percentage": 40,
    "matched_skills": [...],
    "missing_skills": [...],
    "transferable_skills": [...],
    "action_plan": [...]
  }
}
```

## n8n Setup Steps

1. Create workflow `gn-skill-gap`
2. **Webhook** → POST, path `gn-skill-gap`, Header Auth
3. **AI Agent** → Model: Gemini 2.0 Flash, prompt above
4. **Code** node → Parse AI output to clean JSON
5. **Respond to Webhook** → Return JSON
6. Activate
