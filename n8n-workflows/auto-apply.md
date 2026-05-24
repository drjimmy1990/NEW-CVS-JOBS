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
[Supabase: Get active auto-apply settings]
    ↓
[Split In Batches: 1 user per loop]
    ↓
[Supabase: Get user profile + CV data]
    ↓
[Supabase: Get active jobs (not already applied)]
    ↓
[Code: Score & filter jobs by user preferences]
    ↓
[Loop: For each matched job]
    ├── [IF: score >= min_match_score AND under monthly limit]
    │   ├── YES → [Supabase: INSERT into applications]
    │   │         [Supabase: INSERT into auto_apply_log (status=applied)]
    │   │         [Supabase: INCREMENT applications_this_month]
    │   └── NO  → [Supabase: INSERT into auto_apply_log (status=skipped)]
    ↓
[Supabase: UPDATE last_run_at on settings]
```

---

## Step-by-Step Setup

### Node 1: Schedule Trigger

| Setting | Value |
|---------|-------|
| Trigger | Cron |
| Expression | `0 */6 * * *` |
| Note | Every 6 hours (4x daily) |

### Node 2: Supabase — Get Active Settings

| Setting | Value |
|---------|-------|
| Operation | Get All |
| Table | `auto_apply_settings` |
| Filters | `is_active` = `true` |

### Node 3: Split In Batches

| Setting | Value |
|---------|-------|
| Batch Size | 1 |

### Node 4: Supabase — Get User Profile

| Setting | Value |
|---------|-------|
| Operation | Get |
| Table | `candidates` |
| Filter | `id` = `{{ $json.user_id }}` |

This gives us: `skills`, `years_experience`, `headline`, `education`, etc.

### Node 5: Supabase — Get Active Jobs

| Setting | Value |
|---------|-------|
| Operation | Get All |
| Table | `jobs` |
| Filters | `status` = `active` |

### Node 6: Code — Score & Filter Jobs

This is the main matching logic. Paste this JavaScript:

```javascript
const settings = $('Split In Batches').first().json;
const candidate = $('Supabase - Get Candidate').first().json;
const jobs = $('Supabase - Get Jobs').all();

// Get already applied job IDs (from auto_apply_log)
// If you added a node to fetch existing applications, use it here
const appliedJobIds = []; // TODO: populate from a Supabase query

const matchedJobs = [];
const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());

for (const jobItem of jobs) {
  const j = jobItem.json;

  // Skip already applied
  if (appliedJobIds.includes(j.id)) continue;

  // Skip excluded companies
  if (settings.exclude_companies && settings.exclude_companies.length > 0) {
    // Would need company name from join — skip for now if company_id matches
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

  // --- Also check candidate skills vs job skills ---
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
      continue; // Hard filter — skip non-matching locations
    }
  }

  // --- Job type match ---
  if (settings.target_job_types && settings.target_job_types.length > 0) {
    if (!settings.target_job_types.includes(j.job_type)) {
      continue; // Hard filter
    }
  }

  // --- Salary filter ---
  if (settings.min_salary && j.salary_max && j.salary_max < settings.min_salary) {
    continue; // Below minimum salary
  }

  // Calculate percentage
  const matchScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 50;

  // Only include if meets minimum score
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

// Sort by score, limit by monthly remaining
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
  }
}];
```

### Node 7: IF — Has Jobs to Apply

| Setting | Value |
|---------|-------|
| Condition | `{{ $json.to_apply.length }}` > `0` |

### Node 8: Code — Loop & Apply

For each matched job, insert an application:

```javascript
const data = $input.first().json;
const results = [];

for (const job of data.to_apply) {
  results.push({
    json: {
      user_id: data.user_id,
      settings_id: data.settings_id,
      job_id: job.job_id,
      title: job.title,
      match_score: job.match_score,
      action: 'apply',
    }
  });
}

return results;
```

### Node 9: Supabase — Insert Application

| Setting | Value |
|---------|-------|
| Operation | Insert |
| Table | `applications` |

Fields:
```json
{
  "candidate_id": "{{ $json.user_id }}",
  "job_id": "{{ $json.job_id }}",
  "status": "pending",
  "cover_letter": "تم التقديم تلقائياً عبر نظام التقديم الذكي",
  "source": "auto_apply"
}
```

### Node 10: Supabase — Log Application

| Setting | Value |
|---------|-------|
| Operation | Insert |
| Table | `auto_apply_log` |

Fields:
```json
{
  "user_id": "{{ $json.user_id }}",
  "job_id": "{{ $json.job_id }}",
  "match_score": "{{ $json.match_score }}",
  "status": "applied"
}
```

### Node 11: Supabase — Increment Monthly Counter

Use a **Code** node to build the update, then a Supabase Update node:

| Setting | Value |
|---------|-------|
| Operation | Update |
| Table | `auto_apply_settings` |
| Filter | `id` = settings_id |
| Set | `applications_this_month` = current + applied count |
| Set | `last_run_at` = now |

---

## Duplicate Prevention

Before inserting into `applications`, the workflow should check:
1. The user hasn't already applied to this job (manually or auto)
2. Add this check in Node 5 (jobs query) or Node 6 (Code):

```javascript
// Add a Supabase node before the Code node to fetch existing application job_ids
const existingApps = $('Get Existing Applications').all();
const appliedJobIds = existingApps.map(a => a.json.job_id);
// Then in the loop: if (appliedJobIds.includes(j.id)) continue;
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

1. Build the full workflow
2. Save auto-apply settings from the dashboard (activate + add roles/skills)
3. Click **"Execute Workflow"** manually
4. Check each node's output
5. Verify: application created in `applications` table + logged in `auto_apply_log`

---

## n8n Setup Summary

| # | Node | Type |
|---|------|------|
| 1 | Schedule Trigger | Cron `0 */6 * * *` (every 6h) |
| 2 | Supabase | SELECT `auto_apply_settings` WHERE active |
| 3 | Split In Batches | Batch size 1 |
| 4 | Supabase | SELECT `candidates` for user profile |
| 5 | Supabase | SELECT `jobs` WHERE active |
| 6 | Code | Score & filter jobs |
| 7 | IF | to_apply.length > 0 |
| 8 | Code | Loop matched jobs |
| 9 | Supabase | INSERT `applications` |
| 10 | Supabase | INSERT `auto_apply_log` |
| 11 | Supabase | UPDATE settings (counter + last_run) |
