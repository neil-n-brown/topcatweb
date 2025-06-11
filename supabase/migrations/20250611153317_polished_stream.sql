/*
  # Fix SQL Syntax Error in get_randomized_cats_for_user Function

  1. Fix the ORDER BY clause syntax error
  2. Simplify the prioritization logic to avoid complex CASE statements
  3. Ensure robust cat selection with proper fallbacks
*/

-- Drop and recreate the function with fixed SQL syntax
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
    WHERE id = v_session_id AND user_id = p_user_id;
  END IF;

  -- Ensure all cats have exposure records
  INSERT INTO photo_exposure (cat_id, total_views, total_interactions, last_shown)
  SELECT c.id, 0, 0, c.upload_date
  FROM cats c
  LEFT JOIN photo_exposure pe ON c.id = pe.cat_id
  WHERE pe.cat_id IS NULL;

  -- Update exposure scores
  PERFORM calculate_exposure_scores();

  -- Count available cats (prefer cats with profiles, but allow all valid cats)
  SELECT COUNT(*) INTO v_available_count
  FROM cats c
  INNER JOIN users u ON c.user_id = u.id
  WHERE c.user_id != p_user_id
    AND u.username IS NOT NULL
    AND u.username != '';

  -- If no cats available, return empty result
  IF v_available_count = 0 THEN
    RAISE NOTICE 'No cats available for user %', p_user_id;
    RETURN;
  END IF;

  -- Return cats with smart prioritization (fixed syntax)
  RETURN QUERY
  WITH available_cats AS (
    SELECT 
      c.id as cat_id,
      c.user_id as cat_user_id,
      c.name as cat_name,
      c.description,
      c.caption,
      c.image_url,
      c.upload_date,
      c.cat_profile_id,
      u.username,
      u.email,
      COALESCE(pe.exposure_score, 0) as exposure_score
    FROM cats c
    INNER JOIN users u ON c.user_id = u.id
    LEFT JOIN photo_exposure pe ON c.id = pe.cat_id
    WHERE c.user_id != p_user_id
      AND u.username IS NOT NULL
      AND u.username != ''
  ),
  
  prioritized_cats AS (
    SELECT 
      ac.*,
      CASE 
        -- Priority 1: Never seen by this user
        WHEN NOT EXISTS (
          SELECT 1 FROM user_interactions ui 
          WHERE ui.user_id = p_user_id AND ui.cat_id = ac.cat_id
        ) THEN 1
        
        -- Priority 2: Seen but no interaction (only views)
        WHEN NOT EXISTS (
          SELECT 1 FROM user_interactions ui 
          WHERE ui.user_id = p_user_id AND ui.cat_id = ac.cat_id 
          AND ui.interaction_type != 'view'
        ) THEN 2
        
        -- Priority 3: Previously interacted
        ELSE 3
      END as priority_level,
      
      -- Get last interaction timestamp for sorting
      COALESCE((
        SELECT MAX(ui.created_at) 
        FROM user_interactions ui 
        WHERE ui.user_id = p_user_id AND ui.cat_id = ac.cat_id
      ), ac.upload_date) as last_interaction,
      
      -- Random factor for shuffling within priority groups
      random() as random_factor
    FROM available_cats ac
  ),
  
  -- Select photos with smart prioritization (fixed ORDER BY)
  selected_cats AS (
    SELECT *,
      ROW_NUMBER() OVER (
        ORDER BY 
          priority_level ASC,  -- Lower priority number = higher priority
          -- Simple sorting within each priority level
          exposure_score ASC,  -- Less exposed photos first
          last_interaction ASC,  -- Older interactions first
          random_factor ASC  -- Random tiebreaker
      ) as selection_rank
    FROM prioritized_cats
  )
  
  SELECT 
    sc.cat_id as id,
    sc.cat_user_id as user_id,
    sc.cat_name as name,
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_randomized_cats_for_user(uuid, uuid, integer, boolean) TO authenticated;

-- Also fix the photo priority stats function to be simpler
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
      END as priority_level
    FROM cats c
    INNER JOIN users u ON c.user_id = u.id
    WHERE c.user_id != p_user_id
      AND u.username IS NOT NULL
      AND u.username != ''
  )
  SELECT 
    cp.priority_level,
    COUNT(*) as photo_count,
    CASE 
      WHEN cp.priority_level = 1 THEN 'Never seen'
      WHEN cp.priority_level = 2 THEN 'Seen but no interaction'
      ELSE 'Previously interacted'
    END as description
  FROM cat_priorities cp
  GROUP BY cp.priority_level
  ORDER BY cp.priority_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_photo_priority_stats(uuid) TO authenticated;

-- Add a simple debug function to check what cats are available
CREATE OR REPLACE FUNCTION debug_available_cats(p_user_id uuid)
RETURNS TABLE (
  total_cats bigint,
  cats_with_users bigint,
  cats_with_profiles bigint,
  cats_excluding_own bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM cats) as total_cats,
    (SELECT COUNT(*) FROM cats c INNER JOIN users u ON c.user_id = u.id WHERE u.username IS NOT NULL) as cats_with_users,
    (SELECT COUNT(*) FROM cats c WHERE c.cat_profile_id IS NOT NULL) as cats_with_profiles,
    (SELECT COUNT(*) FROM cats c INNER JOIN users u ON c.user_id = u.id WHERE c.user_id != p_user_id AND u.username IS NOT NULL) as cats_excluding_own;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION debug_available_cats(uuid) TO authenticated;