import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// ==========================================
// POST — Link finalized CV to candidate profile
// USER-INITIATED: Called when user clicks
// "Use this CV on my profile" button
//
// Updates: candidates.cv_url, skills[], resume_parsed_data
// ==========================================
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { sessionId } = body

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
        }

        // Call the RPC function that handles linking
        const { data, error } = await supabase.rpc('cv_link_to_profile', {
            p_session_id: sessionId,
            p_user_id: user.id,
        })

        if (error) {
            console.error('CV link error:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        // data is the JSONB result from the RPC
        const result = data as { success: boolean; message: string; cv_url?: string; error?: string }

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to link CV' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            message: result.message,
            cv_url: result.cv_url,
        })
    } catch (error) {
        console.error('CV link-profile error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
