# Rejection Analyzer — n8n Workflow Guide

## Type: API Proxy (Webhook → AI → Response)

---

## Trigger

| Field | Value |
|-------|-------|
| Node | Webhook |
| Method | POST |
| Path | `gn-rejection-analyze` |
| Authentication | Header Auth (`x-webhook-secret`) |

## Input Payload

```json
{
  "application_id": "uuid",
  "job": {
    "title": "مطور واجهات أمامية أول",
    "description": "وصف الوظيفة (نص مجرد من HTML حتى 1500 حرف)...",
    "skills_required": ["React", "TypeScript", "Next.js", "GraphQL"],
    "job_type": "full_time",
    "location": "دبي",
    "salary_range": "15000-25000 AED",
    "company_name": "شركة تقنية الخليج"
  },
  "candidate": {
    "skills": ["HTML", "CSS", "JavaScript", "React", "Python"],
    "years_experience": 2,
    "headline": "مطور ويب مبتدئ",
    "education": [{"degree": "بكالوريوس", "field": "علوم حاسب"}]
  },
  "rejection_reason": "لم يتم تحديد سبب"
}
```

## AI System Prompt

Use this in the **AI Agent** or **Basic LLM Chain** node as the System Message:

```
أنت خبير توظيف في سوق العمل الإماراتي. مهمتك تحليل أسباب رفض مرشح لوظيفة معينة وتقديم نصائح تطوير عملية.

بيانات الوظيفة:
- المسمى الوظيفي: {{ $json.body.job.title }}
- الشركة: {{ $json.body.job.company_name }}
- الموقع: {{ $json.body.job.location }}
- نوع الوظيفة: {{ $json.body.job.job_type }}
- نطاق الراتب: {{ $json.body.job.salary_range }}
- المهارات المطلوبة: {{ $json.body.job.skills_required }}
- وصف الوظيفة: {{ $json.body.job.description }}

بيانات المرشح:
- المسمى الحالي: {{ $json.body.candidate.headline }}
- المهارات: {{ $json.body.candidate.skills }}
- سنوات الخبرة: {{ $json.body.candidate.years_experience }}
- التعليم: {{ JSON.stringify($json.body.candidate.education) }}

سبب الرفض من صاحب العمل: {{ $json.body.rejection_reason }}

حلل الموقف وأرجع JSON فقط بدون أي نص إضافي:
{
  "likely_reasons": [
    "السبب الأول المحتمل للرفض",
    "السبب الثاني..."
  ],
  "missing_skills": ["TypeScript", "GraphQL"],
  "improvement_areas": [
    "مجال تحسين 1",
    "مجال تحسين 2"
  ],
  "recommended_actions": [
    "خطوة عملية 1 (محددة وقابلة للتنفيذ)",
    "خطوة عملية 2",
    "خطوة عملية 3",
    "خطوة عملية 4"
  ],
  "alternative_roles": [
    "وظيفة بديلة 1 تناسب مستوى المرشح",
    "وظيفة بديلة 2",
    "وظيفة بديلة 3"
  ],
  "match_score": 45
}

القواعد:
- likely_reasons: أسباب الرفض المحتملة (2-4 أسباب)، ابدأ بسبب صاحب العمل إذا كان محدداً
- missing_skills: المهارات المطلوبة الغير موجودة عند المرشح
- improvement_areas: مجالات التحسين العامة (2-4)
- recommended_actions: خطوات عملية محددة وقابلة للتنفيذ (3-5)
- alternative_roles: وظائف بديلة تناسب مهارات وخبرة المرشح الحالية (2-3)
- match_score: نسبة التوافق بين المرشح والوظيفة (0-100)
- كن صادقاً ولكن مشجعاً — لا تكسر عزيمة المرشح
- خذ بعين الاعتبار سوق العمل الإماراتي (التأشيرات، التوطين، اللغة)
```

## AI Message (User Prompt)

In the AI node's **Message** field, put:
```
{{ JSON.stringify($json.body) }}
```

## Code Node — Parse AI Response to JSON

Add a **Code** node after the AI node. Set the language to **JavaScript**.

Paste this code:

```javascript
// Parse AI text output into clean JSON for the rejection analyzer.

const items = $input.all();
const output = [];

for (const item of items) {
  // Get the AI output text — adjust field name based on your AI node
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
    // Strategy 1: Direct JSON parse
    parsed = JSON.parse(aiText);
  } catch {
    try {
      // Strategy 2: Extract from markdown code block
      const codeBlockMatch = aiText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        parsed = JSON.parse(codeBlockMatch[1].trim());
      }
    } catch {
      try {
        // Strategy 3: Find first { ... } in text
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch {
        parsed = null;
      }
    }
  }

  // Validate required fields
  if (parsed && (parsed.likely_reasons || parsed.match_score !== undefined)) {
    output.push({
      json: {
        analysis: {
          likely_reasons: parsed.likely_reasons || [],
          missing_skills: parsed.missing_skills || [],
          improvement_areas: parsed.improvement_areas || [],
          recommended_actions: parsed.recommended_actions || [],
          alternative_roles: parsed.alternative_roles || [],
          match_score: typeof parsed.match_score === 'number' ? parsed.match_score : 40,
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

After the Code node, add a **Respond to Webhook** node:

| Setting | Value |
|---------|-------|
| Respond With | JSON |
| Response Body | `{{ $json }}` |

---

## Expected Response (to Next.js)

```json
{
  "analysis": {
    "likely_reasons": [
      "خبرة سنتين فقط بينما الوظيفة تتطلب 5+ سنوات",
      "نقص في مهارات TypeScript و GraphQL المطلوبة",
      "عدم وجود خبرة سابقة في شركات مشابهة في الحجم"
    ],
    "missing_skills": ["TypeScript", "GraphQL", "Next.js"],
    "improvement_areas": [
      "تعلم TypeScript — مطلوب في 85% من وظائف الفرونت إند",
      "بناء مشاريع شخصية باستخدام Next.js لإثبات الكفاءة",
      "الحصول على شهادة AWS أو Azure لتعزيز الملف"
    ],
    "recommended_actions": [
      "أكمل دورة TypeScript المتقدمة على Udemy (4 أسابيع)",
      "ابنِ مشروع Next.js + GraphQL وانشره على GitHub",
      "تواصل مع مسؤولي التوظيف في شركات مشابهة عبر LinkedIn",
      "تقدم لوظائف Mid-level بدلاً من Senior"
    ],
    "alternative_roles": [
      "مطور واجهات أمامية متوسط (Mid-level)",
      "مطور React في شركة ناشئة",
      "مطور Full-stack مبتدئ"
    ],
    "match_score": 45
  }
}
```

## n8n Setup Steps

1. Create workflow → name `gn-rejection-analyze`
2. **Webhook** → POST, path `gn-rejection-analyze`, Header Auth
3. **AI Agent** (or Basic LLM Chain) → Model: Gemini 2.0 Flash, system prompt above
4. **Code** node → Paste the JavaScript above
5. **Respond to Webhook** → Return JSON
6. Test with "Listen for Test Event" → trigger from dashboard
7. Activate workflow for production

## Workflow Diagram

```
[Webhook] → [AI Agent/LLM] → [Code: Parse JSON] → [Respond to Webhook]
```
