'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Zap, Loader2, Plus, X, XCircle, Power, PowerOff,
    Clock, Sparkles, CheckCircle2, BarChart3, Briefcase
} from 'lucide-react'

const JOB_TYPES = [
    { value: 'full_time', label: 'دوام كامل' }, { value: 'part_time', label: 'دوام جزئي' },
    { value: 'contract', label: 'عقد' }, { value: 'remote', label: 'عن بعد' }, { value: 'internship', label: 'تدريب' },
]
const UAE_LOCS = ['أبوظبي', 'دبي', 'الشارقة', 'عجمان', 'أم القيوين', 'رأس الخيمة', 'الفجيرة', 'العين']

interface AutoSettings {
    id: string; is_active: boolean; target_roles: string[]; target_skills: string[]; target_locations: string[]
    target_job_types: string[]; min_salary: number | null; min_match_score: number
    max_applications_per_month: number; applications_this_month: number
    cover_letter_template: string | null; exclude_companies: string[]; last_run_at: string | null
}

interface AutoLog {
    id: string; job_id: string; match_score: number; status: string; reason: string | null; created_at: string
    jobs: { title: string; companies: { name: string } | null } | null
}

export default function AutoApplyPage() {
    const [settings, setSettings] = useState<AutoSettings | null>(null)
    const [log, setLog] = useState<AutoLog[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Form
    const [isActive, setIsActive] = useState(false)
    const [roles, setRoles] = useState<string[]>([])
    const [roleInput, setRoleInput] = useState('')
    const [skills, setSkills] = useState<string[]>([])
    const [skInput, setSkInput] = useState('')
    const [locs, setLocs] = useState<string[]>([])
    const [jTypes, setJTypes] = useState<string[]>([])
    const [minSalary, setMinSalary] = useState('')
    const [minScore, setMinScore] = useState(60)
    const [maxApps, setMaxApps] = useState(50)
    const [coverLetter, setCoverLetter] = useState('')
    const [excludes, setExcludes] = useState<string[]>([])
    const [exInput, setExInput] = useState('')

    useEffect(() => { loadData() }, [])

    async function loadData() {
        setLoading(true)
        const res = await fetch('/api/auto-apply')
        const data = await res.json()
        setLog(data.log || [])
        if (data.settings) {
            const s = data.settings
            setSettings(s)
            setIsActive(s.is_active); setRoles(s.target_roles); setSkills(s.target_skills)
            setLocs(s.target_locations); setJTypes(s.target_job_types)
            setMinSalary(s.min_salary?.toString() || ''); setMinScore(s.min_match_score)
            setMaxApps(s.max_applications_per_month)
            setCoverLetter(s.cover_letter_template || ''); setExcludes(s.exclude_companies)
        }
        setLoading(false)
    }

    function addTag(list: string[], setter: (v: string[]) => void, val: string, inputSetter: (v: string) => void) {
        const v = val.trim()
        if (v && !list.includes(v)) { setter([...list, v]); inputSetter('') }
    }

    async function saveSettings() {
        setSaving(true); setError('')
        try {
            const res = await fetch('/api/auto-apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    is_active: isActive, target_roles: roles, target_skills: skills,
                    target_locations: locs, target_job_types: jTypes,
                    min_salary: minSalary ? +minSalary : null, min_match_score: minScore,
                    max_applications_per_month: maxApps, cover_letter_template: coverLetter || null,
                    exclude_companies: excludes,
                }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'حدث خطأ'); return }
            setSettings(data.settings)
        } catch { setError('فشل الاتصال') }
        finally { setSaving(false) }
    }

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>

    const appsUsed = settings?.applications_this_month || 0
    const appsMax = settings?.max_applications_per_month || maxApps
    const usagePct = Math.min(100, Math.round((appsUsed / appsMax) * 100))

    return (
        <div className="max-w-4xl mx-auto space-y-8" dir="rtl">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-cream flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/20">
                        <Zap className="h-6 w-6 text-violet-400" />
                    </div>
                    التقديم التلقائي
                </h1>
                <p className="text-cream-dark/60">دع النظام يقدم على الوظائف المناسبة نيابة عنك تلقائياً</p>
            </div>

            {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2"><XCircle className="h-5 w-5 shrink-0" />{error}</div>}

            {/* Status Card */}
            <div className="p-6 rounded-2xl bg-navy-light border border-gold/10 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsActive(!isActive)} className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {isActive ? <Power className="h-6 w-6" /> : <PowerOff className="h-6 w-6" />}
                        </button>
                        <div>
                            <h3 className="text-lg font-semibold text-cream">{isActive ? 'التقديم التلقائي مفعّل' : 'التقديم التلقائي متوقف'}</h3>
                            {settings?.last_run_at && (
                                <p className="text-xs text-cream-dark/40 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" />آخر تشغيل: {new Date(settings.last_run_at).toLocaleDateString('ar-AE')}</p>
                            )}
                        </div>
                    </div>
                    <Badge variant="secondary" className={`text-sm ${usagePct >= 90 ? 'bg-red-500/10 text-red-400' : 'bg-gold/10 text-gold'}`}>
                        {appsUsed}/{appsMax} هذا الشهر
                    </Badge>
                </div>

                {/* Usage Bar */}
                <div className="space-y-1">
                    <div className="h-2 rounded-full bg-navy overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${usagePct >= 90 ? 'bg-red-400' : usagePct >= 60 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${usagePct}%` }} />
                    </div>
                </div>
            </div>

            {/* Settings Form */}
            <div className="p-6 rounded-2xl bg-navy-light border border-gold/10 space-y-5">
                <h3 className="text-lg font-semibold text-cream">إعدادات التقديم</h3>

                {/* Roles */}
                <div className="space-y-2">
                    <label className="text-sm text-cream-dark/60">الوظائف المستهدفة</label>
                    <div className="flex gap-2">
                        <Input value={roleInput} onChange={e => setRoleInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(roles, setRoles, roleInput, setRoleInput))}
                            placeholder="مثال: مطور برمجيات" className="bg-navy border-gold/20 text-cream" />
                    </div>
                    {roles.length > 0 && <div className="flex flex-wrap gap-2">{roles.map(r => <Badge key={r} variant="secondary" className="bg-gold/10 text-gold gap-1">{r}<X className="h-3 w-3 cursor-pointer" onClick={() => setRoles(roles.filter(x => x !== r))} /></Badge>)}</div>}
                </div>

                {/* Skills */}
                <div className="space-y-2">
                    <label className="text-sm text-cream-dark/60">مهارات مطلوبة</label>
                    <div className="flex gap-2">
                        <Input value={skInput} onChange={e => setSkInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(skills, setSkills, skInput, setSkInput))}
                            placeholder="أضف مهارة" className="bg-navy border-gold/20 text-cream" />
                    </div>
                    {skills.length > 0 && <div className="flex flex-wrap gap-2">{skills.map(s => <Badge key={s} variant="secondary" className="bg-blue-500/10 text-blue-400 gap-1">{s}<X className="h-3 w-3 cursor-pointer" onClick={() => setSkills(skills.filter(x => x !== s))} /></Badge>)}</div>}
                </div>

                {/* Locations */}
                <div className="space-y-2">
                    <label className="text-sm text-cream-dark/60">المواقع</label>
                    <div className="flex flex-wrap gap-2">
                        {UAE_LOCS.map(loc => (
                            <Button key={loc} variant={locs.includes(loc) ? 'default' : 'outline'} size="sm"
                                onClick={() => setLocs(locs.includes(loc) ? locs.filter(x => x !== loc) : [...locs, loc])}
                                className={locs.includes(loc) ? 'bg-gold text-navy' : 'border-gold/20 text-cream-dark/60'}>
                                {loc}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Job Types */}
                <div className="space-y-2">
                    <label className="text-sm text-cream-dark/60">نوع الوظيفة</label>
                    <div className="flex flex-wrap gap-2">
                        {JOB_TYPES.map(jt => (
                            <Button key={jt.value} variant={jTypes.includes(jt.value) ? 'default' : 'outline'} size="sm"
                                onClick={() => setJTypes(jTypes.includes(jt.value) ? jTypes.filter(x => x !== jt.value) : [...jTypes, jt.value])}
                                className={jTypes.includes(jt.value) ? 'bg-gold text-navy' : 'border-gold/20 text-cream-dark/60'}>
                                {jt.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Min Salary + Match Score + Max Apps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm text-cream-dark/60">الحد الأدنى للراتب (AED)</label>
                        <Input type="number" value={minSalary} onChange={e => setMinSalary(e.target.value)} className="bg-navy border-gold/20 text-cream" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-cream-dark/60">أقل نسبة توافق ({minScore}%)</label>
                        <input type="range" min={20} max={100} step={5} value={minScore} onChange={e => setMinScore(+e.target.value)}
                            className="w-full accent-gold" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-cream-dark/60">أقصى عدد شهرياً</label>
                        <Input type="number" min={1} max={200} value={maxApps} onChange={e => setMaxApps(+e.target.value)} className="bg-navy border-gold/20 text-cream" />
                    </div>
                </div>

                {/* Cover Letter */}
                <div className="space-y-2">
                    <label className="text-sm text-cream-dark/60">قالب رسالة التغطية</label>
                    <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)}
                        placeholder="اكتب رسالة تغطية عامة (سيتم إرسالها مع كل طلب تلقائي)"
                        rows={4} className="w-full rounded-md border border-gold/20 bg-navy text-cream px-3 py-2 text-sm resize-none" />
                </div>

                {/* Exclude Companies */}
                <div className="space-y-2">
                    <label className="text-sm text-cream-dark/60">شركات مستثناة</label>
                    <div className="flex gap-2">
                        <Input value={exInput} onChange={e => setExInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(excludes, setExcludes, exInput, setExInput))}
                            placeholder="اسم شركة لا تريد التقديم عليها" className="bg-navy border-gold/20 text-cream" />
                    </div>
                    {excludes.length > 0 && <div className="flex flex-wrap gap-2">{excludes.map(c => <Badge key={c} variant="secondary" className="bg-red-500/10 text-red-400 gap-1">{c}<X className="h-3 w-3 cursor-pointer" onClick={() => setExcludes(excludes.filter(x => x !== c))} /></Badge>)}</div>}
                </div>

                <Button onClick={saveSettings} disabled={saving} className="w-full bg-gradient-to-r from-gold to-gold-light text-navy font-bold hover:opacity-90">
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin me-2" />جاري الحفظ...</> : <><Sparkles className="h-4 w-4 me-2" />حفظ الإعدادات</>}
                </Button>
            </div>

            {/* Application Log */}
            {log.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-cream flex items-center gap-2"><Briefcase className="h-5 w-5 text-gold" />سجل التقديم التلقائي</h3>
                    <div className="space-y-2">
                        {log.map(l => (
                            <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl bg-navy-light border border-gold/5">
                                {l.status === 'applied' ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-cream truncate">{l.jobs?.title || 'وظيفة محذوفة'}</p>
                                    <p className="text-xs text-cream-dark/40">{l.jobs?.companies?.name || ''}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-gold/10 text-gold text-xs flex items-center gap-1">
                                        <BarChart3 className="h-3 w-3" />{l.match_score}%
                                    </Badge>
                                    <span className="text-xs text-cream-dark/40">{new Date(l.created_at).toLocaleDateString('ar-AE')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
