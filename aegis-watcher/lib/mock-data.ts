import type { Incident, Trip, Company, FleetVehicle } from '@/types';

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'mock-001',
    passenger_id: 'user-001',
    latitude: 7.8023,
    longitude: 6.7331, // Lokoja - Abuja Highway
    trigger_type: 'manual',
    audio_url: null,
    status: 'active',
    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(), // 4 min ago
  },
  {
    id: 'mock-002',
    passenger_id: 'user-002',
    latitude: 6.7452,
    longitude: 4.8721, // Ore-Benin Expressway
    trigger_type: 'manual',
    audio_url: null,
    status: 'active',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
  },
  {
    id: 'mock-003',
    passenger_id: 'user-001',
    latitude: 7.3775,
    longitude: 3.9470,
    trigger_type: 'manual',
    audio_url: null,
    status: 'resolved',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hrs ago
  },
];

export const MOCK_TRIPS: Trip[] = [
  {
    id: 'trip-101',
    passenger_id: 'user-001',
    passenger_name: 'Aisha Bello',
    bus_route: 'Lagos ➔ Abuja (Expressway)',
    vehicle_id: 'GIGM - Bus #1042',
    departure_location: 'Lagos (Jibowu Terminal)',
    arrival_location: 'Abuja (Utako Terminal)',
    departure_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    expected_arrival: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    latitude: 7.8023,
    longitude: 6.7331,
    emergency_contact: '+234 803 111 2222',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'trip-102',
    passenger_id: 'user-002',
    passenger_name: 'Emeka Okafor',
    bus_route: 'Lagos ➔ Benin City',
    vehicle_id: 'Peace Mass - Bus #408',
    departure_location: 'Lagos (Yaba)',
    arrival_location: 'Benin City (Uselu)',
    departure_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    expected_arrival: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    latitude: 6.7452,
    longitude: 4.8721,
    emergency_contact: '+234 802 333 4444',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'trip-103',
    passenger_id: 'demo-passenger-001',
    passenger_name: 'Demo Passenger',
    bus_route: 'Abuja ➔ Port Harcourt',
    vehicle_id: 'ABC Transport - Bus #202',
    departure_location: 'Abuja (Utako)',
    arrival_location: 'Port Harcourt (Waterlines)',
    departure_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expected_arrival: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // Missed checkout by 10 mins!
    status: 'alert',
    latitude: 6.1624,
    longitude: 6.7821,
    emergency_contact: '+234 809 888 9999',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'trip-104',
    passenger_id: 'user-003',
    passenger_name: 'Fatima Ibrahim',
    bus_route: 'Ibadan ➔ Kaduna',
    vehicle_id: 'Chisco Express - Bus #889',
    departure_location: 'Ibadan (Iwo Road)',
    arrival_location: 'Kaduna (Mando)',
    departure_time: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    expected_arrival: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    actual_arrival: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    status: 'completed',
    latitude: 10.5105,
    longitude: 7.4165,
    emergency_contact: '+234 805 444 5555',
    created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_USERS: Record<string, string> = {
  'user-001': 'Aisha Bello',
  'user-002': 'Emeka Okafor',
  'user-003': 'Fatima Ibrahim',
  'demo-passenger-001': 'Demo Passenger',
};

export const MOCK_COMPANIES: Company[] = [
  { id: 'c-1', name: 'God Is Good Motors (GIGM)', contact_email: 'dispatch@gigm.ng', subscription_plan: 'Growth', created_at: new Date().toISOString() },
  { id: 'c-2', name: 'Peace Mass Transit', contact_email: 'safety@peacemass.com', subscription_plan: 'Growth', created_at: new Date().toISOString() },
  { id: 'c-3', name: 'ABC Transport Plc', contact_email: 'operations@abctransport.com', subscription_plan: 'Enterprise', created_at: new Date().toISOString() },
];

export const MOCK_DANGER_ZONES = [
  {
    id: 'dz-1',
    name: 'Lokoja - Abuja Highway Corridor',
    route: 'Lagos ➔ Abuja (Expressway)',
    risk_level: 'CRITICAL',
    latitude: 7.8023,
    longitude: 6.7331,
    radius_km: 25,
    description: 'Frequent evening robbery & ambush reports near Koton-Karfe stretch.',
    advisory: 'Maintain steady speed. Escort convoy recommended after 18:00.',
  },
  {
    id: 'dz-2',
    name: 'Ore - Benin Expressway Bypass',
    route: 'Lagos ➔ Benin City',
    risk_level: 'HIGH',
    latitude: 6.7452,
    longitude: 4.8721,
    radius_km: 18,
    description: 'Sparse GSM cell coverage and localized highway distress pings.',
    advisory: 'Keep Aegis Safe Trip timer active. Emergency SMS operates on 2G.',
  },
  {
    id: 'dz-3',
    name: 'Kaduna - Abuja Expressway Junction',
    route: 'Ibadan ➔ Kaduna',
    risk_level: 'CRITICAL',
    latitude: 9.8512,
    longitude: 7.4125,
    radius_km: 30,
    description: 'High-risk security zone. FRSC & Military patrol checkpoints active.',
    advisory: 'Pass through before dusk. One-tap SOS ready on Aegis app.',
  },
];

