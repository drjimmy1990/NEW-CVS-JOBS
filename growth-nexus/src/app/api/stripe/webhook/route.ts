import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// HMAC verification needs the Node.js runtime.
export const runtime = 'nodejs'

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const TIER_LIMITS: Record<string, { job_credits: number; tier_label: string }> = {
    starter: { job_credits: 3, tier_label: 'starter' },
    growth: { job_credits: 10, tier_label: 'growth' },
    pro: { job_credits: 25, tier_label: 'pro' },
    enterprise: { job_credits: 999, tier_label: 'enterprise' },
}

/**
 * Verify the Stripe webhook signature using the documented HMAC-SHA256 scheme.
 *
 * READY FOR LIVE KEYS: when STRIPE_WEBHOOK_SECRET is set (i.e. when you go live),
 * signatures are strictly verified and forged events are rejected. Until then
 * (test/dev, no secret), the body is parsed without verification but a loud warning
 * is logged — so nothing breaks now and verification activates automatically the
 * moment the signing secret is configured.
 */
function verifyStripeSignature(rawBody: string, sigHeader: string): any | null {
    if (!STRIPE_WEBHOOK_SECRET) {
        console.warn('[stripe/webhook] STRIPE_WEBHOOK_SECRET not set — signature NOT verified. Set it when switching to live keys.')
        try { return JSON.parse(rawBody) } catch { return null }
    }

    if (!sigHeader) return null

    // Header format: "t=timestamp,v1=signature[,v1=signature...]"
    let timestamp = ''
    const signatures: string[] = []
    for (const part of sigHeader.split(',')) {
        const [key, value] = part.split('=')
        if (key === 't') timestamp = value
        else if (key === 'v1' && value) signatures.push(value)
    }
    if (!timestamp || signatures.length === 0) return null

    // Replay protection: reject events outside a 5-minute tolerance.
    const tolerance = 60 * 5
    const nowSec = Math.floor(Date.now() / 1000)
    if (Math.abs(nowSec - Number(timestamp)) > tolerance) return null

    const signedPayload = `${timestamp}.${rawBody}`
    const expected = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(signedPayload, 'utf8').digest('hex')
    const expectedBuf = Buffer.from(expected)

    const valid = signatures.some((sig) => {
        const sigBuf = Buffer.from(sig)
        return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)
    })
    if (!valid) return null

    try { return JSON.parse(rawBody) } catch { return null }
}

export async function POST(request: NextRequest) {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature') || ''

    const event = verifyStripeSignature(body, signature)
    if (!event) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    try {
        // Idempotency: record each event id once; skip duplicates/replays.
        if (event.id) {
            const { error: dedupeError } = await supabaseAdmin
                .from('stripe_events')
                .insert({ id: event.id, type: event.type })
            if (dedupeError) {
                if (dedupeError.code === '23505') {
                    return NextResponse.json({ received: true, duplicate: true })
                }
                // Non-fatal: log and continue so a transient dedupe-store error
                // never drops a legitimate event.
                console.error('[stripe/webhook] idempotency insert failed:', dedupeError.message)
            }
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object
                const companyId = session.metadata?.company_id
                const tier = session.metadata?.tier || 'starter'
                const limits = TIER_LIMITS[tier] || TIER_LIMITS.starter

                if (companyId) {
                    await supabaseAdmin.from('companies').update({
                        subscription_tier: limits.tier_label,
                        subscription_status: 'active',
                        stripe_subscription_id: session.subscription,
                        job_credits: limits.job_credits,
                        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    }).eq('id', companyId)
                }
                break
            }

            case 'invoice.paid': {
                const invoice = event.data.object
                const subId = invoice.subscription

                if (subId) {
                    await supabaseAdmin.from('companies').update({
                        subscription_status: 'active',
                        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    }).eq('stripe_subscription_id', subId)
                }
                break
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object
                await supabaseAdmin.from('companies').update({
                    subscription_status: subscription.status === 'active' ? 'active' : 'past_due',
                }).eq('stripe_subscription_id', subscription.id)
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object
                await supabaseAdmin.from('companies').update({
                    subscription_tier: 'free',
                    subscription_status: 'cancelled',
                    stripe_subscription_id: null,
                    job_credits: 3,
                }).eq('stripe_subscription_id', subscription.id)
                break
            }
        }

        return NextResponse.json({ received: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
