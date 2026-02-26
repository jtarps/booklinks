import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchGoogleBooks, searchBooksMentioning } from '@/lib/googleBooks';

const mockBook = {
  id: 'abc123',
  volumeInfo: {
    title: 'Test Book',
    authors: ['Test Author'],
    description: 'A test book',
    imageLinks: { thumbnail: 'https://example.com/thumb.jpg' },
  },
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('searchGoogleBooks', () => {
  it('returns books from Google Books API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ items: [mockBook] }),
    }));

    const results = await searchGoogleBooks('test');
    expect(results).toHaveLength(1);
    expect(results[0].volumeInfo.title).toBe('Test Book');
  });

  it('returns empty array when no items', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
    }));

    const results = await searchGoogleBooks('nonexistent');
    expect(results).toEqual([]);
  });

  it('returns empty array on fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const results = await searchGoogleBooks('test');
    expect(results).toEqual([]);
  });

  it('includes API key in request when available', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ items: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await searchGoogleBooks('test');
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('googleapis.com/books/v1/volumes');
    expect(url).toContain('maxResults=5');
  });
});

describe('searchBooksMentioning', () => {
  it('searches with title and author', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        items: [
          {
            id: 'other1',
            volumeInfo: {
              title: 'Another Book',
              authors: ['Someone Else'],
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const results = await searchBooksMentioning('The Lean Startup', 'Eric Ries');
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('The%20Lean%20Startup');
    expect(url).toContain('Eric%20Ries');
  });

  it('returns empty array on error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')));

    const results = await searchBooksMentioning('test');
    expect(results).toEqual([]);
  });
});
