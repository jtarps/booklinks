import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const metadata = {
  title: 'Reading Lists',
  description: 'Browse public reading lists curated by the BookLinks community.',
};

export default async function ListsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: rawLists } = await supabase
    .from('reading_lists')
    .select(`
      id, name, description, slug, created_at, user_id,
      items:reading_list_items(count)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch profiles for list owners
  const userIds = Array.from(new Set((rawLists || []).map((l: any) => l.user_id).filter(Boolean)));
  let profileMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);
    profileMap = Object.fromEntries(
      (profiles || []).map((p: any) => [p.id, p.display_name])
    );
  }

  const lists = (rawLists || []).map((list: any) => ({
    ...list,
    displayName: profileMap[list.user_id] || null,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reading Lists</h1>
      </div>

      {lists && lists.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list: any) => {
            const itemCount = Array.isArray(list.items) ? list.items[0]?.count ?? 0 : 0;
            return (
              <Link
                key={list.id}
                href={`/lists/${list.slug}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h2 className="font-semibold text-gray-900">{list.name}</h2>
                    {list.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {list.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                      <span>{itemCount} book{itemCount !== 1 ? 's' : ''}</span>
                      {list.displayName && (
                        <>
                          <span>&bull;</span>
                          <span>by {list.displayName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            No reading lists yet
          </h2>
          <p className="text-gray-600">
            Sign in and create your first reading list to get started.
          </p>
        </div>
      )}
    </div>
  );
}
