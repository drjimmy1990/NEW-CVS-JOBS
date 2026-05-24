-- Allow candidates to update rejection_analysis on their own rejected applications
-- This enables the Rejection Analyzer feature to cache AI results

CREATE POLICY "Candidate can save rejection analysis"
ON public.applications
FOR UPDATE
USING (
    candidate_id = auth.uid()
    AND status = 'rejected'
)
WITH CHECK (
    candidate_id = auth.uid()
    AND status = 'rejected'
);
