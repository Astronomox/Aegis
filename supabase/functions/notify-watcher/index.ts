// Supabase Edge Function: notify-watcher
// Fires on every INSERT into the incidents table via a Database Webhook.
//
// Set up in Supabase Dashboard:
//   Database → Webhooks → Create new webhook
//     Table: incidents
//     Events: INSERT
//     Type: Supabase Edge Functions
//     Edge Function: notify-watcher
//
// Required secrets (set via: supabase secrets set KEY=value):
//   TELEGRAM_BOT_TOKEN   — from BotFather
//   TELEGRAM_CHAT_ID     — the chat/group to send alerts to

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

interface IncidentRecord {
  id: string;
  passenger_id: string;
  latitude: number;
  longitude: number;
  trigger_type: 'manual' | 'audio';
  audio_url: string | null;
  status: string;
  created_at: string;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: IncidentRecord;
  schema: string;
}

// Friendly name lookup — mirrors the watcher dashboard's MOCK_USERS
const PASSENGER_NAMES: Record<string, string> = {
  'demo-passenger-001': 'Demo Passenger',
  'user-001': 'Aisha Bello',
  'user-002': 'Emeka Okafor',
  'user-003': 'Fatima Ibrahim',
};

function passengerName(id: string): string {
  return PASSENGER_NAMES[id] ?? `Passenger ${id.slice(0, 8)}`;
}

function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function formatMessage(inc: IncidentRecord): string {
  const name = passengerName(inc.passenger_id);
  const trigger = inc.trigger_type === 'audio' ? '🎙️ audio detection' : '👆 manual tap';
  const time = new Date(inc.created_at).toLocaleTimeString('en-NG', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos',
  });
  const coords = `${inc.latitude.toFixed(5)}, ${inc.longitude.toFixed(5)}`;
  const mapLink = mapsUrl(inc.latitude, inc.longitude);

  return [
    `🚨 *AEGIS ALERT*`,
    ``,
    `*Passenger:* ${name}`,
    `*Trigger:* ${trigger}`,
    `*Time:* ${time} (Lagos)`,
    `*Location:* \`${coords}\``,
    ``,
    `[📍 Open in Google Maps](${mapLink})`,
    inc.audio_url && !inc.audio_url.startsWith('mock://')
      ? `[🔊 Audio clip](${inc.audio_url})`
      : '',
  ].filter(Boolean).join('\n');
}

serve(async (req) => {
  // Supabase sends a POST with the webhook payload
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

  if (!botToken || !chatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    // Return 200 so Supabase doesn't keep retrying — log the config issue instead
    return new Response('Telegram not configured', { status: 200 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Only act on incident INSERTs
  if (payload.type !== 'INSERT' || payload.table !== 'incidents') {
    return new Response('Ignored', { status: 200 });
  }

  const incident = payload.record;
  const message = formatMessage(incident);

  const telegramRes = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
    }
  );

  if (!telegramRes.ok) {
    const err = await telegramRes.text();
    console.error('Telegram API error:', err);
    return new Response('Telegram send failed', { status: 500 });
  }

  console.log(`Alert sent for incident ${incident.id}`);
  return new Response('OK', { status: 200 });
});
