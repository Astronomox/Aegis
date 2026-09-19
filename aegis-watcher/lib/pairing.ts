import { supabase, MOCK_MODE } from './supabase';

/**
 * Generate a random 6-character pairing code
 */
export function generatePairingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create a pairing code for a passenger
 */
export async function createPairingCode(
  passengerId: string,
  passengerName: string
) {
  if (MOCK_MODE || !supabase) {
    return {
      id: crypto.randomUUID(),
      code: generatePairingCode(),
      passenger_id: passengerId,
      passenger_name: passengerName,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      used_at: null,
      created_at: new Date().toISOString(),
    };
  }

  const code = generatePairingCode();
  
  const { data, error } = await supabase
    .from('pairing_codes')
    .insert({
      code,
      passenger_id: passengerId,
      passenger_name: passengerName,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Redeem a pairing code (watcher adds passenger)
 */
export async function redeemPairingCode(code: string, authId?: string) {
  const cleanCode = code.trim().toUpperCase();

  if (MOCK_MODE || !supabase) {
    return {
      id: `w-mock-${Date.now()}`,
      passenger_id: `p-code-${cleanCode.toLowerCase()}`,
      label: `Passenger (${cleanCode})`,
      auth_id: authId || null,
      created_at: new Date().toISOString(),
    };
  }

  // 1. Try fetching from pairing_codes table
  let passengerId = '';
  let passengerName = 'Passenger';

  const { data: pairingCode } = await supabase
    .from('pairing_codes')
    .select('*')
    .eq('code', cleanCode)
    .maybeSingle();

  if (pairingCode) {
    passengerId = pairingCode.passenger_id;
    passengerName = pairingCode.passenger_name || 'Passenger';
  } else {
    // 2. Try fetching from passenger_profiles table
    const { data: profile } = await supabase
      .from('passenger_profiles')
      .select('*')
      .eq('pairing_code', cleanCode)
      .maybeSingle();

    if (profile) {
      passengerId = profile.passenger_id;
      passengerName = profile.name || 'Passenger';
    }
  }

  if (!passengerId) {
    // Fallback ID for demo code input
    passengerId = `passenger-${cleanCode.toLowerCase()}`;
    passengerName = `Passenger (${cleanCode})`;
  }

  // Create watcher relationship
  const insertPayload: Record<string, unknown> = {
    passenger_id: passengerId,
    label: passengerName,
  };
  if (authId) insertPayload.auth_id = authId;

  const { data: watcher, error: insertError } = await supabase
    .from('watchers')
    .insert(insertPayload)
    .select()
    .single();

  if (insertError) {
    console.log('[supabase] watcher insert notice:', insertError.message);
    return {
      id: `w-${Date.now()}`,
      passenger_id: passengerId,
      label: passengerName,
      auth_id: authId || null,
      created_at: new Date().toISOString(),
    };
  }

  return watcher;
}

/**
 * Get active pairing codes for a passenger
 */
export async function getActivePairingCodes(passengerId: string) {
  if (MOCK_MODE || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('pairing_codes')
    .select('*')
    .eq('passenger_id', passengerId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
