import { NextRequest, NextResponse } from 'next/server'

// ==========================================
// POST — Send email via n8n SMTP workflow
// Generic email sender for ALL notification types:
// - Application confirmations
// - Contract notifications
// - Message notifications
// - CV ready notifications
// ==========================================
export async function POST(req: NextRequest) {
    try {
        // Server-side only — verify internal call
        // This route should be called from other API routes, not directly from frontend
        const authHeader = req.headers.get('x-internal-secret')
        const webhookSecret = req.headers.get('x-webhook-secret')

        // Allow calls from internal API routes (with internal secret) 
        // or from n8n (with webhook secret)
        const isAuthorized =
            authHeader === process.env.N8N_WEBHOOK_SECRET ||
            webhookSecret === process.env.N8N_WEBHOOK_SECRET

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { to, subject, message, type } = body

        if (!to || !subject || !message) {
            return NextResponse.json(
                { error: 'to, subject, and message are required' },
                { status: 400 }
            )
        }

        // Call n8n email-send workflow
        const webhookUrl = process.env.N8N_EMAIL_SEND_WEBHOOK
        if (!webhookUrl) {
            console.warn('N8N_EMAIL_SEND_WEBHOOK not configured — email skipped')
            return NextResponse.json({
                success: false,
                warning: 'Email service not configured',
            })
        }

        const n8nResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET || '',
            },
            body: JSON.stringify({
                to,
                subject,
                message,
                type: type || 'general',
            }),
        })

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text()
            console.error('n8n email-send error:', errorText)
            return NextResponse.json(
                { error: 'Failed to send email' },
                { status: 502 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Email send error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
