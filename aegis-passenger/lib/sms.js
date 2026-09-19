import { Linking, Platform } from 'react-native';

/**
 * Build an SOS message with location, health conditions, and disabilities
 */
export function buildSOSMessage({
  name,
  lat,
  lng,
  route,
  vehicleId,
  health = [],
  disabilities = [],
}) {
  const mapUrl = `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
  const routeText = route ? ` | Route: ${route}` : '';
  const busText = vehicleId ? ` (${vehicleId})` : '';

  // Build health info section
  const healthInfo = health && health.length > 0 ? ` | Medical: ${health.join(', ')}` : '';
  const disabilityInfo =
    disabilities && disabilities.length > 0
      ? ` | Accessibility: ${disabilities.join(', ')}`
      : '';

  return `🚨 EMERGENCY SOS! Passenger: ${name || 'Passenger'}${routeText}${busText}${healthInfo}${disabilityInfo} | Location: ${mapUrl} | via AEGIS Safety Network`;
}

/**
 * Open native SMS app with pre-filled message
 * Works on 2G/3G/4G without internet requirement
 */
export function openNativeSMS(recipientPhone, message) {
  const encodedMsg = encodeURIComponent(message);
  const phone = recipientPhone ? recipientPhone.trim() : '';

  if (!phone) {
    console.warn('[SMS] No phone number provided');
    return Promise.reject(new Error('No phone number provided'));
  }

  const url =
    Platform.OS === 'ios'
      ? `sms:${phone}&body=${encodedMsg}`
      : `sms:${phone}?body=${encodedMsg}`;

  return Linking.openURL(url).catch((err) => {
    console.log('[SMS] Failed to open SMS app:', err);
    throw err;
  });
}

/**
 * Format phone number to standard format
 */
export function formatPhoneNumber(phone) {
  // Nigerian format: +234 or 0-based
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('234')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    return '+234' + cleaned.substring(1);
  }
  return '+' + cleaned;
}