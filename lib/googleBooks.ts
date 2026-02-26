export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail: string;
    };
  };
}

export interface GoogleBookMention {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail: string;
    };
  };
  searchInfo?: {
    textSnippet?: string;
  };
}

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

export async function searchGoogleBooks(query: string): Promise<GoogleBook[]> {
  try {
    const keyParam = GOOGLE_BOOKS_API_KEY ? `&key=${GOOGLE_BOOKS_API_KEY}` : '';
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5${keyParam}`
    );
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching Google Books:', error);
    return [];
  }
}

export async function searchBooksMentioning(
  bookTitle: string,
  bookAuthor?: string
): Promise<GoogleBookMention[]> {
  try {
    let query = `"${bookTitle}"`;
    if (bookAuthor) {
      query += ` "${bookAuthor}"`;
    }

    const keyParam = GOOGLE_BOOKS_API_KEY ? `&key=${GOOGLE_BOOKS_API_KEY}` : '';
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&fields=items(id,volumeInfo(title,authors,description,imageLinks/thumbnail),searchInfo/textSnippet)${keyParam}`
    );

    const data = await response.json();
    if (!data.items) return [];

    const filtered = data.items.filter((book: GoogleBookMention) => {
      const title = book.volumeInfo.title.toLowerCase();
      const searchTitle = bookTitle.toLowerCase();
      return !title.includes(searchTitle) || title !== searchTitle;
    });

    return filtered;
  } catch (error) {
    console.error('Error searching for book mentions:', error);
    return [];
  }
}
