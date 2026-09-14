-- ============================================
-- AEGIS: Supabase Schema
-- Safe to re-run — all statements are idempotent
-- ============================================

-- 1. INCIDENTS (core table for the demo)
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  passenger_id text not null check (char_length(passenger_id) >= 1),
  latitude float not null check (latitude between -90 and 90),
  longitude float not null check (longitude between -180 and 180),
  trigger_type text not null check (trigger_type in ('manual', 'audio')),
  audio_url text check (audio_url ~* '^https?://'),
  status text not null default 'active' check (status in ('active', 'resolved')),
  created_at timestamptz default now()
);

-- Indexes for incident queries
create index if not exists idx_incidents_passenger_id on incidents(passenger_id);
create index if not exists idx_incidents_status on incidents(status);
create index if not exists idx_incidents_created_at on incidents(created_at desc);
create index if not exists idx_incidents_passenger_status on incidents(passenger_id, status);

-- Required for realtime UPDATE events to carry the full new row
alter table incidents replica identity full;

-- 2. WATCHERS (passenger-watcher relationships)
create table if not exists watchers (
  id uuid primary key default gen_random_uuid(),
  passenger_id text not null check (char_length(passenger_id) >= 1),
  label text check (char_length(label) <= 100),
  auth_id uuid,
  created_at timestamptz default now()
);

-- Index for watcher queries
create index if not exists idx_watchers_passenger_id on watchers(passenger_id);
create index if not exists idx_watchers_auth_id on watchers(auth_id);

-- 3. PAIRING CODES (for passenger-watcher pairing)
create table if not exists pairing_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) = 6),
  passenger_id text not null check (char_length(passenger_id) >= 1),
  passenger_name text check (char_length(passenger_name) <= 100),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  used_at timestamptz,
  created_at timestamptz default now()
);

-- Index for pairing code lookups
create index if not exists idx_pairing_codes_code on pairing_codes(code);
create index if not exists idx_pairing_codes_passenger_id on pairing_codes(passenger_id);
create index if not exists idx_pairing_codes_expires_at on pairing_codes(expires_at);

-- ============================================
-- ENABLE REALTIME (skip if already added)
-- ============================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'incidents'
  ) then
    alter publication supabase_realtime add table incidents;
  end if;
end $$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table incidents enable row level security;
alter table watchers enable row level security;
alter table pairing_codes enable row level security;

-- Incidents: Public read for demo, authenticated write
drop policy if exists "Incidents: Public read" on incidents;
drop policy if exists "Incidents: Authenticated insert" on incidents;
drop policy if exists "Incidents: Authenticated update" on incidents;

create policy "Incidents: Public read" on incidents for select using (true);
create policy "Incidents: Authenticated insert" on incidents for insert with check (auth.uid() is not null);
create policy "Incidents: Authenticated update" on incidents for update using (auth.uid() is not null);

-- Watchers: Authenticated users can manage watchers
drop policy if exists "Watchers: Authenticated read" on watchers;
drop policy if exists "Watchers: Authenticated insert" on watchers;
drop policy if exists "Watchers: Authenticated update" on watchers;
drop policy if exists "Watchers: Authenticated delete" on watchers;

create policy "Watchers: Authenticated read" on watchers for select using (auth.uid() is not null);
create policy "Watchers: Authenticated insert" on watchers for insert with check (auth.uid() is not null);
create policy "Watchers: Authenticated update" on watchers for update using (auth.uid() is not null);
create policy "Watchers: Authenticated delete" on watchers for delete using (auth.uid() is not null);

-- Pairing Codes: Public insert (for passengers), authenticated read/write
drop policy if exists "Pairing Codes: Public insert" on pairing_codes;
drop policy if exists "Pairing Codes: Authenticated read" on pairing_codes;
drop policy if exists "Pairing Codes: Authenticated update" on pairing_codes;

create policy "Pairing Codes: Public insert" on pairing_codes for insert with check (true);
create policy "Pairing Codes: Authenticated read" on pairing_codes for select using (auth.uid() is not null);
create policy "Pairing Codes: Authenticated update" on pairing_codes for update using (auth.uid() is not null);

-- ============================================
-- STORAGE BUCKET for audio clips
-- ============================================
insert into storage.buckets (id, name, public)
values ('audio-clips', 'audio-clips', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Public read audio-clips') then
    create policy "Public read audio-clips"
    on storage.objects for select
    using (bucket_id = 'audio-clips');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Anyone can upload audio-clips') then
    create policy "Anyone can upload audio-clips"
    on storage.objects for insert
    with check (bucket_id = 'audio-clips');
  end if;
end $$;

-- ============================================
-- DEMO USER FOR MOCK MODE
-- ============================================
-- Note: This is for reference only. In mock mode, the app uses hardcoded credentials.
-- For production, create real users via Supabase Auth.
-- Demo credentials: watcher@aegis.demo / aegis1234
