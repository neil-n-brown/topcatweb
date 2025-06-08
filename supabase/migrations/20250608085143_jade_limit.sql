/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - matches Supabase auth.users id
      - `email` (text, unique) - user's email address
      - `username` (text, unique) - display name for the user
      - `profile_pic` (text, optional) - URL to profile picture
      - `created_at` (timestamp) - when the user joined

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read all user data (for displaying usernames)
    - Add policy for users to update their own profile
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  profile_pic text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to read all user profiles (needed for displaying usernames on cats)
CREATE POLICY "Users can read all user profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to insert their own profile (for registration)
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);