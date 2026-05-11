import { Shield, Lock, FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface VerificationLockServerProps {
    featureName: string
    verificationStatus: string
}

const STATUS_CONFIG: Record<string, {
    badge: string
    badgeClass: string
    message: string
    cta: string
    ctaLink: string
}> = {
    pending_verification: {
        badge: 'في انتظار التوثيق',
        badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        message: 'يرجى استكمال رفع المستندات المطلوبة لتوثيق حسابك والبدء في استخدام هذه الميزة.',
        cta: 'استكمال التسجيل',
        ctaLink: '/employer/settings',
    },
    email_verified: {
        badge: 'تم التحقق من البريد',
        badgeClass: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        message: 'تم التحقق من بريدك الإلكتروني. يرجى رفع مستندات الشركة لاستكمال التوثيق.',
        cta: 'استكمال التسجيل',
        ctaLink: '/employer/settings',
    },
    documents_submitted: {
        badge: 'المستندات قيد المراجعة',
        badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        message: 'تم استلام مستنداتك وجارِ مراجعتها من قبل فريقنا. سيتم تفعيل حسابك خلال 24-48 ساعة.',
        cta: 'حالة الطلب',
        ctaLink: '/employer/settings',
    },
    under_review: {
        badge: 'قيد المراجعة',
        badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        message: 'حسابك قيد المراجعة من قبل فريق التوثيق. سيتم إخطارك فور الموافقة.',
        cta: 'حالة الطلب',
        ctaLink: '/employer/settings',
    },
    limited: {
        badge: 'صلاحيات محدودة',
        badgeClass: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
        message: 'حسابك مقيد حالياً. تواصل مع فريق الدعم لمزيد من المعلومات.',
        cta: 'تواصل مع الدعم',
        ctaLink: '/employer/settings',
    },
    rejected: {
        badge: 'مرفوض',
        badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
        message: 'لم نتمكن من توثيق حساب شركتك. يرجى تحديث المستندات وإعادة التقديم.',
        cta: 'تحديث المستندات',
        ctaLink: '/employer/settings',
    },
    suspended: {
        badge: 'موقوف',
        badgeClass: 'bg-red-900/30 text-red-500 border-red-700/30',
        message: 'تم إيقاف حسابك لمخالفة سياسات المنصة. تواصل مع الإدارة.',
        cta: 'تواصل مع الدعم',
        ctaLink: '/employer/settings',
    },
}

/**
 * Full-page lock overlay for SERVER components that require verification.
 * Takes verification status as a prop (no context dependency).
 */
export function VerificationLockServer({ featureName, verificationStatus }: VerificationLockServerProps) {
    const config = STATUS_CONFIG[verificationStatus] || STATUS_CONFIG.under_review

    return (
        <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
            <div className="bg-navy-light/80 border border-gold/10 rounded-xl backdrop-blur-sm max-w-lg w-full mx-4">
                <div className="p-10 text-center space-y-6">
                    {/* Lock Icon */}
                    <div className="relative mx-auto w-20 h-20">
                        <div className="absolute inset-0 rounded-full bg-gold/5" />
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/20 flex items-center justify-center">
                            <Lock className="h-9 w-9 text-gold/70" />
                        </div>
                    </div>

                    {/* Feature Name */}
                    <div>
                        <h2 className="text-xl font-bold text-cream mb-2">
                            {featureName}
                        </h2>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.badgeClass}`}>
                            <Shield className="h-3 w-3" />
                            {config.badge}
                        </span>
                    </div>

                    {/* Message */}
                    <p className="text-cream-dark/60 text-sm leading-relaxed max-w-sm mx-auto">
                        {config.message}
                    </p>

                    {/* What you can do */}
                    <div className="bg-navy/50 rounded-xl p-4 border border-gold/5">
                        <p className="text-xs text-cream-dark/40 mb-3 font-medium">ما يمكنك فعله الآن:</p>
                        <div className="space-y-2 text-sm text-cream-dark/50">
                            <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-gold/50" />
                                <span>تعديل بيانات الشركة</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-gold/50" />
                                <span>رفع المستندات المطلوبة</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-gold/50" />
                                <span>حفظ الوظائف كمسودة</span>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <Link href={config.ctaLink}>
                        <button className="w-full mt-2 inline-flex items-center justify-center rounded-md bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-navy font-bold h-10 px-4 text-sm transition-colors">
                            {config.cta}
                            <ExternalLink className="ms-2 h-4 w-4" />
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
