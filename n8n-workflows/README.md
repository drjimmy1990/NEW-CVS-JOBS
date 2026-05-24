# n8n Workflows — B2C Features

This folder contains implementation guides for the n8n workflows that power the B2C features.

## Overview

| # | Feature | Webhook/Trigger | Workflow Name | Type |
|---|---------|----------------|---------------|------|
| 1 | Rejection Analyzer | `gn-rejection-analyze` | `gn-rejection-analyze` | API Proxy |
| 2 | Career Path Generator | `gn-career-path` | `gn-career-path` | API Proxy |
| 3 | Skill Gap Analyzer | `gn-skill-gap` | `gn-skill-gap` | API Proxy |
| 4 | Smart Job Alerts | Schedule Trigger | `gn-job-alerts` | n8n-native |
| 5 | Auto Apply | Schedule Trigger | `gn-auto-apply` | n8n-native |

## Architecture

### TYPE A: API Proxy (Features 1-3)
```
Next.js API Route → POST to n8n Webhook → AI Node → Return JSON
```

### TYPE B: n8n-native (Features 4-5)
```
Schedule Trigger → Supabase Query → Matching Logic → Action → Email → Log
```
