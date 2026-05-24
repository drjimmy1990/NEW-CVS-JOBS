# دليل تحديث n8n CV Parser — استخراج البيانات الجديدة

## الوضع الحالي

عندنا workflow في n8n اسمه **gn-cv-parser** بيشتغل كالتالي:

```
المستخدم يرفع CV (PDF)
     ↓
Frontend: triggerAIParsing() → POST → n8n webhook
     ↓
n8n: يحمل الـ PDF → يستخرج النص → يبعته لـ Gemini AI
     ↓
Gemini AI يرجع JSON ببيانات المرشح
     ↓
n8n يحدّث جدول candidates في Supabase
```

### أماكن الاستدعاء (مهم!)

| المكان | الملف | هل يشغّل AI Parsing؟ |
|--------|-------|---------------------|
| رفع CV جديد | `candidate/cv/page.tsx` سطر 142 | ✅ نعم — `triggerAIParsing()` |
| ربط CV من session | `api/cv/link-profile/route.ts` سطر 103 | ✅ نعم — بيبعت webhook + بيستخرج البيانات من `parsed_data` |
| التقديم على وظيفة | `components/candidate/ApplyModal.tsx` | ❌ لا — بياخد snapshot بس |

---

## المطلوب: تحديثات n8n (3 خطوات)

### الخطوة 1: شغّل الـ SQL Migration

افتح **Supabase SQL Editor** → اعمل **New Query** → الصق ده وشغّله:

```sql
-- إضافة أعمدة جديدة لجدول candidates
ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS education_level text,
ADD COLUMN IF NOT EXISTS specialization text,
ADD COLUMN IF NOT EXISTS last_job_title text;

-- إضافة أعمدة جديدة لجدول applications
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS match_score int,
ADD COLUMN IF NOT EXISTS ai_summary jsonb;
```

✅ **تأكد** إن الـ query نجح بدون errors.

---

### الخطوة 2: تحديث AI Prompt في n8n

1. افتح **n8n** → الـ Workflow **GrowthNexus CV Parser**
2. اضغط على Node: **"Basic LLM Chain"**
3. روح على **Messages** → **System Message**
4. **استبدل** المحتوى كله بالتالي:

```
أنت خبير موارد بشرية ومحلل سير ذاتية محترف.
مهمتك هي قراءة النص المستخرج من السيرة الذاتية المرفقة، واستخراج البيانات المحددة بدقة.

يجب عليك إرجاع النتيجة بصيغة JSON صالح (Valid JSON) فقط، وبدون أي نصوص إضافية أو شروحات، وبدون علامات (```json).
يجب أن يحتوي الـ JSON على الحقول الإنجليزية التالية حصراً (لكن المحتوى يجب أن يترجم للغة العربية):

{
  "skills": ["اسم المهارة 1", "اسم المهارة 2"],
  "experience_years": 5,
  "education": ["اسم الدرجة - اسم الجامعة"],
  "summary": "ملخص احترافي من سطرين...",
  "education_level": "بكالوريوس",
  "specialization": "هندسة البرمجيات",
  "last_job_title": "مطور واجهات أمامي أول",
  "nationality": "مصري",
  "city": "دبي"
}

شرح الحقول:
- skills: مصفوفة من أهم المهارات التقنية والناعمة
- experience_years: إجمالي سنوات الخبرة كرقم صحيح (Integer) فقط، إذا لم يوجد ضع 0
- education: مصفوفة من المؤهلات العلمية
- summary: ملخص احترافي للمرشح من سطرين باللغة العربية
- education_level: أعلى مؤهل علمي (ثانوية، دبلوم، بكالوريوس، ماجستير، دكتوراه). إذا لم يُذكر ضع ""
- specialization: تخصص المؤهل العلمي الأعلى. إذا لم يُذكر ضع ""
- last_job_title: آخر مسمى وظيفي شغله المرشح. إذا لم يُذكر ضع ""
- nationality: الجنسية إذا مذكورة في السيرة. إذا لم تُذكر ضع ""
- city: المدينة الحالية إذا مذكورة. إذا لم تُذكر ضع ""

تأكد 100% أن المخرجات هي JSON فقط لكي يتمكن النظام من برمجتها.
```

---

### الخطوة 3: إضافة الحقول الجديدة في Supabase Node

1. في نفس الـ Workflow، اضغط على Node: **"Update a row"**
2. في **Fields** section، اضغط **Add Field** وأضف الحقول التالية:

| # | Field ID | Field Value |
|---|----------|-------------|
| 1 | `skills` | `{{ $json.parsed_data.skills }}` *(موجود)* |
| 2 | `resume_parsed_data` | `{{ $json.parsed_data }}` *(موجود)* |
| 3 | `years_experience` | `{{ $json.parsed_data.experience_years }}` *(موجود)* |
| **4** | **`education_level`** | **`{{ $json.parsed_data.education_level }}`** |
| **5** | **`specialization`** | **`{{ $json.parsed_data.specialization }}`** |
| **6** | **`last_job_title`** | **`{{ $json.parsed_data.last_job_title }}`** |
| **7** | **`nationality`** | **`{{ $json.parsed_data.nationality }}`** |
| **8** | **`city`** | **`{{ $json.parsed_data.city }}`** |

3. اضغط **Save** ثم **Activate** الـ Workflow

---

## ✅ تعديلات الكود (تم تنفيذها)

### 1. `api/cv/link-profile/route.ts`
عدّلنا الكود بحيث لما يربط CV بملف المستخدم عبر session، يستخرج كل الحقول الجديدة من `parsed_data` ويحفظها:

```diff
+ if (parsed.experience_years) updateData.years_experience = parsed.experience_years
+ if (parsed.education_level) updateData.education_level = parsed.education_level
+ if (parsed.specialization) updateData.specialization = parsed.specialization
+ if (parsed.last_job_title) updateData.last_job_title = parsed.last_job_title
+ if (parsed.nationality) updateData.nationality = parsed.nationality
+ if (parsed.city) updateData.city = parsed.city
```

هذا يضمن إن ربط CV بالملف يحدّث كل البيانات — مش بس الـ skills.

### 2. كل المسارات اللي بتحدّث الملف الآن:

| المسار | كيف بيحدّث الملف |
|--------|-----------------|
| **رفع CV مباشر** (`cv/page.tsx`) | يرفع → يبعت لـ n8n → n8n يحدّث candidates مباشرة |
| **ربط CV من session** (`link-profile`) | يقرأ parsed_data من الـ session → يحدّث candidates → كمان يبعت لـ n8n عشان يعيد تحليل |
| **n8n webhook** | يحلل PDF → يستخرج كل البيانات → يحدّث candidates |

---

## اختبار التعديلات

1. ✅ شغّل الـ SQL (الخطوة 1)
2. ✅ حدّث n8n (الخطوتين 2 و 3)
3. ✅ ارفع CV جديد من صفحة "سيرتي الذاتية"
4. ✅ افتح Supabase → جدول `candidates` → تأكد إن الحقول الجديدة اتملت
5. ✅ افتح صفحة المتقدمين (employer) → تأكد إن البيانات ظاهرة في الـ List View

---

## ملاحظة عن المتقدمين القدام

المتقدمين اللي رفعوا CV **قبل** التحديث مش هيكون عندهم البيانات الجديدة.

### حل: إعادة تحليل CVs القديمة

لو حبيت تعيد تحليل كل الـ CVs القديمة، ممكن تعمل workflow جديد في n8n:

1. Supabase Node → **Get All Rows** من `candidates` → فلتر: `cv_url IS NOT NULL` و `education_level IS NULL`
2. Loop → لكل مرشح: ابعت request لـ webhook `gn-cv-parser` بالـ `cv_url` و `user_id`

أو ببساطة اطلب من المرشحين يعملوا "استبدال" لسيرتهم الذاتية.
