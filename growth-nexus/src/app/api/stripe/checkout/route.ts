import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || ''

const TIER_PRICES: Record<string, Record<string, string>> = {
    starter: {
        monthly: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_monthly',
        yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly',
    },
    growth: {
        monthly: process.env.STRIPE_GROWTH_PRICE_ID || 'price_growth_monthly',
        yearly: process.env.STRIPE_GROWTH_YEARLY_PRICE_ID || 'price_growth_yearly',
    },
    pro: {
        monthly: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
        yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
    },
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tier, billing = 'monthly' } = await request.json()

    if (!TIER_PRICES[tier]) {
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const priceId = TIER_PRICES[tier][billing]
    if (!priceId) {
        return NextResponse.json({ error: 'Invalid billing period' }, { status: 400 })
    }

    // Get or create company
    const { data: company } = await supabase
        .from('companies').select('id, stripe_customer_id').eq('owner_id', user.id).single()

    if (!company) {
        return NextResponse.json({ error: 'No company found' }, { status: 404 })
    }

    try {
        const origin = request.headers.get('origin') || 'http://localhost:3000'

        // Create or retrieve Stripe customer
        let customerId = company.stripe_customer_id
        if (!customerId && STRIPE_SECRET) {
            const customerRes = await fetch('https://api.stripe.com/v1/customers', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${STRIPE_SECRET}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'email': user.email || '',
                    'metadata[company_id]': company.id,
                    'metadata[user_id]': user.id,
                }),
            })
            const customer = await customerRes.json()
            customerId = customer.id

            await supabase.from('companies')
                .update({ stripe_customer_id: customerId })
                .eq('id', company.id)
        }

        // Create Checkout Session
        if (!STRIPE_SECRET) {
            // Mock mode — redirect to success with mock data
            return NextResponse.json({
                url: `${origin}/payment/success?tier=${tier}&mock=true`
            })
        }

        const params = new URLSearchParams({
            'mode': 'subscription',
            'payment_method_types[0]': 'card',
            'line_items[0][price]': priceId,
            'line_items[0][quantity]': '1',
            'success_url': `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            'cancel_url': `${origin}/payment/cancel`,
            'metadata[company_id]': company.id,
            'metadata[tier]': tier,
        })

        if (customerId) {
            params.append('customer', customerId)
        }

        const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${STRIPE_SECRET}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        })

        const session = await sessionRes.json()

        if (session.error) {
            return NextResponse.json({ error: session.error.message }, { status: 400 })
        }

        return NextResponse.json({ url: session.url })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
