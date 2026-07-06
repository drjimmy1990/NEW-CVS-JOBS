import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Daily cron: expire stale contracts
export async function GET(req: Request) {
    try {
        // Verify cron secret — FAIL CLOSED: if the secret is not configured,
        // refuse to run rather than leaving the endpoint open to anyone.
        const authHeader = req.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (!cronSecret) {
            console.error('[Cron] CRON_SECRET is not configured — refusing to run.')
            return NextResponse.json({ error: 'Cron not configured' }, { status: 503 })
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createClient()

        // Find all non-terminal contracts past their expiry
        const { data: expired, error } = await supabase
            .from('contracts')
            .update({ status: 'expired' })
            .in('status', ['draft', 'sent', 'viewed'])
            .lt('expires_at', new Date().toISOString())
            .select('id')

        if (error) {
            console.error('[Cron] Contract expiry error:', error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const count = expired?.length || 0
        console.info(`[Cron] Expired ${count} contracts`)

        return NextResponse.json({
            success: true,
            expired_count: count,
            expired_ids: (expired || []).map(c => c.id),
            timestamp: new Date().toISOString()
        })
    } catch (err: any) {
        console.error('[Cron] Exception:', err.message)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
