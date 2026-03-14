'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirect') || '/'

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const supabase = createClient()

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        if (data.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()

            if (profile) {
                if (redirectTo !== '/') {
                    router.push(redirectTo)
                } else if (profile.role === 'employer') {
                    router.push('/employer/dashboard')
                } else if (profile.role === 'candidate') {
                    router.push('/candidate/dashboard')
                } else if (profile.role === 'admin') {
                    router.push('/admin/config')
                } else {
                    router.push('/')
                }
            }
        }

        router.refresh()
    }

    return (
        <form onSubmit={handleLogin} className="space-y-4">
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
                        className="pe-10 bg-navy border-gold/15 text-cream placeholder:text-cream-dark/30 focus:border-gold focus:ring-gold"
                    />
                </div>
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
                        جارِ تسجيل الدخول...
                    </>
                ) : (
                    <>
                        تسجيل الدخول
                        <ArrowLeft className="ms-2 h-4 w-4" />
                    </>
                )}
            </Button>

            <div className="text-center text-sm text-cream-dark/50">
                ليس لديك حساب؟{' '}
                <Link href="/register" className="text-gold hover:text-gold-light font-medium">
                    إنشاء حساب
                </Link>
            </div>
        </form>
    )
}

function LoginFormFallback() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-navy rounded-lg" />
            <div className="h-10 bg-navy rounded-lg" />
            <div className="h-10 bg-navy rounded-lg" />
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
        </Suspense>
    )
}
