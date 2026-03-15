-- ============================================
-- Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.boards enable row level security;
alter table public.saved_ads enable row level security;
alter table public.competitors enable row level security;
alter table public.monitoring_data enable row level security;
alter table public.search_history enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Folders: users can manage their own folders
create policy "Users can manage own folders" on public.folders
  for all using (auth.uid() = user_id);

-- Boards: users can manage their own boards
create policy "Users can manage own boards" on public.boards
  for all using (auth.uid() = user_id);

-- Saved Ads: users can manage their own saved ads
create policy "Users can manage own saved ads" on public.saved_ads
  for all using (auth.uid() = user_id);

-- Competitors: users can manage their own competitors
create policy "Users can manage own competitors" on public.competitors
  for all using (auth.uid() = user_id);

-- Monitoring Data: users can read monitoring data for their competitors
create policy "Users can read own monitoring data" on public.monitoring_data
  for select using (
    exists (
      select 1 from public.competitors
      where competitors.id = monitoring_data.competitor_id
      and competitors.user_id = auth.uid()
    )
  );

-- Search History: users can manage their own search history
create policy "Users can manage own search history" on public.search_history
  for all using (auth.uid() = user_id);
