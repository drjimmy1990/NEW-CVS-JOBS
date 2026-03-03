import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Link as LinkIcon, ExternalLink, Calendar, Copy, Check } from 'lucide-react'
import { LandingPagesList } from '@/components/employer/LandingPagesList'

export default async function LandingPagesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get company ID
    const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!company) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Private Link Collections</h1>
                        <p className="text-slate-400 mt-1">
                            Generate direct application links that bypass the public job board.
                        </p>
                    </div>
                </div>
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="py-16 text-center">
                        <h3 className="text-xl font-semibold text-white mb-2">Company Profile Required</h3>
                        <p className="text-slate-400 mb-6">
                            You need a company profile before you can create custom landing pages.
                        </p>
                        <Link href="/employer/settings">
                            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                                Setup Company Profile
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Get Landing Pages
    const { data: landingPages } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Private Link Collections</h1>
                    <p className="text-slate-400 mt-1">
                        Generate direct application links that bypass the public job board.
                    </p>
                </div>
                <Link href="/employer/landing-pages/new">
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Link
                    </Button>
                </Link>
            </div>

            {/* List */}
            {landingPages && landingPages.length > 0 ? (
                <LandingPagesList pages={landingPages} />
            ) : (
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="py-16 text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LinkIcon className="h-8 w-8 text-cyan-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No private links yet</h3>
                        <p className="text-slate-400 mb-6 max-w-md mx-auto">
                            Create a private landing page to get a shareable URL. Candidates who apply using this URL will be routed directly to your dashboard.
                        </p>
                        <Link href="/employer/landing-pages/new">
                            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                                Create your first Private Link
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
