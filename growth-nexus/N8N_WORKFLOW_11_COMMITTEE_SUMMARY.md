# 📊 N8N Workflow Guide — Committee Summary (#11)

> **تلخيص تقييمات اللجنة — يتفعّل تلقائياً لما 2+ أعضاء يقيّموا نفس المرشح**
>
> يحسب المتوسط، الوسيط، الانحراف المعياري، يكتشف القيم الشاذة، ويكتب ملخص ذكي

---

## 📋 المعلومات الأساسية

| الخاصية | القيمة |
|---------|--------|
| **Webhook Path** | `/gn-committee-summary` |
| **Env Variable** | `N8N_COMMITTEE_SUMMARY_WEBHOOK` |
| **Method** | POST |
| **Auth** | Header Auth (`x-webhook-secret`) |
| **Trigger** | تلقائي — عندما يقيّم العضو الثاني+ من `/api/evaluation/submit` |

---

## 🔗 الـ Node Flow

```
[Webhook] → [Code: Statistical Analysis] → [Gemini: Generate Arabic Summary] → [Code: Clean JSON] → [Respond to Webhook]
```

---

## 📦 Incoming JSON

```json
{
    "application_id": "uuid-here",
    "scores": [
        {
            "evaluator_id": "uuid-1",
            "evaluator_name": "أحمد المدير",
            "score": 82,
            "notes": ""
        },
        {
            "evaluator_id": "uuid-2",
            "evaluator_name": "سارة HR",
            "score": 75,
            "notes": ""
        }
    ]
}
```

---

## 🏗️ خطوات البناء

### Node 1: Webhook

| الإعداد | القيمة |
|---------|--------|
| HTTP Method | `POST` |
| Path | `gn-committee-summary` |
| Authentication | `Header Auth` |
| Header Name | `x-webhook-secret` |
| Header Value | (نفس `.env.local` → `N8N_WEBHOOK_SECRET`) |
| Response Mode | `Last Node` |

---

### Node 2: Code — Statistical Analysis

1. اضغط **+** → ابحث عن **Code**
2. Language: **JavaScript**
3. الصق هذا الكود:

```javascript
const scores = $input.item.json.scores.map(s => s.score);
const names = $input.item.json.scores.map(s => s.evaluator_name);

// Average
const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

// Median
const sorted = [...scores].sort((a, b) => a - b);
const mid = Math.floor(sorted.length / 2);
const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

// Standard Deviation
const stdDev = Math.sqrt(
    scores.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / scores.length
);

// Outliers (> 1.5 std dev from mean)
const outliers = $input.item.json.scores.filter(s => 
    Math.abs(s.score - avg) > 1.5 * stdDev
).map(s => ({
    evaluator_name: s.evaluator_name,
    score: s.score,
    deviation: Math.round(Math.abs(s.score - avg))
}));

// Min/Max
const minScore = Math.min(...scores);
const maxScore = Math.max(...scores);
const range = maxScore - minScore;

// Consensus level
let consensus = 'high';
if (range > 30) consensus = 'low';
else if (range > 15) consensus = 'medium';

return {
    application_id: $input.item.json.application_id,
    evaluator_count: scores.length,
    average_score: Math.round(avg),
    median_score: Math.round(median),
    std_dev: Math.round(stdDev * 10) / 10,
    min_score: minScore,
    max_score: maxScore,
    range: range,
    consensus_level: consensus,
    outliers: outliers,
    scores_detail: $input.item.json.scores,
    // Pre-build prompt context
    prompt_context: $input.item.json.scores.map(s => 
        `${s.evaluator_name}: ${s.score}/100`
    ).join('\n')
};
```

---

### Node 3: Gemini — Generate Arabic Summary

1. اضغط **+** → ابحث عن **Google Gemini Chat Model** أو **OpenAI**
2. ضبط الإعدادات:

**System Prompt:**
```
أنت محلل موارد بشرية خبير. مهمتك تلخيص نتائج تقييم لجنة توظيف.
أعد JSON فقط بالشكل التالي:
{
    "summary": "ملخص عربي من 2-3 جمل عن نتائج التقييم والتوافق بين الأعضاء",
    "recommendation": "توصية واحدة واضحة (تأهيل/رفض/مراجعة إضافية)",
    "key_findings": ["نقطة 1", "نقطة 2"]
}
لا تكتب أي شيء خارج JSON.
```

**User Message:**
```
نتائج تقييم اللجنة:
{{ $json.prompt_context }}

الإحصائيات:
- المتوسط: {{ $json.average_score }}%
- الوسيط: {{ $json.median_score }}%
- المدى: {{ $json.range }} نقطة
- مستوى التوافق: {{ $json.consensus_level }}
- القيم الشاذة: {{ $json.outliers.length }}
```

---

### Node 4: Code — Clean & Merge Response

1. اضغط **+** → ابحث عن **Code**
2. Language: **JavaScript**

```javascript
const stats = $('Code').item.json;
let aiOutput = {};

try {
    const text = $input.item.json.message?.content || $input.item.json.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        aiOutput = JSON.parse(jsonMatch[0]);
    }
} catch (e) {
    aiOutput = {
        summary: `تم تقييم المرشح من ${stats.evaluator_count} أعضاء لجنة. المتوسط ${stats.average_score}%.`,
        recommendation: stats.average_score >= 75 ? 'تأهيل المرشح للعرض الوظيفي' : 'يحتاج مراجعة إضافية',
        key_findings: []
    };
}

return {
    success: true,
    application_id: stats.application_id,
    average_score: stats.average_score,
    median_score: stats.median_score,
    std_dev: stats.std_dev,
    consensus_level: stats.consensus_level,
    outliers: stats.outliers,
    summary: aiOutput.summary || `المتوسط ${stats.average_score}%`,
    recommendation: aiOutput.recommendation || 'مراجعة إضافية',
    key_findings: aiOutput.key_findings || [],
    evaluator_count: stats.evaluator_count,
};
```

---

### Node 5: Respond to Webhook

1. اضغط **+** → ابحث عن **Respond to Webhook**
2. Response Body: **Using Fields Below**
3. اختر **All Fields** من الـ Code node السابق

> أو اختر JSON واكتب:
```json
{{ $json }}
```

---

## 📤 Expected Response JSON

```json
{
    "success": true,
    "application_id": "uuid",
    "average_score": 78,
    "median_score": 79,
    "std_dev": 4.9,
    "consensus_level": "high",
    "outliers": [],
    "summary": "أظهرت اللجنة توافقاً عالياً في تقييم المرشح بمتوسط 78%. جميع الأعضاء أعطوا تقييمات متقاربة.",
    "recommendation": "تأهيل المرشح للعرض الوظيفي",
    "key_findings": ["توافق عالي", "مهارات تقنية قوية"],
    "evaluator_count": 2
}
```

---

## 🔄 كيف يتفعّل؟

1. عضو لجنة يفتح `/employer/evaluate/[applicationId]`
2. يقيّم ويضغط "حفظ التقييم"
3. الـ API يحفظ في `committee_evaluations`
4. إذا وصل عدد المقيّمين ≥ 2 → يُرسل تلقائياً للـ webhook
5. النتيجة تُحفظ في `applications.committee_summary`

> ⚠️ **بدون n8n:** يعمل mock summary تلقائياً (حساب المتوسط بدون AI)

---

## ✅ قائمة التحقق

- [ ] إنشاء Workflow في n8n باسم `GN - Committee Summary`
- [ ] Webhook node → path `gn-committee-summary`
- [ ] Code node → Statistical Analysis
- [ ] Gemini/OpenAI node → Arabic summary prompt
- [ ] Code node → Clean & merge response
- [ ] Respond to Webhook
- [ ] اختبار بـ Listen for Test Event
- [ ] تفعيل الـ Workflow
- [ ] تأكد إن `N8N_COMMITTEE_SUMMARY_WEBHOOK` صحيح في `.env.local`
