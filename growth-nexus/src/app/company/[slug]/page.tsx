import { createClient } from '@/utils/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Building2, Globe, Users, MapPin, Briefcase, ExternalLink, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CompanyProfilePage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .single()

    if (!company) {
        notFound()
    }

    // Get company's active jobs
    const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title, slug, location_city, job_type, salary_min, salary_max, salary_currency, created_at, is_featured')
        .eq('company_id', company.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })

    const jobTypeLabels: Record<string, string> = {
        full_time: 'دوام كامل',
        part_time: 'دوام جزئي',
        contract: 'عقد',
        remote: 'عن بُعد',
        internship: 'تدريب',
    }

    return (
        <div className="min-h-screen bg-navy">
            {/* Company Header */}
            <div className="bg-gradient-to-b from-navy-lighter to-navy py-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    <Link href="/companies" className="text-gold hover:text-gold-light text-sm mb-6 inline-flex items-center gap-1 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        العودة لدليل الشركات
                    </Link>

                    <div className="flex flex-col md:flex-row items-start gap-6 mt-4">
                        <div className="h-20 w-20 rounded-2xl bg-navy border border-gold/15 flex items-center justify-center overflow-hidden shrink-0">
                            {company.logo_url ? (
                                <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 className="h-10 w-10 text-cream-dark/20" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-3xl font-bold text-cream">{company.name}</h1>
                                {company.is_verified && (
                                    <Badge className="bg-success/10 text-success border-success/20">
                                        ✓ شركة موثّقة
                                    </Badge>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-cream-dark/40">
                                {company.industry && (
                                    <span className="flex items-center gap-1.5">
                                        <Briefcase className="h-4 w-4" /> {company.industry}
                                    </span>
                                )}
                                {company.size_range && (
                                    <span className="flex items-center gap-1.5">
                                        <Users className="h-4 w-4" /> {company.size_range}
                                    </span>
                                )}
                                {company.website && (
                                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-gold hover:text-gold-light transition-colors">
                                        <Globe className="h-4 w-4" /> الموقع الإلكتروني
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {company.description && (
                        <Card className="bg-navy-light/50 border-gold/10 mt-8">
                            <CardContent className="p-6">
                                <h2 className="font-semibold text-cream mb-3">عن الشركة</h2>
                                <p className="text-cream-dark/50 leading-relaxed whitespace-pre-wrap">{company.description}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Jobs Section */}
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <h2 className="text-2xl font-bold text-cream mb-6">
                    الوظائف المتاحة
                    <span className="text-cream-dark/30 text-lg me-2"> ({jobs?.length || 0})</span>
                </h2>

                {jobs && jobs.length > 0 ? (
                    <div className="space-y-4">
                        {jobs.map((job) => (
                            <Link key={job.id} href={`/jobs/${job.slug}`}>
                                <Card className="bg-navy-light border-gold/10 hover:border-gold/20 transition-all hover:shadow-lg hover:shadow-navy/50 group mb-4">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-semibold text-cream group-hover:text-gold transition-colors">
                                                        {job.title}
                                                    </h3>
                                                    {job.is_featured && (
                                                        <Badge className="bg-gold/10 text-gold border-gold/30 text-[10px]">مميزة</Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-cream-dark/40">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" /> {job.location_city}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase className="h-3 w-3" /> {jobTypeLabels[job.job_type] || job.job_type}
                                                    </span>
                                                    {job.salary_min && (
                                                        <span className="text-gold/60">
                                                            {job.salary_min.toLocaleString()} - {job.salary_max?.toLocaleString()} {job.salary_currency || 'AED'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs text-cream-dark/30">
                                                {new Date(job.created_at).toLocaleDateString('ar-AE')}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Card className="bg-navy-light border-gold/10">
                        <CardContent className="p-12 text-center">
                            <Briefcase className="h-12 w-12 text-cream-dark/15 mx-auto mb-3" />
                            <p className="text-cream-dark/40">لا توجد وظائف متاحة حالياً</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
