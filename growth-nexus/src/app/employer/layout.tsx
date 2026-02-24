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
    ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

const sidebarLinks = [
    { href: '/employer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/employer/jobs', label: 'My Jobs', icon: Briefcase },
    { href: '/employer/landing-pages', label: 'Landing Pages', icon: FileText },
    { href: '/employer/settings', label: 'Company Settings', icon: Settings },
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

    const handleSignOut = async () => {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-slate-800">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                            <span className="text-xl font-bold text-white">G</span>
                        </div>
                        <span className="text-xl font-bold text-white">GrowthNexus</span>
                    </Link>
                </div>

                {/* Company Info */}
                <div className="p-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={company?.logo_url || ''} />
                            <AvatarFallback className="bg-cyan-600 text-white">
                                {company?.name?.charAt(0) || 'C'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {company?.name || 'Your Company'}
                            </p>
                            <p className="text-xs text-slate-400">
                                {company?.job_credits || 0} Job Credits
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
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors group"
                        >
                            <link.icon className="h-5 w-5" />
                            <span className="flex-1">{link.label}</span>
                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    ))}

                    <Separator className="my-4 bg-slate-800" />

                    <Link
                        href="/pricing"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 hover:from-cyan-500/20 hover:to-blue-500/20 transition-colors"
                    >
                        <CreditCard className="h-5 w-5" />
                        <span className="flex-1">Buy Credits</span>
                    </Link>
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={profile?.avatar_url || ''} />
                            <AvatarFallback className="bg-slate-700 text-white text-sm">
                                {profile?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {profile?.full_name || 'User'}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                                {profile?.email}
                            </p>
                        </div>
                    </div>
                    <form action={handleSignOut}>
                        <Button
                            type="submit"
                            variant="ghost"
                            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
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
