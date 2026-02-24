import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Search,
    MapPin,
    Briefcase,
    Clock,
    Building2,
    DollarSign,
    Filter,
    ChevronRight
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Find Jobs | GrowthNexus',
    description: 'Browse thousands of job opportunities. Find your dream job today on GrowthNexus - the AI-powered recruitment platform.',
    openGraph: {
        title: 'Find Jobs | GrowthNexus',
        description: 'Browse thousands of job opportunities on GrowthNexus',
    }
}

const typeLabels: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    remote: 'Remote',
    internship: 'Internship',
}

const typeColors: Record<string, string> = {
    full_time: 'bg-blue-500/20 text-blue-400',
    part_time: 'bg-purple-500/20 text-purple-400',
    contract: 'bg-orange-500/20 text-orange-400',
    remote: 'bg-green-500/20 text-green-400',
    internship: 'bg-pink-500/20 text-pink-400',
}

interface Props {
    searchParams: Promise<{ q?: string; type?: string; location?: string }>
}

export default async function JobsPage({ searchParams }: Props) {
    const params = await searchParams
    const supabase = await createClient()

    // Build query
    let query = supabase
        .from('jobs')
        .select(`
      *,
      companies (
        id,
        name,
        logo_url,
        slug
      )
    `)
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

    // Apply search filter
    if (params.q) {
        query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`)
    }

    // Apply job type filter
    if (params.type) {
        query = query.eq('job_type', params.type)
    }

    // Apply location filter
    if (params.location) {
        query = query.ilike('location', `%${params.location}%`)
    }

    const { data: jobs } = await query

    // Get unique locations for filter
    const { data: locations } = await supabase
        .from('jobs')
        .select('location')
        .eq('status', 'active')
        .not('location', 'is', null)

    const uniqueLocations = [...new Set(locations?.map(l => l.location).filter(Boolean))]

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

            {/* Hero Search Section */}
            <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Dream Job</span>
                        </h1>
                        <p className="text-slate-400 text-lg">
                            {jobs?.length || 0} jobs available • Updated daily
                        </p>
                    </div>

                    {/* Search Form */}
                    <form className="max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-3 p-2 bg-slate-800/50 rounded-xl border border-slate-700">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    name="q"
                                    defaultValue={params.q}
                                    placeholder="Job title, keywords..."
                                    className="pl-12 h-12 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                                />
                            </div>
                            <div className="flex-1 relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    name="location"
                                    defaultValue={params.location}
                                    placeholder="Location..."
                                    className="pl-12 h-12 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
                            >
                                <Search className="mr-2 h-5 w-5" />
                                Search
                            </Button>
                        </div>
                    </form>

                    {/* Quick Filters */}
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                        <Link href="/jobs">
                            <Badge
                                variant="outline"
                                className={`px-4 py-2 cursor-pointer ${!params.type ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-600 text-slate-400 hover:border-slate-500'}`}
                            >
                                All Jobs
                            </Badge>
                        </Link>
                        {Object.entries(typeLabels).map(([value, label]) => (
                            <Link key={value} href={`/jobs?type=${value}`}>
                                <Badge
                                    variant="outline"
                                    className={`px-4 py-2 cursor-pointer ${params.type === value ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-600 text-slate-400 hover:border-slate-500'}`}
                                >
                                    {label}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Jobs List */}
            <section className="container mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">
                        {params.q || params.type || params.location
                            ? `Search Results (${jobs?.length || 0})`
                            : `All Jobs (${jobs?.length || 0})`
                        }
                    </h2>
                </div>

                {jobs && jobs.length > 0 ? (
                    <div className="space-y-4">
                        {jobs.map((job: any) => (
                            <Link key={job.id} href={`/jobs/${job.slug}`}>
                                <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition-all cursor-pointer group">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            {/* Company Logo */}
                                            <div className="w-14 h-14 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                {job.companies?.logo_url ? (
                                                    <img
                                                        src={job.companies.logo_url}
                                                        alt={job.companies.name}
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <Building2 className="h-6 w-6 text-slate-500" />
                                                )}
                                            </div>

                                            {/* Job Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                                                                {job.title}
                                                            </h3>
                                                            {job.is_featured && (
                                                                <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                                                                    Featured
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-slate-400 text-sm">
                                                            {job.is_confidential ? 'Confidential Company' : job.companies?.name}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 mt-3">
                                                    <Badge className={typeColors[job.job_type] || 'bg-slate-500/20 text-slate-400'}>
                                                        {typeLabels[job.job_type] || job.job_type}
                                                    </Badge>

                                                    {job.location && (
                                                        <span className="flex items-center gap-1 text-sm text-slate-400">
                                                            <MapPin className="h-4 w-4" />
                                                            {job.location}
                                                        </span>
                                                    )}

                                                    {job.salary_range && (
                                                        <span className="flex items-center gap-1 text-sm text-slate-400">
                                                            <DollarSign className="h-4 w-4" />
                                                            {job.salary_range}
                                                        </span>
                                                    )}

                                                    <span className="flex items-center gap-1 text-sm text-slate-500">
                                                        <Clock className="h-4 w-4" />
                                                        {new Date(job.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="py-16 text-center">
                            <Briefcase className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
                            <p className="text-slate-400 mb-6">
                                {params.q || params.type || params.location
                                    ? 'Try adjusting your search filters'
                                    : 'Be the first to post a job!'
                                }
                            </p>
                            <Link href="/register">
                                <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white">
                                    Post a Job
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-8 mt-12">
                <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
                    © 2026 GrowthNexus. All rights reserved.
                </div>
            </footer>
        </div>
    )
}
