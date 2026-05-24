-- ==========================================
-- SKILL ALIASES TABLE
-- Bilingual skill dictionary for smart matching
-- Run in Supabase SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.skill_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias TEXT NOT NULL,
  canonical TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Prevent duplicate aliases
CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_aliases_alias ON public.skill_aliases (LOWER(alias));

-- RLS
ALTER TABLE public.skill_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_read_skill_aliases" ON public.skill_aliases FOR SELECT USING (true);

CREATE POLICY "admin_manage_skill_aliases" ON public.skill_aliases FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ==========================================
-- SEED: Initial bilingual aliases
-- ==========================================

INSERT INTO public.skill_aliases (alias, canonical, category) VALUES
  -- Programming & Frameworks
  ('رياكت', 'react', 'programming'),
  ('ريأكت', 'react', 'programming'),
  ('react.js', 'react', 'programming'),
  ('reactjs', 'react', 'programming'),
  ('نود', 'node.js', 'programming'),
  ('نود جي اس', 'node.js', 'programming'),
  ('nodejs', 'node.js', 'programming'),
  ('جافاسكريبت', 'javascript', 'programming'),
  ('جافا سكريبت', 'javascript', 'programming'),
  ('js', 'javascript', 'programming'),
  ('تايب سكريبت', 'typescript', 'programming'),
  ('تايبسكريبت', 'typescript', 'programming'),
  ('ts', 'typescript', 'programming'),
  ('بايثون', 'python', 'programming'),
  ('بيثون', 'python', 'programming'),
  ('جافا', 'java', 'programming'),
  ('سي شارب', 'c#', 'programming'),
  ('سي #', 'c#', 'programming'),
  ('بي اتش بي', 'php', 'programming'),
  ('فيو', 'vue', 'programming'),
  ('فيو جي اس', 'vue', 'programming'),
  ('vue.js', 'vue', 'programming'),
  ('vuejs', 'vue', 'programming'),
  ('أنجولار', 'angular', 'programming'),
  ('انجولار', 'angular', 'programming'),
  ('نيكست', 'next.js', 'programming'),
  ('نكست', 'next.js', 'programming'),
  ('nextjs', 'next.js', 'programming'),
  ('فلاتر', 'flutter', 'programming'),
  ('سويفت', 'swift', 'programming'),
  ('كوتلن', 'kotlin', 'programming'),
  ('لارافل', 'laravel', 'programming'),
  ('دجانجو', 'django', 'programming'),
  ('جانجو', 'django', 'programming'),
  -- Databases
  ('قواعد بيانات', 'databases', 'databases'),
  ('قواعد البيانات', 'databases', 'databases'),
  ('ماي اس كيو ال', 'mysql', 'databases'),
  ('بوستجرس', 'postgresql', 'databases'),
  ('بوستقريس', 'postgresql', 'databases'),
  ('مونجو', 'mongodb', 'databases'),
  ('مونقو', 'mongodb', 'databases'),
  ('mongo', 'mongodb', 'databases'),
  -- Cloud & DevOps
  ('أمازون', 'aws', 'cloud'),
  ('امازون', 'aws', 'cloud'),
  ('سحابة', 'cloud', 'cloud'),
  ('الحوسبة السحابية', 'cloud', 'cloud'),
  ('دوكر', 'docker', 'cloud'),
  ('كوبرنيتس', 'kubernetes', 'cloud'),
  -- Design & UI
  ('تصميم', 'design', 'design'),
  ('تصميم واجهات', 'ui/ux', 'design'),
  ('تجربة المستخدم', 'ux', 'design'),
  ('واجهة المستخدم', 'ui', 'design'),
  ('فيجما', 'figma', 'design'),
  ('فوتوشوب', 'photoshop', 'design'),
  ('أدوبي', 'adobe', 'design'),
  ('ادوبي', 'adobe', 'design'),
  ('اليستريتور', 'illustrator', 'design'),
  -- Business & General
  ('إدارة المشاريع', 'project management', 'business'),
  ('ادارة المشاريع', 'project management', 'business'),
  ('إدارة الفريق', 'team management', 'business'),
  ('ادارة الفريق', 'team management', 'business'),
  ('التسويق الرقمي', 'digital marketing', 'business'),
  ('تسويق رقمي', 'digital marketing', 'business'),
  ('التسويق', 'marketing', 'business'),
  ('تسويق', 'marketing', 'business'),
  ('تحليل البيانات', 'data analysis', 'business'),
  ('تحليل بيانات', 'data analysis', 'business'),
  ('الذكاء الاصطناعي', 'ai', 'business'),
  ('ذكاء اصطناعي', 'ai', 'business'),
  ('artificial intelligence', 'ai', 'business'),
  ('تعلم الآلة', 'machine learning', 'business'),
  ('تعلم آلي', 'machine learning', 'business'),
  ('ml', 'machine learning', 'business'),
  ('أمن المعلومات', 'cybersecurity', 'business'),
  ('امن المعلومات', 'cybersecurity', 'business'),
  ('المبيعات', 'sales', 'business'),
  ('مبيعات', 'sales', 'business'),
  ('خدمة العملاء', 'customer service', 'business'),
  ('خدمة عملاء', 'customer service', 'business'),
  ('المحاسبة', 'accounting', 'business'),
  ('محاسبة', 'accounting', 'business'),
  ('الموارد البشرية', 'hr', 'business'),
  ('موارد بشرية', 'hr', 'business'),
  ('human resources', 'hr', 'business'),
  ('إدارة الأعمال', 'business management', 'business'),
  ('ادارة الاعمال', 'business management', 'business'),
  ('الترجمة', 'translation', 'business'),
  ('ترجمة', 'translation', 'business'),
  ('كتابة المحتوى', 'content writing', 'business'),
  ('كتابة محتوى', 'content writing', 'business'),
  ('تحسين محركات البحث', 'seo', 'business'),
  ('سيو', 'seo', 'business'),
  ('إكسل', 'excel', 'business'),
  ('اكسل', 'excel', 'business'),
  ('وورد', 'word', 'business'),
  ('باوربوينت', 'powerpoint', 'business')
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
