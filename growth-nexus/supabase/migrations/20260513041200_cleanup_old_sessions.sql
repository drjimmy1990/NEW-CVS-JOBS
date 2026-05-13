-- ============================================
-- Cleanup: Archive old stale cv_sessions
-- Keep only the latest 'ready' session as active
-- Archive all other sessions that are cluttering the optimizer
-- ============================================

-- Archive old 'downloaded' sessions (created before the fix)
UPDATE cv_sessions
SET
    status = 'archived'
WHERE
    status = 'downloaded'
    AND session_type = 'optimize';

-- Archive old 'active' sessions that are stale (older than the current ready one)
UPDATE cv_sessions
SET
    status = 'archived'
WHERE
    status = 'active'
    AND session_type = 'optimize'
    AND id != '8ec1cfbc-b79a-4b86-b334-e08eeff94b84';

-- Verify: only one session should remain as 'ready'
SELECT
    id,
    status,
    created_at,
    latest_draft_url IS NOT NULL AS has_draft
FROM cv_sessions
WHERE
    session_type = 'optimize'
    AND status IN ('active', 'ready')
ORDER BY created_at DESC;