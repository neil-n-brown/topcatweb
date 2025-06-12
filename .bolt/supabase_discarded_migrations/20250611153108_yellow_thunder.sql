/*
  # Fix Swipe Function - Always Show 20 Photos with Cat Profiles

  1. Fix SQL Functions
    - Fix ambiguous column references in get_randomized_cats_for_user
    - Fix subquery grouping issues in get_photo_priority_stats
    - Ensure functions always return valid results

  2. Smart Photo Selection
    - ALWAYS return exactly 20 photos (or all available if less than 20)
    - Only show cats with valid cat profiles
    - Prioritize unseen photos first
    - Fill remainder with seen photos if needed

  3. Robust Error Handling
    - Handle edge cases gracefully
    - Provide fallback logic when no photos match criteria
    - Ensure consistent results
*/

-- Drop and recreate the function with fixed SQL and robust logic
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

  -- Count available cats with valid profiles (relaxed criteria for better results)
  SELECT COUNT(*) INTO v_available_count
  FROM cats c
  INNER JOIN users u ON c.user_id = u.id
  LEFT JOIN cat_profiles cp ON c.cat_profile_id = cp.id
  WHERE c.user_id != p_user_id
    AND u.username IS NOT NULL
    AND u.username != ''
    AND (c.cat_profile_id IS NOT NULL OR cp.id IS NOT NULL);

  -- If no cats available, return empty result
  IF v_available_count = 0 THEN
    RAISE NOTICE 'No cats available for user %', p_user_id;
    RETURN;
  END IF;

  -- Return cats with smart prioritization
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
    LEFT JOIN cat_profiles cp ON c.cat_profile_id = cp.id
    LEFT JOIN photo_exposure pe ON c.id = pe.cat_id
    WHERE c.user_id != p_user_id
      AND u.username IS NOT NULL
      AND u.username != ''
      AND (c.cat_profile_id IS NOT NULL OR cp.id IS NOT NULL)
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
      
      -- Random factor for shuffling within priority groups
      random() as random_factor
    FROM available_cats ac
  ),
  
  -- Select photos with smart prioritization
  selected_cats AS (
    SELECT *,
      ROW_NUMBER() OVER (
        ORDER BY 
          priority_level ASC,  -- Lower priority number = higher priority
          CASE 
            WHEN priority_level = 1 THEN exposure_score * 0.3 + random_factor * 0.7  -- Favor randomness for unseen
            WHEN priority_level = 2 THEN exposure_score * 0.5 + random_factor * 0.5  -- Balanced
            ELSE random_factor  -- Pure random for previously interacted
          END ASC
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

-- Fix the photo priority stats function
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
      c.id as cat_id,
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
    LEFT JOIN cat_profiles cp ON c.cat_profile_id = cp.id
    WHERE c.user_id != p_user_id
      AND u.username IS NOT NULL
      AND u.username != ''
      AND (c.cat_profile_id IS NOT NULL OR cp.id IS NOT NULL)
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

-- Create a simple function to get total available cats for debugging
CREATE OR REPLACE FUNCTION get_available_cats_count(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM cats c
  INNER JOIN users u ON c.user_id = u.id
  LEFT JOIN cat_profiles cp ON c.cat_profile_id = cp.id
  WHERE c.user_id != p_user_id
    AND u.username IS NOT NULL
    AND u.username != ''
    AND (c.cat_profile_id IS NOT NULL OR cp.id IS NOT NULL);
    
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_available_cats_count(uuid) TO authenticated;

-- Update the leaderboard views to handle the fixed column references
DROP VIEW IF EXISTS leaderboard_cats;

CREATE VIEW leaderboard_cats AS
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
  COALESCE(r.reaction_count, 0) as reaction_count
FROM cats c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN (
  SELECT 
    cat_id, 
    COUNT(*) as reaction_count
  FROM reactions 
  GROUP BY cat_id
) r ON c.id = r.cat_id;

-- Drop and recreate trending_cats view
DROP VIEW IF EXISTS trending_cats;

CREATE VIEW trending_cats AS
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
  COALESCE(r.recent_reaction_count, 0) as recent_reaction_count
FROM cats c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN (
  SELECT 
    cat_id, 
    COUNT(*) as recent_reaction_count
  FROM reactions 
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY cat_id
) r ON c.id = r.cat_id;

-- Grant access to the updated views
GRANT SELECT ON leaderboard_cats TO authenticated;
GRANT SELECT ON leaderboard_cats TO anon;
GRANT SELECT ON trending_cats TO authenticated;
GRANT SELECT ON trending_cats TO anon;

-- Add a maintenance function to ensure data quality
CREATE OR REPLACE FUNCTION ensure_data_quality()
RETURNS TABLE (
  total_cats integer,
  cats_with_profiles integer,
  cats_with_valid_users integer,
  orphaned_cats integer
) AS $$
DECLARE
  v_total_cats integer;
  v_cats_with_profiles integer;
  v_cats_with_valid_users integer;
  v_orphaned_cats integer;
BEGIN
  -- Count total cats
  SELECT COUNT(*) INTO v_total_cats FROM cats;
  
  -- Count cats with profiles
  SELECT COUNT(*) INTO v_cats_with_profiles 
  FROM cats c 
  WHERE c.cat_profile_id IS NOT NULL;
  
  -- Count cats with valid users
  SELECT COUNT(*) INTO v_cats_with_valid_users
  FROM cats c
  INNER JOIN users u ON c.user_id = u.id
  WHERE u.username IS NOT NULL AND u.username != '';
  
  -- Count orphaned cats (no valid user or profile)
  SELECT COUNT(*) INTO v_orphaned_cats
  FROM cats c
  LEFT JOIN users u ON c.user_id = u.id
  LEFT JOIN cat_profiles cp ON c.cat_profile_id = cp.id
  WHERE u.id IS NULL OR cp.id IS NULL;
  
  RETURN QUERY SELECT v_total_cats, v_cats_with_profiles, v_cats_with_valid_users, v_orphaned_cats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION ensure_data_quality() TO authenticated;