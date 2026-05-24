# Skill Gap Analyzer — n8n Workflow Guide

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
  "target_job_description": "وصف الوظيفة (نص مجرد من HTML حتى 1500 حرف)",
  "target_job_company": "شركة أبجد",
  "target_job_location": "دبي",
  "target_job_type": "full_time",
  "target_skills": ["React", "TypeScript", "Next.js", "CSS", "Git"],
  "candidate_skills": ["HTML", "CSS", "JavaScript", "React", "Python"],
  "candidate_headline": "مطور ويب",
  "years_experience": 2
}
```

## AI System Prompt

Use this in the **AI Agent** or **Basic LLM Chain** node as the System Message:

```
أنت خبير تحليل مهارات وظيفي. مهمتك مقارنة مهارات مرشح بمتطلبات وظيفة مستهدفة.

بيانات الوظيفة المستهدفة:
- المسمى الوظيفي: {{ $json.body.target_job_title }}
- الشركة: {{ $json.body.target_job_company }}
- الموقع: {{ $json.body.target_job_location }}
- المهارات المطلوبة: {{ $json.body.target_skills }}
- وصف الوظيفة: {{ $json.body.target_job_description }}

بيانات المرشح:
- المسمى الحالي: {{ $json.body.candidate_headline }}
- المهارات الحالية: {{ $json.body.candidate_skills }}
- سنوات الخبرة: {{ $json.body.years_experience }}

أرجع الإجابة كـ JSON فقط بدون أي نص إضافي، بالتنسيق التالي:
{
  "match_percentage": 65,
  "matched_skills": [
    { "skill": "React", "level": "strong" }
  ],
  "missing_skills": [
    { "skill": "TypeScript", "priority": "critical", "learning_time": "1-2 شهر", "resources": ["Udemy - TypeScript Course"] }
  ],
  "transferable_skills": [
    { "from_skill": "JavaScript", "applicable_to": "TypeScript", "relevance": "عالي" }
  ],
  "action_plan": [
    { "priority": 1, "skill": "TypeScript", "action": "أكمل دورة TypeScript الأساسية", "timeline": "شهر واحد", "resource": "Udemy" }
  ]
}

القواعد:
- match_percentage: نسبة التطابق (0-100)
- matched_skills.level: "strong" | "moderate" | "basic"
- missing_skills.priority: "critical" | "important" | "nice_to_have"
- أقصى عدد في action_plan: 5 خطوات
- جميع المهارات المطلوبة يجب تصنيفها في matched أو missing
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
// This node takes the AI model's text output and extracts clean JSON from it.
// The AI sometimes wraps JSON in markdown code blocks or adds extra text.

const items = $input.all();
const output = [];

for (const item of items) {
  // Get the AI output text — adjust the field name based on your AI node
  // Common field names: text, output, response, message
  let aiText = item.json.text 
    || item.json.output 
    || item.json.response 
    || item.json.message
    || '';

  // If it's nested (e.g., from AI Agent node)
  if (typeof aiText === 'object' && aiText !== null) {
    aiText = JSON.stringify(aiText);
  }

  let parsed = null;

  try {
    // Strategy 1: Direct JSON parse
    parsed = JSON.parse(aiText);
  } catch {
    try {
      // Strategy 2: Extract JSON from markdown code block
      const codeBlockMatch = aiText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        parsed = JSON.parse(codeBlockMatch[1].trim());
      }
    } catch {
      try {
        // Strategy 3: Find first { ... } in the text
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // All strategies failed — return fallback
        parsed = null;
      }
    }
  }

  // Validate the parsed result has required fields
  if (parsed && typeof parsed.match_percentage === 'number') {
    output.push({
      json: {
        result: {
          match_percentage: parsed.match_percentage,
          matched_skills: parsed.matched_skills || [],
          missing_skills: parsed.missing_skills || [],
          transferable_skills: parsed.transferable_skills || [],
          action_plan: parsed.action_plan || [],
        }
      }
    });
  } else {
    // Fallback: return error so the API uses its built-in fallback
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

This will return the parsed result directly back to the Next.js API.

---

## Expected Response (to Next.js)

```json
{
  "result": {
    "match_percentage": 65,
    "matched_skills": [
      { "skill": "React", "level": "strong" },
      { "skill": "CSS", "level": "moderate" }
    ],
    "missing_skills": [
      { "skill": "TypeScript", "priority": "critical", "learning_time": "1-2 شهر", "resources": ["Udemy"] },
      { "skill": "Next.js", "priority": "important", "learning_time": "2-3 أشهر", "resources": ["Next.js Docs"] },
      { "skill": "Git", "priority": "nice_to_have", "learning_time": "أسبوعين", "resources": ["YouTube"] }
    ],
    "transferable_skills": [
      { "from_skill": "JavaScript", "applicable_to": "TypeScript", "relevance": "عالي" },
      { "from_skill": "Python", "applicable_to": "Backend Development", "relevance": "متوسط" }
    ],
    "action_plan": [
      { "priority": 1, "skill": "TypeScript", "action": "أكمل دورة TypeScript الأساسية", "timeline": "شهر واحد", "resource": "Udemy" },
      { "priority": 2, "skill": "Next.js", "action": "ابنِ مشروع تجريبي باستخدام Next.js", "timeline": "شهرين", "resource": "Next.js Docs" }
    ]
  }
}
```

## n8n Setup Steps

1. Create workflow `gn-skill-gap`
2. **Webhook** → POST, path `gn-skill-gap`, Header Auth
3. **AI Agent** (or Basic LLM Chain) → Model: Gemini 2.0 Flash, system prompt above
4. **Code** node → Paste the JavaScript code above
5. **Respond to Webhook** → Return JSON
6. Test with "Listen for Test Event" → trigger from dashboard
7. Activate workflow for production

## Workflow Diagram

```
[Webhook] → [AI Agent/LLM] → [Code: Parse JSON] → [Respond to Webhook]
```
