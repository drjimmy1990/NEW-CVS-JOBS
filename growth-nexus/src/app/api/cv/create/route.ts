import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type { CvData } from '@/types/cv'

// ==========================================
// POST — Create CV from form data
// Sends structured CvData to n8n, returns PDF
// ==========================================
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { cvData, language = 'en' } = body as { cvData: CvData; language?: string }

        if (!cvData || !cvData.fullName) {
            return NextResponse.json(
                { error: 'CV data with at least fullName required' },
                { status: 400 }
            )
        }

        // Call n8n create-cv workflow
        const webhookUrl = process.env.N8N_CV_CREATE_WEBHOOK
        if (!webhookUrl) {
            return NextResponse.json({ error: 'CV create service not configured' }, { status: 503 })
        }

        const n8nResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET || '',
            },
            body: JSON.stringify({
                userId: user.id,
                language,
                cvData,
            }),
        })

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text()
            console.error('n8n create-cv error:', errorText)
            return NextResponse.json(
                { error: 'Failed to create CV' },
                { status: 502 }
            )
        }

        const result = await n8nResponse.json()
        return NextResponse.json(result)
    } catch (error) {
        console.error('CV create error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
