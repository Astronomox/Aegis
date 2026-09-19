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

alter table watchers add column if not exists auth_id uuid;
alter table watchers add column if not exists label text;

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
drop policy if exists "Incidents: Public insert" on incidents;
drop policy if exists "Incidents: Public update" on incidents;

create policy "Incidents: Public read" on incidents for select using (true);
create policy "Incidents: Public insert" on incidents for insert with check (true);
create policy "Incidents: Public update" on incidents for update using (true);

-- Watchers: Public access for demo
drop policy if exists "Watchers: Authenticated read" on watchers;
drop policy if exists "Watchers: Authenticated insert" on watchers;
drop policy if exists "Watchers: Authenticated update" on watchers;
drop policy if exists "Watchers: Authenticated delete" on watchers;
drop policy if exists "Watchers: Public select" on watchers;
drop policy if exists "Watchers: Public insert" on watchers;
drop policy if exists "Watchers: Public update" on watchers;
drop policy if exists "Watchers: Public delete" on watchers;

create policy "Watchers: Public select" on watchers for select using (true);
create policy "Watchers: Public insert" on watchers for insert with check (true);
create policy "Watchers: Public update" on watchers for update using (true);
create policy "Watchers: Public delete" on watchers for delete using (true);

-- Pairing Codes: Public access for demo
drop policy if exists "Pairing Codes: Public insert" on pairing_codes;
drop policy if exists "Pairing Codes: Authenticated read" on pairing_codes;
drop policy if exists "Pairing Codes: Authenticated update" on pairing_codes;
drop policy if exists "Pairing Codes: Public select" on pairing_codes;
drop policy if exists "Pairing Codes: Public update" on pairing_codes;

create policy "Pairing Codes: Public insert" on pairing_codes for insert with check (true);
create policy "Pairing Codes: Public select" on pairing_codes for select using (true);
create policy "Pairing Codes: Public update" on pairing_codes for update using (true);
create policy "Pairing Codes: Public delete" on pairing_codes for delete using (true);


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
-- 4. TRIPS (Interstate Travel Safety Network)
-- ============================================
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  passenger_id text not null,
  passenger_name text not null default 'Passenger',
  bus_route text not null,
  vehicle_id text,
  departure_location text not null,
  arrival_location text not null,
  departure_time timestamptz not null default now(),
  expected_arrival timestamptz not null,
  actual_arrival timestamptz,
  status text not null default 'active' check (status in ('active', 'completed', 'alert')),
  latitude float not null default 6.5244,
  longitude float not null default 3.3792,
  emergency_contact text,
  created_at timestamptz default now()
);

create index if not exists idx_trips_passenger_id on trips(passenger_id);
create index if not exists idx_trips_status on trips(status);
create index if not exists idx_trips_created_at on trips(created_at desc);

alter table trips replica identity full;

-- 5. COMPANIES & FLEET VEHICLES (B2B Fleet Management)
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text not null,
  subscription_plan text not null default 'Starter',
  created_at timestamptz default now()
);

create table if not exists fleet_vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  plate_number text not null,
  driver_name text not null,
  route text not null,
  created_at timestamptz default now()
);

-- Enable Realtime for Trips
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'trips'
  ) then
    alter publication supabase_realtime add table trips;
  end if;
end $$;

-- Row Level Security Policies
alter table trips enable row level security;
alter table companies enable row level security;
alter table fleet_vehicles enable row level security;

drop policy if exists "Trips: Public read" on trips;
drop policy if exists "Trips: Public insert" on trips;
drop policy if exists "Trips: Public update" on trips;
drop policy if exists "Trips: Public delete" on trips;

create policy "Trips: Public read" on trips for select using (true);
create policy "Trips: Public insert" on trips for insert with check (true);
create policy "Trips: Public update" on trips for update using (true);
create policy "Trips: Public delete" on trips for delete using (true);

drop policy if exists "Companies: Public read" on companies;
create policy "Companies: Public read" on companies for select using (true);

drop policy if exists "Fleet Vehicles: Public read" on fleet_vehicles;
create policy "Fleet Vehicles: Public read" on fleet_vehicles for select using (true);


