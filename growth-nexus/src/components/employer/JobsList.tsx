'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, Users, MoreHorizontal, Edit, Trash2, Archive, ExternalLink } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'

const statusColors: Record<string, string> = {
    draft: 'bg-slate-500/20 text-slate-400',
    active: 'bg-emerald-500/20 text-emerald-400',
    expired: 'bg-orange-500/20 text-orange-400',
    closed: 'bg-red-500/20 text-red-400',
    archived: 'bg-slate-600/20 text-slate-500',
}

const typeLabels: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    remote: 'Remote',
    internship: 'Internship',
}

interface Job {
    id: string
    title: string
    slug: string
    status: string
    job_type: string
    location_city?: string
    salary_min?: number
    salary_max?: number
    is_confidential: boolean
    is_featured: boolean
    views_count: number
    created_at: string
    applicant_count: number
}

interface JobsListProps {
    jobs: Job[]
}

export function JobsList({ jobs: initialJobs }: JobsListProps) {
    const router = useRouter()
    const supabase = createClient()
    const [jobs, setJobs] = useState(initialJobs)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [jobToDelete, setJobToDelete] = useState<Job | null>(null)
    const [loading, setLoading] = useState(false)

    const handleArchive = async (job: Job) => {
        setLoading(true)
        const newStatus = job.status === 'archived' ? 'active' : 'archived'

        const { error } = await supabase
            .from('jobs')
            .update({ status: newStatus })
            .eq('id', job.id)

        if (error) {
            toast.error('Failed to update job status')
        } else {
            toast.success(newStatus === 'archived' ? 'Job archived' : 'Job restored')
            setJobs(jobs.map(j => j.id === job.id ? { ...j, status: newStatus } : j))
        }
        setLoading(false)
    }

    const handleDelete = async () => {
        if (!jobToDelete) return
        setLoading(true)

        const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', jobToDelete.id)

        if (error) {
            toast.error('Failed to delete job: ' + error.message)
        } else {
            toast.success('Job deleted successfully')
            setJobs(jobs.filter(j => j.id !== jobToDelete.id))
        }

        setJobToDelete(null)
        setDeleteDialogOpen(false)
        setLoading(false)
    }

    const confirmDelete = (job: Job) => {
        setJobToDelete(job)
        setDeleteDialogOpen(true)
    }

    return (
        <>
            <div className="space-y-4">
                {jobs.map((job) => (
                    <Card key={job.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                                        <Badge className={statusColors[job.status] || statusColors.draft}>
                                            {job.status}
                                        </Badge>
                                        {job.is_confidential && (
                                            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                                                Confidential
                                            </Badge>
                                        )}
                                        {job.is_featured && (
                                            <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                                                Featured
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                                        <span>{job.location_city || 'Location not set'}</span>
                                        <span>•</span>
                                        <span>{typeLabels[job.job_type] || job.job_type}</span>
                                        {job.salary_min && (
                                            <>
                                                <span>•</span>
                                                <span>
                                                    {job.salary_min.toLocaleString()}
                                                    {job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : '+'} SAR
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <Link
                                            href={`/employer/jobs/${job.id}/applicants`}
                                            className="flex items-center gap-2 text-sm hover:text-emerald-400 transition-colors"
                                        >
                                            <Users className="h-4 w-4 text-emerald-400" />
                                            <span className="text-slate-300">{job.applicant_count} applicants</span>
                                        </Link>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Eye className="h-4 w-4 text-cyan-400" />
                                            <span className="text-slate-300">{job.views_count || 0} views</span>
                                        </div>
                                        <span className="text-xs text-slate-500">
                                            Posted {new Date(job.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                        <DropdownMenuItem
                                            className="text-slate-300 hover:bg-slate-700 cursor-pointer"
                                            onClick={() => window.open(`/jobs/${job.slug}`, '_blank')}
                                        >
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            View Public Page
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={`/employer/jobs/${job.id}/applicants`}
                                                className="text-slate-300 hover:bg-slate-700 cursor-pointer flex items-center"
                                            >
                                                <Users className="mr-2 h-4 w-4" />
                                                View Applicants ({job.applicant_count})
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-slate-700" />
                                        <DropdownMenuItem asChild>
                                            <Link
                                                href={`/employer/jobs/${job.id}/edit`}
                                                className="text-slate-300 hover:bg-slate-700 cursor-pointer flex items-center"
                                            >
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Job
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-slate-300 hover:bg-slate-700 cursor-pointer"
                                            onClick={() => handleArchive(job)}
                                            disabled={loading}
                                        >
                                            <Archive className="mr-2 h-4 w-4" />
                                            {job.status === 'archived' ? 'Restore' : 'Archive'}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-slate-700" />
                                        <DropdownMenuItem
                                            className="text-red-400 hover:bg-slate-700 cursor-pointer"
                                            onClick={() => confirmDelete(job)}
                                            disabled={loading}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-slate-900 border-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Job Posting?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            This will permanently delete &quot;{jobToDelete?.title}&quot; and all associated
                            applications. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={loading}
                        >
                            {loading ? 'Deleting...' : 'Delete Job'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
