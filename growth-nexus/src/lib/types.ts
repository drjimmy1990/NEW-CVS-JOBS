// Database Types - Generated from schema.sql

export type UserRole = 'candidate' | 'employer' | 'admin'
export type JobType = 'full_time' | 'part_time' | 'contract' | 'remote' | 'internship'
export type JobStatus = 'draft' | 'active' | 'expired' | 'closed' | 'archived'
export type AppStatus = 'applied' | 'reviewing' | 'interview' | 'shortlisted' | 'rejected' | 'hired'

export interface Profile {
    id: string
    email: string
    role: UserRole
    full_name: string | null
    avatar_url: string | null
    phone: string | null
    credits_balance: number
    created_at: string
    updated_at: string
}

export interface Company {
    id: string
    owner_id: string
    name: string
    slug: string
    logo_url: string | null
    website: string | null
    description: string | null
    industry: string | null
    size_range: string | null
    is_verified: boolean
    subscription_tier: string
    job_credits: number
    cv_view_credits: number
    created_at: string
    updated_at: string
}

export interface Candidate {
    id: string
    headline: string | null
    cv_url: string | null
    resume_parsed_data: Record<string, unknown> | null
    skills: string[] | null
    years_experience: number
    city: string | null
    country: string
    linkedin_url: string | null
    portfolio_url: string | null
    is_public: boolean
    updated_at: string
}

export interface Job {
    id: string
    company_id: string
    title: string
    slug: string
    description: string
    job_type: JobType
    location_city: string
    location_country: string
    salary_min: number | null
    salary_max: number | null
    currency: string
    skills_required: string[] | null
    is_confidential: boolean
    is_featured: boolean
    views_count: number
    applicants_count: number
    status: JobStatus
    search_vector: string | null
    expires_at: string | null
    created_at: string
    updated_at: string
}

export interface PublicJob {
    id: string
    title: string
    slug: string
    job_type: JobType
    location_city: string
    salary_min: number | null
    salary_max: number | null
    skills_required: string[] | null
    is_featured: boolean
    created_at: string
    expires_at: string | null
    company_name: string
    company_logo: string | null
    company_slug: string | null
}

export interface Application {
    id: string
    job_id: string
    candidate_id: string
    cover_letter: string | null
    status: AppStatus
    resume_snapshot_url: string | null
    source: string
    created_at: string
    updated_at: string
}

export interface LandingPage {
    id: string
    company_id: string
    title: string
    token: string
    job_description: string | null
    is_active: boolean
    views_count: number
    created_at: string
}

export interface Transaction {
    id: string
    user_id: string
    amount: number
    currency: string
    status: string
    type: string
    package_id: string | null
    provider_id: string
    provider_tx_ref: string | null
    created_at: string
}

export interface SystemConfig {
    key: string
    value: string
    description: string | null
    group_name: string | null
    is_secret: boolean
}
