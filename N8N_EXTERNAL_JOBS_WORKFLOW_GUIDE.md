# 🌐 External Jobs Scraper — n8n Workflow Guide

> **Last Updated:** 12 May 2026
> **Purpose:** Scrape job listings from LinkedIn, Bayt, Indeed, etc. and import them into GrowthNexus via the `/api/external-jobs` webhook
> **Status:** 🔧 API Ready — n8n workflow needs to be built

---

## Architecture Overview

```
┌─────────────┐    ┌──────────────┐    ┌──────────────────────┐    ┌───────────────┐
│  LinkedIn   │───▶│  n8n Scraper  │───▶│  POST /api/external  │───▶│  external_jobs │
│  Bayt.com   │    │  Workflow     │    │  -jobs               │    │  (Supabase)    │
│  Indeed     │    │              │    │                      │    │               │
│  GulfTalent │    │  Schedule:    │    │  Auth: x-webhook-    │    │  RLS: public/  │
│             │    │  Every 6hrs   │    │  secret header       │    │  registered/   │
└─────────────┘    └──────────────┘    └──────────────────────┘    │  premium       │
                                                                    └───────────────┘
                                                                           │
                                              ┌────────────────────────────┤
                                              ▼                            ▼
                                     ┌─────────────┐            ┌──────────────────┐
                                     │  /jobs page  │            │  /admin/external  │
                                     │  (merged     │            │  -jobs            │
                                     │   feed)      │            │  (management)     │
                                     └─────────────┘            └──────────────────┘
```

---

## API Contract

### Endpoint
```
POST https://YOUR_DOMAIN/api/external-jobs
```

### Authentication
Send the secret in **either** of these ways:
- **Header:** `x-webhook-secret: YOUR_N8N_WEBHOOK_SECRET`
- **Body field:** `"secret": "YOUR_N8N_WEBHOOK_SECRET"`

### Request Body
```json
{
  "secret": "YOUR_N8N_WEBHOOK_SECRET",
  "jobs": [
    {
      "external_id": "linkedin_12345",
      "source_platform": "linkedin",
      "source_url": "https://linkedin.com/jobs/view/12345",
      "title": "Senior React Developer",
      "company_name": "Tech Corp",
      "company_logo_url": "https://logo.clearbit.com/techcorp.com",
      "description": "<p>We are looking for a senior React developer...</p>",
      "job_type": "full_time",
      "location_city": "Dubai",
      "location_country": "UAE",
      "salary_min": 15000,
      "salary_max": 25000,
      "currency": "AED",
      "skills_required": ["React", "TypeScript", "Node.js"],
      "experience_level": "Senior",
      "access_level": "public",
      "posted_at": "2026-05-12T10:00:00Z"
    }
  ]
}
```

### Field Reference

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `external_id` | ⚡ Recommended | `null` | Unique ID from source platform (used for upsert dedup) |
| `source_platform` | ✅ Yes | — | `linkedin` / `bayt` / `gulftalen` / `indeed` / `glassdoor` |
| `source_url` | ✅ Yes | — | Direct link to the job on the source website |
| `title` | ✅ Yes | — | Job title |
| `company_name` | No | `null` | Company name |
| `company_logo_url` | No | `null` | URL to company logo (try Clearbit: `logo.clearbit.com/domain.com`) |
| `description` | No | `null` | HTML description (supports `<p>`, `<ul>`, `<strong>`, etc.) |
| `job_type` | No | `full_time` | `full_time` / `part_time` / `contract` / `remote` / `internship` |
| `location_city` | No | `null` | City name (e.g., "Dubai", "Abu Dhabi", "Sharjah") |
| `location_country` | No | `UAE` | Country code |
| `salary_min` | No | `null` | Minimum salary (number) |
| `salary_max` | No | `null` | Maximum salary (number) |
| `currency` | No | `AED` | Currency code |
| `skills_required` | No | `[]` | Array of skill strings |
| `experience_level` | No | `null` | e.g., "Junior", "Mid", "Senior", "Lead" |
| `access_level` | No | `public` | `public` / `registered` / `premium` |
| `posted_at` | No | `now()` | Original posting date from source |
| `expires_at` | No | `now + 30 days` | When to auto-hide the job |

### Response (Success)
```json
{
  "success": true,
  "imported": 3,
  "updated": 1,
  "errors": [],
  "total": 4
}
```

### Upsert Logic
- If `external_id` is provided and a record with the same `source_platform` + `external_id` exists → **UPDATE** (re-scrape)
- Otherwise → **INSERT** new record
- Slug is auto-generated: `{platform}-{title}-{id_suffix}`

---

## n8n Workflow — Step-by-Step Build Guide

### Node 1: Schedule Trigger
- **Type:** Schedule
- **Settings:** Every 6 hours (or your preferred frequency)
- **Why:** Regular scraping to keep listings fresh

### Node 2: HTTP Request — Scrape Source
- **Type:** HTTP Request
- **URL:** Depends on your scraping approach:
  - **Option A (API):** LinkedIn API, Indeed API, etc. (requires API keys)
  - **Option B (RSS):** Many job boards have RSS feeds
  - **Option C (Web Scraper):** Use n8n's HTML Extract node with a proxy
  - **Option D (Apify):** Use Apify actors for LinkedIn/Indeed scraping
- **Method:** GET
- **Headers:** Any required API auth

### Node 3: Code — Transform Data
- **Type:** Code (JavaScript)
- **Purpose:** Map scraped data into the GrowthNexus API format

```javascript
// Example: Transform LinkedIn-style scraped data
const scrapedJobs = $input.all();

const transformedJobs = scrapedJobs.map(item => {
  const job = item.json;
  return {
    json: {
      external_id: `linkedin_${job.id || job.jobId}`,
      source_platform: "linkedin",
      source_url: job.url || job.link,
      title: job.title || job.jobTitle,
      company_name: job.company || job.companyName,
      company_logo_url: job.companyLogo || null,
      description: job.description || job.jobDescription || "",
      job_type: mapJobType(job.employmentType),
      location_city: extractCity(job.location),
      location_country: "UAE",
      salary_min: job.salaryMin || null,
      salary_max: job.salaryMax || null,
      currency: "AED",
      skills_required: job.skills || [],
      experience_level: job.seniorityLevel || null,
      access_level: "public",
      posted_at: job.postedAt || job.datePosted || new Date().toISOString()
    }
  };
});

function mapJobType(type) {
  const map = {
    'Full-time': 'full_time',
    'Part-time': 'part_time',
    'Contract': 'contract',
    'Remote': 'remote',
    'Internship': 'internship'
  };
  return map[type] || 'full_time';
}

function extractCity(location) {
  if (!location) return null;
  const uaeCities = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];
  for (const city of uaeCities) {
    if (location.includes(city)) return city;
  }
  return location.split(',')[0].trim();
}

return transformedJobs;
```

### Node 4: Code — Batch into Array
- **Type:** Code (JavaScript)
- **Purpose:** Collect all jobs into a single array for the API

```javascript
const allJobs = $input.all().map(item => item.json);

return [{
  json: {
    secret: "YOUR_N8N_WEBHOOK_SECRET",
    jobs: allJobs
  }
}];
```

### Node 5: HTTP Request — Send to GrowthNexus
- **Type:** HTTP Request
- **Method:** POST
- **URL:** `https://YOUR_DOMAIN/api/external-jobs`
- **Headers:**
  - `Content-Type`: `application/json`
  - `x-webhook-secret`: `YOUR_N8N_WEBHOOK_SECRET`
- **Body:** `{{ $json }}` (the batched object from Node 4)

### Node 6 (Optional): IF — Check Errors
- **Type:** IF
- **Condition:** `{{ $json.errors.length > 0 }}`
- **True:** Send Telegram/Email notification about import errors
- **False:** Log success

---

## Access Level Strategy

| Level | Who Sees It | Apply Button | Use Case |
|-------|------------|--------------|----------|
| `public` | Everyone (even anonymous) | ✅ Direct redirect to source | Most jobs — drives traffic |
| `registered` | Logged-in users only | ✅ Direct redirect | Encourages registration |
| `premium` | Everyone (visible) | 🔒 Locked — "اشترك للتقديم" | FOMO — drives subscriptions |

**Recommendation:** Import all jobs as `public` initially. Use the admin panel to promote high-value jobs to `premium` to drive conversions.

---

## Admin Management

### URL: `/admin/external-jobs`

**Features:**
- Filter by platform, access level, active status
- Change access level (public → registered → premium) per job
- Toggle featured/active status
- Delete expired or irrelevant jobs
- View click count and engagement stats

---

## How External Jobs Appear

### On `/jobs` Page (Main Feed)
- External jobs are **interleaved** every 5th position among internal platform jobs
- Each has a **blue badge** with the source platform name (e.g., "LinkedIn", "Bayt.com")
- Sidebar filter allows filtering by source: All / Platform Only / LinkedIn / Bayt / etc.

### Apply Flow
1. User clicks "تقدم على الموقع" (Apply on site) button
2. Click is tracked (`clicks_count` incremented)
3. User is redirected to `source_url` in a new tab
4. Premium-locked jobs show "اشترك للتقديم" → redirects to `/pricing`

---

## Testing the API

### cURL Test (Insert)
```bash
curl -X POST https://YOUR_DOMAIN/api/external-jobs \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_N8N_WEBHOOK_SECRET" \
  -d '{
    "jobs": [{
      "external_id": "test_001",
      "source_platform": "linkedin",
      "source_url": "https://linkedin.com/jobs/view/test",
      "title": "مطور React أول",
      "company_name": "شركة تقنية",
      "location_city": "Dubai",
      "job_type": "full_time",
      "skills_required": ["React", "TypeScript", "Node.js"],
      "salary_min": 15000,
      "salary_max": 25000,
      "access_level": "public"
    }]
  }'
```

### Verify
1. Check `/jobs` page — test job should appear with blue LinkedIn badge
2. Check `/admin/external-jobs` — test job should be in the management panel
3. Click "Apply" — should open LinkedIn URL in new tab

### cURL Test (Update — Same external_id)
```bash
curl -X POST https://YOUR_DOMAIN/api/external-jobs \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_N8N_WEBHOOK_SECRET" \
  -d '{
    "jobs": [{
      "external_id": "test_001",
      "source_platform": "linkedin",
      "source_url": "https://linkedin.com/jobs/view/test",
      "title": "مطور React أول — محدث",
      "company_name": "شركة تقنية",
      "location_city": "Abu Dhabi"
    }]
  }'
```
→ Should return `"updated": 1` (no duplicate created)

---

## Scraping Sources Cheat Sheet

| Source | Method | Notes |
|--------|--------|-------|
| **LinkedIn** | Apify actor `apify/linkedin-jobs-scraper` | Best for UAE market, needs proxy |
| **Bayt.com** | RSS feed or HTML scrape | `bayt.com/en/uae/jobs/?page=1` |
| **Indeed** | Indeed API or Apify | Filter by location=UAE |
| **GulfTalent** | HTML scrape | `gulftalen.com/jobs` |
| **Glassdoor** | Glassdoor API (limited) | Requires partner key |

---

## Environment Variables Required

```env
# Already exists — used for webhook auth
N8N_WEBHOOK_SECRET=your_strong_secret_here
```

> ⚠️ **No new env vars needed.** The external jobs API reuses the existing `N8N_WEBHOOK_SECRET` for authentication.

---

## Database Table

**Table:** `external_jobs` (in `full.sql`)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK, auto-generated |
| `external_id` | text | For upsert dedup |
| `source_platform` | text | linkedin / bayt / indeed / etc. |
| `source_url` | text | Link to original job |
| `title` | text | Job title |
| `company_name` | text | Company name |
| `description` | text | HTML content |
| `access_level` | text | public / registered / premium |
| `is_active` | boolean | Toggle visibility |
| `is_featured` | boolean | Pin to top of feed |
| `views_count` | int | Detail page views |
| `clicks_count` | int | Apply redirects |
| `slug` | text | URL-friendly slug (auto-generated) |
| `expires_at` | timestamptz | Auto-hide after this date (default: 30 days) |
| `UNIQUE(source_platform, external_id)` | constraint | Prevents duplicates |

### RLS Policies
- **Anonymous:** See `public` + active + not expired
- **Authenticated:** See `public` + `registered` + `premium` + active + not expired
- **Admin:** Full CRUD access
