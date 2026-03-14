import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Search,
    MapPin,
    Briefcase,
    Building2,
    Filter,
} from 'lucide-react'
import { JobCard } from '@/components/ui/job-card'
import { SortSelect } from '@/components/ui/sort-select'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'الوظائف | GrowthNexus',
    description: 'تصفح آلاف فرص العمل في الإمارات. اعثر على وظيفة أحلامك اليوم على GrowthNexus.',
    openGraph: {
        title: 'الوظائف | GrowthNexus',
        description: 'تصفح آلاف فرص العمل على GrowthNexus',
    }
}

interface Props {
    searchParams: Promise<{ q?: string; type?: string; location?: string; sort?: string; experience?: string; candidate_type?: string; date?: string }>
}

export default async function JobsPage({ searchParams }: Props) {
    const params = await searchParams
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()

    let savedJobIds = new Set<string>()
    if (user) {
        const { data: savedJobs } = await supabase
            .from('saved_jobs')
            .select('job_id')
            .eq('candidate_id', user.id)
            
        if (savedJobs) {
            savedJobIds = new Set(savedJobs.map(sj => sj.job_id))
        }
    }

    let query = supabase
        .from('jobs')
        .select(`
      *,
      companies (
        id,
        name,
        logo_url,
        slug
      )
    `)
        .eq('status', 'active')

    // Text search
    if (params.q) {
        query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`)
    }

    // Job type filter (from top bar OR sidebar)
    if (params.type) {
        query = query.eq('job_type', params.type)
    }

    // Location filter — uses correct column name location_city
    if (params.location) {
        query = query.ilike('location_city', `%${params.location}%`)
    }

    // Date filter
    if (params.date) {
        const now = new Date()
        let since: Date | null = null
        if (params.date === '24h') since = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        else if (params.date === '7d') since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        else if (params.date === '30d') since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        if (since) {
            query = query.gte('created_at', since.toISOString())
        }
    }

    // Sorting
    if (params.sort === 'newest') {
        query = query.order('created_at', { ascending: false })
    } else {
        // Default: featured first, then newest
        query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })
    }

    const { data: jobs } = await query

    return (
        <div className="min-h-screen bg-navy">

            {/* Hero Search Section */}
            <section className="bg-gradient-to-br from-navy-light via-navy to-navy-light py-16 border-b border-gold/10">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-bold text-cream mb-4">
                            اعثر على <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">وظيفة أحلامك</span>
                        </h1>
                    </div>

                    {/* Search Form */}
                    <form className="max-w-5xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-3 p-2 bg-navy-lighter/80 backdrop-blur-md rounded-2xl border border-gold/15 shadow-2xl shadow-gold/5">
                            <div className="flex-[1.5] relative">
                                <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-cream-dark/40" />
                                <Input
                                    name="q"
                                    defaultValue={params.q}
                                    placeholder="المسمى الوظيفي / كلمات مفتاحية"
                                    className="ps-12 h-14 bg-navy/50 border-transparent focus-visible:ring-1 focus-visible:ring-gold text-cream placeholder:text-cream-dark/30 rounded-xl"
                                />
                            </div>
                            <div className="flex-1 relative">
                                <MapPin className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-cream-dark/40" />
                                <Input
                                    name="location"
                                    defaultValue={params.location}
                                    placeholder="الموقع (المدينة / الإمارة)"
                                    className="ps-12 h-14 bg-navy/50 border-transparent focus-visible:ring-1 focus-visible:ring-gold text-cream placeholder:text-cream-dark/30 rounded-xl"
                                />
                            </div>
                            <div className="flex-1 relative">
                                <Briefcase className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-cream-dark/40" />
                                <select
                                    name="type"
                                    defaultValue={params.type || ""}
                                    className="w-full ps-12 h-14 bg-navy/50 border-transparent focus-visible:ring-1 focus-visible:ring-gold text-cream rounded-xl appearance-none outline-none"
                                >
                                    <option value="" className="bg-navy text-cream-dark/50">جميع الأنواع</option>
                                    <option value="full_time" className="bg-navy">دوام كامل</option>
                                    <option value="part_time" className="bg-navy">دوام جزئي</option>
                                    <option value="contract" className="bg-navy">عقد</option>
                                    <option value="remote" className="bg-navy">عن بُعد</option>
                                    <option value="internship" className="bg-navy">تدريب</option>
                                </select>
                            </div>
                            <Button
                                type="submit"
                                className="h-14 px-8 rounded-xl bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-navy shadow-lg shadow-gold/25 transition-all w-full md:w-auto font-bold text-lg"
                            >
                                بحث
                            </Button>
                        </div>
                        <p className="text-cream-dark/40 text-sm mt-4 text-center">
                            أكثر من 3,200 وظيفة متاحة في الإمارات
                        </p>
                    </form>
                </div>
            </section>

            {/* Main Content Area: Sidebar + Jobs List */}
            <section className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8">
                
                {/* Sidebar Filters - all inside a single <form> */}
                <aside className="w-full lg:w-1/4 space-y-8">
                    <form>
                        {/* Preserve existing top-bar params as hidden inputs */}
                        {params.q && <input type="hidden" name="q" value={params.q} />}

                        {/* Location checkboxes → converted to select with name */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-cream mb-4">الموقع</h3>
                            <select
                                name="location"
                                defaultValue={params.location || ''}
                                className="w-full h-11 px-3 bg-navy border border-gold/15 rounded-xl text-cream-dark/60 focus-visible:ring-1 focus-visible:ring-gold outline-none appearance-none"
                            >
                                <option value="">جميع المواقع</option>
                                <option value="دبي">دبي</option>
                                <option value="أبوظبي">أبوظبي</option>
                                <option value="الشارقة">الشارقة</option>
                                <option value="عجمان">عجمان</option>
                                <option value="رأس الخيمة">رأس الخيمة</option>
                                <option value="أم القيوين">أم القيوين</option>
                                <option value="الفجيرة">الفجيرة</option>
                            </select>
                        </div>

                        {/* Job Type */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-cream mb-4">نوع الوظيفة</h3>
                            <select
                                name="type"
                                defaultValue={params.type || ''}
                                className="w-full h-11 px-3 bg-navy border border-gold/15 rounded-xl text-cream-dark/60 focus-visible:ring-1 focus-visible:ring-gold outline-none appearance-none"
                            >
                                <option value="">جميع الأنواع</option>
                                <option value="full_time">دوام كامل</option>
                                <option value="part_time">دوام جزئي</option>
                                <option value="contract">عقد</option>
                                <option value="remote">عن بُعد</option>
                                <option value="internship">تدريب</option>
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-cream mb-4">تاريخ النشر</h3>
                            <select
                                name="date"
                                defaultValue={params.date || ''}
                                className="w-full h-11 px-3 bg-navy border border-gold/15 rounded-xl text-cream-dark/60 focus-visible:ring-1 focus-visible:ring-gold outline-none appearance-none"
                            >
                                <option value="">أي وقت</option>
                                <option value="24h">آخر 24 ساعة</option>
                                <option value="7d">آخر 7 أيام</option>
                                <option value="30d">آخر 30 يوم</option>
                            </select>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-navy font-bold rounded-xl"
                        >
                            <Filter className="me-2 h-4 w-4" />
                            تطبيق الفلاتر
                        </Button>
                    </form>
                </aside>

                {/* Jobs List */}
                <div className="flex-1">
                    <div className="flex items-center justify-between xl:mb-6 mb-4 xl:mt-0 mt-8">
                        <h2 className="text-2xl font-semibold text-cream">
                            {params.q || params.type || params.location
                                ? `نتائج البحث (${jobs?.length || 0})`
                                : `جميع الوظائف (${jobs?.length || 0})`
                            }
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-cream-dark/40">
                            <span>ترتيب:</span>
                            <SortSelect defaultValue={params.sort || ''} />
                        </div>
                    </div>

                {jobs && jobs.length > 0 ? (
                    <div className="space-y-4">
                        {jobs.map((job: any) => (
                            <JobCard key={job.id} job={job} isLoggedIn={!!user} isSaved={savedJobIds.has(job.id)} />
                        ))}
                    </div>
                ) : (
                    <Card className="bg-navy-light border-gold/10">
                        <CardContent className="py-16 text-center">
                            <Briefcase className="h-16 w-16 text-cream-dark/20 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-cream mb-2">لم يتم العثور على وظائف</h3>
                            <p className="text-cream-dark/50 mb-6">
                                {params.q || params.type || params.location
                                    ? 'حاول تعديل فلاتر البحث'
                                    : 'كن أول من ينشر وظيفة!'
                                }
                            </p>
                            <Link href="/register">
                                <Button className="bg-gold hover:bg-gold-dark text-navy font-bold">
                                    أنشر وظيفة
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gold/10 py-8 mt-12">
                <div className="container mx-auto px-4 text-center text-cream-dark/40 text-sm">
                    © 2026 GrowthNexus. جميع الحقوق محفوظة.
                </div>
            </footer>
        </div>
    )
}
