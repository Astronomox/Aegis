import { NextRequest, NextResponse } from 'next/server';
import { createPairingCode } from '@/lib/pairing';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  logger.logApiRequest('POST', '/api/pairing/generate');

  try {
    const { passengerId, passengerName } = await req.json();

    if (!passengerId || !passengerName) {
      return NextResponse.json(
        { error: 'Passenger ID and name are required' },
        { status: 400 }
      );
    }

    const pairingCode = await createPairingCode(passengerId, passengerName);

    logger.logAuthEvent('pairing_code_generated', undefined, { passengerId });

    return NextResponse.json({ 
      success: true, 
      code: pairingCode.code,
      expiresAt: pairingCode.expires_at,
    });
  } catch (error) {
    logger.logApiError('POST', '/api/pairing/generate', error);
    return NextResponse.json(
      { error: 'Failed to generate pairing code' },
      { status: 500 }
    );
  }
}
