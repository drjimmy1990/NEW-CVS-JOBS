import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// ==========================================
// GET — List external jobs (respects RLS)
// ==========================================
export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    const source = searchParams.get('source')
    const access = searchParams.get('access')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
        .from('external_jobs')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)

    if (source) {
        query = query.eq('source_platform', source)
    }
    if (access) {
        query = query.eq('access_level', access)
    }

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ jobs: data })
}

// ==========================================
// POST — Import external jobs from n8n
// ==========================================
export async function POST(req: NextRequest) {
    // Verify webhook secret
    const body = await req.json()
    const secret = body.secret || req.headers.get('x-webhook-secret')

    if (secret !== process.env.N8N_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobs = body.jobs
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
        return NextResponse.json({ error: 'No jobs provided' }, { status: 400 })
    }

    // Use Service Role key to bypass RLS for webhook ingestion
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const results = {
        imported: 0,
        updated: 0,
        errors: [] as string[]
    }

    for (const job of jobs) {
        if (!job.title || !job.source_url || !job.source_platform) {
            results.errors.push(`Missing required fields for: ${job.title || 'unknown'}`)
            continue
        }

        // Generate slug: source-platform-title-externalid
        const baseSlug = `${job.source_platform}-${job.title}`
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 80)
        const slug = job.external_id
            ? `${baseSlug}-${job.external_id.slice(-8)}`
            : `${baseSlug}-${Date.now().toString(36)}`

        const record = {
            external_id: job.external_id || null,
            source_platform: job.source_platform,
            source_url: job.source_url,
            title: job.title,
            company_name: job.company_name || null,
            company_logo_url: job.company_logo_url || null,
            description: job.description || null,
            job_type: job.job_type || 'full_time',
            location_city: job.location_city || null,
            location_country: job.location_country || 'UAE',
            salary_min: job.salary_min || null,
            salary_max: job.salary_max || null,
            currency: job.currency || 'AED',
            skills_required: job.skills_required || [],
            experience_level: job.experience_level || null,
            access_level: job.access_level || 'public',
            is_active: true,
            slug,
            posted_at: job.posted_at || new Date().toISOString(),
            scraped_at: new Date().toISOString(),
            expires_at: job.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }

        // Upsert: if same source_platform + external_id exists, update it
        if (job.external_id) {
            const { data: existing } = await supabase
                .from('external_jobs')
                .select('id')
                .eq('source_platform', job.source_platform)
                .eq('external_id', job.external_id)
                .single()

            if (existing) {
                const { error } = await supabase
                    .from('external_jobs')
                    .update({
                        ...record,
                        slug: undefined, // Don't change slug on update
                    })
                    .eq('id', existing.id)

                if (error) {
                    results.errors.push(`Update failed for ${job.title}: ${error.message}`)
                } else {
                    results.updated++
                }
                continue
            }
        }

        // Insert new
        const { error } = await supabase.from('external_jobs').insert(record)
        if (error) {
            // Slug conflict? Try with timestamp suffix
            if (error.code === '23505' && error.message.includes('slug')) {
                const retryRecord = { ...record, slug: `${slug}-${Date.now().toString(36)}` }
                const { error: retryErr } = await supabase.from('external_jobs').insert(retryRecord)
                if (retryErr) {
                    results.errors.push(`Insert failed for ${job.title}: ${retryErr.message}`)
                } else {
                    results.imported++
                }
            } else {
                results.errors.push(`Insert failed for ${job.title}: ${error.message}`)
            }
        } else {
            results.imported++
        }
    }

    return NextResponse.json({
        success: true,
        ...results,
        total: jobs.length
    })
}
