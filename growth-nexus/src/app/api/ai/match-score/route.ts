import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
    try {
        const { applicationId } = await req.json()
        if (!applicationId) {
            return NextResponse.json({ error: 'Application ID is required' }, { status: 400 })
        }

        const supabase = await createClient()

        // Fetch application with related candidate and job data
        const { data: app, error: appError } = await supabase
            .from('applications')
            .select(`
                id,
                candidate_id,
                job_id,
                cover_letter
            `)
            .eq('id', applicationId)
            .single()

        if (appError || !app) {
            console.error('[match-score] Application not found:', appError?.message)
            return NextResponse.json({ error: 'Application not found', details: appError?.message }, { status: 404 })
        }

        // Fetch candidate data separately (avoids FK inference issues)
        const { data: candidate } = await supabase
            .from('candidates')
            .select('id, skills, resume_parsed_data')
            .eq('id', app.candidate_id)
            .single()

        // Fetch job data separately
        const { data: job } = await supabase
            .from('jobs')
            .select('id, description, skills_required')
            .eq('id', app.job_id)
            .single()

        // Extract skills from multiple sources (skills column OR resume_parsed_data JSON)
        const parsedData = (candidate?.resume_parsed_data as any) || {}
        const candidateSkills = candidate?.skills?.length 
            ? candidate.skills 
            : (parsedData.skills || [])
        const candidateExperience = parsedData.experience_years 
            ? `${parsedData.experience_years} سنة` 
            : '0 years'
        const candidateSummary = parsedData.summary || ''
        const candidateEducation = parsedData.education || []

        const n8nWebhookUrl = process.env.N8N_MATCH_SCORE_WEBHOOK || process.env.NEXT_PUBLIC_N8N_MATCH_SCORE_WEBHOOK || 'https://n8n.asra3.com/webhook/gn-match-score'
        const webhookSecret = process.env.N8N_WEBHOOK_SECRET || 'change-me-to-a-strong-secret'

        const n8nPayload = {
            application_id: app.id,
            candidate_skills: candidateSkills,
            candidate_experience: candidateExperience,
            candidate_summary: candidateSummary,
            candidate_education: candidateEducation,
            cover_letter: app.cover_letter || '',
            job_description: job?.description || '',
            job_skills_required: job?.skills_required || []
        }

        console.log('[match-score] Sending to n8n:', n8nWebhookUrl)
        console.log('[match-score] Payload:', JSON.stringify(n8nPayload).slice(0, 300))

        const n8nResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-secret': webhookSecret
            },
            body: JSON.stringify(n8nPayload)
        })

        console.log('[match-score] n8n response status:', n8nResponse.status)

        return NextResponse.json({ success: true, message: 'Match score processing started', n8nStatus: n8nResponse.status })

    } catch (error: any) {
        console.error('[match-score] Error:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
