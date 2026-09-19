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

export interface Trip {
  id: string;
  passenger_id: string;
  passenger_name: string;
  bus_route: string;
  vehicle_id?: string;
  departure_location: string;
  arrival_location: string;
  departure_time: string;
  expected_arrival: string;
  actual_arrival?: string | null;
  status: 'active' | 'completed' | 'alert';
  latitude: number;
  longitude: number;
  emergency_contact?: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  contact_email: string;
  subscription_plan: 'Starter' | 'Growth' | 'Enterprise';
  created_at: string;
}

export interface FleetVehicle {
  id: string;
  company_id: string;
  plate_number: string;
  driver_name: string;
  route: string;
  created_at: string;
}

export interface DangerZone {
  id: string;
  name: string;
  route: string;
  risk_level: 'HIGH' | 'CRITICAL' | 'MODERATE';
  latitude: number;
  longitude: number;
  radius_km: number;
  description: string;
  advisory: string;
}


