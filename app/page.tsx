import { createSupabaseServerClient } from '@/lib/supabase-server';
import { BookSearch } from '@/components/BookSearch';
import type { Book } from '@/types';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500';

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('books')
    .select(`
      *,
      references:book_references!book_references_source_book_id_fkey(
        referenced_book:books!book_references_referenced_book_id_fkey(*)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(12);

  const books: Book[] = (data || []).map((book: any) => ({
    id: book.slug,
    slug: book.slug,
    title: book.title,
    author: book.author,
    description: book.description || undefined,
    coverUrl: book.cover_url || DEFAULT_COVER,
    references: (book.references || []).map((ref: any) => ({
      id: ref.referenced_book.slug,
      title: ref.referenced_book.title,
      author: ref.referenced_book.author,
      description: ref.referenced_book.description || undefined,
      coverUrl: ref.referenced_book.cover_url || DEFAULT_COVER,
    })),
    referencedBy: [],
  }));

  return <BookSearch initialBooks={books} />;
}
