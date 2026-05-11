'use client'

import { AlertTriangle, ShieldAlert, Clock, CheckCircle2, FileText, ExternalLink } from 'lucide-react'
import { VERIFICATION_STATUS_LABELS } from '@/lib/types'
import Link from 'next/link'

interface VerificationBannerProps {
    status: string
    notes?: string | null
    isRecruitmentAgency?: boolean
}

export function VerificationBanner({ status, notes, isRecruitmentAgency }: VerificationBannerProps) {
    if (status === 'verified' || status === 'trusted') return null

    // Determine config based on status
    let icon = <Clock className="w-5 h-5 text-yellow-500" />
    let title = 'الحساب قيد المراجعة'
    let description = 'نحن نقوم بمراجعة بيانات الشركة والمستندات. ستتمكن من نشر الوظائف قريباً.'
    let colorClass = 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
    let actionText = 'حالة الطلب'
    let actionLink = '/employer/verification'

    switch (status) {
        case 'pending_verification':
        case 'email_verified':
            icon = <AlertTriangle className="w-5 h-5 text-orange-400" />
            title = 'مطلوب استكمال البيانات'
            description = 'يرجى استكمال رفع المستندات المطلوبة للبدء في توثيق حسابك.'
            colorClass = 'bg-orange-500/10 border-orange-500/20 text-orange-400'
            actionText = 'استكمال التسجيل'
            break
        case 'documents_submitted':
        case 'under_review':
            icon = <Clock className="w-5 h-5 text-blue-400" />
            title = 'الحساب قيد المراجعة'
            description = 'تم استلام المستندات وجارِ مراجعتها من قبل فريقنا (24-48 ساعة).'
            colorClass = 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            break
        case 'limited':
            icon = <ShieldAlert className="w-5 h-5 text-amber-500" />
            title = 'صلاحيات محدودة'
            description = notes || 'حسابك مقيد حالياً. لا يمكنك نشر وظائف جديدة أو مراسلة المرشحين.'
            colorClass = 'bg-amber-500/10 border-amber-500/20 text-amber-500'
            actionText = 'تواصل مع الدعم'
            break
        case 'rejected':
            icon = <ShieldAlert className="w-5 h-5 text-red-500" />
            title = 'تم رفض التوثيق'
            description = notes || 'لم نتمكن من توثيق حساب شركتك بناءً على البيانات المقدمة.'
            colorClass = 'bg-red-500/10 border-red-500/20 text-red-400'
            actionText = 'تحديث المستندات'
            break
        case 'suspended':
            icon = <ShieldAlert className="w-5 h-5 text-red-600" />
            title = 'الحساب موقوف'
            description = notes || 'تم إيقاف حسابك لمخالفة سياسات المنصة.'
            colorClass = 'bg-red-900/20 border-red-700/30 text-red-500'
            actionText = 'سياسة الاستخدام'
            actionLink = '#'
            break
    }

    return (
        <div className={`mx-8 mt-6 mb-2 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm ${colorClass}`}>
            <div className="p-2 rounded-full bg-white/5">
                {icon}
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-base mb-1">{title}</h3>
                <p className="text-sm opacity-90 leading-relaxed">
                    {description}
                    {isRecruitmentAgency && status === 'under_review' && (
                        <span className="block mt-1 text-xs opacity-75">
                            ملاحظة: مراجعة شركات التوظيف تتطلب تدقيقاً إضافياً وقد تستغرق وقتاً أطول.
                        </span>
                    )}
                </p>
            </div>
            <div>
                <Link href={actionLink}>
                    <button className="whitespace-nowrap px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium flex items-center gap-2">
                        {actionText}
                        <ExternalLink className="w-3 h-3" />
                    </button>
                </Link>
            </div>
        </div>
    )
}
