import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { PrivateApplyForm } from '@/components/candidate/PrivateApplyForm'

export default async function PrivateApplyPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const supabase = await createClient()

    // 1. Find the Landing Page
    const { data: landingPage } = await supabase
        .from('landing_pages')
        .select(`
            id, 
            company_id, 
            title, 
            job_description, 
            is_active,
            companies (
                name,
                logo_url
            )
        `)
        .eq('token', token)
        .single()

    if (!landingPage || !landingPage.is_active) {
        notFound()
    }

    // Ensure we have companies data mapped correctly from the join
    const company = Array.isArray(landingPage.companies) ? landingPage.companies[0] : landingPage.companies

    // 2. Increment Views (Fire and forget)
    supabase.rpc('increment_landing_page_views', { page_id: landingPage.id }).then()

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">

                {/* Header Section */}
                <div className="p-8 border-b border-slate-800 text-center">
                    {company?.logo_url ? (
                        <Image
                            src={company.logo_url}
                            alt={company.name || 'Company Logo'}
                            width={80}
                            height={80}
                            className="mx-auto rounded-xl mb-6 shadow-md"
                        />
                    ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl mx-auto mb-6 flex items-center justify-center shadow-md">
                            <span className="text-3xl font-bold text-white">
                                {company?.name?.charAt(0) || 'C'}
                            </span>
                        </div>
                    )}

                    <h1 className="text-3xl font-bold text-white mb-2">{landingPage.title}</h1>
                    <p className="text-slate-400 font-medium">at {company?.name}</p>
                </div>

                {/* Description Section */}
                {landingPage.job_description && (
                    <div className="p-8 bg-slate-900/50 border-b border-slate-800">
                        <h3 className="text-sm font-semibold tracking-wider text-slate-500 uppercase mb-4">About the Role</h3>
                        <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {landingPage.job_description}
                        </p>
                    </div>
                )}

                {/* Application Form Section */}
                <div className="p-8 bg-slate-900">
                    <h3 className="text-xl font-bold text-white mb-6">Submit your Application</h3>
                    <PrivateApplyForm
                        landingPageId={landingPage.id}
                        companyId={landingPage.company_id}
                    />
                </div>
            </div>

            <p className="text-slate-500 text-sm mt-8">
                Powered by <span className="font-semibold text-cyan-500">GrowthNexus</span>
            </p>
        </div>
    )
}
