-- Fix SQL errors for swipe feature (ambiguous id, grouping)
-- Drop and recreate get_randomized_cats_for_user
DROP FUNCTION IF EXISTS get_randomized_cats_for_user(uuid, uuid, integer, boolean);

CREATE OR REPLACE FUNCTION get_randomized_cats_for_user(
  p_user_id uuid,
  p_session_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_use_prioritization boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  description text,
  caption text,
  image_url text,
  upload_date timestamptz,
  cat_profile_id uuid,
  username text,
  email text,
  exposure_score decimal,
  priority_level integer
) AS $$
DECLARE
  v_session_id uuid;
  v_available_count integer;
BEGIN
  -- Create or get session ID
  IF p_session_id IS NULL THEN
    INSERT INTO swipe_sessions (user_id, session_type)
    VALUES (p_user_id, 'swipe')
    RETURNING swipe_sessions.id INTO v_session_id;
  ELSE
    v_session_id := p_session_id;
    -- Update session activity
    UPDATE swipe_sessions 
    SET last_activity = now(), is_active = true
    WHERE swipe_sessions.id = v_session_id AND swipe_sessions.user_id = p_user_id;
  END IF;

  -- Ensure all cats have exposure records
  INSERT INTO photo_exposure (cat_id, total_views, total_interactions, last_shown)
  SELECT c.id, 0, 0, c.upload_date
  FROM cats c
  LEFT JOIN photo_exposure pe ON c.id = pe.cat_id
  WHERE pe.cat_id IS NULL;

  -- Update exposure scores
  PERFORM calculate_exposure_scores();

  -- Check how many cats are available (excluding user's own)
  SELECT COUNT(*) INTO v_available_count
  FROM cats c
  WHERE c.user_id != p_user_id;

  -- If we don't have enough cats total, return what we have
  IF v_available_count < p_limit THEN
    RETURN QUERY
    SELECT 
      c.id,
      c.user_id,
      c.name,
      c.description,
      c.caption,
      c.image_url,
      c.upload_date,
      c.cat_profile_id,
      u.username,
      u.email,
      COALESCE(pe.exposure_score, 0) as exposure_score,
      1 as priority_level
    FROM cats c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN photo_exposure pe ON c.id = pe.cat_id
    WHERE c.user_id != p_user_id
    ORDER BY random()
    LIMIT p_limit;
    RETURN;
  END IF;

  -- Smart prioritization: always return exactly p_limit photos
  RETURN QUERY
  WITH prioritized_cats AS (
    SELECT 
      c.id,
      c.user_id,
      c.name,
      c.description,
      c.caption,
      c.image_url,
      c.upload_date,
      c.cat_profile_id,
      u.username,
      u.email,
      COALESCE(pe.exposure_score, 0) as exposure_score,
      CASE 
        -- Priority 1: Never seen by this user
        WHEN NOT EXISTS (
          SELECT 1 FROM user_interactions ui 
          WHERE ui.user_id = p_user_id AND ui.cat_id = c.id
        ) THEN 1
        -- Priority 2: Seen but no interaction (only views)
        WHEN NOT EXISTS (
          SELECT 1 FROM user_interactions ui 
          WHERE ui.user_id = p_user_id AND ui.cat_id = c.id 
          AND ui.interaction_type != 'view'
        ) THEN 2
        -- Priority 3: Previously interacted, older interactions first
        ELSE 3
      END as priority_level,
      COALESCE((
        SELECT MAX(ui.created_at) 
        FROM user_interactions ui 
        WHERE ui.user_id = p_user_id AND ui.cat_id = c.id
      ), c.upload_date) as last_interaction_date,
      random() as random_factor
    FROM cats c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN photo_exposure pe ON c.id = pe.cat_id
    WHERE c.user_id != p_user_id
  ),
  selected_cats AS (
    SELECT *,
      ROW_NUMBER() OVER (
        ORDER BY 
          priority_level ASC,
          CASE 
            WHEN priority_level = 1 THEN exposure_score * 0.7 + random_factor * 0.3
            WHEN priority_level = 2 THEN exposure_score * 0.5 + random_factor * 0.5
            WHEN priority_level = 3 THEN EXTRACT(EPOCH FROM last_interaction_date) + random_factor * 1000
            ELSE random_factor
          END ASC
      ) as selection_rank
    FROM prioritized_cats
  )
  SELECT 
    sc.id,
    sc.user_id,
    sc.name,
    sc.description,
    sc.caption,
    sc.image_url,
    sc.upload_date,
    sc.cat_profile_id,
    sc.username,
    sc.email,
    sc.exposure_score,
    sc.priority_level
  FROM selected_cats sc
  WHERE sc.selection_rank <= p_limit
  ORDER BY sc.selection_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate get_photo_priority_stats with correct grouping
DROP FUNCTION IF EXISTS get_photo_priority_stats(uuid);

CREATE OR REPLACE FUNCTION get_photo_priority_stats(p_user_id uuid)
RETURNS TABLE (
  priority_level integer,
  photo_count bigint,
  description text
) AS $$
BEGIN
  RETURN QUERY
  WITH cat_priorities AS (
    SELECT 
      c.id,
      CASE 
        WHEN NOT EXISTS (
          SELECT 1 FROM user_interactions ui 
          WHERE ui.user_id = p_user_id AND ui.cat_id = c.id
        ) THEN 1
        WHEN NOT EXISTS (
          SELECT 1 FROM user_interactions ui 
          WHERE ui.user_id = p_user_id AND ui.cat_id = c.id 
          AND ui.interaction_type != 'view'
        ) THEN 2
        ELSE 3
      END as cat_priority_level
    FROM cats c
    WHERE c.user_id != p_user_id
  )
  SELECT 
    cp.cat_priority_level as priority_level,
    COUNT(*) as photo_count,
    CASE 
      WHEN cp.cat_priority_level = 1 THEN 'Never seen'
      WHEN cp.cat_priority_level = 2 THEN 'Seen but no interaction'
      ELSE 'Previously interacted'
    END as description
  FROM cat_priorities cp
  GROUP BY cp.cat_priority_level
  ORDER BY cp.cat_priority_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_randomized_cats_for_user(uuid, uuid, integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION get_photo_priority_stats(uuid) TO authenticated; 