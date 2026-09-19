# Aegis

Silent distress detection for interstate travel. A black-screen phone app that
quietly signals for help, paired with a live watcher dashboard.

---

## How It Works

**Passenger side:** Open the app before you travel. The screen stays black —
nothing to explain, nothing to hide. A double-tap or loud distress sound
silently sends your GPS location and an audio clip to your chosen watcher.
send alerts through sms

**Watcher side:* Log into the dashboard from any browser. Watch live on a map.
When an alert fires, you see the location immediately, can listen to the audio
clip, open Google Maps, and mark the incident resolved when handled.

---

## Project Structure

```
Aegis/
├── aegis-passenger/       Expo (React Native) — the traveler's phone
├── aegis-watcher/         Next.js 15 — the watcher's web dashboard
├── supabase/
│   └── functions/
│       └── notify-watcher/  Edge Function — Telegram push alerts
├── sql/
│   ├── aegis-schema.sql       Full Supabase schema (run once in SQL Editor)
│   └── create-demo-user.sql   Demo user SQL helper
├── aegis-backend-handoff.md  Step-by-step Supabase setup guide
├── PITCH.md               Hackathon pitch deck in markdown
└── README.md              This file
```

---

## Quick Start

### 1. Install dependencies

From the root (uses pnpm workspaces):
```bash
pnpm install
```

### 2. Start both apps together

```bash
pnpm dev
```

Or individually:
``bash
pnpm passenger   # Expo dev server (scan QR with Expo Go)
pnpm watcher     # Next.js dev server → localhost:3000
```

### 3. Demo mode (no Supabase needed)

Both apps run in **mock mode** when no Supabase keys are present:
- Passenger app: incidents are logged to console, no real DB write
- Watcher dashboard: loads static demo incidents on the map
- Login with `watcher@aegis.demo` / `aegis1234`

---

## Connecting to a Real Backend

See `aegis-backend-handoff.md` for the full step-by-step guide. The short version:

1. Create a project at [supabase.com](https://supabase.com)
2. Run `sql/aegis-schema.sql` in the SQL Editor
3. Grab your Project URL and anon key
4. Fill in the env files:

**`aegis-passenger/.env`**
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**`aegis-watcher/.env.local`**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

5. Restart both servers — they auto-detect real keys and go live.

---

## User Flows

### Passenger (mobile app)

1. **First launch:** grant mic + location permissions, enter name and up to 3
   watcher phone numbers → data saved to Supabase, ID persisted to device
2. **Every trip:** app loads straight to the black screen (no re-setup)
3. **SOS trigger:** double-tap anywhere, or the mic detects a loud distress
   sound — either sends GPS + audio clip silently

### Watcher (web dashboard)

1. **Sign up** at `/login` with email + password (Supabase Auth)
2. **Add passengers** at `/dashboard/passengers` by pasting the passenger's
   Aegis ID (shown in the passenger app after setup)
3. **Live dashboard** at `/dashboard` — full-screen map, incident feed,
   real-time updates via Supabase Realtime
4. **Respond:** click an incident → see location, audio, coordinates → open
   in Google Maps → mark resolved

---

## Telegram Alerts

An Edge Function fires on every incident INSERT and sends a Telegram message
with passenger name, trigger type, timestamp (Lagos time), coordinates, and a
Google Maps link.

Setup: see `aegis-backend-handoff.md` → Step 5.

---

## Stack

| Layer | Technology |
|---|---|
| Passenger app | Expo SDK 57, React Native, expo-audio, expo-location, AsyncStorage |
| Watcher dashboard | Next.js 15 App Router, TypeScript, Leaflet, Supabase Realtime |
| Auth | Supabase Auth (email + password) |
| Database | Supabase Postgres |
| Realtime | Supabase Realtime (postgres_changes) |
| Storage | Supabase Storage (audio-clips bucket) |
| Push alerts | Telegram Bot API via Supabase Edge Function |
| Monorepo | pnpm workspaces + concurrently |

---

## Pricing

| Plan | Price | Features |
|---|---|---|
| Free | ₦0 | 1 watcher, manual trigger, live dashboard |
| Personal | ₦1,500/mo | 5 watchers, audio detection, Telegram alerts, 30-day history |
| Family | ₦3,500/mo | 10 passengers, shared dashboard, selected history |
| public transport companies | ₦100,000/month | 10 buses, shared dashboard, unlimited history |

---

## Environment Variables Reference

| Variable | App | Description |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | passenger | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | passenger | Supabase anon key |
| `NEXT_PUBLIC_SUPABASE_URL` | watcher | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | watcher | Supabase anon key |
| `TELEGRAM_BOT_TOKEN` | watcher `.env.local` | For Edge Function config |
| `TELEGRAM_CHAT_ID` | watcher `.env.local` | For Edge Function config |
