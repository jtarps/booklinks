-- Books added per day
create or replace view public.daily_book_counts as
select
  date_trunc('day', created_at)::date as day,
  count(*) as count
from public.books
group by 1
order by 1;

-- Most referenced books (by incoming reference count)
create or replace view public.most_referenced_books as
select
  b.id,
  b.slug,
  b.title,
  b.author,
  b.cover_url,
  count(br.id) as reference_count
from public.books b
inner join public.book_references br on br.referenced_book_id = b.id
group by b.id, b.slug, b.title, b.author, b.cover_url
order by reference_count desc;

-- Most connected books (total connections: references + referenced_by)
create or replace view public.most_connected_books as
select
  b.id,
  b.slug,
  b.title,
  b.author,
  b.cover_url,
  coalesce(outgoing.cnt, 0) + coalesce(incoming.cnt, 0) as total_connections,
  coalesce(outgoing.cnt, 0) as outgoing_refs,
  coalesce(incoming.cnt, 0) as incoming_refs
from public.books b
left join (
  select source_book_id as book_id, count(*) as cnt
  from public.book_references
  group by source_book_id
) outgoing on outgoing.book_id = b.id
left join (
  select referenced_book_id as book_id, count(*) as cnt
  from public.book_references
  group by referenced_book_id
) incoming on incoming.book_id = b.id
where coalesce(outgoing.cnt, 0) + coalesce(incoming.cnt, 0) > 0
order by total_connections desc;

-- Grant access to these views
grant select on public.daily_book_counts to anon, authenticated;
grant select on public.most_referenced_books to anon, authenticated;
grant select on public.most_connected_books to anon, authenticated;
