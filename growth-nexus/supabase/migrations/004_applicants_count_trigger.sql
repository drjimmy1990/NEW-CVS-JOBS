-- ==========================================
-- 004_applicants_count_trigger.sql
-- ==========================================

-- Function to recalculate the applicants_count on a job whenever an application is added, removed, or changed.
CREATE OR REPLACE FUNCTION update_job_applicants_count()
RETURNS TRIGGER AS $$
DECLARE
  v_job_id UUID;
  v_count INT;
BEGIN
  -- Determine the related job_id
  IF TG_OP = 'DELETE' THEN
    v_job_id := OLD.job_id;
  ELSE
    v_job_id := NEW.job_id;
  END IF;

  -- Recalculate the total number of applications for this job
  SELECT count(*) INTO v_count
  FROM public.applications
  WHERE job_id = v_job_id;

  -- Update the jobs table
  UPDATE public.jobs
  SET applicants_count = v_count,
      updated_at = now()
  WHERE id = v_job_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to fire the function after INSERT, UPDATE (if job_id changes), or DELETE
DROP TRIGGER IF EXISTS trigger_update_job_applicants_count ON public.applications;
CREATE TRIGGER trigger_update_job_applicants_count
AFTER INSERT OR DELETE OR UPDATE OF job_id
ON public.applications
FOR EACH ROW
EXECUTE FUNCTION update_job_applicants_count();

-- Optional: Run a backfill to correct any existing discrepancies
UPDATE public.jobs j
SET applicants_count = (
  SELECT count(*)
  FROM public.applications a
  WHERE a.job_id = j.id
);
