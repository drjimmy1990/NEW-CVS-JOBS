'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
    FileText, Plus, Eye, Pencil, Trash2, Loader2, Copy,
    Building2, Lock, MoreHorizontal
} from 'lucide-react'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface Template {
    id: string
    name: string
    company_id: string | null
    created_at: string
    updated_at: string
    html_content?: string
}

const PLACEHOLDERS = [
    { key: '{{company_name}}', label: 'اسم الشركة' },
    { key: '{{candidate_name}}', label: 'اسم المرشح' },
    { key: '{{position}}', label: 'المسمى الوظيفي' },
    { key: '{{salary}}', label: 'الراتب' },
    { key: '{{start_date}}', label: 'تاريخ المباشرة' },
    { key: '{{benefits}}', label: 'المزايا' },
]

export default function ContractTemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([])
    const [loading, setLoading] = useState(true)
    const [showEditor, setShowEditor] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [editing, setEditing] = useState<Template | null>(null)
    const [previewHtml, setPreviewHtml] = useState('')
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ name: '', html_content: '' })

    useEffect(() => { loadTemplates() }, [])

    const loadTemplates = async () => {
        setLoading(true)
        const res = await fetch('/api/contracts/templates')
        const data = await res.json()
        setTemplates(data.templates || [])
        setLoading(false)
    }

    const openNew = () => {
        setEditing(null)
        setForm({ name: '', html_content: getDefaultHtml() })
        setShowEditor(true)
    }

    const openEdit = async (tpl: Template) => {
        // Fetch full template with HTML
        const res = await fetch('/api/contracts/templates')
        const data = await res.json()
        const full = (data.templates || []).find((t: any) => t.id === tpl.id)
        setEditing(tpl)
        setForm({ name: tpl.name, html_content: full?.html_content || '' })
        setShowEditor(true)
    }

    const handleSave = async () => {
        if (!form.name || !form.html_content) {
            toast.error('الاسم والمحتوى مطلوبان')
            return
        }
        setSaving(true)
        try {
            const method = editing ? 'PUT' : 'POST'
            const body = editing
                ? { id: editing.id, ...form }
                : form
            const res = await fetch('/api/contracts/templates', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (res.ok) {
                toast.success(editing ? 'تم تحديث القالب' : 'تم إنشاء القالب')
                setShowEditor(false)
                loadTemplates()
            } else {
                const err = await res.json()
                toast.error(err.error || 'فشل الحفظ')
            }
        } catch {
            toast.error('خطأ في الاتصال')
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return
        const res = await fetch(`/api/contracts/templates?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
            toast.success('تم حذف القالب')
            loadTemplates()
        } else {
            const err = await res.json()
            toast.error(err.error || 'فشل الحذف')
        }
    }

    const handlePreview = (html: string) => {
        // Replace placeholders with sample data
        let rendered = html
            .replace(/\{\{company_name\}\}/g, 'شركة النمو الذكي')
            .replace(/\{\{candidate_name\}\}/g, 'أحمد محمد')
            .replace(/\{\{position\}\}/g, 'مهندس برمجيات أول')
            .replace(/\{\{salary\}\}/g, '25,000')
            .replace(/\{\{start_date\}\}/g, '2026-06-01')
            .replace(/\{\{benefits\}\}/g, 'تأمين صحي، بدل سكن، بدل نقل')
        setPreviewHtml(rendered)
        setShowPreview(true)
    }

    const insertPlaceholder = (key: string) => {
        setForm(prev => ({ ...prev, html_content: prev.html_content + key }))
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-cream">قوالب العقود</h1>
                    <p className="text-cream-dark/50 mt-1">إدارة قوالب عقود العمل وخطابات العرض</p>
                </div>
                <Button onClick={openNew} className="bg-gold hover:bg-gold-dark text-navy font-bold">
                    <Plus className="me-2 h-4 w-4" />
                    قالب جديد
                </Button>
            </div>

            {/* Templates Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-gold" />
                </div>
            ) : templates.length === 0 ? (
                <Card className="bg-navy-light border-gold/10">
                    <CardContent className="p-12 text-center">
                        <FileText className="h-12 w-12 text-gold/20 mx-auto mb-4" />
                        <h3 className="text-cream text-lg font-medium mb-2">لا توجد قوالب بعد</h3>
                        <p className="text-cream-dark/40 text-sm mb-6">ابدأ بإنشاء قالب عقد عمل أو استخدم القالب الافتراضي</p>
                        <Button onClick={openNew} className="bg-gold hover:bg-gold-dark text-navy">
                            <Plus className="me-2 h-4 w-4" />إنشاء قالب
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(tpl => (
                        <Card key={tpl.id} className="bg-navy-light border-gold/10 hover:border-gold/20 transition-colors">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-lg bg-gold/10">
                                            <FileText className="h-5 w-5 text-gold" />
                                        </div>
                                        <div>
                                            <h3 className="text-cream font-medium text-sm">{tpl.name}</h3>
                                            <p className="text-[10px] text-cream-dark/40 mt-0.5">
                                                {new Date(tpl.created_at).toLocaleDateString('ar-AE')}
                                            </p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-cream-dark/40">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-navy-light border-gold/15">
                                            <DropdownMenuItem onClick={() => handlePreview(tpl.html_content || '')} className="text-cream hover:bg-navy-lighter">
                                                <Eye className="h-4 w-4 me-2" />معاينة
                                            </DropdownMenuItem>
                                            {tpl.company_id && (
                                                <>
                                                    <DropdownMenuItem onClick={() => openEdit(tpl)} className="text-cream hover:bg-navy-lighter">
                                                        <Pencil className="h-4 w-4 me-2" />تعديل
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(tpl.id)} className="text-red-400 hover:bg-navy-lighter">
                                                        <Trash2 className="h-4 w-4 me-2" />حذف
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Badge */}
                                {tpl.company_id ? (
                                    <Badge className="bg-blue-500/10 text-blue-400 border-0 text-[10px]">
                                        <Building2 className="h-3 w-3 me-1" />قالب الشركة
                                    </Badge>
                                ) : (
                                    <Badge className="bg-gold/10 text-gold border-0 text-[10px]">
                                        <Lock className="h-3 w-3 me-1" />قالب النظام (MOHRE)
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Editor Dialog */}
            <Dialog open={showEditor} onOpenChange={setShowEditor}>
                <DialogContent className="bg-navy-light border-gold/15 max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-cream">
                            {editing ? 'تعديل القالب' : 'قالب جديد'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">اسم القالب</Label>
                            <Input
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="مثل: عقد عمل محدد المدة"
                                className="bg-navy border-gold/15 text-cream"
                            />
                        </div>

                        {/* Placeholder buttons */}
                        <div>
                            <Label className="text-cream-dark/70 text-xs mb-2 block">إدراج متغير:</Label>
                            <div className="flex flex-wrap gap-2">
                                {PLACEHOLDERS.map(p => (
                                    <Button key={p.key} variant="outline" size="sm"
                                        onClick={() => insertPlaceholder(p.key)}
                                        className="border-gold/10 text-cream-dark/60 text-xs hover:bg-gold/5">
                                        <Copy className="h-3 w-3 me-1" />{p.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">محتوى HTML</Label>
                            <Textarea
                                value={form.html_content}
                                onChange={e => setForm({ ...form, html_content: e.target.value })}
                                placeholder="<html>...</html>"
                                className="bg-navy border-gold/15 text-cream font-mono text-xs min-h-[300px]"
                            />
                        </div>

                        {/* Quick Preview */}
                        <Button variant="outline" onClick={() => handlePreview(form.html_content)}
                            className="border-gold/10 text-gold text-xs">
                            <Eye className="h-3 w-3 me-1" />معاينة سريعة
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowEditor(false)} className="text-cream-dark/50">إلغاء</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-gold hover:bg-gold-dark text-navy font-bold">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ القالب'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="bg-white max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900">معاينة العقد</DialogTitle>
                    </DialogHeader>
                    <div className="border rounded-lg p-6" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </DialogContent>
            </Dialog>
        </div>
    )
}

function getDefaultHtml() {
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: "Arial", sans-serif; padding: 40px; line-height: 1.8; }
        h1 { text-align: center; color: #0A1628; border-bottom: 2px solid #C8973A; padding-bottom: 10px; }
        .details p { margin: 8px 0; font-size: 15px; }
        .signature { margin-top: 60px; display: flex; justify-content: space-between; }
        .sig-box { width: 40%; text-align: center; border-top: 1px solid #333; padding-top: 10px; }
    </style>
</head>
<body>
    <h1>عقد عمل</h1>
    <div class="details">
        <p><strong>الطرف الأول (صاحب العمل):</strong> {{company_name}}</p>
        <p><strong>الطرف الثاني (العامل):</strong> {{candidate_name}}</p>
        <p><strong>المسمى الوظيفي:</strong> {{position}}</p>
        <p><strong>الراتب:</strong> {{salary}} درهم إماراتي</p>
        <p><strong>تاريخ المباشرة:</strong> {{start_date}}</p>
        <p><strong>المزايا:</strong> {{benefits}}</p>
    </div>
    <div class="signature">
        <div class="sig-box">توقيع صاحب العمل<br>{{company_name}}</div>
        <div class="sig-box">توقيع العامل<br>{{candidate_name}}</div>
    </div>
</body>
</html>`
}
