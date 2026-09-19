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
