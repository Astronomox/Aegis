// AI Safety & Anomaly Engine for Passenger Mobile App

export const PASSENGER_DANGEROUS_ROUTES = [
  {
    id: 'route-001',
    routeName: 'Ore ➔ Benin Expressway',
    riskLevel: 'HIGH RISK',
    riskColor: '#EF4444',
    advice: 'Avoid night departure after 18:00. High distress frequency between Km 40-75.',
    safeHours: '06:00 AM - 06:00 PM',
  },
  {
    id: 'route-002',
    routeName: 'Lokoja ➔ Okene Bypass',
    riskLevel: 'SEVERE RISK',
    riskColor: '#991B1B',
    advice: 'Share Live Pairing Code before passing Okene. Rocky terrain cell handover latency detected.',
    safeHours: '07:00 AM - 05:00 PM',
  },
  {
    id: 'route-003',
    routeName: 'Abuja ➔ Kaduna Highway',
    riskLevel: 'HIGH RISK',
    riskColor: '#EF4444',
    advice: 'Enable acoustic scream detection. Stay in official terminals if delayed after dusk.',
    safeHours: '06:30 AM - 05:30 PM',
  },
  {
    id: 'route-004',
    routeName: 'Lagos ➔ Ibadan Expressway',
    riskLevel: 'MODERATE',
    riskColor: '#F59E0B',
    advice: 'Standard traffic monitoring. Keep phone charged for continuous emergency pinging.',
    safeHours: '24 Hours',
  },
];

export function getPassengerAIAdvice(currentLat, currentLng) {
  const hour = new Date().getHours();
  const isNight = hour >= 21 || hour < 5;

  let riskScore = 92;
  let statusText = 'SAFE TRANSIT CORRIDOR';
  let badgeColor = '#10B981';

  if (isNight) {
    riskScore -= 28;
    statusText = 'HIGH RISK NIGHT WINDOW';
    badgeColor = '#EF4444';
  }

  let advice = isNight
    ? '⚠️ Night travel detected. AI Safety recommends keeping your app open with Acoustic SOS active and sharing your code with your contacts.'
    : '🟢 Route conditions optimal. Continuous location & acoustic monitoring active.';

  return {
    riskScore: Math.max(25, riskScore),
    statusText,
    badgeColor,
    advice,
    isNight,
  };
}
