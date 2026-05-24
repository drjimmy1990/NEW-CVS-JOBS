# n8n CV Parser Update Guide — Auto-Fill Candidate Profile

## Current State

We have an n8n workflow called **gn-cv-parser** that works like this:

```
User uploads CV (PDF)
     ↓
Frontend: triggerAIParsing() → POST → n8n webhook
     ↓
n8n: Downloads PDF → Extracts text → Sends to Gemini AI
     ↓
Gemini AI returns JSON with candidate data
     ↓
n8n updates `candidates` table in Supabase
```

### Where the CV Parser is Called

| Location | File | Triggers AI Parsing? |
|----------|------|---------------------|
| Direct CV upload | `candidate/cv/page.tsx` line 142 | ✅ Yes — `triggerAIParsing()` |
| Link CV from session | `api/cv/link-profile/route.ts` line 103 | ✅ Yes — sends webhook + extracts `parsed_data` fields |
| Apply to a job | `components/candidate/ApplyModal.tsx` | ❌ No — only takes a snapshot |

### What It Currently Extracts (OLD — Only 4 Fields)

```json
{
  "skills": ["React", "Node.js"],
  "experience_years": 5,
  "education": ["BSc - University X"],
  "summary": "Professional summary..."
}
```

### What It Saves to Supabase (OLD — Only 3 Columns)

| Column | Value |
|--------|-------|
| `skills` | `parsed_data.skills` |
| `resume_parsed_data` | Full JSON object |
| `years_experience` | `parsed_data.experience_years` |

**Problem:** The profile page (الخبرة، التعليم، المهارات، اللغات) stays EMPTY because the AI doesn't extract structured data for those sections.

---

## Required: n8n Updates (3 Steps)

### Step 1: Run the SQL Migration

Open **Supabase SQL Editor** → Create **New Query** → Paste and run:

```sql
-- Add new columns to candidates table (if not exist)
ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS education_level text,
ADD COLUMN IF NOT EXISTS specialization text,
ADD COLUMN IF NOT EXISTS last_job_title text;

-- Add new columns to applications table (if not exist)
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS match_score int,
ADD COLUMN IF NOT EXISTS ai_summary jsonb;
```

✅ **Confirm** the query ran without errors.

---

### Step 2: Update the AI Prompt in n8n

1. Open **n8n** → Workflow **GrowthNexus CV Parser**
2. Click on Node: **"Basic LLM Chain"**
3. Go to **Messages** → **System Message**
4. **Replace** the entire content with:

```
You are an expert HR professional and CV analyst.
Your task is to read the extracted text from the attached CV and extract the specified data accurately.

You MUST return the result as valid JSON only, without any additional text, explanations, or markdown code blocks.
The JSON must contain ONLY the following English field names (but content values should be in Arabic):

{
  "skills": ["Skill 1", "Skill 2"],
  "experience_years": 5,
  "education": ["BSc in CS - Cairo University"],
  "summary": "Professional 2-line summary in Arabic",
  "education_level": "بكالوريوس",
  "specialization": "هندسة البرمجيات",
  "last_job_title": "مطور واجهات أمامي أول",
  "nationality": "مصري",
  "city": "دبي",
  "experience_list": [
    {
      "id": 1,
      "title": "مطور واجهات أمامي أول",
      "company": "شركة ABC",
      "start": "2022",
      "end": "حتى الآن",
      "description": ""
    },
    {
      "id": 2,
      "title": "مطور ويب",
      "company": "شركة XYZ",
      "start": "2019",
      "end": "2022",
      "description": ""
    }
  ],
  "education_list": [
    {
      "id": 1,
      "degree": "bachelors",
      "field": "هندسة البرمجيات",
      "institution": "جامعة القاهرة",
      "year": "2019"
    }
  ],
  "languages": [
    { "name": "العربية", "level": "native" },
    { "name": "English", "level": "advanced" }
  ]
}

Field descriptions:
- skills: Array of top technical and soft skills
- experience_years: Total years of experience as integer. If not found, use 0
- education: Array of educational qualifications as simple strings
- summary: Professional 2-line summary of the candidate in Arabic
- education_level: Highest education level (ثانوية، دبلوم، بكالوريوس، ماجستير، دكتوراه). If not mentioned, use ""
- specialization: Field of study. If not mentioned, use ""
- last_job_title: Most recent job title. If not mentioned, use ""
- nationality: Nationality if mentioned. If not mentioned, use ""
- city: Current city if mentioned. If not mentioned, use ""
- experience_list: Array of work experiences, each with:
  - id: sequential number starting from 1
  - title: job title (in Arabic)
  - company: company name
  - start: start year (e.g. "2020")
  - end: end year or "حتى الآن" if current
  - description: brief description (can be empty "")
- education_list: Array of educational records, each with:
  - id: sequential number starting from 1
  - degree: one of "high_school", "diploma", "bachelors", "masters", "phd"
  - field: field of study (in Arabic)
  - institution: university/school name (in Arabic)
  - year: graduation year
- languages: Array of languages, each with:
  - name: language name (in Arabic)
  - level: one of "beginner", "intermediate", "advanced", "native"

If a section has no data in the CV, return an empty array [].
Make 100% sure the output is valid JSON only so the system can parse it programmatically.
```

---

### Step 3: Add New Fields to the Supabase "Update a row" Node

1. In the same Workflow, click on Node: **"Update a row"**
2. In the **Fields** section, click **Add Field** for each new field:

| # | Field ID | Field Value |
|---|----------|-------------|
| 1 | `skills` | `{{ $json.parsed_data.skills }}` *(existing)* |
| 2 | `resume_parsed_data` | `{{ $json.parsed_data }}` *(existing)* |
| 3 | `years_experience` | `{{ $json.parsed_data.experience_years }}` *(existing)* |
| **4** | **`education_level`** | **`{{ $json.parsed_data.education_level }}`** |
| **5** | **`specialization`** | **`{{ $json.parsed_data.specialization }}`** |
| **6** | **`last_job_title`** | **`{{ $json.parsed_data.last_job_title }}`** |
| **7** | **`nationality`** | **`{{ $json.parsed_data.nationality }}`** |
| **8** | **`city`** | **`{{ $json.parsed_data.city }}`** |
| **9** | **`headline`** | **`{{ $json.parsed_data.summary }}`** |
| **10** | **`experience`** | **`{{ $json.parsed_data.experience_list }}`** |
| **11** | **`education`** | **`{{ $json.parsed_data.education_list }}`** |
| **12** | **`languages`** | **`{{ $json.parsed_data.languages }}`** |

3. Click **Save** then **Activate** the Workflow

---

## What Gets Auto-Filled in the Profile Page

After this update, when a candidate uploads or links a CV:

| Profile Section | Auto-Filled From | Profile Field |
|----------------|-----------------|---------------|
| **المعلومات الشخصية** | `summary` → `headline` | العنوان المهني |
| **المعلومات الشخصية** | `nationality` → `nationality` | الجنسية |
| **الخبرة العملية** | `experience_list` → `experience` (jsonb) | Job title, company, dates |
| **التعليم** | `education_list` → `education` (jsonb) | Degree, field, institution, year |
| **المهارات** | `skills` → `skills` | Skills badges |
| **اللغات** | `languages` → `languages` (jsonb) | Language name + level |

---

## Code Changes (Already Done)

### `api/cv/link-profile/route.ts`
Updated to extract ALL profile fields from `parsed_data`:

```diff
+ // Extract structured profile data (auto-fills profile page)
+ if (parsed.summary) updateData.headline = parsed.summary
+ if (Array.isArray(parsed.experience_list) && parsed.experience_list.length > 0) {
+     updateData.experience = parsed.experience_list
+ }
+ if (Array.isArray(parsed.education_list) && parsed.education_list.length > 0) {
+     updateData.education = parsed.education_list
+ }
+ if (Array.isArray(parsed.languages) && parsed.languages.length > 0) {
+     updateData.languages = parsed.languages
+ }
```

### Data Flow Summary

| Path | What It Auto-Fills |
|------|-------------------|
| **Direct CV upload** → n8n webhook | All 12 fields (skills, experience, education, languages, headline, etc.) |
| **Link CV from session** → `link-profile` API | All 12 fields from session parsed_data + re-triggers n8n |

---

## Testing

1. ✅ Run the **SQL migration** (Step 1)
2. ✅ Update n8n **AI Prompt** (Step 2)
3. ✅ Add n8n **Supabase fields** (Step 3)
4. ✅ Deploy code changes (git pull → build → restart)
5. ✅ Upload a new CV → Go to Profile page → Confirm all sections are filled

---

## Re-Parsing Old CVs

Candidates who uploaded CVs before this update won't have the new data.

**Option 1:** Create a new n8n workflow that:
1. Gets all candidates where `cv_url IS NOT NULL AND experience IS NULL`
2. Loops and sends each to `gn-cv-parser` webhook

**Option 2:** Ask candidates to re-upload or "Replace" their CV.
