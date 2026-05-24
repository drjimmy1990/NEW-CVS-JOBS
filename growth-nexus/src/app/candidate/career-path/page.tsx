'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    TrendingUp, Loader2, Plus, ChevronDown, ChevronUp,
    Sparkles, XCircle, Clock, BookOpen, Award, DollarSign, Target
} from 'lucide-react'

const INDUSTRIES = [
    'تقنية المعلومات', 'البنوك والتمويل', 'الرعاية الصحية', 'التعليم',
    'العقارات', 'النفط والطاقة', 'الضيافة والفنادق', 'التسويق والإعلام',
    'الهندسة', 'التجارة والتجزئة', 'الموارد البشرية', 'اللوجستيات',
]

interface CareerStep { year: number; role: string; skills_to_learn: string[]; certifications: string[]; salary_range: string }
interface Training { name: string; provider: string; cost: string; duration: string; priority: string }
interface CareerResult {
    current_assessment: { level: string; strengths: string[]; gaps: string[] }
    career_path: CareerStep[]
    training_recommendations: Training[]
    market_insights: { demand_level: string; growth_rate: string; avg_salary_uae: string }
}

interface PathSession {
    id: string; current_role: string; target_role: string | null; industry: string
    years_experience: number; result: CareerResult | null; status: string; created_at: string
}

export default function CareerPathPage() {
    const [sessions, setSessions] = useState<PathSession[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)

    // Form
    const [currentRole, setCurrentRole] = useState('')
    const [targetRole, setTargetRole] = useState('')
    const [industry, setIndustry] = useState('')
    const [yearsExp, setYearsExp] = useState(0)

    useEffect(() => { loadSessions() }, [])

    async function loadSessions() {
        setLoading(true)
        const res = await fetch('/api/ai/career-path')
        const data = await res.json()
        setSessions(data.sessions || [])
        setLoading(false)
    }

    async function generate() {
        if (!currentRole.trim() || !industry.trim()) {
            setError('يرجى إدخال الوظيفة الحالية والقطاع')
            return
        }
        setGenerating(true)
        setError('')

        try {
            const res = await fetch('/api/ai/career-path', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_role: currentRole, target_role: targetRole,
                    industry, years_experience: yearsExp,
                }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'حدث خطأ'); return }

            setShowForm(false)
            setCurrentRole(''); setTargetRole(''); setIndustry(''); setYearsExp(0)
            setExpandedId(data.session_id)
            await loadSessions()
        } catch { setError('فشل الاتصال بالخادم') }
        finally { setGenerating(false) }
    }

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8" dir="rtl">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-cream flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20">
                            <TrendingUp className="h-6 w-6 text-emerald-400" />
                        </div>
                        المسار المهني
                    </h1>
                    <p className="text-cream-dark/60">اكتشف مسارك المهني واعرف الخطوات للوصول لهدفك</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold hover:opacity-90">
                    <Plus className="h-4 w-4 me-2" />مسار جديد
                </Button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                    <XCircle className="h-5 w-5 shrink-0" />{error}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="p-6 rounded-2xl bg-navy-light border border-gold/10 space-y-5 animate-in slide-in-from-top-2 duration-300">
                    <h3 className="text-lg font-semibold text-cream">إنشاء مسار مهني جديد</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-cream-dark/60">وظيفتك الحالية *</label>
                            <Input value={currentRole} onChange={e => setCurrentRole(e.target.value)}
                                placeholder="مثال: مبرمج مبتدئ" className="bg-navy border-gold/20 text-cream" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-cream-dark/60">الهدف المهني (اختياري)</label>
                            <Input value={targetRole} onChange={e => setTargetRole(e.target.value)}
                                placeholder="مثال: مدير تقنية" className="bg-navy border-gold/20 text-cream" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-cream-dark/60">القطاع *</label>
                            <select value={industry} onChange={e => setIndustry(e.target.value)}
                                className="w-full h-10 rounded-md border border-gold/20 bg-navy text-cream px-3 text-sm">
                                <option value="">اختر القطاع</option>
                                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-cream-dark/60">سنوات الخبرة</label>
                            <Input type="number" min={0} max={40} value={yearsExp} onChange={e => setYearsExp(+e.target.value)}
                                className="bg-navy border-gold/20 text-cream" />
                        </div>
                    </div>

                    <Button onClick={generate} disabled={generating} className="w-full bg-gradient-to-r from-gold to-gold-light text-navy font-bold hover:opacity-90">
                        {generating ? <><Loader2 className="h-4 w-4 animate-spin me-2" />جاري الإنشاء...</> : <><Sparkles className="h-4 w-4 me-2" />إنشاء المسار المهني</>}
                    </Button>
                </div>
            )}

            {/* Empty */}
            {sessions.length === 0 && !showForm && (
                <div className="text-center py-16 px-8 rounded-2xl bg-navy-light border border-gold/10">
                    <TrendingUp className="h-16 w-16 text-cream-dark/20 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-cream mb-2">لا توجد مسارات سابقة</h3>
                    <p className="text-cream-dark/50 mb-4">أنشئ مسارك المهني واعرف الخطوات للنجاح</p>
                    <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold">
                        <Plus className="h-4 w-4 me-2" />مسار جديد
                    </Button>
                </div>
            )}

            {/* Sessions */}
            <div className="space-y-4">
                {sessions.map(s => {
                    const isExpanded = expandedId === s.id
                    const r = s.result

                    return (
                        <div key={s.id} className="rounded-2xl bg-navy-light border border-gold/10 overflow-hidden">
                            <button onClick={() => setExpandedId(isExpanded ? null : s.id)} className="w-full p-5 flex items-center gap-4 text-start hover:bg-navy-lighter/50 transition-colors">
                                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                    <TrendingUp className="h-6 w-6 text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-cream truncate">{s.current_role} → {s.target_role || 'هدف مفتوح'}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <Badge variant="secondary" className="bg-navy text-cream-dark/60 text-xs">{s.industry}</Badge>
                                        <span className="text-sm text-cream-dark/50 flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(s.created_at).toLocaleDateString('ar-AE')}</span>
                                    </div>
                                </div>
                                {isExpanded ? <ChevronUp className="h-5 w-5 text-gold" /> : <ChevronDown className="h-5 w-5 text-cream-dark/30" />}
                            </button>

                            {isExpanded && r && (
                                <div className="border-t border-gold/10 p-6 space-y-8 animate-in slide-in-from-top-2 duration-300">
                                    {/* Current Assessment */}
                                    <div className="p-4 rounded-xl bg-navy/50 space-y-3">
                                        <h4 className="text-sm font-semibold text-gold flex items-center gap-2"><Target className="h-4 w-4" />التقييم الحالي</h4>
                                        <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20">المستوى: {r.current_assessment.level}</Badge>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {r.current_assessment.strengths.map((s, i) => (
                                                <Badge key={i} variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{s}</Badge>
                                            ))}
                                            {r.current_assessment.gaps.map((g, i) => (
                                                <Badge key={i} variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/20">⚠ {g}</Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Career Path Timeline */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2"><TrendingUp className="h-4 w-4" />المسار المهني</h4>
                                        <div className="relative">
                                            <div className="absolute top-0 bottom-0 start-6 w-0.5 bg-gradient-to-b from-emerald-500/50 to-gold/50" />
                                            <div className="space-y-6">
                                                {r.career_path.map((step, i) => (
                                                    <div key={i} className="relative flex gap-4 ps-14">
                                                        <div className="absolute start-3 top-1 h-7 w-7 rounded-full bg-navy-light border-2 border-emerald-500 text-emerald-400 flex items-center justify-center text-xs font-bold">
                                                            {step.year}
                                                        </div>
                                                        <div className="flex-1 p-4 rounded-xl bg-navy/50 border border-gold/10 space-y-2">
                                                            <h5 className="text-base font-semibold text-cream">{step.role}</h5>
                                                            <div className="flex items-center gap-2 text-sm text-cream-dark/50">
                                                                <DollarSign className="h-3.5 w-3.5" />{step.salary_range}
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {step.skills_to_learn.map((sk, j) => (
                                                                    <Badge key={j} variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">{sk}</Badge>
                                                                ))}
                                                            </div>
                                                            {step.certifications.map((c, j) => (
                                                                <div key={j} className="flex items-center gap-1.5 text-xs text-amber-400"><Award className="h-3 w-3" />{c}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Training */}
                                    {r.training_recommendations?.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-2"><BookOpen className="h-4 w-4" />دورات مقترحة</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {r.training_recommendations.map((t, i) => (
                                                    <div key={i} className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-1.5">
                                                        <p className="text-sm font-medium text-cream">{t.name}</p>
                                                        <p className="text-xs text-cream-dark/50">{t.provider}</p>
                                                        <div className="flex items-center gap-3 text-xs text-cream-dark/40">
                                                            <span>💰 {t.cost}</span>
                                                            <span>⏱ {t.duration}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Market Insights */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 rounded-xl bg-gold/5 border border-gold/10 text-center">
                                            <p className="text-xs text-cream-dark/50">الطلب</p>
                                            <p className="text-sm font-bold text-gold mt-1">{r.market_insights.demand_level}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-gold/5 border border-gold/10 text-center">
                                            <p className="text-xs text-cream-dark/50">النمو</p>
                                            <p className="text-sm font-bold text-emerald-400 mt-1">{r.market_insights.growth_rate}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-gold/5 border border-gold/10 text-center">
                                            <p className="text-xs text-cream-dark/50">متوسط الراتب</p>
                                            <p className="text-sm font-bold text-cream mt-1">{r.market_insights.avg_salary_uae}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
