/*
  # Add demo data seeding support

  1. Add indexes for better performance with demo data
  2. Ensure all necessary permissions are in place
  3. Add helper functions for demo data management

  This migration prepares the database for the seeding script.
*/

-- Add additional indexes for better performance with more data
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_cats_name ON cats(name);
CREATE INDEX IF NOT EXISTS idx_reactions_emoji_type ON reactions(emoji_type);

-- Ensure storage bucket exists and has proper policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('cat-photos', 'cat-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Function to get user stats (useful for demo data verification)
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid uuid)
RETURNS TABLE (
  cat_profiles_count bigint,
  photos_count bigint,
  reactions_given bigint,
  reactions_received bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM cat_profiles WHERE user_id = user_uuid),
    (SELECT COUNT(*) FROM cats WHERE user_id = user_uuid),
    (SELECT COUNT(*) FROM reactions WHERE user_id = user_uuid),
    (SELECT COUNT(*) FROM reactions r 
     JOIN cats c ON r.cat_id = c.id 
     WHERE c.user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_stats(uuid) TO authenticated;

-- Add a comment to track demo data
COMMENT ON TABLE users IS 'Users table - demo accounts have is_demo_account metadata';
COMMENT ON TABLE cat_profiles IS 'Cat profiles - linked to demo users via user_id';
COMMENT ON TABLE cats IS 'Cat photos - linked to cat profiles and demo users';
COMMENT ON TABLE reactions IS 'User reactions - includes demo user interactions';