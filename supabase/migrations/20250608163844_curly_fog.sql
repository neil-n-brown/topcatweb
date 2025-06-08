/*
  # Add photo caption field to cats table

  1. Changes
    - Add `caption` field to cats table (optional, 125 character limit)
    - This replaces the description field for photo-specific captions
    - Maintain backward compatibility with existing description field

  2. Security
    - No RLS changes needed, existing policies cover the new field
*/

-- Add caption field to cats table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cats' AND column_name = 'caption'
  ) THEN
    ALTER TABLE cats ADD COLUMN caption text;
  END IF;
END $$;

-- Add check constraint for caption length (125 characters)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'cats_caption_length_check' 
    AND table_name = 'cats'
  ) THEN
    ALTER TABLE cats ADD CONSTRAINT cats_caption_length_check CHECK (length(caption) <= 125);
  END IF;
END $$;