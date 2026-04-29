import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Briefcase } from 'lucide-react'
import { JobsList } from '@/components/employer/JobsList'

export default async function MyJobsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="text-cream">يرجى تسجيل الدخول</div>
    }

    // Get company access (owner or member)
    let companyId = null
    const { data: ownedCompany } = await supabase
        .from('companies').select('id').eq('owner_id', user.id).single()
    if (ownedCompany) {
        companyId = ownedCompany.id
    } else {
        const { data: membership } = await supabase
            .from('company_members').select('company_id')
            .eq('user_id', user.id).eq('status', 'active').single()
        if (membership) companyId = membership.company_id
    }

    const { data: jobs } = companyId ? await supabase
        .from('jobs')
        .select(`
            *,
            companies!inner (
                id,
                owner_id,
                name
            )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
    : { data: [] }

    const jobsWithCounts = await Promise.all(
        (jobs || []).map(async (job) => {
            const { count } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('job_id', job.id)
            return { ...job, applicant_count: count || 0 }
        })
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-cream">وظائفي</h1>
                    <p className="text-cream-dark/50 mt-1">
                        إدارة إعلانات الوظائف الخاصة بك
                    </p>
                </div>
                <Link href="/employer/jobs/new">
                    <Button className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-navy font-bold">
                        <Plus className="me-2 h-4 w-4" />
                        أنشر وظيفة جديدة
                    </Button>
                </Link>
            </div>

            {/* Jobs List */}
            {jobsWithCounts && jobsWithCounts.length > 0 ? (
                <JobsList jobs={jobsWithCounts} />
            ) : (
                <Card className="bg-navy-light border-gold/10">
                    <CardContent className="py-16 text-center">
                        <Briefcase className="h-16 w-16 text-cream-dark/20 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-cream mb-2">لم تُنشر وظائف بعد</h3>
                        <p className="text-cream-dark/50 mb-6">
                            ابدأ بجذب أفضل المواهب من خلال نشر أول وظيفة
                        </p>
                        <Link href="/employer/jobs/new">
                            <Button className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-navy font-bold">
                                <Plus className="me-2 h-4 w-4" />
                                أنشر أول وظيفة
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
