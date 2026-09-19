import { NextRequest, NextResponse } from 'next/server';
import { redeemPairingCode } from '@/lib/pairing';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { MOCK_MODE } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  logger.logApiRequest('POST', '/api/pairing/redeem');

  try {
    // Check authentication
    const session = await getSession();
    if (!session && !MOCK_MODE) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Pairing code is required' },
        { status: 400 }
      );
    }

    const cleanCode = String(code).trim().toUpperCase();

    if (cleanCode.length !== 6) {
      return NextResponse.json(
        { error: 'Pairing code must be 6 characters long' },
        { status: 400 }
      );
    }

    const watcher = await redeemPairingCode(cleanCode, session?.user?.id);

    logger.logAuthEvent('pairing_code_redeemed', session?.user?.id, { code: cleanCode });

    return NextResponse.json({ 
      success: true, 
      watcher,
    });
  } catch (error) {
    logger.logApiError('POST', '/api/pairing/redeem', error);
    
    const message = error instanceof Error ? error.message : 'Failed to redeem pairing code';
    
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
