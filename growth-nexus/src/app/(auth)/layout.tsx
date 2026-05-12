'use client'

import { usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isEmployerRegistration = pathname?.includes('/register/employer')

    // Employer registration wizard needs full-width — don't constrain in a small card
    if (isEmployerRegistration) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light p-4 md:p-8">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-30" />
                <div className="relative z-10">
                    {children}
                </div>
            </div>
        )
    }

    // Login / Candidate Register — centered card layout
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-dark via-navy to-navy-light p-4 relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-30" />
            {/* Decorative glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-gold/6 rounded-full blur-[120px] pointer-events-none" />
            <Card className="w-full max-w-md relative z-10 border-gold/12 bg-navy-light/90 backdrop-blur-md shadow-2xl shadow-navy/50">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-lg shadow-gold/20">
                            <span className="text-2xl font-bold text-navy">G</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-cream">GrowthNexus</CardTitle>
                    <CardDescription className="text-cream-dark/50">
                        نربط المواهب بالفرص
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {children}
                </CardContent>
            </Card>
        </div>
    )
}
