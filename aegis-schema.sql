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
