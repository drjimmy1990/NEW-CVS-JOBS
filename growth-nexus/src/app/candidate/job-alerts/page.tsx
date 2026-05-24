'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Bell, Loader2, Plus, X, Trash2, XCircle,
    Power, PowerOff, Clock, Mail, Sparkles
} from 'lucide-react'

const JOB_TYPES = [
    { value: 'full_time', label: 'دوام كامل' },
    { value: 'part_time', label: 'دوام جزئي' },
    { value: 'contract', label: 'عقد' },
    { value: 'remote', label: 'عن بعد' },
    { value: 'internship', label: 'تدريب' },
]

const UAE_LOCS = ['أبوظبي', 'دبي', 'الشارقة', 'عجمان', 'أم القيوين', 'رأس الخيمة', 'الفجيرة', 'العين']

interface AlertPref {
    id: string; alert_name: string; keywords: string[]; skills: string[]; job_types: string[]
    locations: string[]; salary_min: number | null; salary_max: number | null
    frequency: string; is_active: boolean; last_sent_at: string | null; created_at: string
}

interface AlertHist {
    id: string; jobs_matched: number; sent_at: string
}

export default function JobAlertsPage() {
    const [prefs, setPrefs] = useState<AlertPref[]>([])
    const [history, setHistory] = useState<AlertHist[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [showForm, setShowForm] = useState(false)

    // Form state
    const [alertName, setAlertName] = useState('')
    const [keywords, setKeywords] = useState<string[]>([])
    const [kwInput, setKwInput] = useState('')
    const [skills, setSkills] = useState<string[]>([])
    const [skInput, setSkInput] = useState('')
    const [jobTypes, setJobTypes] = useState<string[]>([])
    const [locations, setLocations] = useState<string[]>([])
    const [salaryMin, setSalaryMin] = useState('')
    const [salaryMax, setSalaryMax] = useState('')
    const [frequency, setFrequency] = useState('daily')

    useEffect(() => { loadData() }, [])

    async function loadData() {
        setLoading(true)
        const res = await fetch('/api/job-alerts')
        const data = await res.json()
        setPrefs(data.preferences || [])
        setHistory(data.history || [])
        setLoading(false)
    }

    function addTag(list: string[], setter: (v: string[]) => void, val: string, inputSetter: (v: string) => void) {
        const v = val.trim()
        if (v && !list.includes(v)) { setter([...list, v]); inputSetter('') }
    }

    async function saveAlert() {
        if (!alertName.trim()) { setError('اسم التنبيه مطلوب'); return }
        setSaving(true); setError('')
        try {
            const res = await fetch('/api/job-alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    alert_name: alertName, keywords, skills, job_types: jobTypes,
                    locations, salary_min: salaryMin ? +salaryMin : null,
                    salary_max: salaryMax ? +salaryMax : null, frequency,
                }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'حدث خطأ'); return }
            resetForm(); await loadData()
        } catch { setError('فشل الاتصال') }
        finally { setSaving(false) }
    }

    function resetForm() {
        setShowForm(false); setAlertName(''); setKeywords([]); setSkills([])
        setJobTypes([]); setLocations([]); setSalaryMin(''); setSalaryMax(''); setFrequency('daily')
    }

    async function toggleActive(id: string, current: boolean) {
        await fetch('/api/job-alerts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, is_active: !current }),
        })
        setPrefs(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
    }

    async function deleteAlert(id: string) {
        await fetch(`/api/job-alerts?id=${id}`, { method: 'DELETE' })
        setPrefs(prev => prev.filter(p => p.id !== id))
    }

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>

    return (
        <div className="max-w-4xl mx-auto space-y-8" dir="rtl">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-cream flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center border border-amber-500/20">
                            <Bell className="h-6 w-6 text-amber-400" />
                        </div>
                        تنبيهات الوظائف
                    </h1>
                    <p className="text-cream-dark/60">احصل على إشعارات عندما تظهر وظائف تناسب مهاراتك</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold hover:opacity-90">
                    <Plus className="h-4 w-4 me-2" />تنبيه جديد
                </Button>
            </div>

            {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2"><XCircle className="h-5 w-5 shrink-0" />{error}</div>}

            {/* Create Form */}
            {showForm && (
                <div className="p-6 rounded-2xl bg-navy-light border border-gold/10 space-y-5 animate-in slide-in-from-top-2 duration-300">
                    <h3 className="text-lg font-semibold text-cream">إنشاء تنبيه جديد</h3>

                    <div className="space-y-2">
                        <label className="text-sm text-cream-dark/60">اسم التنبيه *</label>
                        <Input value={alertName} onChange={e => setAlertName(e.target.value)} placeholder="مثال: وظائف البرمجة في دبي" className="bg-navy border-gold/20 text-cream" />
                    </div>

                    {/* Keywords */}
                    <div className="space-y-2">
                        <label className="text-sm text-cream-dark/60">كلمات مفتاحية</label>
                        <div className="flex gap-2">
                            <Input value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(keywords, setKeywords, kwInput, setKwInput))}
                                placeholder="أضف كلمة مفتاحية" className="bg-navy border-gold/20 text-cream" />
                        </div>
                        {keywords.length > 0 && <div className="flex flex-wrap gap-2">{keywords.map(k => <Badge key={k} variant="secondary" className="bg-gold/10 text-gold gap-1">{k}<X className="h-3 w-3 cursor-pointer" onClick={() => setKeywords(keywords.filter(x => x !== k))} /></Badge>)}</div>}
                    </div>

                    {/* Skills */}
                    <div className="space-y-2">
                        <label className="text-sm text-cream-dark/60">مهارات</label>
                        <div className="flex gap-2">
                            <Input value={skInput} onChange={e => setSkInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(skills, setSkills, skInput, setSkInput))}
                                placeholder="أضف مهارة" className="bg-navy border-gold/20 text-cream" />
                        </div>
                        {skills.length > 0 && <div className="flex flex-wrap gap-2">{skills.map(s => <Badge key={s} variant="secondary" className="bg-blue-500/10 text-blue-400 gap-1">{s}<X className="h-3 w-3 cursor-pointer" onClick={() => setSkills(skills.filter(x => x !== s))} /></Badge>)}</div>}
                    </div>

                    {/* Job Types */}
                    <div className="space-y-2">
                        <label className="text-sm text-cream-dark/60">نوع الوظيفة</label>
                        <div className="flex flex-wrap gap-2">
                            {JOB_TYPES.map(jt => (
                                <Button key={jt.value} variant={jobTypes.includes(jt.value) ? 'default' : 'outline'} size="sm"
                                    onClick={() => setJobTypes(jobTypes.includes(jt.value) ? jobTypes.filter(x => x !== jt.value) : [...jobTypes, jt.value])}
                                    className={jobTypes.includes(jt.value) ? 'bg-gold text-navy' : 'border-gold/20 text-cream-dark/60'}>
                                    {jt.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Locations */}
                    <div className="space-y-2">
                        <label className="text-sm text-cream-dark/60">المواقع</label>
                        <div className="flex flex-wrap gap-2">
                            {UAE_LOCS.map(loc => (
                                <Button key={loc} variant={locations.includes(loc) ? 'default' : 'outline'} size="sm"
                                    onClick={() => setLocations(locations.includes(loc) ? locations.filter(x => x !== loc) : [...locations, loc])}
                                    className={locations.includes(loc) ? 'bg-gold text-navy' : 'border-gold/20 text-cream-dark/60'}>
                                    {loc}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Salary + Frequency */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-cream-dark/60">الحد الأدنى (AED)</label>
                            <Input type="number" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} className="bg-navy border-gold/20 text-cream" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-cream-dark/60">الحد الأعلى (AED)</label>
                            <Input type="number" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} className="bg-navy border-gold/20 text-cream" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-cream-dark/60">التكرار</label>
                            <select value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full h-10 rounded-md border border-gold/20 bg-navy text-cream px-3 text-sm">
                                <option value="daily">يومياً</option>
                                <option value="weekly">أسبوعياً</option>
                                <option value="instant">فوري</option>
                            </select>
                        </div>
                    </div>

                    <Button onClick={saveAlert} disabled={saving} className="w-full bg-gradient-to-r from-gold to-gold-light text-navy font-bold hover:opacity-90">
                        {saving ? <><Loader2 className="h-4 w-4 animate-spin me-2" />جاري الحفظ...</> : <><Sparkles className="h-4 w-4 me-2" />حفظ التنبيه</>}
                    </Button>
                </div>
            )}

            {/* Empty */}
            {prefs.length === 0 && !showForm && (
                <div className="text-center py-16 px-8 rounded-2xl bg-navy-light border border-gold/10">
                    <Bell className="h-16 w-16 text-cream-dark/20 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-cream mb-2">لا توجد تنبيهات</h3>
                    <p className="text-cream-dark/50 mb-4">أنشئ تنبيه ليصلك إشعار عند ظهور وظائف تناسبك</p>
                    <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-gold to-gold-light text-navy font-bold"><Plus className="h-4 w-4 me-2" />تنبيه جديد</Button>
                </div>
            )}

            {/* Alerts List */}
            <div className="space-y-3">
                {prefs.map(p => (
                    <div key={p.id} className={`p-5 rounded-2xl bg-navy-light border ${p.is_active ? 'border-gold/20' : 'border-gold/5 opacity-60'} transition-all`}>
                        <div className="flex items-center gap-4">
                            <button onClick={() => toggleActive(p.id, p.is_active)} className={`h-10 w-10 rounded-xl flex items-center justify-center ${p.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {p.is_active ? <Power className="h-5 w-5" /> : <PowerOff className="h-5 w-5" />}
                            </button>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-cream">{p.alert_name}</h3>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {p.keywords.map(k => <Badge key={k} variant="secondary" className="bg-gold/10 text-gold text-[10px]">{k}</Badge>)}
                                    {p.skills.map(s => <Badge key={s} variant="secondary" className="bg-blue-500/10 text-blue-400 text-[10px]">{s}</Badge>)}
                                    {p.locations.map(l => <Badge key={l} variant="secondary" className="bg-purple-500/10 text-purple-400 text-[10px]">{l}</Badge>)}
                                </div>
                                <div className="flex items-center gap-3 mt-2 text-xs text-cream-dark/40">
                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.frequency === 'daily' ? 'يومياً' : p.frequency === 'weekly' ? 'أسبوعياً' : 'فوري'}</span>
                                    {p.last_sent_at && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />آخر إرسال: {new Date(p.last_sent_at).toLocaleDateString('ar-AE')}</span>}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => deleteAlert(p.id)} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* History */}
            {history.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-cream">سجل التنبيهات</h3>
                    <div className="space-y-2">
                        {history.map(h => (
                            <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl bg-navy-light border border-gold/5">
                                <Mail className="h-4 w-4 text-gold shrink-0" />
                                <span className="text-sm text-cream-dark/60 flex-1">{h.jobs_matched} وظائف مطابقة</span>
                                <span className="text-xs text-cream-dark/40">{new Date(h.sent_at).toLocaleDateString('ar-AE')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
