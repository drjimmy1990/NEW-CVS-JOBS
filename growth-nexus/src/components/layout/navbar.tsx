'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, Briefcase, Building2, BookOpen, LogIn, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Hide navbar on dashboard and auth pages
  const isDashboard = pathname?.startsWith('/employer') || pathname?.startsWith('/candidate') || pathname?.startsWith('/admin');
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
    return null;
  }

  const handleDashboardClick = () => {
    if (profile?.role === 'admin') router.push('/admin/dashboard');
    else if (profile?.role === 'employer') router.push('/employer/dashboard');
    else if (profile?.role === 'candidate') router.push('/candidate/dashboard');
    else router.push('/');
  };

  return (
    <header className="border-b border-gold/10 bg-navy/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
            <span className="text-lg font-bold text-navy">G</span>
          </div>
          <span className="text-xl font-bold text-cream tracking-tight">GrowthNexus</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-1 bg-navy-light/50 p-1 rounded-full border border-gold/10">
          <Link 
            href="/jobs" 
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                pathname === '/jobs' ? "bg-gold/15 text-gold" : "text-cream-dark/60 hover:text-cream hover:bg-navy-lighter"
            )}
          >
            <Search className="w-4 h-4" />
            الوظائف
          </Link>
          <Link 
            href="/companies" 
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                pathname === '/companies' ? "bg-gold/15 text-gold" : "text-cream-dark/60 hover:text-cream hover:bg-navy-lighter"
            )}
          >
            <Building2 className="w-4 h-4" />
            الشركات
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/register?role=employer" className="hidden sm:flex">
            <Button variant="ghost" className="text-cream-dark/60 hover:text-cream hover:bg-navy-lighter gap-2">
              <Briefcase className="w-4 h-4" />
              أنشر وظيفة
            </Button>
          </Link>
          
          {user ? (
             <Button 
               onClick={handleDashboardClick}
               className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-navy border-0 font-bold gap-2"
             >
               {profile?.role === 'admin' && <Shield className="w-4 h-4" />}
               {profile?.role === 'admin' ? 'لوحة الإدارة' : 'لوحة التحكم'}
             </Button>
          ) : (
             <Link href="/login">
               <Button className="bg-gold text-navy hover:bg-gold-light gap-2 font-bold">
                 <LogIn className="w-4 h-4" />
                 تسجيل الدخول
               </Button>
             </Link>
          )}
        </div>
      </div>
    </header>
  );
}
