'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Mail, FileText, Calendar, ExternalLink, ChevronDown } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"

const statusOptions = [
    { value: 'applied', label: 'Applied', color: 'bg-blue-500/20 text-blue-400' },
    { value: 'reviewing', label: 'Reviewing', color: 'bg-yellow-500/20 text-yellow-400' },
    { value: 'shortlisted', label: 'Shortlisted', color: 'bg-emerald-500/20 text-emerald-400' },
    { value: 'interview', label: 'Interview', color: 'bg-purple-500/20 text-purple-400' },
    { value: 'offered', label: 'Offered', color: 'bg-indigo-500/20 text-indigo-400' },
    { value: 'hired', label: 'Hired', color: 'bg-green-500/20 text-green-400' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-500/20 text-red-400' },
]

interface ApplicantsListProps {
    initialApplicants: any[]
}

export function ApplicantsList({ initialApplicants }: ApplicantsListProps) {
    const supabase = createClient()
    const [applicants, setApplicants] = useState(initialApplicants)
    const [updatingParams, setUpdatingParams] = useState<string | null>(null)
    const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null)

    const handleStatusChange = async (appId: string, newStatus: string) => {
        setUpdatingParams(appId)

        const { error } = await supabase
            .from('applications')
            .update({ status: newStatus })
            .eq('id', appId)

        if (error) {
            toast.error('Failed to update status')
        } else {
            toast.success('Status updated successfully')
            setApplicants(applicants.map(app =>
                app.id === appId ? { ...app, status: newStatus } : app
            ))
        }
        setUpdatingParams(null)
    }

    const getStatusColor = (statusValue: string) => {
        const status = statusOptions.find(s => s.value === statusValue)
        return status?.color || 'bg-slate-500/20 text-slate-400'
    }

    const renderAiInsights = (parsedData: any) => {
        if (!parsedData) return null;

        return (
            <div className="space-y-4 mt-4">
                <h4 className="text-sm font-semibold text-cyan-400">AI Extracted Insights</h4>

                {parsedData.yearsOfExperience !== undefined && (
                    <div className="text-sm">
                        <span className="text-slate-400">Experience:</span> <span className="text-white font-medium">{parsedData.yearsOfExperience} years</span>
                    </div>
                )}

                {parsedData.education && parsedData.education.length > 0 && (
                    <div className="text-sm">
                        <span className="text-slate-400">Education:</span>
                        <ul className="list-disc list-inside text-white mt-1">
                            {parsedData.education.map((edu: any, i: number) => (
                                <li key={i}>{typeof edu === 'object' ? `${edu.degree} - ${edu.institution}` : edu}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {parsedData.skills && parsedData.skills.length > 0 && (
                    <div className="text-sm">
                        <span className="text-slate-400 block mb-1">Extracted Skills:</span>
                        <div className="flex flex-wrap gap-2">
                            {parsedData.skills.map((skill: string, i: number) => (
                                <Badge key={i} variant="secondary" className="bg-slate-800 text-slate-300">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    if (!applicants || applicants.length === 0) {
        return (
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="py-16 text-center">
                    <User className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No applicants yet</h3>
                    <p className="text-slate-400 mb-6">
                        When candidates apply for this job, they'll appear here
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <div className="space-y-4">
                {applicants.map((app: any) => (
                    <Card key={app.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                        {app.profiles?.full_name?.charAt(0)?.toUpperCase() || 'C'}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-semibold text-white">
                                                {app.profiles?.full_name || 'Candidate'}
                                            </h3>

                                            {/* Status Dropdown */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`h-6 text-xs px-2 ${getStatusColor(app.status)} hover:opacity-80`}
                                                        disabled={updatingParams === app.id}
                                                    >
                                                        {app.status}
                                                        <ChevronDown className="ml-1 h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="bg-slate-800 border-slate-700">
                                                    {statusOptions.map((status) => (
                                                        <DropdownMenuItem
                                                            key={status.value}
                                                            className={`cursor-pointer ${app.status === status.value ? 'bg-slate-700' : 'hover:bg-slate-700'} text-slate-200`}
                                                            onClick={() => handleStatusChange(app.id, status.value)}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${status.color.split(' ')[0]}`} />
                                                                {status.label}
                                                            </div>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {app.candidates?.headline && (
                                            <p className="text-slate-400 text-sm mb-2">{app.candidates.headline}</p>
                                        )}

                                        <div className="flex items-center gap-4 text-sm text-slate-400">
                                            {app.profiles?.email && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {app.profiles.email}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Applied {new Date(app.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* Skills - limited preview */}
                                        {app.candidates?.skills && app.candidates.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {app.candidates.skills.slice(0, 5).map((skill: string, i: number) => (
                                                    <Badge key={i} variant="outline" className="border-slate-600 text-slate-300">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                                {app.candidates.skills.length > 5 && (
                                                    <Badge variant="outline" className="border-slate-600 text-slate-400">
                                                        +{app.candidates.skills.length - 5} more
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 text-white"
                                        onClick={() => setSelectedApplicant(app)}
                                    >
                                        <User className="mr-2 h-4 w-4" />
                                        View Full Profile
                                    </Button>

                                    {app.candidates?.cv_url && (
                                        <a href={app.candidates.cv_url} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="sm" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                                                <FileText className="mr-2 h-4 w-4" />
                                                Download CV
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Candidate Details Modal */}
            <Dialog open={!!selectedApplicant} onOpenChange={() => setSelectedApplicant(null)}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedApplicant && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-2xl">
                                        {selectedApplicant.profiles?.full_name?.charAt(0)?.toUpperCase() || 'C'}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl">{selectedApplicant.profiles?.full_name || 'Candidate'}</DialogTitle>
                                        <DialogDescription className="text-slate-400 text-base mt-1">
                                            {selectedApplicant.candidates?.headline || 'No headline available'}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-6 mt-4">
                                <div className="flex flex-wrap gap-4 text-sm text-slate-300 pb-4 border-b border-slate-800">
                                    {selectedApplicant.profiles?.email && (
                                        <span className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-cyan-400" />
                                            <a href={`mailto:${selectedApplicant.profiles.email}`} className="hover:text-cyan-400">{selectedApplicant.profiles.email}</a>
                                        </span>
                                    )}
                                    <span className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-cyan-400" />
                                        Applied: {new Date(selectedApplicant.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                {selectedApplicant.cover_letter && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-slate-200">Cover Letter</h4>
                                        <div className="p-4 bg-slate-800/50 rounded-lg text-slate-300 text-sm whitespace-pre-line leading-relaxed">
                                            {selectedApplicant.cover_letter}
                                        </div>
                                    </div>
                                )}

                                {/* AI Insights Section */}
                                {selectedApplicant.candidates?.parsed_data ? (
                                    <div className="bg-slate-800/30 border border-cyan-500/20 rounded-lg p-4">
                                        {renderAiInsights(selectedApplicant.candidates.parsed_data)}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-500 italic p-4 bg-slate-800/30 rounded-lg">
                                        No AI insights available for this candidate yet.
                                    </div>
                                )}

                                <div className="pt-4 flex gap-3">
                                    {selectedApplicant.candidates?.cv_url && (
                                        <a href={selectedApplicant.candidates.cv_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                                                <FileText className="mr-2 h-4 w-4" />
                                                Download Latest CV
                                            </Button>
                                        </a>
                                    )}
                                    {selectedApplicant.resume_snapshot_url && (
                                        <a href={selectedApplicant.resume_snapshot_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                Application CV Snapshot
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
