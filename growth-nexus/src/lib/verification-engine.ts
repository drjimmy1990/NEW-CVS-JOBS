/**
 * Verification Engine — Company risk scoring and validation utilities
 * Used during employer registration and admin review workflows
 */

// Known UAE government email domains
const UAE_GOVERNMENT_DOMAINS = [
    'gov.ae', 'mof.gov.ae', 'mohre.gov.ae', 'moi.gov.ae',
    'adpolice.gov.ae', 'dubaipolice.gov.ae', 'mofa.gov.ae',
    'moe.gov.ae', 'haad.ae', 'dha.gov.ae', 'eca.ac.ae',
    'adnoc.ae', 'enec.gov.ae', 'ead.gov.ae', 'tamm.abudhabi',
    'abudhabi.ae', 'dubai.ae', 'sharjah.ae', 'ajman.ae',
    'rak.ae', 'fujairah.ae', 'uaq.ae',
]

// Public/free email providers that trigger manual review
const PUBLIC_EMAIL_PROVIDERS = [
    'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com',
    'icloud.com', 'aol.com', 'mail.com', 'protonmail.com',
    'yandex.com', 'live.com', 'msn.com', 'zoho.com',
]

export type EmailClassification = 'government' | 'corporate' | 'public'

/**
 * Extract the domain from an email address
 */
export function extractEmailDomain(email: string): string {
    return email.split('@')[1]?.toLowerCase() || ''
}

/**
 * Classify email domain: government, corporate, or public (gmail/hotmail)
 */
export function classifyEmailDomain(email: string): EmailClassification {
    const domain = extractEmailDomain(email)
    if (!domain) return 'public'

    // Check government domains
    if (UAE_GOVERNMENT_DOMAINS.some(gov => domain.endsWith(gov))) {
        return 'government'
    }

    // Check public providers
    if (PUBLIC_EMAIL_PROVIDERS.includes(domain)) {
        return 'public'
    }

    return 'corporate'
}

/**
 * Check if email domain is official (not gmail/hotmail/etc.)
 */
export function isOfficialEmail(email: string): boolean {
    return classifyEmailDomain(email) !== 'public'
}

/**
 * Check if email domain matches company website domain
 */
export function doesDomainMatchWebsite(email: string, website: string | null): boolean {
    if (!website) return false
    const emailDomain = extractEmailDomain(email)
    try {
        const url = new URL(website.startsWith('http') ? website : `https://${website}`)
        const websiteDomain = url.hostname.replace('www.', '')
        return emailDomain === websiteDomain
    } catch {
        return false
    }
}

/**
 * Calculate risk score (0-100) for a company based on available data
 * Higher = safer/more trustworthy
 */
export function calculateRiskScore(data: {
    email: string
    website: string | null
    entity_type: string
    trade_license_number: string | null
    trade_license_expiry: string | null
    has_documents: boolean
    document_count: number
}): { score: number; level: 'low' | 'medium' | 'high'; factors: string[] } {
    let score = 0
    const factors: string[] = []

    // 1. Email classification (+20 for official, +5 for public)
    const emailClass = classifyEmailDomain(data.email)
    if (emailClass === 'government') {
        score += 25
        factors.push('بريد حكومي رسمي (+25)')
    } else if (emailClass === 'corporate') {
        score += 20
        factors.push('بريد شركة رسمي (+20)')
    } else {
        score += 5
        factors.push('بريد عام (Gmail/Hotmail) (+5)')
    }

    // 2. Domain matches website (+10)
    if (doesDomainMatchWebsite(data.email, data.website)) {
        score += 10
        factors.push('الدومين يطابق الموقع (+10)')
    }

    // 3. Website exists (+10)
    if (data.website && data.website.length > 5) {
        score += 10
        factors.push('يوجد موقع إلكتروني (+10)')
    }

    // 4. Trade license (+20 if valid, +10 if present but expired)
    if (data.trade_license_number) {
        if (data.trade_license_expiry) {
            const expiry = new Date(data.trade_license_expiry)
            if (expiry > new Date()) {
                score += 20
                factors.push('رخصة تجارية سارية (+20)')
            } else {
                score += 10
                factors.push('رخصة تجارية منتهية (+10)')
            }
        } else {
            score += 15
            factors.push('رقم رخصة تجارية مقدم (+15)')
        }
    }

    // 5. Entity type bonus (+15 for government)
    if (data.entity_type === 'government') {
        score += 15
        factors.push('جهة حكومية (+15)')
    } else if (data.entity_type === 'semi_government') {
        score += 10
        factors.push('جهة شبه حكومية (+10)')
    }

    // 6. Documents uploaded (+10)
    if (data.has_documents && data.document_count > 0) {
        score += 10
        factors.push(`${data.document_count} مستند(ات) مرفوعة (+10)`)
    }

    // 7. Cap at 100
    score = Math.min(score, 100)

    // Determine risk level
    let level: 'low' | 'medium' | 'high'
    if (score >= 61) {
        level = 'low'
    } else if (score >= 31) {
        level = 'medium'
    } else {
        level = 'high'
    }

    return { score, level, factors }
}

/**
 * Determine if a company should be auto-flagged for manual review
 */
export function requiresManualReview(data: {
    email: string
    entity_type: string
    risk_level: 'low' | 'medium' | 'high'
}): { required: boolean; reason: string | null } {
    // Recruitment agencies always need manual review
    if (data.entity_type === 'recruitment_agency') {
        return { required: true, reason: 'شركات التوظيف تتطلب تدقيق يدوي إلزامي' }
    }

    // Public email always needs review
    if (classifyEmailDomain(data.email) === 'public') {
        return { required: true, reason: 'البريد الإلكتروني عام (Gmail/Hotmail) - يتطلب مراجعة' }
    }

    // High risk always needs review
    if (data.risk_level === 'high') {
        return { required: true, reason: 'درجة المخاطر عالية' }
    }

    // Government with official email can skip manual review
    if (data.entity_type === 'government' && classifyEmailDomain(data.email) === 'government') {
        return { required: false, reason: null }
    }

    // Medium risk needs review
    if (data.risk_level === 'medium') {
        return { required: true, reason: 'درجة المخاطر متوسطة - يتطلب مراجعة' }
    }

    return { required: false, reason: null }
}

/**
 * Get permissions based on verification status
 */
export function getVerificationPermissions(status: string): {
    canPublishJobs: boolean
    canViewCVs: boolean
    canMessageCandidates: boolean
    canSaveDrafts: boolean
    canEditProfile: boolean
    canUploadDocs: boolean
    canViewAnalytics: boolean
    canUseAI: boolean
} {
    switch (status) {
        case 'verified':
        case 'trusted':
            return {
                canPublishJobs: true,
                canViewCVs: true,
                canMessageCandidates: true,
                canSaveDrafts: true,
                canEditProfile: true,
                canUploadDocs: true,
                canViewAnalytics: true,
                canUseAI: true,
            }
        case 'limited':
            return {
                canPublishJobs: false,
                canViewCVs: false,
                canMessageCandidates: false,
                canSaveDrafts: true,
                canEditProfile: true,
                canUploadDocs: true,
                canViewAnalytics: true,
                canUseAI: false,
            }
        case 'rejected':
        case 'suspended':
            return {
                canPublishJobs: false,
                canViewCVs: false,
                canMessageCandidates: false,
                canSaveDrafts: false,
                canEditProfile: false,
                canUploadDocs: false,
                canViewAnalytics: false,
                canUseAI: false,
            }
        // pending_verification, email_verified, documents_submitted, under_review
        default:
            return {
                canPublishJobs: false,
                canViewCVs: false,
                canMessageCandidates: false,
                canSaveDrafts: true,
                canEditProfile: true,
                canUploadDocs: true,
                canViewAnalytics: false,
                canUseAI: false,
            }
    }
}
