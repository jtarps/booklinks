'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Book, ArrowRight, Globe, Database, BookOpen, ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import { searchGoogleBooks, type GoogleBook } from '@/lib/googleBooks';
import { AddBookForm } from './AddBookForm';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500';

interface BookSearchProps {
  totalBooks: number;
  totalReferences: number;
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

export function BookSearch({ totalBooks, totalReferences }: BookSearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const [dbResults, googleResults] = await Promise.all([
          searchDatabase(searchQuery),
          searchGoogleBooks(searchQuery),
        ]);

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
        setHasSearched(true);
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

    setNavigating(result.slug);
    try {
      const gb = result.googleBook!;
      const slug = toSlug(gb.volumeInfo.title);

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

  const isIdle = !searchQuery.trim() && !loading;

  return (
    <>
      {/* Hero Section */}
      <section className="text-center mb-10 pt-8">
        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Discover Books Within Books
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
          Every great book references other great books. Search any title to
          uncover its hidden reading list.
        </p>
      </section>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            placeholder="Search any book title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {showAddForm && (
          <div className="mt-6">
            <AddBookForm />
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Search Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Searching books...</p>
        </div>
      ) : results.length > 0 ? (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {results.map((result) => (
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
      ) : hasSearched && !loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-3">
            No books found for &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Can&apos;t find your book? Add it here &rarr;
          </button>
        </div>
      ) : null}

      {/* How It Works — always visible when idle */}
      {isIdle && (
        <>
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-indigo-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Search className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Search Any Book</h3>
                <p className="text-gray-600">
                  Search by title or author — we&apos;ll find it
                </p>
              </div>
              <div className="text-center">
                <div className="bg-indigo-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Discover References
                </h3>
                <p className="text-gray-600">
                  See every book mentioned or cited inside
                </p>
              </div>
              <div className="text-center">
                <div className="bg-indigo-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Quick Purchase</h3>
                <p className="text-gray-600">
                  Direct links to buy referenced books
                </p>
              </div>
            </div>
          </section>

          {/* Social Proof */}
          {(totalBooks > 0 || totalReferences > 0) && (
            <section className="text-center mb-8">
              <div className="inline-flex items-center gap-6 text-gray-500 text-sm">
                <span className="flex items-center gap-1.5">
                  <Book className="h-4 w-4" />
                  <strong className="text-gray-900">{totalBooks.toLocaleString()}</strong> books catalogued
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1.5">
                  <ArrowRight className="h-4 w-4" />
                  <strong className="text-gray-900">{totalReferences.toLocaleString()}</strong> references mapped
                </span>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
