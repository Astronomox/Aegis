import { NextRequest, NextResponse } from 'next/server';
import { signIn, buildSessionCookie, buildRefreshCookie } from '@/lib/auth';
import { MOCK_MODE } from '@/lib/supabase';
import { rateLimit, getIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const MOCK_EMAIL = 'watcher@aegis.demo';
const MOCK_PASSWORD = 'aegis1234';

export async function POST(req: NextRequest) {
  logger.logApiRequest('POST', '/api/auth/login');

  // Rate limiting: 5 login attempts per 15 minutes
  const identifier = getIdentifier(req);
  const rateLimitResult = rateLimit(identifier, { windowMs: 15 * 60 * 1000, maxRequests: 5 });
  
  if (!rateLimitResult.success) {
    logger.warn('Rate limit exceeded for login', { identifier });
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        }
      }
    );
  }

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  // Input validation
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  // Mock mode: accept hardcoded demo credentials
  if (MOCK_MODE) {
    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      const res = NextResponse.json({ success: true, mock: true });
      const cookie = buildSessionCookie('mock-authenticated');
      res.cookies.set(cookie.name, cookie.value, cookie.options);
      return res;
    }
    return NextResponse.json(
      { error: `Demo credentials: ${MOCK_EMAIL} / ${MOCK_PASSWORD}` },
      { status: 401 }
    );
  }

  const { data, error } = await signIn(email, password);

  if (error || !data.session) {
    logger.logApiError('POST', '/api/auth/login', error);
    return NextResponse.json({ error: error?.message || 'Login failed' }, { status: 401 });
  }

  logger.logAuthEvent('login_success', data.user?.id, { email });

  const res = NextResponse.json({ success: true });
  
  // Set access token cookie (1 hour)
  const accessCookie = buildSessionCookie(data.session.access_token);
  res.cookies.set(accessCookie.name, accessCookie.value, accessCookie.options);
  
  // Set refresh token cookie (7 days)
  if (data.session.refresh_token) {
    const refreshCookie = buildRefreshCookie(data.session.refresh_token);
    res.cookies.set(refreshCookie.name, refreshCookie.value, refreshCookie.options);
  }
  
  return res;
}
