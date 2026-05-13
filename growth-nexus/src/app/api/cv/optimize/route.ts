import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// ==========================================
// POST — AI chat loop to optimize CV
// Sends user prompt + current text to n8n, returns AI response
// If n8n returns pdfBase64, uploads it to Supabase Storage
// and saves the URL as latest_draft_url for persistence
// ==========================================
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { sessionId, currentText, language = 'en', chatHistory = [] } = body
        const userPrompt = body.userPrompt || body.message

        if (!sessionId || !userPrompt) {
            return NextResponse.json(
                { error: 'sessionId and userPrompt required' },
                { status: 400 }
            )
        }

        // Verify session belongs to user and fetch the text content
        const { data: session } = await supabase
            .from('cv_sessions')
            .select('id, status, text_content')
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
                currentText: currentText || session.text_content || '',
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

        // --- Debug: Log what n8n returned ---
        console.log('[CV-OPTIMIZE] n8n response keys:', Object.keys(result))
        console.log('[CV-OPTIMIZE] type:', result.type)
        console.log('[CV-OPTIMIZE] has optimizedText:', !!result.optimizedText, 'length:', result.optimizedText?.length || 0)
        console.log('[CV-OPTIMIZE] has pdfBase64:', !!result.pdfBase64, 'length:', result.pdfBase64?.length || 0)
        if (result.pdfBase64) {
            console.log('[CV-OPTIMIZE] pdfBase64 first 100 chars:', result.pdfBase64.substring(0, 100))
        }

        // --- Persist the new PDF and text to Supabase ---
        const updateData: Record<string, string> = {}

        // If n8n returned optimized text, save it so next request uses the latest
        if (result.optimizedText) {
            updateData.text_content = result.optimizedText
        }

        // Save chat history to DB for persistence across refreshes
        const userMsg = { id: `user-${Date.now()}`, sender: 'user', content: userPrompt, timestamp: new Date().toISOString() }
        const aiMsg = { id: `ai-${Date.now()}`, sender: 'ai', content: result.message || result.optimizedText || 'تم تحديث السيرة الذاتية.', timestamp: new Date().toISOString() }
        const updatedHistory = [...chatHistory, userMsg, aiMsg]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(updateData as any).chat_history = updatedHistory

        // If n8n returned a new PDF as base64, upload to Supabase Storage
        if (result.pdfBase64) {
            try {
                // Clean the base64 string: remove data URI prefix, whitespace, newlines
                let cleanBase64 = result.pdfBase64
                if (cleanBase64.includes(',')) {
                    cleanBase64 = cleanBase64.split(',').pop() || cleanBase64
                }
                cleanBase64 = cleanBase64.replace(/[\s\r\n]/g, '')

                console.log('[CV-OPTIMIZE] Clean base64 length:', cleanBase64.length)

                const pdfBuffer = Buffer.from(cleanBase64, 'base64')
                console.log('[CV-OPTIMIZE] PDF buffer size:', pdfBuffer.length, 'bytes')

                const fileName = `cv-drafts/${user.id}/${sessionId}/draft-${Date.now()}.pdf`
                console.log('[CV-OPTIMIZE] Uploading to:', fileName)

                // Use service role client for storage upload (bypasses RLS)
                const supabaseAdmin = createAdminClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                )

                const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                    .from('resumes')
                    .upload(fileName, pdfBuffer, {
                        contentType: 'application/pdf',
                        upsert: true,
                    })

                if (!uploadError) {
                    console.log('[CV-OPTIMIZE] Upload SUCCESS:', uploadData)
                    const { data: urlData } = supabaseAdmin.storage
                        .from('resumes')
                        .getPublicUrl(fileName)

                    if (urlData?.publicUrl) {
                        updateData.latest_draft_url = urlData.publicUrl
                        console.log('[CV-OPTIMIZE] Public URL:', urlData.publicUrl)
                    }
                } else {
                    console.error('[CV-OPTIMIZE] Upload FAILED:', uploadError.message, uploadError)
                }
            } catch (uploadErr) {
                console.error('[CV-OPTIMIZE] PDF upload EXCEPTION:', uploadErr)
            }
        } else {
            console.warn('[CV-OPTIMIZE] No pdfBase64 in n8n response — type was:', result.type)
        }

        // Save updates to the session row
        if (Object.keys(updateData).length > 0) {
            console.log('[CV-OPTIMIZE] Updating session with keys:', Object.keys(updateData))
            const { error: updateError } = await supabase
                .from('cv_sessions')
                .update(updateData)
                .eq('id', sessionId)
            if (updateError) {
                console.error('[CV-OPTIMIZE] Session update FAILED:', updateError)
            } else {
                console.log('[CV-OPTIMIZE] Session updated successfully')
            }
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('CV optimize error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
