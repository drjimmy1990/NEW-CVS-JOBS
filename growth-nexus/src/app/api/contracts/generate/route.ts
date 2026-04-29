import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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

        // 1. Fetch Application & Candidate Details
        const { data: application, error: appError } = await supabase
            .from('applications')
            .select(`
                id,
                job_id,
                candidate_id,
                jobs ( title, companies ( name ) )
            `)
            .eq('id', applicationId)
            .single();

        if (appError || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

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

        // 3. Send payload to N8N Webhook (Workflow 11)
        const webhookUrl = process.env.N8N_CONTRACT_GEN_WEBHOOK;
        const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

        if (!webhookUrl || !webhookSecret) {
            // Fallback for local testing if N8N isn't fully configured
            console.warn('[Contract Gen] Missing N8N credentials, using mock response.');
            return NextResponse.json({
                success: true,
                contract_url: '#mock-contract',
                offer_letter_url: '#mock-offer'
            });
        }

        const appData = application as any;
        const payload = {
            application_id: applicationId,
            company_name: Array.isArray(appData.jobs) ? appData.jobs[0]?.companies?.name : appData.jobs?.companies?.name,
            candidate_name: candidateProfile?.full_name || 'Candidate',
            position: Array.isArray(appData.jobs) ? appData.jobs[0]?.title : appData.jobs?.title,
            salary,
            currency: 'AED',
            start_date: startDate,
            benefits: benefits || [],
            html_template: template.html_content
        };

        const n8nResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-secret': webhookSecret
            },
            body: JSON.stringify(payload)
        });

        if (!n8nResponse.ok) {
            console.error('[Contract Gen] N8N Error:', await n8nResponse.text());
            return NextResponse.json({ error: 'Failed to generate contract via N8N' }, { status: 500 });
        }

        const n8nData = await n8nResponse.json();

        // Optionally update application status to 'offer' in DB if not already done
        await supabase
            .from('applications')
            .update({ status: 'offer' })
            .eq('id', applicationId);

        return NextResponse.json({
            success: true,
            contract_url: n8nData.contract_url,
            offer_letter_url: n8nData.offer_letter_url
        });

    } catch (error: any) {
        console.error('[Contract Gen] Exception:', error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
