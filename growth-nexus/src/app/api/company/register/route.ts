import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateRiskScore, requiresManualReview } from '@/lib/verification-engine'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { userId, documents, ...companyData } = body

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        }

        // 1. Calculate Risk Score & Verification Status
        const riskData = {
            email: companyData.email,
            website: companyData.website,
            entity_type: companyData.entity_type,
            trade_license_number: companyData.trade_license_number,
            trade_license_expiry: companyData.trade_license_expiry,
            has_documents: documents && documents.length > 0,
            document_count: documents ? documents.length : 0
        }

        const { score, level, factors } = calculateRiskScore(riskData)
        const reviewRequired = requiresManualReview({
            email: companyData.email,
            entity_type: companyData.entity_type,
            risk_level: level
        })

        // All companies must start as under_review — only admin approval
        // transitions to 'verified'. Risk score is kept for admin prioritization.
        const initialStatus = 'under_review'

        // We use the service_role key to bypass RLS during registration, 
        // ensuring atomic insertion across multiple tables without complex RLS setups.
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('CRITICAL: Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
            return NextResponse.json({ error: 'Server configuration error: Missing database credentials' }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 2. Generate a unique slug from the company name
        const companyName = companyData.trade_name || companyData.official_name || 'company'
        const baseSlug = companyName
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')   // strip non-word chars (keeps Arabic removed too)
            .replace(/[\s_]+/g, '-')     // spaces/underscores → hyphens
            .replace(/-+/g, '-')         // collapse multiple hyphens
            .replace(/^-|-$/g, '')       // trim leading/trailing hyphens
            || 'company'                 // fallback if all chars were stripped
        const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
        const slug = `${baseSlug}-${uniqueSuffix}`

        // 3. Insert Company
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .insert({
                owner_id: userId,
                name: companyData.official_name || companyData.trade_name || 'Unnamed Company',
                slug,
                official_name: companyData.official_name,
                trade_name: companyData.trade_name,
                trade_license_number: companyData.trade_license_number,
                trade_license_expiry: companyData.trade_license_expiry,
                entity_type: companyData.entity_type,
                industry: companyData.industry,
                sub_industry: companyData.sub_industry,
                emirate: companyData.emirate,
                city: companyData.city,
                address: companyData.address,
                phone: companyData.phone,
                website: companyData.website,
                linkedin_url: companyData.linkedin_url,
                contact_person_name: companyData.contact_person_name,
                contact_person_title: companyData.contact_person_title,
                employee_count_range: companyData.employee_count_range,
                verification_status: initialStatus,
                risk_level: level,
                risk_score: score,
            })
            .select('id')
            .single()

        if (companyError) {
            console.error("Error creating company:", companyError)
            return NextResponse.json({ error: 'Failed to create company record' }, { status: 500 })
        }

        const companyId = company.id

        // 3. Insert Company Member (Owner)
        const { error: memberError } = await supabase
            .from('company_members')
            .insert({
                company_id: companyId,
                user_id: userId,
                role: 'owner',
                status: 'active'
            })

        if (memberError) {
            console.error("Error adding company owner:", memberError)
            // Note: In production we'd want to rollback the company creation here
        }

        // 4. Insert Documents
        if (documents && documents.length > 0) {
            const documentsToInsert = documents.map((doc: any) => ({
                company_id: companyId,
                document_type: doc.document_type,
                file_name: doc.file_name,
                file_size: doc.file_size,
                file_url: doc.file_url,
                ocr_status: 'pending'
            }))

            const { error: docsError } = await supabase
                .from('company_documents')
                .insert(documentsToInsert)

            if (docsError) {
                console.error("Error inserting company documents:", docsError)
            }
        }

        // Return success
        return NextResponse.json({ success: true, companyId })

    } catch (error: any) {
        console.error('Company registration error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
