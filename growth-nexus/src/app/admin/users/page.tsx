'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Users, Search, Loader2, Shield, ShieldCheck, ShieldX } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function AdminUsersPage() {
    const supabase = createClient()
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterRole, setFilterRole] = useState('all')

    useEffect(() => { loadUsers() }, [])

    const loadUsers = async () => {
        setLoading(true)
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100)
        setUsers(data || [])
        setLoading(false)
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
        if (error) { toast.error('فشل تحديث الدور') } else {
            toast.success('تم تحديث الدور')
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
        }
    }

    const filtered = users.filter(u => {
        if (filterRole !== 'all' && u.role !== filterRole) return false
        if (search) {
            const s = search.toLowerCase()
            return (u.full_name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s)
        }
        return true
    })

    const roleColors: Record<string, string> = {
        candidate: 'bg-blue-500/15 text-blue-400',
        employer: 'bg-gold/15 text-gold',
        admin: 'bg-red-500/15 text-red-400',
    }
    const roleLabels: Record<string, string> = { candidate: 'مرشح', employer: 'صاحب عمل', admin: 'مدير' }

    if (loading) return <div className="flex items-center gap-2 text-cream-dark/50"><Loader2 className="h-5 w-5 animate-spin" />جاري التحميل...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-cream">المستخدمون</h1>
                <Badge className="bg-navy-lighter text-cream-dark/50">{users.length} مستخدم</Badge>
            </div>

            <div className="flex gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-dark/30" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو البريد..."
                        className="bg-navy-lighter border-gold/10 text-cream pr-10" />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-40 bg-navy-lighter border-gold/10 text-cream"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-navy-light border-gold/10">
                        <SelectItem value="all" className="text-cream">الكل</SelectItem>
                        <SelectItem value="candidate" className="text-cream">مرشح</SelectItem>
                        <SelectItem value="employer" className="text-cream">صاحب عمل</SelectItem>
                        <SelectItem value="admin" className="text-cream">مدير</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                {filtered.map(u => (
                    <Card key={u.id} className="bg-navy-light border-gold/10">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-navy-lighter flex items-center justify-center text-cream-dark/50 font-bold">
                                    {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p className="text-cream text-sm font-medium">{u.full_name || 'بدون اسم'}</p>
                                    <p className="text-cream-dark/40 text-xs">{u.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-cream-dark/30 text-xs">{new Date(u.created_at).toLocaleDateString('ar-AE')}</span>
                                <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}>
                                    <SelectTrigger className={`w-32 h-8 text-xs ${roleColors[u.role] || ''} border-0`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-navy-light border-gold/10">
                                        <SelectItem value="candidate" className="text-cream text-xs">مرشح</SelectItem>
                                        <SelectItem value="employer" className="text-cream text-xs">صاحب عمل</SelectItem>
                                        <SelectItem value="admin" className="text-cream text-xs">مدير</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
