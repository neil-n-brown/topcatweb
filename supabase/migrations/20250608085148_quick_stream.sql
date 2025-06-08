/*
  # Create cats table

  1. New Tables
    - `cats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text) - the cat's name
      - `description` (text, optional) - description of the cat
      - `image_url` (text) - URL to the cat's photo
      - `upload_date` (timestamp) - when the cat was uploaded

  2. Security
    - Enable RLS on `cats` table
    - Add policy for authenticated users to read all cats
    - Add policy for users to insert their own cats
    - Add policy for users to update/delete their own cats
*/

CREATE TABLE IF NOT EXISTS cats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  image_url text NOT NULL,
  upload_date timestamptz DEFAULT now()
);

ALTER TABLE cats ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all cats (needed for swiping)
CREATE POLICY "Authenticated users can read all cats"
  ON cats
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own cats
CREATE POLICY "Users can insert own cats"
  ON cats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own cats
CREATE POLICY "Users can update own cats"
  ON cats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to delete their own cats
CREATE POLICY "Users can delete own cats"
  ON cats
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS cats_user_id_idx ON cats(user_id);
CREATE INDEX IF NOT EXISTS cats_upload_date_idx ON cats(upload_date DESC);