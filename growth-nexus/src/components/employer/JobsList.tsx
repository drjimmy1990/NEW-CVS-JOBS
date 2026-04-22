'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, Users, MoreHorizontal, Edit, Trash2, Archive, ExternalLink, Pause, Play, Copy, Share2, ArrowUpDown, Filter } from 'lucide-react'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'

const statusColors: Record<string, string> = {
    draft: 'bg-cream-dark/15 text-cream-dark/60',
    active: 'bg-success/15 text-success',
    paused: 'bg-gold/15 text-gold',
    expired: 'bg-orange-500/20 text-orange-400',
    closed: 'bg-red-500/20 text-red-400',
    archived: 'bg-cream-dark/10 text-cream-dark/40',
}

const statusLabels: Record<string, string> = {
    draft: 'مسودة',
    active: 'نشط',
    paused: 'متوقف',
    expired: 'منتهي',
    closed: 'مغلق',
    archived: 'مؤرشف',
}

const typeLabels: Record<string, string> = {
    full_time: 'دوام كامل',
    part_time: 'دوام جزئي',
    contract: 'عقد مؤقت',
    remote: 'عن بعد',
    internship: 'تدريب',
}

type FilterStatus = 'all' | 'active' | 'paused' | 'draft' | 'closed'
type SortBy = 'newest' | 'oldest' | 'most_applicants'

interface Job {
    id: string; title: string; slug: string; status: string; job_type: string
    location_city?: string; salary_min?: number; salary_max?: number; currency?: string
    is_confidential: boolean; is_featured: boolean; views_count: number
    created_at: string; applicant_count: number; expires_at?: string
}

interface JobsListProps { jobs: Job[] }

export function JobsList({ jobs: initialJobs }: JobsListProps) {
    const router = useRouter()
    const supabase = createClient()
    const [jobs, setJobs] = useState(initialJobs)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [jobToDelete, setJobToDelete] = useState<Job | null>(null)
    const [loading, setLoading] = useState(false)
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
    const [sortBy, setSortBy] = useState<SortBy>('newest')

    const filteredAndSorted = useMemo(() => {
        let result = [...jobs]
        if (filterStatus !== 'all') result = result.filter(j => j.status === filterStatus)
        result.sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            return b.applicant_count - a.applicant_count
        })
        return result
    }, [jobs, filterStatus, sortBy])

    const handleStatusUpdate = async (job: Job, newStatus: string) => {
        setLoading(true)
        const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', job.id)
        if (error) { toast.error('فشل تحديث الحالة') } else {
            toast.success('تم تحديث الحالة بنجاح')
            setJobs(jobs.map(j => j.id === job.id ? { ...j, status: newStatus } : j))
        }
        setLoading(false)
    }

    const handleDuplicate = async (job: Job) => {
        setLoading(true)
        const { data: original } = await supabase.from('jobs').select('*').eq('id', job.id).single()
        if (!original) { toast.error('لم يتم العثور على الوظيفة'); setLoading(false); return }
        const { id, created_at, updated_at, views_count, applicants_count, search_vector, ...rest } = original
        const { error } = await supabase.from('jobs').insert({
            ...rest, slug: rest.slug + '-copy-' + Date.now(), title: rest.title + ' (نسخة)',
            status: 'draft', views_count: 0, applicants_count: 0,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        if (error) { toast.error('فشل نسخ الوظيفة') } else { toast.success('تم نسخ الوظيفة كمسودة'); router.refresh() }
        setLoading(false)
    }

    const handleShare = (job: Job) => {
        const url = `${window.location.origin}/jobs/${job.slug}`
        navigator.clipboard.writeText(url)
        toast.success('تم نسخ الرابط!')
    }

    const handleDelete = async () => {
        if (!jobToDelete) return
        setLoading(true)
        const { error } = await supabase.from('jobs').delete().eq('id', jobToDelete.id)
        if (error) { toast.error('فشل حذف الوظيفة') } else {
            toast.success('تم حذف الوظيفة')
            setJobs(jobs.filter(j => j.id !== jobToDelete.id))
        }
        setJobToDelete(null); setDeleteDialogOpen(false); setLoading(false)
    }

    const filterButtons: { value: FilterStatus; label: string }[] = [
        { value: 'all', label: 'الكل' }, { value: 'active', label: 'نشط' }, { value: 'paused', label: 'متوقف' },
        { value: 'draft', label: 'مسودة' }, { value: 'closed', label: 'مغلق' },
    ]

    return (
        <>
            {/* Filter & Sort Bar */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2" dir="rtl">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-cream-dark/40" />
                    {filterButtons.map(f => (
                        <button key={f.value} onClick={() => setFilterStatus(f.value)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${filterStatus === f.value ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-navy-lighter text-cream-dark/50 border border-gold/5 hover:border-gold/15'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="border-gold/10 text-cream-dark/60 hover:bg-navy-lighter">
                            <ArrowUpDown className="me-2 h-4 w-4" />ترتيب
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-navy-light border-gold/10">
                        <DropdownMenuItem className="text-cream-dark hover:bg-navy-lighter cursor-pointer" onClick={() => setSortBy('newest')}>الأحدث</DropdownMenuItem>
                        <DropdownMenuItem className="text-cream-dark hover:bg-navy-lighter cursor-pointer" onClick={() => setSortBy('oldest')}>الأقدم</DropdownMenuItem>
                        <DropdownMenuItem className="text-cream-dark hover:bg-navy-lighter cursor-pointer" onClick={() => setSortBy('most_applicants')}>الأكثر متقدمين</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="space-y-4">
                {filteredAndSorted.length === 0 && (
                    <Card className="bg-navy-light border-gold/10"><CardContent className="py-12 text-center"><p className="text-cream-dark/40">لا توجد وظائف في هذا التصنيف</p></CardContent></Card>
                )}
                {filteredAndSorted.map((job) => (
                    <Card key={job.id} className="bg-navy-light border-gold/10 hover:border-gold/20 transition-colors">
                        <CardContent className="p-6" dir="rtl">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-cream">{job.title}</h3>
                                        <Badge className={statusColors[job.status] || statusColors.draft}>{statusLabels[job.status] || job.status}</Badge>
                                        {job.is_confidential && <Badge variant="outline" className="border-gold/30 text-gold">سري</Badge>}
                                        {job.is_featured && <Badge variant="outline" className="border-success/30 text-success">مميز</Badge>}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-cream-dark/50 mb-3">
                                        <span>{job.location_city || 'غير محدد'}</span><span>•</span>
                                        <span>{typeLabels[job.job_type] || job.job_type}</span>
                                        {job.salary_min && (<><span>•</span><span>{job.salary_min.toLocaleString()}{job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : '+'} درهم</span></>)}
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <Link href={`/employer/jobs/${job.id}/applicants`} className="flex items-center gap-2 text-sm hover:text-success transition-colors">
                                            <Users className="h-4 w-4 text-success" /><span className="text-cream-dark/70">{job.applicant_count} متقدم</span>
                                        </Link>
                                        <div className="flex items-center gap-2 text-sm"><Eye className="h-4 w-4 text-gold" /><span className="text-cream-dark/70">{job.views_count || 0} مشاهدة</span></div>
                                        <span className="text-xs text-cream-dark/30">نُشر {new Date(job.created_at).toLocaleDateString('ar-AE')}</span>
                                        {job.expires_at && <span className="text-xs text-cream-dark/30">آخر يوم للتقديم: {new Date(job.expires_at).toLocaleDateString('ar-AE')}</span>}
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-cream-dark/40 hover:text-cream"><MoreHorizontal className="h-5 w-5" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-navy-light border-gold/10">
                                        <DropdownMenuItem className="text-cream-dark hover:bg-navy-lighter cursor-pointer" onClick={() => window.open(`/jobs/${job.slug}`, '_blank')}>
                                            <ExternalLink className="me-2 h-4 w-4" />عرض الصفحة العامة
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/employer/jobs/${job.id}/applicants`} className="text-cream-dark hover:bg-navy-lighter cursor-pointer flex items-center">
                                                <Users className="me-2 h-4 w-4" />عرض المتقدمين ({job.applicant_count})
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-gold/10" />
                                        <DropdownMenuItem asChild>
                                            <Link href={`/employer/jobs/${job.id}/edit`} className="text-cream-dark hover:bg-navy-lighter cursor-pointer flex items-center">
                                                <Edit className="me-2 h-4 w-4" />تعديل
                                            </Link>
                                        </DropdownMenuItem>
                                        {job.status === 'active' && (
                                            <DropdownMenuItem className="text-cream-dark hover:bg-navy-lighter cursor-pointer" onClick={() => handleStatusUpdate(job, 'paused')} disabled={loading}>
                                                <Pause className="me-2 h-4 w-4" />إيقاف مؤقت
                                            </DropdownMenuItem>
                                        )}
                                        {job.status === 'paused' && (
                                            <DropdownMenuItem className="text-cream-dark hover:bg-navy-lighter cursor-pointer" onClick={() => handleStatusUpdate(job, 'active')} disabled={loading}>
                                                <Play className="me-2 h-4 w-4" />استئناف
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem className="text-cream-dark hover:bg-navy-lighter cursor-pointer" onClick={() => handleDuplicate(job)} disabled={loading}>
                                            <Copy className="me-2 h-4 w-4" />نسخ الوظيفة
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-cream-dark hover:bg-navy-lighter cursor-pointer" onClick={() => handleShare(job)}>
                                            <Share2 className="me-2 h-4 w-4" />مشاركة الرابط
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-gold/10" />
                                        <DropdownMenuItem className="text-cream-dark hover:bg-navy-lighter cursor-pointer" onClick={() => handleStatusUpdate(job, job.status === 'archived' ? 'active' : 'archived')} disabled={loading}>
                                            <Archive className="me-2 h-4 w-4" />{job.status === 'archived' ? 'استعادة' : 'أرشفة'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-400 hover:bg-navy-lighter cursor-pointer" onClick={() => { setJobToDelete(job); setDeleteDialogOpen(true) }} disabled={loading}>
                                            <Trash2 className="me-2 h-4 w-4" />حذف
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-navy-light border-gold/10" dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-cream">حذف إعلان الوظيفة؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-cream-dark/50">
                            سيتم حذف &quot;{jobToDelete?.title}&quot; وجميع الطلبات المرتبطة نهائياً. لا يمكن التراجع.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogCancel className="bg-navy-lighter border-gold/10 text-cream hover:bg-navy">إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
                            {loading ? 'جاري الحذف...' : 'حذف الوظيفة'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
