'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, MapPin, Briefcase, Loader2, Search, UserCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { UAE_EMIRATES } from '@/lib/emiratisation-engine'

interface EmiratiCandidate {
    id: string
    headline: string | null
    skills: string[] | null
    experience_years: number | null
    residence_emirate: string | null
    nafis_registered: boolean
    profiles: { full_name: string; avatar_url: string | null } | null
}

export function EmiratiCandidatesList() {
    const [candidates, setCandidates] = useState<EmiratiCandidate[]>([])
    const [loading, setLoading] = useState(true)
    const [location, setLocation] = useState('')
    const [skillSearch, setSkillSearch] = useState('')

    useEffect(() => {
        fetchCandidates()
    }, [location])

    const fetchCandidates = async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (location) params.set('location', location)
        if (skillSearch) params.set('skills', skillSearch)

        const res = await fetch(`/api/emiratisation/candidates?${params}`)
        const data = await res.json()
        setCandidates(data.candidates || [])
        setLoading(false)
    }

    const handleSkillSearch = () => fetchCandidates()

    return (
        <Card className="bg-navy-light border-gold/10">
            <CardHeader>
                <CardTitle className="text-cream text-lg flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-gold" />
                    المرشحون المواطنون
                    <Badge className="bg-gold/10 text-gold border-0 text-xs">{candidates.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Select value={location} onValueChange={v => setLocation(v === 'all' ? '' : v)}>
                        <SelectTrigger className="bg-navy border-gold/15 text-cream text-sm">
                            <SelectValue placeholder="الإمارة" />
                        </SelectTrigger>
                        <SelectContent className="bg-navy-light border-gold/15">
                            <SelectItem value="all" className="text-cream hover:bg-navy-lighter">جميع الإمارات</SelectItem>
                            {UAE_EMIRATES.map(e => (
                                <SelectItem key={e} value={e} className="text-cream hover:bg-navy-lighter">{e}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex gap-2 col-span-2">
                        <Input
                            value={skillSearch}
                            onChange={e => setSkillSearch(e.target.value)}
                            placeholder="بحث بالمهارات (مفصولة بفواصل)"
                            className="bg-navy border-gold/15 text-cream text-sm"
                            onKeyDown={e => e.key === 'Enter' && handleSkillSearch()}
                        />
                        <button onClick={handleSkillSearch} className="p-2 bg-gold/10 rounded-lg hover:bg-gold/20 transition-colors">
                            <Search className="h-4 w-4 text-gold" />
                        </button>
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-gold" />
                    </div>
                ) : candidates.length === 0 ? (
                    <div className="text-center py-10 text-cream-dark/40">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>لا يوجد مرشحون مواطنون مطابقون</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {candidates.map(c => (
                            <div key={c.id} className="p-4 rounded-lg bg-navy/50 border border-gold/5 hover:border-gold/15 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="text-cream font-medium text-sm">
                                            {(c.profiles as any)?.full_name || 'مرشح إماراتي'}
                                        </h4>
                                        {c.headline && <p className="text-xs text-cream-dark/50 mt-0.5">{c.headline}</p>}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {c.residence_emirate && (
                                                <span className="flex items-center gap-1 text-xs text-cream-dark/40">
                                                    <MapPin className="h-3 w-3" />{c.residence_emirate}
                                                </span>
                                            )}
                                            {c.experience_years != null && c.experience_years > 0 && (
                                                <span className="flex items-center gap-1 text-xs text-cream-dark/40">
                                                    <Briefcase className="h-3 w-3" />{c.experience_years} سنوات
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {c.nafis_registered && (
                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-[10px]">نافس</Badge>
                                    )}
                                </div>
                                {c.skills && c.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {c.skills.slice(0, 6).map(s => (
                                            <Badge key={s} variant="outline" className="text-[10px] border-gold/10 text-cream-dark/50">{s}</Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
