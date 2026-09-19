# Aegis

Silent distress detection for interstate travel. A black-screen phone app that
quietly signals for help, paired with a live watcher dashboard.

## Structure

```
AEGIS/
├── aegis-passenger/       Expo (React Native) app the traveler carries
├── aegis-watcher/         Next.js dashboard the trusted contact monitors
├── aegis-schema.sql       Supabase schema to run in the SQL editor
└── aegis-backend-handoff.md   Setup notes for whoever wires up Supabase
```

## Passenger app

```
cd aegis-passenger
pnpm install
pnpm exec expo start
```

Scan the QR with Expo Go. Runs in mock mode out of the box, no Supabase
connection required to demo the flow.

## Watcher dashboard

```
cd aegis-watcher
pnpm install
pnpm dev
```

Opens at `localhost:3000`. Landing page explains both sides of the product;
`/login` is the passcode gate for watchers, default passcode is `1234` unless
overridden in `.env.local`.

## Connecting to a real backend

Both apps run in mock mode until real Supabase keys are provided. See
`aegis-backend-handoff.md` for the full setup: run `aegis-schema.sql` in the
Supabase SQL editor, then drop the project URL and anon key into:

- `aegis-passenger/.env` (copy from `aegis-passenger/.env.example`)
- `aegis-watcher/.env.local` (copy from `aegis-watcher/.env.example`)

Both apps auto-detect real keys and switch out of mock mode with no code
changes needed.

## Stack

- **Passenger**: Expo SDK 57, React Native, expo-audio, expo-location
- **Watcher**: Next.js 15 App Router, TypeScript, Leaflet
- **Backend**: Supabase (Postgres, Realtime, Storage)
