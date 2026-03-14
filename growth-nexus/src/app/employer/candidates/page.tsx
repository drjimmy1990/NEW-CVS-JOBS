'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Search, Filter, Lock, Unlock, MapPin,
    Briefcase, GraduationCap, Star, Heart,
    ChevronDown, Eye
} from 'lucide-react'

// Mock candidates for UI demo
const mockCandidates = [
    {
        id: '1', name: 'Sarah Khalil', headline: 'Senior React Developer',
        city: 'Dubai', experience: 6, skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
        match: 95, isPublic: true, hasCV: true
    },
    {
        id: '2', name: 'Mohammed Al-Rashid', headline: 'Full Stack Engineer',
        city: 'Abu Dhabi', experience: 4, skills: ['Python', 'Django', 'AWS', 'Docker'],
        match: 88, isPublic: true, hasCV: true
    },
    {
        id: '3', name: 'Fatima Hassan', headline: 'UX/UI Designer',
        city: 'Sharjah', experience: 3, skills: ['Figma', 'Sketch', 'Adobe XD', 'CSS'],
        match: 82, isPublic: true, hasCV: true
    },
    {
        id: '4', name: 'Omar Youssef', headline: 'Data Analyst',
        city: 'Dubai', experience: 5, skills: ['SQL', 'Python', 'Tableau', 'Power BI'],
        match: 78, isPublic: true, hasCV: false
    },
]

export default function CandidateSearchPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [hasAccess] = useState(false) // Mock: no CV database access
    const [savedIds, setSavedIds] = useState<string[]>([])

    const toggleSave = (id: string) => {
        setSavedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Candidate Search</h1>
                <p className="text-slate-400 mt-1">
                    Search our database of 12,000+ qualified professionals in the UAE.
                </p>
            </div>

            {/* Search Bar + Filters */}
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search by skill, title, or keyword..."
                                className="pl-10 bg-slate-950 border-slate-800 text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <select className="flex h-10 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[140px]">
                                <option>All Locations</option>
                                <option>Dubai</option>
                                <option>Abu Dhabi</option>
                                <option>Sharjah</option>
                            </select>
                            <select className="flex h-10 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[140px]">
                                <option>Experience</option>
                                <option>0-2 years</option>
                                <option>3-5 years</option>
                                <option>6+ years</option>
                            </select>
                            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                                <Filter className="h-4 w-4 mr-2" />
                                More
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Subscription Lock Banner */}
            {!hasAccess && (
                <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-500/20 rounded-xl">
                                <Lock className="h-6 w-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">CV Database Access Required</h3>
                                <p className="text-sm text-slate-400 mt-1">
                                    Subscribe to unlock full candidate profiles, contact details, and CV downloads.
                                </p>
                            </div>
                        </div>
                        <Button className="bg-indigo-500 hover:bg-indigo-600 text-white shrink-0 shadow-lg shadow-indigo-500/20">
                            Subscribe — 699 AED/mo
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Results */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">Showing {mockCandidates.length} candidates</p>
                    <select className="flex h-9 rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm text-white focus:outline-none">
                        <option>Best Match</option>
                        <option>Most Experience</option>
                        <option>Recently Active</option>
                    </select>
                </div>

                {mockCandidates.map((candidate) => (
                    <Card key={candidate.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors group">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Candidate Info */}
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                        {candidate.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold text-white">{candidate.name}</h3>
                                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-medium">
                                                {candidate.match}% Match
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-400 mt-0.5">{candidate.headline}</p>
                                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                                            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {candidate.city}</span>
                                            <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {candidate.experience} yrs exp</span>
                                        </div>
                                        <div className="flex gap-1.5 mt-3 flex-wrap">
                                            {candidate.skills.map((skill) => (
                                                <Badge key={skill} variant="outline" className="text-[10px] border-cyan-500/20 text-cyan-400 py-0">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 md:flex-col md:items-end shrink-0">
                                    {hasAccess ? (
                                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                                            <Eye className="h-4 w-4 mr-1.5" />
                                            View Profile
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="outline" className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10">
                                            <Unlock className="h-4 w-4 mr-1.5" />
                                            Unlock — 15 AED
                                        </Button>
                                    )}
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => toggleSave(candidate.id)}
                                        className={savedIds.includes(candidate.id) ? 'text-rose-400 hover:text-rose-300' : 'text-slate-400 hover:text-white'}
                                    >
                                        <Heart className={`h-4 w-4 ${savedIds.includes(candidate.id) ? 'fill-current' : ''}`} />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
