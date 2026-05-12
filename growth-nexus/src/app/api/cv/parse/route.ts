import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// ==========================================
// POST — Parse uploaded CV via n8n workflow
// Extracts text from PDF, creates a cv_session
// ==========================================
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { pdfBase64, language = 'en' } = body

        if (!pdfBase64) {
            return NextResponse.json({ error: 'PDF data required' }, { status: 400 })
        }

        // Call n8n parse-cv workflow
        const webhookUrl = process.env.N8N_CV_PARSE_WEBHOOK
        if (!webhookUrl) {
            return NextResponse.json({ error: 'CV parse service not configured' }, { status: 503 })
        }

        const n8nResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET || '',
            },
            body: JSON.stringify({
                userId: user.id,
                pdfBase64,
                language,
            }),
        })

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text()
            console.error('n8n parse-cv error:', errorText)
            return NextResponse.json(
                { error: 'Failed to parse CV' },
                { status: 502 }
            )
        }

        const result = await n8nResponse.json()
        return NextResponse.json(result)
    } catch (error) {
        console.error('CV parse error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
