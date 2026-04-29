-- ==========================================
-- Save Interview Results (Bypass RLS)
-- ==========================================
-- This function allows saving interview results 
-- from the candidate's session without needing 
-- a service role key.

CREATE OR REPLACE FUNCTION save_interview_result(
    p_application_id UUID,
    p_interview_score INTEGER,
    p_interview_report JSONB
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.applications
    SET 
        interview_score = p_interview_score,
        interview_report = p_interview_report
    WHERE id = p_application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure candidates can read their own interview data
-- and employers can read interview data for their job applicants
