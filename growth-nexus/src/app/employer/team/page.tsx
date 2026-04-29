'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Users, UserPlus, Mail, Shield, ShieldCheck, Eye, Crown,
    Loader2, Trash2, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type Member = {
    id: string
    user_id: string
    role: string
    status: string
    invited_email: string | null
    invited_at: string
    accepted_at: string | null
    profiles: {
        full_name: string | null
        email: string | null
    } | null
}

const roleConfig: Record<string, { label: string; icon: any; color: string; description: string }> = {
    owner: { label: 'مالك', icon: Crown, color: 'bg-gold/20 text-gold border-gold/30', description: 'صلاحيات كاملة' },
    admin: { label: 'مدير', icon: ShieldCheck, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', description: 'إدارة الوظائف والدعوات' },
    member: { label: 'عضو', icon: Shield, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', description: 'عرض المتقدمين وتقييمهم' },
    viewer: { label: 'مراقب', icon: Eye, color: 'bg-cream-dark/20 text-cream-dark/60 border-cream-dark/30', description: 'عرض فقط' },
}

export default function TeamPage() {
    const [members, setMembers] = useState<Member[]>([])
    const [myRole, setMyRole] = useState('')
    const [loading, setLoading] = useState(true)
    const [inviting, setInviting] = useState(false)
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('member')
    const [removingId, setRemovingId] = useState<string | null>(null)

    useEffect(() => { loadMembers() }, [])

    const loadMembers = async () => {
        const res = await fetch('/api/team')
        const data = await res.json()
        setMembers(data.members || [])
        setMyRole(data.myRole || '')
        setLoading(false)
    }

    const handleInvite = async () => {
        if (!email.trim()) return toast.error('أدخل البريد الإلكتروني')
        setInviting(true)
        try {
            const res = await fetch('/api/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), role }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                if (data.warning) {
                    setTimeout(() => toast.warning(data.warning), 500)
                }
                setEmail('')
                loadMembers()
            } else {
                toast.error(data.error)
            }
        } catch {
            toast.error('حدث خطأ')
        }
        setInviting(false)
    }

    const handleRemove = async (memberId: string) => {
        setRemovingId(memberId)
        try {
            const res = await fetch('/api/team', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                loadMembers()
            } else {
                toast.error(data.error)
            }
        } catch {
            toast.error('حدث خطأ')
        }
        setRemovingId(null)
    }

    const canInvite = ['owner', 'admin'].includes(myRole)
    const canRemove = ['owner', 'admin'].includes(myRole)

    const formatDate = (d: string) => new Date(d).toLocaleDateString('ar-AE', { month: 'short', day: 'numeric', year: 'numeric' })

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-cream flex items-center gap-3">
                    <Users className="h-8 w-8 text-gold" />
                    فريق العمل
                </h1>
                <p className="text-cream-dark/50 mt-1">
                    إدارة أعضاء الفريق والصلاحيات — {members.filter(m => m.status === 'active').length} أعضاء نشطين
                </p>
            </div>

            {/* Invite Form */}
            {canInvite && (
                <Card className="bg-navy-light border-gold/10">
                    <CardHeader>
                        <CardTitle className="text-cream text-sm flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-gold" />
                            إضافة عضو جديد
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cream-dark/30" />
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="البريد الإلكتروني للعضو..."
                                    className="bg-navy border-gold/10 text-cream pr-10"
                                    dir="ltr"
                                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                                />
                            </div>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger className="w-[140px] bg-navy border-gold/10 text-cream">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-navy-light border-gold/10">
                                    <SelectItem value="admin" className="text-cream">مدير</SelectItem>
                                    <SelectItem value="member" className="text-cream">عضو</SelectItem>
                                    <SelectItem value="viewer" className="text-cream">مراقب</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleInvite} disabled={inviting} className="bg-gold hover:bg-gold-dark text-navy font-bold px-6">
                                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إضافة'}
                            </Button>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-cream-dark/40">
                            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span>يجب أن يكون العضو مسجلاً في المنصة. بعد الإضافة، سيظهر لوحة تحكم الشركة عند تسجيل دخوله.</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Roles Explanation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(roleConfig).map(([key, config]) => {
                    const Icon = config.icon
                    return (
                        <div key={key} className="p-3 rounded-lg border border-gold/5 bg-navy-lighter/30">
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className="h-3.5 w-3.5 text-gold" />
                                <span className="text-xs font-medium text-cream">{config.label}</span>
                            </div>
                            <p className="text-[10px] text-cream-dark/30">{config.description}</p>
                        </div>
                    )
                })}
            </div>

            {/* Members List */}
            <div className="space-y-3">
                {members.filter(m => m.status === 'active').map(member => {
                    const config = roleConfig[member.role] || roleConfig.member
                    const Icon = config.icon
                    return (
                        <Card key={member.id} className="bg-navy-light border-gold/10 hover:border-gold/20 transition-colors">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold">
                                        {(member.profiles?.full_name || member.invited_email || '?')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-cream font-medium">
                                            {member.profiles?.full_name || member.invited_email || 'مستخدم'}
                                        </p>
                                        <p className="text-cream-dark/40 text-xs" dir="ltr">
                                            {member.profiles?.email || member.invited_email}
                                        </p>
                                        {member.accepted_at && (
                                            <p className="text-cream-dark/20 text-[10px] mt-0.5">
                                                انضم {formatDate(member.accepted_at)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge className={config.color}>
                                        <Icon className="h-3 w-3 me-1" />
                                        {config.label}
                                    </Badge>
                                    {canRemove && member.role !== 'owner' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemove(member.id)}
                                            disabled={removingId === member.id}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                                        >
                                            {removingId === member.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
