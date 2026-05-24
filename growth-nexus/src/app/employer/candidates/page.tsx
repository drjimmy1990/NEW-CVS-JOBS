import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { UAE_CITIES } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Search, MapPin,
    Briefcase, Heart, Eye
} from 'lucide-react'
import Link from 'next/link'

export default async function CandidateSearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; location?: string; experience?: string }>
}) {
    const params = await searchParams
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        const { redirect } = await import('next/navigation')
        redirect('/login')
    }

    // Use service role client to bypass RLS — employer needs to see ALL public candidates
    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Query real candidates from Supabase (service role bypasses RLS)
    let query = adminClient
        .from('candidates')
        .select(`
            id,
            headline,
            skills,
            years_experience,
            residence_emirate,
            is_public,
            cv_url,
            profiles:id (
                full_name,
                avatar_url
            )
        `)
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(50)

    if (params.q) {
        // Search by headline text OR skill name
        const q = params.q.trim()
        query = query.or(`headline.ilike.%${q}%,skills.cs.{"${q}"}`)
    }

    if (params.location) {
        query = query.eq('residence_emirate', params.location)
    }

    if (params.experience) {
        if (params.experience === '0-2') {
            query = query.gte('years_experience', 0).lte('years_experience', 2)
        } else if (params.experience === '3-5') {
            query = query.gte('years_experience', 3).lte('years_experience', 5)
        } else if (params.experience === '6+') {
            query = query.gte('years_experience', 6)
        }
    }

    const { data: candidates, error } = await query

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-cream">البحث عن مرشحين</h1>
                <p className="text-cream-dark/50 mt-1">
                    ابحث في قاعدة بيانات المرشحين المسجلين في المنصة.
                </p>
            </div>

            {/* Search Bar + Filters */}
            <Card className="bg-navy-light border-gold/10">
                <CardContent className="p-6">
                    <form className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-dark/40" />
                            <Input
                                name="q"
                                defaultValue={params.q}
                                placeholder="ابحث بالمهارة، المسمى الوظيفي، أو كلمة مفتاحية..."
                                className="ps-10 bg-navy border-gold/10 text-cream placeholder:text-cream-dark/30"
                            />
                        </div>
                        <div className="flex gap-3">
                            <select 
                                name="location"
                                defaultValue={params.location || ''}
                                className="flex h-10 rounded-md border border-gold/10 bg-navy px-3 py-2 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold min-w-[140px]"
                            >
                                <option value="">جميع المواقع</option>
                                {UAE_CITIES.map(city => (
                                    <option key={city.value} value={city.value}>{city.labelAr}</option>
                                ))}
                            </select>
                            <select 
                                name="experience"
                                defaultValue={params.experience || ''}
                                className="flex h-10 rounded-md border border-gold/10 bg-navy px-3 py-2 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold min-w-[140px]"
                            >
                                <option value="">الخبرة</option>
                                <option value="0-2">0-2 سنوات</option>
                                <option value="3-5">3-5 سنوات</option>
                                <option value="6+">+6 سنوات</option>
                            </select>
                            <Button type="submit" className="bg-gold hover:bg-gold-dark text-navy font-bold">
                                بحث
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-cream-dark/40">يُعرض {candidates?.length || 0} مرشحين</p>
                    <select className="flex h-9 rounded-md border border-gold/10 bg-navy px-3 py-1 text-sm text-cream focus:outline-none">
                        <option>الأفضل مطابقة</option>
                        <option>الأكثر خبرة</option>
                        <option>النشاط الأخير</option>
                    </select>
                </div>

                {candidates && candidates.length > 0 ? (
                    candidates.map((candidate: any) => (
                        <Card key={candidate.id} className="bg-navy-light border-gold/10 hover:border-gold/20 transition-colors group">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    {/* Candidate Info */}
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/20 flex items-center justify-center text-cream font-bold text-lg shrink-0">
                                            {((candidate.profiles as any)?.full_name || 'م').charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-cream">
                                                    {(candidate.profiles as any)?.full_name || 'مرشح'}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-cream-dark/50 mt-0.5">{candidate.headline || 'باحث عن عمل'}</p>
                                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-cream-dark/40">
                                                {candidate.residence_emirate && (
                                                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {candidate.residence_emirate}</span>
                                                )}
                                                {candidate.years_experience != null && (
                                                    <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {candidate.years_experience} سنوات خبرة</span>
                                                )}
                                            </div>
                                            <div className="flex gap-1.5 mt-3 flex-wrap">
                                                {(candidate.skills || []).slice(0, 5).map((skill: string) => (
                                                    <Badge key={skill} variant="outline" className="text-[10px] border-gold/20 text-gold py-0">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 md:flex-col md:items-end shrink-0">
                                        <Link href={`/candidate/${candidate.id}`}>
                                            <Button size="sm" className="bg-gold hover:bg-gold-dark text-navy font-bold">
                                                <Eye className="h-4 w-4 me-1.5" />
                                                عرض الملف
                                            </Button>
                                        </Link>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="text-cream-dark/40 hover:text-cream"
                                        >
                                            <Heart className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="bg-navy-light border-gold/10">
                        <CardContent className="p-12 text-center">
                            <Search className="h-12 w-12 text-cream-dark/20 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-cream mb-1">لم يتم العثور على مرشحين</h3>
                            <p className="text-cream-dark/40">حاول تعديل معايير البحث أو تأكد من وجود مرشحين مسجلين</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
