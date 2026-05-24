'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Plus, Trash2, Search, Loader2, ArrowUpDown } from 'lucide-react'

type SkillAlias = {
    id: string
    alias: string
    canonical: string
    category: string
    created_at: string
}

const CATEGORIES = [
    { value: 'programming', label: 'برمجة', color: 'bg-blue-500/20 text-blue-400 border-blue-500/20' },
    { value: 'databases', label: 'قواعد بيانات', color: 'bg-purple-500/20 text-purple-400 border-purple-500/20' },
    { value: 'cloud', label: 'سحابة', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20' },
    { value: 'design', label: 'تصميم', color: 'bg-pink-500/20 text-pink-400 border-pink-500/20' },
    { value: 'business', label: 'أعمال', color: 'bg-amber-500/20 text-amber-400 border-amber-500/20' },
    { value: 'general', label: 'عام', color: 'bg-cream-dark/20 text-cream-dark/60 border-cream-dark/20' },
]

export default function SkillAliasesPage() {
    const [aliases, setAliases] = useState<SkillAlias[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [search, setSearch] = useState('')
    const [filterCategory, setFilterCategory] = useState<string>('all')

    // Form
    const [newAlias, setNewAlias] = useState('')
    const [newCanonical, setNewCanonical] = useState('')
    const [newCategory, setNewCategory] = useState('general')
    const [error, setError] = useState('')

    const fetchAliases = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/skill-aliases')
            const json = await res.json()
            setAliases(json.data || [])
        } catch {
            setError('فشل في تحميل البيانات')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchAliases() }, [])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newAlias.trim() || !newCanonical.trim()) return
        setSubmitting(true)
        setError('')

        try {
            const res = await fetch('/api/admin/skill-aliases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alias: newAlias, canonical: newCanonical, category: newCategory }),
            })
            const json = await res.json()
            if (!res.ok) {
                setError(json.error || 'فشل في الإضافة')
                return
            }
            setNewAlias('')
            setNewCanonical('')
            fetchAliases()
        } catch {
            setError('فشل في الإضافة')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الاسم المستعار؟')) return
        try {
            await fetch(`/api/admin/skill-aliases?id=${id}`, { method: 'DELETE' })
            fetchAliases()
        } catch {
            setError('فشل في الحذف')
        }
    }

    const getCategoryBadge = (cat: string) => {
        const found = CATEGORIES.find(c => c.value === cat)
        return found || CATEGORIES[CATEGORIES.length - 1]
    }

    // Filtering
    const filtered = aliases.filter(a => {
        const matchesSearch = search
            ? a.alias.toLowerCase().includes(search.toLowerCase()) ||
              a.canonical.toLowerCase().includes(search.toLowerCase())
            : true
        const matchesCategory = filterCategory === 'all' || a.category === filterCategory
        return matchesSearch && matchesCategory
    })

    // Group by canonical
    const grouped = filtered.reduce<Record<string, SkillAlias[]>>((acc, a) => {
        const key = a.canonical.toLowerCase()
        if (!acc[key]) acc[key] = []
        acc[key].push(a)
        return acc
    }, {})

    const totalCanonicals = new Set(aliases.map(a => a.canonical.toLowerCase())).size

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-cream flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-gold" />
                        قاموس المهارات
                    </h1>
                    <p className="text-cream-dark/50 mt-1">
                        إدارة الأسماء المستعارة للمهارات (عربي ↔ إنجليزي) لتحسين نظام المطابقة الذكي
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge className="bg-gold/10 text-gold border-gold/20 text-sm px-3 py-1">
                        {aliases.length} اسم مستعار
                    </Badge>
                    <Badge className="bg-success/10 text-success border-success/20 text-sm px-3 py-1">
                        {totalCanonicals} مهارة أساسية
                    </Badge>
                </div>
            </div>

            {/* Add Form */}
            <Card className="bg-navy-light/80 border-gold/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-cream text-base flex items-center gap-2">
                        <Plus className="h-5 w-5 text-gold" />
                        إضافة اسم مستعار جديد
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[180px]">
                            <label className="text-xs text-cream-dark/50 mb-1 block">الاسم المستعار</label>
                            <Input
                                value={newAlias}
                                onChange={e => setNewAlias(e.target.value)}
                                placeholder="مثال: رياكت"
                                className="bg-navy border-gold/15 text-cream placeholder:text-cream-dark/30"
                            />
                        </div>
                        <div className="flex items-center text-gold text-lg px-2 pt-4">
                            <ArrowUpDown className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-[180px]">
                            <label className="text-xs text-cream-dark/50 mb-1 block">الشكل الأساسي (إنجليزي)</label>
                            <Input
                                value={newCanonical}
                                onChange={e => setNewCanonical(e.target.value)}
                                placeholder="مثال: react"
                                className="bg-navy border-gold/15 text-cream placeholder:text-cream-dark/30"
                                dir="ltr"
                            />
                        </div>
                        <div className="min-w-[140px]">
                            <label className="text-xs text-cream-dark/50 mb-1 block">الفئة</label>
                            <select
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value)}
                                className="w-full h-10 px-3 rounded-md bg-navy border border-gold/15 text-cream text-sm"
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <Button
                            type="submit"
                            disabled={submitting || !newAlias.trim() || !newCanonical.trim()}
                            className="bg-gold hover:bg-gold-dark text-navy font-bold h-10"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 me-1" />}
                            إضافة
                        </Button>
                    </form>
                    {error && (
                        <p className="text-red-400 text-sm mt-3">{error}</p>
                    )}
                </CardContent>
            </Card>

            {/* Search & Filter */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-dark/30" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="بحث عن مهارة..."
                        className="bg-navy-light border-gold/15 text-cream pe-10 placeholder:text-cream-dark/30"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={filterCategory === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterCategory('all')}
                        className={filterCategory === 'all'
                            ? 'bg-gold text-navy'
                            : 'border-gold/20 text-cream-dark/60 hover:bg-gold/10'
                        }
                    >
                        الكل
                    </Button>
                    {CATEGORIES.map(c => (
                        <Button
                            key={c.value}
                            variant={filterCategory === c.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterCategory(c.value)}
                            className={filterCategory === c.value
                                ? 'bg-gold text-navy'
                                : 'border-gold/20 text-cream-dark/60 hover:bg-gold/10'
                            }
                        >
                            {c.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Aliases Table */}
            <Card className="bg-navy-light/80 border-gold/10">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto" />
                            <p className="text-cream-dark/50 mt-3">جاري التحميل...</p>
                        </div>
                    ) : Object.keys(grouped).length === 0 ? (
                        <div className="text-center py-12">
                            <Sparkles className="h-10 w-10 text-gold/20 mx-auto mb-3" />
                            <p className="text-cream-dark/50">لا توجد أسماء مستعارة</p>
                            <p className="text-cream-dark/30 text-sm mt-1">قم بتشغيل ملف الترحيل في Supabase أولاً</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gold/10 text-xs font-medium text-cream-dark/40 uppercase tracking-wider">
                                        <th className="text-right py-3 px-4">المهارة الأساسية</th>
                                        <th className="text-right py-3 px-4">الأسماء المستعارة</th>
                                        <th className="text-center py-3 px-4">الفئة</th>
                                        <th className="text-center py-3 px-4">إجراء</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(grouped).map(([canonical, items]) => {
                                        const cat = getCategoryBadge(items[0].category)
                                        return (
                                            <tr key={canonical} className="border-b border-gold/5 last:border-0">
                                                <td className="py-4 px-4">
                                                    <span className="text-gold font-semibold text-sm" dir="ltr">{canonical}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {items.map(item => (
                                                            <span
                                                                key={item.id}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-navy/60 border border-gold/10 text-xs text-cream-dark/70"
                                                            >
                                                                {item.alias}
                                                                <button
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="text-red-400/50 hover:text-red-400 transition-colors ms-0.5"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <Badge className={cat.color + ' text-xs'}>{cat.label}</Badge>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className="text-xs text-cream-dark/30">{items.length} اسم</span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
