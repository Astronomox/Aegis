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
  return supabase.from('incidents').insert(payload);
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
