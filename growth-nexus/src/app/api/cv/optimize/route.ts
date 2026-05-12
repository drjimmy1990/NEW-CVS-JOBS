import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// ==========================================
// POST — AI chat loop to optimize CV
// Sends user prompt + current text to n8n, returns AI response
// ==========================================
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { sessionId, currentText, userPrompt, language = 'en' } = body

        if (!sessionId || !userPrompt) {
            return NextResponse.json(
                { error: 'sessionId and userPrompt required' },
                { status: 400 }
            )
        }

        // Verify session belongs to user
        const { data: session } = await supabase
            .from('cv_sessions')
            .select('id, status')
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .single()

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        // Call n8n optimize-cv workflow
        const webhookUrl = process.env.N8N_CV_OPTIMIZE_WEBHOOK
        if (!webhookUrl) {
            return NextResponse.json({ error: 'CV optimize service not configured' }, { status: 503 })
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
                currentText: currentText || '',
                userPrompt,
                language,
            }),
        })

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text()
            console.error('n8n optimize-cv error:', errorText)
            return NextResponse.json(
                { error: 'Failed to optimize CV' },
                { status: 502 }
            )
        }

        const result = await n8nResponse.json()
        return NextResponse.json(result)
    } catch (error) {
        console.error('CV optimize error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
