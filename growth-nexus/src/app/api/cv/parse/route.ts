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

        const formData = await req.formData()
        const file = formData.get('file') as File
        const language = (formData.get('language') as string) || 'en'

        if (!file) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 })
        }

        // Convert the File object to a Base64 string for n8n
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const pdfBase64 = buffer.toString('base64')

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
                fileName: file.name,
                mimeType: file.type,
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
