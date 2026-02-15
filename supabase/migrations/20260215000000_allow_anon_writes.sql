/*
  # Allow anonymous writes for books and references

  The app has no auth system — all users operate via the anon key.
  Update RLS policies to allow anon inserts/updates so that:
  - Search and browsing work (already public SELECT)
  - Add Book form works (needs INSERT)
  - Discover Connections works (edge function inserts via service role,
    but manual reference adding needs anon INSERT)
*/

-- Drop existing write policies (they target 'authenticated' only)
DROP POLICY IF EXISTS "Allow authenticated users to insert books" ON books;
DROP POLICY IF EXISTS "Allow authenticated users to update books" ON books;
DROP POLICY IF EXISTS "Allow authenticated users to delete books" ON books;

DROP POLICY IF EXISTS "Allow authenticated users to insert book_references" ON book_references;
DROP POLICY IF EXISTS "Allow authenticated users to update book_references" ON book_references;
DROP POLICY IF EXISTS "Allow authenticated users to delete book_references" ON book_references;

-- Recreate as public (anon + authenticated) write policies
CREATE POLICY "Allow public insert on books"
    ON books FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on books"
    ON books FOR UPDATE
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow public insert on book_references"
    ON book_references FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on book_references"
    ON book_references FOR UPDATE
    USING (true) WITH CHECK (true);
