'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, User, ArrowLeft, Building2, UserCircle } from 'lucide-react'
import type { UserRole } from '@/lib/types'

export default function RegisterPage() {
    const router = useRouter()

    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState<UserRole>('candidate')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const supabase = createClient()

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                }
            }
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        if (authData.user) {
            await new Promise(resolve => setTimeout(resolve, 500))

            if (role === 'employer') {
                const companySlug = fullName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
                const { error: companyError } = await supabase
                    .from('companies')
                    .insert({
                        owner_id: authData.user.id,
                        name: fullName + "'s Company",
                        slug: companySlug,
                    })

                if (companyError) {
                    console.log('Company creation error:', companyError.message)
                }
            }

            if (role === 'candidate') {
                const { error: candidateError } = await supabase
                    .from('candidates')
                    .insert({
                        id: authData.user.id,
                    })

                if (candidateError) {
                    console.log('Candidate creation error:', candidateError.message)
                }
            }

            if (role === 'employer') {
                router.push('/employer/dashboard')
            } else {
                router.push('/candidate/dashboard')
            }
            router.refresh()
        }
    }

    return (
        <form onSubmit={handleRegister} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
                <Label className="text-cream-dark/70">أنا...</Label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setRole('candidate')}
                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${role === 'candidate'
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-gold/15 bg-navy text-cream-dark/50 hover:border-gold/30'
                            }`}
                    >
                        <UserCircle className="h-6 w-6" />
                        <span className="text-sm font-medium">باحث عن عمل</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('employer')}
                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${role === 'employer'
                            ? 'border-success bg-success/10 text-success'
                            : 'border-gold/15 bg-navy text-cream-dark/50 hover:border-gold/30'
                            }`}
                    >
                        <Building2 className="h-6 w-6" />
                        <span className="text-sm font-medium">صاحب عمل</span>
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="fullName" className="text-cream-dark/70">الاسم الكامل</Label>
                <div className="relative">
                    <User className="absolute end-3 top-3 h-4 w-4 text-cream-dark/40" />
                    <Input
                        id="fullName"
                        type="text"
                        placeholder="محمد أحمد"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="pe-10 bg-navy border-gold/15 text-cream placeholder:text-cream-dark/30 focus:border-gold focus:ring-gold"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email" className="text-cream-dark/70">البريد الإلكتروني</Label>
                <div className="relative">
                    <Mail className="absolute end-3 top-3 h-4 w-4 text-cream-dark/40" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pe-10 bg-navy border-gold/15 text-cream placeholder:text-cream-dark/30 focus:border-gold focus:ring-gold"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password" className="text-cream-dark/70">كلمة المرور</Label>
                <div className="relative">
                    <Lock className="absolute end-3 top-3 h-4 w-4 text-cream-dark/40" />
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pe-10 bg-navy border-gold/15 text-cream placeholder:text-cream-dark/30 focus:border-gold focus:ring-gold"
                    />
                </div>
                <p className="text-xs text-cream-dark/30">6 أحرف على الأقل</p>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-navy font-bold"
            >
                {loading ? (
                    <>
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        جارِ إنشاء الحساب...
                    </>
                ) : (
                    <>
                        إنشاء حساب {role === 'employer' ? 'صاحب عمل' : 'باحث عن عمل'}
                        <ArrowLeft className="ms-2 h-4 w-4" />
                    </>
                )}
            </Button>

            <div className="text-center text-sm text-cream-dark/50">
                لديك حساب بالفعل؟{' '}
                <Link href="/login" className="text-gold hover:text-gold-light font-medium">
                    تسجيل الدخول
                </Link>
            </div>
        </form>
    )
}
