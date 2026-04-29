# 🔔 N8N Workflow Guide — Application Notification (#6)

> **هذا الـ guide خطوة بخطوة لبناء workflow إشعارات التقديم على الوظائف**
> 
> عند تقديم مرشح → يرسل إيميل لصاحب العمل + رسالة Telegram (اختياري)

---

## 📋 المعلومات الأساسية

| الخاصية | القيمة |
|---------|--------|
| **Webhook Path** | `/gn-application-notify` |
| **Env Variable** | `N8N_APPLICATION_NOTIFY_WEBHOOK` |
| **Method** | POST |
| **Auth** | Header Auth (`x-webhook-secret`) |

---

## 🔗 الـ Node Flow (الشكل النهائي)

```
[Webhook] → [Supabase: Get Owner Email] → [IF: Has Email?]
                                              ├── Yes → [Send Email] → [Respond ✅]
                                              └── No  → [Respond ⚠️]
```

> **اختياري:** أضف node Telegram بعد Send Email لإشعارات فورية

---

## 📦 Incoming JSON (اللي بيوصل من Next.js)

```json
{
    "application_id": "uuid-here",
    "job_id": "uuid-here",
    "job_title": "مطور واجهات أمامية",
    "candidate_name": "أحمد محمد",
    "company_name": "شركة النمو",
    "company_id": "uuid-here",
    "owner_id": "uuid-here",
    "team_member_ids": ["uuid-1", "uuid-2"],
    "timestamp": "2026-04-29T05:00:00Z"
}
```

---

## 🏗️ خطوات البناء

### Node 1: Webhook

1. اضغط **+** → ابحث عن **Webhook**
2. ضبط الإعدادات:

| الإعداد | القيمة |
|---------|--------|
| HTTP Method | `POST` |
| Path | `gn-application-notify` |
| Authentication | `Header Auth` |
| Header Name | `x-webhook-secret` |
| Header Value | (نفس القيمة من `.env.local` → `N8N_WEBHOOK_SECRET`) |
| Response Mode | `Last Node` |

3. اضغط **Listen for Test Event**
4. ارجع للتطبيق → تقدم بطلب لوظيفة → لازم يظهر الـ data في n8n

> ⚠️ **مهم:** لازم تحدّث `.env.local` الأول:
> ```
> N8N_APPLICATION_NOTIFY_WEBHOOK=https://n8n.asra3.com/webhook/gn-application-notify
> ```

---

### Node 2: Supabase — Get Owner Profile

1. اضغط **+** → ابحث عن **Supabase**
2. ضبط الإعدادات:

| الإعداد | القيمة |
|---------|--------|
| Operation | `Get` |
| Table | `profiles` |
| Select | `id, email, full_name` |
| Filter | Column: `id`, Condition: `Equal`, Value: `{{ $json.owner_id }}` |

> هذا يجلب إيميل واسم صاحب الشركة

---

### Node 3: IF — Has Email?

1. اضغط **+** → ابحث عن **IF**
2. ضبط الشرط:

| الإعداد | القيمة |
|---------|--------|
| Value 1 | `{{ $json.email }}` |
| Operation | `is not empty` |

---

### Node 4: Send Email (الفرع Yes)

1. اضغط **+** → ابحث عن **Send Email** (أو **Gmail** أو **SMTP**)
2. ضبط الإعدادات:

| الإعداد | القيمة |
|---------|--------|
| To | `{{ $('Supabase').item.json.email }}` |
| Subject | `📋 طلب توظيف جديد: {{ $('Webhook').item.json.candidate_name }} — {{ $('Webhook').item.json.job_title }}` |
| Email Type | `HTML` |

3. **محتوى الإيميل (HTML):**

```html
<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f1729; color: #f5f0e8; padding: 30px; border-radius: 12px;">
    
    <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
        <h1 style="color: #D4AF37; font-size: 24px; margin: 0;">GrowthNexus</h1>
        <p style="color: #999; font-size: 12px; margin-top: 5px;">منصة التوظيف الذكية</p>
    </div>

    <div style="padding: 30px 0;">
        <h2 style="color: #D4AF37; font-size: 20px;">📋 طلب توظيف جديد!</h2>
        
        <p style="font-size: 16px; line-height: 1.8;">
            مرحباً <strong>{{ $('Supabase').item.json.full_name }}</strong>،
        </p>
        
        <p style="font-size: 15px; line-height: 1.8; color: #ccc;">
            تقدم مرشح جديد لإحدى وظائفكم:
        </p>

        <div style="background: #1a2332; border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #999; width: 120px;">المرشح:</td>
                    <td style="padding: 8px 0; color: #f5f0e8; font-weight: bold;">{{ $('Webhook').item.json.candidate_name }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #999;">الوظيفة:</td>
                    <td style="padding: 8px 0; color: #D4AF37; font-weight: bold;">{{ $('Webhook').item.json.job_title }}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #999;">التاريخ:</td>
                    <td style="padding: 8px 0; color: #f5f0e8;">{{ $('Webhook').item.json.timestamp }}</td>
                </tr>
            </table>
        </div>

        <a href="https://your-domain.com/employer/jobs/{{ $('Webhook').item.json.job_id }}/applicants" 
           style="display: inline-block; background: linear-gradient(135deg, #D4AF37, #C5A028); color: #0f1729; font-weight: bold; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-size: 14px; margin-top: 10px;">
            عرض المتقدمين ←
        </a>
    </div>

    <div style="border-top: 1px solid rgba(212, 175, 55, 0.1); padding-top: 15px; text-align: center;">
        <p style="color: #666; font-size: 11px;">هذا الإيميل مرسل تلقائياً من منصة GrowthNexus</p>
    </div>
</div>
```

> ⚠️ **غيّر** `https://your-domain.com` بدومينك الحقيقي

---

### Node 5: Respond to Webhook

1. اضغط **+** → ابحث عن **Respond to Webhook**
2. من الفرع **Yes** (بعد Send Email):

```json
{
    "success": true,
    "message": "Notification sent",
    "email_sent_to": "{{ $('Supabase').item.json.email }}"
}
```

3. من الفرع **No** (بدون إيميل):

```json
{
    "success": true,
    "message": "No email found for owner",
    "email_sent": false
}
```

---

## 📱 اختياري: إضافة Telegram Bot

### إعداد Telegram Bot

1. تحدث مع `@BotFather` على Telegram
2. أرسل `/newbot` → اختر اسم → ستحصل على **Bot Token**
3. أنشئ Group أو Channel → أضف الـ Bot كـ admin
4. احصل على **Chat ID** (أرسل رسالة ثم افتح `https://api.telegram.org/bot<TOKEN>/getUpdates`)

### Node: Telegram (بعد Send Email)

1. اضغط **+** → ابحث عن **Telegram**
2. ضبط الإعدادات:

| الإعداد | القيمة |
|---------|--------|
| Operation | `Send Message` |
| Chat ID | (الـ ID من الخطوة أعلاه) |
| Text | (اللي تحت 👇) |
| Parse Mode | `HTML` |

**نص الرسالة:**
```
📋 <b>طلب توظيف جديد!</b>

👤 المرشح: {{ $('Webhook').item.json.candidate_name }}
💼 الوظيفة: {{ $('Webhook').item.json.job_title }}
🏢 الشركة: {{ $('Webhook').item.json.company_name }}
📅 {{ $('Webhook').item.json.timestamp }}

<a href="https://your-domain.com/employer/jobs/{{ $('Webhook').item.json.job_id }}/applicants">عرض المتقدمين ←</a>
```

---

## 🧪 اختبار الـ Workflow

### الطريقة 1: من التطبيق
1. سجّل دخول كمرشح
2. تقدم لأي وظيفة
3. تحقق: 🔔 الجرس في dashboard + إيميل + Telegram

### الطريقة 2: curl يدوي
```bash
curl -X POST https://n8n.asra3.com/webhook/gn-application-notify \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET_HERE" \
  -d '{
    "application_id": "test-123",
    "job_id": "test-job",
    "job_title": "مطور Full Stack",
    "candidate_name": "أحمد تجربة",
    "company_name": "شركة تجريبية",
    "company_id": "test-company",
    "owner_id": "YOUR_USER_UUID",
    "team_member_ids": ["YOUR_USER_UUID"],
    "timestamp": "2026-04-29T05:00:00Z"
  }'
```

---

## ✅ قائمة التحقق

- [ ] إنشاء Webhook node بالـ path الصحيح
- [ ] إعداد Header Auth
- [ ] ربط Supabase credentials
- [ ] إعداد Email node (Gmail/SMTP)
- [ ] اختبار بـ Listen for Test Event
- [ ] تفعيل الـ Workflow (الزر في الأعلى يمين)
- [ ] تحديث `.env.local` بالـ URL الصحيح
- [ ] إعادة تشغيل dev server
- [ ] اختبار من التطبيق بتقديم طلب حقيقي

---

## 🔧 مشاكل شائعة

| المشكلة | الحل |
|---------|------|
| Webhook لا يستقبل | تأكد إن الـ workflow مُفعّل (Active) |
| 401 Unauthorized | تأكد إن `x-webhook-secret` متطابق في `.env.local` و n8n |
| الإيميل لا يصل | تحقق من إعدادات SMTP أو Gmail OAuth |
| الإشعار يظهر في الجرس بس مافي إيميل | طبيعي — الإشعار الداخلي يعمل بدون n8n. n8n للإيميل فقط |
