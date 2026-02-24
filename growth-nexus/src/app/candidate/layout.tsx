import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {
    LayoutDashboard,
    FileText,
    Briefcase,
    Settings,
    LogOut,
    ChevronRight,
    Upload
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

const sidebarLinks = [
    { href: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/candidate/cv', label: 'My CV', icon: FileText },
    { href: '/candidate/applications', label: 'Applications', icon: Briefcase },
    { href: '/candidate/settings', label: 'Settings', icon: Settings },
]

export default async function CandidateLayout({
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

    const { data: candidate } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', user.id)
        .single()

    const handleSignOut = async () => {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/login')
    }

    const hasCV = !!candidate?.cv_url

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-slate-800">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                            <span className="text-xl font-bold text-white">G</span>
                        </div>
                        <span className="text-xl font-bold text-white">GrowthNexus</span>
                    </Link>
                </div>

                {/* Profile Summary */}
                <div className="p-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={profile?.avatar_url || ''} />
                            <AvatarFallback className="bg-emerald-600 text-white text-lg">
                                {profile?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {profile?.full_name || 'User'}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                                {candidate?.headline || 'Job Seeker'}
                            </p>
                        </div>
                    </div>
                    {!hasCV && (
                        <Link
                            href="/candidate/cv"
                            className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm hover:bg-emerald-500/20 transition-colors"
                        >
                            <Upload className="h-4 w-4" />
                            Upload your CV
                        </Link>
                    )}
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
                            {link.label === 'My CV' && hasCV && (
                                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 text-xs">
                                    Uploaded
                                </Badge>
                            )}
                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    ))}

                    <Separator className="my-4 bg-slate-800" />

                    <Link
                        href="/jobs"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 text-emerald-400 hover:from-emerald-500/20 hover:to-cyan-500/20 transition-colors"
                    >
                        <Briefcase className="h-5 w-5" />
                        <span className="flex-1">Browse Jobs</span>
                    </Link>
                </nav>

                {/* Sign Out */}
                <div className="p-4 border-t border-slate-800">
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
