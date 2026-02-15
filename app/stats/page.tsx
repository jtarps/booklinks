import { createSupabaseServerClient } from '@/lib/supabase-server';
import { StatsClient } from './StatsClient';

export const metadata = {
  title: 'Stats',
  description: 'BookLinks platform statistics — total books, references, and growth over time.',
};

export default async function StatsPage() {
  const supabase = await createSupabaseServerClient();

  const [
    { count: totalBooks },
    { count: totalReferences },
    { data: dailyCounts },
    { data: mostReferenced },
    { data: mostConnected },
  ] = await Promise.all([
    supabase.from('books').select('*', { count: 'exact', head: true }),
    supabase.from('book_references').select('*', { count: 'exact', head: true }),
    supabase.from('daily_book_counts').select('*').order('day', { ascending: true }),
    supabase.from('most_referenced_books').select('*').limit(10),
    supabase.from('most_connected_books').select('*').limit(10),
  ]);

  return (
    <StatsClient
      totalBooks={totalBooks ?? 0}
      totalReferences={totalReferences ?? 0}
      dailyCounts={dailyCounts ?? []}
      mostReferenced={mostReferenced ?? []}
      mostConnected={mostConnected ?? []}
    />
  );
}
