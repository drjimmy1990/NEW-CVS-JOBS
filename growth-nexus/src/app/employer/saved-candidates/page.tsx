'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Users, Loader2, MapPin, Briefcase, Trash2, Star, Eye, Unlock
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

type SavedCandidate = {
    id: string
    created_at: string
    candidate: {
        id: string
        headline: string | null
        skills: string[] | null
        experience_years: number | null
        residence_emirate: string | null
        profile: {
            full_name: string | null
            avatar_url: string | null
        }
    }
}

export default function SavedCandidatesPage() {
    const [savedCandidates, setSavedCandidates] = useState<SavedCandidate[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSavedCandidates()
    }, [])

    const loadSavedCandidates = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setLoading(false)
            return
        }

        const { data } = await supabase
            .from('saved_candidates')
            .select(`
                id,
                created_at,
                candidate:candidates!saved_candidates_candidate_id_fkey (
                    id,
                    headline,
                    skills,
                    experience_years,
                    residence_emirate,
                    profile:id (
                        full_name,
                        avatar_url
                    )
                )
            `)
            .eq('employer_id', user.id)
            .order('created_at', { ascending: false })

        if (data) {
            setSavedCandidates(data as unknown as SavedCandidate[])
        }
        setLoading(false)
    }

    const removeSaved = async (savedId: string) => {
        const supabase = createClient()
        await supabase.from('saved_candidates').delete().eq('id', savedId)
        setSavedCandidates(prev => prev.filter(s => s.id !== savedId))
        toast.success('تم إزالة المرشح من المحفوظات')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-cream">المرشحون المحفوظون</h1>
                    <p className="text-cream-dark/50 mt-1">
                        المرشحون الذين حفظتهم للرجوع إليهم لاحقاً ({savedCandidates.length})
                    </p>
                </div>
                <Link href="/employer/candidates">
                    <Button className="bg-gold hover:bg-gold-dark text-navy font-bold">
                        <Users className="me-2 h-4 w-4" />
                        بحث عن مرشحين
                    </Button>
                </Link>
            </div>

            {savedCandidates.length === 0 ? (
                <Card className="bg-navy-light border-gold/10">
                    <CardContent className="p-16 text-center">
                        <Users className="h-16 w-16 text-cream-dark/15 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-cream mb-2">لم تحفظ أي مرشحين بعد</h3>
                        <p className="text-cream-dark/40 mb-6">
                            تصفح المرشحين واضغط على ❤️ لحفظ من يعجبك
                        </p>
                        <Link href="/employer/candidates">
                            <Button className="bg-gold hover:bg-gold-dark text-navy font-bold">
                                ابدأ البحث
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedCandidates.map((saved) => {
                        const c = saved.candidate
                        const name = (c?.profile as any)?.full_name || 'مرشح'
                        return (
                            <Card key={saved.id} className="bg-navy-light border-gold/10 hover:border-gold/20 transition-colors group">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/20 flex items-center justify-center text-cream font-bold shrink-0">
                                                {name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-cream text-sm">{name}</h3>
                                                <p className="text-xs text-cream-dark/40">{c?.headline || 'باحث عن عمل'}</p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeSaved(saved.id)}
                                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 w-8 p-0"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 text-xs text-cream-dark/30 mb-3">
                                        {c?.residence_emirate && (
                                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.residence_emirate}</span>
                                        )}
                                        {c?.experience_years && (
                                            <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {c.experience_years} سنوات</span>
                                        )}
                                    </div>

                                    <div className="flex gap-1 flex-wrap mb-3">
                                        {(c?.skills || []).slice(0, 4).map((skill: string) => (
                                            <Badge key={skill} variant="outline" className="text-[10px] border-gold/20 text-gold py-0">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 pt-3 border-t border-gold/5">
                                        <Button size="sm" variant="outline" className="flex-1 border-gold/20 text-gold hover:bg-gold/10 text-xs">
                                            <Unlock className="h-3 w-3 me-1" /> فتح الملف
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
