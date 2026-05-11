// Database Types - Generated from schema.sql
// Last updated: Phase 5 SaaS Enhancements

export type UserRole = 'candidate' | 'employer' | 'admin'
export type JobType = 'full_time' | 'part_time' | 'contract' | 'remote' | 'internship'
export type JobStatus = 'draft' | 'active' | 'paused' | 'expired' | 'closed' | 'archived'
export type AppStatus = 'applied' | 'reviewing' | 'interview' | 'shortlisted' | 'offer' | 'rejected' | 'hired'
export type CandidateType = 'emirati' | 'resident'
export type NoticePeriod = '1_week' | '1_month' | '2_months' | '3_months' | 'immediate'
export type MilitaryServiceStatus = 'completed' | 'exempt' | 'in_progress'
export type CompanyType = 'government' | 'semi_government' | 'private' | 'recruitment_agency'

export type VerificationStatus =
    | 'pending_verification'
    | 'email_verified'
    | 'documents_submitted'
    | 'under_review'
    | 'verified'
    | 'trusted'
    | 'limited'
    | 'rejected'
    | 'suspended'

export type RiskLevel = 'unknown' | 'low' | 'medium' | 'high'

export type DocumentType = 'trade_license' | 'official_document' | 'proof_of_activity' | 'registration_certificate' | 'other'

export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed'

// UAE Cities constant for dropdowns
export const UAE_CITIES = [
    'أبوظبي',
    'دبي',
    'الشارقة',
    'عجمان',
    'أم القيوين',
    'رأس الخيمة',
    'الفجيرة',
    'العين',
    'كلباء',
    'حتا',
    'الظفرة',
    'الرويس',
] as const

// Nationality options for job posting
export const NATIONALITY_OPTIONS = [
    { value: 'all', label: 'جميع الجنسيات' },
    { value: 'uae', label: 'مواطنون إماراتيون' },
    { value: 'gcc', label: 'دول الخليج' },
    { value: 'arab', label: 'الجنسيات العربية' },
    { value: 'expat', label: 'الجنسيات الأجنبية' },
] as const

// Rejection reason options
export const REJECTION_REASONS = [
    { value: 'not_suitable', label: 'غير مناسب' },
    { value: 'low_experience', label: 'خبرة قليلة' },
    { value: 'salary_mismatch', label: 'راتب غير مناسب' },
    { value: 'overqualified', label: 'مؤهلات أعلى من المطلوب' },
    { value: 'location_mismatch', label: 'الموقع غير مناسب' },
    { value: 'skills_gap', label: 'فجوة في المهارات' },
    { value: 'other', label: 'سبب آخر' },
] as const

// Entity type options for employer registration
export const ENTITY_TYPES = [
    { value: 'government', label: 'جهة حكومية', icon: '🏛️' },
    { value: 'semi_government', label: 'جهة شبه حكومية', icon: '🏢' },
    { value: 'private', label: 'جهة خاصة', icon: '🏗️' },
    { value: 'recruitment_agency', label: 'شركة توظيف', icon: '🤝' },
] as const

// Industry sectors (21 sectors from spec)
export const INDUSTRY_SECTORS = [
    { value: 'banking', label: 'بنوك' },
    { value: 'healthcare', label: 'مستشفيات ورعاية صحية' },
    { value: 'real_estate', label: 'شركات عقارية' },
    { value: 'technology', label: 'شركات تقنية' },
    { value: 'insurance', label: 'شركات تأمين' },
    { value: 'investment', label: 'شركات استثمار' },
    { value: 'construction', label: 'شركات مقاولات' },
    { value: 'engineering', label: 'شركات هندسية' },
    { value: 'education', label: 'شركات تعليمية' },
    { value: 'universities', label: 'جامعات' },
    { value: 'schools', label: 'مدارس' },
    { value: 'hospitality', label: 'فنادق وضيافة' },
    { value: 'food_beverage', label: 'مطاعم وكافيهات' },
    { value: 'aviation_travel', label: 'طيران وسفر' },
    { value: 'logistics', label: 'لوجستيات وشحن' },
    { value: 'oil_gas_energy', label: 'نفط وغاز وطاقة' },
    { value: 'media_marketing', label: 'إعلام وتسويق' },
    { value: 'retail', label: 'تجارة وتجزئة' },
    { value: 'hr_consulting', label: 'موارد بشرية واستشارات' },
    { value: 'government_services', label: 'جهات حكومية وخدمات عامة' },
    { value: 'other', label: 'أخرى' },
] as const

// Sub-industry mapping
export const SUB_INDUSTRIES: Record<string, { value: string; label: string }[]> = {
    healthcare: [
        { value: 'hospital', label: 'مستشفى' },
        { value: 'clinic', label: 'عيادة' },
        { value: 'medical_center', label: 'مركز طبي' },
        { value: 'pharmacy', label: 'صيدلية' },
        { value: 'lab', label: 'مختبر' },
    ],
    education: [
        { value: 'school', label: 'مدرسة' },
        { value: 'university', label: 'جامعة' },
        { value: 'training_center', label: 'مركز تدريب' },
        { value: 'nursery', label: 'حضانة' },
    ],
    technology: [
        { value: 'software', label: 'برمجيات' },
        { value: 'it_services', label: 'خدمات تقنية' },
        { value: 'telecom', label: 'اتصالات' },
        { value: 'fintech', label: 'تكنولوجيا مالية' },
    ],
    hospitality: [
        { value: 'hotel', label: 'فندق' },
        { value: 'resort', label: 'منتجع' },
        { value: 'serviced_apartments', label: 'شقق فندقية' },
    ],
    real_estate: [
        { value: 'developer', label: 'مطور عقاري' },
        { value: 'brokerage', label: 'وساطة عقارية' },
        { value: 'property_management', label: 'إدارة عقارات' },
    ],
}

// Document requirements per entity type
export const DOCUMENT_REQUIREMENTS: Record<string, { type: DocumentType; label: string; required: boolean }[]> = {
    government: [
        { type: 'official_document', label: 'مستند رسمي (اختياري إذا الدومين واضح)', required: false },
    ],
    semi_government: [
        { type: 'official_document', label: 'مستند أو رخصة أو إثبات رسمي', required: true },
    ],
    private: [
        { type: 'trade_license', label: 'الرخصة التجارية', required: true },
    ],
    recruitment_agency: [
        { type: 'trade_license', label: 'الرخصة التجارية', required: true },
        { type: 'proof_of_activity', label: 'إثبات نشاط التوظيف', required: true },
    ],
}

// Verification status labels
export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, { label: string; color: string }> = {
    pending_verification: { label: 'بانتظار التحقق', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    email_verified: { label: 'تم تأكيد البريد', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    documents_submitted: { label: 'تم رفع المستندات', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    under_review: { label: 'قيد المراجعة', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    verified: { label: 'تم التحقق ✓', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    trusted: { label: 'جهة موثوقة ★', color: 'bg-gold/10 text-gold border-gold/20' },
    limited: { label: 'صلاحيات محدودة', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    rejected: { label: 'مرفوض', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    suspended: { label: 'موقوف', color: 'bg-red-700/10 text-red-600 border-red-700/20' },
}

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
    company_type: CompanyType
    created_at: string
    updated_at: string
    // Verification system fields
    official_name: string | null
    trade_name: string | null
    trade_license_number: string | null
    trade_license_expiry: string | null
    emirate: string | null
    city: string | null
    address: string | null
    phone: string | null
    linkedin_url: string | null
    contact_person_name: string | null
    contact_person_title: string | null
    employee_count_range: string | null
    verification_status: VerificationStatus
    risk_score: number
    risk_level: RiskLevel
    email_domain: string | null
    is_email_official: boolean
    verification_notes: string | null
    verified_at: string | null
    verified_by: string | null
    rejected_at: string | null
    rejection_reason: string | null
    sub_industry: string | null
    entity_type: string
}

export interface CompanyDocument {
    id: string
    company_id: string
    document_type: DocumentType
    file_url: string
    file_name: string | null
    file_size: number | null
    mime_type: string | null
    ocr_data: Record<string, unknown> | null
    ocr_status: OcrStatus
    uploaded_at: string
    uploaded_by: string | null
}

export interface CompanyVerificationLog {
    id: string
    company_id: string
    admin_id: string | null
    action: string
    old_status: string | null
    new_status: string | null
    notes: string | null
    metadata: Record<string, unknown> | null
    created_at: string
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
    // UAE-specific fields
    candidate_type: CandidateType
    residence_emirate: string | null
    family_book_emirate: string | null
    visa_status: string | null
    nationality: string | null
    // Emirati-specific
    emirates_id: string | null
    nafis_registered: boolean
    military_service_status: MilitaryServiceStatus | null
    // Resident-specific
    visa_expiry: string | null
    notice_period: NoticePeriod | null
    need_sponsorship: boolean
    // Tracking
    profile_views_count: number
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
    nationality_requirements: string[] | null
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
    currency: string
    skills_required: string[] | null
    nationality_requirements: string[] | null
    is_featured: boolean
    created_at: string
    expires_at: string | null
    applicants_count: number
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
    is_priority: boolean
    rejection_reason: string | null
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

// Saved items tables

export interface SavedJob {
    id: string
    candidate_id: string
    job_id: string
    created_at: string
}

export interface SavedCandidate {
    id: string
    employer_id: string
    candidate_id: string
    created_at: string
}
