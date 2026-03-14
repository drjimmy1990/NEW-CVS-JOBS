'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, Briefcase, Building2, BookOpen, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Hide navbar on employer and candidate dashboards, and auth pages if needed
  const isDashboard = pathname?.startsWith('/employer') || pathname?.startsWith('/candidate');
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (data) {
          setProfile(data);
        }
      }
    };
    fetchUser();
  }, []);

  if (isDashboard || isAuthPage) {
    return null; // Do not render on dashboard or auth pages
  }

  const getDashboardLink = () => {
    if (profile?.role === 'employer') return '/employer/dashboard';
    if (profile?.role === 'candidate') return '/candidate/dashboard';
    return '/';
  };

  return (
    <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <span className="text-lg font-bold text-white">G</span>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">GrowthNexus</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1 rounded-full border border-slate-800/50">
          <Link 
            href="/jobs" 
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                pathname === '/jobs' ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <Search className="w-4 h-4" />
            Browse Jobs
          </Link>
          <Link 
            href="/companies" 
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                pathname === '/companies' ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <Building2 className="w-4 h-4" />
            Companies
          </Link>
          <Link 
            href="/career-advice" 
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                pathname === '/career-advice' ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <BookOpen className="w-4 h-4" />
            Career Advice
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/register?role=employer" className="hidden sm:flex">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800/50 gap-2">
              <Briefcase className="w-4 h-4" />
              Post a Job
            </Button>
          </Link>
          
          {user ? (
             <Link href={getDashboardLink()}>
               <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0">
                 Dashboard
               </Button>
             </Link>
          ) : (
             <Link href="/login">
               <Button className="bg-white text-slate-900 hover:bg-slate-100 gap-2 font-medium">
                 <LogIn className="w-4 h-4" />
                 Login
               </Button>
             </Link>
          )}
        </div>
      </div>
    </header>
  );
}
