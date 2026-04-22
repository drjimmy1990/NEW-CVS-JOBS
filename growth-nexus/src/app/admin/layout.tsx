import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {
    LayoutDashboard, Users, Building2, Briefcase, Settings,
    CreditCard, LogOut, ChevronLeft, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

const sidebarLinks = [
    { href: '/admin/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: '/admin/users', label: 'المستخدمون', icon: Users },
    { href: '/admin/companies', label: 'الشركات', icon: Building2 },
    { href: '/admin/jobs', label: 'الوظائف', icon: Briefcase },
    { href: '/admin/transactions', label: 'المعاملات المالية', icon: CreditCard },
    { href: '/admin/config', label: 'إعدادات النظام', icon: Settings },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

    // Admin guard
    if (profile?.role !== 'admin') redirect('/login')

    const handleSignOut = async () => {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-navy flex" dir="rtl">
            <aside className="w-64 bg-navy-light border-e border-gold/10 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-gold/10">
                    <Link href="/admin/dashboard" className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-cream">لوحة الإدارة</span>
                            <p className="text-xs text-cream-dark/40">GrowthNexus Admin</p>
                        </div>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1">
                    {sidebarLinks.map((link) => (
                        <Link key={link.href} href={link.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-cream-dark/60 hover:text-cream hover:bg-navy-lighter transition-colors group">
                            <link.icon className="h-5 w-5" />
                            <span className="flex-1">{link.label}</span>
                            <ChevronLeft className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    ))}
                    <Separator className="my-4 bg-gold/10" />
                    <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-cream-dark/40 hover:text-cream hover:bg-navy-lighter transition-colors">
                        <span className="text-sm">← العودة للموقع</span>
                    </Link>
                </nav>

                {/* User */}
                <div className="p-4 border-t border-gold/10">
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={profile?.avatar_url || ''} />
                            <AvatarFallback className="bg-red-500/20 text-red-400 text-sm">
                                {profile?.full_name?.charAt(0) || 'A'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-cream truncate">{profile?.full_name || 'Admin'}</p>
                            <p className="text-xs text-cream-dark/40 truncate">{profile?.email}</p>
                        </div>
                    </div>
                    <form action={handleSignOut}>
                        <Button type="submit" variant="ghost" className="w-full justify-start text-cream-dark/50 hover:text-cream hover:bg-navy-lighter">
                            <LogOut className="h-4 w-4 me-2" />تسجيل الخروج
                        </Button>
                    </form>
                </div>
            </aside>

            <main className="flex-1 overflow-auto">
                <div className="p-8">{children}</div>
            </main>
        </div>
    )
}
