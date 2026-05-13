import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// ==========================================
// POST — Convert raw CV to ATS-ready format
// Accepts PDF upload OR pasted text
// NEW workflow: gn-cv-ats-convert
// ==========================================
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { inputType, pdfBase64, rawText, language = 'en', fileName } = body

        // Validate input
        if (!inputType || !['pdf', 'text'].includes(inputType)) {
            return NextResponse.json(
                { error: 'inputType must be "pdf" or "text"' },
                { status: 400 }
            )
        }

        if (inputType === 'pdf' && !pdfBase64) {
            return NextResponse.json(
                { error: 'pdfBase64 required for PDF input' },
                { status: 400 }
            )
        }

        if (inputType === 'text' && !rawText) {
            return NextResponse.json(
                { error: 'rawText required for text input' },
                { status: 400 }
            )
        }

        // Call n8n ats-convert workflow
        const webhookUrl = process.env.N8N_CV_ATS_CONVERT_WEBHOOK
        if (!webhookUrl) {
            return NextResponse.json({ error: 'ATS convert service not configured' }, { status: 503 })
        }

        const n8nResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET || '',
            },
            body: JSON.stringify({
                inputType,
                pdfBase64: inputType === 'pdf' ? pdfBase64 : undefined,
                rawText: inputType === 'text' ? rawText : undefined,
                userId: user.id,
                language,
                fileName: inputType === 'pdf' ? fileName : undefined,
            }),
        })

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text()
            console.error('n8n ats-convert error:', errorText)
            return NextResponse.json(
                { error: 'Failed to convert CV' },
                { status: 502 }
            )
        }

        const result = await n8nResponse.json()
        return NextResponse.json(result)
    } catch (error) {
        console.error('CV ATS convert error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
