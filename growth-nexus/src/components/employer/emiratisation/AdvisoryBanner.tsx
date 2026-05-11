'use client'

import { AlertTriangle } from 'lucide-react'

export function AdvisoryBanner() {
    return (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
                <p className="text-sm text-amber-300 font-medium">
                    تنبيه: النتائج إرشادية
                </p>
                <p className="text-xs text-amber-300/60 mt-0.5">
                    هذه النتائج إرشادية وليست بديلاً عن منصة نافس أو وزارة الموارد البشرية والتوطين. يرجى الرجوع إلى الجهات الرسمية للحصول على المعلومات الدقيقة.
                </p>
            </div>
        </div>
    )
}
