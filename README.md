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
