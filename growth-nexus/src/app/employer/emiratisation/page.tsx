'use client'

import { useState, useEffect } from 'react'
import { Loader2, Settings, Calculator, ShieldCheck, UserCheck, Lightbulb, Rocket } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type EmiratisationProfile } from '@/lib/emiratisation-engine'

// Components
import { AdvisoryBanner } from '@/components/employer/emiratisation/AdvisoryBanner'
import { EmiratisationProfileForm } from '@/components/employer/emiratisation/EmiratisationProfileForm'
import { ClassificationBanner } from '@/components/employer/emiratisation/ClassificationBanner'
import { EmiratisationCalculator } from '@/components/employer/emiratisation/EmiratisationCalculator'
import { ComplianceStatusCard } from '@/components/employer/emiratisation/ComplianceStatusCard'
import { GapAnalysis } from '@/components/employer/emiratisation/GapAnalysis'
import { AlertsPanel } from '@/components/employer/emiratisation/AlertsPanel'
import { EmiratiCandidatesList } from '@/components/employer/emiratisation/EmiratiCandidatesList'
import { OpportunityDetection } from '@/components/employer/emiratisation/OpportunityDetection'
import { EmiratisationAnalytics } from '@/components/employer/emiratisation/EmiratisationAnalytics'
import { NafisActionPlan } from '@/components/employer/emiratisation/NafisActionPlan'
import { ExportReports } from '@/components/employer/emiratisation/ExportReports'
import { AuditLogTable } from '@/components/employer/emiratisation/AuditLogTable'

export default function EmiratisationPage() {
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<EmiratisationProfile | null>(null)
    const [companyId, setCompanyId] = useState<string | null>(null)
    const [jobTitles, setJobTitles] = useState<string[]>([])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            // Fetch profile from API
            const profileRes = await fetch('/api/emiratisation/profile')
            const profileData = await profileRes.json()
            if (profileData.profile) setProfile(profileData.profile)
            if (profileData.company_id) setCompanyId(profileData.company_id)

            // Fetch active job titles for opportunity detection
            if (profileData.company_id) {
                const supabase = createClient()
                const { data: jobs } = await supabase
                    .from('jobs')
                    .select('title')
                    .eq('company_id', profileData.company_id)
                    .eq('status', 'active')
                setJobTitles((jobs || []).map(j => j.title))
            }
        } catch (err) {
            console.error('Failed to load emiratisation data:', err)
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
        )
    }

    const hasProfile = profile && profile.total_employees > 0

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-cream">التوطين / نافس</h1>
                <p className="text-cream-dark/50 mt-1">لوحة متابعة التزام التوطين وبرنامج نافس</p>
            </div>

            {/* Advisory Banner */}
            <AdvisoryBanner />

            {/* Tabs */}
            <Tabs defaultValue={hasProfile ? 'calculator' : 'settings'} className="w-full">
                <TabsList className="bg-navy-light border border-gold/10 w-full flex flex-wrap h-auto p-1 gap-1">
                    <TabsTrigger value="settings" className="flex-1 min-w-[120px] text-xs data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-cream-dark/50">
                        <Settings className="h-3.5 w-3.5 me-1.5" />إعدادات التوطين
                    </TabsTrigger>
                    <TabsTrigger value="calculator" className="flex-1 min-w-[120px] text-xs data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-cream-dark/50" disabled={!hasProfile}>
                        <Calculator className="h-3.5 w-3.5 me-1.5" />الحاسبة والفجوة
                    </TabsTrigger>
                    <TabsTrigger value="compliance" className="flex-1 min-w-[120px] text-xs data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-cream-dark/50" disabled={!hasProfile}>
                        <ShieldCheck className="h-3.5 w-3.5 me-1.5" />حالة الالتزام
                    </TabsTrigger>
                    <TabsTrigger value="candidates" className="flex-1 min-w-[120px] text-xs data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-cream-dark/50">
                        <UserCheck className="h-3.5 w-3.5 me-1.5" />المرشحون المواطنون
                    </TabsTrigger>
                    <TabsTrigger value="opportunities" className="flex-1 min-w-[120px] text-xs data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-cream-dark/50" disabled={!hasProfile}>
                        <Lightbulb className="h-3.5 w-3.5 me-1.5" />فرص التوطين
                    </TabsTrigger>
                    <TabsTrigger value="action" className="flex-1 min-w-[120px] text-xs data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-cream-dark/50" disabled={!hasProfile}>
                        <Rocket className="h-3.5 w-3.5 me-1.5" />خطة العمل
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Settings & Audit */}
                <TabsContent value="settings" className="mt-6 space-y-6">
                    <EmiratisationProfileForm
                        profile={profile}
                        companyId={companyId || ''}
                        onSaved={(saved) => { setProfile(saved); }}
                    />
                    {companyId && <AuditLogTable companyId={companyId} />}
                </TabsContent>

                {/* Tab 2: Calculator & Gap */}
                <TabsContent value="calculator" className="mt-6 space-y-6">
                    {profile && (
                        <>
                            <ClassificationBanner
                                totalEmployees={profile.total_employees}
                                sector={profile.economic_sector}
                            />
                            <EmiratisationCalculator profile={profile} />
                            <GapAnalysis profile={profile} />
                        </>
                    )}
                </TabsContent>

                {/* Tab 3: Compliance & Alerts */}
                <TabsContent value="compliance" className="mt-6 space-y-6">
                    {profile && (
                        <>
                            <ComplianceStatusCard profile={profile} />
                            <AlertsPanel profile={profile} />
                        </>
                    )}
                </TabsContent>

                {/* Tab 4: Emirati Candidates */}
                <TabsContent value="candidates" className="mt-6">
                    <EmiratiCandidatesList />
                </TabsContent>

                {/* Tab 5: Opportunities & Analytics */}
                <TabsContent value="opportunities" className="mt-6 space-y-6">
                    <OpportunityDetection jobTitles={jobTitles} />
                    {profile && <EmiratisationAnalytics profile={profile} />}
                </TabsContent>

                {/* Tab 6: Action Plan & Export */}
                <TabsContent value="action" className="mt-6 space-y-6">
                    {profile && <NafisActionPlan profile={profile} />}
                    <ExportReports />
                </TabsContent>
            </Tabs>
        </div>
    )
}
