import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || ''

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: company } = await supabase
        .from('companies').select('stripe_customer_id').eq('owner_id', user.id).single()

    if (!company?.stripe_customer_id || !STRIPE_SECRET) {
        return NextResponse.json({ error: 'No billing account' }, { status: 400 })
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000'

    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${STRIPE_SECRET}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'customer': company.stripe_customer_id,
            'return_url': `${origin}/employer/settings`,
        }),
    })

    const session = await res.json()

    if (session.error) {
        return NextResponse.json({ error: session.error.message }, { status: 400 })
    }

    return NextResponse.json({ url: session.url })
}
