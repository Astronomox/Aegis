import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { COOKIE_NAME } from '@/lib/auth';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow mock-authenticated demo sessions unconditionally
  if (token === 'mock-authenticated') {
    return NextResponse.next();
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      const res = NextResponse.redirect(new URL('/login', request.url));
      res.cookies.delete(COOKIE_NAME);
      return res;
    }
  } catch (err) {
    console.log('[middleware] Supabase auth check fallback:', err);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};