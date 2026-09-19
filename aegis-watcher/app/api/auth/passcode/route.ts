import { NextRequest, NextResponse } from 'next/server';
import { validatePasscode } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { passcode } = await req.json();

  if (!validatePasscode(passcode)) {
