# 🚀 GrowthNexus — Deployment Guide

> **آخر تحديث:** 29 أبريل 2026
>
> **Repo:** `https://github.com/drjimmy1990/NEW-CVS-JOBS`
>
> **VPS:** `178.18.254.38` — aaPanel at `panel.uae4jobs.ae`
>
> **Live Site:** `https://jobs-test.uae4jobs.ae`
>
> **App Path:** `/www/wwwroot/jobs-test.uae4jobs.ae/`

---

## ⚡ Quick Update (استخدم هذا دائماً)

```bash
cd /www/wwwroot/jobs-test.uae4jobs.ae
git pull origin main
npm install
npm run build
pm2 restart growthnexus
```

**أو إذا عندك الـ deploy script:**
```bash
/www/wwwroot/jobs-test.uae4jobs.ae/deploy.sh
```

---

## 🔧 إنشاء Deploy Script (مرة واحدة)

```bash
cat > /www/wwwroot/jobs-test.uae4jobs.ae/deploy.sh << 'EOF'
#!/bin/bash
echo "🔄 Pulling latest code..."
cd /www/wwwroot/jobs-test.uae4jobs.ae
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
chmod +x /www/wwwroot/jobs-test.uae4jobs.ae/deploy.sh
```

---

## 📝 Full Setup Guide (إعداد من الصفر)

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

> ⚠️ أنت عندك المشروع بالفعل في `/www/wwwroot/jobs-test.uae4jobs.ae/`
> هذه الخطوة فقط لو تبدأ من جديد

```bash
cd /www/wwwroot
# إنشاء الموقع من aaPanel أولاً، ثم:
cd jobs-test.uae4jobs.ae

# استنسخ المشروع (مجلد growth-nexus هو التطبيق الفعلي)
git clone https://github.com/drjimmy1990/NEW-CVS-JOBS.git temp-clone
cp -r temp-clone/growth-nexus/* .
cp -r temp-clone/growth-nexus/.* . 2>/dev/null
rm -rf temp-clone
```

> **ملاحظة:** الريبو فيه `growth-nexus/` كمجلد فرعي — ننسخ محتوياته مباشرة لمجلد الموقع

---

### الخطوة 3: إعداد Environment Variables

```bash
cd /www/wwwroot/jobs-test.uae4jobs.ae
nano .env.local
```

**انسخ والصق:**

```env
# ===== Supabase =====
NEXT_PUBLIC_SUPABASE_URL=https://cqahtitdamlunqjxeyeo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# ===== N8N Webhooks (✅ Working — مبنية في n8n) =====
NEXT_PUBLIC_N8N_CV_PARSER_WEBHOOK=https://n8n.asra3.com/webhook/gn-cv-parser
N8N_AI_JOB_DESC_WEBHOOK=https://n8n.asra3.com/webhook/gn-ai-job-description
N8N_MATCH_SCORE_WEBHOOK=https://n8n.asra3.com/webhook/gn-match-score
N8N_INTERVIEW_QUESTIONS_WEBHOOK=https://n8n.asra3.com/webhook/gn-interview-questions
N8N_INTERVIEW_EVAL_WEBHOOK=https://n8n.asra3.com/webhook/gn-interview-eval
N8N_COMMITTEE_SUMMARY_WEBHOOK=https://n8n.asra3.com/webhook/gn-committee-summary
N8N_APPLICATION_NOTIFY_WEBHOOK=https://n8n.asra3.com/webhook/gn-application-notify

# ===== N8N Webhooks (❌ Not built yet — placeholders) =====
N8N_SMART_MATCH_WEBHOOK=https://n8n.asra3.com/webhook/gn-smart-match
N8N_MESSAGE_NOTIFY_WEBHOOK=https://n8n.asra3.com/webhook/gn-message-notify
N8N_PAYMENT_VERIFY_WEBHOOK=https://n8n.asra3.com/webhook/gn-payment-verify
N8N_COMPANY_VERIFY_WEBHOOK=https://n8n.asra3.com/webhook/gn-company-verify
N8N_CONTRACT_GEN_WEBHOOK=https://n8n.asra3.com/webhook/gn-contract-gen

# ===== Webhook Secret =====
# ⚠️ CHANGE THIS! Must match n8n Header Auth value
N8N_WEBHOOK_SECRET=change-me-to-a-strong-secret

# ===== Stripe (for later) =====
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

### الخطوة 4: تثبيت + بناء + تشغيل

```bash
cd /www/wwwroot/jobs-test.uae4jobs.ae

# تثبيت الحزم
npm install

# بناء المشروع
npm run build

# تثبيت PM2 (مرة واحدة)
sudo npm install -g pm2

# تشغيل
pm2 start npm --name "growthnexus" -- start

# حفظ + auto-start
pm2 save
pm2 startup
```

> إذا فشل البناء بسبب الذاكرة:
> ```bash
> NODE_OPTIONS="--max-old-space-size=2048" npm run build
> ```

---

### الخطوة 5: Nginx Reverse Proxy (aaPanel)

#### الطريقة 1: من aaPanel UI
1. **Website** → اضغط `jobs-test.uae4jobs.ae` → **Reverse Proxy** → **Add**
2. Proxy Name: `growthnexus`
3. Target URL: `http://127.0.0.1:3000`
4. **Submit**

#### الطريقة 2: Nginx Config يدوي
اضغط اسم الموقع → **Config**:

```nginx
server {
    listen 80;
    server_name jobs-test.uae4jobs.ae;

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
        
        # Timeouts for AI webhooks
        proxy_read_timeout 120s;
        proxy_connect_timeout 30s;
        proxy_send_timeout 120s;
    }

    # Cache static files
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }
}
```

---

### الخطوة 6: SSL (HTTPS)

1. aaPanel → `jobs-test.uae4jobs.ae` → **SSL**
2. **Let's Encrypt** → أدخل بريدك → **Apply**
3. فعّل **Force HTTPS**

---

### الخطوة 7: تحديث Supabase Auth URLs

> **⚠️ بدون هذا، تسجيل الدخول لن يعمل!**

1. [Supabase Dashboard](https://supabase.com/dashboard) → مشروعك
2. **Authentication** → **URL Configuration**
3. عدّل:
   - **Site URL:** `https://jobs-test.uae4jobs.ae`
   - **Redirect URLs:** أضف `https://jobs-test.uae4jobs.ae/**`
4. **Save**

---

### الخطوة 8: تشغيل SQL Migrations

> **⚠️ مطلوب!** بدونها Team و Notifications لن يعملوا

افتح **Supabase Dashboard** → **SQL Editor** → شغّل بالترتيب:

```
1. 20260429020000_company_team_members.sql   ← نظام الفريق
2. 20260429030000_notifications_system.sql   ← نظام الإشعارات
```

---

## 🛠️ أوامر يومية

| الأمر | الوظيفة |
|-------|---------|
| `pm2 status` | حالة التطبيق |
| `pm2 logs growthnexus` | سجلات |
| `pm2 logs growthnexus --lines 50` | آخر 50 سطر |
| `pm2 restart growthnexus` | إعادة تشغيل |
| `pm2 stop growthnexus` | إيقاف |
| `pm2 monit` | مراقبة حية |
| `pm2 flush` | مسح السجلات |

---

## 🔍 Troubleshooting

### ❌ 502 Bad Gateway
```bash
pm2 status
pm2 logs growthnexus --lines 30
pm2 restart growthnexus
```

### ❌ NEXT_PUBLIC_SUPABASE_URL undefined
```bash
cat /www/wwwroot/jobs-test.uae4jobs.ae/.env.local
npm run build
pm2 restart growthnexus
```

### ❌ تسجيل الدخول لا يعمل
- Supabase → Auth → URL Config → Site URL = `https://jobs-test.uae4jobs.ae`

### ❌ AI لا يعمل (match, interview, etc.)
```bash
grep "n8n" /www/wwwroot/jobs-test.uae4jobs.ae/.env.local
```
- تأكد الـ workflow مُفعّل (Active) في n8n

### ❌ Build — out of memory
```bash
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

### ❌ Port 3000 مستخدم
```bash
pm2 delete growthnexus
lsof -i :3000
kill -9 <PID>
pm2 start npm --name "growthnexus" -- start
```

### ❌ Team/Notifications لا يعمل
- شغّل الـ SQL migrations (الخطوة 8)

### ❌ git pull يرفض (conflicts)
```bash
cd /www/wwwroot/jobs-test.uae4jobs.ae
git stash
git pull origin main
git stash pop
```

---

## 🔐 Security Checklist

- [ ] غيّر `N8N_WEBHOOK_SECRET` لقيمة آمنة
- [ ] تأكد `.env.local` محمي (644 permissions)
- [ ] فعّل SSL (HTTPS)
- [ ] حدّث Supabase Auth redirect URLs
- [ ] لا تشارك `SUPABASE_SERVICE_ROLE_KEY`
- [ ] غيّر كلمة مرور aaPanel الافتراضية
