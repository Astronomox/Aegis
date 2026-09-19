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

/**
 * Start a safe trip in DB
 */
export async function startTrip(payload) {
  if (MOCK_MODE) {
    console.log('[MOCK] trip start ->', JSON.stringify(payload, null, 2));
    return { data: { ...payload, id: 'mock-trip-' + Date.now() }, error: null };
  }
  return supabase.from('trips').insert(payload).select().single();
}

/**
 * Mark a trip completed or alert in DB
 */
export async function updateTripStatus(tripId, status, extra = {}) {
  if (MOCK_MODE) {
    console.log('[MOCK] trip update ->', tripId, status, extra);
    return { data: { id: tripId, status, ...extra }, error: null };
  }
  return supabase.from('trips').update({ status, ...extra }).eq('id', tripId);
}

/**
 * Upsert passenger profile data (name, emergency contact, health, disabilities)
 */
export async function upsertPassengerProfile(profileData) {
  if (MOCK_MODE || !supabase) {
    console.log('[MOCK] passenger profile upsert ->', profileData);
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('aegis_passenger_profiles') || '{}');
        stored[profileData.passenger_id] = { ...stored[profileData.passenger_id], ...profileData };
        localStorage.setItem('aegis_passenger_profiles', JSON.stringify(stored));
      } catch (e) {}
    }
    return { data: profileData, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('passenger_profiles')
      .upsert(profileData, { onConflict: 'passenger_id' })
      .select()
      .single();

    if (error) {
      console.log('[supabase] profile upsert notice:', error.message);
    }
    return { data, error };
  } catch (err) {
    console.log('[supabase] profile upsert catch:', err);
    return { data: profileData, error: null };
  }
}

/**
 * Fetch active watchers monitoring a passenger
 */
export async function fetchPassengerWatchers(passengerId) {
  const defaultWatchers = [
    { id: 'w-001', label: 'God Is Good Motors (GIGM) Dispatch', created_at: new Date().toISOString() },
    { id: 'w-002', label: 'Emergency Contact Watcher', created_at: new Date().toISOString() },
  ];

  if (MOCK_MODE || !supabase) {
    let list = defaultWatchers;
    if (typeof window !== 'undefined') {
      try {
        const custom = localStorage.getItem(`aegis_watchers_${passengerId}`);
        if (custom) list = JSON.parse(custom);
      } catch (e) {}
    }
    return { data: list, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('watchers')
      .select('*')
      .eq('passenger_id', passengerId)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) {
      return { data: defaultWatchers, error: null };
    }
    return { data, error: null };
  } catch (err) {
    return { data: defaultWatchers, error: null };
  }
}

/**
 * Revoke/delete a watcher for a passenger
 */
export async function deleteWatcher(watcherId, passengerId) {
  if (MOCK_MODE || !supabase) {
    console.log('[MOCK] watcher delete ->', watcherId);
    if (typeof window !== 'undefined') {
      try {
        const currentStr = localStorage.getItem(`aegis_watchers_${passengerId}`);
        const current = currentStr ? JSON.parse(currentStr) : [
          { id: 'w-001', label: 'God Is Good Motors (GIGM) Dispatch', created_at: new Date().toISOString() },
          { id: 'w-002', label: 'Emergency Contact Watcher', created_at: new Date().toISOString() },
        ];
        const updated = current.filter((w) => w.id !== watcherId);
        localStorage.setItem(`aegis_watchers_${passengerId}`, JSON.stringify(updated));
      } catch (e) {}
    }
    return { error: null };
  }

  try {
    const { error } = await supabase.from('watchers').delete().eq('id', watcherId);
    return { error };
  } catch (err) {
    return { error: null };
  }
}


