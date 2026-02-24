'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Briefcase,
    Loader2,
    MapPin,
    Clock,
    Building2,
    ExternalLink,
    FileX
} from 'lucide-react'
import Link from 'next/link'

type ApplicationStatus = 'applied' | 'reviewing' | 'interview' | 'shortlisted' | 'rejected' | 'hired'

type Application = {
    id: string
    status: ApplicationStatus
    created_at: string
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
    applied: { label: 'Applied', color: 'bg-slate-500/20 text-slate-400 border-slate-500/50' },
    reviewing: { label: 'Under Review', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
    interview: { label: 'Interview', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
    shortlisted: { label: 'Shortlisted', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
    rejected: { label: 'Not Selected', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
    hired: { label: 'Hired! 🎉', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
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

        const { data, error } = await supabase
            .from('applications')
            .select(`
                id,
                status,
                created_at,
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
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const formatJobType = (type: string) => {
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">My Applications</h1>
                    <p className="text-slate-400 mt-1">
                        Track the status of your job applications
                    </p>
                </div>
                <Link href="/jobs">
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Browse Jobs
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: applications.length, color: 'text-white' },
                    { label: 'In Review', value: applications.filter(a => ['reviewing', 'interview', 'shortlisted'].includes(a.status)).length, color: 'text-blue-400' },
                    { label: 'Interviews', value: applications.filter(a => a.status === 'interview').length, color: 'text-yellow-400' },
                    { label: 'Offers', value: applications.filter(a => a.status === 'hired').length, color: 'text-green-400' },
                ].map((stat, i) => (
                    <Card key={i} className="bg-slate-900 border-slate-800">
                        <CardContent className="p-4 text-center">
                            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-sm text-slate-400">{stat.label}</p>
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
                    className={filter === 'all' ? 'bg-cyan-500' : 'border-slate-700 text-slate-300'}
                >
                    All
                </Button>
                {(Object.keys(statusConfig) as ApplicationStatus[]).map(status => (
                    <Button
                        key={status}
                        variant={filter === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(status)}
                        className={filter === status ? 'bg-cyan-500' : 'border-slate-700 text-slate-300'}
                    >
                        {statusConfig[status].label}
                    </Button>
                ))}
            </div>

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-12 text-center">
                        <FileX className="h-16 w-16 mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                            No applications found
                        </h3>
                        <p className="text-slate-400 mb-6">
                            {filter === 'all'
                                ? "You haven't applied to any jobs yet."
                                : `No applications with status "${statusConfig[filter as ApplicationStatus]?.label}"`}
                        </p>
                        <Link href="/jobs">
                            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
                                Find Jobs
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredApplications.map(app => (
                        <Card key={app.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        {/* Company Logo */}
                                        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden">
                                            {app.job?.company?.logo_url ? (
                                                <img
                                                    src={app.job.company.logo_url}
                                                    alt={app.job.company.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Building2 className="h-6 w-6 text-slate-500" />
                                            )}
                                        </div>

                                        {/* Job Info */}
                                        <div>
                                            <Link
                                                href={`/jobs/${app.job?.slug}`}
                                                className="text-lg font-semibold text-white hover:text-cyan-400 transition-colors"
                                            >
                                                {app.job?.title}
                                            </Link>
                                            <p className="text-slate-400">{app.job?.company?.name}</p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {app.job?.location_city}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="h-3 w-3" />
                                                    {formatJobType(app.job?.job_type || '')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Applied {formatDate(app.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <Badge className={statusConfig[app.status].color}>
                                        {statusConfig[app.status].label}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
