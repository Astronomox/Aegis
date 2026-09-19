import * as Location from 'expo-location';

// Lagos fallback for demo
const FALLBACK = { latitude: 6.5244, longitude: 3.3792 };

// Fast path: cached last-known fix, near-instant (ms, not seconds).
// Use this on the SOS hot path so the incident insert never blocks on GPS.
export async function getLocationFast() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return FALLBACK;

    const cached = await Location.getLastKnownPositionAsync({
      maxAge: 60000, // accept a fix up to 60s old
      requiredAccuracy: 100,
    });
    if (cached) {
      return { latitude: cached.coords.latitude, longitude: cached.coords.longitude };
    }

    // No cached fix yet (first launch) — fall back to a bounded live read
    // instead of an unbounded high-accuracy one.
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch (e) {
    console.log('[location] fast fallback:', e.message);
    return FALLBACK;
  }
}

// Slow path: high-accuracy fix, used to refine the incident after it's
// already been sent. Never await this before pinging the watcher.
export async function getLocationAccurate() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch (e) {
    console.log('[location] accurate fallback:', e.message);
    return null;
  }
}

// Kept for any other callers that just want one best-effort read.
export async function getLocation() {
  return getLocationFast();
}
