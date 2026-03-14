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
import { JobCard } from '@/components/ui/job-card'
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
    
    // Get current user for match score visibility
    const { data: { user } } = await supabase.auth.getUser()

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

            {/* Hero Search Section */}
            <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 border-b border-slate-800">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Dream Job</span>
                        </h1>
                    </div>

                    {/* Search Form */}
                    <form className="max-w-5xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-3 p-2 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl shadow-emerald-500/10">
                            <div className="flex-[1.5] relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    name="q"
                                    defaultValue={params.q}
                                    placeholder="Job Title / Keywords"
                                    className="pl-12 h-14 bg-slate-900/50 border-transparent focus-visible:ring-1 focus-visible:ring-emerald-500 text-white placeholder:text-slate-500 rounded-xl"
                                />
                            </div>
                            <div className="flex-1 relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    name="location"
                                    defaultValue={params.location}
                                    placeholder="Location (City / Emirate)"
                                    className="pl-12 h-14 bg-slate-900/50 border-transparent focus-visible:ring-1 focus-visible:ring-emerald-500 text-white placeholder:text-slate-500 rounded-xl"
                                />
                            </div>
                            <div className="flex-1 relative">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <select
                                    name="type"
                                    defaultValue={params.type || ""}
                                    className="w-full pl-12 h-14 bg-slate-900/50 border-transparent focus-visible:ring-1 focus-visible:ring-emerald-500 text-white rounded-xl appearance-none outline-none"
                                >
                                    <option value="" className="bg-slate-900 text-slate-400">All Job Types</option>
                                    <option value="full_time" className="bg-slate-900">Full Time</option>
                                    <option value="part_time" className="bg-slate-900">Part Time</option>
                                    <option value="contract" className="bg-slate-900">Contract</option>
                                    <option value="remote" className="bg-slate-900">Remote</option>
                                    <option value="internship" className="bg-slate-900">Internship</option>
                                </select>
                            </div>
                            <Button
                                type="submit"
                                className="h-14 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/25 transition-all w-full md:w-auto font-medium text-lg"
                            >
                                Search Jobs
                            </Button>
                        </div>
                        <p className="text-slate-400 text-sm mt-4 text-center">
                            Over 3,200 jobs available across the UAE
                        </p>
                    </form>
                </div>
            </section>

            {/* Main Content Area: Sidebar + Jobs List */}
            <section className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8">
                
                {/* Sidebar Filters */}
                <aside className="w-full lg:w-1/4 space-y-8">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Location</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 text-slate-300">
                                <input type="checkbox" className="form-checkbox bg-slate-900 border-slate-700 text-emerald-500 rounded focus:ring-emerald-500 focus:ring-offset-slate-950" />
                                Dubai
                            </label>
                            <label className="flex items-center gap-3 text-slate-300">
                                <input type="checkbox" className="form-checkbox bg-slate-900 border-slate-700 text-emerald-500 rounded focus:ring-emerald-500 focus:ring-offset-slate-950" />
                                Abu Dhabi
                            </label>
                            <label className="flex items-center gap-3 text-slate-300">
                                <input type="checkbox" className="form-checkbox bg-slate-900 border-slate-700 text-emerald-500 rounded focus:ring-emerald-500 focus:ring-offset-slate-950" />
                                Sharjah
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Industry</h3>
                        <select className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 focus-visible:ring-1 focus-visible:ring-emerald-500 outline-none appearance-none">
                            <option value="">All Industries</option>
                            <option value="tech">Technology</option>
                            <option value="finance">Finance & Banking</option>
                            <option value="healthcare">Healthcare</option>
                            <option value="marketing">Marketing</option>
                        </select>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Experience Level</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 text-slate-300">
                                <input type="checkbox" className="form-checkbox bg-slate-900 border-slate-700 text-emerald-500 rounded focus:ring-emerald-500 focus:ring-offset-slate-950" />
                                Entry Level (0-2 years)
                            </label>
                            <label className="flex items-center gap-3 text-slate-300">
                                <input type="checkbox" className="form-checkbox bg-slate-900 border-slate-700 text-emerald-500 rounded focus:ring-emerald-500 focus:ring-offset-slate-950" />
                                Mid Level (3-5 years)
                            </label>
                            <label className="flex items-center gap-3 text-slate-300">
                                <input type="checkbox" className="form-checkbox bg-slate-900 border-slate-700 text-emerald-500 rounded focus:ring-emerald-500 focus:ring-offset-slate-950" />
                                Senior Level (5+ years)
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Salary Range</h3>
                        <select className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 focus-visible:ring-1 focus-visible:ring-emerald-500 outline-none appearance-none">
                            <option value="">Any Range</option>
                            <option value="0-5000">Up to 5,000 AED</option>
                            <option value="5000-10000">5,000 - 10,000 AED</option>
                            <option value="10000+">10,000+ AED</option>
                        </select>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Job Type</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 text-slate-300">
                                <input type="checkbox" className="form-checkbox bg-slate-900 border-slate-700 text-emerald-500 rounded focus:ring-emerald-500 focus:ring-offset-slate-950" />
                                Full-time
                            </label>
                            <label className="flex items-center gap-3 text-slate-300">
                                <input type="checkbox" className="form-checkbox bg-slate-900 border-slate-700 text-emerald-500 rounded focus:ring-emerald-500 focus:ring-offset-slate-950" />
                                Part-time
                            </label>
                            <label className="flex items-center gap-3 text-slate-300">
                                <input type="checkbox" className="form-checkbox bg-slate-900 border-slate-700 text-emerald-500 rounded focus:ring-emerald-500 focus:ring-offset-slate-950" />
                                Contract
                            </label>
                            <label className="flex items-center gap-3 text-slate-300">
                                <input type="checkbox" className="form-checkbox bg-slate-900 border-slate-700 text-emerald-500 rounded focus:ring-emerald-500 focus:ring-offset-slate-950" />
                                Internship
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Candidate Type</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 text-slate-300">
                                <input type="radio" name="candidate_type" defaultChecked className="form-radio bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950" />
                                All Jobs
                            </label>
                            <label className="flex items-center gap-3 text-slate-300">
                                <input type="radio" name="candidate_type" className="form-radio bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950" />
                                🇦🇪 Emirati Jobs
                            </label>
                            <label className="flex items-center gap-3 text-slate-300">
                                <input type="radio" name="candidate_type" className="form-radio bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950" />
                                Resident Jobs
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Date Posted</h3>
                        <select className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 focus-visible:ring-1 focus-visible:ring-emerald-500 outline-none appearance-none">
                            <option value="">Any Time</option>
                            <option value="24h">Last 24 hours</option>
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                        </select>
                    </div>
                </aside>

                {/* Jobs List */}
                <div className="flex-1">
                    <div className="flex items-center justify-between xl:mb-6 mb-4 xl:mt-0 mt-8">
                        <h2 className="text-2xl font-semibold text-white">
                            {params.q || params.type || params.location
                                ? `Search Results (${jobs?.length || 0})`
                                : `All Jobs (${jobs?.length || 0})`
                            }
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <span>Sort by:</span>
                            <select className="bg-transparent text-white border-b border-slate-700 focus:outline-none focus:border-emerald-500 pb-1">
                                <option className="bg-slate-900">Relevance</option>
                                <option className="bg-slate-900">Most Recent</option>
                            </select>
                        </div>
                    </div>

                {jobs && jobs.length > 0 ? (
                    <div className="space-y-4">
                        {jobs.map((job: any) => (
                            <JobCard key={job.id} job={job} isLoggedIn={!!user} />
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
                </div>
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
