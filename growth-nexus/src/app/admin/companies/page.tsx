'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Loader2, CheckCircle, XCircle, Building2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

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

    const toggleVerify = async (id: string, current: boolean) => {
        const { error } = await supabase.from('companies').update({ is_verified: !current }).eq('id', id)
        if (error) { toast.error('فشل التحديث') } else {
            toast.success(!current ? 'تم التحقق من الشركة' : 'تم إلغاء التحقق')
            setCompanies(companies.map(c => c.id === id ? { ...c, is_verified: !current } : c))
        }
    }

    const updateType = async (id: string, type: string) => {
        const { error } = await supabase.from('companies').update({ company_type: type }).eq('id', id)
        if (error) { toast.error('فشل التحديث') } else {
            toast.success('تم تحديث نوع الجهة')
            setCompanies(companies.map(c => c.id === id ? { ...c, company_type: type } : c))
        }
    }

    const filtered = companies.filter(c => {
        if (search) return (c.name || '').toLowerCase().includes(search.toLowerCase())
        return true
    })

    const typeLabels: Record<string, string> = { government: 'حكومية', semi_government: 'شبه حكومية', private: 'خاصة' }

    if (loading) return <div className="flex items-center gap-2 text-cream-dark/50"><Loader2 className="h-5 w-5 animate-spin" />جاري التحميل...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-cream">الشركات</h1>
                <Badge className="bg-navy-lighter text-cream-dark/50">{companies.length} شركة</Badge>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-dark/30" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم..."
                    className="bg-navy-lighter border-gold/10 text-cream pr-10" />
            </div>

            <div className="space-y-2">
                {filtered.map(c => (
                    <Card key={c.id} className="bg-navy-light border-gold/10">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                                    <Building2 className="h-5 w-5 text-gold" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-cream text-sm font-medium">{c.name}</p>
                                        {c.is_verified ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-cream-dark/30" />}
                                    </div>
                                    <p className="text-cream-dark/40 text-xs">{c.profiles?.email || 'N/A'} • {c.job_credits} رصيد • {c.subscription_tier}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Select value={c.company_type || 'private'} onValueChange={(v) => updateType(c.id, v)}>
                                    <SelectTrigger className="w-32 h-8 text-xs bg-navy-lighter border-gold/10 text-cream"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-navy-light border-gold/10">
                                        <SelectItem value="government" className="text-cream text-xs">حكومية</SelectItem>
                                        <SelectItem value="semi_government" className="text-cream text-xs">شبه حكومية</SelectItem>
                                        <SelectItem value="private" className="text-cream text-xs">خاصة</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button size="sm" variant="outline" onClick={() => toggleVerify(c.id, c.is_verified)}
                                    className={`h-8 text-xs ${c.is_verified ? 'border-red-500/20 text-red-400 hover:bg-red-500/10' : 'border-success/20 text-success hover:bg-success/10'}`}>
                                    {c.is_verified ? 'إلغاء التحقق' : 'تحقق'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
