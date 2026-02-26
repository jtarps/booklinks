import { createSupabaseServerClient } from '@/lib/supabase-server';
import { ReferenceGraph } from './ReferenceGraph';

export const metadata = {
  title: 'Explore the Book Network',
  description: 'Visualize how books connect through references — an interactive map of literary connections.',
};

export const dynamic = 'force-dynamic';

interface GraphNode {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverUrl: string | null;
  connections: number;
}

interface GraphLink {
  source: string;
  target: string;
}

export default async function ExplorePage() {
  const supabase = await createSupabaseServerClient();

  // Get all references with both books
  const { data: refs } = await supabase
    .from('book_references')
    .select(`
      source_book:books!book_references_source_book_id_fkey(id, slug, title, author, cover_url),
      referenced_book:books!book_references_referenced_book_id_fkey(id, slug, title, author, cover_url)
    `)
    .limit(500);

  const nodeMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];

  for (const ref of refs || []) {
    const src = ref.source_book as any;
    const tgt = ref.referenced_book as any;
    if (!src || !tgt) continue;

    if (!nodeMap.has(src.id)) {
      nodeMap.set(src.id, {
        id: src.id,
        slug: src.slug,
        title: src.title,
        author: src.author,
        coverUrl: src.cover_url,
        connections: 0,
      });
    }
    if (!nodeMap.has(tgt.id)) {
      nodeMap.set(tgt.id, {
        id: tgt.id,
        slug: tgt.slug,
        title: tgt.title,
        author: tgt.author,
        coverUrl: tgt.cover_url,
        connections: 0,
      });
    }

    nodeMap.get(src.id)!.connections++;
    nodeMap.get(tgt.id)!.connections++;

    links.push({ source: src.id, target: tgt.id });
  }

  const nodes = Array.from(nodeMap.values());

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Book Reference Map</h1>
        <p className="text-gray-600 mt-1">
          Explore how books connect through references. Drag to rearrange, scroll to zoom, click a book to explore it.
        </p>
      </div>
      <ReferenceGraph nodes={nodes} links={links} />
    </div>
  );
}
