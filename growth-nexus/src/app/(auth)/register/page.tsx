'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, User, ArrowRight, Building2, UserCircle } from 'lucide-react'
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

        // 1. Create auth user (profile is created automatically by database trigger)
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
            // Small delay to let the trigger create the profile
            await new Promise(resolve => setTimeout(resolve, 500))

            // 2. If employer, create company record
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
                    // Continue anyway - user can set up company later
                }
            }

            // 3. If candidate, create candidate record
            if (role === 'candidate') {
                const { error: candidateError } = await supabase
                    .from('candidates')
                    .insert({
                        id: authData.user.id,
                    })

                if (candidateError) {
                    console.log('Candidate creation error:', candidateError.message)
                    // Continue anyway - can be created later
                }
            }

            // Redirect based on role
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
                <Label className="text-slate-300">I am a...</Label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setRole('candidate')}
                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${role === 'candidate'
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                            }`}
                    >
                        <UserCircle className="h-6 w-6" />
                        <span className="text-sm font-medium">Job Seeker</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('employer')}
                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${role === 'employer'
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                            : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                            }`}
                    >
                        <Building2 className="h-6 w-6" />
                        <span className="text-sm font-medium">Employer</span>
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                </div>
                <p className="text-xs text-slate-500">Minimum 6 characters</p>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <Button
                type="submit"
                disabled={loading}
                className={`w-full font-medium text-white ${role === 'employer'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600'
                    }`}
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                    </>
                ) : (
                    <>
                        Create {role === 'employer' ? 'Employer' : 'Candidate'} Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                )}
            </Button>

            <div className="text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                    Sign in
                </Link>
            </div>
        </form>
    )
}
