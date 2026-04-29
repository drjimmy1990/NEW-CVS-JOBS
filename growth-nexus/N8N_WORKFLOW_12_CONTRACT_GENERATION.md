# 📄 N8N Workflow Guide — Contract Generation (#12)

> **إنشاء عقد عمل PDF متوافق مع MOHRE — يتفعّل من dashboard صاحب العمل**
>
> يأخذ بيانات المرشح + الشركة + القالب → يولّد PDF → يرفعه على Storage

---

## 📋 المعلومات الأساسية

| الخاصية | القيمة |
|---------|--------|
| **Webhook Path** | `/gn-contract-gen` |
| **Env Variable** | `N8N_CONTRACT_GEN_WEBHOOK` |
| **Method** | POST |
| **Auth** | Header Auth (`x-webhook-secret`) |
| **Trigger** | يدوي — صاحب العمل يضغط "Generate Contract" |
| **API Route** | `/api/contracts/generate` |

---

## 🔗 الـ Node Flow

```
[Webhook] → [Code: Merge Template] → [HTML to PDF] → [Supabase Storage: Upload] → [Respond to Webhook]
```

---

## 📦 Incoming JSON

```json
{
    "application_id": "uuid-here",
    "company_name": "شركة النمو للتقنية",
    "candidate_name": "أحمد محمد علي",
    "position": "مطور واجهات أمامية أول",
    "salary": 15000,
    "currency": "AED",
    "start_date": "2026-06-01",
    "benefits": ["تأمين صحي", "تذاكر سفر سنوية", "بدل سكن"],
    "html_template": "<html>...template with {{placeholders}}...</html>"
}
```

---

## 🏗️ خطوات البناء

### Node 1: Webhook

| الإعداد | القيمة |
|---------|--------|
| HTTP Method | `POST` |
| Path | `gn-contract-gen` |
| Authentication | `Header Auth` |
| Header Name | `x-webhook-secret` |
| Header Value | (نفس `.env.local` → `N8N_WEBHOOK_SECRET`) |
| Response Mode | `Last Node` |

---

### Node 2: Code — Merge Template with Data

1. اضغط **+** → ابحث عن **Code**
2. Language: **JavaScript**

```javascript
const data = $input.item.json;

// If template provided, use it. Otherwise generate default MOHRE template
let html = data.html_template || '';

if (!html) {
    // Default MOHRE-aligned employment contract template
    html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Arial', 'Tahoma', sans-serif;
            direction: rtl;
            line-height: 2;
            color: #1a1a1a;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        .header {
            text-align: center;
            border-bottom: 3px double #1a5276;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1a5276;
            font-size: 24px;
            margin: 0;
        }
        .header p {
            color: #666;
            font-size: 12px;
        }
        .section {
            margin: 25px 0;
        }
        .section h2 {
            color: #1a5276;
            font-size: 16px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        .field {
            display: flex;
            padding: 8px 0;
            border-bottom: 1px dotted #eee;
        }
        .field .label {
            width: 200px;
            font-weight: bold;
            color: #555;
        }
        .field .value {
            flex: 1;
            color: #1a1a1a;
        }
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding-top: 20px;
        }
        .sig-block {
            text-align: center;
            width: 45%;
        }
        .sig-line {
            border-top: 1px solid #333;
            margin-top: 60px;
            padding-top: 10px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            color: #999;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>عقد عمل</h1>
        <p>Employment Contract — وفقاً لقانون العمل الاتحادي الإماراتي</p>
        <p>UAE Federal Labour Law — MOHRE Compliant</p>
    </div>

    <div class="section">
        <h2>الطرف الأول — صاحب العمل</h2>
        <div class="field">
            <span class="label">اسم الشركة:</span>
            <span class="value">{{company_name}}</span>
        </div>
    </div>

    <div class="section">
        <h2>الطرف الثاني — الموظف</h2>
        <div class="field">
            <span class="label">الاسم الكامل:</span>
            <span class="value">{{candidate_name}}</span>
        </div>
    </div>

    <div class="section">
        <h2>تفاصيل التوظيف</h2>
        <div class="field">
            <span class="label">المسمى الوظيفي:</span>
            <span class="value">{{position}}</span>
        </div>
        <div class="field">
            <span class="label">الراتب الشهري:</span>
            <span class="value">{{salary}} {{currency}}</span>
        </div>
        <div class="field">
            <span class="label">تاريخ البدء:</span>
            <span class="value">{{start_date}}</span>
        </div>
        <div class="field">
            <span class="label">نوع العقد:</span>
            <span class="value">غير محدد المدة</span>
        </div>
        <div class="field">
            <span class="label">فترة الاختبار:</span>
            <span class="value">6 أشهر</span>
        </div>
    </div>

    <div class="section">
        <h2>المزايا والبدلات</h2>
        {{benefits_html}}
    </div>

    <div class="section">
        <h2>البنود العامة</h2>
        <ol>
            <li>يلتزم الطرفان بأحكام قانون العمل الاتحادي رقم (33) لسنة 2021.</li>
            <li>ساعات العمل: 8 ساعات يومياً / 48 ساعة أسبوعياً.</li>
            <li>الإجازة السنوية: 30 يوم تقويمي بعد إتمام سنة.</li>
            <li>يحق لأي طرف إنهاء العقد بإشعار مدته 30 يوماً.</li>
            <li>يخضع هذا العقد لقوانين دولة الإمارات العربية المتحدة.</li>
        </ol>
    </div>

    <div class="signatures">
        <div class="sig-block">
            <p><strong>الطرف الأول — صاحب العمل</strong></p>
            <div class="sig-line">التوقيع والختم</div>
        </div>
        <div class="sig-block">
            <p><strong>الطرف الثاني — الموظف</strong></p>
            <div class="sig-line">التوقيع</div>
        </div>
    </div>

    <div class="footer">
        <p>تم إنشاء هذا العقد بواسطة منصة GrowthNexus — {{generated_date}}</p>
        <p>مرجع العقد: {{application_id}}</p>
    </div>
</body>
</html>`;
}

// Replace placeholders
const benefitsHtml = (data.benefits || []).map(b => `<p>✓ ${b}</p>`).join('\n');
const today = new Date().toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' });

html = html
    .replace(/\{\{company_name\}\}/g, data.company_name || '')
    .replace(/\{\{candidate_name\}\}/g, data.candidate_name || '')
    .replace(/\{\{position\}\}/g, data.position || '')
    .replace(/\{\{salary\}\}/g, String(data.salary || ''))
    .replace(/\{\{currency\}\}/g, data.currency || 'AED')
    .replace(/\{\{start_date\}\}/g, data.start_date || '')
    .replace(/\{\{benefits_html\}\}/g, benefitsHtml)
    .replace(/\{\{generated_date\}\}/g, today)
    .replace(/\{\{application_id\}\}/g, data.application_id || '');

return {
    html_content: html,
    filename: `contract_${data.application_id}_${Date.now()}.pdf`,
    application_id: data.application_id,
};
```

---

### Node 3: HTML to PDF

**الطريقة 1: استخدام n8n Community Node (مفضّل)**
1. Install `n8n-nodes-html-to-pdf` من Settings → Community Nodes
2. ضع `{{ $json.html_content }}` في HTML field

**الطريقة 2: استخدام HTTP Request لـ API خارجي**
1. اضغط **+** → **HTTP Request**
2. ضبط الإعدادات:

| الإعداد | القيمة |
|---------|--------|
| Method | `POST` |
| URL | `https://api.html2pdf.app/v1/generate` |
| Body Type | `JSON` |
| Body | (انظر أسفل 👇) |
| Response Format | `File` |

```json
{
    "html": "{{ $json.html_content }}",
    "apiKey": "YOUR_HTML2PDF_API_KEY",
    "options": {
        "format": "A4",
        "margin": {
            "top": "20mm",
            "right": "15mm",
            "bottom": "20mm",
            "left": "15mm"
        }
    }
}
```

> 💡 بدائل مجانية: `https://pdf.co/api` أو `https://api.sejda.com`

**الطريقة 3: Code Node مع Puppeteer (إذا n8n مثبت محلياً)**
- مش عملي على cloud، استخدم API خارجي

---

### Node 4: Supabase Storage — Upload PDF

1. اضغط **+** → ابحث عن **Supabase**
2. أو استخدم **HTTP Request** مع Supabase Storage API:

| الإعداد | القيمة |
|---------|--------|
| Method | `POST` |
| URL | `https://YOUR_SUPABASE_URL/storage/v1/object/contracts/{{ $('Code').item.json.filename }}` |
| Headers | `Authorization: Bearer YOUR_SERVICE_ROLE_KEY` |
| Headers | `Content-Type: application/pdf` |
| Body | (binary from PDF node) |

> ⚠️ **أنشئ bucket** اسمه `contracts` في Supabase Storage أولاً
> 
> Supabase Dashboard → Storage → New Bucket → Name: `contracts` → Public: No

---

### Node 5: Respond to Webhook

```json
{
    "success": true,
    "contract_url": "https://YOUR_SUPABASE_URL/storage/v1/object/contracts/{{ $('Code').item.json.filename }}",
    "offer_letter_url": "",
    "application_id": "{{ $('Code').item.json.application_id }}"
}
```

---

## 📤 Expected Response JSON

```json
{
    "success": true,
    "contract_url": "https://xyz.supabase.co/storage/v1/object/contracts/contract_uuid_1234.pdf",
    "offer_letter_url": "",
    "application_id": "uuid-here"
}
```

---

## 🔄 كيف يتفعّل؟

1. صاحب العمل يفتح صفحة المتقدم
2. يضغط **"إنشاء عقد"**
3. يدخل: الراتب، تاريخ البدء، المزايا، القالب
4. الـ frontend يستدعي `/api/contracts/generate`
5. الـ API يرسل البيانات + HTML template لـ n8n
6. n8n يملأ البيانات → يولّد PDF → يرفعه
7. الـ API يحدّث status الطلب لـ `offer`
8. يعرض رابط تنزيل العقد

---

## 📝 ملاحظات مهمة

### إنشاء Contract Templates Table

إذا مالك جدول `contract_templates`، أنشئ واحد:

```sql
CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT,
    html_content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default template
INSERT INTO public.contract_templates (name, name_ar, html_content, is_default) VALUES (
    'Standard UAE Employment Contract',
    'عقد عمل إماراتي قياسي',
    '...paste the HTML template from Code node above...',
    true
);
```

### Supabase Storage Bucket

```sql
-- Create contracts bucket (run in SQL editor)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: only authenticated users who own the application
CREATE POLICY "Employers can access contracts"
ON storage.objects FOR SELECT
USING (bucket_id = 'contracts' AND auth.role() = 'authenticated');
```

---

## ✅ قائمة التحقق

- [ ] إنشاء Workflow في n8n باسم `GN - Contract Generation`
- [ ] Webhook node → path `gn-contract-gen`
- [ ] Code node → Template merge
- [ ] HTML to PDF node (community node أو API خارجي)
- [ ] Supabase Storage upload
- [ ] Respond to Webhook
- [ ] إنشاء `contracts` bucket في Supabase Storage
- [ ] تحديث `N8N_CONTRACT_GEN_WEBHOOK` في `.env.local`:
  ```
  N8N_CONTRACT_GEN_WEBHOOK=https://n8n.asra3.com/webhook/gn-contract-gen
  ```
- [ ] اختبار بـ Listen for Test Event
- [ ] تفعيل الـ Workflow
