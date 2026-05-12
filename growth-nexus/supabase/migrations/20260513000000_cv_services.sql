-- ============================================
-- GrowthNexus Phase 11: B2C CV Services
-- Tables: cv_sessions, cv_chat_messages
-- Columns: profiles.credits_cv
-- Functions: cv_link_to_profile(), deduct_cv_credits()
-- ============================================

-- 1. Add credits_cv to profiles (dual credits model)
--    Workflows check credits_cv first, fallback to credits_balance
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS credits_cv INTEGER DEFAULT 0;

-- ============================================
-- 2. CV SESSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.cv_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Session classification
    session_type TEXT DEFAULT 'optimize' 
      CHECK (session_type IN ('optimize', 'create', 'ats_convert')),
    input_mode TEXT DEFAULT 'upload' 
      CHECK (input_mode IN ('upload', 'form', 'paste')),
    language TEXT DEFAULT 'en' 
      CHECK (language IN ('en', 'ar', 'bilingual')),
    
    -- Status lifecycle
    status TEXT DEFAULT 'active' 
      CHECK (status IN ('active', 'processing', 'ready', 'downloaded', 'archived')),
    
    -- File URLs
    original_pdf_url TEXT,          -- Source PDF (if uploaded)
    latest_draft_url TEXT,          -- Current working draft
    final_pdf_url TEXT,             -- Completed CV
    
    -- Content
    text_content TEXT,              -- Extracted/pasted text
    form_data JSONB,                -- CvData JSON (for form-based creation)
    parsed_data JSONB,              -- AI-extracted structured data (skills, experience, etc.)
    
    -- Profile linking (user-initiated, NOT automatic)
    linked_to_profile BOOLEAN DEFAULT false,
    linked_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. CV CHAT MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.cv_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.cv_sessions(id) ON DELETE CASCADE NOT NULL,
    sender TEXT CHECK (sender IN ('user', 'ai', 'system')) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,                 -- Optional: PDF base64 refs, suggestions, etc.
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cv_sessions_user ON public.cv_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_sessions_status ON public.cv_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cv_chat_session ON public.cv_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_cv_chat_created ON public.cv_chat_messages(created_at);

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.cv_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_chat_messages ENABLE ROW LEVEL SECURITY;

-- Users own their sessions
CREATE POLICY "Users can view own cv sessions" ON public.cv_sessions 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cv sessions" ON public.cv_sessions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cv sessions" ON public.cv_sessions 
  FOR UPDATE USING (auth.uid() = user_id);

-- Chat messages via session ownership
CREATE POLICY "Users can view own cv chat" ON public.cv_chat_messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cv_sessions 
      WHERE cv_sessions.id = cv_chat_messages.session_id 
      AND cv_sessions.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own cv chat" ON public.cv_chat_messages 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cv_sessions 
      WHERE cv_sessions.id = cv_chat_messages.session_id 
      AND cv_sessions.user_id = auth.uid()
    )
  );

-- Admin access
CREATE POLICY "Admins can view all cv sessions" ON public.cv_sessions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can view all cv chat" ON public.cv_chat_messages 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- 6. LINK CV TO PROFILE (User-Initiated)
-- Called when user clicks "Use this CV on my profile" button
-- ============================================

CREATE OR REPLACE FUNCTION public.cv_link_to_profile(
  p_session_id UUID,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_session RECORD;
BEGIN
  -- Get the session
  SELECT final_pdf_url, parsed_data, status
  INTO v_session
  FROM public.cv_sessions
  WHERE id = p_session_id AND user_id = p_user_id;
  
  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;
  
  IF v_session.final_pdf_url IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'CV not finalized yet');
  END IF;
  
  -- Update candidate profile with the CV
  UPDATE public.candidates
  SET 
    cv_url = v_session.final_pdf_url,
    resume_parsed_data = COALESCE(v_session.parsed_data, resume_parsed_data),
    skills = COALESCE(
      (SELECT array_agg(s) FROM jsonb_array_elements_text(v_session.parsed_data->'skills') AS s),
      skills
    ),
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Mark session as linked
  UPDATE public.cv_sessions
  SET linked_to_profile = true, linked_at = now()
  WHERE id = p_session_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'CV linked to your profile',
    'cv_url', v_session.final_pdf_url
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. CREDIT DEDUCTION (Dual: credits_cv → credits_balance)
-- ============================================

CREATE OR REPLACE FUNCTION public.deduct_cv_credits(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  v_cv_credits INTEGER;
  v_balance INTEGER;
  v_free_mode TEXT;
BEGIN
  -- Check free mode toggle
  SELECT value INTO v_free_mode 
  FROM system_config WHERE key = 'cv_services_free_mode';
  
  IF v_free_mode = 'true' THEN
    RETURN true; -- Skip credit check in free/testing mode
  END IF;

  SELECT credits_cv, credits_balance 
  INTO v_cv_credits, v_balance
  FROM public.profiles WHERE id = p_user_id;
  
  -- Check credits_cv first
  IF v_cv_credits >= p_amount THEN
    UPDATE public.profiles SET credits_cv = credits_cv - p_amount WHERE id = p_user_id;
    RETURN true;
  END IF;
  
  -- Fallback to credits_balance
  IF v_balance >= p_amount THEN
    UPDATE public.profiles SET credits_balance = credits_balance - p_amount WHERE id = p_user_id;
    RETURN true;
  END IF;
  
  -- No credits available
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. SYSTEM CONFIG — CV Service Settings
-- ============================================

INSERT INTO public.system_config (key, value, description, group_name) VALUES
  ('cv_services_enabled', 'true', 'Master toggle for CV Builder/Optimizer', 'cv_services'),
  ('cv_services_free_mode', 'true', 'If true, skip credit checks (for testing)', 'cv_services'),
  ('cv_optimize_cost', '1', 'Credits per CV optimization session', 'cv_services'),
  ('cv_create_cost', '1', 'Credits per CV creation', 'cv_services'),
  ('cv_ats_convert_cost', '1', 'Credits per ATS conversion', 'cv_services')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 9. STORAGE BUCKET (run in Supabase Dashboard > Storage)
-- ============================================
-- CREATE BUCKET 'cv-files' with public access for download URLs
-- This must be done via Supabase Dashboard or:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('cv-files', 'cv-files', true);

-- ============================================
-- NOTIFY POSTGREST
-- ============================================

NOTIFY pgrst, 'reload schema';
