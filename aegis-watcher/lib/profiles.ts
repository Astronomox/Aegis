import type { PassengerProfile } from '@/types';
import { MOCK_PASSENGER_PROFILES } from './mock-data';
import { supabase, MOCK_MODE } from './supabase';

export function getLocalProfiles(): Record<string, PassengerProfile> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('aegis_passenger_profiles');
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
}

export function saveLocalProfile(passengerId: string, profile: PassengerProfile) {
  if (typeof window === 'undefined') return;
  try {
    const stored = getLocalProfiles();
    stored[passengerId] = profile;
    localStorage.setItem('aegis_passenger_profiles', JSON.stringify(stored));
  } catch (e) {
    console.error(e);
  }
}

export async function fetchPassengerProfile(passengerId: string): Promise<PassengerProfile> {
  // 1. Check Supabase Live DB first
  if (!MOCK_MODE && supabase) {
    try {
      // Query by passenger_id or pairing_code
      const { data } = await supabase
        .from('passenger_profiles')
        .select('*')
        .or(`passenger_id.eq.${passengerId},pairing_code.eq.${passengerId}`)
        .maybeSingle();

      if (data) {
        saveLocalProfile(passengerId, data as PassengerProfile);
        saveLocalProfile((data as PassengerProfile).passenger_id, data as PassengerProfile);
        return data as PassengerProfile;
      }
    } catch (e) {
      console.error('Error fetching Supabase passenger profile:', e);
    }
  }

  // 2. Check local storage
  const localMap = getLocalProfiles();
  if (localMap[passengerId]) {
    return localMap[passengerId];
  }

  // 3. Known static mock profiles (for demo accounts)
  if (MOCK_PASSENGER_PROFILES[passengerId]) {
    return MOCK_PASSENGER_PROFILES[passengerId];
  }

  // 4. Default clean profile (no fake demo health/disabilities!)
  const codeLabel = passengerId.replace(/^passenger-|^p-/, '');
  return {
    id: passengerId,
    passenger_id: passengerId,
    name: `Passenger (${codeLabel})`,
    emergency_contact_name: 'Emergency Contact',
    emergency_contact_phone: 'Not set',
    health_conditions: [],
    disabilities: [],
    pairing_code: codeLabel,
    created_at: new Date().toISOString(),
  };
}

export async function savePassengerProfile(profile: PassengerProfile): Promise<void> {
  saveLocalProfile(profile.passenger_id, profile);

  if (!MOCK_MODE && supabase) {
    try {
      await supabase
        .from('passenger_profiles')
        .upsert(profile, { onConflict: 'passenger_id' });
    } catch (e) {
      console.error(e);
    }
  }
}
