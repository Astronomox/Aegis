import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const COOKIE_NAME = 'aegis-session';
export const REFRESH_COOKIE_NAME = 'aegis-refresh';

// ─── Supabase Auth helpers ────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured');
  try {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.data.session) {
      logger.logAuthEvent('signin_success', result.data.user?.id, { email });
    }
    return result;
  } catch (error) {
    logger.logAuthEvent('signin_error', undefined, { email, error });
    throw error;
  }
}

export async function signUp(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured');
  try {
    const result = await supabase.auth.signUp({ email, password });
    if (result.data.user) {
      logger.logAuthEvent('signup_success', result.data.user.id, { email });
    }
    return result;
  } catch (error) {
    logger.logAuthEvent('signup_error', undefined, { email, error });
    throw error;
  }
}

export async function signOut() {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
    logger.logAuthEvent('signout_success');
  } catch (error) {
    logger.logAuthEvent('signout_error', undefined, { error });
    throw error;
  }
}

export async function getSession() {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch (error) {
    logger.error('Failed to get session', { error });
    return null;
  }
}

export async function refreshSession(refreshToken: string) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error) throw error;
    logger.logAuthEvent('session_refreshed', data.user?.id);
    return data.session;
  } catch (error) {
    logger.logAuthEvent('session_refresh_error', undefined, { error });
    return null;
  }
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
      maxAge: 60 * 60 * 1, // 1 hour for access token
      path: '/',
    },
  };
}

export function buildRefreshCookie(token: string) {
  return {
    name: REFRESH_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days for refresh token
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
  try {
    const { data } = await supabase.auth.getUser(token);
    const isValid = !!data.user;
    
    if (!isValid) {
      logger.warn('Invalid session token detected');
    }
    
    return isValid;
  } catch (error) {
    logger.error('Session validation error', { error });
    return false;
  }
}
