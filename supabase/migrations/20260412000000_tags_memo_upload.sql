-- ============================================
-- Ensure base tables exist before altering
-- ============================================

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'light', 'basic', 'premium')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  folder_id uuid references public.folders on delete set null,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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
  created_at timestamptz default now()
);

create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  query text not null,
  mode text default 'similarity' check (mode in ('similarity', 'copywrite')),
  results_count integer default 0,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.boards enable row level security;
alter table public.saved_ads enable row level security;
alter table public.search_history enable row level security;

DO $$ BEGIN CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can CRUD own folders" ON public.folders FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can CRUD own boards" ON public.boards FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can CRUD own saved_ads" ON public.saved_ads FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can CRUD own search_history" ON public.search_history FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- Tags, Memo, Upload columns for saved_ads
-- ============================================

-- 매체 태그 (단일 선택)
ALTER TABLE public.saved_ads
  ADD COLUMN IF NOT EXISTS media_tag text CHECK (media_tag IN (
    '메타','네이버GFA','구글','크리테오','데이블','타불라','틱톡','당근','릴스','쇼츠','기타'
  ));

-- 해시태그 (복수 선택, 자유 입력)
ALTER TABLE public.saved_ads
  ADD COLUMN IF NOT EXISTS hashtags text[] DEFAULT '{}';

-- 메모
ALTER TABLE public.saved_ads
  ADD COLUMN IF NOT EXISTS memo text;

-- 업로드된 파일인지 구분 (URL 저장 vs 직접 업로드)
ALTER TABLE public.saved_ads
  ADD COLUMN IF NOT EXISTS is_uploaded boolean DEFAULT false;

-- 인덱스: 매체 태그 필터링용
CREATE INDEX IF NOT EXISTS idx_saved_ads_media_tag ON public.saved_ads (media_tag);

-- 인덱스: 해시태그 GIN 검색용
CREATE INDEX IF NOT EXISTS idx_saved_ads_hashtags ON public.saved_ads USING GIN (hashtags);

-- ============================================
-- Supabase Storage bucket for ad uploads
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ad-uploads',
  'ad-uploads',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: 인증된 사용자만 자기 폴더에 업로드
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ad-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: 모든 사용자 읽기 가능 (public bucket)
CREATE POLICY "Public read access for ad-uploads"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'ad-uploads');

-- Storage RLS: 자기 파일만 삭제
CREATE POLICY "Users can delete own uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'ad-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
