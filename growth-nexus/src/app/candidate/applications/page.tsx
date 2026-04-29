'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Briefcase,
    Loader2,
    MapPin,
    Clock,
    Building2,
    FileX
} from 'lucide-react'
import Link from 'next/link'

type ApplicationStatus = 'applied' | 'reviewing' | 'interview' | 'shortlisted' | 'rejected' | 'hired'

type Application = {
    id: string
    status: ApplicationStatus
    created_at: string
    interview_score: number | null
    job: {
        id: string
        title: string
        slug: string
        location_city: string
        job_type: string
        company: {
            name: string
            logo_url: string | null
        }
    }
}

const statusConfig: Record<ApplicationStatus, { label: string; color: string }> = {
    applied: { label: 'تم التقديم', color: 'bg-cream-dark/20 text-cream-dark/60 border-cream-dark/30' },
    reviewing: { label: 'قيد المراجعة', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
    interview: { label: 'مقابلة', color: 'bg-gold/20 text-gold border-gold/50' },
    shortlisted: { label: 'قائمة مختصرة', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
    rejected: { label: 'لم يُقبل', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
    hired: { label: 'تم التوظيف! 🎉', color: 'bg-success/20 text-success border-success/50' },
}

const jobTypeLabels: Record<string, string> = {
    full_time: 'دوام كامل',
    part_time: 'دوام جزئي',
    contract: 'عقد',
    remote: 'عن بُعد',
    internship: 'تدريب',
}

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all')

    useEffect(() => {
        loadApplications()
    }, [])

    const loadApplications = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setLoading(false)
            return
        }

        const { data } = await supabase
            .from('applications')
            .select(`
                id,
                status,
                created_at,
                interview_score,
                job:jobs (
                    id,
                    title,
                    slug,
                    location_city,
                    job_type,
                    company:companies (
                        name,
                        logo_url
                    )
                )
            `)
            .eq('candidate_id', user.id)
            .order('created_at', { ascending: false })

        if (data) {
            setApplications(data as unknown as Application[])
        }
        setLoading(false)
    }

    const filteredApplications = filter === 'all'
        ? applications
        : applications.filter(app => app.status === filter)

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('ar-AE', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-cream">طلباتي</h1>
                    <p className="text-cream-dark/50 mt-1">
                        تابع حالة طلبات التوظيف الخاصة بك
                    </p>
                </div>
                <Link href="/jobs">
                    <Button className="bg-gold hover:bg-gold-dark text-navy font-bold">
                        <Briefcase className="me-2 h-4 w-4" />
                        تصفح الوظائف
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'المجموع', value: applications.length, color: 'text-cream' },
                    { label: 'قيد المراجعة', value: applications.filter(a => ['reviewing', 'interview', 'shortlisted'].includes(a.status)).length, color: 'text-blue-400' },
                    { label: 'مقابلات', value: applications.filter(a => a.status === 'interview').length, color: 'text-gold' },
                    { label: 'عروض', value: applications.filter(a => a.status === 'hired').length, color: 'text-success' },
                ].map((stat, i) => (
                    <Card key={i} className="bg-navy-light border-gold/10">
                        <CardContent className="p-4 text-center">
                            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-sm text-cream-dark/40">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className={filter === 'all' ? 'bg-gold text-navy' : 'border-gold/15 text-cream-dark/50'}
                >
                    الكل
                </Button>
                {(Object.keys(statusConfig) as ApplicationStatus[]).map(status => (
                    <Button
                        key={status}
                        variant={filter === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(status)}
                        className={filter === status ? 'bg-gold text-navy' : 'border-gold/15 text-cream-dark/50'}
                    >
                        {statusConfig[status].label}
                    </Button>
                ))}
            </div>

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
                <Card className="bg-navy-light border-gold/10">
                    <CardContent className="p-12 text-center">
                        <FileX className="h-16 w-16 mx-auto text-cream-dark/20 mb-4" />
                        <h3 className="text-xl font-semibold text-cream mb-2">
                            لم يتم العثور على طلبات
                        </h3>
                        <p className="text-cream-dark/40 mb-6">
                            {filter === 'all'
                                ? 'لم تتقدم لأي وظيفة بعد.'
                                : `لا توجد طلبات بحالة "${statusConfig[filter as ApplicationStatus]?.label}"`}
                        </p>
                        <Link href="/jobs">
                            <Button className="bg-gold hover:bg-gold-dark text-navy font-bold">
                                ابحث عن وظائف
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredApplications.map(app => (
                        <Card key={app.id} className="bg-navy-light border-gold/10 hover:border-gold/20 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        {/* Company Logo */}
                                        <div className="w-12 h-12 rounded-lg bg-navy flex items-center justify-center overflow-hidden border border-gold/10">
                                            {app.job?.company?.logo_url ? (
                                                <img
                                                    src={app.job.company.logo_url}
                                                    alt={app.job.company.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Building2 className="h-6 w-6 text-cream-dark/30" />
                                            )}
                                        </div>

                                        {/* Job Info */}
                                        <div>
                                            <Link
                                                href={`/jobs/${app.job?.slug}`}
                                                className="text-lg font-semibold text-cream hover:text-gold transition-colors"
                                            >
                                                {app.job?.title}
                                            </Link>
                                            <p className="text-cream-dark/50">{app.job?.company?.name}</p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-cream-dark/30">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {app.job?.location_city}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="h-3 w-3" />
                                                    {jobTypeLabels[app.job?.job_type || ''] || app.job?.job_type}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(app.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Badge + Interview Button */}
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge className={statusConfig[app.status].color}>
                                            {statusConfig[app.status].label}
                                        </Badge>
                                        {app.status === 'interview' && (
                                            <Link href={`/candidate/interview/${app.id}`}>
                                                <Button size="sm" className={`text-xs font-bold ${app.interview_score != null ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gold hover:bg-gold-dark text-navy'}`}>
                                                    {app.interview_score != null ? `عرض نتيجة المقابلة (${app.interview_score}%)` : 'ابدأ المقابلة الآلية'}
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
