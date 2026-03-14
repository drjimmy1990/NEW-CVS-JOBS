'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Heart, Loader2, MapPin, Briefcase, Building2, Trash2, Clock, DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

type SavedJob = {
    id: string
    created_at: string
    job: {
        id: string
        title: string
        slug: string
        location_city: string
        job_type: string
        salary_min: number | null
        salary_max: number | null
        salary_currency: string
        is_featured: boolean
        company: {
            name: string
            logo_url: string | null
        }
    }
}

const jobTypeLabels: Record<string, string> = {
    full_time: 'دوام كامل',
    part_time: 'دوام جزئي',
    contract: 'عقد',
    remote: 'عن بُعد',
    internship: 'تدريب',
}

export default function SavedJobsPage() {
    const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSavedJobs()
    }, [])

    const loadSavedJobs = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setLoading(false)
            return
        }

        const { data } = await supabase
            .from('saved_jobs')
            .select(`
                id,
                created_at,
                job:jobs (
                    id,
                    title,
                    slug,
                    location_city,
                    job_type,
                    salary_min,
                    salary_max,
                    salary_currency,
                    is_featured,
                    company:companies (
                        name,
                        logo_url
                    )
                )
            `)
            .eq('candidate_id', user.id)
            .order('created_at', { ascending: false })

        if (data) {
            setSavedJobs(data as unknown as SavedJob[])
        }
        setLoading(false)
    }

    const removeSaved = async (savedId: string) => {
        const supabase = createClient()
        await supabase.from('saved_jobs').delete().eq('id', savedId)
        setSavedJobs(prev => prev.filter(s => s.id !== savedId))
        toast.success('تم إزالة الوظيفة من المحفوظات')
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-cream">الوظائف المحفوظة</h1>
                    <p className="text-cream-dark/50 mt-1">
                        الوظائف التي حفظتها للرجوع إليها لاحقاً ({savedJobs.length})
                    </p>
                </div>
                <Link href="/jobs">
                    <Button className="bg-gold hover:bg-gold-dark text-navy font-bold">
                        <Briefcase className="me-2 h-4 w-4" />
                        تصفح الوظائف
                    </Button>
                </Link>
            </div>

            {savedJobs.length === 0 ? (
                <Card className="bg-navy-light border-gold/10">
                    <CardContent className="p-16 text-center">
                        <Heart className="h-16 w-16 text-cream-dark/15 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-cream mb-2">لم تحفظ أي وظائف بعد</h3>
                        <p className="text-cream-dark/40 mb-6">
                            تصفح الوظائف واضغط على ❤️ لحفظ ما يعجبك
                        </p>
                        <Link href="/jobs">
                            <Button className="bg-gold hover:bg-gold-dark text-navy font-bold">
                                ابدأ التصفح
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {savedJobs.map((saved) => (
                        <Card key={saved.id} className="bg-navy-light border-gold/10 hover:border-gold/20 transition-colors group">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-12 h-12 rounded-lg bg-navy border border-gold/10 flex items-center justify-center overflow-hidden shrink-0">
                                            {saved.job?.company?.logo_url ? (
                                                <img src={saved.job.company.logo_url} alt={saved.job.company.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Building2 className="h-6 w-6 text-cream-dark/20" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Link href={`/jobs/${saved.job?.slug}`} className="text-lg font-semibold text-cream hover:text-gold transition-colors">
                                                    {saved.job?.title}
                                                </Link>
                                                {saved.job?.is_featured && (
                                                    <Badge className="bg-gold/10 text-gold border-gold/30 text-[10px]">مميزة</Badge>
                                                )}
                                            </div>
                                            <p className="text-cream-dark/50 text-sm">{saved.job?.company?.name}</p>
                                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-cream-dark/30">
                                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {saved.job?.location_city}</span>
                                                <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {jobTypeLabels[saved.job?.job_type || ''] || saved.job?.job_type}</span>
                                                {saved.job?.salary_min && (
                                                    <span className="flex items-center gap-1 text-gold/60">
                                                        <DollarSign className="h-3 w-3" />
                                                        {saved.job.salary_min.toLocaleString()} - {saved.job.salary_max?.toLocaleString()} {saved.job.salary_currency}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> حُفظت {new Date(saved.created_at).toLocaleDateString('ar-AE')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeSaved(saved.id)}
                                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
