import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// ==========================================
// POST — Link finalized CV to candidate profile
// USER-INITIATED: Called when user clicks
// "Use this CV on my profile" button
//
// Updates: candidates.cv_url + marks session as linked
// ==========================================
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { sessionId } = body

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
        }

        // 1. Fetch the session to get the CV URL
        const { data: session, error: sessionError } = await supabase
            .from('cv_sessions')
            .select('id, status, original_pdf_url, latest_draft_url, final_pdf_url, text_content, parsed_data')
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .single()

        if (sessionError || !session) {
            console.error('Session fetch error:', sessionError)
            return NextResponse.json(
                { error: 'Session not found or unauthorized' },
                { status: 404 }
            )
        }

        // Determine the best CV URL to use
        // Priority: latest_draft > final_pdf > original
        const cvUrl = session.latest_draft_url || session.final_pdf_url || session.original_pdf_url

        if (!cvUrl) {
            return NextResponse.json(
                { error: 'No CV file found in session' },
                { status: 400 }
            )
        }

        // 2. Update candidate profile with the new CV URL
        const updateData: Record<string, unknown> = {
            cv_url: cvUrl,
            updated_at: new Date().toISOString(),
        }

        // If parsed_data is available, also update resume_parsed_data and skills
        if (session.parsed_data) {
            const parsed = session.parsed_data as Record<string, unknown>
            updateData.resume_parsed_data = parsed

            // Extract skills array if available
            if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
                updateData.skills = parsed.skills
            }
        }

        const { error: updateError } = await supabase
            .from('candidates')
            .update(updateData)
            .eq('id', user.id)

        if (updateError) {
            console.error('Candidate update error:', updateError)
            return NextResponse.json(
                { error: 'Failed to update profile: ' + updateError.message },
                { status: 500 }
            )
        }

        // 3. Mark session as linked (keep status as 'ready' so it's found on refresh)
        // First, unlink any previously linked sessions for this user
        await supabase
            .from('cv_sessions')
            .update({ linked_to_profile: false })
            .eq('user_id', user.id)
            .neq('id', sessionId)

        // Then, link the current session
        await supabase
            .from('cv_sessions')
            .update({
                linked_to_profile: true,
                linked_at: new Date().toISOString(),
            })
            .eq('id', sessionId)

        // 4. Trigger n8n CV Parser webhook to re-extract skills/experience from the new CV
        //    This is the same workflow that runs when a candidate first uploads their CV
        const parserWebhookUrl = process.env.N8N_CV_PARSE_REPARSE_WEBHOOK || process.env.NEXT_PUBLIC_N8N_CV_PARSER_WEBHOOK
        if (parserWebhookUrl) {
            try {
                console.log('[LINK-PROFILE] Triggering CV parser for re-extraction:', cvUrl)
                const parseResponse = await fetch(parserWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        file_url: cvUrl,
                        user_id: user.id,
                    }),
                })
                if (parseResponse.ok) {
                    console.log('[LINK-PROFILE] CV parser triggered successfully')
                } else {
                    console.warn('[LINK-PROFILE] CV parser returned non-OK:', parseResponse.status)
                }
            } catch (parseErr) {
                // Non-blocking — profile is already updated, parsing is a bonus
                console.warn('[LINK-PROFILE] CV parser webhook failed (non-blocking):', parseErr)
            }
        }

        return NextResponse.json({
            success: true,
            message: 'تم تحديث ملفك الشخصي بالسيرة الذاتية الجديدة',
            cv_url: cvUrl,
        })
    } catch (error) {
        console.error('CV link-profile error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
