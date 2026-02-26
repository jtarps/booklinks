-- Reading lists
create table if not exists public.reading_lists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  is_public boolean default true,
  slug text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_reading_lists_user on public.reading_lists(user_id);
create index idx_reading_lists_slug on public.reading_lists(slug);

alter table public.reading_lists enable row level security;

create policy "Public lists viewable by everyone"
  on public.reading_lists for select
  using (is_public = true or auth.uid() = user_id);

create policy "Users manage own lists"
  on public.reading_lists for insert
  with check (auth.uid() = user_id);

create policy "Users update own lists"
  on public.reading_lists for update
  using (auth.uid() = user_id);

create policy "Users delete own lists"
  on public.reading_lists for delete
  using (auth.uid() = user_id);

-- Reading list items
create table if not exists public.reading_list_items (
  id uuid default gen_random_uuid() primary key,
  reading_list_id uuid references public.reading_lists(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  position integer default 0,
  notes text,
  created_at timestamptz default now(),
  unique(reading_list_id, book_id)
);

create index idx_reading_list_items_list on public.reading_list_items(reading_list_id);
create index idx_reading_list_items_book on public.reading_list_items(book_id);

alter table public.reading_list_items enable row level security;

create policy "List items viewable if list is viewable"
  on public.reading_list_items for select
  using (
    exists (
      select 1 from public.reading_lists rl
      where rl.id = reading_list_id
      and (rl.is_public = true or rl.user_id = auth.uid())
    )
  );

create policy "Users manage items in own lists"
  on public.reading_list_items for insert
  with check (
    exists (
      select 1 from public.reading_lists rl
      where rl.id = reading_list_id and rl.user_id = auth.uid()
    )
  );

create policy "Users update items in own lists"
  on public.reading_list_items for update
  using (
    exists (
      select 1 from public.reading_lists rl
      where rl.id = reading_list_id and rl.user_id = auth.uid()
    )
  );

create policy "Users delete items from own lists"
  on public.reading_list_items for delete
  using (
    exists (
      select 1 from public.reading_lists rl
      where rl.id = reading_list_id and rl.user_id = auth.uid()
    )
  );

-- Reference upvotes
create table if not exists public.reference_upvotes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  reference_id uuid references public.book_references(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, reference_id)
);

create index idx_reference_upvotes_ref on public.reference_upvotes(reference_id);
create index idx_reference_upvotes_user on public.reference_upvotes(user_id);

alter table public.reference_upvotes enable row level security;

create policy "Upvotes viewable by everyone"
  on public.reference_upvotes for select
  using (true);

create policy "Users manage own upvotes"
  on public.reference_upvotes for insert
  with check (auth.uid() = user_id);

create policy "Users delete own upvotes"
  on public.reference_upvotes for delete
  using (auth.uid() = user_id);

-- Reference comments
create table if not exists public.reference_comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  reference_id uuid references public.book_references(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_reference_comments_ref on public.reference_comments(reference_id);
create index idx_reference_comments_user on public.reference_comments(user_id);

alter table public.reference_comments enable row level security;

create policy "Comments viewable by everyone"
  on public.reference_comments for select
  using (true);

create policy "Users create own comments"
  on public.reference_comments for insert
  with check (auth.uid() = user_id);

create policy "Users update own comments"
  on public.reference_comments for update
  using (auth.uid() = user_id);

create policy "Users delete own comments"
  on public.reference_comments for delete
  using (auth.uid() = user_id);
