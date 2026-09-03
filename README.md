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
