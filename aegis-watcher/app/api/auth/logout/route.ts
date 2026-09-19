import { NextResponse } from 'next/server';
import { COOKIE_NAME, REFRESH_COOKIE_NAME } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST() {
  logger.logAuthEvent('logout');
  
  const res = NextResponse.json({ success: true });
  
  // Clear both access and refresh tokens
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  res.cookies.set(REFRESH_COOKIE_NAME, '', { maxAge: 0, path: '/' });
  
  return res;
}
