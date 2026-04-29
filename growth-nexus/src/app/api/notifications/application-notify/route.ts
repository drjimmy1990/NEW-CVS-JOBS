import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/notifications/application-notify
 * Triggered after a new application is created.
 * Creates in-app notification for the employer + triggers n8n webhook.
 */
export async function POST(request: NextRequest) {
    try {
        const { applicationId, jobId, jobTitle, candidateName, companyName } = await request.json()

        if (!applicationId || !jobId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Find the company owner + team members for this job
        const { data: job } = await supabase
            .from('jobs')
            .select('company_id, companies(owner_id)')
            .eq('id', jobId)
            .single()

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        const companyId = job.company_id
        const ownerId = (job.companies as any)?.owner_id

        // Get all active team members for this company
        const { data: members } = await supabase
            .from('company_members')
            .select('user_id')
            .eq('company_id', companyId)
            .eq('status', 'active')

        // Build unique user IDs (owner + members)
        const userIds = new Set<string>()
        if (ownerId) userIds.add(ownerId)
        if (members) members.forEach(m => userIds.add(m.user_id))

        // 2. Create in-app notifications for ALL team members
        const notificationTitle = `📋 طلب توظيف جديد`
        const notificationBody = `تقدم ${candidateName || 'مرشح'} لوظيفة "${jobTitle || 'وظيفة'}"`
        const notificationData = {
            type: 'new_application',
            application_id: applicationId,
            job_id: jobId,
            job_title: jobTitle,
            candidate_name: candidateName,
            link: `/employer/jobs/${jobId}/applicants`,
        }

        // Insert notifications for each team member
        const notifications = Array.from(userIds).map(userId => ({
            user_id: userId,
            type: 'new_application',
            title: notificationTitle,
            body: notificationBody,
            data: notificationData,
        }))

        if (notifications.length > 0) {
            const { error: notifError } = await supabase
                .from('notifications')
                .insert(notifications)

            if (notifError) {
                console.error('[app-notify] Notification insert error:', notifError.message)
            }
        }

        // 3. Trigger n8n webhook for external notifications (email/Telegram)
        const webhookUrl = process.env.N8N_APPLICATION_NOTIFY_WEBHOOK
        const webhookSecret = process.env.N8N_WEBHOOK_SECRET

        if (webhookUrl && !webhookUrl.includes('your-n8n-domain')) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-webhook-secret': webhookSecret || '',
                    },
                    body: JSON.stringify({
                        application_id: applicationId,
                        job_id: jobId,
                        job_title: jobTitle,
                        candidate_name: candidateName,
                        company_name: companyName,
                        company_id: companyId,
                        owner_id: ownerId,
                        team_member_ids: Array.from(userIds),
                        timestamp: new Date().toISOString(),
                    }),
                })
            } catch (err) {
                console.error('[app-notify] Webhook error:', err)
            }
        }

        console.log(`[app-notify] Notified ${userIds.size} team members for application ${applicationId}`)

        return NextResponse.json({
            success: true,
            notified_count: userIds.size,
        })

    } catch (error: any) {
        console.error('[app-notify] Exception:', error.message)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
