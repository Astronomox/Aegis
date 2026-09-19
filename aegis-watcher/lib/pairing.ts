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
    // Mock mode: succeed for any valid 6-character code for demo
    return {
      id: `w-mock-${Date.now()}`,
      passenger_id: `p-code-${cleanCode.toLowerCase()}`,
      label: `Passenger (${cleanCode})`,
      auth_id: authId || null,
      created_at: new Date().toISOString(),
    };
  }

  // Get the pairing code
  const { data: pairingCode, error: fetchError } = await supabase
    .from('pairing_codes')
    .select('*')
    .eq('code', cleanCode)
    .single();

  if (fetchError || !pairingCode) throw new Error('Invalid or expired pairing code');
  if (pairingCode.used_at) throw new Error('Pairing code has already been used');
  if (new Date(pairingCode.expires_at) < new Date()) throw new Error('Pairing code has expired');

  // Check if already watching this passenger
  let query = supabase
    .from('watchers')
    .select('*')
    .eq('passenger_id', pairingCode.passenger_id);
    
  if (authId) {
    query = query.eq('auth_id', authId);
  }

  const { data: existingWatcher } = await query.maybeSingle();

  if (existingWatcher) throw new Error('You are already watching this passenger');

  // Create watcher relationship
  const insertPayload: Record<string, unknown> = {
    passenger_id: pairingCode.passenger_id,
    label: pairingCode.passenger_name || 'Passenger',
  };
  if (authId) insertPayload.auth_id = authId;

  const { data: watcher, error: insertError } = await supabase
    .from('watchers')
    .insert(insertPayload)
    .select()
    .single();

  if (insertError) throw insertError;

  // Mark pairing code as used
  await supabase
    .from('pairing_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', pairingCode.id);

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
