/*
  # Add auto-discovery tracking to books table

  1. Changes
    - Add references_discovered column to track if references have been auto-discovered
    - Add references_discovered_at timestamp
    - This enables lazy loading: only discover references when needed
*/

-- Add auto-discovery tracking columns
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS references_discovered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS references_discovered_at timestamptz;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_books_references_discovered 
ON books(references_discovered) 
WHERE references_discovered = false;

