/*
  BookLinks - Consolidated Database Schema
  Combines all 7 migrations into a single idempotent script.
  Run this against a fresh Supabase project.
*/

-- ============================================
-- 1. TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS books (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    author text NOT NULL,
    description text,
    cover_url text,
    references_discovered boolean DEFAULT false,
    references_discovered_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS book_references (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_book_id uuid REFERENCES books(id) ON DELETE CASCADE,
    referenced_book_id uuid REFERENCES books(id) ON DELETE CASCADE,
    context text,
    page_number integer,
    source text NOT NULL DEFAULT 'user',
    source_url text,
    source_verified boolean DEFAULT false,
    verification_date timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(source_book_id, referenced_book_id),
    CONSTRAINT valid_source CHECK (source IN ('system', 'user', 'ai', 'wikipedia', 'google_books'))
);

-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_references ENABLE ROW LEVEL SECURITY;

-- Books policies
CREATE POLICY "Allow public read access to books"
    ON books FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert books"
    ON books FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update books"
    ON books FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete books"
    ON books FOR DELETE USING (true);

-- Book references policies
CREATE POLICY "Allow public read access to book_references"
    ON book_references FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert book_references"
    ON book_references FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update book_references"
    ON book_references FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete book_references"
    ON book_references FOR DELETE USING (true);

-- ============================================
-- 3. TRIGGERS & INDEXES
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS books_title_idx ON books USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS books_author_idx ON books USING gin(to_tsvector('english', author));
CREATE INDEX IF NOT EXISTS books_slug_idx ON books(slug);
CREATE INDEX IF NOT EXISTS idx_books_references_discovered ON books(references_discovered) WHERE references_discovered = false;

-- ============================================
-- 4. SEED DATA
-- ============================================

INSERT INTO books (slug, title, author, description, cover_url) VALUES
  ('inspired', 'INSPIRED: How to Create Tech Products Customers Love', 'Marty Cagan',
   'How to create tech products customers love - the definitive guide to modern product management.',
   'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'),
  ('lean-startup', 'The Lean Startup', 'Eric Ries',
   'How Today''s Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses',
   'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500'),
  ('zero-to-one', 'Zero to One', 'Peter Thiel',
   'Notes on Startups, or How to Build the Future',
   'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500'),
  ('hooked', 'Hooked: How to Build Habit-Forming Products', 'Nir Eyal',
   'A practical guide to building products people love and can''t put down.',
   'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=500'),
  ('crossing-the-chasm', 'Crossing the Chasm', 'Geoffrey Moore',
   'Marketing and Selling Disruptive Products to Mainstream Customers',
   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500')
ON CONFLICT (slug) DO NOTHING;

-- Seed references
INSERT INTO book_references (source_book_id, referenced_book_id, context, source)
SELECT b1.id, b2.id, 'Referenced in discussing product-market fit and innovation', 'system'
FROM books b1, books b2 WHERE b1.slug = 'inspired' AND b2.slug = 'lean-startup'
ON CONFLICT (source_book_id, referenced_book_id) DO NOTHING;

INSERT INTO book_references (source_book_id, referenced_book_id, context, source)
SELECT b1.id, b2.id, 'Referenced when discussing startup strategy and innovation', 'system'
FROM books b1, books b2 WHERE b1.slug = 'inspired' AND b2.slug = 'zero-to-one'
ON CONFLICT (source_book_id, referenced_book_id) DO NOTHING;

INSERT INTO book_references (source_book_id, referenced_book_id, context, source)
SELECT b1.id, b2.id, 'Referenced in product adoption strategies', 'system'
FROM books b1, books b2 WHERE b1.slug = 'hooked' AND b2.slug = 'crossing-the-chasm'
ON CONFLICT (source_book_id, referenced_book_id) DO NOTHING;

INSERT INTO book_references (source_book_id, referenced_book_id, context, source)
SELECT b1.id, b2.id, 'Referenced in product development methodology', 'system'
FROM books b1, books b2 WHERE b1.slug = 'lean-startup' AND b2.slug = 'zero-to-one'
ON CONFLICT (source_book_id, referenced_book_id) DO NOTHING;
