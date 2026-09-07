import type { Incident } from '@/types';

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'mock-001',
    passenger_id: 'user-001',
    latitude: 6.5244,
    longitude: 3.3792,
    trigger_type: 'manual',
    audio_url: null,
    status: 'active',
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
  },
  {
    id: 'mock-002',
    passenger_id: 'user-002',
    latitude: 6.4541,
    longitude: 3.3947,
    trigger_type: 'audio',
    audio_url: 'mock://audio/distress-clip.m4a',
    status: 'active',
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 min ago
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
  {
    id: 'mock-004',
    passenger_id: 'user-003',
    latitude: 9.0579,
    longitude: 7.4951,
    trigger_type: 'audio',
    audio_url: 'mock://audio/highway-clip.m4a',
    status: 'resolved',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hrs ago
  },
  {
    id: 'mock-005',
    passenger_id: 'user-002',
    latitude: 6.5955,
    longitude: 3.3489,
    trigger_type: 'manual',
    audio_url: null,
    status: 'resolved',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
];

export const MOCK_USERS: Record<string, string> = {
  'user-001': 'Aisha Bello',
  'user-002': 'Emeka Okafor',
  'user-003': 'Fatima Ibrahim',
  // Real passenger app sends this hardcoded ID, show a friendly name
  'demo-passenger-001': 'Demo Passenger',
};
