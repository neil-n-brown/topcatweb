/*
  # Enforce Cat Profile Requirement for Swipe Feature

  1. Update Functions
    - Modify get_randomized_cats_for_user to ONLY return cats with valid cat profiles
    - Add strict filtering to ensure no orphaned photos appear in swipe

  2. Data Integrity
    - Ensure all cats in swipe have cat_profile_id
    - Filter out any cats without proper user relationships
    - Validate cat profile existence before returning cats

  3. Performance
    - Add indexes for cat profile queries
    - Optimize filtering for better performance
*/

-- Drop and recreate the function with strict cat profile enforcement
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

  -- STRICT REQUIREMENT: Only count cats that have valid cat profiles AND valid users
  SELECT COUNT(*) INTO v_available_count
  FROM cats c
  INNER JOIN users u ON c.user_id = u.id  -- MUST have valid user
  INNER JOIN cat_profiles cp ON c.cat_profile_id = cp.id  -- MUST have valid cat profile
  WHERE c.user_id != p_user_id
    AND c.cat_profile_id IS NOT NULL  -- MUST have cat profile ID
    AND u.username IS NOT NULL  -- MUST have username
    AND u.username !~ '^user_\d+$';  -- MUST NOT be dummy username pattern

  -- If we don't have enough valid cats with profiles, return empty result
  IF v_available_count = 0 THEN
    RAISE NOTICE 'No cats with valid profiles found for user %', p_user_id;
    RETURN;
  END IF;

  -- Smart prioritization: ONLY return cats with valid cat profiles
  RETURN QUERY
  WITH valid_cats_only AS (
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
      COALESCE(pe.exposure_score, 0) as exposure_score
    FROM cats c
    INNER JOIN users u ON c.user_id = u.id  -- MUST have valid user
    INNER JOIN cat_profiles cp ON c.cat_profile_id = cp.id  -- MUST have valid cat profile
    LEFT JOIN photo_exposure pe ON c.id = pe.cat_id
    WHERE c.user_id != p_user_id
      AND c.cat_profile_id IS NOT NULL  -- MUST have cat profile ID
      AND u.username IS NOT NULL  -- MUST have username
      AND u.username !~ '^user_\d+$'  -- MUST NOT be dummy username pattern
  ),
  
  prioritized_cats AS (
    SELECT 
      vc.*,
      CASE 
        -- Priority 1: Never seen by this user
        WHEN NOT EXISTS (
          SELECT 1 FROM user_interactions ui 
          WHERE ui.user_id = p_user_id AND ui.cat_id = vc.id
        ) THEN 1
        
        -- Priority 2: Seen but no interaction (only views)
        WHEN NOT EXISTS (
          SELECT 1 FROM user_interactions ui 
          WHERE ui.user_id = p_user_id AND ui.cat_id = vc.id 
          AND ui.interaction_type != 'view'
        ) THEN 2
        
        -- Priority 3: Previously interacted, older interactions first
        ELSE 3
      END as priority_level,
      
      -- For priority 3, get the most recent interaction date
      COALESCE((
        SELECT MAX(ui.created_at) 
        FROM user_interactions ui 
        WHERE ui.user_id = p_user_id AND ui.cat_id = vc.id
      ), vc.upload_date) as last_interaction_date,
      
      -- Random factor for shuffling within priority groups
      random() as random_factor
    FROM valid_cats_only vc
  ),
  
  -- Select photos with smart prioritization
  selected_cats AS (
    SELECT *,
      ROW_NUMBER() OVER (
        ORDER BY 
          priority_level ASC,  -- Lower priority number = higher priority
          CASE 
            WHEN priority_level = 1 THEN exposure_score * 0.7 + random_factor * 0.3  -- Favor less exposed + randomness
            WHEN priority_level = 2 THEN exposure_score * 0.5 + random_factor * 0.5  -- Balanced
            WHEN priority_level = 3 THEN EXTRACT(EPOCH FROM last_interaction_date) + random_factor * 1000  -- Oldest interactions first with randomness
            ELSE random_factor  -- Fallback: pure random
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_randomized_cats_for_user(uuid, uuid, integer, boolean) TO authenticated;

-- Update the photo priority stats function to only count cats with profiles
CREATE OR REPLACE FUNCTION get_photo_priority_stats(p_user_id uuid)
RETURNS TABLE (
  priority_level integer,
  photo_count bigint,
  description text
) AS $$
BEGIN
  RETURN QUERY
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
    END as priority_level,
    COUNT(*) as photo_count,
    CASE 
      WHEN NOT EXISTS (
        SELECT 1 FROM user_interactions ui 
        WHERE ui.user_id = p_user_id AND ui.cat_id = c.id
      ) THEN 'Never seen (with profiles)'
      WHEN NOT EXISTS (
        SELECT 1 FROM user_interactions ui 
        WHERE ui.user_id = p_user_id AND ui.cat_id = c.id 
        AND ui.interaction_type != 'view'
      ) THEN 'Seen but no interaction (with profiles)'
      ELSE 'Previously interacted (with profiles)'
    END as description
  FROM cats c
  INNER JOIN users u ON c.user_id = u.id  -- MUST have valid user
  INNER JOIN cat_profiles cp ON c.cat_profile_id = cp.id  -- MUST have valid cat profile
  WHERE c.user_id != p_user_id
    AND c.cat_profile_id IS NOT NULL  -- MUST have cat profile ID
    AND u.username IS NOT NULL  -- MUST have username
    AND u.username !~ '^user_\d+$'  -- MUST NOT be dummy username pattern
  GROUP BY 
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
    END
  ORDER BY priority_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_photo_priority_stats(uuid) TO authenticated;

-- Add a function to clean up cats without valid profiles (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_cats_without_profiles()
RETURNS TABLE (
  cats_removed integer,
  interactions_removed integer,
  reactions_removed integer
) AS $$
DECLARE
  v_cats_removed integer := 0;
  v_interactions_removed integer := 0;
  v_reactions_removed integer := 0;
  orphaned_cat_ids uuid[];
BEGIN
  -- Find cats without valid cat profiles or users
  SELECT ARRAY_AGG(c.id) INTO orphaned_cat_ids
  FROM cats c
  LEFT JOIN cat_profiles cp ON c.cat_profile_id = cp.id
  LEFT JOIN users u ON c.user_id = u.id
  WHERE c.cat_profile_id IS NULL 
     OR cp.id IS NULL 
     OR u.id IS NULL
     OR u.username ~ '^user_\d+$';  -- Include dummy username pattern
  
  IF orphaned_cat_ids IS NOT NULL AND array_length(orphaned_cat_ids, 1) > 0 THEN
    -- Remove related interactions
    DELETE FROM user_interactions WHERE cat_id = ANY(orphaned_cat_ids);
    GET DIAGNOSTICS v_interactions_removed = ROW_COUNT;
    
    -- Remove related reactions
    DELETE FROM reactions WHERE cat_id = ANY(orphaned_cat_ids);
    GET DIAGNOSTICS v_reactions_removed = ROW_COUNT;
    
    -- Remove related photo exposure
    DELETE FROM photo_exposure WHERE cat_id = ANY(orphaned_cat_ids);
    
    -- Remove related reports
    DELETE FROM reports WHERE cat_id = ANY(orphaned_cat_ids);
    
    -- Remove the cats themselves
    DELETE FROM cats WHERE id = ANY(orphaned_cat_ids);
    GET DIAGNOSTICS v_cats_removed = ROW_COUNT;
  END IF;
  
  RETURN QUERY SELECT v_cats_removed, v_interactions_removed, v_reactions_removed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for maintenance)
GRANT EXECUTE ON FUNCTION cleanup_cats_without_profiles() TO authenticated;

-- Add indexes to improve performance for cat profile queries
CREATE INDEX IF NOT EXISTS idx_cats_cat_profile_id_not_null ON cats(cat_profile_id) WHERE cat_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_username_not_dummy ON users(username) WHERE username !~ '^user_\d+$';

-- Add a comment to document the strict requirement
COMMENT ON COLUMN cats.cat_profile_id IS 'REQUIRED: All cat photos must be linked to a valid cat profile. NULL values should be cleaned up.';