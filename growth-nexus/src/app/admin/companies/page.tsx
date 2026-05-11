'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Loader2, Building2, ShieldAlert, CheckCircle2, ShieldQuestion } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { VERIFICATION_STATUS_LABELS, ENTITY_TYPES } from '@/lib/types'

export default function AdminCompaniesPage() {
    const supabase = createClient()
    const [companies, setCompanies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => { loadCompanies() }, [])

    const loadCompanies = async () => {
        setLoading(true)
        const { data } = await supabase.from('companies').select('*, profiles!companies_owner_id_fkey(email, full_name)').order('created_at', { ascending: false }).limit(100)
        setCompanies(data || [])
        setLoading(false)
    }

    const updateStatus = async (id: string, status: string, oldStatus: string) => {
        try {
            const res = await fetch(`/api/admin/companies/${id}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, old_status: oldStatus })
            })
            
            if (!res.ok) throw new Error('Failed to update')
            
            toast.success('تم تحديث حالة التحقق')
            setCompanies(companies.map(c => c.id === id ? { ...c, verification_status: status } : c))
        } catch (error) {
            toast.error('فشل التحديث')
        }
    }

    const updateType = async (id: string, type: string) => {
        const { error } = await supabase.from('companies').update({ entity_type: type }).eq('id', id)
        if (error) { 
            toast.error('فشل التحديث') 
        } else {
            toast.success('تم تحديث نوع الجهة')
            setCompanies(companies.map(c => c.id === id ? { ...c, entity_type: type } : c))
        }
    }

    const filtered = companies.filter(c => {
        if (search) return (c.name || c.official_name || '').toLowerCase().includes(search.toLowerCase())
        return true
    })

    const getStatusIcon = (status: string) => {
        if (['verified', 'trusted'].includes(status)) return <CheckCircle2 className="h-4 w-4 text-success" />
        if (['rejected', 'suspended'].includes(status)) return <ShieldAlert className="h-4 w-4 text-red-500" />
        return <ShieldQuestion className="h-4 w-4 text-blue-400" />
    }

    if (loading) return <div className="flex items-center gap-2 text-cream-dark/50"><Loader2 className="h-5 w-5 animate-spin" />جاري التحميل...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-cream">مراجعة الشركات والتوثيق</h1>
                <Badge className="bg-navy-lighter text-cream-dark/50">{companies.length} شركة</Badge>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-dark/30" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم..."
                    className="bg-navy-lighter border-gold/10 text-cream pr-10" />
            </div>

            <div className="space-y-3">
                {filtered.map(c => {
                    const status = c.verification_status || 'pending_verification'
                    const entityType = c.entity_type || 'private'
                    
                    return (
                    <Card key={c.id} className="bg-navy-light border-gold/10">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4 w-1/2">
                                <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                                    <Building2 className="h-6 w-6 text-gold" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-cream text-base font-bold">{c.name || c.official_name || 'بدون اسم'}</p>
                                        {getStatusIcon(status)}
                                    </div>
                                    <p className="text-cream-dark/50 text-xs">
                                        {c.profiles?.email || 'N/A'} • 
                                        مؤشر المخاطرة: <span className={c.risk_score > 70 ? 'text-red-400' : 'text-cream-dark/70'}>{c.risk_score || 0}</span>
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 w-1/2 justify-end">
                                <div className="text-right me-4">
                                    <span className="block text-[10px] text-cream-dark/40 mb-1">نوع الجهة</span>
                                    <Select value={entityType} onValueChange={(v) => updateType(c.id, v)}>
                                        <SelectTrigger className="w-40 h-8 text-xs bg-navy-lighter border-gold/10 text-cream">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-navy-light border-gold/10">
                                            {ENTITY_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value} className="text-cream text-xs">{type.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="text-right">
                                    <span className="block text-[10px] text-cream-dark/40 mb-1">حالة التوثيق</span>
                                    <Select value={status} onValueChange={(v) => updateStatus(c.id, v, status)}>
                                        <SelectTrigger className="w-48 h-8 text-xs bg-navy-lighter border-gold/10 text-cream">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-navy-light border-gold/10">
                                            {Object.entries(VERIFICATION_STATUS_LABELS).map(([key, item]) => (
                                                <SelectItem key={key} value={key} className="text-cream text-xs">{item.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )})}
            </div>
        </div>
    )
}
