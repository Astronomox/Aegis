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

**Passenger app** (`aegis-passenger/.env`):
```
EXPO_PUBLIC_SUPABASE_URL=<project url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

**Watcher dashboard** (`aegis-watcher/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=<project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
AEGIS_PASSCODE=<pick a passcode for the dashboard login>
```

Both apps auto-detect real keys and switch out of mock mode automatically. Restart both dev servers after adding env vars (`pnpm exec expo start -c` and `pnpm dev`).

## 5. Data shape reference (already matches frontend exactly)

**incidents**
| field | type | notes |
|---|---|---|
| id | uuid | auto |
| passenger_id | uuid | FK → users.id |
| latitude | float | |
| longitude | float | |
