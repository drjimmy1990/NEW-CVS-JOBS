import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/emiratisation/candidates
 * Smart Emirati Matching — returns Emirati candidates matching company needs.
 * Query params: skills, location, experience_min, experience_max, limit
 */
export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const skills = searchParams.get('skills')
    const location = searchParams.get('location')
    const experienceMin = searchParams.get('experience_min')
    const experienceMax = searchParams.get('experience_max')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Query Emirati candidates from the candidates table
    let query = supabase
        .from('candidates')
        .select(`
            id,
            headline,
            skills,
            years_experience,
            residence_emirate,
            is_public,
            candidate_type,
            nafis_registered,
            profiles:id (
                full_name,
                avatar_url
            )
        `)
        .eq('candidate_type', 'emirati')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(limit)

    // Filter by location
    if (location) {
        query = query.eq('residence_emirate', location)
    }

    // Filter by experience range
    if (experienceMin) {
        query = query.gte('years_experience', parseInt(experienceMin))
    }
    if (experienceMax) {
        query = query.lte('years_experience', parseInt(experienceMax))
    }

    // Filter by skills (contains any of the requested skills)
    if (skills) {
        const skillList = skills.split(',').map(s => s.trim())
        query = query.overlaps('skills', skillList)
    }

    const { data: candidates, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ candidates: candidates || [], total: candidates?.length || 0 })
}
