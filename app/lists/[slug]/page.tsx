import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase-server';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500';

async function getList(slug: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('reading_lists')
    .select(`
      id, name, description, slug, is_public, created_at,
      profile:profiles(display_name),
      items:reading_list_items(
        id, position, notes,
        book:books(id, slug, title, author, cover_url, description)
      )
    `)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const list = await getList(slug);

  if (!list) return { title: 'List Not Found' };

  const profile = Array.isArray(list.profile) ? list.profile[0] : list.profile;

  return {
    title: list.name,
    description: list.description || `A reading list with ${(list.items || []).length} books curated on BookLinks.`,
    openGraph: {
      title: `${list.name} | BookLinks Reading List`,
      description: list.description || `${(list.items || []).length} books curated by ${profile?.display_name || 'a BookLinks user'}.`,
      type: 'article',
    },
  };
}

export default async function ListDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const list = await getList(slug);

  if (!list) notFound();

  const profile = Array.isArray(list.profile) ? list.profile[0] : list.profile;
  const items = (list.items || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/lists"
        className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-8"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        All lists
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex items-start gap-3 mb-4">
            <BookOpen className="h-6 w-6 text-indigo-600 mt-1" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{list.name}</h1>
              {profile?.display_name && (
                <p className="text-gray-600 mt-1">by {profile.display_name}</p>
              )}
            </div>
          </div>
          {list.description && (
            <p className="text-gray-700 mb-6">{list.description}</p>
          )}

          <p className="text-sm text-gray-500 mb-8">
            {items.length} book{items.length !== 1 ? 's' : ''}
          </p>

          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item: any, index: number) => (
                <Link
                  key={item.id}
                  href={`/book/${item.book.slug}`}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-lg font-bold text-gray-300 w-8 text-center flex-shrink-0 mt-2">
                    {index + 1}
                  </span>
                  <img
                    src={item.book.cover_url || DEFAULT_COVER}
                    alt={item.book.title}
                    className="w-16 h-24 object-cover rounded shadow flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                      {item.book.title}
                    </h3>
                    <p className="text-sm text-gray-600">by {item.book.author}</p>
                    {item.notes && (
                      <p className="text-sm text-gray-500 mt-1 italic">{item.notes}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">This list is empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
