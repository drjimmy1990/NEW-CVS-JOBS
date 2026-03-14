import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-navy-light to-navy p-4">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <Card className="w-full max-w-md relative z-10 border-gold/15 bg-navy-light/80 backdrop-blur-sm">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
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
