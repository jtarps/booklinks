interface DiscoverReferencesResponse {
  success: boolean;
  references?: any[];
  count?: number;
  message?: string;
  error?: string;
}

export async function discoverReferences(bookId: string): Promise<DiscoverReferencesResponse> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/book-references`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ bookId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to discover references');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error discovering references:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function hasDiscoveredReferences(bookId: string): Promise<boolean> {
  try {
    const { supabase } = await import('./supabase-browser');
    const { data, error } = await supabase
      .from('books')
      .select('references_discovered')
      .eq('id', bookId)
      .single();

    if (error || !data) return false;
    return data.references_discovered === true;
  } catch (error) {
    console.error('Error checking discovery status:', error);
    return false;
  }
}
