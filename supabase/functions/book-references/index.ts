import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookReference {
  title: string;
  author: string;
  context?: string;
  source: 'wikipedia' | 'ai' | 'google_books';
  source_url?: string;
  source_verified?: boolean;
  google_book_id?: string;
}

interface ProcessedReference {
  source_book_id: string;
  referenced_book_id: string;
  context?: string;
  source: string;
  source_url?: string;
  source_verified: boolean;
}

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

async function getAIReferences(bookTitle: string, bookAuthor?: string): Promise<BookReference[]> {
  const bookInfo = bookAuthor ? `${bookTitle} by ${bookAuthor}` : bookTitle;
  const prompt = `List 10-15 books that are frequently referenced, cited, or mentioned in "${bookInfo}".
Format as JSON array with properties: title, author, context (brief description of how it's referenced).
Only include books that are actually referenced in the text, not just similar topics.
Return only valid JSON array, no markdown or extra text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const content = completion.choices[0].message?.content || '[]';
    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const references = JSON.parse(cleanedContent);

    return references.map((ref: any) => ({
      title: ref.title,
      author: ref.author || 'Unknown',
      context: ref.context,
      source: 'ai' as const,
    }));
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return [];
  }
}

async function searchGoogleBooksMentions(
  bookTitle: string,
  bookAuthor?: string
): Promise<BookReference[]> {
  try {
    let query = `"${bookTitle}"`;
    if (bookAuthor) {
      query += ` "${bookAuthor}"`;
    }

    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&fields=items(id,volumeInfo(title,authors,description,imageLinks/thumbnail),searchInfo/textSnippet)`
    );

    const data = await response.json();
    if (!data.items) return [];

    const references: BookReference[] = [];
    const searchTitleLower = bookTitle.toLowerCase();

    for (const book of data.items) {
      const title = book.volumeInfo?.title || '';
      const titleLower = title.toLowerCase();

      if (titleLower === searchTitleLower || titleLower.includes(searchTitleLower)) {
        continue;
      }

      const snippet = book.searchInfo?.textSnippet || '';
      const context = snippet
        ? `Mentioned in text: ${snippet.substring(0, 150)}...`
        : 'Found via Google Books text search';

      references.push({
        title,
        author: book.volumeInfo?.authors?.[0] || 'Unknown',
        context,
        source: 'google_books',
        source_url: `https://books.google.com/books?id=${book.id}`,
        google_book_id: book.id,
      });
    }

    return references;
  } catch (error) {
    console.error('Error searching Google Books:', error);
    return [];
  }
}

async function findOrCreateBook(reference: BookReference, googleBookId?: string) {
  const slug = reference.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const { data: existingBook } = await supabaseClient
    .from('books')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existingBook) {
    return existingBook.id;
  }

  let coverUrl: string | undefined;
  let description: string | undefined;

  if (googleBookId) {
    // Fetch by known Google Books ID
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes/${googleBookId}?fields=volumeInfo(description,imageLinks/thumbnail)`
      );
      const data = await response.json();
      coverUrl = data.volumeInfo?.imageLinks?.thumbnail;
      description = data.volumeInfo?.description;
    } catch (error) {
      console.error('Error fetching book metadata:', error);
    }
  }

  // If no cover yet, search Google Books by title+author
  if (!coverUrl) {
    try {
      const q = encodeURIComponent(`${reference.title} ${reference.author}`);
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&fields=items(volumeInfo(imageLinks/thumbnail,description))`
      );
      const data = await response.json();
      const item = data.items?.[0];
      if (item) {
        coverUrl = item.volumeInfo?.imageLinks?.thumbnail;
        if (!description) {
          description = item.volumeInfo?.description;
        }
      }
    } catch (error) {
      console.error('Error searching Google Books for cover:', error);
    }
  }

  const { data: newBook, error } = await supabaseClient
    .from('books')
    .insert({
      slug,
      title: reference.title,
      author: reference.author,
      cover_url: coverUrl,
      description: description?.substring(0, 1000),
    })
    .select('id')
    .single();

  if (error) throw error;
  return newBook.id;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { bookId, bookTitle, bookAuthor } = await req.json();

    let sourceBook;

    if (bookId) {
      const { data, error } = await supabaseClient
        .from('books')
        .select('id, title, author')
        .eq('id', bookId)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Source book not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      sourceBook = data;
    } else if (bookTitle) {
      const sourceBookSlug = bookTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data, error } = await supabaseClient
        .from('books')
        .select('id, title, author')
        .eq('slug', sourceBookSlug)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Source book not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      sourceBook = data;
    } else {
      return new Response(
        JSON.stringify({ error: 'bookId or bookTitle is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const title = sourceBook.title;
    const author = sourceBook.author;

    console.log(`Discovering references for: ${title} by ${author}`);

    // Step 1: Get AI-generated candidates
    const aiRefs = await getAIReferences(title, author);
    console.log(`AI found ${aiRefs.length} candidate references`);

    // Step 2: Get Google Books mentions
    const googleRefs = await searchGoogleBooksMentions(title, author);
    console.log(`Google Books found ${googleRefs.length} verified mentions`);

    // Step 3: Combine and deduplicate
    const referenceMap = new Map<string, BookReference>();

    for (const ref of googleRefs) {
      const key = `${ref.title.toLowerCase()}|${ref.author.toLowerCase()}`;
      if (!referenceMap.has(key)) {
        referenceMap.set(key, ref);
      }
    }

    for (const ref of aiRefs) {
      const key = `${ref.title.toLowerCase()}|${ref.author.toLowerCase()}`;
      if (!referenceMap.has(key)) {
        referenceMap.set(key, { ...ref, source_verified: false });
      }
    }

    const allReferences = Array.from(referenceMap.values());
    console.log(`Total unique references: ${allReferences.length}`);

    const processedRefs: ProcessedReference[] = [];

    for (const ref of allReferences) {
      try {
        const bookIdInDb = await findOrCreateBook(ref, ref.google_book_id);

        let sourceId: string;
        let referencedId: string;

        if (ref.source === 'google_books') {
          sourceId = bookIdInDb;
          referencedId = sourceBook.id;
        } else {
          sourceId = sourceBook.id;
          referencedId = bookIdInDb;
        }

        const { data: existing } = await supabaseClient
          .from('book_references')
          .select('id')
          .eq('source_book_id', sourceId)
          .eq('referenced_book_id', referencedId)
          .single();

        if (existing) {
          console.log(`Reference already exists, skipping: ${ref.title}`);
          continue;
        }

        const isVerified = ref.source === 'google_books';

        processedRefs.push({
          source_book_id: sourceId,
          referenced_book_id: referencedId,
          context: ref.context,
          source: ref.source === 'google_books' ? 'google_books' : 'ai',
          source_url: ref.source_url,
          source_verified: isVerified,
        });
      } catch (error) {
        console.error('Error processing reference:', error);
      }
    }

    if (processedRefs.length === 0) {
      // Still mark as discovered even if no new refs found
      await supabaseClient
        .from('books')
        .update({
          references_discovered: true,
          references_discovered_at: new Date().toISOString(),
        })
        .eq('id', sourceBook.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'No new references found',
          references: [],
          count: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabaseClient
      .from('book_references')
      .insert(processedRefs)
      .select();

    if (error) {
      console.error('Error inserting references:', error);
      throw error;
    }

    await supabaseClient
      .from('books')
      .update({
        references_discovered: true,
        references_discovered_at: new Date().toISOString(),
      })
      .eq('id', sourceBook.id);

    return new Response(
      JSON.stringify({
        success: true,
        references: data,
        count: data?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
