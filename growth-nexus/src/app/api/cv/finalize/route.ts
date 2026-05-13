import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// ==========================================
// POST — Finalize CV session
// Marks session as 'ready', returns final PDF URL
// Works with or without n8n finalize workflow
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

        // Verify session belongs to user
        const { data: session } = await supabase
            .from('cv_sessions')
            .select('id, status, original_pdf_url, latest_draft_url, final_pdf_url, text_content')
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .single()

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        // If there's an n8n finalize webhook configured, call it
        const webhookUrl = process.env.N8N_CV_FINALIZE_WEBHOOK
        let n8nResult = null

        if (webhookUrl) {
            try {
                const n8nResponse = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET || '',
                    },
                    body: JSON.stringify({
                        sessionId,
                        userId: user.id,
                        textContent: session.text_content || '',
                    }),
                })

                if (n8nResponse.ok) {
                    n8nResult = await n8nResponse.json()
                } else {
                    // n8n workflow failed — fall back to local finalize
                    console.warn('n8n finalize webhook failed, using local finalize')
                }
            } catch (err) {
                console.warn('n8n finalize webhook unreachable, using local finalize:', err)
            }
        }

        // Determine the download URL:
        // Priority: n8n result > latest_draft > final_pdf > original
        const downloadUrl = n8nResult?.downloadUrl
            || n8nResult?.finalPdfUrl
            || session.latest_draft_url
            || session.final_pdf_url
            || session.original_pdf_url
            || ''

        // Mark session as 'ready'
        await supabase
            .from('cv_sessions')
            .update({
                status: 'ready',
                ...(downloadUrl && !session.final_pdf_url ? { final_pdf_url: downloadUrl } : {}),
            })
            .eq('id', sessionId)

        return NextResponse.json({
            success: true,
            downloadUrl,
            sessionId,
            canLinkToProfile: true,
        })
    } catch (error) {
        console.error('CV finalize error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
