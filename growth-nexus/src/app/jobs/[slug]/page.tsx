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
    CheckCircle,
    Zap
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

    // Increment view count atomically
    await supabase.rpc('increment_job_views', { job_id_input: job.id }).then()

    const company = job.companies as any

    return (
        <div className="min-h-screen bg-slate-950">

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
                                            {job.views_count || 0} views
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
                        <Card className="bg-slate-900 border-slate-800 shadow-xl shadow-emerald-500/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-md z-10 flex items-center gap-1">
                                Match Score: 86%
                            </div>
                            <CardContent className="p-6 pt-8 text-center flex flex-col items-center">
                                <h3 className="text-xl font-bold text-white mb-2">Ready to Apply?</h3>
                                <div className="text-sm text-slate-400 mb-6 flex items-center gap-2 justify-center w-full">
                                    <Users className="h-4 w-4" />
                                    <span>Applicants: 86 candidates</span>
                                </div>
                                
                                <ApplyButton
                                    jobId={job.id}
                                    jobTitle={job.title}
                                    companyName={job.is_confidential ? 'Confidential Company' : company?.name || 'Company'}
                                    className="w-full h-12 text-base font-semibold bg-white text-slate-900 hover:bg-slate-200 mb-3"
                                >
                                    Apply Now
                                </ApplyButton>
                                
                                <Button className="w-full grid h-12 text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20">
                                    Apply with Priority — 5 AED
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Auto Apply Upsell */}
                        <Card className="bg-gradient-to-b from-slate-900 to-slate-900/50 border-emerald-500/20">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-emerald-400 text-lg flex items-center gap-2">
                                    <div className="p-1.5 rounded-md bg-emerald-500/20">
                                        <Zap className="h-4 w-4" />
                                    </div>
                                    Auto Apply Service
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-slate-300">
                                    Send your CV automatically to similar matching jobs. Don't miss out on high-competition roles!
                                </p>
                                <div className="space-y-2">
                                    <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-emerald-500 hover:bg-slate-800 transition-colors text-left group">
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium group-hover:text-emerald-400 transition-colors">Basic</span>
                                            <span className="text-xs text-slate-400">Up to 30 jobs</span>
                                        </div>
                                        <span className="font-bold text-white">49 AED</span>
                                    </button>
                                    <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:border-emerald-500 hover:bg-slate-800 transition-colors text-left group">
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium group-hover:text-emerald-400 transition-colors">Advanced</span>
                                            <span className="text-xs text-slate-400">Up to 100 jobs</span>
                                        </div>
                                        <span className="font-bold text-white">99 AED</span>
                                    </button>
                                    <button className="w-full flex items-center justify-between p-3 rounded-lg border border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10 transition-colors text-left group">
                                        <div className="flex flex-col">
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold">Pro</span>
                                            <span className="text-xs text-emerald-400/80">Unlimited (30 days)</span>
                                        </div>
                                        <span className="font-bold text-emerald-400">149 AED</span>
                                    </button>
                                </div>
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
                
                {/* Similar Jobs Section */}
                <div className="mt-16">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Similar Jobs</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group">
                            <CardContent className="p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                                    78% Match
                                </div>
                                <h4 className="font-semibold text-white group-hover:text-emerald-400 transition-colors mt-2">Marketing Coordinator</h4>
                                <p className="text-sm text-slate-400 mb-3">Tech Visionaries LLC • Dubai</p>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="border-slate-700 text-slate-300">Full Time</Badge>
                                    <Badge variant="outline" className="border-slate-700 text-slate-300">Mid Level</Badge>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group">
                            <CardContent className="p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                                    73% Match
                                </div>
                                <h4 className="font-semibold text-white group-hover:text-emerald-400 transition-colors mt-2">Sales Executive</h4>
                                <p className="text-sm text-slate-400 mb-3">Global Trade Inc • Abu Dhabi</p>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="border-slate-700 text-slate-300">Full Time</Badge>
                                    <Badge variant="outline" className="border-slate-700 text-slate-300">Entry Level</Badge>
                                </div>
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
