/*
  # Book References Database Schema

  1. New Tables
    - `books`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - URL-friendly identifier
      - `title` (text)
      - `author` (text)
      - `description` (text)
      - `cover_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `book_references`
      - `id` (uuid, primary key)
      - `source_book_id` (uuid, foreign key)
      - `referenced_book_id` (uuid, foreign key)
      - `context` (text) - Optional context about where/how the book was referenced
      - `page_number` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Allow public read access
    - Restrict write access to authenticated users
*/

-- Create books table
CREATE TABLE IF NOT EXISTS books (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    author text NOT NULL,
    description text,
    cover_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create book_references table
CREATE TABLE IF NOT EXISTS book_references (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_book_id uuid REFERENCES books(id) ON DELETE CASCADE,
    referenced_book_id uuid REFERENCES books(id) ON DELETE CASCADE,
    context text,
    page_number integer,
    created_at timestamptz DEFAULT now(),
    UNIQUE(source_book_id, referenced_book_id)
);

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_references ENABLE ROW LEVEL SECURITY;

-- Create policies for books
CREATE POLICY "Allow public read access to books"
    ON books
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated users to insert books"
    ON books
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update their books"
    ON books
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for book_references
CREATE POLICY "Allow public read access to book_references"
    ON book_references
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated users to insert book_references"
    ON book_references
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for books
CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS books_title_idx ON books USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS books_author_idx ON books USING gin(to_tsvector('english', author));
CREATE INDEX IF NOT EXISTS books_slug_idx ON books(slug);