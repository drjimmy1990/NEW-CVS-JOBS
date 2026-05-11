/**
 * Emiratisation Rules Engine
 * Pure TypeScript — no database calls, no side effects.
 * Implements UAE MOHRE/Nafis Emiratisation regulations.
 */

// ─── Types ──────────────────────────────────────────────────────────

export type CompanyCategory = 'large_50_plus' | 'medium_20_49' | 'small_under_20'

export type ComplianceStatus = 'compliant' | 'near_compliant' | 'at_risk' | 'non_compliant'

export type AlertSeverity = 'info' | 'warning' | 'danger'

export interface EmiratisationProfile {
    company_id: string
    company_type: string
    economic_sector: string | null
    emirate: string | null
    trade_license_number: string | null
    establishment_number: string | null
    is_mohre_registered: boolean
    uses_nafis: boolean
    total_employees: number
    skilled_employees: number
    unskilled_employees: number
    current_emiratis: number
    emiratis_in_skilled: number
    new_emiratis_this_year: number
    resigned_emiratis_this_year: number
}

export interface GapResult {
    requiredEmiratis: number
    currentEmiratis: number
    gap: number
    additionalNeeded: number
    currentRate: number
    requiredRate: number
    isSkillGap: boolean
    isResignationIssue: boolean
}

export interface Alert {
    id: string
    severity: AlertSeverity
    title: string
    description: string
    action?: { label: string; href: string }
}

export interface ActionStep {
    order: number
    title: string
    description: string
    deadline?: string
}

export interface SuitableJob {
    reason: string
    category: 'easy_fill' | 'fresh_graduates' | 'minimal_experience' | 'needs_training'
    categoryLabel: string
}

// ─── Constants ──────────────────────────────────────────────────────

/** The 14 targeted sectors for the 20-49 employee category */
export const NAFIS_TARGET_SECTORS_14 = [
    'المصارف والخدمات المالية',
    'التأمين',
    'الاتصالات',
    'العقارات',
    'السياحة والضيافة',
    'التجزئة',
    'النقل والخدمات اللوجستية',
    'الصحة',
    'التعليم',
    'المقاولات والبناء',
    'الصناعات التحويلية',
    'خدمات الأعمال',
    'الأنشطة المهنية والعلمية والتقنية',
    'المعلومات والاتصالات',
] as const

export const UAE_ECONOMIC_SECTORS = [
    'المصارف والخدمات المالية',
    'التأمين',
    'الاتصالات',
    'العقارات',
    'السياحة والضيافة',
    'التجزئة',
    'النقل والخدمات اللوجستية',
    'الصحة',
    'التعليم',
    'المقاولات والبناء',
    'الصناعات التحويلية',
    'خدمات الأعمال',
    'الأنشطة المهنية والعلمية والتقنية',
    'المعلومات والاتصالات',
    'الطاقة والمرافق',
    'الزراعة والصيد',
    'الإعلام والترفيه',
    'خدمات أخرى',
] as const

export const UAE_EMIRATES = [
    'أبوظبي',
    'دبي',
    'الشارقة',
    'عجمان',
    'أم القيوين',
    'رأس الخيمة',
    'الفجيرة',
] as const

/** Roles suitable for Emiratisation (used in Opportunity Detection) */
export const EMIRATISABLE_ROLES = [
    'خدمة المتعاملين',
    'الموارد البشرية',
    'المحاسبة والمالية',
    'التسويق',
    'المبيعات',
    'الإدارة',
    'السكرتارية',
    'العلاقات العامة',
    'تقنية المعلومات',
    'إدارة المشاريع',
] as const

// ─── Classification Engine ──────────────────────────────────────────

/**
 * Determines the company category based on total employees.
 */
export function classifyCompany(totalEmployees: number): CompanyCategory {
    if (totalEmployees >= 50) return 'large_50_plus'
    if (totalEmployees >= 20) return 'medium_20_49'
    return 'small_under_20'
}

/**
 * Checks if the company's sector is in the 14 Nafis targeted sectors.
 */
export function isTargetedSector(sector: string | null): boolean {
    if (!sector) return false
    return (NAFIS_TARGET_SECTORS_14 as readonly string[]).includes(sector)
}

/**
 * Calculates required Emiratisation rate for 50+ companies.
 * Rule: 2% annual growth, 1% semi-annual, on skilled positions.
 */
export function getRequiredRate(category: CompanyCategory, _currentYear?: number): {
    annualRate: number
    semiAnnualRate: number
    description: string
} {
    switch (category) {
        case 'large_50_plus':
            return {
                annualRate: 2,
                semiAnnualRate: 1,
                description: 'مطلوب نمو 2% سنوياً (1% نصف سنوياً) على الوظائف المهارية',
            }
        case 'medium_20_49':
            return {
                annualRate: 0, // One citizen required, not a percentage
                semiAnnualRate: 0,
                description: 'مطلوب مواطن واحد حسب المرحلة، ثم مواطن إضافي حسب السنة',
            }
        case 'small_under_20':
            return {
                annualRate: 0,
                semiAnnualRate: 0,
                description: 'قد لا تكون الشركة ضمن الفئة الإلزامية، ولكن يمكن متابعة التوطين اختيارياً',
            }
    }
}

// ─── Calculator ─────────────────────────────────────────────────────

/**
 * Calculates current Emiratisation rate (skilled positions).
 */
export function calculateCurrentRate(emiratisInSkilled: number, skilledEmployees: number): number {
    if (skilledEmployees <= 0) return 0
    return (emiratisInSkilled / skilledEmployees) * 100
}

/**
 * Calculates the target rate for a 50+ company.
 * Base: 2% of skilled employees per year. Accumulates.
 * For simplicity, we use a flat 4% target (2 years accumulated).
 * This can be refined with actual MOHRE timelines.
 */
export function getTargetRate(category: CompanyCategory, sector: string | null): number {
    switch (category) {
        case 'large_50_plus':
            return 4 // 2% × 2 years minimum target
        case 'medium_20_49':
            return isTargetedSector(sector) ? 0 : 0 // Uses count, not percentage
        case 'small_under_20':
            return 0
    }
}

/**
 * Full gap analysis.
 */
export function calculateGap(profile: EmiratisationProfile): GapResult {
    const category = classifyCompany(profile.total_employees)
    const currentRate = calculateCurrentRate(profile.emiratis_in_skilled, profile.skilled_employees)

    let requiredEmiratis = 0
    let requiredRate = 0

    if (category === 'large_50_plus') {
        requiredRate = getTargetRate(category, profile.economic_sector)
        requiredEmiratis = Math.ceil((requiredRate / 100) * profile.skilled_employees)
    } else if (category === 'medium_20_49' && isTargetedSector(profile.economic_sector)) {
        // At least 1 citizen, potentially 2 depending on phase
        requiredEmiratis = 1
        if (profile.skilled_employees > 0) {
            requiredRate = (requiredEmiratis / profile.skilled_employees) * 100
        }
    }

    const gap = Math.max(0, requiredEmiratis - profile.emiratis_in_skilled)
    const isSkillGap = profile.emiratis_in_skilled < profile.current_emiratis
    const isResignationIssue = profile.resigned_emiratis_this_year > 0

    return {
        requiredEmiratis,
        currentEmiratis: profile.emiratis_in_skilled,
        gap,
        additionalNeeded: gap,
        currentRate: Math.round(currentRate * 100) / 100,
        requiredRate,
        isSkillGap,
        isResignationIssue,
    }
}

// ─── Compliance Status ──────────────────────────────────────────────

/**
 * Determines compliance status based on gap analysis.
 */
export function getComplianceStatus(profile: EmiratisationProfile): {
    status: ComplianceStatus
    label: string
    description: string
    color: string
} {
    const category = classifyCompany(profile.total_employees)

    if (category === 'small_under_20') {
        return {
            status: 'compliant',
            label: 'غير ملزمة',
            description: 'الشركة أقل من 20 موظفاً وقد لا تكون ضمن الفئة الإلزامية.',
            color: 'blue',
        }
    }

    const gap = calculateGap(profile)

    if (gap.gap === 0 && gap.currentRate >= gap.requiredRate) {
        return {
            status: 'compliant',
            label: 'ملتزم',
            description: 'الشركة حققت النسبة المطلوبة.',
            color: 'green',
        }
    }

    if (gap.gap === 1 || (gap.requiredRate > 0 && gap.currentRate >= gap.requiredRate * 0.75)) {
        return {
            status: 'near_compliant',
            label: 'قريب من الالتزام',
            description: 'الشركة ناقصها عدد بسيط.',
            color: 'yellow',
        }
    }

    if (gap.gap <= 3 || (gap.requiredRate > 0 && gap.currentRate >= gap.requiredRate * 0.5)) {
        return {
            status: 'at_risk',
            label: 'معرضة للمخاطر',
            description: 'الشركة لم تحقق المطلوب، لكن ما زال عندها وقت.',
            color: 'orange',
        }
    }

    return {
        status: 'non_compliant',
        label: 'غير ملتزمة',
        description: 'الشركة بعيدة عن المستهدف.',
        color: 'red',
    }
}

// ─── Alerts ─────────────────────────────────────────────────────────

/**
 * Generates contextual alerts based on profile data.
 */
export function generateAlerts(profile: EmiratisationProfile): Alert[] {
    const alerts: Alert[] = []
    const category = classifyCompany(profile.total_employees)
    const gap = calculateGap(profile)
    const compliance = getComplianceStatus(profile)

    // Semi-annual deadline approaching (generic)
    const now = new Date()
    const month = now.getMonth()
    if (month >= 4 && month <= 5) {
        alerts.push({
            id: 'deadline_h1',
            severity: 'warning',
            title: 'اقترب موعد نهاية النصف الأول',
            description: 'يجب تحقيق نسبة 1% نمو قبل نهاية يونيو.',
        })
    }
    if (month >= 10 && month <= 11) {
        alerts.push({
            id: 'deadline_h2',
            severity: 'warning',
            title: 'اقترب موعد نهاية النصف الثاني',
            description: 'يجب تحقيق نسبة 1% نمو إضافي قبل نهاية ديسمبر.',
        })
    }

    // Gap alert
    if (gap.gap > 0 && category !== 'small_under_20') {
        alerts.push({
            id: 'gap_alert',
            severity: compliance.status === 'non_compliant' ? 'danger' : 'warning',
            title: `الشركة لم تحقق نسبة ${gap.requiredRate}%`,
            description: `تحتاج إلى توظيف ${gap.additionalNeeded} مواطنين إضافيين في وظائف مهارية.`,
            action: { label: 'البحث عن مرشحين مواطنين', href: '/employer/candidates?candidate_type=emirati' },
        })
    }

    // Resignation alert
    if (profile.resigned_emiratis_this_year > 0) {
        alerts.push({
            id: 'resignation_alert',
            severity: 'warning',
            title: 'عدد المواطنين انخفض بسبب استقالة',
            description: `${profile.resigned_emiratis_this_year} مواطن(ين) استقال(وا) خلال السنة الحالية. يجب تعويضهم للحفاظ على النسبة.`,
        })
    }

    // Non-compliance risk
    if (compliance.status === 'non_compliant' || compliance.status === 'at_risk') {
        alerts.push({
            id: 'risk_alert',
            severity: 'danger',
            title: 'يوجد خطر عدم الالتزام',
            description: 'ينصح باتخاذ إجراءات فورية لتجنب الغرامات والعقوبات.',
        })
    }

    // Suggest posting Emirati-targeted jobs
    if (gap.gap > 0) {
        alerts.push({
            id: 'suggest_post',
            severity: 'info',
            title: 'ينصح بنشر وظائف مخصصة للمواطنين',
            description: 'انشر وظائف تستهدف المواطنين الإماراتيين لتسريع تحقيق المستهدف.',
            action: { label: 'نشر وظيفة', href: '/employer/jobs/new' },
        })
    }

    // Nafis suggestion
    if (!profile.uses_nafis && gap.gap > 0) {
        alerts.push({
            id: 'nafis_suggest',
            severity: 'info',
            title: 'ينصح باستخدام نافس للوصول إلى مرشحين مواطنين',
            description: 'منصة نافس توفر مرشحين مواطنين مؤهلين ودعم حكومي للرواتب.',
        })
    }

    return alerts
}

// ─── Action Plan ────────────────────────────────────────────────────

/**
 * Generates an action plan based on gap analysis.
 */
export function generateActionPlan(profile: EmiratisationProfile): ActionStep[] {
    const gap = calculateGap(profile)
    const steps: ActionStep[] = []

    if (gap.gap <= 0) {
        steps.push({
            order: 1,
            title: 'الحفاظ على النسبة الحالية',
            description: 'استمر في متابعة نسبة التوطين كل أسبوعين لضمان عدم الانخفاض.',
        })
        return steps
    }

    // Step 1: Hire
    steps.push({
        order: 1,
        title: `توظيف ${gap.additionalNeeded} مواطنين خلال 60 يوماً`,
        description: `تحتاج الشركة إلى توظيف ${gap.additionalNeeded} مواطن(ين) إماراتي(ين) في وظائف مهارية للوصول للمستهدف.`,
        deadline: '60 يوماً',
    })

    // Step 2: Post jobs
    const jobsToPost = Math.max(gap.additionalNeeded, 2)
    steps.push({
        order: 2,
        title: `نشر ${jobsToPost} وظائف مخصصة للمواطنين`,
        description: 'انشر وظائف تستهدف المواطنين في تخصصات قابلة للتوطين.',
    })

    // Step 3: Target specializations
    steps.push({
        order: 3,
        title: 'استهداف تخصصات الموارد البشرية والمحاسبة وخدمة المتعاملين',
        description: 'هذه التخصصات هي الأسهل لاستقطاب مواطنين وخريجين جدد.',
    })

    // Step 4: Nafis
    if (!profile.uses_nafis) {
        steps.push({
            order: 4,
            title: 'استخدام نافس للوصول إلى مرشحين مناسبين',
            description: 'سجل في منصة نافس للحصول على دعم حكومي ومرشحين مؤهلين.',
        })
    }

    // Step 5: Monitor
    steps.push({
        order: steps.length + 1,
        title: 'متابعة نسبة التوطين كل أسبوعين',
        description: 'تابع التقدم بشكل دوري لضمان تحقيق المستهدف قبل نهاية الفترة.',
    })

    // Step 6: Review resignations
    if (profile.resigned_emiratis_this_year > 0) {
        steps.push({
            order: steps.length + 1,
            title: 'مراجعة أسباب استقالات المواطنين',
            description: `${profile.resigned_emiratis_this_year} مواطن استقال هذا العام. حلل الأسباب وطور بيئة العمل للاحتفاظ بالمواطنين.`,
        })
    }

    return steps
}

// ─── Opportunity Detection ──────────────────────────────────────────

/**
 * Analyzes job titles to suggest which can be emiratised.
 */
export function detectEmiratisableOpportunities(jobTitles: string[]): {
    title: string
    suitability: SuitableJob
}[] {
    const results: { title: string; suitability: SuitableJob }[] = []

    const easyFillKeywords = ['خدمة المتعاملين', 'customer service', 'استقبال', 'reception', 'سكرتارية', 'secretary', 'إدارية', 'administrative', 'علاقات عامة']
    const freshGradKeywords = ['مبتدئ', 'junior', 'متدرب', 'trainee', 'intern', 'خريج', 'graduate', 'fresh']
    const minExpKeywords = ['موارد بشرية', 'hr', 'human resources', 'محاسب', 'accountant', 'تسويق', 'marketing', 'مبيعات', 'sales']
    const trainingKeywords = ['تقني', 'technical', 'مهندس', 'engineer', 'تطوير', 'developer', 'برمجة', 'programming']

    for (const title of jobTitles) {
        const lower = title.toLowerCase()

        if (easyFillKeywords.some(k => lower.includes(k.toLowerCase()))) {
            results.push({
                title,
                suitability: {
                    reason: 'وظيفة يمكن توطينها بسهولة',
                    category: 'easy_fill',
                    categoryLabel: 'سهلة التوطين',
                },
            })
        } else if (freshGradKeywords.some(k => lower.includes(k.toLowerCase()))) {
            results.push({
                title,
                suitability: {
                    reason: 'مناسبة للخريجين الجدد',
                    category: 'fresh_graduates',
                    categoryLabel: 'خريجين جدد',
                },
            })
        } else if (minExpKeywords.some(k => lower.includes(k.toLowerCase()))) {
            results.push({
                title,
                suitability: {
                    reason: 'تحتاج خبرة بسيطة ومتوفرة لدى المواطنين',
                    category: 'minimal_experience',
                    categoryLabel: 'خبرة بسيطة',
                },
            })
        } else if (trainingKeywords.some(k => lower.includes(k.toLowerCase()))) {
            results.push({
                title,
                suitability: {
                    reason: 'تحتاج تدريب قبل التعيين',
                    category: 'needs_training',
                    categoryLabel: 'تحتاج تدريب',
                },
            })
        }
    }

    return results
}
