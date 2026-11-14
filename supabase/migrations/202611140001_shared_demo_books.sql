-- No accounts: deliberately shared, non-personal demo data only.
create table public.demo_books (
  id text primary key check (id ~ '^BFL-[A-Z0-9-]{3,70}$'),
  isbn text not null check (isbn ~ '^97[89][0-9]{10}$'),
  title text not null check (char_length(btrim(title)) between 1 and 300),
  authors text[] not null default '{}' check (
    cardinality(authors) <= 20 and char_length(array_to_string(authors, ', ')) <= 1000
  ),
  condition text not null check (condition in ('Like New', 'Good', 'Fair', 'Poor')),
  price_cents integer not null check (price_cents between 1 and 999999),
  metadata_source text not null check (metadata_source in ('open-library', 'demo', 'manual')),
  status text not null default 'Awaiting drop-off' check (status = 'Awaiting drop-off'),
  created_at timestamptz not null default now()
);

create index demo_books_created_at_idx on public.demo_books (created_at desc, id);
alter table public.demo_books enable row level security;
revoke all on public.demo_books from anon, authenticated;
grant select on public.demo_books to anon, authenticated;
grant insert (id, isbn, title, authors, condition, price_cents, metadata_source)
  on public.demo_books to anon, authenticated;
create policy "Shared demo books are publicly readable"
  on public.demo_books for select to anon, authenticated using (true);
create policy "Anyone may submit non-personal demo book data"
  on public.demo_books for insert to anon, authenticated with check (true);
comment on table public.demo_books is
  'Public append-only hackathon collection. Not private user records. No photos or personal data.';
