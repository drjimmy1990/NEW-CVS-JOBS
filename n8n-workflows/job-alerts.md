# Smart Job Alerts — n8n Workflow Guide

## Workflow Name: `gn-job-alerts`
## Type: n8n-native (Schedule Trigger → Supabase → Email)

---

## Architecture

This is **fully n8n-native** — no Next.js API involved. The workflow:
1. Runs on a schedule (every morning at 7 AM UAE time)
2. Queries Supabase directly for active alert preferences
3. Matches against new jobs posted in the last 24h
4. Sends email notifications
5. Logs the results

## Workflow Nodes (12 nodes)

```
1. Schedule Trigger (Every day at 07:00 UTC+4)
   ↓
2. Supabase (Select active alert preferences)
   ├── Table: job_alert_preferences
   ├── Filter: is_active = true
   └── Join: profiles (for user email, name)
   ↓
3. Split In Batches (Process each user's alert)
   ↓
4. Supabase (Query new jobs from last 24h)
   ├── Table: jobs
   ├── Filter: created_at > NOW() - INTERVAL '24 hours'
   └── AND status = 'active'
   ↓
5. Code (Match jobs against alert preferences)
   ├── Match keywords against job title + description
   ├── Match skills against skills_required
   ├── Match locations against location_city
   ├── Match job_types against job_type
   ├── Match salary range if set
   └── Output: matched_jobs[] (sorted by relevance)
   ↓
6. IF (matched_jobs.length > 0)
   ├── TRUE →
   │   ↓
   │   7. SMTP / Email Send
   │   ├── To: {{ $json.user_email }}
   │   ├── Subject: "🔔 {{ matched_jobs.length }} وظائف جديدة تناسبك"
   │   └── Body: HTML email with job cards
   │   ↓
   │   8. Supabase (Insert into job_alert_history)
   │   ├── user_id, preference_id
   │   ├── jobs_matched: count
   │   └── jobs_sent: JSON array of matched job IDs
   │   ↓
   │   9. Supabase (Update last_sent_at)
   │   └── UPDATE job_alert_preferences SET last_sent_at = NOW()
   │
   └── FALSE → 
       10. No Operation (skip)
   ↓
11. Merge
   ↓
12. End / No Operation
```

## Matching Logic (Node 5 — Code Node)

```javascript
const preferences = $input.first().json;
const jobs = $('Supabase - Get Jobs').all();

const matchedJobs = jobs.filter(job => {
  const j = job.json;
  let score = 0;
  
  // Keyword match (title + description)
  const text = (j.title + ' ' + j.description).toLowerCase();
  const kwMatch = preferences.keywords.some(kw => text.includes(kw.toLowerCase()));
  if (kwMatch) score += 3;
  
  // Skill match
  const skillMatch = preferences.skills.some(sk =>
    (j.skills_required || []).some(jr => 
      jr.toLowerCase().includes(sk.toLowerCase())
    )
  );
  if (skillMatch) score += 3;
  
  // Location match
  if (preferences.locations.length > 0) {
    if (preferences.locations.includes(j.location_city)) score += 2;
    else return false; // Hard filter
  }
  
  // Job type match
  if (preferences.job_types.length > 0) {
    if (preferences.job_types.includes(j.job_type)) score += 1;
  }
  
  // Salary match
  if (preferences.salary_min && j.salary_max < preferences.salary_min) return false;
  if (preferences.salary_max && j.salary_min > preferences.salary_max) return false;
  
  return score >= 2; // At least 2 match points
}).slice(0, 10); // Max 10 jobs per alert

return matchedJobs.map(j => ({
  json: { ...j.json, match_source: 'alert' }
}));
```

## Email Template (Node 7)

```html
<div dir="rtl" style="font-family: Arial; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #c5a54e;">🔔 وظائف جديدة تناسبك</h2>
  <p>مرحباً {{ $json.user_name }}، وجدنا {{ matched_count }} وظائف جديدة تتوافق مع تنبيهك "{{ $json.alert_name }}"</p>
  
  {{#each matched_jobs}}
  <div style="border: 1px solid #333; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
    <h3 style="margin: 0; color: #c5a54e;">{{ this.title }}</h3>
    <p style="color: #888;">{{ this.company_name }} • {{ this.location_city }}</p>
    <p style="color: #aaa;">{{ this.salary_min }}-{{ this.salary_max }} AED</p>
    <a href="https://your-domain.com/jobs/{{ this.id }}" 
       style="background: #c5a54e; color: #1a1a2e; padding: 8px 16px; border-radius: 8px; text-decoration: none;">
      عرض الوظيفة
    </a>
  </div>
  {{/each}}
</div>
```

## Supabase Credentials Required

In n8n, create a **Supabase** credential:
- **Host**: `https://cqahtitdamlunqjxeyeo.supabase.co`
- **Service Role Key**: (from `.env.local`)

## n8n Setup Steps

1. Create workflow `gn-job-alerts`
2. **Schedule Trigger** → Cron: `0 7 * * *` (7 AM daily, UAE time)
3. **Supabase** node → SELECT from `job_alert_preferences` WHERE `is_active = true`
4. **Split In Batches** → Batch size: 1
5. **Supabase** → SELECT from `jobs` WHERE `created_at > NOW() - 24h`
6. **Code** → Matching logic (copy from above)
7. **IF** → `{{ $json.length > 0 }}`
8. **SMTP** → Email template
9. **Supabase** → INSERT into `job_alert_history`
10. **Supabase** → UPDATE `last_sent_at` on preference
11. Connect FALSE branch to No Operation
12. Activate
