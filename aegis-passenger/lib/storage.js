import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PASSENGER_ID: 'aegis_passenger_id',
  HAS_ONBOARDED: 'aegis_has_onboarded',
};

export async function getPassengerId() {
  return AsyncStorage.getItem(KEYS.PASSENGER_ID);
}

export async function setPassengerId(id) {
  return AsyncStorage.setItem(KEYS.PASSENGER_ID, id);
}

export async function getHasOnboarded() {
  const v = await AsyncStorage.getItem(KEYS.HAS_ONBOARDED);
  return v === 'true';
}

export async function setHasOnboarded() {
  return AsyncStorage.setItem(KEYS.HAS_ONBOARDED, 'true');
}

export async function clearAll() {
  return AsyncStorage.multiRemove([KEYS.PASSENGER_ID, KEYS.HAS_ONBOARDED]);
}
