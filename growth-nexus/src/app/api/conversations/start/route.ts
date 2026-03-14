import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { otherUserId } = await request.json()

    if (!otherUserId) {
        return NextResponse.json({ error: 'Missing otherUserId' }, { status: 400 })
    }

    // Check if conversation already exists (in either direction)
    const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(
            `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
        )
        .maybeSingle()

    if (existing) {
        return NextResponse.json({ conversationId: existing.id })
    }

    // Create new conversation
    const { data: newConvo, error } = await supabase
        .from('conversations')
        .insert({
            participant_1: user.id,
            participant_2: otherUserId,
        })
        .select('id')
        .single()

    if (error) {
        // Could be unique constraint if reversed order exists — try the other direction
        const { data: reversed } = await supabase
            .from('conversations')
            .select('id')
            .or(
                `and(participant_1.eq.${otherUserId},participant_2.eq.${user.id}),and(participant_1.eq.${user.id},participant_2.eq.${otherUserId})`
            )
            .maybeSingle()

        if (reversed) {
            return NextResponse.json({ conversationId: reversed.id })
        }

        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ conversationId: newConvo.id })
}
