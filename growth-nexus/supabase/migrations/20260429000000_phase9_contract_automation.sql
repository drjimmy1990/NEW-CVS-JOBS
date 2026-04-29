-- Phase 9: Contract Automation
-- Creates the contract_templates table and seed data

CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Employers can read system templates (company_id IS NULL) and their own templates
CREATE POLICY "Employers can view system and own templates" ON public.contract_templates
    FOR SELECT USING (
        company_id IS NULL OR 
        company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
    );

-- Employers can insert their own templates
CREATE POLICY "Employers can insert own templates" ON public.contract_templates
    FOR INSERT WITH CHECK (
        company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
    );

-- Employers can update their own templates
CREATE POLICY "Employers can update own templates" ON public.contract_templates
    FOR UPDATE USING (
        company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
    );

-- Employers can delete their own templates
CREATE POLICY "Employers can delete own templates" ON public.contract_templates
    FOR DELETE USING (
        company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid())
    );

-- Insert Default MOHRE Template
INSERT INTO public.contract_templates (name, html_content, company_id) VALUES (
    'عقد عمل قياسي - وزارة الموارد البشرية (MOHRE)',
    '<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: "Arial", sans-serif; padding: 40px; line-height: 1.6; }
        h1 { text-align: center; color: #0A1628; border-bottom: 2px solid #C8973A; padding-bottom: 10px; }
        .details { margin-top: 30px; }
        .details p { margin: 10px 0; font-size: 16px; }
        .signature { margin-top: 60px; display: flex; justify-content: space-between; }
        .sig-box { width: 40%; text-align: center; border-top: 1px solid #333; padding-top: 10px; }
    </style>
</head>
<body>
    <h1>عقد عمل محدد المدة</h1>
    
    <div class="details">
        <p><strong>الطرف الأول (صاحب العمل):</strong> {{company_name}}</p>
        <p><strong>الطرف الثاني (العامل):</strong> {{candidate_name}}</p>
        <p><strong>المسمى الوظيفي:</strong> {{position}}</p>
        <p><strong>الراتب الإجمالي:</strong> {{salary}} درهم إماراتي</p>
        <p><strong>تاريخ المباشرة:</strong> {{start_date}}</p>
    </div>

    <div class="terms">
        <h3>الشروط والأحكام:</h3>
        <ol>
            <li>يخضع هذا العقد لقوانين وزارة الموارد البشرية والتوطين في دولة الإمارات العربية المتحدة.</li>
            <li>فترة التجربة محددة بـ 6 أشهر تبدأ من تاريخ المباشرة.</li>
            <li>المزايا الإضافية: {{benefits}}</li>
        </ol>
    </div>

    <div class="signature">
        <div class="sig-box">توقيع الطرف الأول<br>{{company_name}}</div>
        <div class="sig-box">توقيع الطرف الثاني<br>{{candidate_name}}</div>
    </div>
</body>
</html>',
    NULL
) ON CONFLICT DO NOTHING;
