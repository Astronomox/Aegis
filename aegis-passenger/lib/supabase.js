import { createClient } from '@supabase/supabase-js';

// On-site: paste real values into .env
//   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
//   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const MOCK_MODE = !SUPABASE_URL || !SUPABASE_ANON_KEY;

export const supabase = MOCK_MODE
  ? null
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Insert an incident row. Works identically in mock or live mode.
 */
export async function insertIncident(payload) {
  if (MOCK_MODE) {
    console.log('[MOCK] incident insert ->', JSON.stringify(payload, null, 2));
    await new Promise((r) => setTimeout(r, 300));
    return { data: { ...payload, id: 'mock-' + Date.now() }, error: null };
  }
  return supabase.from('incidents').insert(payload).select().single();
}

/**
 * Patch an already-sent incident with refined data (accurate GPS, audio
 * URL) once it's available. Fire-and-forget from the caller's side — the
 * watcher already has the initial ping and will get the row UPDATE via
 * realtime.
 */
export async function updateIncident(id, payload) {
  if (MOCK_MODE) {
    console.log('[MOCK] incident update ->', id, JSON.stringify(payload, null, 2));
    return { data: { id, ...payload }, error: null };
  }
  return supabase.from('incidents').update(payload).eq('id', id);
}

/**
 * Upload audio clip to Supabase Storage. Returns public URL.
 */
export async function uploadAudio(uri) {
  if (MOCK_MODE) {
    console.log('[MOCK] audio upload ->', uri);
    await new Promise((r) => setTimeout(r, 200));
    return 'mock://audio/distress-clip.m4a';
  }

  const filename = `clip-${Date.now()}.m4a`;
  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('audio-clips')
    .upload(filename, blob, { contentType: 'audio/m4a' });

  if (error) {
    console.log('[supabase] upload error:', error.message);
    return null;
  }

  const { data } = supabase.storage
    .from('audio-clips')
    .getPublicUrl(filename);

  return data.publicUrl;
}

/**
 * Generate a random 6-character pairing code string
 */
export function generateRandomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create a pairing code for the passenger (for watchers to add them).
 */
export async function createPassengerPairingCode(passengerId, passengerName) {
  const code = generateRandomCode();

  if (MOCK_MODE || !supabase) {
    console.log('[MOCK] pairing code created:', code, 'for passenger:', passengerId);
    return { code, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() };
  }

  const { data, error } = await supabase
    .from('pairing_codes')
    .insert({
      code,
      passenger_id: passengerId,
      passenger_name: passengerName || 'Passenger',
    })
    .select()
    .single();

  if (error) {
    console.log('[supabase] pairing code insert error:', error.message);
    throw error;
  }

  return data;
}

