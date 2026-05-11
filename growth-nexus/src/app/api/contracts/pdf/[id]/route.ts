import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET: Generate PDF from contract rendered_html
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Fetch the contract
        const { data: contract, error } = await supabase
            .from('contracts')
            .select(`
                id, rendered_html, salary, currency, start_date,
                applications ( candidate_id, jobs ( title, companies ( id, name, owner_id ) ) )
            `)
            .eq('id', id)
            .single()

        if (error || !contract) {
            return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
        }

        const appData = contract as any
        const candidateId = appData.applications?.candidate_id
        const companyOwnerId = Array.isArray(appData.applications?.jobs)
            ? appData.applications.jobs[0]?.companies?.owner_id
            : appData.applications?.jobs?.companies?.owner_id
        const companyId = Array.isArray(appData.applications?.jobs)
            ? appData.applications.jobs[0]?.companies?.id
            : appData.applications?.jobs?.companies?.id

        // Authorization: either the candidate or a company member
        const isCandidate = candidateId === user.id
        const isOwner = companyOwnerId === user.id

        let isMember = false
        if (!isCandidate && !isOwner && companyId) {
            const { data: membership } = await supabase
                .from('company_members')
                .select('id')
                .eq('company_id', companyId)
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single()
            isMember = !!membership
        }

        if (!isCandidate && !isOwner && !isMember) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        if (!contract.rendered_html) {
            return NextResponse.json({ error: 'No contract content' }, { status: 400 })
        }

        // Build a complete HTML document for PDF rendering
        const jobTitle = Array.isArray(appData.applications?.jobs)
            ? appData.applications.jobs[0]?.title
            : appData.applications?.jobs?.title
        const companyName = Array.isArray(appData.applications?.jobs)
            ? appData.applications.jobs[0]?.companies?.name
            : appData.applications?.jobs?.companies?.name

        const fullHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif;
            font-size: 14px;
            line-height: 1.8;
            color: #1a1a1a;
            background: #fff;
            padding: 40px;
        }

        /* Header */
        .pdf-header {
            text-align: center;
            border-bottom: 2px solid #c4a035;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .pdf-header h1 {
            font-size: 22px;
            color: #0c1222;
            margin-bottom: 8px;
        }
        .pdf-header .meta {
            font-size: 12px;
            color: #666;
        }

        /* Contract content */
        .contract-body {
            min-height: 600px;
        }
        .contract-body h1, .contract-body h2, .contract-body h3 {
            color: #0c1222;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .contract-body p {
            margin-bottom: 12px;
        }
        .contract-body table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .contract-body td, .contract-body th {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: right;
        }
        .contract-body th {
            background: #f5f5f5;
        }

        /* Footer */
        .pdf-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 10px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="pdf-header">
        <h1>عقد عمل — ${jobTitle || ''}</h1>
        <div class="meta">${companyName || ''} | الراتب: ${Number(contract.salary).toLocaleString()} ${contract.currency} | تاريخ المباشرة: ${contract.start_date}</div>
    </div>
    <div class="contract-body">
        ${contract.rendered_html}
    </div>
    <div class="pdf-footer">
        تم إنشاء هذا العقد عبر منصة GrowthNexus — ${new Date().toLocaleDateString('ar-AE')}
    </div>
</body>
</html>`

        // Return HTML with print-optimized headers
        // The client will use window.print() or a PDF library
        // For server-side, we return the HTML as a downloadable file
        return new Response(fullHtml, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `attachment; filename="contract-${id.slice(0, 8)}.html"`,
            },
        })

    } catch (err: any) {
        console.error('[Contract PDF] Error:', err.message)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
