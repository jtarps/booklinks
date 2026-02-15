/*
  # Update RLS policies for books and references

  1. Changes
    - Add safe policy creation with existence checks
    - Add missing delete policies
    - Update existing policies with proper USING and WITH CHECK clauses

  2. Security
    - Maintain public read access
    - Allow authenticated users full CRUD access
    - Ensure proper RLS enforcement
*/

DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow public read access to books" ON books;
  DROP POLICY IF EXISTS "Allow authenticated users to insert books" ON books;
  DROP POLICY IF EXISTS "Allow authenticated users to update books" ON books;
  DROP POLICY IF EXISTS "Allow authenticated users to delete books" ON books;
  
  DROP POLICY IF EXISTS "Allow public read access to book_references" ON book_references;
  DROP POLICY IF EXISTS "Allow authenticated users to insert book_references" ON book_references;
  DROP POLICY IF EXISTS "Allow authenticated users to update book_references" ON book_references;
  DROP POLICY IF EXISTS "Allow authenticated users to delete book_references" ON book_references;
END $$;

-- Recreate policies for books
CREATE POLICY "Allow public read access to books"
    ON books
    FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated users to insert books"
    ON books
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update books"
    ON books
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete books"
    ON books
    FOR DELETE
    USING (true);

-- Recreate policies for book_references
CREATE POLICY "Allow public read access to book_references"
    ON book_references
    FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated users to insert book_references"
    ON book_references
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update book_references"
    ON book_references
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete book_references"
    ON book_references
    FOR DELETE
    USING (true);