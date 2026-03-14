import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {
    Briefcase,
    Users,
    Settings,
    CreditCard,
    LogOut,
    LayoutDashboard,
    FileText,
    ChevronLeft,
    PlusCircle,
    Search,
    Heart,
    UserCheck,
    MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

const sidebarLinks = [
    { href: '/employer/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: '/employer/jobs/new', label: 'نشر وظيفة', icon: PlusCircle, highlight: true },
    { href: '/employer/jobs', label: 'وظائفي', icon: Briefcase },
    { href: '/employer/applicants', label: 'المتقدمين', icon: UserCheck },
    { href: '/employer/candidates', label: 'البحث عن مرشحين', icon: Search },
    { href: '/employer/saved-candidates', label: 'المرشحون المحفوظون', icon: Heart },
    { href: '/employer/messages', label: 'الرسائل', icon: MessageSquare },
    { href: '/employer/landing-pages', label: 'صفحات التوظيف', icon: FileText },
    { href: '/employer/settings', label: 'إعدادات الشركة', icon: Settings },
]

export default async function EmployerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id)
        .single()

    // Calculate total unread messages
    const { data: conversations } = await supabase
        .from('conversations')
        .select('participant_1, participant_2, unread_count_1, unread_count_2')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)

    let totalUnread = 0
    if (conversations) {
        conversations.forEach(c => {
            if (c.participant_1 === user.id) {
                totalUnread += c.unread_count_1 || 0
            } else {
                totalUnread += c.unread_count_2 || 0
            }
        })
    }

    const handleSignOut = async () => {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-navy flex">
            {/* Sidebar */}
            <aside className="w-64 bg-navy-light border-s border-gold/10 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-gold/10">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
                            <span className="text-xl font-bold text-navy">G</span>
                        </div>
                        <span className="text-xl font-bold text-cream">GrowthNexus</span>
                    </Link>
                </div>

                {/* Company Info */}
                <div className="p-4 border-b border-gold/10">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={company?.logo_url || ''} />
                            <AvatarFallback className="bg-gold text-navy font-bold">
                                {company?.name?.charAt(0) || 'C'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-cream truncate">
                                {company?.name || 'شركتك'}
                            </p>
                            <p className="text-xs text-cream-dark/50">
                                {company?.job_credits || 0} رصيد وظائف
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {sidebarLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                                (link as any).highlight 
                                ? 'text-navy bg-gold/15 border border-gold/30 hover:bg-gold/25 font-medium' 
                                : 'text-cream-dark/60 hover:text-cream hover:bg-navy-lighter'
                            }`}
                        >
                            <link.icon className={`h-5 w-5 ${(link as any).highlight ? 'text-gold' : ''}`} />
                            <span className="flex-1">{link.label}</span>
                            {link.label === 'الرسائل' && totalUnread > 0 && (
                                <Badge variant="secondary" className="bg-gold text-navy text-xs h-5 min-w-5 flex items-center justify-center">
                                    {totalUnread}
                                </Badge>
                            )}
                            <ChevronLeft className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    ))}

                    <Separator className="my-4 bg-gold/10" />

                    <Link
                        href="/pricing"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-gold/10 to-gold/5 text-gold hover:from-gold/20 hover:to-gold/10 transition-colors"
                    >
                        <CreditCard className="h-5 w-5" />
                        <span className="flex-1">شراء رصيد</span>
                    </Link>
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-gold/10">
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={profile?.avatar_url || ''} />
                            <AvatarFallback className="bg-navy-lighter text-cream text-sm">
                                {profile?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-cream truncate">
                                {profile?.full_name || 'مستخدم'}
                            </p>
                            <p className="text-xs text-cream-dark/40 truncate">
                                {profile?.email}
                            </p>
                        </div>
                    </div>
                    <form action={handleSignOut}>
                        <Button
                            type="submit"
                            variant="ghost"
                            className="w-full justify-start text-cream-dark/50 hover:text-cream hover:bg-navy-lighter"
                        >
                            <LogOut className="h-4 w-4 me-2" />
                            تسجيل الخروج
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
