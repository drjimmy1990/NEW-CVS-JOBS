'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
    Search, Loader2, Eye, Trash2, Star, StarOff,
    Globe, ExternalLink, MousePointerClick, Power, PowerOff,
    Link2
} from 'lucide-react'

const accessLabels: Record<string, string> = {
    public: 'عام',
    registered: 'مسجلين فقط',
    premium: 'مدفوع',
}
const accessColors: Record<string, string> = {
    public: 'bg-green-500/15 text-green-400',
    registered: 'bg-blue-500/15 text-blue-400',
    premium: 'bg-gold/15 text-gold',
}

const platformIcons: Record<string, string> = {
    linkedin: '🔗',
    bayt: '🏢',
    gulftalen: '🌴',
    indeed: '📋',
    glassdoor: '🪟',
}

export default function AdminExternalJobsPage() {
    const supabase = createClient()
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterAccess, setFilterAccess] = useState('all')
    const [filterSource, setFilterSource] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')

    useEffect(() => { loadJobs() }, [])

    const loadJobs = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('external_jobs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200)
        setJobs(data || [])
        setLoading(false)
    }

    const updateJob = async (id: string, updates: Record<string, any>) => {
        const { error } = await supabase.from('external_jobs').update(updates).eq('id', id)
        if (error) {
            toast.error('فشل التحديث: ' + error.message)
        } else {
            toast.success('تم التحديث')
            setJobs(jobs.map(j => j.id === id ? { ...j, ...updates } : j))
        }
    }

    const deleteJob = async (id: string) => {
        if (!confirm('هل تريد حذف هذه الوظيفة الخارجية؟')) return
        const { error } = await supabase.from('external_jobs').delete().eq('id', id)
        if (error) {
            toast.error('فشل الحذف')
        } else {
            toast.success('تم الحذف')
            setJobs(jobs.filter(j => j.id !== id))
        }
    }

    // Get unique source platforms for filter
    const sources = [...new Set(jobs.map(j => j.source_platform))].filter(Boolean)

    const filtered = jobs.filter(j => {
        if (filterAccess !== 'all' && j.access_level !== filterAccess) return false
        if (filterSource !== 'all' && j.source_platform !== filterSource) return false
        if (filterStatus === 'active' && !j.is_active) return false
        if (filterStatus === 'inactive' && j.is_active) return false
        if (filterStatus === 'expired' && (!j.expires_at || new Date(j.expires_at) > new Date())) return false
        if (search) {
            return (
                (j.title || '').toLowerCase().includes(search.toLowerCase()) ||
                (j.company_name || '').toLowerCase().includes(search.toLowerCase())
            )
        }
        return true
    })

    // Stats
    const totalActive = jobs.filter(j => j.is_active).length
    const totalClicks = jobs.reduce((sum, j) => sum + (j.clicks_count || 0), 0)
    const totalViews = jobs.reduce((sum, j) => sum + (j.views_count || 0), 0)

    if (loading) return (
        <div className="flex items-center gap-2 text-cream-dark/50">
            <Loader2 className="h-5 w-5 animate-spin" />جاري التحميل...
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-cream">الوظائف الخارجية</h1>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-cream-dark/40">
                        <Globe className="inline h-4 w-4 me-1" />{totalActive} نشط
                    </span>
                    <span className="text-cream-dark/40">
                        <MousePointerClick className="inline h-4 w-4 me-1" />{totalClicks} نقرة
                    </span>
                    <span className="text-cream-dark/40">
                        <Eye className="inline h-4 w-4 me-1" />{totalViews} مشاهدة
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-dark/30" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="بحث عن وظيفة أو شركة..."
                        className="bg-navy-lighter border-gold/10 text-cream pr-10"
                    />
                </div>

                {/* Access Level Filter */}
                <select
                    value={filterAccess}
                    onChange={e => setFilterAccess(e.target.value)}
                    className="px-3 py-1.5 rounded-xl text-sm bg-navy-lighter text-cream-dark/60 border border-gold/10 outline-none"
                >
                    <option value="all">كل المستويات</option>
                    <option value="public">عام</option>
                    <option value="registered">مسجلين</option>
                    <option value="premium">مدفوع</option>
                </select>

                {/* Source Platform Filter */}
                <select
                    value={filterSource}
                    onChange={e => setFilterSource(e.target.value)}
                    className="px-3 py-1.5 rounded-xl text-sm bg-navy-lighter text-cream-dark/60 border border-gold/10 outline-none"
                >
                    <option value="all">كل المصادر</option>
                    {sources.map(s => (
                        <option key={s} value={s}>{platformIcons[s] || '🔗'} {s}</option>
                    ))}
                </select>

                {/* Status Filter */}
                {['all', 'active', 'inactive', 'expired'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilterStatus(f)}
                        className={`px-3 py-1.5 rounded-full text-sm ${filterStatus === f
                                ? 'bg-gold/20 text-gold border border-gold/30'
                                : 'bg-navy-lighter text-cream-dark/40 border border-gold/5'
                            }`}
                    >
                        {f === 'all' ? 'الكل' : f === 'active' ? 'نشط' : f === 'inactive' ? 'متوقف' : 'منتهي'}
                    </button>
                ))}
            </div>

            {/* Results count */}
            <p className="text-cream-dark/40 text-sm">{filtered.length} وظيفة</p>

            {/* Jobs List */}
            <div className="space-y-2">
                {filtered.map(j => (
                    <Card key={j.id} className="bg-navy-light border-gold/10">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-lg">{platformIcons[j.source_platform] || '🔗'}</span>
                                        <p className="text-cream text-sm font-medium truncate">{j.title}</p>
                                        <Badge className={accessColors[j.access_level] || 'bg-cream-dark/15 text-cream-dark/50'}>
                                            {accessLabels[j.access_level] || j.access_level}
                                        </Badge>
                                        {j.is_featured && <Badge className="bg-gold/15 text-gold">مميز</Badge>}
                                        {!j.is_active && <Badge className="bg-red-500/15 text-red-400">متوقف</Badge>}
                                        {j.expires_at && new Date(j.expires_at) < new Date() && (
                                            <Badge className="bg-orange-500/15 text-orange-400">منتهي</Badge>
                                        )}
                                    </div>
                                    <p className="text-cream-dark/40 text-xs">
                                        {j.company_name || 'غير محدد'} • {j.location_city || '-'} •
                                        {' '}{j.source_platform} •
                                        {' '}<MousePointerClick className="inline h-3 w-3" /> {j.clicks_count || 0} نقرة •
                                        {' '}<Eye className="inline h-3 w-3" /> {j.views_count || 0} مشاهدة •
                                        {' '}{new Date(j.created_at).toLocaleDateString('ar-AE')}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {/* Access Level Dropdown */}
                                    <select
                                        value={j.access_level}
                                        onChange={e => updateJob(j.id, { access_level: e.target.value })}
                                        className="px-2 py-1 rounded text-xs bg-navy border border-gold/10 text-cream-dark/60 outline-none"
                                    >
                                        <option value="public">عام</option>
                                        <option value="registered">مسجلين</option>
                                        <option value="premium">مدفوع</option>
                                    </select>

                                    {/* View Source */}
                                    <Button size="sm" variant="ghost"
                                        onClick={() => window.open(j.source_url, '_blank')}
                                        className="text-cream-dark/40 hover:text-cream h-8" title="عرض المصدر">
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>

                                    {/* View on site */}
                                    <Button size="sm" variant="ghost"
                                        onClick={() => window.open(`/jobs/external/${j.slug}`, '_blank')}
                                        className="text-cream-dark/40 hover:text-cream h-8" title="عرض على الموقع">
                                        <Link2 className="h-4 w-4" />
                                    </Button>

                                    {/* Toggle Featured */}
                                    <Button size="sm" variant="ghost"
                                        onClick={() => updateJob(j.id, { is_featured: !j.is_featured })}
                                        className="text-cream-dark/40 hover:text-gold h-8" title="تمييز">
                                        {j.is_featured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                                    </Button>

                                    {/* Toggle Active */}
                                    <Button size="sm" variant="ghost"
                                        onClick={() => updateJob(j.id, { is_active: !j.is_active })}
                                        className={`h-8 ${j.is_active ? 'text-green-400/60 hover:text-red-400' : 'text-red-400/60 hover:text-green-400'}`}
                                        title={j.is_active ? 'إيقاف' : 'تفعيل'}>
                                        {j.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                    </Button>

                                    {/* Delete */}
                                    <Button size="sm" variant="ghost"
                                        onClick={() => deleteJob(j.id)}
                                        className="text-red-400/40 hover:text-red-400 h-8" title="حذف">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filtered.length === 0 && (
                    <Card className="bg-navy-light border-gold/10">
                        <CardContent className="py-12 text-center">
                            <Globe className="h-12 w-12 text-cream-dark/20 mx-auto mb-3" />
                            <p className="text-cream-dark/40">لا توجد وظائف خارجية بعد</p>
                            <p className="text-cream-dark/30 text-sm mt-1">استخدم n8n لاستيراد وظائف من LinkedIn وغيرها</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
