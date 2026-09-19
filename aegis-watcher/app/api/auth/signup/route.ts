import { NextRequest, NextResponse } from 'next/server';
import { signUp } from '@/lib/auth';
import { MOCK_MODE } from '@/lib/supabase';
import { rateLimit, getIdentifier } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  if (MOCK_MODE) {
    return NextResponse.json(
      { error: 'Sign-up not available in demo mode. Use watcher@aegis.demo / aegis1234 to log in.' },
      { status: 400 }
    );
  }

  // Rate limiting: 3 signup attempts per hour
  const identifier = getIdentifier(req);
  const rateLimitResult = rateLimit(identifier, { windowMs: 60 * 60 * 1000, maxRequests: 3 });
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '3',
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

  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json({ error: 'Password must contain at least one uppercase letter and one number' }, { status: 400 });
  }

  const { data, error } = await signUp(email, password);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, user: data.user?.id });
}
