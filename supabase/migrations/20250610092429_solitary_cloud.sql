/*
  # Fix Cat Profile Access for Public Viewing

  1. Security Policy Updates
    - Allow anonymous (public) users to read cat profiles
    - This enables leaderboard links to work for all users
    - Maintain existing policies for create/update/delete (authenticated only)

  2. View Access
    - Ensure cat_profiles_with_stats view is accessible to anonymous users
    - This is needed for the leaderboard and profile detail pages
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Public can read cat profiles" ON cat_profiles;

-- Create new policy that allows everyone (including anonymous users) to read cat profiles
CREATE POLICY "Everyone can read cat profiles"
  ON cat_profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Ensure the view is accessible to anonymous users
GRANT SELECT ON cat_profiles_with_stats TO anon;
GRANT SELECT ON cat_profiles_with_stats TO authenticated;

-- Also ensure the cat_profiles table itself is accessible to anonymous users
GRANT SELECT ON cat_profiles TO anon;
GRANT SELECT ON cat_profiles TO authenticated;

-- Verify that cats table is also accessible to anonymous users (needed for profile photos)
GRANT SELECT ON cats TO anon;
GRANT SELECT ON cats TO authenticated;

-- Verify that users table is accessible to anonymous users (needed for owner info)
GRANT SELECT ON users TO anon;
GRANT SELECT ON users TO authenticated;

-- Verify that reactions table is accessible to anonymous users (needed for reaction counts)
GRANT SELECT ON reactions TO anon;
GRANT SELECT ON reactions TO authenticated;