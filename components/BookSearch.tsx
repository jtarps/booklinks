'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Book, ArrowRight, Globe, Database } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import { searchGoogleBooks, type GoogleBook } from '@/lib/googleBooks';
import { AddBookForm } from './AddBookForm';
import type { Book as BookType } from '@/types';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500';

interface BookSearchProps {
  initialBooks: BookType[];
}

interface SearchResult {
  type: 'db' | 'google';
  slug: string;
  title: string;
  author: string;
  coverUrl: string;
  description?: string;
  referenceCount: number;
  googleBook?: GoogleBook;
}

export function BookSearch({ initialBooks }: BookSearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInitial, setShowInitial] = useState(true);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setShowInitial(true);
      setResults([]);
      return;
    }

    setShowInitial(false);

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        // Search both sources in parallel
        const [dbResults, googleResults] = await Promise.all([
          searchDatabase(searchQuery),
          searchGoogleBooks(searchQuery),
        ]);

        // Merge results: DB books first, then Google Books (deduped)
        const dbSlugs = new Set(dbResults.map((r) => r.slug));
        const merged: SearchResult[] = [
          ...dbResults,
          ...googleResults
            .filter((gb) => {
              const slug = toSlug(gb.volumeInfo.title);
              return !dbSlugs.has(slug);
            })
            .map(
              (gb): SearchResult => ({
                type: 'google',
                slug: toSlug(gb.volumeInfo.title),
                title: gb.volumeInfo.title,
                author: gb.volumeInfo.authors?.[0] || 'Unknown',
                coverUrl: gb.volumeInfo.imageLinks?.thumbnail || DEFAULT_COVER,
                description: gb.volumeInfo.description,
                referenceCount: 0,
                googleBook: gb,
              })
            ),
        ];

        setResults(merged);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function searchDatabase(query: string): Promise<SearchResult[]> {
    const { data, error: err } = await supabase
      .from('books')
      .select(
        `
        *,
        references:book_references!book_references_source_book_id_fkey(
          referenced_book:books!book_references_referenced_book_id_fkey(*)
        )
      `
      )
      .or(`title.ilike.%${query}%,author.ilike.%${query}%`);

    if (err) throw err;

    return (data || []).map(
      (book: any): SearchResult => ({
        type: 'db',
        slug: book.slug,
        title: book.title,
        author: book.author,
        description: book.description || undefined,
        coverUrl: book.cover_url || DEFAULT_COVER,
        referenceCount: (book.references || []).length,
      })
    );
  }

  function toSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async function handleResultClick(result: SearchResult) {
    if (result.type === 'db') {
      router.push(`/book/${result.slug}`);
      return;
    }

    // Google Books result — create in DB first, then navigate
    setNavigating(result.slug);
    try {
      const gb = result.googleBook!;
      const slug = toSlug(gb.volumeInfo.title);

      // Check if it already exists (race condition guard)
      const { data: existing } = await supabase
        .from('books')
        .select('slug')
        .eq('slug', slug)
        .single();

      if (!existing) {
        const { error: insertErr } = await supabase.from('books').insert({
          slug,
          title: gb.volumeInfo.title,
          author: gb.volumeInfo.authors?.[0] || 'Unknown',
          description: gb.volumeInfo.description,
          cover_url: gb.volumeInfo.imageLinks?.thumbnail,
        });
        if (insertErr && insertErr.code !== '23505') throw insertErr;
      }

      router.push(`/book/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add book');
      setNavigating(null);
    }
  }

  // Format initial books for display
  const initialResults: SearchResult[] = initialBooks.map((book) => ({
    type: 'db' as const,
    slug: book.slug,
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl,
    description: book.description,
    referenceCount: book.references.length,
  }));

  const displayResults = showInitial ? initialResults : results;

  return (
    <>
      <div className="max-w-3xl mx-auto">
        <section className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Discover Books Within Books
          </h2>
          <p className="text-lg text-gray-600">
            Find all the books referenced in your current read
          </p>
        </section>

        <div className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              placeholder="Search any book title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Book
          </button>
        </div>

        {showAddForm && (
          <div className="mb-8">
            <AddBookForm />
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Searching books...</p>
        </div>
      ) : displayResults.length > 0 ? (
        <section className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayResults.map((result) => (
            <button
              key={`${result.type}-${result.slug}`}
              onClick={() => handleResultClick(result)}
              disabled={navigating === result.slug}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow text-left disabled:opacity-60"
            >
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  <img
                    src={result.coverUrl}
                    alt={result.title}
                    className="w-32 h-48 object-cover rounded-lg shadow-md mb-4"
                  />
                  <h3 className="text-xl font-bold text-gray-900">
                    {result.title}
                  </h3>
                  <p className="text-gray-600">by {result.author}</p>
                  {result.type === 'db' ? (
                    <p className="text-sm text-gray-500 mt-2 inline-flex items-center gap-1">
                      <Database className="h-3 w-3" />
                      {result.referenceCount} referenced books
                    </p>
                  ) : (
                    <p className="text-sm text-indigo-500 mt-2 inline-flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {navigating === result.slug
                        ? 'Adding...'
                        : 'Click to explore'}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </section>
      ) : searchQuery && !loading ? (
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            No books found. Try a different search term.
          </p>
        </div>
      ) : !searchQuery ? (
        <section className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <Search className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Search Any Book</h3>
              <p className="text-gray-600">
                Search by title or author — we'll find it
              </p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <Book className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Discover References
              </h3>
              <p className="text-gray-600">
                See all books mentioned or referenced
              </p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Quick Purchase</h3>
              <p className="text-gray-600">
                Direct links to buy referenced books
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
