'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    BarChart3, Loader2, Search, Plus, X, CheckCircle2,
    XCircle, ArrowRight, Clock, Sparkles, ChevronDown, ChevronUp,
    Heart, Briefcase, Building2, MapPin, Edit3
} from 'lucide-react'

interface SkillGapResult {
    match_percentage: number
    matched_skills: { skill: string; level: string }[]
    missing_skills: { skill: string; priority: string; learning_time: string; resources: string[] }[]
    transferable_skills: { from_skill: string; applicable_to: string; relevance: string }[]
    action_plan: { priority: number; skill: string; action: string; timeline: string; resource: string }[]
}

interface GapSession {
    id: string
    target_job_title: string
    target_skills: string[]
    candidate_skills: string[]
    result: SkillGapResult | null
    status: string
    created_at: string
}

interface SavedJobItem {
    id: string
    job: {
        id: string
        title: string
        location_city: string
        job_type: string
        skills_required: string[]
        company: { name: string; logo_url: string | null } | null
    }
}

interface SearchJobItem {
    id: string
    title: string
    location_city: string
    job_type: string
    skills_required: string[]
    companies: { name: string; logo_url: string | null } | null
}

type InputMode = 'choose' | 'saved' | 'search' | 'manual'

const jobTypeLabels: Record<string, string> = {
    full_time: 'دوام كامل', part_time: 'دوام جزئي',
    contract: 'عقد', remote: 'عن بُعد', internship: 'تدريب',
}

export default function SkillGapPage() {
    const [sessions, setSessions] = useState<GapSession[]>([])
    const [loading, setLoading] = useState(true)
    const [analyzing, setAnalyzing] = useState(false)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [error, setError] = useState('')

    // Form mode
    const [showForm, setShowForm] = useState(false)
    const [inputMode, setInputMode] = useState<InputMode>('choose')

    // Manual input
    const [targetTitle, setTargetTitle] = useState('')
    const [skillInput, setSkillInput] = useState('')
    const [targetSkills, setTargetSkills] = useState<string[]>([])

    // Saved jobs
    const [savedJobs, setSavedJobs] = useState<SavedJobItem[]>([])
    const [loadingSaved, setLoadingSaved] = useState(false)

    // Search jobs
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SearchJobItem[]>([])
    const [searching, setSearching] = useState(false)

    // Selected job
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
    const [selectedJobTitle, setSelectedJobTitle] = useState('')

    const supabase = createClient()

    useEffect(() => { loadSessions() }, [])

    async function loadSessions() {
        setLoading(true)
        const res = await fetch('/api/ai/skill-gap')
        const data = await res.json()
        setSessions(data.sessions || [])
        setLoading(false)
    }

    async function loadSavedJobs() {
        setLoadingSaved(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoadingSaved(false); return }

        const { data } = await supabase
            .from('saved_jobs')
            .select(`
                id,
                job:jobs (
                    id, title, location_city, job_type, skills_required,
                    company:companies ( name, logo_url )
                )
            `)
            .eq('candidate_id', user.id)
            .order('created_at', { ascending: false })

        setSavedJobs((data || []) as unknown as SavedJobItem[])
        setLoadingSaved(false)
    }

    async function searchJobs() {
        if (!searchQuery.trim()) return
        setSearching(true)

        const { data } = await supabase
            .from('jobs')
            .select('id, title, location_city, job_type, skills_required, companies(name, logo_url)')
            .eq('status', 'active')
            .ilike('title', `%${searchQuery.trim()}%`)
            .limit(10)

        setSearchResults((data || []) as unknown as SearchJobItem[])
        setSearching(false)
    }

    function selectJob(jobId: string, jobTitle: string, skills: string[]) {
        setSelectedJobId(jobId)
        setSelectedJobTitle(jobTitle)
        setTargetSkills(skills || [])
        setTargetTitle(jobTitle)
    }

    function openForm() {
        setShowForm(true)
        setInputMode('choose')
        setSelectedJobId(null)
        setSelectedJobTitle('')
        setTargetTitle('')
        setTargetSkills([])
        setSearchQuery('')
        setSearchResults([])
    }

    function addSkill() {
        const s = skillInput.trim()
        if (s && !targetSkills.includes(s)) {
            setTargetSkills(prev => [...prev, s])
            setSkillInput('')
        }
    }

    function removeSkill(skill: string) {
        setTargetSkills(prev => prev.filter(s => s !== skill))
    }

    async function analyze() {
        if (!selectedJobId && !targetTitle.trim()) {
            setError('يرجى اختيار وظيفة أو إدخال عنوان الوظيفة المستهدفة')
            return
        }
        setAnalyzing(true)
        setError('')

        try {
            const body: Record<string, unknown> = {}
            if (selectedJobId) {
                body.target_job_id = selectedJobId
            } else {
                body.target_job_title = targetTitle.trim()
                body.target_skills = targetSkills
            }

            const res = await fetch('/api/ai/skill-gap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'حدث خطأ')
                return
            }

            setShowForm(false)
            setInputMode('choose')
            setExpandedId(data.session_id)
            await loadSessions()
        } catch {
            setError('فشل الاتصال بالخادم')
        } finally {
            setAnalyzing(false)
        }
    }

    function getScoreColor(pct: number) {
        if (pct >= 70) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
        if (pct >= 40) return 'text-amber-400 border-amber-500/30 bg-amber-500/10'
        return 'text-red-400 border-red-500/30 bg-red-500/10'
    }

    function getPriorityBadge(p: string) {
        if (p === 'critical') return 'bg-red-500/10 text-red-400 border-red-500/20'
        if (p === 'important') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    }

    function getPriorityLabel(p: string) {
        if (p === 'critical') return 'حرج'
        if (p === 'important') return 'مهم'
        return 'مستحسن'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8" dir="rtl">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-cream flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/20">
                            <BarChart3 className="h-6 w-6 text-blue-400" />
                        </div>
                        تحليل المهارات
                    </h1>
                    <p className="text-cream-dark/60">
                        قارن مهاراتك مع متطلبات الوظيفة واعرف ما تحتاج تطويره
                    </p>
                </div>
                <Button
                    onClick={openForm}
                    className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold hover:opacity-90"
                >
                    <Plus className="h-4 w-4 me-2" />
                    تحليل جديد
                </Button>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                    <XCircle className="h-5 w-5 shrink-0" />
                    {error}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="p-6 rounded-2xl bg-navy-light border border-gold/10 space-y-5 animate-in slide-in-from-top-2 duration-300">
                    <h3 className="text-lg font-semibold text-cream">تحليل جديد</h3>

                    {/* Mode Chooser */}
                    {inputMode === 'choose' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                                onClick={() => { setInputMode('saved'); loadSavedJobs() }}
                                className="p-5 rounded-xl bg-navy border border-gold/10 hover:border-gold/30 transition-all text-start group"
                            >
                                <Heart className="h-8 w-8 text-rose-400 mb-3 group-hover:scale-110 transition-transform" />
                                <h4 className="text-cream font-semibold mb-1">من الوظائف المحفوظة</h4>
                                <p className="text-cream-dark/40 text-xs">اختر وظيفة حفظتها سابقاً</p>
                            </button>

                            <button
                                onClick={() => setInputMode('search')}
                                className="p-5 rounded-xl bg-navy border border-gold/10 hover:border-gold/30 transition-all text-start group"
                            >
                                <Search className="h-8 w-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                                <h4 className="text-cream font-semibold mb-1">ابحث في الوظائف المنشورة</h4>
                                <p className="text-cream-dark/40 text-xs">ابحث عن أي وظيفة على المنصة</p>
                            </button>

                            <button
                                onClick={() => setInputMode('manual')}
                                className="p-5 rounded-xl bg-navy border border-gold/10 hover:border-gold/30 transition-all text-start group"
                            >
                                <Edit3 className="h-8 w-8 text-gold mb-3 group-hover:scale-110 transition-transform" />
                                <h4 className="text-cream font-semibold mb-1">إدخال يدوي</h4>
                                <p className="text-cream-dark/40 text-xs">أدخل عنوان ومهارات يدوياً</p>
                            </button>
                        </div>
                    )}

                    {/* === SAVED JOBS MODE === */}
                    {inputMode === 'saved' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm text-cream-dark/60">اختر من وظائفك المحفوظة</h4>
                                <Button variant="ghost" size="sm" onClick={() => setInputMode('choose')} className="text-cream-dark/40 text-xs">
                                    ← رجوع
                                </Button>
                            </div>

                            {loadingSaved ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-gold" />
                                </div>
                            ) : savedJobs.length === 0 ? (
                                <div className="text-center py-8">
                                    <Heart className="h-12 w-12 text-cream-dark/15 mx-auto mb-2" />
                                    <p className="text-cream-dark/40 text-sm">لا توجد وظائف محفوظة</p>
                                    <Button variant="link" onClick={() => setInputMode('search')} className="text-gold text-sm mt-2">
                                        ابحث في الوظائف المنشورة بدلاً من ذلك
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {savedJobs.map(saved => (
                                        <button
                                            key={saved.id}
                                            onClick={() => selectJob(saved.job.id, saved.job.title, saved.job.skills_required)}
                                            className={`w-full p-4 rounded-xl border transition-all text-start flex items-center gap-3 ${
                                                selectedJobId === saved.job.id
                                                    ? 'bg-gold/10 border-gold/40'
                                                    : 'bg-navy border-gold/10 hover:border-gold/20'
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-navy-light border border-gold/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                {saved.job.company?.logo_url ? (
                                                    <img src={saved.job.company.logo_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Building2 className="h-5 w-5 text-cream-dark/20" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-cream font-medium text-sm truncate">{saved.job.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5 text-xs text-cream-dark/40">
                                                    <span>{saved.job.company?.name || ''}</span>
                                                    {saved.job.location_city && (
                                                        <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{saved.job.location_city}</span>
                                                    )}
                                                </div>
                                                {saved.job.skills_required?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                        {saved.job.skills_required.slice(0, 4).map(sk => (
                                                            <span key={sk} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{sk}</span>
                                                        ))}
                                                        {saved.job.skills_required.length > 4 && (
                                                            <span className="text-[10px] text-cream-dark/30">+{saved.job.skills_required.length - 4}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {selectedJobId === saved.job.id && (
                                                <CheckCircle2 className="h-5 w-5 text-gold shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* === SEARCH MODE === */}
                    {inputMode === 'search' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm text-cream-dark/60">ابحث في الوظائف المنشورة</h4>
                                <Button variant="ghost" size="sm" onClick={() => setInputMode('choose')} className="text-cream-dark/40 text-xs">
                                    ← رجوع
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchJobs())}
                                    placeholder="ابحث عن وظيفة... مثال: مطور React"
                                    className="bg-navy border-gold/20 text-cream"
                                />
                                <Button onClick={searchJobs} disabled={searching} className="bg-gold text-navy font-bold shrink-0">
                                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {searchResults.map(job => (
                                        <button
                                            key={job.id}
                                            onClick={() => selectJob(job.id, job.title, job.skills_required)}
                                            className={`w-full p-4 rounded-xl border transition-all text-start flex items-center gap-3 ${
                                                selectedJobId === job.id
                                                    ? 'bg-gold/10 border-gold/40'
                                                    : 'bg-navy border-gold/10 hover:border-gold/20'
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-navy-light border border-gold/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                {job.companies?.logo_url ? (
                                                    <img src={job.companies.logo_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Briefcase className="h-5 w-5 text-cream-dark/20" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-cream font-medium text-sm truncate">{job.title}</p>
                                                <div className="flex items-center gap-2 mt-0.5 text-xs text-cream-dark/40">
                                                    <span>{job.companies?.name || ''}</span>
                                                    {job.location_city && (
                                                        <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{job.location_city}</span>
                                                    )}
                                                    <span>{jobTypeLabels[job.job_type] || job.job_type}</span>
                                                </div>
                                                {job.skills_required?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                        {job.skills_required.slice(0, 4).map(sk => (
                                                            <span key={sk} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{sk}</span>
                                                        ))}
                                                        {job.skills_required.length > 4 && (
                                                            <span className="text-[10px] text-cream-dark/30">+{job.skills_required.length - 4}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {selectedJobId === job.id && (
                                                <CheckCircle2 className="h-5 w-5 text-gold shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {searchResults.length === 0 && searchQuery && !searching && (
                                <p className="text-center text-cream-dark/40 text-sm py-4">لا توجد نتائج. جرب كلمات بحث مختلفة</p>
                            )}
                        </div>
                    )}

                    {/* === MANUAL MODE === */}
                    {inputMode === 'manual' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm text-cream-dark/60">إدخال يدوي</h4>
                                <Button variant="ghost" size="sm" onClick={() => setInputMode('choose')} className="text-cream-dark/40 text-xs">
                                    ← رجوع
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-cream-dark/60">عنوان الوظيفة المستهدفة *</label>
                                <Input
                                    value={targetTitle}
                                    onChange={e => setTargetTitle(e.target.value)}
                                    placeholder="مثال: مطور واجهات أمامية"
                                    className="bg-navy border-gold/20 text-cream"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-cream-dark/60">المهارات المطلوبة (اختياري)</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={skillInput}
                                        onChange={e => setSkillInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                        placeholder="أضف مهارة واضغط Enter"
                                        className="bg-navy border-gold/20 text-cream"
                                    />
                                    <Button variant="outline" onClick={addSkill} className="border-gold/20 text-gold">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {targetSkills.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {targetSkills.map(s => (
                                            <Badge key={s} variant="secondary" className="bg-gold/10 text-gold border-gold/20 gap-1">
                                                {s}
                                                <X className="h-3 w-3 cursor-pointer hover:text-red-400" onClick={() => removeSkill(s)} />
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Selected Job Preview (for saved/search modes) */}
                    {(inputMode === 'saved' || inputMode === 'search') && selectedJobId && (
                        <div className="p-3 rounded-xl bg-gold/5 border border-gold/20 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-gold shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm text-cream font-medium">تم اختيار: {selectedJobTitle}</p>
                                {targetSkills.length > 0 && (
                                    <p className="text-xs text-cream-dark/40 mt-0.5">{targetSkills.length} مهارات مطلوبة سيتم المقارنة بها</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Analyze Button */}
                    {inputMode !== 'choose' && (
                        <Button
                            onClick={analyze}
                            disabled={analyzing || (!selectedJobId && !targetTitle.trim())}
                            className="w-full bg-gradient-to-r from-gold to-gold-light text-navy font-bold hover:opacity-90"
                        >
                            {analyzing ? (
                                <><Loader2 className="h-4 w-4 animate-spin me-2" />جاري التحليل...</>
                            ) : (
                                <><Sparkles className="h-4 w-4 me-2" />ابدأ التحليل</>
                            )}
                        </Button>
                    )}
                </div>
            )}

            {/* Empty State */}
            {sessions.length === 0 && !showForm && (
                <div className="text-center py-16 px-8 rounded-2xl bg-navy-light border border-gold/10">
                    <BarChart3 className="h-16 w-16 text-cream-dark/20 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-cream mb-2">لا توجد تحليلات سابقة</h3>
                    <p className="text-cream-dark/50 mb-4">ابدأ بتحليل مهاراتك مقارنة بوظيفة محددة</p>
                    <Button onClick={openForm} className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold">
                        <Plus className="h-4 w-4 me-2" />تحليل جديد
                    </Button>
                </div>
            )}

            {/* Sessions List */}
            <div className="space-y-4">
                {sessions.map(s => {
                    const isExpanded = expandedId === s.id
                    const r = s.result

                    return (
                        <div key={s.id} className="rounded-2xl bg-navy-light border border-gold/10 overflow-hidden">
                            {/* Card Header */}
                            <button
                                onClick={() => setExpandedId(isExpanded ? null : s.id)}
                                className="w-full p-5 flex items-center gap-4 text-start hover:bg-navy-lighter/50 transition-colors"
                            >
                                <div className={`h-14 w-14 rounded-xl flex items-center justify-center border text-xl font-bold ${r ? getScoreColor(r.match_percentage) : 'bg-navy text-cream-dark/30 border-gold/10'}`}>
                                    {r ? `${r.match_percentage}%` : '...'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-cream truncate">{s.target_job_title}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-sm text-cream-dark/50 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(s.created_at).toLocaleDateString('ar-AE')}
                                        </span>
                                        {s.target_skills.length > 0 && (
                                            <span className="text-xs text-cream-dark/40">{s.target_skills.length} مهارات مستهدفة</span>
                                        )}
                                    </div>
                                </div>
                                {isExpanded ? <ChevronUp className="h-5 w-5 text-gold" /> : <ChevronDown className="h-5 w-5 text-cream-dark/30" />}
                            </button>

                            {/* Expanded Result */}
                            {isExpanded && r && (
                                <div className="border-t border-gold/10 p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                                    {/* Two Columns: Matched vs Missing */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Matched */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4" />
                                                مهارات متطابقة ({r.matched_skills.length})
                                            </h4>
                                            <div className="space-y-1.5">
                                                {r.matched_skills.map((sk, i) => (
                                                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                                        <span className="text-sm text-cream-dark/80">{sk.skill}</span>
                                                    </div>
                                                ))}
                                                {r.matched_skills.length === 0 && (
                                                    <p className="text-sm text-cream-dark/40 p-2">لا توجد مهارات متطابقة</p>
                                                )}
                                            </div>
                                        </div>
                                        {/* Missing */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                                                <XCircle className="h-4 w-4" />
                                                مهارات مطلوبة ({r.missing_skills.length})
                                            </h4>
                                            <div className="space-y-1.5">
                                                {r.missing_skills.map((sk, i) => (
                                                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
                                                        <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                                                        <span className="text-sm text-cream-dark/80 flex-1">{sk.skill}</span>
                                                        <Badge variant="secondary" className={`text-[10px] ${getPriorityBadge(sk.priority)}`}>
                                                            {getPriorityLabel(sk.priority)}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Plan */}
                                    {r.action_plan?.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-gold flex items-center gap-2">
                                                <ArrowRight className="h-4 w-4" />
                                                خطة التطوير
                                            </h4>
                                            <div className="space-y-2">
                                                {r.action_plan.map((a, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gold/5 border border-gold/10">
                                                        <span className="h-6 w-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center shrink-0 font-bold">{a.priority}</span>
                                                        <div className="flex-1">
                                                            <p className="text-sm text-cream-dark/80">{a.action}</p>
                                                            <p className="text-xs text-cream-dark/40 mt-1">
                                                                ⏱ {a.timeline} • 📚 {a.resource}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
