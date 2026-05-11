import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET: List all templates (system + company-owned)
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: templates, error } = await supabase
            .from('contract_templates')
            .select('id, name, html_content, company_id, created_at, updated_at')
            .order('created_at', { ascending: false })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ templates })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST: Create a new template
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: company } = await supabase
            .from('companies')
            .select('id')
            .eq('owner_id', user.id)
            .single()

        if (!company) {
            // Check team membership
            const { data: membership } = await supabase
                .from('company_members')
                .select('company_id, role')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .in('role', ['owner', 'admin'])
                .single()
            if (!membership) return NextResponse.json({ error: 'No company access' }, { status: 403 })
        }

        const companyId = company?.id
        const body = await req.json()
        const { name, html_content } = body

        if (!name || !html_content) {
            return NextResponse.json({ error: 'Name and HTML content are required' }, { status: 400 })
        }

        const { data: template, error } = await supabase
            .from('contract_templates')
            .insert({ name, html_content, company_id: companyId })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ template }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// PUT: Update a template
export async function PUT(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { id, name, html_content } = body

        if (!id) return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })

        const { data: template, error } = await supabase
            .from('contract_templates')
            .update({ name, html_content, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ template })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// DELETE: Delete a company-owned template
export async function DELETE(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'Template ID required' }, { status: 400 })

        // Prevent deleting system templates (company_id IS NULL)
        const { data: tpl } = await supabase
            .from('contract_templates')
            .select('company_id')
            .eq('id', id)
            .single()

        if (!tpl?.company_id) {
            return NextResponse.json({ error: 'Cannot delete system templates' }, { status: 403 })
        }

        const { error } = await supabase
            .from('contract_templates')
            .delete()
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
