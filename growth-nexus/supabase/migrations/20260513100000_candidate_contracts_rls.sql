-- ============================================
-- GrowthNexus: Candidate Contracts RLS Policy
-- Allows candidates to read/update their own contracts
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Candidate can VIEW contracts linked to their applications
CREATE POLICY "Candidates can view own contracts" ON public.contracts
FOR SELECT USING (
    application_id IN (
        SELECT id FROM public.applications
        WHERE candidate_id = auth.uid()
    )
);

-- 2. Candidate can UPDATE contract status (sign/decline only)
-- This allows the candidate to change status to 'viewed', 'signed', or 'declined'
CREATE POLICY "Candidates can update own contract status" ON public.contracts
FOR UPDATE USING (
    application_id IN (
        SELECT id FROM public.applications
        WHERE candidate_id = auth.uid()
    )
) WITH CHECK (
    -- Candidates can only set these specific statuses
    status IN ('viewed', 'signed', 'declined')
);
