/*
  # Add Cat Profiles Feature (Backward Compatible)

  1. New Tables
    - `cat_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text) - cat's name
      - `profile_picture` (text, optional) - URL to profile picture
      - `date_of_birth` (date, optional)
      - `age` (text, optional) - flexible age field
      - `breed` (text, optional)
      - `sex` (text, optional)
      - `personality` (text, optional)
      - `favourite_person` (text, optional)
      - `favourite_treat` (text, optional)
      - `favourite_toy` (text, optional)
      - `favourite_word` (text, optional)
      - `play_time_preference` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modify existing cats table
    - Add optional `cat_profile_id` field (nullable to maintain backward compatibility)

  3. Security
    - Enable RLS on `cat_profiles` table
    - Users can create/edit their own cat profiles
    - Public can view cat profiles
    - Maintain all existing policies

  4. Indexes for performance
    - Index on cat_profiles.user_id
    - Index on cats.cat_profile_id
*/

-- Create cat_profiles table
CREATE TABLE IF NOT EXISTS cat_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  profile_picture text,
  date_of_birth date,
  age text,
  breed text,
  sex text,
  personality text,
  favourite_person text,
  favourite_treat text,
  favourite_toy text,
  favourite_word text,
  play_time_preference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add optional cat_profile_id to existing cats table (nullable for backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cats' AND column_name = 'cat_profile_id'
  ) THEN
    ALTER TABLE cats ADD COLUMN cat_profile_id uuid REFERENCES cat_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on cat_profiles
ALTER TABLE cat_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cat_profiles
-- Allow public to read cat profiles (for viewing)
CREATE POLICY "Public can read cat profiles"
  ON cat_profiles
  FOR SELECT
  TO public
  USING (true);

-- Allow users to insert their own cat profiles
CREATE POLICY "Users can insert own cat profiles"
  ON cat_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own cat profiles
CREATE POLICY "Users can update own cat profiles"
  ON cat_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to delete their own cat profiles
CREATE POLICY "Users can delete own cat profiles"
  ON cat_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cat_profiles_user_id ON cat_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_cats_cat_profile_id ON cats(cat_profile_id);

-- Create updated_at trigger for cat_profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cat_profiles_updated_at
  BEFORE UPDATE ON cat_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for cat profiles with photo counts
CREATE OR REPLACE VIEW cat_profiles_with_stats AS
SELECT 
  cp.*,
  u.username,
  COALESCE(photo_stats.photo_count, 0) as photo_count,
  COALESCE(photo_stats.total_reactions, 0) as total_reactions
FROM cat_profiles cp
LEFT JOIN users u ON cp.user_id = u.id
LEFT JOIN (
  SELECT 
    cat_profile_id,
    COUNT(*) as photo_count,
    COALESCE(SUM(reaction_counts.reaction_count), 0) as total_reactions
  FROM cats c
  LEFT JOIN (
    SELECT cat_id, COUNT(*) as reaction_count
    FROM reactions
    GROUP BY cat_id
  ) reaction_counts ON c.id = reaction_counts.cat_id
  WHERE c.cat_profile_id IS NOT NULL
  GROUP BY cat_profile_id
) photo_stats ON cp.id = photo_stats.cat_profile_id;

-- Grant access to the view
GRANT SELECT ON cat_profiles_with_stats TO authenticated;
GRANT SELECT ON cat_profiles_with_stats TO anon;