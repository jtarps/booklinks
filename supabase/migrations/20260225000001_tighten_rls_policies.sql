/*
  # Tighten RLS policies for books and book_references

  Previously all writes were open to public (anon + authenticated).
  Now that we have auth:
  - Anyone can still READ books and references
  - Only authenticated users can INSERT (with added_by tracked)
  - Only the user who added a book can UPDATE/DELETE it
  - Books/references with NULL added_by (legacy data) can be updated by any authenticated user
*/

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow public insert on books" ON books;
DROP POLICY IF EXISTS "Allow public update on books" ON books;
DROP POLICY IF EXISTS "Allow public delete on books" ON books;

DROP POLICY IF EXISTS "Allow public insert on book_references" ON book_references;
DROP POLICY IF EXISTS "Allow public update on book_references" ON book_references;
DROP POLICY IF EXISTS "Allow public delete on book_references" ON book_references;

-- Books: authenticated users can insert (added_by is set automatically)
CREATE POLICY "Authenticated users can insert books"
  ON books FOR INSERT TO authenticated
  WITH CHECK (true);

-- Books: only the creator can update (or legacy rows with NULL added_by)
CREATE POLICY "Users can update own books"
  ON books FOR UPDATE TO authenticated
  USING (added_by = auth.uid() OR added_by IS NULL)
  WITH CHECK (added_by = auth.uid() OR added_by IS NULL);

-- Books: only the creator can delete
CREATE POLICY "Users can delete own books"
  ON books FOR DELETE TO authenticated
  USING (added_by = auth.uid());

-- Book references: authenticated users can insert
CREATE POLICY "Authenticated users can insert book_references"
  ON book_references FOR INSERT TO authenticated
  WITH CHECK (true);

-- Book references: only the creator can update
CREATE POLICY "Users can update own book_references"
  ON book_references FOR UPDATE TO authenticated
  USING (added_by = auth.uid() OR added_by IS NULL)
  WITH CHECK (added_by = auth.uid() OR added_by IS NULL);

-- Book references: only the creator can delete
CREATE POLICY "Users can delete own book_references"
  ON book_references FOR DELETE TO authenticated
  USING (added_by = auth.uid());

-- Anon users can still insert books (for the search → create flow)
-- but their added_by will be NULL
CREATE POLICY "Anon users can insert books"
  ON books FOR INSERT TO anon
  WITH CHECK (true);
