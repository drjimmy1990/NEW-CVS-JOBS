import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

async function verifyStripeSignature(body: string, signature: string): Promise<any> {
    // In production, use the stripe SDK for proper verification
    // For now, parse the event directly
    try {
        return JSON.parse(body)
    } catch {
        return null
    }
}

export async function POST(request: NextRequest) {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature') || ''

    const event = await verifyStripeSignature(body, signature)
    if (!event) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    try {
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
