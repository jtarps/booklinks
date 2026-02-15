import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yovcbvpmoosuqjxwijvj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdmNidnBtb29zdXFqeHdpanZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMjAwODYsImV4cCI6MjA4NjY5NjA4Nn0.p_cNFzOqLIHwW09uU1FxouvOq5v2mnvcD-pty1yrI5M'
);

const UNSPLASH_FALLBACK = 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73';

async function searchGoogleBooks(title: string, author: string): Promise<string | null> {
  try {
    // Search by title + author for best match
    const query = `${title} ${author}`.trim();
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`
    );
    const data = await response.json();

    if (!data.items || data.items.length === 0) return null;

    // Find best match — look for title that closely matches
    const titleLower = title.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const item of data.items) {
      const itemTitle = (item.volumeInfo?.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const thumbnail = item.volumeInfo?.imageLinks?.thumbnail;

      if (thumbnail && itemTitle.includes(titleLower.slice(0, 15))) {
        return thumbnail;
      }
    }

    // Fallback: return first result with a thumbnail
    for (const item of data.items) {
      const thumbnail = item.volumeInfo?.imageLinks?.thumbnail;
      if (thumbnail) return thumbnail;
    }

    return null;
  } catch (error) {
    console.error(`  Error searching for "${title}":`, error);
    return null;
  }
}

async function fixCovers() {
  const { data: books, error } = await supabase
    .from('books')
    .select('id, title, author, cover_url')
    .order('title');

  if (error || !books) {
    console.error('Failed to fetch books:', error);
    return;
  }

  console.log(`Found ${books.length} books. Checking covers...\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const book of books) {
    const needsFix =
      !book.cover_url ||
      book.cover_url.includes('unsplash.com');

    if (!needsFix) {
      skipped++;
      continue;
    }

    console.log(`Fixing: "${book.title}" by ${book.author}`);
    console.log(`  Current: ${book.cover_url ? 'Unsplash fallback' : 'NO COVER'}`);

    const newCover = await searchGoogleBooks(book.title, book.author);

    if (newCover) {
      const { error: updateError } = await supabase
        .from('books')
        .update({ cover_url: newCover })
        .eq('id', book.id);

      if (updateError) {
        console.log(`  FAILED to update: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  Updated to: ${newCover.substring(0, 70)}...`);
        updated++;
      }
    } else {
      console.log(`  No cover found on Google Books`);
      failed++;
    }

    // Rate limit: 500ms between API calls
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\nDone!`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Already good: ${skipped}`);
  console.log(`  No cover found: ${failed}`);
}

fixCovers().catch(console.error);
