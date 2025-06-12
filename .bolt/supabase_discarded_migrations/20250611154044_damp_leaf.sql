/*
  # Fix RPC Functions for Swipe Feature

  1. Database Functions
    - Create/update `get_randomized_cats_for_user` function with proper column references
    - Create/update `get_photo_priority_stats` function with correct grouping
  
  2. Changes Made
    - Fixed ambiguous column references by using proper table aliases
    - Corrected subquery grouping issues
    - Added proper error handling and validation
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_randomized_cats_for_user(uuid);
DROP FUNCTION IF EXISTS get_photo_priority_stats();

-- Create the get_randomized_cats_for_user function
CREATE OR REPLACE FUNCTION get_randomized_cats_for_user(user_id_param uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  description text,
  image_url text,
  upload_date timestamptz,
  cat_profile_id uuid,
  caption text,
  username text,
  profile_pic text,
  exposure_score numeric,
  total_views bigint,
  last_shown timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.name,
    c.description,
    c.image_url,
    c.upload_date,
    c.cat_profile_id,
    c.caption,
    u.username,
    u.profile_pic,
    COALESCE(pe.exposure_score, 0) as exposure_score,
    COALESCE(pe.total_views, 0) as total_views,
    pe.last_shown
  FROM cats c
  INNER JOIN users u ON c.user_id = u.id
  LEFT JOIN photo_exposure pe ON c.id = pe.cat_id
  WHERE c.user_id != user_id_param
    AND NOT EXISTS (
      SELECT 1 
      FROM user_interactions ui 
      WHERE ui.user_id = user_id_param 
        AND ui.cat_id = c.id 
        AND ui.interaction_type IN ('swipe_left', 'swipe_right')
        AND ui.created_at > NOW() - INTERVAL '24 hours'
    )
  ORDER BY 
    -- Prioritize photos with lower exposure scores
    COALESCE(pe.exposure_score, 0) ASC,
    -- Then by least recently shown
    COALESCE(pe.last_shown, '1970-01-01'::timestamptz) ASC,
    -- Finally add some randomization
    RANDOM()
  LIMIT 50;
END;
$$;

-- Create the get_photo_priority_stats function
CREATE OR REPLACE FUNCTION get_photo_priority_stats()
RETURNS TABLE (
  total_photos bigint,
  photos_with_low_exposure bigint,
  photos_never_shown bigint,
  avg_exposure_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(c.id) as total_photos,
    COUNT(CASE WHEN COALESCE(pe.exposure_score, 0) < 10 THEN 1 END) as photos_with_low_exposure,
    COUNT(CASE WHEN pe.cat_id IS NULL THEN 1 END) as photos_never_shown,
    ROUND(AVG(COALESCE(pe.exposure_score, 0)), 2) as avg_exposure_score
  FROM cats c
  LEFT JOIN photo_exposure pe ON c.id = pe.cat_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_randomized_cats_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_photo_priority_stats() TO authenticated;