import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export const COOKIE_NAME = 'aegis-session';

// ─── Supabase Auth helpers ────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured');
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured');
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  if (!supabase) return;
  return supabase.auth.signOut();
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ─── Cookie helpers (used by middleware + API routes) ─────────────────────────

/**
 * Store the Supabase access token in an httpOnly cookie so middleware
 * can verify auth on every dashboard request without a client round-trip.
 */
export function buildSessionCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    },
  };
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  // In mock mode any non-empty cookie value is fine for demo
  if (!supabase) return token === 'mock-authenticated';
  // Verify the JWT is still valid
  const { data } = await supabase.auth.getUser(token);
  return !!data.user;
}
