import { createSupabaseServerClient } from '@/lib/supabase-server';
import { BookSearch } from '@/components/BookSearch';

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();

  const [{ count: totalBooks }, { count: totalReferences }] = await Promise.all([
    supabase.from('books').select('*', { count: 'exact', head: true }),
    supabase.from('book_references').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <BookSearch
      totalBooks={totalBooks ?? 0}
      totalReferences={totalReferences ?? 0}
    />
  );
}
