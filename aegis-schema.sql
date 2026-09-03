-- ============================================
-- AEGIS: Supabase Schema
-- Run this in Supabase SQL Editor (one shot)
-- ============================================

-- 1. USERS (passengers)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_number text not null,
  created_at timestamptz default now()
);

-- 2. WATCHERS (linked to a passenger)
create table if not exists watchers (
  id uuid primary key default gen_random_uuid(),
  passenger_id uuid references users(id) on delete cascade,
  watcher_phone text not null,
  created_at timestamptz default now()
);

-- 3. INCIDENTS (the core table both apps read/write)
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  passenger_id uuid references users(id),
  latitude float not null,
  longitude float not null,
  trigger_type text not null check (trigger_type in ('manual', 'audio')),
  audio_url text,
  status text not null default 'active' check (status in ('active', 'resolved')),
  created_at timestamptz default now()
);

-- Required for realtime UPDATE events to include full row data
alter table incidents replica identity full;

-- ============================================
-- ENABLE REALTIME on incidents
-- (Supabase dashboard: Database > Replication > toggle "incidents" on
--  OR run this if using the SQL-based publication approach)
-- ============================================
alter publication supabase_realtime add table incidents;

-- ============================================
-- ROW LEVEL SECURITY
-- For hackathon speed: open policies (tighten later for production)
-- ============================================
alter table users enable row level security;
alter table watchers enable row level security;
alter table incidents enable row level security;

create policy "Allow all on users" on users for all using (true) with check (true);
create policy "Allow all on watchers" on watchers for all using (true) with check (true);
create policy "Allow all on incidents" on incidents for all using (true) with check (true);

-- ============================================
-- STORAGE BUCKET for audio clips
-- Run this too, or create manually in Dashboard > Storage
-- ============================================
insert into storage.buckets (id, name, public)
values ('audio-clips', 'audio-clips', true)
on conflict (id) do nothing;

create policy "Public read audio-clips"
on storage.objects for select
using (bucket_id = 'audio-clips');

create policy "Anyone can upload audio-clips"
on storage.objects for insert
with check (bucket_id = 'audio-clips');
