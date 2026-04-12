-- ============================================
-- snipit.im Clone — Database Schema
-- ============================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'light', 'basic', 'premium')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Folders
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Boards
create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  folder_id uuid references public.folders on delete set null,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Saved Ads (references saved to boards)
create table if not exists public.saved_ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  board_id uuid references public.boards on delete cascade,
  platform text not null check (platform in ('meta', 'instagram', 'google', 'tiktok', 'youtube')),
  external_id text,
  image_url text,
  brand_name text,
  copy_text text,
  media_type text check (media_type in ('photo', 'video', 'reels', 'carousel')),
  status text default 'active' check (status in ('active', 'inactive')),
  published_at timestamptz,
  duration_days integer,
  is_sponsored boolean default false,
  sponsor_name text,
  metadata jsonb default '{}',
  media_tag text check (media_tag in ('메타','네이버GFA','구글','크리테오','데이블','타불라','틱톡','당근','릴스','쇼츠','기타')),
  hashtags text[] default '{}',
  memo text,
  is_uploaded boolean default false,
  category text,
  created_at timestamptz default now()
);

-- Competitors (for monitoring)
create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  platform text not null check (platform in ('meta', 'instagram', 'google', 'tiktok')),
  platform_id text,
  avatar_url text,
  country text default 'KR',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Monitoring Data (collected ad snapshots)
create table if not exists public.monitoring_data (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid references public.competitors on delete cascade not null,
  ad_snapshot_url text,
  image_url text,
  ad_text text,
  media_type text,
  status text default 'active',
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Search History
create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  query text not null,
  mode text default 'similarity' check (mode in ('similarity', 'copywrite')),
  results_count integer default 0,
  created_at timestamptz default now()
);
