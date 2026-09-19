import * as Location from 'expo-location';

// Lagos fallback for demo
const FALLBACK = { latitude: 6.5244, longitude: 3.3792 };

export async function getLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return FALLBACK;
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: loc.coords.latitude,
