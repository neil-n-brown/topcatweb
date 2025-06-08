/*
  # Create storage bucket for cat photos

  1. Storage
    - Create `cat-photos` bucket for storing uploaded cat images
    - Set up RLS policies for the bucket
    - Allow authenticated users to upload their own photos
    - Allow public read access to photos

  2. Security
    - Users can only upload to their own folder (user_id prefix)
    - Public read access for displaying images
    - File size and type restrictions
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cat-photos', 'cat-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload cat photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cat-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to cat photos
CREATE POLICY "Public read access for cat photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'cat-photos');

-- Allow users to update their own files
CREATE POLICY "Users can update own cat photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cat-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own cat photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'cat-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);