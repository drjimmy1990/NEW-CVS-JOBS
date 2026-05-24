# Auto Apply — n8n Workflow Guide

## Workflow Name: `gn-auto-apply`
## Type: n8n-native (Schedule Trigger → Supabase → AI Match → Auto Submit)

---

## ⚠️ Same pattern as Job Alerts — fully n8n-native, no webhook

The dashboard (`/candidate/auto-apply`) manages **settings** (CRUD via `/api/auto-apply`). The actual matching + applying is done entirely by n8n.

---

## Architecture

```
[Schedule: Every 6 hours]
    ↓
[Get many rows2: Get active auto_apply_settings]
    ↓
[Split Out1: 1 user per item]
    ↓
[Get a row2: Get user PROFILE (full_name, email)]
    ↓
[Get a row1: Get user CANDIDATE (skills, headline, experience)]
    ↓
[Get many rows3: Get active jobs]
    ↓
[Code in JavaScript6: Score & filter jobs]
    ↓
[If1: to_apply.length > 0?]
    ├── YES →
    │   [Code in JavaScript7: Loop jobs + prepare AI data]
    │       ↓
    │   [AI Agent: Generate cover letter per job]
    │       ↓
    │   [Supabase: INSERT application + cover_letter]
    │       ↓
    │   [Supabase: INSERT auto_apply_log]
    │       ↓
    │   [Supabase: UPDATE settings counter + last_run]
    └── NO → end
```

---

## Actual Node Names & Setup

### Node 1: Schedule Trigger (ADD LATER — test manually first)

| Setting | Value |
|---------|-------|
| Trigger | Cron |
| Expression | `0 */6 * * *` |
| Note | Every 6 hours (4x daily) |

---

### Node 2: `Get many rows2` ✅ DONE

| Setting | Value |
|---------|-------|
| Operation | Get All |
| Table | `auto_apply_settings` |
| Filter | `is_active` = `true` |

---

### Node 3: `Split Out1` ✅ DONE

| Setting | Value |
|---------|-------|
| Field to Split Out | `is_active` |
| Include | All Other Fields |

---

### Node 4: `Get a row2` ✅ DONE — PROFILES table

| Setting | Value |
|---------|-------|
| Operation | Get |
| Table | `profiles` |
| Filter | `id` = `{{ $json.user_id }}` |

> Gives us: `full_name`, `email`

---

### Node 5: `Get a row1` ✅ DONE — CANDIDATES table

| Setting | Value |
|---------|-------|
| Operation | Get |
| Table | `candidates` |
| Filter | `id` = `{{ $json.id }}` |

> Gives us: `skills`, `headline`, `years_experience`

---

### Node 6: `Get many rows3` ✅ DONE

| Setting | Value |
|---------|-------|
| Operation | Get All |
| Table | `jobs` |
| Filter | `status` = `active` |

---

### Node 7: `Code in JavaScript6` ✅ DONE — Score & Filter

```javascript
const settings = $('Split Out1').first().json;
const candidate = $('Get a row1').first().json;
const jobs = $('Get many rows3').all();

const appliedJobIds = [];

const matchedJobs = [];
const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());

for (const jobItem of jobs) {
  const j = jobItem.json;

  if (appliedJobIds.includes(j.id)) continue;

  if (settings.exclude_companies && settings.exclude_companies.length > 0) {
  }

  let score = 0;
  let maxScore = 0;

  // --- Role match (title) ---
  if (settings.target_roles && settings.target_roles.length > 0) {
    maxScore += 30;
    const titleLow = (j.title || '').toLowerCase();
    const roleMatch = settings.target_roles.some(r => 
      titleLow.includes(r.toLowerCase()) || r.toLowerCase().includes(titleLow)
    );
    if (roleMatch) score += 30;
  }

  // --- Skill match ---
  if (settings.target_skills && settings.target_skills.length > 0) {
    maxScore += 40;
    const jobSkills = (j.skills_required || []).map(s => s.toLowerCase());
    const matchCount = settings.target_skills.filter(sk =>
      jobSkills.some(js => js.includes(sk.toLowerCase()) || sk.toLowerCase().includes(js))
    ).length;
    if (settings.target_skills.length > 0) {
      score += Math.round((matchCount / settings.target_skills.length) * 40);
    }
  }

  // --- Candidate skills vs job skills ---
  if (candidateSkills.length > 0 && j.skills_required) {
    maxScore += 20;
    const jobSkills = j.skills_required.map(s => s.toLowerCase());
    const candMatch = candidateSkills.filter(cs =>
      jobSkills.some(js => js.includes(cs) || cs.includes(js))
    ).length;
    if (jobSkills.length > 0) {
      score += Math.round((candMatch / jobSkills.length) * 20);
    }
  }

  // --- Location match ---
  if (settings.target_locations && settings.target_locations.length > 0) {
    maxScore += 10;
    if (settings.target_locations.includes(j.location_city)) {
      score += 10;
    } else {
      continue;
    }
  }

  // --- Job type match ---
  if (settings.target_job_types && settings.target_job_types.length > 0) {
    if (!settings.target_job_types.includes(j.job_type)) {
      continue;
    }
  }

  // --- Salary filter ---
  if (settings.min_salary && j.salary_max && j.salary_max < settings.min_salary) {
    continue;
  }

  const matchScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 50;

  if (matchScore >= (settings.min_match_score || 60)) {
    matchedJobs.push({
      job_id: j.id,
      title: j.title,
      company_id: j.company_id,
      location_city: j.location_city,
      salary_min: j.salary_min,
      salary_max: j.salary_max,
      match_score: matchScore,
    });
  }
}

const monthlyRemaining = (settings.max_applications_per_month || 50) - (settings.applications_this_month || 0);
matchedJobs.sort((a, b) => b.match_score - a.match_score);
const toApply = matchedJobs.slice(0, Math.max(0, monthlyRemaining));
const toSkip = matchedJobs.slice(Math.max(0, monthlyRemaining));

return [{
  json: {
    user_id: settings.user_id,
    settings_id: settings.id,
    to_apply: toApply,
    to_skip: toSkip,
    total_matched: matchedJobs.length,
    monthly_remaining: monthlyRemaining,
    cover_letter_template: settings.cover_letter_template || '',
  }
}];
```

---

### Node 8: `If1` ✅ DONE

| Setting | Value |
|---------|-------|
| Condition | `{{ $json.to_apply.length }}` > `0` (number) |

---

### Node 9: `Code in JavaScript7` ✅ DONE — Loop & Prepare AI Data

```javascript
const data = $input.first().json;
const candidate = $('Get a row1').first().json;  // candidates table (skills, headline)
const profile = $('Get a row2').first().json;     // profiles table (full_name)
const results = [];

for (const job of data.to_apply) {
  results.push({
    json: {
      user_id: data.user_id,
      settings_id: data.settings_id,
      job_id: job.job_id,
      title: job.title,
      location_city: job.location_city,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      match_score: job.match_score,
      // Name from PROFILES table
      candidate_name: profile.full_name || '',
      // Skills/experience from CANDIDATES table
      candidate_skills: (candidate.skills || []).join(', '),
      candidate_experience: candidate.years_experience || '',
      candidate_headline: candidate.headline || '',
      // Cover letter template from settings
      cover_letter_template: data.cover_letter_template || '',
      action: 'apply',
    }
  });
}

return results;
```

---

## 🔴 REMAINING NODES TO BUILD

### Node 10: AI Agent — Generate Cover Letter

| Setting | Value |
|---------|-------|
| Type | **AI Agent** or **Basic LLM Chain** |
| Chat Model | Google Gemini Chat Model |
| Model | `gemini-2.0-flash` |

**System Message:**

```
أنت كاتب رسائل تغطية محترف. مهمتك كتابة رسالة تغطية موجزة ومقنعة بالعربية للتقديم على وظيفة.

القواعد:
- الرسالة يجب أن تكون 150-250 كلمة فقط
- ابدأ بجملة افتتاحية قوية تظهر الاهتمام بالوظيفة المحددة
- اربط مهارات وخبرات المرشح بمتطلبات الوظيفة
- اختم بدعوة للعمل (طلب مقابلة أو تواصل)
- الأسلوب: مهني ومباشر بدون مبالغة
- لا تكتب عنوان أو "إلى من يهمه الأمر" — ابدأ مباشرة بالمحتوى
- إذا أعطاك المستخدم قالب، استخدمه كأساس وعدّله حسب الوظيفة
```

**User Message (Prompt):**

```
الوظيفة: {{ $json.title }}
الموقع: {{ $json.location_city }}
الراتب: {{ $json.salary_min }}-{{ $json.salary_max }} AED
نسبة التوافق: {{ $json.match_score }}%

بيانات المرشح:
- الاسم: {{ $json.candidate_name }}
- المسمى: {{ $json.candidate_headline }}
- المهارات: {{ $json.candidate_skills }}
- سنوات الخبرة: {{ $json.candidate_experience }}

{{ $json.cover_letter_template ? 'قالب المستخدم للاسترشاد:\n' + $json.cover_letter_template : '' }}

اكتب رسالة تغطية مخصصة لهذه الوظيفة.
```

Connect: `Code in JavaScript7` → `AI Agent`

> **Output:** The AI text will be in `{{ $json.text }}` or `{{ $json.output }}`

---

### Node 11: Supabase — Insert Application

| Setting | Value |
|---------|-------|
| Operation | Insert |
| Table | `applications` |

Fields:

| Field | Value |
|-------|-------|
| `candidate_id` | `{{ $('Code in JavaScript7').item.json.user_id }}` |
| `job_id` | `{{ $('Code in JavaScript7').item.json.job_id }}` |
| `status` | `pending` |
| `cover_letter` | `{{ $json.text }}` |
| `source` | `auto_apply` |

Connect: `AI Agent` → `Insert Application`

---

### Node 12: Supabase — Log Application

| Setting | Value |
|---------|-------|
| Operation | Insert |
| Table | `auto_apply_log` |

Fields:

| Field | Value |
|-------|-------|
| `user_id` | `{{ $('Code in JavaScript7').item.json.user_id }}` |
| `job_id` | `{{ $('Code in JavaScript7').item.json.job_id }}` |
| `match_score` | `{{ $('Code in JavaScript7').item.json.match_score }}` |
| `status` | `applied` |

Connect: `Insert Application` → `Log Application`

---

### Node 13: Supabase — Update Settings

| Setting | Value |
|---------|-------|
| Operation | Update |
| Table | `auto_apply_settings` |
| Filter | `id` = `{{ $('Code in JavaScript7').item.json.settings_id }}` |

Fields:

| Field | Value |
|-------|-------|
| `last_run_at` | `{{ new Date().toISOString() }}` |

Connect: `Log Application` → `Update Settings`

---

## Connection Chain

```
Get many rows2 → Split Out1 → Get a row2 (profiles) → Get a row1 (candidates) → Get many rows3 (jobs)
    → Code in JavaScript6 (score) → If1 → Code in JavaScript7 (loop)
    → AI Agent (cover letter) → INSERT applications → INSERT auto_apply_log → UPDATE auto_apply_settings
```

---

## Supabase Credentials

| Setting | Value |
|---------|-------|
| Host | `https://cqahtitdamlunqjxeyeo.supabase.co` |
| Service Role Key | from `.env.local` |

> **Important:** Use **Service Role Key** (not anon key) because n8n needs to INSERT into `applications` on behalf of users.

---

## Testing

1. Build remaining nodes (AI → Insert → Log → Update)
2. Pin test data on `Code in JavaScript7` output
3. Execute workflow manually
4. Check: application created in `applications` table + logged in `auto_apply_log`
5. Check: cover letter is AI-generated Arabic text (not static string)

---

## n8n Setup Summary

| # | n8n Node Name | Type |
|---|---------------|------|
| 1 | Schedule Trigger | Cron `0 */6 * * *` (add last) |
| 2 | `Get many rows2` | SELECT `auto_apply_settings` WHERE active ✅ |
| 3 | `Split Out1` | Split per user ✅ |
| 4 | `Get a row2` | SELECT `profiles` (full_name) ✅ |
| 5 | `Get a row1` | SELECT `candidates` (skills, headline) ✅ |
| 6 | `Get many rows3` | SELECT `jobs` WHERE active ✅ |
| 7 | `Code in JavaScript6` | Score & filter jobs ✅ |
| 8 | `If1` | to_apply.length > 0 ✅ |
| 9 | `Code in JavaScript7` | Loop jobs + prepare AI data ✅ |
| 10 | **AI Agent** | **Generate cover letter** 🔴 |
| 11 | **Supabase INSERT** | **INSERT `applications`** 🔴 |
| 12 | **Supabase INSERT** | **INSERT `auto_apply_log`** 🔴 |
| 13 | **Supabase UPDATE** | **UPDATE `auto_apply_settings`** 🔴 |
