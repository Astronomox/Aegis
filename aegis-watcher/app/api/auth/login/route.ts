import { NextRequest, NextResponse } from 'next/server';
import { signIn, buildSessionCookie } from '@/lib/auth';
import { MOCK_MODE } from '@/lib/supabase';

const MOCK_EMAIL = 'watcher@aegis.demo';
const MOCK_PASSWORD = 'aegis1234';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  // Mock mode — accept hardcoded demo credentials
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
    return NextResponse.json({ error: error?.message || 'Login failed' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  const cookie = buildSessionCookie(data.session.access_token);
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
