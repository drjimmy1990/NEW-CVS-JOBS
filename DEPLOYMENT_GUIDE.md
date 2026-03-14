# 🚀 GrowthNexus — دليل النشر على VPS مع aaPanel
# GrowthNexus — Deployment Guide (Ubuntu VPS + aaPanel)

---

## المتطلبات الأساسية / Prerequisites

- Ubuntu VPS (20.04+ أو 22.04)
- aaPanel مثبت ومُفعّل
- دومين أو سب دومين يشير إلى IP السيرفر (مثال: `jobs.yourdomain.com`)
- حساب Supabase (جاهز مسبقاً)

---

## الخطوة 1: تثبيت Node.js على السيرفر

### من داخل aaPanel:
1. افتح **aaPanel** → اذهب إلى **App Store**
2. ابحث عن **Node.js version manager** وثبته
3. بعد التثبيت، اختر **Node.js v20.x** (أو أحدث LTS)

### أو من Terminal:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # يجب أن يظهر v20.x
npm -v
```

---

## الخطوة 2: رفع ملفات المشروع إلى السيرفر

### الطريقة 1: عبر Git (مُستحسن)
```bash
cd /www/wwwroot
git clone https://github.com/YOUR_USERNAME/growth-nexus.git
cd growth-nexus
```

### الطريقة 2: عبر FTP / File Manager في aaPanel
1. اضغط ملف المشروع كـ ZIP على جهازك
2. من aaPanel → **Files** → ارفع الملف إلى `/www/wwwroot/growth-nexus`
3. فك الضغط

---

## الخطوة 3: إعداد ملف البيئة (Environment Variables)

```bash
cd /www/wwwroot/growth-nexus
nano .env.local
```

أضف المتغيرات التالية:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cqahtitdamlunqjxeyeo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE

# n8n Webhooks (اختياري - عند تفعيل n8n)
NEXT_PUBLIC_N8N_CV_PARSER_WEBHOOK=https://your-n8n-domain.com/webhook/gn-cv-parser
```

> ⚠️ **تنبيه:** لا تنسخ مفتاح الـ Anon Key من ملف التطوير المحلي مباشرة بل تأكد من صحته.

---

## الخطوة 4: تثبيت الحزم وبناء المشروع

```bash
cd /www/wwwroot/growth-nexus
npm install
npm run build
```

> إذا ظهرت مشاكل في الـ build بسبب الذاكرة:
> ```bash
> NODE_OPTIONS="--max-old-space-size=2048" npm run build
> ```

بعد نجاح البناء، ستجد مجلد `.next` تم إنشاؤه.

---

## الخطوة 5: تشغيل التطبيق عبر PM2

PM2 هو مدير عمليات يبقي تطبيقك يعمل حتى بعد إعادة تشغيل السيرفر.

```bash
# تثبيت PM2
sudo npm install -g pm2

# تشغيل التطبيق
cd /www/wwwroot/growth-nexus
pm2 start npm --name "growth-nexus" -- start

# التحقق من أنه يعمل
pm2 status

# حفظ الإعدادات ليعمل تلقائياً عند إعادة التشغيل
pm2 save
pm2 startup
```

الآن التطبيق يعمل على `http://localhost:3000`)

---

## الخطوة 6: إعداد Nginx Reverse Proxy عبر aaPanel

### 6.1 إنشاء موقع جديد في aaPanel
1. افتح **aaPanel** → **Website** → **Add site**
2. أدخل الدومين: `jobs.yourdomain.com`
3. اختر **PHP Version: Static** (لا نحتاج PHP)
4. أنشئ الموقع

### 6.2 إعداد Reverse Proxy
1. اضغط على اسم الموقع → **Reverse Proxy**
2. اضغط **Add Reverse Proxy**
3. املأ الحقول:
   - **Proxy Name:** `growth-nexus`
   - **Target URL:** `http://127.0.0.1:3000`
4. اضغط **Submit**

### 6.3 (بديل) أو أضف Nginx Config يدوياً
اضغط على اسم الموقع → **Config** → عدّل ملف Nginx:

```nginx
server {
    listen 80;
    server_name jobs.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## الخطوة 7: تفعيل SSL (HTTPS)

1. في aaPanel → اضغط على اسم الموقع → **SSL**
2. اختر **Let's Encrypt**
3. أدخل بريدك الإلكتروني واضغط **Apply**
4. فعّل **Force HTTPS**

الآن يمكنك الوصول عبر: `https://jobs.yourdomain.com` ✅

---

## الخطوة 8: تحديث Supabase Auth Redirect URLs

> **مهم جداً!** بدون هذه الخطوة، تسجيل الدخول لن يعمل.

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. افتح مشروعك → **Authentication** → **URL Configuration**
3. عدّل الحقول:
   - **Site URL:** `https://jobs.yourdomain.com`
   - **Redirect URLs:** أضف `https://jobs.yourdomain.com/**`
4. اضغط **Save**

---

## الخطوة 9: التحديثات المستقبلية (Redeployment)

عند إجراء تغييرات على الكود:

```bash
cd /www/wwwroot/growth-nexus

# سحب أحدث نسخة (إذا تستخدم Git)
git pull origin main

# إعادة تثبيت الحزم وبناء المشروع
npm install
npm run build

# إعادة تشغيل التطبيق
pm2 restart growth-nexus
```

---

## أوامر مفيدة

| الأمر | الوظيفة |
|-------|---------|
| `pm2 status` | عرض حالة التطبيق |
| `pm2 logs growth-nexus` | عرض سجلات التطبيق |
| `pm2 restart growth-nexus` | إعادة تشغيل |
| `pm2 stop growth-nexus` | إيقاف التطبيق |
| `pm2 monit` | مراقبة الأداء في الوقت الحقيقي |

---

## استكشاف الأخطاء / Troubleshooting

### المشكلة: الصفحة تعرض "502 Bad Gateway"
- تأكد أن PM2 يعمل: `pm2 status`
- تأكد أن التطبيق على البورت الصحيح: `pm2 logs growth-nexus`

### المشكلة: "NEXT_PUBLIC_SUPABASE_URL is not defined"
- تأكد من وجود ملف `.env.local` في المجلد الرئيسي
- أعد البناء بعد تعديل الملف: `npm run build && pm2 restart growth-nexus`

### المشكلة: تسجيل الدخول لا يعمل (يرجع للصفحة الرئيسية)
- تأكد من تحديث **Site URL** و **Redirect URLs** في Supabase Dashboard (الخطوة 8)

### المشكلة: الصفحات تعرض 404
- تأكد أن البناء نجح بدون أخطاء
- تأكد أن Nginx Reverse Proxy يشير إلى `http://127.0.0.1:3000`
