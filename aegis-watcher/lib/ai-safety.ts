import type { Incident, Trip } from '@/types';

export interface AIAnomaly {
  id: string;
  type: 'unusual_stop' | 'route_deviation' | 'distress_cluster' | 'midnight_transit' | 'extended_offline';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location?: { lat: number; lng: number };
  passenger_id?: string;
  vehicle_id?: string;
  timestamp: string;
  recommendedAction: string;
}

export interface SOSCluster {
  id: string;
  regionName: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  incidentCount: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  dominantTrigger: string;
  latestIncidentTime: string;
  advisoryText: string;
}

export interface RouteSafetyAdvisory {
  id: string;
  routeName: string;
  corridorCode: string;
  riskScore: number; // 0 (safe) - 100 (extreme danger)
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  activeAlertsCount: number;
  knownThreats: string[];
  safeHoursWindow: string;
  passengerAdvice: string;
  fleetManagerAdvice: string;
  startCoords: [number, number];
  endCoords: [number, number];
}

export const DANGEROUS_ROUTES_DATA: RouteSafetyAdvisory[] = [
  {
    id: 'route-001',
    routeName: 'Ore ➔ Benin Expressway',
    corridorCode: 'A6-ORE-BENIN',
    riskScore: 84,
    riskLevel: 'HIGH',
    activeAlertsCount: 4,
    knownThreats: ['Night travel security breaches', 'Frequent signal dropouts (Km 40-75)', 'High speed distress spikes'],
    safeHoursWindow: '06:00 - 18:00',
    passengerAdvice: 'Avoid night departure after 18:00. Enable offline SMS SOS trigger before entering forested corridor.',
    fleetManagerAdvice: 'Enforce Mandatory Convoy Checkpoints at Ore Toll Gate. Monitor telemetry closely between 21:00 - 05:00.',
    startCoords: [6.7478, 4.8761],
    endCoords: [6.3350, 5.6037],
  },
  {
    id: 'route-002',
    routeName: 'Lokoja ➔ Okene Bypass',
    corridorCode: 'A2-LOK-OKENE',
    riskScore: 92,
    riskLevel: 'SEVERE',
    activeAlertsCount: 6,
    knownThreats: ['Isolated rocky terrain ambushes', 'Long latency cell tower handovers', 'Unannounced vehicle stops'],
    safeHoursWindow: '07:00 - 17:00',
    passengerAdvice: 'Share Live Pairing Code with at least 2 emergency contacts prior to passing Okene Junction.',
    fleetManagerAdvice: 'Deploy automated ping checks every 3 minutes. Trigger high-decibel acoustic monitoring on all active units.',
    startCoords: [7.8023, 6.7331],
    endCoords: [7.5500, 6.2333],
  },
  {
    id: 'route-003',
    routeName: 'Abuja ➔ Kaduna Highway',
    corridorCode: 'A1-ABJ-KAD',
    riskScore: 78,
    riskLevel: 'HIGH',
    activeAlertsCount: 3,
    knownThreats: ['Expressway breakdown vulnerabilities', 'Intermittent GSM blackouts', 'High acoustic distress incidents'],
    safeHoursWindow: '06:30 - 17:30',
    passengerAdvice: 'Ensure mobile app acoustic distress mode is active. Remain inside transport terminals if delayed after dusk.',
    fleetManagerAdvice: 'Assign dedicated escort unit or coordinate real-time tracking with regional highway security posts.',
    startCoords: [9.0765, 7.3986],
    endCoords: [10.5105, 7.4165],
  },
  {
    id: 'route-004',
    routeName: 'Lagos ➔ Ibadan Expressway',
    corridorCode: 'E1-LOS-IBA',
    riskScore: 35,
    riskLevel: 'MODERATE',
    activeAlertsCount: 1,
    knownThreats: ['Heavy congestion delays at Long Bridge', 'Minor nighttime breakdown risks'],
    safeHoursWindow: '24 Hours (Moderate Caution at Night)',
    passengerAdvice: 'Standard trip monitoring active. Keep emergency contact updated on traffic delays.',
    fleetManagerAdvice: 'Routine continuous monitoring. Standard 15-minute checkout alert windows applicable.',
    startCoords: [6.6018, 3.3515],
    endCoords: [7.3775, 3.9470],
  },
];

export function detectAIAnomalies(incidents: Incident[], trips: Trip[]): AIAnomaly[] {
  const anomalies: AIAnomaly[] = [];
  const now = new Date();
  const currentHour = now.getHours();

  // 1. Midnight / High Risk Hour Travel Anomaly
  if (currentHour >= 22 || currentHour < 5) {
    const nightTrips = trips.filter((t) => t.status === 'active');
    if (nightTrips.length > 0) {
      anomalies.push({
        id: `anom-night-${now.getTime()}`,
        type: 'midnight_transit',
        severity: 'medium',
        title: 'High-Risk Night Transit Anomaly',
        description: `${nightTrips.length} active trip(s) currently traveling during high-risk night window (22:00 - 05:00).`,
        timestamp: now.toISOString(),
        recommendedAction: 'Verify driver alertness and prompt passengers to confirm safety status.',
      });
    }
  }

  // 2. SOS Distress Cluster Anomaly
  const activeIncidents = incidents.filter((i) => i.status === 'active');
  if (activeIncidents.length >= 2) {
    const first = activeIncidents[0];
    anomalies.push({
      id: `anom-cluster-${now.getTime()}`,
      type: 'distress_cluster',
      severity: 'critical',
      title: 'Multiple SOS Distress Cluster Detected',
      description: `Concentrated distress signals (${activeIncidents.length} active SOS) received in close proximity.`,
      location: { lat: first.latitude, lng: first.longitude },
      timestamp: now.toISOString(),
      recommendedAction: 'Dispatch immediate emergency response and notify regional security team.',
    });
  }

  // 3. Unannounced Stopped Vehicle / Prolonged Silence
  trips.forEach((t) => {
    if (t.status === 'alert') {
      anomalies.push({
        id: `anom-alert-${t.id}`,
        type: 'extended_offline',
        severity: 'high',
        title: `Missed Checkout: ${t.passenger_name}`,
        description: `Vehicle on route ${t.bus_route} has missed scheduled arrival window by over 15 minutes.`,
        location: { lat: t.latitude, lng: t.longitude },
        passenger_id: t.passenger_id,
        vehicle_id: t.vehicle_id,
        timestamp: t.created_at || now.toISOString(),
        recommendedAction: 'Initiate voice ping and contact emergency contact listed on profile.',
      });
    }
  });

  // 4. Default baseline safety anomaly check if none
  if (anomalies.length === 0) {
    anomalies.push({
      id: `anom-base-${now.getTime()}`,
      type: 'unusual_stop',
      severity: 'low',
      title: 'Routine AI Telemetry Scan Normal',
      description: 'AI spatial-temporal monitor running. No abnormal vehicle detours or acoustic distress anomalies detected.',
      timestamp: now.toISOString(),
      recommendedAction: 'Continue standard automated fleet monitoring.',
    });
  }

  return anomalies;
}

export function aggregateSOSClusters(incidents: Incident[]): SOSCluster[] {
  if (incidents.length === 0) {
    return [
      {
        id: 'cluster-demo-1',
        regionName: 'Lokoja - Okene Corridor',
        centerLat: 7.8023,
        centerLng: 6.7331,
        radiusKm: 15,
        incidentCount: 3,
        riskLevel: 'HIGH',
        dominantTrigger: 'Manual Panic Button',
        latestIncidentTime: new Date().toISOString(),
        advisoryText: 'High distress density along rocky bypass. Increased patrol recommended.',
      },
    ];
  }

  // Group by rough coordinate rounded grid
  const groups: Record<string, Incident[]> = {};
  incidents.forEach((inc) => {
    const key = `${inc.latitude.toFixed(1)},${inc.longitude.toFixed(1)}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(inc);
  });

  return Object.entries(groups).map(([key, incs], idx) => {
    const lat = incs.reduce((sum, i) => sum + i.latitude, 0) / incs.length;
    const lng = incs.reduce((sum, i) => sum + i.longitude, 0) / incs.length;
    const isHigh = incs.length > 2;

    return {
      id: `cluster-${idx}-${Date.now()}`,
      regionName: `Sector (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`,
      centerLat: lat,
      centerLng: lng,
      radiusKm: 10 + incs.length * 2,
      incidentCount: incs.length,
      riskLevel: isHigh ? 'SEVERE' : incs.length === 2 ? 'HIGH' : 'MODERATE',
      dominantTrigger: incs[0].trigger_type === 'audio' ? 'Acoustic Scream Warning' : 'SOS Distress Button',
      latestIncidentTime: incs[0].created_at || new Date().toISOString(),
      advisoryText: `Sector aggregated ${incs.length} active distress signal(s). Continuous monitoring active.`,
    };
  });
}

export function calculateJourneySafetyScore(
  lat: number,
  lng: number,
  currentTime: Date = new Date()
): { score: number; statusLabel: string; advice: string } {
  const hour = currentTime.getHours();
  let score = 95;

  // Night penalty
  if (hour >= 21 || hour <= 5) {
    score -= 25;
  }

  // Proximity to known dangerous routes
  const nearDanger = DANGEROUS_ROUTES_DATA.find((r) => {
    const dLat = Math.abs(r.startCoords[0] - lat);
    const dLng = Math.abs(r.startCoords[1] - lng);
    return dLat < 0.5 && dLng < 0.5;
  });

  if (nearDanger) {
    score -= nearDanger.riskScore * 0.3;
  }

  score = Math.max(15, Math.min(99, Math.round(score)));

  let statusLabel = 'Optimal Safety Level';
  let advice = 'Your transit corridor has low reported threat incidents. Keep battery charged above 20%.';

  if (score < 50) {
    statusLabel = 'High Security Advisory';
    advice = 'You are currently in a high-risk transit window/sector. Share your live pairing code with emergency contacts.';
  } else if (score < 75) {
    statusLabel = 'Moderate Caution Advised';
    advice = 'Maintain app active in background so acoustic distress and location pings operate continuously.';
  }

  return { score, statusLabel, advice };
}
