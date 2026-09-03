# Aegis — Pitch

## The Problem

Interstate bus travel in Nigeria is a daily necessity for millions of people.
It is also one of the most dangerous journeys they take. Armed robbery,
kidnapping, and abduction happen on these roads with alarming frequency.

When it happens, the passenger faces an impossible situation: making a phone
call or sending a text is visible. It escalates the danger. In the worst
moments, speaking is fatal.

There is no good solution for this moment. Not yet.

---

## What Aegis Does

Aegis is a two-sided distress system built for exactly that moment.

**On the passenger's side:** a black-screen mobile app that looks powered off.
Before boarding, the traveler opens Aegis and leaves it running. It listens in
the background. If something goes wrong, they either double-tap the dark screen
(invisible to a threat) or the app detects a loud distress event through the
mic. Either way, a silent SOS fires — sending GPS coordinates and an audio clip
to their watcher — with no visible action, no call, no sound.

**On the watcher's side:** a live web dashboard that turns silent into visible
the instant it matters. Incidents appear on a real-time map. The watcher sees
the passenger's location, hears the audio clip, and can act: call for help,
alert authorities, or coordinate a response. Each incident is logged with full
metadata and can be resolved once handled.

---

## The Demo (What You'll See Today)

1. Open Aegis on a phone. The screen is black.
2. Double-tap it. Watch the watcher dashboard — an alert appears on the map
   instantly, with the exact location pinned in Lagos.
3. The Telegram notification fires within a second.
4. Click the incident. You get coordinates, trigger type, a Google Maps link,
   and optionally a playable audio clip.
5. Mark it resolved.

That's the full loop. Passenger in distress → watcher sees it → watcher acts.
No calls. No texts. No visible sign on the passenger's end.

---

## Why Now

- Lagos–Abuja alone moves over 1 million people a week by road
- Kidnapping incidents on Nigerian highways increased 67% from 2021 to 2023
- Every existing solution (panic buttons, GPS trackers) requires visible action
  or dedicated hardware — Aegis requires neither
- Smartphones are already in everyone's pocket

---

## Traction (Day One)

- Fully working end-to-end: passenger app → Supabase → watcher dashboard
- Real-time incident map with Leaflet + Supabase Realtime
- Audio capture and playback
- Telegram push alerts
- Supabase email+password auth for watchers
- Multi-passenger management (watchers can watch multiple people)
- Pricing model designed, Free tier live

---

## Business Model

| Tier | Price | Who It's For |
|---|---|---|
| **Free** | ₦0 | Personal use, 1 watcher |
| **Personal** | ₦1,500/mo | Frequent travelers, audio detection, 5 watchers |
| **Family** | ₦3,500/mo | Shared family dashboard, 10 passengers |

Revenue path: B2C subscriptions → B2B (transport companies, corporate travel
desks) → partnerships with emergency response networks.

---

## The Stack

- **Passenger app:** Expo (React Native), expo-audio, expo-location, AsyncStorage
- **Watcher dashboard:** Next.js 15 App Router, TypeScript, Leaflet, Supabase Realtime
- **Backend:** Supabase (Postgres, Auth, Realtime, Storage, Edge Functions)
- **Alerts:** Telegram Bot API via Supabase Edge Function

---

## What's Next

- Background/locked-screen operation (the biggest UX gap, solvable with a dev build)
- In-app passenger ID sharing (QR code from passenger → watcher)
- SMS fallback for watchers without Telegram
- 24/7 professional response network integration
- iOS + Android store submission

---

## The Ask

We're looking for partners who can help us scale the response side — emergency
coordinators, transport companies, and anyone who believes that safety
infrastructure should exist for everyday people, not just corporations.

Aegis is live, it works, and it was built in a weekend.
