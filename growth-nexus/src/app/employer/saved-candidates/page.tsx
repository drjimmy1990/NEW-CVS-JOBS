'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Heart, MapPin, Briefcase, Trash2, Eye, Mail
} from 'lucide-react'

const savedCandidates = [
    {
        id: '1', name: 'Sarah Khalil', headline: 'Senior React Developer',
        city: 'Dubai', experience: 6, skills: ['React', 'TypeScript', 'Node.js'],
        savedAt: '2 days ago'
    },
    {
        id: '2', name: 'Mohammed Al-Rashid', headline: 'Full Stack Engineer',
        city: 'Abu Dhabi', experience: 4, skills: ['Python', 'Django', 'AWS'],
        savedAt: '5 days ago'
    },
]

export default function SavedCandidatesPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Saved Candidates</h1>
                <p className="text-slate-400 mt-1">
                    Candidates you've bookmarked for future reference.
                </p>
            </div>

            {savedCandidates.length > 0 ? (
                <div className="space-y-4">
                    {savedCandidates.map((candidate) => (
                        <Card key={candidate.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors group">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/20 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                            {candidate.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-white">{candidate.name}</h3>
                                            <p className="text-sm text-slate-400 mt-0.5">{candidate.headline}</p>
                                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                                                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {candidate.city}</span>
                                                <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {candidate.experience} yrs</span>
                                                <span className="text-slate-600">Saved {candidate.savedAt}</span>
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
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                                            <Eye className="h-4 w-4 mr-1.5" />
                                            View
                                        </Button>
                                        <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                                            <Mail className="h-4 w-4 mr-1.5" />
                                            Contact
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="bg-slate-900 border-slate-800 border-dashed">
                    <CardContent className="p-16 text-center flex flex-col items-center">
                        <Heart className="h-12 w-12 text-slate-600 mb-3" />
                        <p className="text-slate-400 mb-1">No saved candidates yet</p>
                        <p className="text-sm text-slate-500">Browse the candidate database and save profiles for later.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
