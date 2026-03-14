import { createClient } from '@/utils/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Search, Filter, Lock, Unlock, MapPin,
    Briefcase, Heart, Eye
} from 'lucide-react'
import Link from 'next/link'

export default async function CandidateSearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; location?: string; experience?: string }>
}) {
    const params = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check if employer has CV database access (subscription)
    const hasAccess = false // TODO: Phase 6: wire to subscription check

    // Query real candidates from Supabase
    let query = supabase
        .from('candidates')
        .select(`
            id,
            headline,
            skills,
            experience_years,
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
        .limit(20)

    if (params.q) {
        query = query.or(`headline.ilike.%${params.q}%,skills.cs.{${params.q}}`)
    }

    if (params.location) {
        query = query.eq('residence_emirate', params.location)
    }

    const { data: candidates } = await query

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-cream">البحث عن مرشحين</h1>
                <p className="text-cream-dark/50 mt-1">
                    ابحث في قاعدة بيانات أكثر من 12,000 متخصص مؤهل في الإمارات.
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
                                <option value="دبي">دبي</option>
                                <option value="أبوظبي">أبوظبي</option>
                                <option value="الشارقة">الشارقة</option>
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

            {/* Subscription Lock Banner */}
            {!hasAccess && (
                <Card className="bg-gradient-to-r from-gold/10 to-gold/5 border-gold/30">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-gold/20 rounded-xl">
                                <Lock className="h-6 w-6 text-gold" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-cream">يلزم اشتراك للوصول لقاعدة السير الذاتية</h3>
                                <p className="text-sm text-cream-dark/50 mt-1">
                                    اشترك لفتح ملفات المرشحين الكاملة وبيانات التواصل وتنزيل السير الذاتية.
                                </p>
                            </div>
                        </div>
                        <Button className="bg-gold hover:bg-gold-dark text-navy shrink-0 font-bold shadow-lg shadow-gold/20">
                            اشترك — 699 د.إ/شهر
                        </Button>
                    </CardContent>
                </Card>
            )}

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
                                                {candidate.experience_years && (
                                                    <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {candidate.experience_years} سنوات خبرة</span>
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
                                        {hasAccess ? (
                                            <Button size="sm" className="bg-gold hover:bg-gold-dark text-navy font-bold">
                                                <Eye className="h-4 w-4 me-1.5" />
                                                عرض الملف
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
                                                <Unlock className="h-4 w-4 me-1.5" />
                                                فتح — 15 د.إ
                                            </Button>
                                        )}
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
                            <p className="text-cream-dark/40">حاول تعديل معايير البحث</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
