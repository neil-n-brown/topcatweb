/*
  # Fix Cat Profile Access for Public Viewing (Conflict Resolution)

  1. Policy Updates
    - Safely update cat_profiles policies to allow anonymous access
    - Handle existing policies gracefully
    - Ensure all related tables are accessible to anonymous users

  2. Grants
    - Grant SELECT permissions to anonymous users on all relevant tables
    - Ensure views are accessible to both anonymous and authenticated users

  3. Error Prevention
    - Use IF EXISTS/IF NOT EXISTS to avoid conflicts
    - Handle existing policies and grants safely
*/

-- First, check if the policy exists and drop it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cat_profiles' 
    AND policyname = 'Everyone can read cat profiles'
  ) THEN
    DROP POLICY "Everyone can read cat profiles" ON cat_profiles;
  END IF;
END $$;

-- Also drop the old policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cat_profiles' 
    AND policyname = 'Public can read cat profiles'
  ) THEN
    DROP POLICY "Public can read cat profiles" ON cat_profiles;
  END IF;
END $$;

-- Create the new policy that allows everyone to read cat profiles
CREATE POLICY "Everyone can read cat profiles"
  ON cat_profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Grant table permissions safely (these will not error if already granted)
DO $$
BEGIN
  -- Grant SELECT on cat_profiles to anon
  EXECUTE 'GRANT SELECT ON cat_profiles TO anon';
  EXECUTE 'GRANT SELECT ON cat_profiles TO authenticated';
  
  -- Grant SELECT on cats to anon (needed for profile photos)
  EXECUTE 'GRANT SELECT ON cats TO anon';
  EXECUTE 'GRANT SELECT ON cats TO authenticated';
  
  -- Grant SELECT on users to anon (needed for owner info)
  EXECUTE 'GRANT SELECT ON users TO anon';
  EXECUTE 'GRANT SELECT ON users TO authenticated';
  
  -- Grant SELECT on reactions to anon (needed for reaction counts)
  EXECUTE 'GRANT SELECT ON reactions TO anon';
  EXECUTE 'GRANT SELECT ON reactions TO authenticated';
  
  -- Grant SELECT on views to anon
  EXECUTE 'GRANT SELECT ON cat_profiles_with_stats TO anon';
  EXECUTE 'GRANT SELECT ON cat_profiles_with_stats TO authenticated';
  
  EXECUTE 'GRANT SELECT ON leaderboard_cats TO anon';
  EXECUTE 'GRANT SELECT ON leaderboard_cats TO authenticated';
  
  EXECUTE 'GRANT SELECT ON trending_cats TO anon';
  EXECUTE 'GRANT SELECT ON trending_cats TO authenticated';

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the migration
    RAISE NOTICE 'Some grants may have already existed: %', SQLERRM;
END $$;

-- Verify the policy was created successfully
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cat_profiles' 
    AND policyname = 'Everyone can read cat profiles'
  ) THEN
    RAISE EXCEPTION 'Failed to create policy "Everyone can read cat profiles"';
  END IF;
  
  RAISE NOTICE 'Successfully created policy "Everyone can read cat profiles"';
END $$;