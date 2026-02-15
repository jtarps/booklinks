import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const popularBooks = [
  'Sapiens: A Brief History of Humankind',
  'Atomic Habits',
  'Thinking, Fast and Slow',
  'The Power of Habit',
  'Deep Work',
  'Range: Why Generalists Triumph in a Specialized World',
  'Grit: The Power of Passion and Perseverance',
  'The Lean Startup',
  'Zero to One',
  'Good to Great'
];

async function seedReferences() {
  const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/book-references`;

  for (const bookTitle of popularBooks) {
    console.log(`Processing references for: ${bookTitle}`);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookTitle }),
      });

      const data = await response.json();
      console.log(`Added ${data.references?.length || 0} references for ${bookTitle}`);
    } catch (error) {
      console.error(`Error processing ${bookTitle}:`, error);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

seedReferences()
  .then(() => console.log('Finished seeding references'))
  .catch(console.error);
