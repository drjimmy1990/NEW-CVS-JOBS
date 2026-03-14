import { createClient } from '@/utils/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Building2, Search, MapPin, Users, Globe, ExternalLink
} from 'lucide-react'
import Link from 'next/link'

export default async function CompaniesPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; industry?: string }>
}) {
    const params = await searchParams
    const supabase = await createClient()

    let query = supabase
        .from('companies')
        .select('id, name, slug, description, logo_url, industry, size_range, website, is_verified')
        .order('name', { ascending: true })

    if (params.q) {
        query = query.ilike('name', `%${params.q}%`)
    }

    if (params.industry) {
        query = query.eq('industry', params.industry)
    }

    const { data: companies } = await query

    return (
        <div className="min-h-screen bg-navy">
            {/* Hero */}
            <div className="bg-gradient-to-b from-navy-lighter to-navy py-16 px-4">
                <div className="container mx-auto text-center max-w-3xl">
                    <h1 className="text-4xl font-bold text-cream mb-4">دليل الشركات</h1>
                    <p className="text-cream-dark/50 text-lg mb-8">
                        تصفح الشركات المسجلة في الإمارات واعثر على فرص العمل المناسبة
                    </p>

                    <form className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                        <div className="relative flex-1">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-dark/40" />
                            <Input
                                name="q"
                                defaultValue={params.q}
                                placeholder="ابحث باسم الشركة..."
                                className="ps-10 bg-navy border-gold/15 text-cream placeholder:text-cream-dark/30 h-12"
                            />
                        </div>
                        <select
                            name="industry"
                            defaultValue={params.industry || ''}
                            className="h-12 rounded-md border border-gold/15 bg-navy px-4 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold min-w-[150px]"
                        >
                            <option value="">جميع القطاعات</option>
                            <option value="Technology">التكنولوجيا</option>
                            <option value="Healthcare">الرعاية الصحية</option>
                            <option value="Finance">المالية</option>
                            <option value="Education">التعليم</option>
                            <option value="Real Estate">العقارات</option>
                            <option value="Hospitality">الضيافة</option>
                            <option value="Retail">التجزئة</option>
                        </select>
                        <Button type="submit" className="bg-gold hover:bg-gold-dark text-navy font-bold h-12 px-8">
                            بحث
                        </Button>
                    </form>
                </div>
            </div>

            {/* Companies Grid */}
            <div className="container mx-auto px-4 py-12">
                <p className="text-cream-dark/40 text-sm mb-6">{companies?.length || 0} شركة</p>

                {companies && companies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {companies.map((company) => (
                            <Link key={company.id} href={`/company/${company.slug}`}>
                                <Card className="bg-navy-light border-gold/10 hover:border-gold/20 transition-all hover:shadow-lg hover:shadow-navy/50 h-full group">
                                    <CardContent className="p-6 flex flex-col h-full">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="h-14 w-14 rounded-xl bg-navy border border-gold/10 flex items-center justify-center overflow-hidden shrink-0">
                                                {company.logo_url ? (
                                                    <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Building2 className="h-7 w-7 text-cream-dark/20" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-cream group-hover:text-gold transition-colors truncate">
                                                        {company.name}
                                                    </h3>
                                                    {company.is_verified && (
                                                        <Badge className="bg-success/10 text-success border-success/20 text-[10px]">
                                                            موثّقة
                                                        </Badge>
                                                    )}
                                                </div>
                                                {company.industry && (
                                                    <p className="text-xs text-gold/60 mt-1">{company.industry}</p>
                                                )}
                                            </div>
                                        </div>

                                        {company.description && (
                                            <p className="text-sm text-cream-dark/40 line-clamp-2 mb-4 flex-1">
                                                {company.description}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-3 text-xs text-cream-dark/30 mt-auto pt-3 border-t border-gold/5">
                                            {company.size_range && (
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" /> {company.size_range}
                                                </span>
                                            )}
                                            {company.website && (
                                                <span className="flex items-center gap-1">
                                                    <Globe className="h-3 w-3" /> موقع إلكتروني
                                                </span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Card className="bg-navy-light border-gold/10">
                        <CardContent className="p-16 text-center">
                            <Building2 className="h-16 w-16 text-cream-dark/15 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-cream mb-2">لم يتم العثور على شركات</h3>
                            <p className="text-cream-dark/40">حاول تعديل معايير البحث</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
