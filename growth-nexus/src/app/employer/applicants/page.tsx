'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Users, ChevronDown, MoreHorizontal, Mail, 
    Phone, Calendar, FileText, Star, 
    ArrowRight, Filter, MessageSquare
} from 'lucide-react'

// Mock pipeline data
const pipelineColumns = [
    {
        id: 'applied',
        title: 'Applied',
        color: 'bg-slate-500',
        count: 12,
        candidates: [
            { id: '1', name: 'Ahmad Saleh', role: 'Senior Developer', date: '2 days ago', score: 85 },
            { id: '2', name: 'Noor Al-Hadi', role: 'Product Designer', date: '3 days ago', score: 72 },
            { id: '3', name: 'Layla Ibrahim', role: 'Marketing Lead', date: '5 days ago', score: 68 },
        ]
    },
    {
        id: 'reviewing',
        title: 'Reviewing',
        color: 'bg-blue-500',
        count: 5,
        candidates: [
            { id: '4', name: 'Youssef Karim', role: 'Backend Engineer', date: '1 day ago', score: 91 },
            { id: '5', name: 'Sara Mansour', role: 'HR Manager', date: '4 days ago', score: 88 },
        ]
    },
    {
        id: 'interview',
        title: 'Interview',
        color: 'bg-amber-500',
        count: 3,
        candidates: [
            { id: '6', name: 'Khalid Al-Omari', role: 'DevOps Engineer', date: 'Tomorrow', score: 94 },
        ]
    },
    {
        id: 'shortlisted',
        title: 'Shortlisted',
        color: 'bg-emerald-500',
        count: 2,
        candidates: [
            { id: '7', name: 'Rania Taha', role: 'React Developer', date: 'Pending offer', score: 96 },
        ]
    },
]

export default function ApplicantsPage() {
    const [selectedJob, setSelectedJob] = useState('all')

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Applicant Pipeline</h1>
                    <p className="text-slate-400 mt-1">
                        Manage your applicants across all stages of the hiring process.
                    </p>
                </div>
                <div className="flex gap-3">
                    <select 
                        className="flex h-10 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[200px]"
                        value={selectedJob}
                        onChange={(e) => setSelectedJob(e.target.value)}
                    >
                        <option value="all">All Jobs</option>
                        <option value="1">Senior React Developer</option>
                        <option value="2">Marketing Executive</option>
                        <option value="3">Data Analyst</option>
                    </select>
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 min-h-[500px]">
                {pipelineColumns.map((column) => (
                    <div key={column.id} className="space-y-4">
                        {/* Column Header */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <div className={`h-3 w-3 rounded-full ${column.color}`}></div>
                                <h3 className="font-semibold text-white text-sm">{column.title}</h3>
                                <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                                    {column.count}
                                </Badge>
                            </div>
                        </div>

                        {/* Cards */}
                        <div className="space-y-3">
                            {column.candidates.map((candidate) => (
                                <Card 
                                    key={candidate.id} 
                                    className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-slate-900/50 cursor-pointer group"
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                    {candidate.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{candidate.name}</p>
                                                    <p className="text-xs text-slate-500">{candidate.role}</p>
                                                </div>
                                            </div>
                                            <button className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-opacity">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-1.5">
                                                <Star className="h-3.5 w-3.5 text-amber-400" />
                                                <span className="text-xs font-medium text-amber-400">{candidate.score}%</span>
                                            </div>
                                            <span className="text-xs text-slate-500">{candidate.date}</span>
                                        </div>

                                        {/* Quick Actions (visible on hover) */}
                                        <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="flex-1 flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-white py-1.5 rounded-md hover:bg-slate-800 transition-colors">
                                                <FileText className="h-3 w-3" /> CV
                                            </button>
                                            <button className="flex-1 flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-white py-1.5 rounded-md hover:bg-slate-800 transition-colors">
                                                <Mail className="h-3 w-3" /> Email
                                            </button>
                                            <button className="flex-1 flex items-center justify-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 py-1.5 rounded-md hover:bg-emerald-500/10 transition-colors">
                                                <ArrowRight className="h-3 w-3" /> Move
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {column.candidates.length === 0 && (
                                <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center">
                                    <p className="text-slate-600 text-sm">No candidates</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
