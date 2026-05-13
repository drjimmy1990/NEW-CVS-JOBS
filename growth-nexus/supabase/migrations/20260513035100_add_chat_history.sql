-- ============================================
-- Add chat_history column to cv_sessions
-- Persists chat messages so they survive page refresh
-- ============================================

ALTER TABLE cv_sessions 
ADD COLUMN IF NOT EXISTS chat_history jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN cv_sessions.chat_history IS 'JSON array of chat messages [{id, sender, content, timestamp}]';
