export interface Incident {
  id: string;
  passenger_id: string;
  latitude: number;
  longitude: number;
  trigger_type: 'manual' | 'audio';
  audio_url: string | null;
  status: 'active' | 'resolved';
  created_at: string;
}

export interface User {
  id: string;
  phone_number: string;
  name: string;
  created_at: string;
}

export interface Watcher {
  id: string;
  passenger_id: string;
  watcher_phone: string;
}
