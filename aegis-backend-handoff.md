# Aegis: Backend Setup Guide

Both apps are fully wired — just provision Supabase, drop in the keys, and they go live. No code changes needed.

---

## Step 1 — Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project → name it `aegis`
2. Save the DB password somewhere safe
3. Wait for the project to spin up (~1 min)

---

## Step 2 — Run the schema

Paste the entire contents of `aegis-schema.sql` into the Supabase **SQL Editor** and click Run.

This creates:
- `users` table (passengers — not required for the demo but kept for future use)
- `watchers` table
- `incidents` table — the core table both apps share
- Realtime enabled on `incidents`
- Open RLS policies (anyone with the anon key can read/write — fine for hackathon)
- `audio-clips` storage bucket (public)

> **Note:** `incidents.passenger_id` is `text`, not a UUID FK. This lets the hardcoded
> `'demo-passenger-001'` string from the mobile app insert without errors.

---

## Step 3 — Grab the keys

**Project Settings → API**, copy:
- **Project URL** — looks like `https://abcdefgh.supabase.co`
- **anon public key** — the long `eyJ...` JWT

---

## Step 4 — Add keys to both apps

**`aegis-passenger/.env`** (already created, just fill in the values):
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**`aegis-watcher/.env.local`** (already created, just fill in the values):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
AEGIS_PASSCODE=1234
```

Both apps auto-detect real keys and switch out of mock mode. Restart after editing:
- Passenger: `pnpm exec expo start -c` (the `-c` clears the Expo cache)
- Watcher: `pnpm dev` (from `aegis-watcher/`)

---

## Step 5 — Telegram alerts (optional but impressive)

A Supabase Edge Function is at `supabase/functions/notify-watcher/index.ts`.  
It fires on every incident INSERT and sends a Telegram message with the passenger name, trigger type, timestamp, and a Google Maps link.

### Get a Telegram bot
1. Message [@BotFather](https://t.me/BotFather) → `/newbot` → follow prompts → copy the token
2. Add the bot to a group (or use a DM) and send any message to it
3. Get the chat ID: `https://api.telegram.org/bot<TOKEN>/getUpdates` — find `chat.id` in the response

### Deploy the function
```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login and link to your project
supabase login
supabase link --project-ref <your-project-ref>

# Set secrets
supabase secrets set TELEGRAM_BOT_TOKEN=<your-token>
supabase secrets set TELEGRAM_CHAT_ID=<your-chat-id>

# Deploy
supabase functions deploy notify-watcher
```

### Wire up the webhook
In the Supabase dashboard: **Database → Webhooks → Create a new hook**
- Name: `on_incident_insert`
- Table: `incidents`
- Events: `INSERT`
- Type: **Supabase Edge Functions**
- Edge Function: `notify-watcher`

That's it. Every distress signal from the passenger app now pings Telegram instantly.

---

## Data shape reference

**incidents**
| field | type | notes |
|---|---|---|
| id | uuid | auto |
| passenger_id | **text** | hardcoded `'demo-passenger-001'` in mobile app |
| latitude | float | |
| longitude | float | |
| trigger_type | text | `'manual'` or `'audio'` |
| audio_url | text | nullable, public URL from `audio-clips` bucket |
| status | text | `'active'` or `'resolved'` |
| created_at | timestamptz | auto |

**users** (not used by demo flow, kept for future)
| field | type |
|---|---|
| id | uuid |
| name | text |
| phone_number | text |

---

## Quick start checklist

- [ ] Created Supabase project
- [ ] Ran `aegis-schema.sql` in SQL Editor
- [ ] Filled in `aegis-passenger/.env`
- [ ] Filled in `aegis-watcher/.env.local`
- [ ] Restarted both dev servers
- [ ] (Optional) Deployed `notify-watcher` Edge Function
- [ ] (Optional) Created Database Webhook pointing to `notify-watcher`
