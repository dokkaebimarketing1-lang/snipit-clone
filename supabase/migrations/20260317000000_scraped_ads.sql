create table if not exists public.scraped_ads (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  source text not null default 'meta',
  brand_name text not null,
  page_id text,
  copy_text text,
  image_url text,
  video_url text,
  snapshot_url text,
  platform text not null default 'meta',
  media_type text default 'photo',
  status text default 'active',
  country text default 'KR',
  started_at timestamptz,
  ended_at timestamptz,
  duration_days integer,
  is_sponsored boolean default false,
  categories text[] default '{}',
  metadata jsonb default '{}',
  scraped_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_scraped_ads_brand on public.scraped_ads (brand_name);
create index if not exists idx_scraped_ads_country on public.scraped_ads (country);
create index if not exists idx_scraped_ads_source on public.scraped_ads (source);
create index if not exists idx_scraped_ads_scraped_at on public.scraped_ads (scraped_at desc);
create index if not exists idx_scraped_ads_search on public.scraped_ads
  using gin (to_tsvector('simple', coalesce(brand_name, '') || ' ' || coalesce(copy_text, '')));

alter table public.scraped_ads enable row level security;
create policy "Anyone can read scraped ads" on public.scraped_ads for select using (true);
create policy "Service role can manage scraped ads" on public.scraped_ads for all using (true) with check (true);