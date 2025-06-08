/*
  # Create reactions table

  1. New Tables
    - `reactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `cat_id` (uuid, foreign key to cats)
      - `emoji_type` (text) - the emoji used for reaction
      - `created_at` (timestamp) - when the reaction was made

  2. Security
    - Enable RLS on `reactions` table
    - Add policy for authenticated users to read all reactions
    - Add policy for users to insert their own reactions
    - Add policy for users to delete their own reactions
    - Add unique constraint to prevent duplicate reactions from same user to same cat
*/

CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  cat_id uuid REFERENCES cats(id) ON DELETE CASCADE NOT NULL,
  emoji_type text NOT NULL DEFAULT '❤️',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, cat_id)
);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all reactions (needed for leaderboards and counts)
CREATE POLICY "Authenticated users can read all reactions"
  ON reactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own reactions
CREATE POLICY "Users can insert own reactions"
  ON reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own reactions (change emoji)
CREATE POLICY "Users can update own reactions"
  ON reactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to delete their own reactions
CREATE POLICY "Users can delete own reactions"
  ON reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS reactions_user_id_idx ON reactions(user_id);
CREATE INDEX IF NOT EXISTS reactions_cat_id_idx ON reactions(cat_id);
CREATE INDEX IF NOT EXISTS reactions_created_at_idx ON reactions(created_at DESC);