import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// ==========================================
// POST — Finalize CV session
// Marks session as downloaded, returns final PDF URL
// Does NOT auto-link to profile — user does that manually
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
            .select('id, status, final_pdf_url')
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .single()

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        // Call n8n finalize workflow
        const webhookUrl = process.env.N8N_CV_FINALIZE_WEBHOOK
        if (!webhookUrl) {
            return NextResponse.json({ error: 'CV finalize service not configured' }, { status: 503 })
        }

        const n8nResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET || '',
            },
            body: JSON.stringify({
                sessionId,
                userId: user.id,
            }),
        })

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text()
            console.error('n8n finalize error:', errorText)
            return NextResponse.json(
                { error: 'Failed to finalize CV' },
                { status: 502 }
            )
        }

        const result = await n8nResponse.json()
        return NextResponse.json({
            ...result,
            // Tell the frontend it can show the "Use on my profile" button
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
