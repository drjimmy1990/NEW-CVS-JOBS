import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { notifyContractEvent } from '@/lib/contract-notify';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify the user is an employer
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'employer') {
            return NextResponse.json({ error: 'Only employers can generate contracts' }, { status: 403 });
        }

        const body = await req.json();
        const { applicationId, templateId, salary, startDate, benefits } = body;

        if (!applicationId || !templateId || !salary || !startDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch Application & Candidate Details (include company ID)
        const { data: application, error: appError } = await supabase
            .from('applications')
            .select(`
                id,
                job_id,
                candidate_id,
                jobs ( title, companies ( id, name ) )
            `)
            .eq('id', applicationId)
            .single();

        if (appError || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        const appData = application as any;
        const companyName = Array.isArray(appData.jobs)
            ? appData.jobs[0]?.companies?.name
            : appData.jobs?.companies?.name;
        const companyId = Array.isArray(appData.jobs)
            ? appData.jobs[0]?.companies?.id
            : appData.jobs?.companies?.id;
        const jobTitle = Array.isArray(appData.jobs)
            ? appData.jobs[0]?.title
            : appData.jobs?.title;

        const { data: candidateProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', application.candidate_id)
            .single();

        // 2. Fetch Template HTML
        const { data: template, error: tplError } = await supabase
            .from('contract_templates')
            .select('html_content')
            .eq('id', templateId)
            .single();

        if (tplError || !template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        // 3. Render HTML by replacing placeholders with real data
        const candidateName = candidateProfile?.full_name || 'مرشح';
        const renderedHtml = template.html_content
            .replace(/\{\{company_name\}\}/g, companyName || '')
            .replace(/\{\{candidate_name\}\}/g, candidateName)
            .replace(/\{\{position\}\}/g, jobTitle || '')
            .replace(/\{\{salary\}\}/g, Number(salary).toLocaleString())
            .replace(/\{\{start_date\}\}/g, startDate)
            .replace(/\{\{benefits\}\}/g, benefits || '');

        // 4. INSERT contract row into the contracts table (the critical missing step)
        const { data: contract, error: insertError } = await supabase
            .from('contracts')
            .insert({
                company_id: companyId,
                application_id: applicationId,
                template_id: templateId,
                rendered_html: renderedHtml,
                salary: Number(salary),
                currency: 'AED',
                start_date: startDate,
                benefits: benefits || '',
                created_by: user.id,
                status: 'draft',
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            console.error('[Contract Gen] DB Insert Error:', insertError.message);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // 5. Update application status to 'offer'
        await supabase
            .from('applications')
            .update({ status: 'offer' })
            .eq('id', applicationId);

        // 6. Fire n8n notification event (non-blocking)
        notifyContractEvent({
            event_type: 'contract_created',
            contract_id: contract.id,
            candidate_name: candidateName,
            company_name: companyName || '',
            job_title: jobTitle || '',
            salary: Number(salary),
            currency: 'AED',
            start_date: startDate,
        });

        return NextResponse.json({
            success: true,
            contract_id: contract.id,
            status: contract.status,
        });

    } catch (error: any) {
        console.error('[Contract Gen] Exception:', error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
