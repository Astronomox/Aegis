import { NextRequest, NextResponse } from 'next/server';
import { signUp } from '@/lib/auth';
import { MOCK_MODE } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  if (MOCK_MODE) {
    return NextResponse.json(
      { error: 'Sign-up not available in demo mode. Use watcher@aegis.demo / aegis1234 to log in.' },
      { status: 400 }
    );
  }

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const { data, error } = await signUp(email, password);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, user: data.user?.id });
}
