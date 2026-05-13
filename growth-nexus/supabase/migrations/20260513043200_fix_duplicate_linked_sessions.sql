-- Keep only the most recently linked session for each user and mark the rest as not linked

UPDATE cv_sessions
SET linked_to_profile = false
WHERE linked_to_profile = true
  AND id NOT IN (
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM cv_sessions
      WHERE linked_to_profile = true
    ) sub
    WHERE rn = 1
  );
