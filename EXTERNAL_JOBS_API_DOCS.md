# 📥 External Jobs Import API — Documentation

> **Endpoint:** `POST /api/external-jobs`  
> **Live URL:** `https://jobs-test.uae4jobs.ae/api/external-jobs`  
> **Auth:** `x-webhook-secret` header OR `secret` field in body  

---

## 🔐 Authentication

Every request **must** include the webhook secret. Two ways to pass it:

| Method | How |
|--------|-----|
| **Header** | `x-webhook-secret: your-shared-secret` |
| **Body field** | `"secret": "your-shared-secret"` |

> The secret must match `N8N_WEBHOOK_SECRET` in your server's `.env.local`

---

## 📋 All Available Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `external_id` | `string` | ✅ Recommended | `null` | Unique ID from the source (URL, LinkedIn ID, etc.). Used for **deduplication** |
| `source_platform` | `string` | ✅ **Required** | — | Source name: `weworkremotely`, `remotive`, `jobicy`, `indeed`, etc. |
| `source_url` | `string` | ✅ **Required** | — | Original job link (the "Apply" button redirects here) |
| `title` | `string` | ✅ **Required** | — | Job title |
| `company_name` | `string` | Optional | `null` | Company name |
| `company_logo_url` | `string` | Optional | `null` | Company logo image URL |
| `description` | `string` | Optional | `null` | Job description (HTML or plain text) |
| `job_type` | `string` | Optional | `full_time` | One of: `full_time`, `part_time`, `contract`, `remote`, `internship` |
| `location_city` | `string` | Optional | `null` | City name (e.g., `Dubai`, `Remote`, `Abu Dhabi`) |
| `location_country` | `string` | Optional | `UAE` | Country name or code |
| `salary_min` | `integer` | Optional | `null` | Minimum salary |
| `salary_max` | `integer` | Optional | `null` | Maximum salary |
| `currency` | `string` | Optional | `AED` | Currency code (`AED`, `USD`, `EUR`, etc.) |
| `skills_required` | `string[]` | Optional | `[]` | Array of skill tags: `["React", "Node.js", "AWS"]` |
| `experience_level` | `string` | Optional | `null` | e.g., `junior`, `mid`, `senior`, `lead` |
| `access_level` | `string` | Optional | `public` | `public` = everyone, `registered` = logged-in users, `premium` = paid users |
| `posted_at` | `ISO date` | Optional | `now()` | Original posting date from source |
| `expires_at` | `ISO date` | Optional | `now + 30 days` | When the job expires and hides automatically |

---

## 🔄 Deduplication Logic

The API automatically handles duplicates:
- If a job with the same `source_platform` + `external_id` already exists → **updates** it
- If it doesn't exist → **inserts** a new one
- You can safely run the same import multiple times without creating duplicates

---

## ✅ Success Response

```json
{
  "success": true,
  "imported": 3,
  "updated": 2,
  "errors": [],
  "total": 5
}
```

---

## ❌ Error Responses

| Status | Body | Reason |
|--------|------|--------|
| `401` | `{"error": "Unauthorized"}` | Wrong or missing secret |
| `400` | `{"error": "No jobs provided"}` | Empty or missing `jobs` array |

---

## 📌 cURL — Single Job (Minimal)

```bash
curl -X POST https://jobs-test.uae4jobs.ae/api/external-jobs \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-shared-secret" \
  -d '{
    "secret": "your-shared-secret",
    "jobs": [
      {
        "external_id": "job-123",
        "source_platform": "remotive",
        "source_url": "https://remotive.com/remote-jobs/software-dev/senior-react-dev-123",
        "title": "Senior React Developer",
        "company_name": "TechCorp"
      }
    ]
  }'
```

---

## 📌 cURL — Single Job (ALL Fields)

```bash
curl -X POST https://jobs-test.uae4jobs.ae/api/external-jobs \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-shared-secret" \
  -d '{
    "secret": "your-shared-secret",
    "jobs": [
      {
        "external_id": "remotive-456",
        "source_platform": "remotive",
        "source_url": "https://remotive.com/remote-jobs/software-dev/fullstack-engineer-456",
        "title": "Fullstack Engineer",
        "company_name": "CloudBase Inc.",
        "company_logo_url": "https://remotive.com/logos/cloudbase.png",
        "description": "<h2>About the Role</h2><p>We are looking for a fullstack engineer to join our team...</p>",
        "job_type": "remote",
        "location_city": "Remote",
        "location_country": "Global",
        "salary_min": 8000,
        "salary_max": 15000,
        "currency": "USD",
        "skills_required": ["React", "Node.js", "PostgreSQL", "AWS"],
        "experience_level": "senior",
        "access_level": "public",
        "posted_at": "2026-05-20T10:00:00Z",
        "expires_at": "2026-06-20T10:00:00Z"
      }
    ]
  }'
```

---

## 📌 cURL — Multiple Jobs (Batch Import)

```bash
curl -X POST https://jobs-test.uae4jobs.ae/api/external-jobs \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-shared-secret" \
  -d '{
    "secret": "your-shared-secret",
    "jobs": [
      {
        "external_id": "wwr-product-manager-001",
        "source_platform": "weworkremotely",
        "source_url": "https://weworkremotely.com/remote-jobs/product-manager-001",
        "title": "Product Manager",
        "company_name": "Granicus",
        "job_type": "remote",
        "location_city": "Remote",
        "location_country": "Global"
      },
      {
        "external_id": "wwr-backend-dev-002",
        "source_platform": "weworkremotely",
        "source_url": "https://weworkremotely.com/remote-jobs/backend-dev-002",
        "title": "Backend Developer",
        "company_name": "Shopify",
        "description": "Build scalable backend services using Go and Kubernetes.",
        "job_type": "full_time",
        "location_city": "Ottawa",
        "location_country": "Canada",
        "salary_min": 120000,
        "salary_max": 180000,
        "currency": "CAD",
        "skills_required": ["Go", "Kubernetes", "PostgreSQL"],
        "experience_level": "senior"
      },
      {
        "external_id": "wwr-designer-003",
        "source_platform": "weworkremotely",
        "source_url": "https://weworkremotely.com/remote-jobs/designer-003",
        "title": "UI/UX Designer",
        "company_name": "Figma",
        "job_type": "remote",
        "location_city": "Remote",
        "location_country": "Global",
        "skills_required": ["Figma", "Design Systems", "User Research"],
        "experience_level": "mid"
      }
    ]
  }'
```

---

## 📌 cURL — Import from JSON File

Save your jobs in a file (e.g., `jobs_to_import.json`):

```json
{
  "secret": "your-shared-secret",
  "jobs": [
    {
      "external_id": "job-1",
      "source_platform": "jobicy",
      "source_url": "https://jobicy.com/jobs/1",
      "title": "DevOps Engineer",
      "company_name": "Amazon"
    }
  ]
}
```

Then run:

```bash
curl -X POST https://jobs-test.uae4jobs.ae/api/external-jobs \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-shared-secret" \
  -d @jobs_to_import.json
```

---

## 📌 cURL — PowerShell (Windows)

```powershell
$body = @{
    secret = "your-shared-secret"
    jobs = @(
        @{
            external_id = "ps-test-001"
            source_platform = "manual"
            source_url = "https://example.com/jobs/1"
            title = "Marketing Manager"
            company_name = "GrowthNexus"
            job_type = "full_time"
            location_city = "Dubai"
            location_country = "UAE"
        }
    )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "https://jobs-test.uae4jobs.ae/api/external-jobs" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ "x-webhook-secret" = "your-shared-secret" } `
    -Body $body
```

---

## 🌐 Available RSS/API Sources

Use these URLs in n8n or curl to scrape jobs:

| Source | Type | URL | `source_platform` value |
|--------|------|-----|-------------------------|
| WeWorkRemotely | RSS | `https://weworkremotely.com/remote-jobs.rss` | `weworkremotely` |
| Remotive | RSS | `https://remotive.com/feed` | `remotive` |
| Himalayas | RSS | `https://himalayas.app/jobs/rss` | `himalayas` |
| WorkAnywhere | RSS | `https://workanywhere.pro/rss.xml` | `workanywhere` |
| Jobicy | JSON API | `https://jobicy.com/api/v2/remote-jobs?count=50` | `jobicy` |
| Arbeitnow | JSON API | `https://arbeitnow.com/api/job-board-api` | `arbeitnow` |
| RemoteOK | JSON API | `https://remoteok.com/api` | `remoteok` |

---

## 🔧 `job_type` Values

| Value | Arabic Label | Description |
|-------|-------------|-------------|
| `full_time` | دوام كامل | Full-time position |
| `part_time` | دوام جزئي | Part-time position |
| `contract` | عقد | Contract/Freelance |
| `remote` | عن بُعد | Remote work |
| `internship` | تدريب | Internship |

---

## 🔧 `access_level` Values

| Value | Who can see | Description |
|-------|-------------|-------------|
| `public` | Everyone | Visible to all visitors |
| `registered` | Logged-in users | Must be signed in |
| `premium` | Paid subscribers | Requires active subscription |

---

## 💡 Tips

1. **Always include `external_id`** — without it, duplicates can't be detected
2. **Use the source URL as `external_id`** if the platform doesn't have unique IDs
3. **HTML in `description`** is supported and will render properly on the job page
4. **Batch size** — send up to ~50 jobs per request for best performance
5. **Schedule imports** — set up a cron in n8n to run daily/hourly for fresh jobs
6. **Slug is auto-generated** — you never need to provide it; the API creates URL-friendly slugs automatically
