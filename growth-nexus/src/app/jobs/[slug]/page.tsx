import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ApplyButton } from '@/components/candidate/ApplyButton'
import {
    MapPin,
    Clock,
    Building2,
    DollarSign,
    Briefcase,
    Users,
    Globe,
    ArrowLeft,
    Share2,
    Heart,
    CheckCircle
} from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
    params: Promise<{ slug: string }>
}

const typeLabels: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    remote: 'Remote',
    internship: 'Internship',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const supabase = await createClient()

    const { data: job } = await supabase
        .from('jobs')
        .select('title, description, location, companies(name)')
        .eq('slug', slug)
        .single()

    if (!job) {
        return { title: 'Job Not Found' }
    }

    const companyName = (job as any).companies?.name || 'Company'

    return {
        title: `${job.title} at ${companyName} | GrowthNexus`,
        description: job.description?.slice(0, 160) || `Apply for ${job.title} position at ${companyName}`,
        openGraph: {
            title: `${job.title} at ${companyName}`,
            description: job.description?.slice(0, 160),
        }
    }
}

export default async function JobDetailPage({ params }: Props) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: job } = await supabase
        .from('jobs')
        .select(`
      *,
      companies (
        id,
        name,
        logo_url,
        slug,
        website,
        description,
        industry,
        size_range
      )
    `)
        .eq('slug', slug)
        .single()

    if (!job) {
        notFound()
    }

    // Increment view count
    await supabase
        .from('jobs')
        .update({ view_count: (job.view_count || 0) + 1 })
        .eq('id', job.id)

    const company = job.companies as any

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                            <span className="text-xl font-bold text-white">G</span>
                        </div>
                        <span className="text-xl font-bold text-white">GrowthNexus</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost" className="text-slate-300 hover:text-white">
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white">
                                Post a Job
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {/* Back Link */}
                <Link
                    href="/jobs"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Jobs
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Job Header */}
                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                                        {company?.logo_url ? (
                                            <img
                                                src={company.logo_url}
                                                alt={company.name}
                                                className="w-full h-full object-cover rounded-xl"
                                            />
                                        ) : (
                                            <Building2 className="h-8 w-8 text-slate-500" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h1 className="text-2xl font-bold text-white mb-1">{job.title}</h1>
                                                <p className="text-slate-400">
                                                    {job.is_confidential ? 'Confidential Company' : company?.name}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                                    <Heart className="h-5 w-5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                                    <Share2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 mt-4">
                                            <Badge className="bg-blue-500/20 text-blue-400">
                                                {typeLabels[job.job_type] || job.job_type}
                                            </Badge>
                                            {job.is_featured && (
                                                <Badge className="bg-yellow-500/20 text-yellow-400">Featured</Badge>
                                            )}
                                            {job.location_city && (
                                                <span className="flex items-center gap-1 text-sm text-slate-400">
                                                    <MapPin className="h-4 w-4" />
                                                    {job.location_city}
                                                </span>
                                            )}
                                            {job.salary_min && (
                                                <span className="flex items-center gap-1 text-sm text-slate-400">
                                                    <DollarSign className="h-4 w-4" />
                                                    {job.currency || 'SAR'} {job.salary_min.toLocaleString()}{job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : '+'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-6 bg-slate-800" />

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6 text-sm text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            Posted {new Date(job.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            {job.view_count || 0} views
                                        </span>
                                    </div>
                                    <ApplyButton
                                        jobId={job.id}
                                        jobTitle={job.title}
                                        companyName={job.is_confidential ? 'Confidential Company' : company?.name || 'Company'}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Job Description */}
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white">Job Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-invert prose-slate max-w-none">
                                    <div className="text-slate-300 whitespace-pre-wrap">
                                        {job.description || 'No description provided.'}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Requirements */}
                        {job.requirements && (
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-white">Requirements</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-slate-300 whitespace-pre-wrap">
                                        {job.requirements}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Apply Card */}
                        <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
                            <CardContent className="p-6 text-center">
                                <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-white mb-2">Ready to Apply?</h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    Submit your application and get noticed
                                </p>
                                <ApplyButton
                                    jobId={job.id}
                                    jobTitle={job.title}
                                    companyName={job.is_confidential ? 'Confidential Company' : company?.name || 'Company'}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
                                >
                                    Apply for this Job
                                </ApplyButton>
                            </CardContent>
                        </Card>

                        {/* Company Info */}
                        {!job.is_confidential && company && (
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-white text-lg">About the Company</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                                            {company.logo_url ? (
                                                <img
                                                    src={company.logo_url}
                                                    alt={company.name}
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            ) : (
                                                <Building2 className="h-6 w-6 text-slate-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white">{company.name}</h4>
                                            {company.industry && (
                                                <p className="text-sm text-slate-400">{company.industry}</p>
                                            )}
                                        </div>
                                    </div>

                                    {company.description && (
                                        <p className="text-sm text-slate-400 line-clamp-3">
                                            {company.description}
                                        </p>
                                    )}

                                    <div className="space-y-2 text-sm">
                                        {company.size_range && (
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Users className="h-4 w-4" />
                                                {company.size_range}
                                            </div>
                                        )}
                                        {company.website && (
                                            <a
                                                href={company.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
                                            >
                                                <Globe className="h-4 w-4" />
                                                Visit Website
                                            </a>
                                        )}
                                    </div>

                                    <Link href={`/company/${company.slug}`}>
                                        <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                                            View Company Profile
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                        {/* Job Details */}
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-white text-lg">Job Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {job.experience_level && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Experience</span>
                                        <span className="text-white">{job.experience_level}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Job Type</span>
                                    <span className="text-white">{typeLabels[job.job_type]}</span>
                                </div>
                                {job.location_city && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Location</span>
                                        <span className="text-white">{job.location_city}</span>
                                    </div>
                                )}
                                {job.salary_min && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Salary</span>
                                        <span className="text-white">{job.currency || 'SAR'} {job.salary_min.toLocaleString()}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-8 mt-12">
                <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
                    © 2026 GrowthNexus. All rights reserved.
                </div>
            </footer>
        </div>
    )
}
