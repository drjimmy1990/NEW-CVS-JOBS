-- Function 1: Upsert Candidate from Private Form
create or replace function upsert_private_candidate(
  p_email text,
  p_full_name text,
  p_cv_url text
) returns uuid as $$
declare
  v_candidate_id uuid;
begin
  -- Try to find existing profile
  select id into v_candidate_id from public.profiles where email = p_email;
  
  -- If not found, create a shell profile and candidate record
  if v_candidate_id is null then
    -- Generate a new UUID
    v_candidate_id := gen_random_uuid();
    
    -- Insert into profiles (bypass RLS by using security definer)
    -- We can only do this because this function runs with elevated privileges!
    insert into public.profiles (id, email, full_name, role)
    values (v_candidate_id, p_email, p_full_name, 'candidate');
    
    -- Insert into candidates
    insert into public.candidates (id, cv_url, is_public)
    values (v_candidate_id, p_cv_url, false);
  else
    -- Update existing candidate's CV
    update public.candidates set cv_url = p_cv_url where id = v_candidate_id;
  end if;

  return v_candidate_id;
end;
$$ language plpgsql security definer;

-- Function 2: Get or Create Private Tracking Job
create or replace function get_or_create_private_job(
  p_company_id uuid,
  p_landing_page_id uuid
) returns uuid as $$
declare
  v_job_id uuid;
  v_slug text;
begin
  -- We'll use a magic slug format to identify these
  v_slug := 'private-campaign-' || p_landing_page_id;

  select id into v_job_id from public.jobs where slug = v_slug;

  if v_job_id is null then
    insert into public.jobs (
      company_id, title, slug, description, location_city, status, job_type
    ) values (
      p_company_id, 
      'Private Campaign Applicants', 
      v_slug, 
      'Hidden job used to collect applicants from custom landing page links.', 
      'Remote', 
      'archived', -- Keep it hidden from public boards!
      'full_time'
    ) returning id into v_job_id;
  end if;

  return v_job_id;
end;
$$ language plpgsql security definer;

-- Also we need a quick RPC to increment views
create or replace function increment_landing_page_views(page_id uuid)
returns void as $$
begin
  update public.landing_pages
  set views_count = views_count + 1
  where id = page_id;
end;
$$ language plpgsql security definer;