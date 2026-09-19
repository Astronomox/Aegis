-- ============================================
-- Create Watcher Relationship for Demo
-- ============================================
-- Run this in Supabase SQL Editor to set up the watchers table and demo relationship
-- 
-- NOTE: To create the auth user, go to Supabase Dashboard → Authentication → Users → Add User
-- Email: watcher@aegis.demo
-- Password: aegis1234
-- Auto-confirm user: Yes

-- 1. Drop existing watchers table if it has old schema
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'watchers') then
    drop table if exists watchers cascade;
  end if;
exception when others then null;
end $$;

-- 2. Create watchers table (simplified version)
create table if not exists watchers (
  id uuid primary key default gen_random_uuid(),
  passenger_id text not null check (char_length(passenger_id) >= 1),
  label text check (char_length(label) <= 100),
  auth_id uuid,
  created_at timestamptz default now()
);

-- 3. Enable RLS on watchers table
alter table watchers enable row level security;

-- 4. Create RLS policies for watchers (authenticated users can manage)
drop policy if exists "Watchers: Authenticated read" on watchers;
drop policy if exists "Watchers: Authenticated insert" on watchers;
drop policy if exists "Watchers: Authenticated update" on watchers;
drop policy if exists "Watchers: Authenticated delete" on watchers;

create policy "Watchers: Authenticated read" on watchers for select using (auth.uid() is not null);
create policy "Watchers: Authenticated insert" on watchers for insert with check (auth.uid() is not null);
create policy "Watchers: Authenticated update" on watchers for update using (auth.uid() is not null);
create policy "Watchers: Authenticated delete" on watchers for delete using (auth.uid() is not null);

-- 5. Create watcher relationship linking to demo passenger
insert into watchers (passenger_id, label)
values ('demo-passenger-001', 'Demo Passenger')
on conflict do nothing;
