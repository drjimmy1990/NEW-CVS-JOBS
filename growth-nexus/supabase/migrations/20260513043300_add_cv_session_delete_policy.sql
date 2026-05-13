-- Add DELETE policy for cv_sessions so users can delete their own sessions
CREATE POLICY "Users can delete own cv sessions" ON public.cv_sessions 
  FOR DELETE USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
