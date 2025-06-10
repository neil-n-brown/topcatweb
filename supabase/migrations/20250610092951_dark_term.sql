/*
  # Fix leaderboard views to include cat_profile_id

  1. Update Views
    - Fix leaderboard_cats view to include cat_profile_id
    - Fix trending_cats view to include cat_profile_id
    - Ensure proper joins and data structure

  2. Security
    - Maintain existing RLS policies
    - Ensure views are accessible to all users
*/

-- Drop and recreate leaderboard_cats view with cat_profile_id
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

-- Drop and recreate trending_cats view with cat_profile_id
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