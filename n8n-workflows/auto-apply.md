# Auto Apply — n8n Workflow Guide

## Workflow Name: `gn-auto-apply`
## Type: n8n-native (Schedule Trigger → Supabase → Apply → Email)

---

## Architecture

This is **fully n8n-native** — no Next.js API cron route involved. The workflow:
1. Runs on a schedule (every 6 hours)
2. Queries Supabase for users with auto-apply enabled
3. Finds new matching jobs they haven't applied to
4. Creates applications automatically
5. Sends confirmation emails
6. Logs every action

## Workflow Nodes (16 nodes)

```
1. Schedule Trigger (Every 6 hours)
   ↓
2. Supabase (Select users with is_active = true)
   ├── Table: auto_apply_settings
   ├── Filter: is_active = true AND applications_this_month < max
   └── Join: profiles (email, name), candidates (skills)
   ↓
3. Split In Batches (Process each user)
   ↓
4. Supabase (Query jobs posted in last 24h, status=active)
   ├── Table: jobs
   ├── Exclude: jobs user already applied to
   └── Exclude: companies in exclude_companies list
   ↓
5. Code (Calculate match score per job)
   ├── Match target_roles against job.title
   ├── Match target_skills against job.skills_required
   ├── Match target_locations against job.location_city
   ├── Match target_job_types against job.job_type
   ├── Check min_salary against job.salary_min
   ├── Calculate score (0-100)
   └── Filter: score >= min_match_score setting
   ↓
6. IF (matched_jobs.length > 0)
   ├── TRUE →
   │   ↓
   │   7. Split In Batches (Each matched job)
   │   ↓
   │   8. Supabase (Check if already applied)
   │   ├── SELECT FROM applications
   │   └── WHERE candidate_id = user_id AND job_id = job_id
   │   ↓
   │   9. IF (not already applied AND under monthly limit)
   │   ├── TRUE →
   │   │   ↓
   │   │   10. Supabase (INSERT into applications)
   │   │   ├── candidate_id: user_id
   │   │   ├── job_id: job_id
   │   │   ├── status: 'pending'
   │   │   ├── source: 'auto_apply'
   │   │   └── cover_letter: template from settings
   │   │   ↓
   │   │   11. Supabase (INSERT into auto_apply_log)
   │   │   ├── status: 'applied'
   │   │   └── match_score: calculated score
   │   │   ↓
   │   │   12. Supabase (INCREMENT applications_this_month)
   │   │   └── UPDATE auto_apply_settings
   │   │
   │   └── FALSE →
   │       13. Supabase (Log as 'skipped' or 'duplicate')
   │   ↓
   │   14. SMTP / Email Summary
   │   ├── Subject: "⚡ تم التقديم تلقائياً على {{ count }} وظائف"
   │   └── Body: Summary of applied jobs
   │
   └── FALSE →
       15. No Operation (skip)
   ↓
16. Supabase (Update last_run_at on settings)
```

## Match Score Logic (Node 5)

```javascript
const user = $input.first().json;
const jobs = $('Supabase - Get Jobs').all();

// Get existing applications to skip duplicates
const existingAppJobIds = $('Supabase - Existing Apps').all()
  .map(a => a.json.job_id);

const matchedJobs = [];

for (const jobItem of jobs) {
  const j = jobItem.json;
  
  // Skip if already applied
  if (existingAppJobIds.includes(j.id)) continue;
  
  // Skip excluded companies
  if ((user.exclude_companies || []).some(ex => 
    (j.company_name || '').toLowerCase().includes(ex.toLowerCase())
  )) continue;
  
  let score = 0;
  let maxScore = 0;
  
  // Role match (weight: 30)
  maxScore += 30;
  const titleLower = j.title.toLowerCase();
  const roleMatch = (user.target_roles || []).some(r => 
    titleLower.includes(r.toLowerCase()) || r.toLowerCase().includes(titleLower)
  );
  if (roleMatch) score += 30;
  
  // Skills match (weight: 30)
  const requiredSkills = j.skills_required || [];
  if (requiredSkills.length > 0) {
    maxScore += 30;
    const matched = (user.target_skills || []).filter(us =>
      requiredSkills.some(rs => 
        rs.toLowerCase().includes(us.toLowerCase()) || 
        us.toLowerCase().includes(rs.toLowerCase())
      )
    );
    score += Math.round((matched.length / requiredSkills.length) * 30);
  }
  
  // Location match (weight: 20)
  if ((user.target_locations || []).length > 0) {
    maxScore += 20;
    if (user.target_locations.includes(j.location_city)) score += 20;
  }
  
  // Job type match (weight: 10)
  if ((user.target_job_types || []).length > 0) {
    maxScore += 10;
    if (user.target_job_types.includes(j.job_type)) score += 10;
  }
  
  // Salary check (weight: 10)
  if (user.min_salary) {
    maxScore += 10;
    if ((j.salary_min || 0) >= user.min_salary) score += 10;
    else if ((j.salary_max || 0) < user.min_salary) continue; // Hard filter
  }
  
  const finalScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  
  if (finalScore >= (user.min_match_score || 60)) {
    matchedJobs.push({
      json: {
        job_id: j.id,
        job_title: j.title,
        company_name: j.company_name || 'N/A',
        location: j.location_city,
        match_score: finalScore,
        user_id: user.user_id,
        cover_letter: user.cover_letter_template || null,
      }
    });
  }
}

// Respect monthly limit
const remaining = (user.max_applications_per_month || 50) - (user.applications_this_month || 0);
return matchedJobs.slice(0, remaining);
```

## Email Template (Node 14)

```html
<div dir="rtl" style="font-family: Arial; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #c5a54e;">⚡ التقديم التلقائي</h2>
  <p>مرحباً {{ user_name }}، تم التقديم تلقائياً على {{ count }} وظائف جديدة:</p>
  
  {{#each applied_jobs}}
  <div style="border: 1px solid #333; border-radius: 12px; padding: 12px; margin-bottom: 8px;">
    <strong style="color: #c5a54e;">{{ this.job_title }}</strong>
    <p style="color: #888; margin: 4px 0;">{{ this.company_name }} • {{ this.location }}</p>
    <span style="background: #c5a54e22; color: #c5a54e; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
      توافق {{ this.match_score }}%
    </span>
  </div>
  {{/each}}
  
  <p style="color: #666; margin-top: 16px;">
    الرصيد المتبقي هذا الشهر: {{ remaining }} طلب
  </p>
</div>
```

## Monthly Reset

Add a separate workflow or n8n Cron node that resets `applications_this_month` to 0 on the 1st of each month:

```sql
UPDATE auto_apply_settings 
SET applications_this_month = 0, updated_at = NOW()
WHERE is_active = true;
```

Schedule: `0 0 1 * *` (midnight on the 1st)

## n8n Setup Steps

1. Create workflow `gn-auto-apply`
2. **Schedule Trigger** → Cron: `0 */6 * * *` (every 6 hours)
3. **Supabase** → SELECT from `auto_apply_settings` WHERE active, under limit
4. **Split In Batches** → Each user
5. **Supabase** → SELECT new `jobs` (last 24h, active)
6. **Supabase** → SELECT existing `applications` for this user (to skip duplicates)
7. **Code** → Match score logic (copy from above)
8. **IF** → matched jobs > 0
9. **Split In Batches** → Each matched job
10. **Supabase** → INSERT application
11. **Supabase** → INSERT auto_apply_log
12. **Supabase** → INCREMENT applications_this_month
13. **SMTP** → Summary email
14. **Supabase** → UPDATE last_run_at
15. Activate

## Create Monthly Reset Workflow

1. Create workflow `gn-auto-apply-reset`
2. **Schedule Trigger** → `0 0 1 * *`
3. **Supabase** → UPDATE `auto_apply_settings` SET `applications_this_month = 0`
4. Activate
