# Smart Job Alerts — n8n Workflow Guide

## Workflow Name: `gn-job-alerts`
## Type: n8n-native (Schedule Trigger → Supabase → Email)

---

## ⚠️ This is DIFFERENT from the previous 3 workflows

No webhook, no Next.js API involved. n8n runs this **independently on a schedule**.

The dashboard page (`/candidate/job-alerts`) only manages the **preferences** (CRUD via `/api/job-alerts`). The actual matching + sending is done entirely by n8n.

---

## Architecture

```
[Schedule: 7 AM daily]
    ↓
[Supabase: Get active alert preferences + user email]
    ↓
[Split In Batches: 1 per loop]
    ↓
[Supabase: Get new jobs (last 24h)]
    ↓
[Code: Match jobs against preferences]
    ↓
[IF: matched_jobs.length > 0]
    ├── YES → [Code: Build HTML] → [Email/SMTP] → [Supabase: Log + Update last_sent_at]
    └── NO  → [No Operation]
```

---

## Step-by-Step Setup

### Node 1: Schedule Trigger

| Setting | Value |
|---------|-------|
| Trigger | Cron |
| Expression | `0 3 * * *` |
| Note | 3 AM UTC = 7 AM UAE time (UTC+4) |

### Node 2: Supabase — Get Active Alerts

| Setting | Value |
|---------|-------|
| Operation | Select |
| Table | `job_alert_preferences` |
| Filters | `is_active` = `true` |

**Important:** We need the user's email too. Use a **Supabase** node with **Custom SQL** (Supabase RPC or direct query) instead:

```sql
SELECT 
  jap.*,
  p.full_name as user_name,
  au.email as user_email
FROM job_alert_preferences jap
JOIN profiles p ON p.id = jap.user_id
JOIN auth.users au ON au.id = jap.user_id
WHERE jap.is_active = true
  AND (
    jap.frequency = 'daily'
    OR (jap.frequency = 'weekly' AND EXTRACT(DOW FROM NOW()) = 0)
    OR jap.frequency = 'instant'
  )
```

**Alternative (simpler):** Use 2 Supabase nodes:
1. Select from `job_alert_preferences` where `is_active = true`
2. For each, select from `profiles` where `id = user_id` to get email

### Node 3: Split In Batches

| Setting | Value |
|---------|-------|
| Batch Size | 1 |

### Node 4: Supabase — Get Recent Jobs

| Setting | Value |
|---------|-------|
| Operation | Select |
| Table | `jobs` |
| Filters | `status` = `active`, `created_at` > last 24 hours |

For the date filter, use a **Code** node before this to compute the date:
```javascript
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
return [{ json: { since: yesterday.toISOString() } }];
```

Then in the Supabase node filter: `created_at` >= `{{ $json.since }}`

### Node 5: Code — Match Jobs Against Preferences

This is the main logic. Paste this JavaScript:

```javascript
// Get the current alert preference (from Split In Batches)
const pref = $('Split In Batches').first().json;

// Get all recent jobs
const jobs = $('Supabase - Get Jobs').all();

const matchedJobs = [];

for (const jobItem of jobs) {
  const j = jobItem.json;
  let score = 0;
  let reasons = [];

  // --- Keyword match (title + description) ---
  if (pref.keywords && pref.keywords.length > 0) {
    const text = ((j.title || '') + ' ' + (j.description || '')).toLowerCase();
    const kwMatches = pref.keywords.filter(kw => text.includes(kw.toLowerCase()));
    if (kwMatches.length > 0) {
      score += kwMatches.length * 2;
      reasons.push('كلمات مفتاحية: ' + kwMatches.join(', '));
    }
  }

  // --- Skill match ---
  if (pref.skills && pref.skills.length > 0) {
    const jobSkills = (j.skills_required || []).map(s => s.toLowerCase());
    const skillMatches = pref.skills.filter(sk =>
      jobSkills.some(js => js.includes(sk.toLowerCase()) || sk.toLowerCase().includes(js))
    );
    if (skillMatches.length > 0) {
      score += skillMatches.length * 3;
      reasons.push('مهارات: ' + skillMatches.join(', '));
    }
  }

  // --- Location match (hard filter if set) ---
  if (pref.locations && pref.locations.length > 0) {
    if (pref.locations.includes(j.location_city)) {
      score += 2;
    } else {
      continue; // Skip — location doesn't match
    }
  }

  // --- Job type match ---
  if (pref.job_types && pref.job_types.length > 0) {
    if (pref.job_types.includes(j.job_type)) {
      score += 1;
    }
  }

  // --- Salary match (hard filter) ---
  if (pref.salary_min && j.salary_max && j.salary_max < pref.salary_min) {
    continue; // Too low
  }
  if (pref.salary_max && j.salary_min && j.salary_min > pref.salary_max) {
    continue; // Too high
  }

  // Must have at least 2 match points
  if (score >= 2) {
    matchedJobs.push({
      id: j.id,
      title: j.title,
      company_name: j.company_name || 'شركة',
      location_city: j.location_city || '',
      job_type: j.job_type || '',
      salary_min: j.salary_min,
      salary_max: j.salary_max,
      slug: j.slug || j.id,
      score: score,
      match_reasons: reasons,
    });
  }
}

// Sort by score, take top 10
matchedJobs.sort((a, b) => b.score - a.score);
const topJobs = matchedJobs.slice(0, 10);

return [{
  json: {
    user_id: pref.user_id,
    user_name: pref.user_name || 'مستخدم',
    user_email: pref.user_email || '',
    alert_name: pref.alert_name || 'تنبيه',
    preference_id: pref.id,
    matched_count: topJobs.length,
    matched_jobs: topJobs,
  }
}];
```

### Node 6: IF — Check Matches

| Setting | Value |
|---------|-------|
| Condition | `{{ $json.matched_count }}` > `0` |

### Node 7: Code — Build Email HTML

```javascript
const data = $input.first().json;
const domain = 'https://jobs-test.uae4jobs.ae';

const jobTypeLabels = {
  full_time: 'دوام كامل',
  part_time: 'دوام جزئي',
  contract: 'عقد',
  remote: 'عن بُعد',
  internship: 'تدريب',
};

let jobCards = '';
for (const job of data.matched_jobs) {
  const salary = job.salary_min && job.salary_max
    ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} AED`
    : '';
  const type = jobTypeLabels[job.job_type] || job.job_type || '';
  
  jobCards += `
    <div style="border: 1px solid #333; border-radius: 12px; padding: 16px; margin-bottom: 12px; background: #1a1a2e;">
      <h3 style="margin: 0 0 8px; color: #c5a54e; font-size: 16px;">${job.title}</h3>
      <p style="color: #888; margin: 4px 0; font-size: 13px;">${job.company_name} • ${job.location_city}</p>
      ${type ? `<span style="background: #c5a54e22; color: #c5a54e; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${type}</span>` : ''}
      ${salary ? `<p style="color: #aaa; margin: 8px 0 0; font-size: 13px;">💰 ${salary}</p>` : ''}
      <div style="margin-top: 12px;">
        <a href="${domain}/jobs/${job.slug}" 
           style="background: #c5a54e; color: #1a1a2e; padding: 8px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">
          عرض الوظيفة
        </a>
      </div>
    </div>
  `;
}

const html = `
<div dir="rtl" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f23; padding: 24px; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #c5a54e; margin: 0; font-size: 22px;">GrowthNexus</h1>
  </div>
  
  <h2 style="color: #e8e0d0; margin: 0 0 8px; font-size: 18px;">🔔 ${data.matched_count} وظائف جديدة تناسبك</h2>
  <p style="color: #888; margin: 0 0 20px; font-size: 14px;">
    مرحباً ${data.user_name}، وجدنا وظائف تتوافق مع تنبيهك "${data.alert_name}"
  </p>
  
  ${jobCards}
  
  <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #333;">
    <a href="${domain}/candidate/job-alerts" 
       style="color: #888; font-size: 12px; text-decoration: none;">
      إدارة التنبيهات | إلغاء الاشتراك
    </a>
  </div>
</div>
`;

return [{
  json: {
    ...data,
    email_html: html,
    email_subject: `🔔 ${data.matched_count} وظائف جديدة تناسبك — ${data.alert_name}`,
  }
}];
```

### Node 8: Email Send (SMTP or Webhook)

**Option A — SMTP Node:**

| Setting | Value |
|---------|-------|
| To | `{{ $json.user_email }}` |
| Subject | `{{ $json.email_subject }}` |
| HTML Body | `{{ $json.email_html }}` |
| From | `noreply@uae4jobs.ae` |

**Option B — Use your existing email webhook:**

Send to `N8N_EMAIL_SEND_WEBHOOK` (`gn-email-send`) with:
```json
{
  "to": "{{ $json.user_email }}",
  "subject": "{{ $json.email_subject }}",
  "html": "{{ $json.email_html }}"
}
```

### Node 9: Supabase — Log Alert History

| Setting | Value |
|---------|-------|
| Operation | Insert |
| Table | `job_alert_history` |

Fields:
```json
{
  "user_id": "{{ $json.user_id }}",
  "preference_id": "{{ $json.preference_id }}",
  "jobs_matched": "{{ $json.matched_count }}",
  "jobs_sent": "{{ JSON.stringify($json.matched_jobs.map(j => j.id)) }}"
}
```

### Node 10: Supabase — Update last_sent_at

| Setting | Value |
|---------|-------|
| Operation | Update |
| Table | `job_alert_preferences` |
| Filter | `id` = `{{ $json.preference_id }}` |
| Set | `last_sent_at` = `{{ new Date().toISOString() }}` |

---

## Supabase Credentials Required

Create a **Supabase** credential in n8n:
- **Host**: `https://cqahtitdamlunqjxeyeo.supabase.co`
- **Service Role Key**: from `.env.local` → `SUPABASE_SERVICE_ROLE_KEY`

---

## Testing

Since there's no webhook, test by:
1. Build the full workflow
2. Click **"Execute Workflow"** manually (don't wait for the schedule)
3. Make sure you have at least 1 active alert preference and 1 active job
4. Check each node's output in the n8n debug panel
5. Check if the email was received

---

## n8n Setup Summary

| # | Node | Type |
|---|------|------|
| 1 | Schedule Trigger | Cron `0 3 * * *` (7 AM UAE) |
| 2 | Supabase | SELECT `job_alert_preferences` WHERE active |
| 3 | Split In Batches | Batch size 1 |
| 4 | Supabase | SELECT `jobs` WHERE recent + active |
| 5 | Code | Match jobs against preferences |
| 6 | IF | matched_count > 0 |
| 7 | Code | Build email HTML |
| 8 | Email/SMTP | Send to user |
| 9 | Supabase | INSERT `job_alert_history` |
| 10 | Supabase | UPDATE `last_sent_at` |
