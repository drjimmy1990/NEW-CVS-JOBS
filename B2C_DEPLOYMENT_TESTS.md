# 🧪 B2C Features — Post-Deployment Testing Guide

> **Commit:** `a66ed00`  
> **Date:** 24 May 2026  
> **SQL Migration:** `20260524000000_b2c_services.sql` (must be run on Supabase first)

---

## Pre-Test Checklist

- [ ] SQL migration executed successfully on Supabase
- [ ] Vercel deployment completed (check dashboard)
- [ ] `.env.local` has new webhook URLs (rejection-analyze, career-path, skill-gap)
- [ ] `system_config` has all `_free_mode = 'true'` entries (for testing without credits)

---

## Test 1: Rejection Analyzer 🔴

**Page:** `/candidate/rejection-analyzer`

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 1.1 | Page loads | Navigate to تحليل الرفض in sidebar | Page loads with header + empty state OR list of rejected apps |
| 1.2 | No rejected apps | (if no rejected apps exist) | Shows "لا توجد طلبات مرفوضة" empty state |
| 1.3 | Rejected apps list | Reject a candidate from employer panel first, then check | Shows rejected application card with job title, company, date |
| 1.4 | Analyze rejection | Click "تحليل الرفض" button on a rejected app | Loading spinner → Analysis result appears with sections |
| 1.5 | Analysis sections | Expand analysis result | Shows: أسباب الرفض, مهارات مطلوبة, مجالات التحسين, خطوات عملية, وظائف بديلة |
| 1.6 | Match score | Check score display | Shows percentage with color (red < 40, amber < 70, green ≥ 70) |
| 1.7 | Cached result | Click "عرض التحليل" again on same app | Shows same result instantly (no API call) |
| 1.8 | API direct test | `POST /api/ai/rejection-analysis` with `{"application_id": "uuid"}` | Returns `{ success: true, analysis: {...} }` |

### API Test (curl):
```bash
curl -X POST https://your-domain.com/api/ai/rejection-analysis \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth_cookie>" \
  -d '{"application_id": "<rejected_app_id>"}'
```

---

## Test 2: Skill Gap Analyzer 📊

**Page:** `/candidate/skill-gap`

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 2.1 | Page loads | Navigate to تحليل المهارات in sidebar | Page with header + "تحليل جديد" button |
| 2.2 | Empty state | No previous analyses | Shows "لا توجد تحليلات سابقة" |
| 2.3 | Open form | Click "تحليل جديد" | Form slides in with job title + skills inputs |
| 2.4 | Add skills | Type skill + Enter | Skill badge appears, can be removed with X |
| 2.5 | Submit analysis | Fill title "مطور React" + add skills → Click "ابدأ التحليل" | Loading → Result card appears |
| 2.6 | Result display | Expand result | Shows: match %, matched skills (green), missing skills (red), action plan |
| 2.7 | Priority badges | Check missing skills | Each has priority badge: حرج (red), مهم (amber), مستحسن (blue) |
| 2.8 | History | Submit multiple analyses | All appear in list, expandable |
| 2.9 | Validation | Submit without title | Shows "يرجى إدخال عنوان الوظيفة المستهدفة" error |

### API Test:
```bash
# POST - analyze
curl -X POST https://your-domain.com/api/ai/skill-gap \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth_cookie>" \
  -d '{"target_job_title": "مطور React", "target_skills": ["React", "TypeScript"]}'

# GET - history
curl https://your-domain.com/api/ai/skill-gap -H "Cookie: <auth_cookie>"
```

---

## Test 3: Career Path Generator 📈

**Page:** `/candidate/career-path`

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 3.1 | Page loads | Navigate to المسار المهني | Page with header + "مسار جديد" button |
| 3.2 | Form fields | Click "مسار جديد" | Shows: current role, target role, industry dropdown, years experience |
| 3.3 | Industry dropdown | Open dropdown | Lists 12 industries (تقنية المعلومات, البنوك, etc.) |
| 3.4 | Generate path | Fill form → "إنشاء المسار المهني" | Loading → Result card with timeline |
| 3.5 | Timeline display | Expand result | Vertical timeline with year markers (1, 2, 3, 5) + role + salary + skills |
| 3.6 | Current assessment | Check top section | Shows level badge + strengths (green) + gaps (red) |
| 3.7 | Training cards | Check training section | 3 training cards with name, provider, cost, duration |
| 3.8 | Market insights | Check bottom | 3 cards: الطلب, النمو, متوسط الراتب |
| 3.9 | Validation | Submit without role/industry | Error message shown |

### API Test:
```bash
curl -X POST https://your-domain.com/api/ai/career-path \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth_cookie>" \
  -d '{"current_role": "مبرمج", "industry": "تقنية المعلومات", "years_experience": 3}'
```

---

## Test 4: Smart Job Alerts 🔔

**Page:** `/candidate/job-alerts`

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 4.1 | Page loads | Navigate to تنبيهات الوظائف | Page with "تنبيه جديد" button |
| 4.2 | Create alert | Click "تنبيه جديد" → fill form | Form with: name, keywords, skills, job types, locations, salary, frequency |
| 4.3 | Keywords/Skills tags | Type + Enter | Tags appear as removable badges |
| 4.4 | Job type buttons | Click job type buttons | Toggle on/off (gold = selected) |
| 4.5 | Location buttons | Click UAE location buttons | Toggle selection for each emirate |
| 4.6 | Frequency dropdown | Select frequency | 3 options: يومياً, أسبوعياً, فوري |
| 4.7 | Save alert | Click "حفظ التنبيه" | Alert card appears in list |
| 4.8 | Toggle on/off | Click power icon | Green ↔ Red toggle, opacity changes |
| 4.9 | Delete alert | Click trash icon | Alert removed from list |
| 4.10 | Max limit | Create 4th alert (limit = 3) | Error: "لا يمكن إنشاء أكثر من 3 تنبيهات" |
| 4.11 | Duplicate name | Create alert with same name | Error: "يوجد تنبيه بنفس الاسم بالفعل" |

### API Tests:
```bash
# GET - list
curl https://your-domain.com/api/job-alerts -H "Cookie: <auth_cookie>"

# POST - create
curl -X POST https://your-domain.com/api/job-alerts \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth_cookie>" \
  -d '{"alert_name": "وظائف دبي", "keywords": ["React"], "locations": ["دبي"]}'

# PATCH - toggle
curl -X PATCH https://your-domain.com/api/job-alerts \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth_cookie>" \
  -d '{"id": "<alert_id>", "is_active": false}'

# DELETE
curl -X DELETE "https://your-domain.com/api/job-alerts?id=<alert_id>" \
  -H "Cookie: <auth_cookie>"
```

---

## Test 5: Auto Apply ⚡

**Page:** `/candidate/auto-apply`

| # | Test | Steps | Expected Result |
|---|------|-------|-----------------|
| 5.1 | Page loads | Navigate to التقديم التلقائي | Page with power toggle + settings form |
| 5.2 | Status card | Check header | Shows on/off status + usage counter (0/50) |
| 5.3 | Toggle active | Click power icon | Green (مفعّل) ↔ Red (متوقف) |
| 5.4 | Add roles | Type role + Enter | Role badge appears |
| 5.5 | Add skills | Type skill + Enter | Skill badge appears |
| 5.6 | Select locations | Click UAE buttons | Toggle selection |
| 5.7 | Match score slider | Drag slider | Updates percentage label (20-100%) |
| 5.8 | Cover letter | Type in textarea | Text saves with settings |
| 5.9 | Exclude companies | Type company + Enter | Company badge appears (red) |
| 5.10 | Save settings | Click "حفظ الإعدادات" | Success, settings persisted |
| 5.11 | Reload page | Refresh browser | All settings still there |
| 5.12 | Usage bar | Check progress bar | Color changes: green < 60%, amber < 90%, red ≥ 90% |

### API Tests:
```bash
# GET - settings + log
curl https://your-domain.com/api/auto-apply -H "Cookie: <auth_cookie>"

# POST - save settings
curl -X POST https://your-domain.com/api/auto-apply \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth_cookie>" \
  -d '{"is_active": true, "target_roles": ["مطور"], "min_match_score": 70}'

# DELETE - disable
curl -X DELETE https://your-domain.com/api/auto-apply -H "Cookie: <auth_cookie>"
```

---

## Test 6: Sidebar Navigation 🧭

| # | Test | Expected |
|---|------|----------|
| 6.1 | All 5 new links visible | تحليل الرفض, المسار المهني, تحليل المهارات, تنبيهات الوظائف, التقديم التلقائي |
| 6.2 | Correct icons | AlertTriangle, TrendingUp, BarChart3, Bell, Zap |
| 6.3 | Active state | Current page link is highlighted |
| 6.4 | Navigation works | Click each link → correct page loads |
| 6.5 | Existing links OK | Old links (لوحة التحكم, الملف, etc.) still work |

---

## Test 7: Database Verification 🗄️

Run these in Supabase SQL Editor:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('career_path_sessions', 'skill_gap_analyses', 
  'job_alert_preferences', 'job_alert_history', 
  'auto_apply_settings', 'auto_apply_log');

-- Check new column on applications
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'applications' AND column_name = 'rejection_analysis';

-- Check RPC exists
SELECT proname FROM pg_proc WHERE proname = 'deduct_b2c_credits';

-- Check system_config entries
SELECT key, value FROM system_config WHERE key LIKE '%_free_mode' OR key LIKE '%_cost';

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('career_path_sessions', 'skill_gap_analyses', 
  'job_alert_preferences', 'auto_apply_settings');
```

---

## Test 8: Credit System 💳

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 8.1 | Free mode ON | Check `system_config` → `*_free_mode = 'true'` | All features work without credits |
| 8.2 | Free mode OFF | Set `rejection_analyzer_free_mode = 'false'` | Feature requires credits |
| 8.3 | No credits | Set free_mode OFF + user has 0 credits | Returns 402 + Arabic error message |
| 8.4 | Credit deduction | Set free_mode OFF + user has credits | Credit balance decreases by 1 |

```sql
-- Toggle free mode for testing
UPDATE system_config SET value = 'false' WHERE key = 'rejection_analyzer_free_mode';

-- Check user credit balance
SELECT credits_balance FROM profiles WHERE id = '<user_id>';
```

---

## Test 9: Auth & Security 🔒

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 9.1 | Unauthenticated API | Call any B2C API without cookie | 401 Unauthorized |
| 9.2 | Wrong user data | Try to access another user's analysis | RLS blocks it — empty result |
| 9.3 | Invalid input | Send empty body to POST | 400 + specific error message |

---

## Quick Smoke Test Order

If limited time, test in this priority:

1. ✅ Database tables exist (Test 7)
2. ✅ Sidebar links work (Test 6)  
3. ✅ Rejection Analyzer end-to-end (Test 1.4)
4. ✅ Skill Gap form + result (Test 2.5-2.6)
5. ✅ Career Path generate (Test 3.4-3.5)
6. ✅ Job Alerts CRUD (Test 4.2-4.9)
7. ✅ Auto Apply save + reload (Test 5.10-5.11)
