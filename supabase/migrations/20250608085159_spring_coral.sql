/*
  # Create reports table

  1. New Tables
    - `reports`
      - `id` (uuid, primary key)
      - `reporter_id` (uuid, foreign key to users)
      - `cat_id` (uuid, foreign key to cats)
      - `reason` (text) - reason for reporting
      - `status` (text) - pending, resolved, dismissed
      - `created_at` (timestamp) - when the report was made

  2. Security
    - Enable RLS on `reports` table
    - Add policy for users to insert their own reports
    - Add policy for users to read their own reports
    - Admin policies would be added later for moderation
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  cat_id uuid REFERENCES cats(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL DEFAULT 'inappropriate_content',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own reports
CREATE POLICY "Users can insert own reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Allow users to read their own reports
CREATE POLICY "Users can read own reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS reports_cat_id_idx ON reports(cat_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports(created_at DESC);