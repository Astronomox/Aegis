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

-- 2. WATCHERS
--    auth_id links to Supabase Auth (auth.users.id) so each watcher
--    has their own login. passenger_id is text (no FK) so the demo
--    string 'demo-passenger-001' works without a real users row.
create table if not exists watchers (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid not null,              -- FK → auth.users.id (Supabase Auth)
  passenger_id text not null,         -- text so demo IDs work
  label text,                         -- friendly name the watcher gives this passenger
  created_at timestamptz default now(),
  unique(auth_id, passenger_id)       -- one watcher can't add the same passenger twice
);

-- 3. INCIDENTS
--    passenger_id is text so the hardcoded 'demo-passenger-001' from
--    the mobile app inserts without a UUID FK constraint error.
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  passenger_id text,
  latitude float not null,
  longitude float not null,
  trigger_type text not null check (trigger_type in ('manual', 'audio')),
  audio_url text,
  status text not null default 'active' check (status in ('active', 'resolved')),
  created_at timestamptz default now()
);

-- Required for realtime UPDATE events to carry the full new row
alter table incidents replica identity full;

-- ============================================
-- ENABLE REALTIME
-- ============================================
alter publication supabase_realtime add table incidents;

-- ============================================
-- ROW LEVEL SECURITY
-- Open policies for hackathon speed.
-- ============================================
alter table users enable row level security;
alter table watchers enable row level security;
alter table incidents enable row level security;

create policy "Allow all on users"     on users     for all using (true) with check (true);
create policy "Allow all on watchers"  on watchers  for all using (true) with check (true);
create policy "Allow all on incidents" on incidents for all using (true) with check (true);

-- ============================================
-- STORAGE BUCKET for audio clips
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
