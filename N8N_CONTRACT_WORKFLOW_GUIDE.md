# دليل بناء سير عمل العقود في n8n (Contract Notification Workflow)

إذا لم يعمل ملف الـ JSON عند استيراده، فهذا الدليل سيشرح لك خطوة بخطوة كيفية بناء سير العمل (Workflow) يدوياً من الصفر داخل n8n.

---

## 🏗️ الهيكل العام لسير العمل
يتكون سير العمل من 4 مراحل (Nodes):
1. **Webhook:** لاستقبال البيانات من التطبيق.
2. **Code:** للتحقق من كلمة المرور (Secret) وتجهيز البيانات.
3. **Switch:** لتوجيه الحدث (إنشاء، إرسال، توقيع، رفض).
4. **Send Email (x4):** لإرسال الإيميل المناسب حسب الحدث.

---

## الخطوة 1: عقدة الاستقبال (Webhook Node)
1. في شاشة n8n، اضغط على `+ Add first step`.
2. ابحث عن **Webhook** واختره.
3. قم بضبط الإعدادات كالتالي:
   * **HTTP Method:** اختر `POST`
   * **Path:** اكتب `gn-contract-notify`
   * **Respond:** اتركها `Immediately` (الافتراضي)
4. أغلق نافذة العقدة. هذه العقدة ستستقبل البيانات من تطبيقك.

---

## الخطوة 2: عقدة التحقق والبرمجة (Code Node)
1. اضغط على علامة `+` بجانب عقدة الـ Webhook.
2. ابحث عن **Code** واختره.
3. في حقل الـ **JavaScript Code**، امسح الكود الموجود والصق هذا الكود بالضبط:

```javascript
// Validate webhook secret
const secret = $input.first().headers['x-webhook-secret'];
// قم بتغيير هذه القيمة إلى كلمة السر القوية الخاصة بك
const expected = 'my_growthnexus_secret_2026';

if (secret !== expected) {
  throw new Error('Invalid webhook secret');
}

const body = $input.first().json.body || $input.first().json;

return [{
  json: {
    event_type: body.event_type,
    contract_id: body.contract_id,
    candidate_name: body.candidate_name,
    candidate_email: body.candidate_email || '',
    company_name: body.company_name,
    employer_email: body.employer_email || '',
    job_title: body.job_title,
    salary: body.salary,
    currency: body.currency || 'AED',
    start_date: body.start_date,
    decline_reason: body.decline_reason || '',
    contract_url: body.contract_url || ''
  }
}];
```
4. أعد تسمية هذه العقدة من الأعلى إلى `Validate & Parse` لترتيب عملك.

---

## الخطوة 3: عقدة التوجيه (Switch Node)
1. اضغط على `+` بجانب عقدة الـ Code.
2. ابحث عن **Switch** واختره.
3. في إعدادات العقدة، ضمن قسم **Routing Rules**، أضف 4 قواعد (Rules) كالتالي:

**القاعدة 1 (Output 0):**
* Value 1: `={{ $json.event_type }}`
* Operation: `Equal`
* Value 2: `contract_created`

**القاعدة 2 (Output 1):**
* Value 1: `={{ $json.event_type }}`
* Operation: `Equal`
* Value 2: `contract_sent`

**القاعدة 3 (Output 2):**
* Value 1: `={{ $json.event_type }}`
* Operation: `Equal`
* Value 2: `contract_signed`

**القاعدة 4 (Output 3):**
* Value 1: `={{ $json.event_type }}`
* Operation: `Equal`
* Value 2: `contract_declined`

---

## الخطوة 4: عقد البريد الإلكتروني (Send Email Nodes)
سنقوم بإنشاء 4 عقد لإرسال الإيميلات، كل واحدة متصلة بمخرج من مخارج الـ Switch.

قم بالبحث عن عقدة **Send Email** وأضفها 4 مرات (مرتبطة بكل مخرج)، واستخدم الإعدادات التالية لكل منها:
*(ملاحظة: تأكد من إعداد بيانات الـ SMTP الخاصة بك في خانة Credentials في الأعلى لكل العقد)*

### ✉️ العقدة 1: عند إنشاء العقد (مربوطة بـ Output 0)
* **From Email:** `noreply@growthnexus.ae`
* **To Email:** `={{ $json.candidate_email }}`
* **Subject:** `عرض وظيفي جديد من {{ $json.company_name }} — {{ $json.job_title }}`
* **HTML:** قم بتفعيل خيار الـ HTML والصق الكود التالي:
```html
<div dir='rtl' style='font-family: Segoe UI, Tahoma, sans-serif; max-width: 600px; margin: 0 auto;'><div style='background: linear-gradient(135deg, #c4a035, #d4b13f); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;'><h1 style='color: #0c1222; margin: 0; font-size: 24px;'>عرض وظيفي جديد! 🎉</h1></div><div style='background: #fff; padding: 30px; border: 1px solid #eee; border-radius: 0 0 12px 12px;'><p style='font-size: 16px; color: #333;'>مرحباً <strong>{{ $json.candidate_name }}</strong>,</p><p style='color: #555;'>لقد تلقيت عرضاً وظيفياً جديداً:</p><table style='width: 100%; border-collapse: collapse; margin: 20px 0;'><tr><td style='padding: 10px; border-bottom: 1px solid #eee; color: #888;'>الشركة</td><td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>{{ $json.company_name }}</td></tr><tr><td style='padding: 10px; border-bottom: 1px solid #eee; color: #888;'>المسمى الوظيفي</td><td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>{{ $json.job_title }}</td></tr><tr><td style='padding: 10px; border-bottom: 1px solid #eee; color: #888;'>الراتب</td><td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #c4a035;'>{{ $json.salary }} {{ $json.currency }}</td></tr><tr><td style='padding: 10px; color: #888;'>تاريخ المباشرة</td><td style='padding: 10px; font-weight: bold;'>{{ $json.start_date }}</td></tr></table><a href='{{ $json.contract_url }}' style='display: inline-block; background: #c4a035; color: #0c1222; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;'>عرض العقد</a></div></div>
```

### ✉️ العقدة 2: عند إرسال العقد للتوقيع (مربوطة بـ Output 1)
* **From Email:** `noreply@growthnexus.ae`
* **To Email:** `={{ $json.candidate_email }}`
* **Subject:** `عقدك جاهز للمراجعة — {{ $json.company_name }}`
* **HTML:** قم بتفعيل خيار الـ HTML والصق الكود التالي:
```html
<div dir='rtl' style='font-family: Segoe UI, Tahoma, sans-serif; max-width: 600px; margin: 0 auto;'><div style='background: #3b82f6; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;'><h1 style='color: #fff; margin: 0;'>📋 عقدك جاهز للمراجعة</h1></div><div style='background: #fff; padding: 30px; border: 1px solid #eee; border-radius: 0 0 12px 12px;'><p>مرحباً <strong>{{ $json.candidate_name }}</strong>,</p><p>عقد العمل الخاص بك لوظيفة <strong>{{ $json.job_title }}</strong> في <strong>{{ $json.company_name }}</strong> جاهز للمراجعة والتوقيع.</p><a href='{{ $json.contract_url }}' style='display: inline-block; background: #3b82f6; color: #fff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;'>مراجعة وتوقيع العقد</a></div></div>
```

### ✉️ العقدة 3: عند التوقيع (مربوطة بـ Output 2 - تُرسل لصاحب العمل)
* **From Email:** `noreply@growthnexus.ae`
* **To Email:** `={{ $json.employer_email }}`
* **Subject:** `🎉 {{ $json.candidate_name }} وقّع على العقد — {{ $json.job_title }}`
* **HTML:** قم بتفعيل خيار الـ HTML والصق الكود التالي:
```html
<div dir='rtl' style='font-family: Segoe UI, Tahoma, sans-serif; max-width: 600px; margin: 0 auto;'><div style='background: #22c55e; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;'><h1 style='color: #fff; margin: 0;'>✅ تم التوقيع بنجاح!</h1></div><div style='background: #fff; padding: 30px; border: 1px solid #eee; border-radius: 0 0 12px 12px;'><p>أخبار سارة!</p><p>المرشح <strong>{{ $json.candidate_name }}</strong> وقّع على عقد العمل لوظيفة <strong>{{ $json.job_title }}</strong>.</p><p>تاريخ المباشرة: <strong>{{ $json.start_date }}</strong></p><p style='color: #888; font-size: 13px;'>تم تحديث حالة الطلب تلقائياً إلى "تم التوظيف".</p></div></div>
```

### ✉️ العقدة 4: عند الرفض (مربوطة بـ Output 3 - تُرسل لصاحب العمل)
* **From Email:** `noreply@growthnexus.ae`
* **To Email:** `={{ $json.employer_email }}`
* **Subject:** `❌ {{ $json.candidate_name }} رفض العقد — {{ $json.job_title }}`
* **HTML:** قم بتفعيل خيار الـ HTML والصق الكود التالي:
```html
<div dir='rtl' style='font-family: Segoe UI, Tahoma, sans-serif; max-width: 600px; margin: 0 auto;'><div style='background: #ef4444; padding: 25px; text-align: center; border-radius: 12px 12px 0 0;'><h1 style='color: #fff; margin: 0;'>تم رفض العقد</h1></div><div style='background: #fff; padding: 30px; border: 1px solid #eee; border-radius: 0 0 12px 12px;'><p>المرشح <strong>{{ $json.candidate_name }}</strong> رفض عقد العمل لوظيفة <strong>{{ $json.job_title }}</strong>.</p><div style='background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 15px 0;'><p style='margin: 0; color: #991b1b;'><strong>سبب الرفض:</strong></p><p style='margin: 5px 0 0; color: #b91c1c;'>{{ $json.decline_reason }}</p></div></div></div>
```

---

## 🚀 التفعيل والتشغيل
1. في أعلى يمين الشاشة تأكد من تفعيل السويتش إلى وضع **Active**.
2. انسخ الـ **Production URL** من عقدة الـ Webhook الأولى (تأكد من اختيار Production URL وليس Test URL).
3. في ملف `.env` الخاص بمشروع Next.js، أضف الروابط التالية:
```env
N8N_CONTRACT_WEBHOOK_URL=https://<your-n8n-url>/webhook/gn-contract-notify
N8N_WEBHOOK_SECRET=my_growthnexus_secret_2026
```
*(ملاحظة: الـ Secret يجب أن يتطابق مع ما وضعناه في عقدة الـ Code في الخطوة 2).*
