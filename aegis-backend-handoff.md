# Aegis: Backend Handoff

Frontend (Passenger App + Watcher Dashboard) is built and expects a Supabase backend with the shape below. Everything on the frontend side is already wired to read these exact table names, field names, and env var names. Just provision Supabase and drop the keys in. No frontend code needs to change.

## 1. Create the Supabase project
- supabase.com → New Project → name it `aegis`
- Save the DB password somewhere safe

## 2. Run the schema
Run the attached `aegis-schema.sql` in the Supabase SQL Editor (one shot). It creates:
- `users` table (passengers)
- `watchers` table (linked to a passenger)
- `incidents` table (the core table both apps read/write)
- Enables Realtime on `incidents`
- Sets open RLS policies (fine for hackathon speed, tighten later)
- Creates the `audio-clips` storage bucket

## 3. Grab the keys
Project Settings → API → copy:
- Project URL
- `anon` public key

## 4. Drop keys into both apps

