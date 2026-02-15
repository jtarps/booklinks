'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import { searchGoogleBooks, type GoogleBook } from '@/lib/googleBooks';

export function AddBookForm() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedBook, setSelectedBook] = useState<GoogleBook | null>(null);
  const [references, setReferences] = useState<GoogleBook[]>([]);
  const [referenceSearch, setReferenceSearch] = useState('');
  const [referenceResults, setReferenceResults] = useState<GoogleBook[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const books = await searchGoogleBooks(searchQuery);
      setSearchResults(books);
    } catch {
      setError('Failed to search books');
    } finally {
      setLoading(false);
    }
  };

  const handleReferenceSearch = async () => {
    if (!referenceSearch.trim()) return;
    try {
      const books = await searchGoogleBooks(referenceSearch);
      setReferenceResults(books);
    } catch {
      setError('Failed to search reference books');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    setLoading(true);
    setError(null);

    try {
      const slug = selectedBook.volumeInfo.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .insert({
          slug,
          title: selectedBook.volumeInfo.title,
          author: selectedBook.volumeInfo.authors?.[0] || 'Unknown',
          description: selectedBook.volumeInfo.description,
          cover_url: selectedBook.volumeInfo.imageLinks?.thumbnail,
        })
        .select()
        .single();

      if (bookError) throw bookError;

      for (const ref of references) {
        const refSlug = ref.volumeInfo.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const { data: refData, error: refError } = await supabase
          .from('books')
          .insert({
            slug: refSlug,
            title: ref.volumeInfo.title,
            author: ref.volumeInfo.authors?.[0] || 'Unknown',
            description: ref.volumeInfo.description,
            cover_url: ref.volumeInfo.imageLinks?.thumbnail,
          })
          .select()
          .single();

        if (refError && refError.code !== '23505') {
          throw refError;
        }

        const { error: relError } = await supabase
          .from('book_references')
          .insert({
            source_book_id: bookData.id,
            referenced_book_id: refData?.id,
          });

        if (relError) throw relError;
      }

      setSuccess(true);
      setSelectedBook(null);
      setReferences([]);
      setSearchQuery('');
      setReferenceSearch('');
      setSearchResults([]);
      setReferenceResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Add a New Book</h2>

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">
          Book added successfully!
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search for a book
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              placeholder="Enter book title..."
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {searchResults.length > 0 && !selectedBook && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Select a book:</h3>
            {searchResults.map((book) => (
              <button
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className="w-full text-left p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex gap-4">
                  {book.volumeInfo.imageLinks?.thumbnail && (
                    <img
                      src={book.volumeInfo.imageLinks.thumbnail}
                      alt={book.volumeInfo.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                  )}
                  <div>
                    <h4 className="font-medium">{book.volumeInfo.title}</h4>
                    <p className="text-sm text-gray-600">
                      by {book.volumeInfo.authors?.[0] || 'Unknown'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedBook && (
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-4">Selected Book:</h3>
            <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              {selectedBook.volumeInfo.imageLinks?.thumbnail && (
                <img
                  src={selectedBook.volumeInfo.imageLinks.thumbnail}
                  alt={selectedBook.volumeInfo.title}
                  className="w-16 h-24 object-cover rounded"
                />
              )}
              <div>
                <h4 className="font-medium">
                  {selectedBook.volumeInfo.title}
                </h4>
                <p className="text-sm text-gray-600">
                  by {selectedBook.volumeInfo.authors?.[0] || 'Unknown'}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add referenced books
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referenceSearch}
                  onChange={(e) => setReferenceSearch(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleReferenceSearch()
                  }
                  className="flex-1 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  placeholder="Search for referenced books..."
                />
                <button
                  onClick={handleReferenceSearch}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>

            {referenceResults.length > 0 && (
              <div className="mt-4 space-y-4">
                <h3 className="font-medium text-gray-900">
                  Select references:
                </h3>
                {referenceResults.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => {
                      setReferences((prev) => [...prev, book]);
                      setReferenceResults([]);
                      setReferenceSearch('');
                    }}
                    className="w-full text-left p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex gap-4">
                      {book.volumeInfo.imageLinks?.thumbnail && (
                        <img
                          src={book.volumeInfo.imageLinks.thumbnail}
                          alt={book.volumeInfo.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                      )}
                      <div>
                        <h4 className="font-medium">
                          {book.volumeInfo.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          by {book.volumeInfo.authors?.[0] || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {references.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-4">
                  Selected References:
                </h3>
                <div className="space-y-4">
                  {references.map((book) => (
                    <div
                      key={book.id}
                      className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      {book.volumeInfo.imageLinks?.thumbnail && (
                        <img
                          src={book.volumeInfo.imageLinks.thumbnail}
                          alt={book.volumeInfo.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {book.volumeInfo.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          by {book.volumeInfo.authors?.[0] || 'Unknown'}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setReferences((refs) =>
                            refs.filter((r) => r.id !== book.id)
                          )
                        }
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                'Add Book and References'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
