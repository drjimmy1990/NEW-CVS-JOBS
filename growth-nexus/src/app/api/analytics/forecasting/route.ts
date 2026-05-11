import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * Forecasting Engine — generates AI predictions based on historical data.
 * Uses company's past hiring data + market benchmarks to predict:
 * - Time to fill (average days per job category)
 * - Offer acceptance probability
 * - Hiring difficulty score
 * - Salary benchmarking
 */
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Get company
        const { data: company } = await supabase
            .from('companies')
            .select('id')
            .eq('owner_id', user.id)
            .single()

        let companyId = company?.id
        if (!companyId) {
            const { data: membership } = await supabase
                .from('company_members')
                .select('company_id')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single()
            companyId = membership?.company_id
        }

        if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 403 })

        // Fetch jobs with applications data
        const { data: jobs } = await supabase
            .from('jobs')
            .select('id, title, status, created_at, job_type, salary_min, salary_max, applicants_count')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })

        // Fetch applications with timeline data
        const { data: applications } = await supabase
            .from('applications')
            .select('id, status, created_at, job_id')
            .in('job_id', (jobs || []).map(j => j.id))

        // --- COMPUTE FORECASTS ---

        const totalJobs = jobs?.length || 0
        const activeJobs = (jobs || []).filter(j => j.status === 'active').length
        const closedJobs = (jobs || []).filter(j => j.status === 'closed').length
        const totalApps = applications?.length || 0

        // 1. Average time-to-fill (days from job creation to first hire)
        const hiredApps = (applications || []).filter(a => a.status === 'hired')
        let avgTimeToFill = 21 // default benchmark
        if (hiredApps.length > 0 && jobs) {
            const fillTimes = hiredApps.map(a => {
                const job = jobs.find(j => j.id === a.job_id)
                if (!job) return null
                const days = Math.ceil(
                    (new Date(a.created_at).getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)
                )
                return days > 0 ? days : null
            }).filter(Boolean) as number[]

            if (fillTimes.length > 0) {
                avgTimeToFill = Math.round(fillTimes.reduce((a, b) => a + b, 0) / fillTimes.length)
            }
        }

        // 2. Offer acceptance rate
        const offeredApps = (applications || []).filter(a => a.status === 'offer' || a.status === 'hired')
        const acceptedOffers = hiredApps.length
        const offerAcceptanceRate = offeredApps.length > 0
            ? Math.round((acceptedOffers / offeredApps.length) * 100)
            : 75 // default benchmark

        // 3. Hiring difficulty (based on applicants per job)
        const avgApplicantsPerJob = totalJobs > 0
            ? Math.round(totalApps / totalJobs)
            : 0
        let hiringDifficulty: 'low' | 'medium' | 'high' = 'medium'
        if (avgApplicantsPerJob > 20) hiringDifficulty = 'low'       // plenty of applicants
        else if (avgApplicantsPerJob < 5) hiringDifficulty = 'high'  // few applicants

        // 4. Conversion funnel rates
        const reviewedApps = (applications || []).filter(a => a.status !== 'applied').length
        const interviewedApps = (applications || []).filter(a =>
            ['interview', 'shortlisted', 'offer', 'hired'].includes(a.status)
        ).length
        const shortlistedApps = (applications || []).filter(a =>
            ['shortlisted', 'offer', 'hired'].includes(a.status)
        ).length

        const conversionFunnel = {
            applied_to_reviewed: totalApps > 0 ? Math.round((reviewedApps / totalApps) * 100) : 0,
            reviewed_to_interview: reviewedApps > 0 ? Math.round((interviewedApps / reviewedApps) * 100) : 0,
            interview_to_shortlist: interviewedApps > 0 ? Math.round((shortlistedApps / interviewedApps) * 100) : 0,
            shortlist_to_hire: shortlistedApps > 0 ? Math.round((hiredApps.length / shortlistedApps) * 100) : 0,
        }

        // 5. Monthly trend (last 6 months)
        const now = new Date()
        const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
            const month = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1)
            const jobsInMonth = (jobs || []).filter(j => {
                const d = new Date(j.created_at)
                return d >= month && d < nextMonth
            }).length
            const appsInMonth = (applications || []).filter(a => {
                const d = new Date(a.created_at)
                return d >= month && d < nextMonth
            }).length
            return {
                month: month.toLocaleDateString('ar-AE', { month: 'short', year: 'numeric' }),
                jobs: jobsInMonth,
                applications: appsInMonth,
            }
        })

        // 6. Salary benchmark
        const salaryData = (jobs || [])
            .filter(j => j.salary_min && j.salary_max)
            .map(j => ({ min: j.salary_min, max: j.salary_max }))
        const avgSalaryMin = salaryData.length > 0
            ? Math.round(salaryData.reduce((a, b) => a + b.min, 0) / salaryData.length)
            : 0
        const avgSalaryMax = salaryData.length > 0
            ? Math.round(salaryData.reduce((a, b) => a + b.max, 0) / salaryData.length)
            : 0

        // 7. Predictions (next 30 days)
        const predictedApplicants = Math.round(avgApplicantsPerJob * activeJobs * 0.8) // conservative
        const predictedHires = Math.round(predictedApplicants * (conversionFunnel.shortlist_to_hire / 100) * 0.5)

        return NextResponse.json({
            forecasts: {
                overview: {
                    total_jobs: totalJobs,
                    active_jobs: activeJobs,
                    closed_jobs: closedJobs,
                    total_applications: totalApps,
                    total_hires: hiredApps.length,
                },
                predictions: {
                    time_to_fill_days: avgTimeToFill,
                    offer_acceptance_rate: offerAcceptanceRate,
                    hiring_difficulty: hiringDifficulty,
                    avg_applicants_per_job: avgApplicantsPerJob,
                    predicted_applicants_30d: predictedApplicants,
                    predicted_hires_30d: predictedHires,
                },
                conversion_funnel: conversionFunnel,
                monthly_trend: monthlyTrend,
                salary_benchmark: {
                    avg_min: avgSalaryMin,
                    avg_max: avgSalaryMax,
                },
            }
        })
    } catch (error: any) {
        console.error('[Forecasting] Error:', error.message)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
