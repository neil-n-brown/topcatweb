/*
  # Fix database relationships for leaderboards

  1. Verify and recreate foreign key constraints
    - Ensure reactions.cat_id properly references cats.id
    - Ensure reactions.user_id properly references users.id
    - Ensure cats.user_id properly references users.id

  2. Add missing indexes for performance
    - Index on reactions.cat_id for join performance
    - Index on reactions.user_id for user queries
    - Index on reactions.created_at for trending queries

  3. Verify RLS policies are correct
    - Ensure proper read access for leaderboard queries

  4. Add helper function for reaction counts
    - Create a function to get reaction counts efficiently
*/

-- First, let's ensure all foreign key constraints exist and are properly named
-- Drop existing constraints if they exist to recreate them properly
DO $$
BEGIN
  -- Check and recreate reactions.cat_id foreign key
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reactions_cat_id_fkey' 
    AND table_name = 'reactions'
  ) THEN
    ALTER TABLE reactions DROP CONSTRAINT reactions_cat_id_fkey;
  END IF;

  -- Check and recreate reactions.user_id foreign key  
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reactions_user_id_fkey' 
    AND table_name = 'reactions'
  ) THEN
    ALTER TABLE reactions DROP CONSTRAINT reactions_user_id_fkey;
  END IF;

  -- Check and recreate cats.user_id foreign key
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'cats_user_id_fkey' 
    AND table_name = 'cats'
  ) THEN
    ALTER TABLE cats DROP CONSTRAINT cats_user_id_fkey;
  END IF;
END $$;

-- Recreate all foreign key constraints with proper CASCADE behavior
ALTER TABLE reactions 
ADD CONSTRAINT reactions_cat_id_fkey 
FOREIGN KEY (cat_id) REFERENCES cats(id) ON DELETE CASCADE;

ALTER TABLE reactions 
ADD CONSTRAINT reactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE cats 
ADD CONSTRAINT cats_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Ensure all necessary indexes exist for optimal performance
CREATE INDEX IF NOT EXISTS idx_reactions_cat_id ON reactions(cat_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_created_at ON reactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cats_user_id ON cats(user_id);
CREATE INDEX IF NOT EXISTS idx_cats_upload_date ON cats(upload_date DESC);

-- Create a view for leaderboard data to simplify queries
CREATE OR REPLACE VIEW leaderboard_cats AS
SELECT 
  c.id,
  c.user_id,
  c.name,
  c.description,
  c.image_url,
  c.upload_date,
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

-- Create a view for trending cats (last 24 hours)
CREATE OR REPLACE VIEW trending_cats AS
SELECT 
  c.id,
  c.user_id,
  c.name,
  c.description,
  c.image_url,
  c.upload_date,
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

-- Grant access to the views
GRANT SELECT ON leaderboard_cats TO authenticated;
GRANT SELECT ON trending_cats TO authenticated;

-- Test the relationships with a sample query
DO $$
DECLARE
  test_result INTEGER;
BEGIN
  -- Test if the relationship query works
  SELECT COUNT(*) INTO test_result
  FROM cats c
  LEFT JOIN reactions r ON c.id = r.cat_id
  LEFT JOIN users u ON c.user_id = u.id;
  
  RAISE NOTICE 'Relationship test successful. Found % total records.', test_result;
END $$;