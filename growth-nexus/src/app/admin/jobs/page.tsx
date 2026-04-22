'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Loader2, Eye, XCircle, Star, StarOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const statusLabels: Record<string, string> = { draft: 'مسودة', active: 'نشط', paused: 'متوقف', expired: 'منتهي', closed: 'مغلق', archived: 'مؤرشف' }
const statusColors: Record<string, string> = { active: 'bg-success/15 text-success', draft: 'bg-cream-dark/15 text-cream-dark/50', paused: 'bg-gold/15 text-gold', closed: 'bg-red-500/15 text-red-400', expired: 'bg-orange-500/15 text-orange-400', archived: 'bg-cream-dark/10 text-cream-dark/30' }

export default function AdminJobsPage() {
    const supabase = createClient()
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')

    useEffect(() => { loadJobs() }, [])

    const loadJobs = async () => {
        setLoading(true)
        const { data } = await supabase.from('jobs').select('*, companies(name)').order('created_at', { ascending: false }).limit(100)
        setJobs(data || [])
        setLoading(false)
    }

    const forceClose = async (id: string) => {
        const { error } = await supabase.from('jobs').update({ status: 'closed' }).eq('id', id)
        if (error) { toast.error('فشل الإغلاق') } else {
            toast.success('تم إغلاق الوظيفة')
            setJobs(jobs.map(j => j.id === id ? { ...j, status: 'closed' } : j))
        }
    }

    const toggleFeatured = async (id: string, current: boolean) => {
        const { error } = await supabase.from('jobs').update({ is_featured: !current }).eq('id', id)
        if (error) { toast.error('فشل التحديث') } else {
            toast.success(!current ? 'تم التمييز' : 'تم إلغاء التمييز')
            setJobs(jobs.map(j => j.id === id ? { ...j, is_featured: !current } : j))
        }
    }

    const filtered = jobs.filter(j => {
        if (filter !== 'all' && j.status !== filter) return false
        if (search) return (j.title || '').toLowerCase().includes(search.toLowerCase())
        return true
    })

    if (loading) return <div className="flex items-center gap-2 text-cream-dark/50"><Loader2 className="h-5 w-5 animate-spin" />جاري التحميل...</div>

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-cream">الوظائف</h1>

            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-dark/30" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
                        className="bg-navy-lighter border-gold/10 text-cream pr-10" />
                </div>
                {['all', 'active', 'draft', 'paused', 'closed'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-full text-sm ${filter === f ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-navy-lighter text-cream-dark/40 border border-gold/5'}`}>
                        {f === 'all' ? 'الكل' : statusLabels[f]}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                {filtered.map(j => (
                    <Card key={j.id} className="bg-navy-light border-gold/10">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-cream text-sm font-medium">{j.title}</p>
                                    <Badge className={statusColors[j.status]}>{statusLabels[j.status]}</Badge>
                                    {j.is_featured && <Badge className="bg-gold/15 text-gold">مميز</Badge>}
                                </div>
                                <p className="text-cream-dark/40 text-xs">
                                    {j.companies?.name || 'غير محدد'} • {j.location_city || '-'} • {j.applicants_count || 0} متقدم • {new Date(j.created_at).toLocaleDateString('ar-AE')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={() => window.open(`/jobs/${j.slug}`, '_blank')} className="text-cream-dark/40 hover:text-cream h-8">
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => toggleFeatured(j.id, j.is_featured)} className="text-cream-dark/40 hover:text-gold h-8">
                                    {j.is_featured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                                </Button>
                                {j.status === 'active' && (
                                    <Button size="sm" variant="ghost" onClick={() => forceClose(j.id)} className="text-red-400/60 hover:text-red-400 h-8">
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
