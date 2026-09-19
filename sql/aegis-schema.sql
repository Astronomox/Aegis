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

-- 4. PASSENGER PROFILES (dynamic mobile profile & medical needs)
create table if not exists passenger_profiles (
  id uuid primary key default gen_random_uuid(),
  passenger_id text not null unique check (char_length(passenger_id) >= 1),
  name text not null,
  emergency_contact_name text,
  emergency_contact_phone text,
  health_conditions text[],
  disabilities text[],
  pairing_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for passenger profiles
create index if not exists idx_passenger_profiles_passenger_id on passenger_profiles(passenger_id);

-- Disable RLS completely for demo
alter table incidents disable row level security;
alter table watchers disable row level security;
alter table pairing_codes disable row level security;
alter table passenger_profiles disable row level security;



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

-- Disable RLS on trips, companies, and fleet_vehicles for demo
alter table trips disable row level security;
alter table companies disable row level security;
alter table fleet_vehicles disable row level security;



