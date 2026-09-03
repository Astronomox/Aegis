import { NextRequest, NextResponse } from 'next/server';
import { validatePasscode } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { passcode } = await req.json();

  if (!validatePasscode(passcode)) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('aegis-session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
