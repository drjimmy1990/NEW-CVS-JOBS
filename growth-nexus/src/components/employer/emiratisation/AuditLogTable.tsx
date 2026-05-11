'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/client'
import { History, Loader2 } from 'lucide-react'

interface AuditEntry {
    id: string
    field_name: string
    old_value: string | null
    new_value: string | null
    created_at: string
    profiles?: { full_name: string } | null
}

const fieldLabels: Record<string, string> = {
    company_type: 'نوع الشركة',
    economic_sector: 'القطاع الاقتصادي',
    emirate: 'الإمارة',
    trade_license_number: 'رقم الرخصة التجارية',
    establishment_number: 'رقم المنشأة',
    is_mohre_registered: 'تابعة للموارد البشرية',
    uses_nafis: 'تستخدم نافس',
    total_employees: 'إجمالي الموظفين',
    skilled_employees: 'الموظفين المهاريين',
    unskilled_employees: 'غير المهاريين',
    current_emiratis: 'المواطنين الحاليين',
    emiratis_in_skilled: 'المواطنين في وظائف مهارية',
    new_emiratis_this_year: 'المواطنين الجدد',
    resigned_emiratis_this_year: 'المواطنين المستقيلين',
}

export function AuditLogTable({ companyId }: { companyId: string }) {
    const [entries, setEntries] = useState<AuditEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadAudit()
    }, [companyId])

    const loadAudit = async () => {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('emiratisation_audit_log')
            .select('*, profiles:user_id(full_name)')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(50)
            
        if (error) {
            console.error("Supabase Error fetching audit log:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            })
        }
            
        setEntries((data as any[]) || [])
        setLoading(false)
    }

    if (loading) {
        return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>
    }

    return (
        <Card className="bg-navy-light border-gold/10">
            <CardHeader>
                <CardTitle className="text-cream text-lg flex items-center gap-2">
                    <History className="h-5 w-5 text-gold" />
                    سجل التعديلات
                </CardTitle>
            </CardHeader>
            <CardContent>
                {entries.length === 0 ? (
                    <p className="text-cream-dark/40 text-center py-6 text-sm">لا توجد تعديلات مسجلة بعد</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gold/10">
                                    <th className="text-start text-cream-dark/50 p-2 text-xs font-normal">التاريخ</th>
                                    <th className="text-start text-cream-dark/50 p-2 text-xs font-normal">الحقل</th>
                                    <th className="text-start text-cream-dark/50 p-2 text-xs font-normal">القيمة القديمة</th>
                                    <th className="text-start text-cream-dark/50 p-2 text-xs font-normal">القيمة الجديدة</th>
                                    <th className="text-start text-cream-dark/50 p-2 text-xs font-normal">المعدل</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map(e => (
                                    <tr key={e.id} className="border-b border-gold/5 hover:bg-navy/30 transition-colors">
                                        <td className="p-2 text-cream-dark/60 text-xs whitespace-nowrap">
                                            {new Date(e.created_at).toLocaleString('ar-AE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-2 text-cream text-xs">{fieldLabels[e.field_name] || e.field_name}</td>
                                        <td className="p-2 text-red-400/60 text-xs">{e.old_value || '—'}</td>
                                        <td className="p-2 text-emerald-400/80 text-xs">{e.new_value || '—'}</td>
                                        <td className="p-2 text-cream-dark/40 text-xs">{(e.profiles as any)?.full_name || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
