'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Pencil, Save, X, Settings, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ConfigItem {
    key: string; value: string; description: string | null; group_name: string | null; is_secret: boolean
}

export default function AdminConfigPage() {
    const supabase = createClient()
    const [configs, setConfigs] = useState<ConfigItem[]>([])
    const [loading, setLoading] = useState(true)
    const [editingKey, setEditingKey] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')

    useEffect(() => {
        loadConfigs()
    }, [])

    const loadConfigs = async () => {
        setLoading(true)
        const { data } = await supabase.from('system_config').select('*').order('group_name').order('key')
        setConfigs(data || [])
        setLoading(false)
    }

    const handleEdit = (item: ConfigItem) => {
        setEditingKey(item.key)
        setEditValue(item.value)
    }

    const handleSave = async (key: string) => {
        const { error } = await supabase.from('system_config').update({ value: editValue }).eq('key', key)
        if (error) { toast.error('فشل الحفظ: ' + error.message) } else {
            toast.success('تم الحفظ')
            setConfigs(configs.map(c => c.key === key ? { ...c, value: editValue } : c))
        }
        setEditingKey(null)
    }

    const groups = [...new Set(configs.map(c => c.group_name || 'عام'))]

    if (loading) return <div className="flex items-center gap-2 text-cream-dark/50"><Loader2 className="h-5 w-5 animate-spin" />جاري التحميل...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-cream">إعدادات النظام</h1>
                    <p className="text-cream-dark/50 mt-1">إدارة إعدادات المنصة والأسعار والقوائم المرجعية</p>
                </div>
            </div>

            {groups.map(group => (
                <Card key={group} className="bg-navy-light border-gold/10">
                    <CardHeader>
                        <CardTitle className="text-cream flex items-center gap-2">
                            <Settings className="h-5 w-5 text-gold" />
                            {group}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {configs.filter(c => (c.group_name || 'عام') === group).map(item => (
                            <div key={item.key} className="p-4 bg-navy-lighter/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <code className="text-gold text-sm bg-gold/10 px-2 py-0.5 rounded">{item.key}</code>
                                        {item.is_secret && <Badge className="bg-red-500/15 text-red-400 text-xs">سري</Badge>}
                                    </div>
                                    {editingKey === item.key ? (
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleSave(item.key)} className="bg-success hover:bg-success-dark text-white h-7">
                                                <Save className="h-3 w-3 me-1" />حفظ
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)} className="text-cream-dark/50 h-7">
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)} className="text-cream-dark/50 hover:text-gold h-7">
                                            <Pencil className="h-3 w-3 me-1" />تعديل
                                        </Button>
                                    )}
                                </div>
                                {item.description && <p className="text-cream-dark/40 text-xs mb-2">{item.description}</p>}
                                {editingKey === item.key ? (
                                    <Input value={editValue} onChange={e => setEditValue(e.target.value)}
                                        className="bg-navy border-gold/10 text-cream font-mono text-sm" />
                                ) : (
                                    <p className="text-cream-dark/70 text-sm font-mono bg-navy/50 p-2 rounded overflow-x-auto whitespace-nowrap">
                                        {item.is_secret ? '••••••••' : (item.value.length > 120 ? item.value.slice(0, 120) + '...' : item.value)}
                                    </p>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
