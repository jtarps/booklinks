'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Sparkles,
  BookOpen,
  LogIn,
} from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import { searchGoogleBooks, type GoogleBook } from '@/lib/googleBooks';
import { getAmazonAffiliateLink } from '@/lib/amazon';
import { getWorldCatLink, getOpenLibraryLink } from '@/lib/library';
import { discoverReferences } from '@/lib/discoverReferences';
import { ReferenceList } from '@/components/ReferenceList';
import { ShareButton } from '@/components/ShareButton';
import { AddToListButton } from '@/components/AddToListButton';
import { useAuth } from '@/components/AuthProvider';
import type { Book } from '@/types';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500';

interface BookDetailClientProps {
  initialBook: Book;
  slug: string;
}

export function BookDetailClient({ initialBook, slug }: BookDetailClientProps) {
  const { user } = useAuth();
  const [book, setBook] = useState<Book>(initialBook);
  const [showAddReference, setShowAddReference] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingReference, setAddingReference] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryStatus, setDiscoveryStatus] = useState<string | null>(null);

  const refetchBook = useCallback(async () => {
    const { data, error } = await supabase
      .from('books')
      .select(
        `
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
      `
      )
      .eq('slug', slug)
      .single();

    if (error || !data) return;

    setBook({
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
    });
  }, [slug]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setErrorMessage(null);
    try {
      const books = await searchGoogleBooks(searchQuery);
      setSearchResults(books);
    } catch {
      setErrorMessage('Failed to search books');
    } finally {
      setSearching(false);
    }
  };

  const triggerDiscovery = useCallback(async () => {
    if (!book?.databaseId) return;

    setDiscovering(true);
    setDiscoveryStatus('Discovering references...');

    try {
      const result = await discoverReferences(book.databaseId);

      if (result.success) {
        setDiscoveryStatus(
          result.count
            ? `Found ${result.count} new connections!`
            : 'Finished discovery. No new connections found.'
        );
        setTimeout(() => {
          refetchBook();
          setDiscoveryStatus(null);
        }, 2000);
      } else {
        setDiscoveryStatus(
          'Discovery failed. You can still add references manually.'
        );
      }
    } catch (error) {
      console.error('Auto-discovery error:', error);
      setDiscoveryStatus(null);
    } finally {
      setDiscovering(false);
    }
  }, [book?.databaseId, refetchBook]);

  useEffect(() => {
    if (!book || !book.databaseId) return;

    const shouldDiscover =
      book.referencesDiscovered === false &&
      book.references.length === 0 &&
      book.referencedBy.length === 0 &&
      !discovering &&
      !discoveryStatus;

    if (shouldDiscover) {
      const timer = setTimeout(triggerDiscovery, 500);
      return () => clearTimeout(timer);
    }
  }, [book, discovering, discoveryStatus, triggerDiscovery]);

  const handleAddReference = async (reference: GoogleBook) => {
    if (!book) return;

    setAddingReference(true);
    setErrorMessage(null);

    try {
      const refSlug = reference.volumeInfo.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      let referencedBookId: string;

      const { data: existingBook } = await supabase
        .from('books')
        .select('id')
        .eq('slug', refSlug)
        .single();

      if (existingBook) {
        referencedBookId = existingBook.id;
      } else {
        const { data: newBook, error: bookError } = await supabase
          .from('books')
          .insert({
            slug: refSlug,
            title: reference.volumeInfo.title,
            author: reference.volumeInfo.authors?.[0] || 'Unknown',
            description: reference.volumeInfo.description,
            cover_url: reference.volumeInfo.imageLinks?.thumbnail,
          })
          .select('id')
          .single();
        if (bookError) throw bookError;
        referencedBookId = newBook.id;
      }

      const { error: refError } = await supabase
        .from('book_references')
        .insert({
          source_book_id: book.id,
          referenced_book_id: referencedBookId,
          source: 'user',
        });

      if (refError && refError.code !== '23505') throw refError;

      refetchBook();
      setShowAddReference(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to add reference'
      );
    } finally {
      setAddingReference(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-8"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to search
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
            <div className="flex flex-col items-center flex-shrink-0">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-48 h-72 object-cover rounded-lg shadow-md mb-4"
              />
              <a
                href={getAmazonAffiliateLink(book.title, book.author)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition-colors w-full justify-center font-medium mb-3"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Buy on Amazon
              </a>
              <div className="flex gap-2 w-full">
                <a
                  href={getWorldCatLink(book.title, book.author)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1 justify-center text-sm"
                  title="Find in libraries worldwide"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Find Library
                </a>
                <a
                  href={getOpenLibraryLink(book.title, book.author)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-1 justify-center text-sm"
                  title="Open Library - Free digital access"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Open Library
                </a>
              </div>
            </div>
            <div className="mt-8 md:mt-0 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {book.title}
                  </h1>
                  <p className="text-xl text-gray-600 mb-4">by {book.author}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ShareButton title={book.title} author={book.author} />
                  {book.databaseId && (
                    <AddToListButton bookId={book.databaseId} bookTitle={book.title} />
                  )}
                </div>
              </div>
              {book.description && (
                <details className="mb-6">
                  <summary className="text-indigo-600 hover:text-indigo-500 cursor-pointer">
                    Description
                  </summary>
                  <p className="text-gray-700 mt-2">{book.description}</p>
                </details>
              )}
              <div className="grid grid-cols-2 gap-4 bg-indigo-50 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-700">
                    {book.references.length}
                  </p>
                  <p className="text-sm font-medium text-indigo-600">
                    Contains References To
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-700">
                    {book.referencedBy.length}
                  </p>
                  <p className="text-sm font-medium text-indigo-600">
                    Referenced By
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50/50">
          <div className="flex items-center justify-end gap-3">
            {discovering && (
              <div className="flex items-center gap-2 text-indigo-600">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <span className="text-sm">{discoveryStatus}</span>
              </div>
            )}
            {discoveryStatus && !discovering && (
              <div className="text-sm text-green-600">{discoveryStatus}</div>
            )}
            {book.databaseId && (
              <button
                onClick={triggerDiscovery}
                disabled={discovering}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50"
                title="Automatically discover connections for this book"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Discover Connections
              </button>
            )}
          </div>
        </div>

        <div className="space-y-12 p-8">
          <ReferenceList
            title="Contains References To"
            references={book.references}
            onAdd={() => setShowAddReference(!showAddReference)}
            showAdd={showAddReference}
            isDiscovering={discovering}
          />

          {showAddReference && (
            <div className="mb-8 bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                Add a Book Referenced In This Work
              </h3>
              {!user && (
                <div className="mb-4 p-4 bg-indigo-50 rounded-lg flex items-center gap-3">
                  <LogIn className="h-5 w-5 text-indigo-600" />
                  <p className="text-sm text-indigo-700">
                    <Link href="/auth/login" className="font-medium underline">Sign in</Link>{' '}
                    to track your contributions.
                  </p>
                </div>
              )}
              {errorMessage && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
                  {errorMessage}
                </div>
              )}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  placeholder="Search Google Books..."
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleAddReference(result)}
                      disabled={addingReference}
                      className="w-full text-left p-4 border rounded-lg hover:bg-white transition-colors disabled:opacity-50"
                    >
                      <div className="flex gap-4 items-center">
                        {result.volumeInfo.imageLinks?.thumbnail && (
                          <img
                            src={result.volumeInfo.imageLinks.thumbnail}
                            alt={result.volumeInfo.title}
                            className="w-16 h-24 object-cover rounded"
                          />
                        )}
                        <div>
                          <h4 className="font-medium">
                            {result.volumeInfo.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            by{' '}
                            {result.volumeInfo.authors?.[0] || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <ReferenceList
            title="Referenced By These Books"
            references={book.referencedBy}
          />
        </div>
      </div>
    </div>
  );
}
