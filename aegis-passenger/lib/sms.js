import { Linking, Platform } from 'react-native';

export function buildSOSMessage({ name, route, lat, lng, vehicleId }) {
  const mapUrl = `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
  const routeText = route ? ` | Route: ${route}` : '';
  const busText = vehicleId ? ` (${vehicleId})` : '';
  return `EMERGENCY SOS! Passenger: ${name || 'Bus Passenger'}${routeText}${busText} | Location: ${mapUrl} | Sent via Aegis Travel Safety Network`;
}

export function openNativeSMS(recipientPhone, message) {
  const encodedMsg = encodeURIComponent(message);
  const phone = recipientPhone ? recipientPhone.trim() : '';
  
  const url = Platform.OS === 'ios'
    ? `sms:${phone}&body=${encodedMsg}`
    : `sms:${phone}?body=${encodedMsg}`;

  return Linking.openURL(url).catch((err) => {
    console.log('[SMS] Failed to open SMS app:', err);
  });
}
