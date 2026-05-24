# Career Path Generator — n8n Workflow Guide

## Workflow Name: `gn-career-path`
## Type: API Proxy (Webhook → AI → Response)

---

## Trigger

| Field | Value |
|-------|-------|
| Node | Webhook |
| Method | POST |
| Path | `gn-career-path` |
| Authentication | Header Auth (`x-webhook-secret`) |

## Input Payload

```json
{
  "session_id": "uuid",
  "current_role": "مبرمج مبتدئ",
  "target_role": "مدير تقنية",
  "industry": "تقنية المعلومات",
  "years_experience": 2,
  "current_skills": ["JavaScript", "HTML", "CSS"]
}
```

## Workflow Nodes

```
1. Webhook (trigger)
   ↓
2. AI Agent (Gemini / OpenAI)
   ├── System Prompt: "أنت مستشار مسارات مهنية..."
   ├── User Message: Current role + industry + skills
   └── Output: Career trajectory JSON
   ↓
3. Respond to Webhook
   └── Return result JSON
```

## AI System Prompt

```
أنت مستشار مسارات مهنية خبير متخصص في سوق العمل الإماراتي.

المطلوب: أنشئ مساراً مهنياً مفصلاً للمرشح بناءً على وضعه الحالي وأهدافه.

أجب بصيغة JSON فقط:
{
  "current_assessment": {
    "level": "مبتدئ",
    "strengths": ["JavaScript", "HTML"],
    "gaps": ["القيادة", "إدارة المشاريع"]
  },
  "career_path": [
    {
      "year": 1,
      "role": "مبرمج أول",
      "skills_to_learn": ["React", "Node.js"],
      "certifications": ["AWS Cloud Practitioner"],
      "salary_range": "15000-20000 AED"
    }
  ],
  "training_recommendations": [
    {
      "name": "دورة React المتقدمة",
      "provider": "Udemy",
      "cost": "200 AED",
      "duration": "6 أسابيع",
      "priority": "عالية"
    }
  ],
  "market_insights": {
    "demand_level": "مرتفع",
    "growth_rate": "18% سنوياً",
    "avg_salary_uae": "18000 AED"
  }
}

القواعد:
- أنشئ 4-5 خطوات في المسار المهني (من year 1 إلى year 5-7)
- الرواتب بالدرهم الإماراتي واقعية لسوق الإمارات
- اقترح شهادات معترف بها دولياً
- level القيم: "مبتدئ" | "متوسط" | "متقدم" | "خبير"
- priority القيم: "عالية" | "متوسطة" | "منخفضة"
- أجب باللغة العربية
```

## Expected Response

```json
{
  "result": {
    "current_assessment": {...},
    "career_path": [...],
    "training_recommendations": [...],
    "market_insights": {...}
  }
}
```

## n8n Setup Steps

1. Create workflow `gn-career-path`
2. **Webhook** → POST, path `gn-career-path`, Header Auth
3. **AI Agent** → Gemini 2.0 Flash, prompt above
4. **Code** → Parse AI output
5. **Respond to Webhook** → Return JSON
6. Activate
