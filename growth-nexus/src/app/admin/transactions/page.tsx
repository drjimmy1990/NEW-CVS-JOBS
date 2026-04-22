'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard } from 'lucide-react'

export default function AdminTransactionsPage() {
    const supabase = createClient()
    const [txns, setTxns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { loadTxns() }, [])

    const loadTxns = async () => {
        setLoading(true)
        const { data } = await supabase.from('transactions').select('*, profiles!transactions_user_id_fkey(full_name, email)')
            .order('created_at', { ascending: false }).limit(100)
        setTxns(data || [])
        setLoading(false)
    }

    const statusColors: Record<string, string> = {
        completed: 'bg-success/15 text-success', pending: 'bg-gold/15 text-gold', failed: 'bg-red-500/15 text-red-400'
    }

    // Calculate totals
    const totalRevenue = txns.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.amount || 0), 0)

    if (loading) return <div className="flex items-center gap-2 text-cream-dark/50"><Loader2 className="h-5 w-5 animate-spin" />جاري التحميل...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-cream">المعاملات المالية</h1>
                <div className="text-left">
                    <p className="text-cream-dark/40 text-xs">إجمالي الإيرادات</p>
                    <p className="text-xl font-bold text-success">{totalRevenue.toLocaleString()} <span className="text-sm text-cream-dark/40">د.إ</span></p>
                </div>
            </div>

            {txns.length === 0 ? (
                <Card className="bg-navy-light border-gold/10">
                    <CardContent className="py-16 text-center">
                        <CreditCard className="h-12 w-12 text-cream-dark/20 mx-auto mb-4" />
                        <p className="text-cream-dark/40">لا توجد معاملات حتى الآن</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {txns.map(t => (
                        <Card key={t.id} className="bg-navy-light border-gold/10">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-cream text-sm font-medium">{t.profiles?.full_name || 'غير معروف'}</p>
                                        <Badge className={statusColors[t.status] || 'bg-cream-dark/10 text-cream-dark/40'}>{t.status}</Badge>
                                    </div>
                                    <p className="text-cream-dark/40 text-xs">
                                        {t.type || '-'} • {t.profiles?.email} • {new Date(t.created_at).toLocaleDateString('ar-AE')}
                                    </p>
                                </div>
                                <div className="text-left">
                                    <p className="text-cream font-semibold">{(t.amount || 0).toLocaleString()} <span className="text-xs text-cream-dark/40">{t.currency || 'AED'}</span></p>
                                    {t.provider_tx_ref && <p className="text-cream-dark/30 text-xs font-mono">{t.provider_tx_ref}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
