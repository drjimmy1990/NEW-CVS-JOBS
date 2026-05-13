import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: sessions, error } = await supabase
        .from('interview_practice_sessions')
        .select('id, job_role, industry, language, questions, answers, score, report, status, created_at, completed_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) {
        console.error('[interview-practice-history] Error:', error.message)
        return NextResponse.json({ error: 'Failed to load history' }, { status: 500 })
    }

    // Get credit balance for display
    const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance, interview_allowance')
        .eq('id', user.id)
        .single()

    return NextResponse.json({
        sessions: sessions || [],
        credits: {
            balance: profile?.credits_balance ?? 0,
            allowance: profile?.interview_allowance ?? 0,
        },
    })
}
