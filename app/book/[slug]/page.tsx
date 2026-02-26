import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { BookDetailClient } from './BookDetailClient';
import type { Book } from '@/types';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getBook(slug: string): Promise<Book | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('books')
    .select(`
      *,
      references:book_references!book_references_source_book_id_fkey(
        id,
        context,
        referenced_book:books!book_references_referenced_book_id_fkey(*)
      ),
      referenced_by:book_references!book_references_referenced_book_id_fkey(
        id,
        context,
        source_book:books!book_references_source_book_id_fkey(*)
      )
    `)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    author: data.author,
    description: data.description || undefined,
    coverUrl: data.cover_url || DEFAULT_COVER,
    references: (data.references || []).map((ref: any) => ({
      id: ref.referenced_book.slug,
      title: ref.referenced_book.title,
      author: ref.referenced_book.author,
      description: ref.referenced_book.description || undefined,
      coverUrl: ref.referenced_book.cover_url || DEFAULT_COVER,
      referenceId: ref.id,
      context: ref.context || undefined,
    })),
    referencedBy: (data.referenced_by || []).map((ref: any) => ({
      id: ref.source_book.slug,
      title: ref.source_book.title,
      author: ref.source_book.author,
      description: ref.source_book.description || undefined,
      coverUrl: ref.source_book.cover_url || DEFAULT_COVER,
      referenceId: ref.id,
      context: ref.context || undefined,
    })),
    databaseId: data.id,
    referencesDiscovered: data.references_discovered || false,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(slug);

  if (!book) {
    return { title: 'Book Not Found' };
  }

  const description = book.description
    ? book.description.slice(0, 160)
    : `Discover all ${book.references.length} books referenced in ${book.title} by ${book.author}. Find the hidden reading list behind this bestseller.`;

  return {
    title: `Books Referenced in ${book.title}`,
    description,
    openGraph: {
      title: `Books Referenced in ${book.title} | BookLinks`,
      description,
      type: 'article',
      images: book.coverUrl ? [{ url: book.coverUrl }] : [],
    },
  };
}

export default async function BookDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const book = await getBook(slug);

  if (!book) {
    notFound();
  }

  return (
    <article>
      <BookDetailClient initialBook={book} slug={slug} />
    </article>
  );
}
