/*
  # Seed initial books and references

  1. New Data
    - Add popular tech and business books
    - Include their references
    - Ensure data quality with proper descriptions and cover images

  2. Structure
    - Insert books first
    - Create references between books
    - Use high-quality Unsplash images for covers
*/

-- Insert initial books
INSERT INTO books (slug, title, author, description, cover_url) VALUES
  (
    'inspired',
    'INSPIRED: How to Create Tech Products Customers Love',
    'Marty Cagan',
    'How to create tech products customers love - the definitive guide to modern product management.',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500'
  ),
  (
    'lean-startup',
    'The Lean Startup',
    'Eric Ries',
    'How Today''s Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500'
  ),
  (
    'zero-to-one',
    'Zero to One',
    'Peter Thiel',
    'Notes on Startups, or How to Build the Future',
    'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500'
  ),
  (
    'hooked',
    'Hooked: How to Build Habit-Forming Products',
    'Nir Eyal',
    'A practical guide to building products people love and can''t put down.',
    'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=500'
  ),
  (
    'crossing-the-chasm',
    'Crossing the Chasm',
    'Geoffrey Moore',
    'Marketing and Selling Disruptive Products to Mainstream Customers',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500'
  )
ON CONFLICT (slug) DO NOTHING;

-- Create references between books
INSERT INTO book_references (source_book_id, referenced_book_id, context)
SELECT 
  b1.id as source_book_id,
  b2.id as referenced_book_id,
  'Referenced in discussing product-market fit and innovation'
FROM books b1, books b2
WHERE b1.slug = 'inspired' AND b2.slug = 'lean-startup'
ON CONFLICT (source_book_id, referenced_book_id) DO NOTHING;

INSERT INTO book_references (source_book_id, referenced_book_id, context)
SELECT 
  b1.id as source_book_id,
  b2.id as referenced_book_id,
  'Referenced when discussing startup strategy and innovation'
FROM books b1, books b2
WHERE b1.slug = 'inspired' AND b2.slug = 'zero-to-one'
ON CONFLICT (source_book_id, referenced_book_id) DO NOTHING;

INSERT INTO book_references (source_book_id, referenced_book_id, context)
SELECT 
  b1.id as source_book_id,
  b2.id as referenced_book_id,
  'Referenced in product adoption strategies'
FROM books b1, books b2
WHERE b1.slug = 'hooked' AND b2.slug = 'crossing-the-chasm'
ON CONFLICT (source_book_id, referenced_book_id) DO NOTHING;

INSERT INTO book_references (source_book_id, referenced_book_id, context)
SELECT 
  b1.id as source_book_id,
  b2.id as referenced_book_id,
  'Referenced in product development methodology'
FROM books b1, books b2
WHERE b1.slug = 'lean-startup' AND b2.slug = 'zero-to-one'
ON CONFLICT (source_book_id, referenced_book_id) DO NOTHING;