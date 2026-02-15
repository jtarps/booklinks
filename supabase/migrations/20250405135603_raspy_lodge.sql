/*
  # Add reference source tracking

  1. Changes
    - Add source column to book_references table
    - Add validation for source types (includes google_books)
    - Backfill existing references as 'system' source

  2. Structure
    - Sources can be: 'system', 'user', 'ai', 'wikipedia', 'google_books'
    - Include metadata for verification
*/

-- Add source tracking
ALTER TABLE book_references
ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'user',
ADD COLUMN IF NOT EXISTS source_url text,
ADD COLUMN IF NOT EXISTS source_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_date timestamptz,
ADD CONSTRAINT valid_source CHECK (source IN ('system', 'user', 'ai', 'wikipedia', 'google_books'));

-- Update existing references to 'system' source
UPDATE book_references SET source = 'system' WHERE source = 'user';
