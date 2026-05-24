# Career Path Generator — n8n Workflow Guide

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
  "current_role": "مطور واجهات أمامية",
  "target_role": "مدير تقني",
  "industry": "تقنية المعلومات",
  "years_experience": 3,
  "current_skills": ["React", "JavaScript", "CSS", "HTML", "Node.js"]
}
```

## AI System Prompt

Use this in the **AI Agent** or **Basic LLM Chain** node:

```
أنت خبير تطوير مسارات مهنية في سوق العمل الإماراتي. مهمتك إنشاء خطة مسار وظيفي واقعية ومفصلة.

بيانات المرشح:
- الدور الحالي: {{ $json.body.current_role }}
- الدور المستهدف: {{ $json.body.target_role || 'غير محدد' }}
- المجال: {{ $json.body.industry }}
- سنوات الخبرة: {{ $json.body.years_experience }}
- المهارات الحالية: {{ $json.body.current_skills }}

أرجع JSON فقط بدون أي نص إضافي:
{
  "current_assessment": {
    "level": "مبتدئ | متوسط | متقدم",
    "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
    "gaps": ["فجوة 1", "فجوة 2"]
  },
  "career_path": [
    {
      "year": 1,
      "role": "المسمى الوظيفي في السنة الأولى",
      "skills_to_learn": ["مهارة 1", "مهارة 2"],
      "certifications": ["شهادة مقترحة"],
      "salary_range": "10000-15000 AED"
    },
    {
      "year": 2,
      "role": "المسمى في السنة الثانية",
      "skills_to_learn": ["مهارة 3"],
      "certifications": ["شهادة 2"],
      "salary_range": "15000-20000 AED"
    },
    {
      "year": 3,
      "role": "المسمى في السنة الثالثة",
      "skills_to_learn": ["مهارة 4"],
      "certifications": ["شهادة 3"],
      "salary_range": "20000-30000 AED"
    },
    {
      "year": 5,
      "role": "المسمى في السنة الخامسة",
      "skills_to_learn": ["مهارة 5"],
      "certifications": ["برنامج قيادي"],
      "salary_range": "30000-45000 AED"
    }
  ],
  "training_recommendations": [
    {
      "name": "اسم الدورة",
      "provider": "Coursera | Udemy | LinkedIn Learning",
      "cost": "200 AED أو مجاني",
      "duration": "6 أسابيع",
      "priority": "عالية | متوسطة | منخفضة"
    }
  ],
  "market_insights": {
    "demand_level": "مرتفع | متوسط | منخفض",
    "growth_rate": "15% سنوياً",
    "avg_salary_uae": "18000 AED"
  }
}

القواعد:
- career_path يجب أن يحتوي على 4 محطات (سنة 1، 2، 3، 5)
- الرواتب بالدرهم الإماراتي (AED) وتكون واقعية لسوق الإمارات
- training_recommendations: 3 دورات مرتبة حسب الأولوية
- current_assessment.level بناءً على سنوات الخبرة: 0-2 مبتدئ، 3-5 متوسط، 6+ متقدم
- strengths تُستخرج من المهارات الحالية
- gaps تُحدد بناءً على متطلبات الدور المستهدف
- خذ بعين الاعتبار خصوصية سوق العمل الإماراتي (التوطين، الفيزا، اللغة)
```

## AI Message (User Prompt)

```
{{ JSON.stringify($json.body) }}
```

## Code Node — Parse AI Response to JSON

```javascript
// Parse AI text output into clean JSON for career path generator.

const items = $input.all();
const output = [];

for (const item of items) {
  let aiText = item.json.text
    || item.json.output
    || item.json.response
    || item.json.message
    || '';

  if (typeof aiText === 'object' && aiText !== null) {
    aiText = JSON.stringify(aiText);
  }

  let parsed = null;

  try {
    parsed = JSON.parse(aiText);
  } catch {
    try {
      const codeBlockMatch = aiText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        parsed = JSON.parse(codeBlockMatch[1].trim());
      }
    } catch {
      try {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch {
        parsed = null;
      }
    }
  }

  // Validate: must have career_path array
  if (parsed && (parsed.career_path || parsed.current_assessment)) {
    output.push({
      json: {
        result: {
          current_assessment: parsed.current_assessment || { level: 'متوسط', strengths: [], gaps: [] },
          career_path: parsed.career_path || [],
          training_recommendations: parsed.training_recommendations || [],
          market_insights: parsed.market_insights || { demand_level: 'متوسط', growth_rate: 'غير متاح', avg_salary_uae: 'غير متاح' },
        }
      }
    });
  } else {
    output.push({
      json: {
        error: 'Failed to parse AI response',
        raw: aiText.substring(0, 500),
      }
    });
  }
}

return output;
```

## Respond to Webhook Node

| Setting | Value |
|---------|-------|
| Respond With | JSON |
| Response Body | `{{ $json }}` |

---

## Expected Response (to Next.js)

```json
{
  "result": {
    "current_assessment": {
      "level": "متوسط",
      "strengths": ["React", "JavaScript", "CSS"],
      "gaps": ["القيادة", "هندسة النظم", "إدارة الفرق"]
    },
    "career_path": [
      {
        "year": 1,
        "role": "مطور واجهات أمامية أول",
        "skills_to_learn": ["TypeScript", "Testing"],
        "certifications": ["AWS Cloud Practitioner"],
        "salary_range": "18000-22000 AED"
      },
      {
        "year": 2,
        "role": "قائد فريق فرونت إند",
        "skills_to_learn": ["إدارة الفريق", "Code Review"],
        "certifications": ["Scrum Master"],
        "salary_range": "25000-32000 AED"
      },
      {
        "year": 3,
        "role": "مهندس حلول",
        "skills_to_learn": ["هندسة النظم", "DevOps"],
        "certifications": ["AWS Solutions Architect"],
        "salary_range": "35000-42000 AED"
      },
      {
        "year": 5,
        "role": "مدير تقني (CTO)",
        "skills_to_learn": ["الإدارة الاستراتيجية", "إدارة الميزانيات"],
        "certifications": ["MBA أو برنامج قيادي"],
        "salary_range": "45000-65000 AED"
      }
    ],
    "training_recommendations": [
      { "name": "TypeScript Masterclass", "provider": "Udemy", "cost": "180 AED", "duration": "4 أسابيع", "priority": "عالية" },
      { "name": "Engineering Management", "provider": "Coursera", "cost": "مجاني", "duration": "8 أسابيع", "priority": "عالية" },
      { "name": "AWS Solutions Architect", "provider": "A Cloud Guru", "cost": "350 AED", "duration": "12 أسبوع", "priority": "متوسطة" }
    ],
    "market_insights": {
      "demand_level": "مرتفع",
      "growth_rate": "18% سنوياً",
      "avg_salary_uae": "28000 AED"
    }
  }
}
```

## n8n Setup Steps

1. Create workflow → name `gn-career-path`
2. **Webhook** → POST, path `gn-career-path`, Header Auth
3. **AI Agent** → Model: Gemini 2.0 Flash, system prompt above
4. **Code** node → Paste JavaScript above
5. **Respond to Webhook** → Return JSON
6. Test → Activate

## Workflow Diagram

```
[Webhook] → [AI Agent/LLM] → [Code: Parse JSON] → [Respond to Webhook]
```
