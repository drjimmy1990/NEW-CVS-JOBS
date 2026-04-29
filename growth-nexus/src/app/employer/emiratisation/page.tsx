import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flag, Users, Target, TrendingUp, AlertTriangle } from 'lucide-react'

export default async function EmiratisationPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div className="text-cream">يرجى تسجيل الدخول</div>

    let company: any = null
    const { data: ownedCo } = await supabase.from('companies').select('id, name, size_range').eq('owner_id', user.id).single()
    if (ownedCo) { company = ownedCo }
    else {
        const { data: m } = await supabase.from('company_members').select('company_id, companies(id, name, size_range)').eq('user_id', user.id).eq('status', 'active').single()
        if (m?.companies) company = m.companies
    }
    const { data: jobs } = await supabase.from('jobs').select('id').eq('company_id', company?.id || '')
    const jobIds = (jobs || []).map(j => j.id)

    let emiratiCount = 0
    let totalHired = 0
    if (jobIds.length > 0) {
        const { data: apps } = await supabase
            .from('applications')
            .select('status, candidates!inner(candidate_type)')
            .in('job_id', jobIds)
            .eq('status', 'hired')
        totalHired = (apps || []).length
        emiratiCount = (apps || []).filter((a: any) => a.candidates?.candidate_type === 'emirati').length
    }

    const emiratiRatio = totalHired > 0 ? Math.round((emiratiCount / totalHired) * 100) : 0
    const targetRatio = 10 // MOHRE target percentage
    const isCompliant = emiratiRatio >= targetRatio

    return (
        <div className="space-y-6" dir="rtl">
            <div>
                <h1 className="text-3xl font-bold text-cream">التوطين (Emiratisation)</h1>
                <p className="text-cream-dark/50 mt-1">تتبع نسبة التوطين والتزام MOHRE</p>
            </div>

            {/* Main Gauge */}
            <Card className="bg-navy-light border-gold/10">
                <CardContent className="p-8 text-center">
                    <div className="relative inline-flex items-center justify-center w-40 h-40 mb-6">
                        <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-navy-lighter" />
                            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8"
                                strokeDasharray={`${(emiratiRatio / 100) * 327} 327`}
                                className={isCompliant ? 'text-success' : 'text-red-400'} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-3xl font-bold ${isCompliant ? 'text-success' : 'text-red-400'}`}>{emiratiRatio}%</span>
                            <span className="text-xs text-cream-dark/40">نسبة التوطين</span>
                        </div>
                    </div>
                    <Badge className={isCompliant ? 'bg-success/15 text-success' : 'bg-red-500/15 text-red-400'}>
                        {isCompliant ? 'ملتزم بالمتطلبات' : 'أقل من المستهدف'}
                    </Badge>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-navy-light border-gold/10"><CardContent className="p-5">
                    <Flag className="h-5 w-5 text-success mb-2" />
                    <p className="text-2xl font-bold text-cream">{emiratiCount}</p>
                    <p className="text-sm text-cream-dark/50">مواطنون إماراتيون</p>
                </CardContent></Card>
                <Card className="bg-navy-light border-gold/10"><CardContent className="p-5">
                    <Users className="h-5 w-5 text-blue-400 mb-2" />
                    <p className="text-2xl font-bold text-cream">{totalHired}</p>
                    <p className="text-sm text-cream-dark/50">إجمالي المعينين</p>
                </CardContent></Card>
                <Card className="bg-navy-light border-gold/10"><CardContent className="p-5">
                    <Target className="h-5 w-5 text-gold mb-2" />
                    <p className="text-2xl font-bold text-cream">{targetRatio}%</p>
                    <p className="text-sm text-cream-dark/50">المستهدف (MOHRE)</p>
                </CardContent></Card>
                <Card className="bg-navy-light border-gold/10"><CardContent className="p-5">
                    <TrendingUp className="h-5 w-5 text-purple-400 mb-2" />
                    <p className="text-2xl font-bold text-cream">{Math.max(0, targetRatio - emiratiRatio)}%</p>
                    <p className="text-sm text-cream-dark/50">الفجوة المتبقية</p>
                </CardContent></Card>
            </div>

            {!isCompliant && (
                <Card className="bg-red-500/5 border-red-500/20">
                    <CardContent className="p-6 flex items-start gap-4">
                        <AlertTriangle className="h-6 w-6 text-red-400 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="text-cream font-semibold mb-1">تنبيه: نسبة التوطين أقل من المستهدف</h3>
                            <p className="text-cream-dark/50 text-sm">تحتاج إلى توظيف {Math.ceil((targetRatio / 100) * totalHired) - emiratiCount} مواطنين إماراتيين إضافيين للوصول إلى نسبة {targetRatio}% المطلوبة من MOHRE.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
