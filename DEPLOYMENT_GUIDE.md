# 🚀 GrowthNexus — Deployment Guide (Ubuntu VPS + aaPanel)

> **آخر تحديث:** 29 أبريل 2026
>
> **Repo:** `https://github.com/drjimmy1990/NEW-CVS-JOBS`
>
> **App folder:** `growth-nexus/` (inside the repo root)

---

## 📋 المتطلبات

- Ubuntu VPS (22.04+)
- aaPanel مثبت
- دومين يشير إلى IP السيرفر
- حساب Supabase جاهز
- حساب n8n (عندك: `n8n.asra3.com`)

---

## ⚡ Quick Deploy (نسخ ولصق)

إذا عندك كل شيء جاهز (Node.js + PM2 + Nginx)، فقط شغّل هذه الأوامر:

```bash
cd /www/wwwroot
git clone https://github.com/drjimmy1990/NEW-CVS-JOBS.git
cd NEW-CVS-JOBS/growth-nexus
cp .env.local.example .env.local
nano .env.local  # عدّل القيم
npm install
npm run build
pm2 start npm --name "growthnexus" -- start
pm2 save
```

**للتحديث:**
```bash
cd /www/wwwroot/NEW-CVS-JOBS/growth-nexus
git pull origin main
npm install
npm run build
pm2 restart growthnexus
```

---

## 📝 Step-by-Step Guide

### الخطوة 1: تثبيت Node.js

**من aaPanel:**
1. **App Store** → ابحث **Node.js version manager** → ثبته
2. اختر **Node.js v20.x** (LTS)

**أو من Terminal:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

---

### الخطوة 2: استنساخ المشروع

```bash
cd /www/wwwroot
git clone https://github.com/drjimmy1990/NEW-CVS-JOBS.git
cd NEW-CVS-JOBS/growth-nexus
```

> ⚠️ **ملاحظة:** التطبيق داخل مجلد `growth-nexus/` وليس في root الـ repo

---

### الخطوة 3: إعداد Environment Variables

```bash
cd /www/wwwroot/NEW-CVS-JOBS/growth-nexus
nano .env.local
```

**انسخ والصق (غيّر القيم المطلوبة):**

```env
# ===== Supabase =====
NEXT_PUBLIC_SUPABASE_URL=https://cqahtitdamlunqjxeyeo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# ===== N8N Webhooks (Working) =====
NEXT_PUBLIC_N8N_CV_PARSER_WEBHOOK=https://n8n.asra3.com/webhook/gn-cv-parser
N8N_AI_JOB_DESC_WEBHOOK=https://n8n.asra3.com/webhook/gn-ai-job-description
N8N_MATCH_SCORE_WEBHOOK=https://n8n.asra3.com/webhook/gn-match-score
N8N_INTERVIEW_QUESTIONS_WEBHOOK=https://n8n.asra3.com/webhook/gn-interview-questions
N8N_INTERVIEW_EVAL_WEBHOOK=https://n8n.asra3.com/webhook/gn-interview-eval
N8N_COMMITTEE_SUMMARY_WEBHOOK=https://n8n.asra3.com/webhook/gn-committee-summary
N8N_APPLICATION_NOTIFY_WEBHOOK=https://n8n.asra3.com/webhook/gn-application-notify

# ===== N8N Webhooks (Not Built Yet — leave as placeholder) =====
N8N_SMART_MATCH_WEBHOOK=https://n8n.asra3.com/webhook/gn-smart-match
N8N_MESSAGE_NOTIFY_WEBHOOK=https://n8n.asra3.com/webhook/gn-message-notify
N8N_PAYMENT_VERIFY_WEBHOOK=https://n8n.asra3.com/webhook/gn-payment-verify
N8N_COMPANY_VERIFY_WEBHOOK=https://n8n.asra3.com/webhook/gn-company-verify
N8N_CONTRACT_GEN_WEBHOOK=https://n8n.asra3.com/webhook/gn-contract-gen

# ===== Webhook Secret =====
# ⚠️ CHANGE THIS! Must match n8n Header Auth value
N8N_WEBHOOK_SECRET=change-me-to-a-strong-secret

# ===== Stripe =====
STRIPE_SECRET_KEY=sk_test_REPLACE_ME
STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME
STRIPE_STARTER_PRICE_ID=price_starter_monthly_REPLACE
STRIPE_GROWTH_PRICE_ID=price_growth_monthly_REPLACE
STRIPE_PRO_PRICE_ID=price_pro_monthly_REPLACE
STRIPE_STARTER_YEARLY_PRICE_ID=price_starter_yearly_REPLACE
STRIPE_GROWTH_YEARLY_PRICE_ID=price_growth_yearly_REPLACE
STRIPE_PRO_YEARLY_PRICE_ID=price_pro_yearly_REPLACE
```

---

### الخطوة 4: تثبيت وبناء المشروع

```bash
cd /www/wwwroot/NEW-CVS-JOBS/growth-nexus
npm install
npm run build
```

> إذا فشل البناء بسبب الذاكرة:
> ```bash
> NODE_OPTIONS="--max-old-space-size=2048" npm run build
> ```

---

### الخطوة 5: تشغيل بـ PM2

```bash
# تثبيت PM2 (مرة واحدة)
sudo npm install -g pm2

# تشغيل التطبيق
cd /www/wwwroot/NEW-CVS-JOBS/growth-nexus
pm2 start npm --name "growthnexus" -- start

# التحقق
pm2 status

# حفظ + تشغيل تلقائي عند restart
pm2 save
pm2 startup
```

التطبيق الآن يعمل على `http://localhost:3000`

---

### الخطوة 6: إعداد Nginx (aaPanel)

#### 6.1 إنشاء موقع
1. **aaPanel** → **Website** → **Add site**
2. الدومين: `jobs.yourdomain.com`
3. PHP Version: **Static**
4. أنشئ الموقع

#### 6.2 إعداد Reverse Proxy
1. اضغط اسم الموقع → **Reverse Proxy** → **Add**
2. Proxy Name: `growthnexus`
3. Target URL: `http://127.0.0.1:3000`
4. **Submit**

#### 6.3 (بديل) Nginx Config يدوي
اضغط اسم الموقع → **Config** → عدّل:

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
        
        # Timeouts for AI webhooks (may take time)
        proxy_read_timeout 120s;
        proxy_connect_timeout 30s;
        proxy_send_timeout 120s;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }
}
```

---

### الخطوة 7: SSL (HTTPS)

1. aaPanel → اضغط اسم الموقع → **SSL**
2. اختر **Let's Encrypt**
3. أدخل بريدك → **Apply**
4. فعّل **Force HTTPS**

✅ `https://jobs.yourdomain.com` جاهز

---

### الخطوة 8: تحديث Supabase Auth URLs

> **⚠️ بدون هذا، تسجيل الدخول لن يعمل!**

1. [Supabase Dashboard](https://supabase.com/dashboard) → مشروعك
2. **Authentication** → **URL Configuration**
3. عدّل:
   - **Site URL:** `https://jobs.yourdomain.com`
   - **Redirect URLs:** أضف `https://jobs.yourdomain.com/**`
4. **Save**

---

### الخطوة 9: تشغيل SQL Migrations

> **⚠️ مهم!** هذه الخطوات مطلوبة لتعمل الميزات الجديدة

افتح **Supabase Dashboard** → **SQL Editor** → شغّل الملفات بالترتيب:

```
1. supabase/migrations/20260429020000_company_team_members.sql   ← Team System
2. supabase/migrations/20260429030000_notifications_system.sql   ← Notifications
```

---

## 🔄 التحديث (Redeploy)

عند تعديل الكود أو سحب تحديثات:

```bash
cd /www/wwwroot/NEW-CVS-JOBS/growth-nexus
git pull origin main
npm install
npm run build
pm2 restart growthnexus
```

**سكربت تحديث سريع (اختياري):**
```bash
# أنشئ ملف /www/wwwroot/NEW-CVS-JOBS/deploy.sh
cat > /www/wwwroot/NEW-CVS-JOBS/deploy.sh << 'EOF'
#!/bin/bash
echo "🔄 Pulling latest code..."
cd /www/wwwroot/NEW-CVS-JOBS/growth-nexus
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building..."
npm run build

echo "🔄 Restarting..."
pm2 restart growthnexus

echo "✅ Deploy complete!"
pm2 status
EOF
chmod +x /www/wwwroot/NEW-CVS-JOBS/deploy.sh
```

ثم كل مرة تحتاج تحديث:
```bash
/www/wwwroot/NEW-CVS-JOBS/deploy.sh
```

---

## 🛠️ أوامر مفيدة

| الأمر | الوظيفة |
|-------|---------|
| `pm2 status` | حالة التطبيق |
| `pm2 logs growthnexus` | سجلات التطبيق |
| `pm2 logs growthnexus --lines 50` | آخر 50 سطر |
| `pm2 restart growthnexus` | إعادة تشغيل |
| `pm2 stop growthnexus` | إيقاف |
| `pm2 delete growthnexus` | حذف من PM2 |
| `pm2 monit` | مراقبة حية |
| `pm2 flush` | مسح السجلات |

---

## 🔍 Troubleshooting

### ❌ 502 Bad Gateway
```bash
pm2 status                    # هل التطبيق يعمل؟
pm2 logs growthnexus          # شوف الأخطاء
pm2 restart growthnexus       # جرب إعادة التشغيل
```

### ❌ NEXT_PUBLIC_SUPABASE_URL is not defined
```bash
cat /www/wwwroot/NEW-CVS-JOBS/growth-nexus/.env.local  # تأكد الملف موجود
npm run build                 # أعد البناء
pm2 restart growthnexus
```

### ❌ تسجيل الدخول لا يعمل
- تأكد من **Site URL** و **Redirect URLs** في Supabase (الخطوة 8)
- تأكد الدومين يطابق

### ❌ AI features لا تعمل (match score, interview, etc.)
```bash
# تأكد الـ webhooks تشير لـ n8n.asra3.com
grep "n8n" /www/wwwroot/NEW-CVS-JOBS/growth-nexus/.env.local
```
- تأكد إن الـ workflow مُفعّل (Active) في n8n

### ❌ Build fails — out of memory
```bash
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

### ❌ Port 3000 already in use
```bash
pm2 delete growthnexus
lsof -i :3000               # شوف مين يستخدم البورت
kill -9 <PID>                # اقتل العملية
pm2 start npm --name "growthnexus" -- start
```

### ❌ Notifications/Team لا يعمل
- تأكد من تشغيل الـ SQL migrations (الخطوة 9)

---

## 🔐 Security Checklist

- [ ] غيّر `N8N_WEBHOOK_SECRET` لقيمة آمنة (الحالي: `change-me-to-a-strong-secret`)
- [ ] تأكد `.env.local` مش متاح للعامة (aaPanel يحميه تلقائياً)
- [ ] فعّل SSL (HTTPS) عبر Let's Encrypt
- [ ] حدّث Supabase Auth redirect URLs
- [ ] لا تشارك `SUPABASE_SERVICE_ROLE_KEY` أبداً
