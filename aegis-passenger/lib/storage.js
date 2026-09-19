import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PASSENGER_ID: 'aegis_passenger_id',
  PASSENGER_NAME: 'aegis_passenger_name',
  PAIRING_CODE: 'aegis_pairing_code',
  HAS_ONBOARDED: 'aegis_has_onboarded',
};

export async function getPassengerId() {
  return AsyncStorage.getItem(KEYS.PASSENGER_ID);
}

export async function setPassengerId(id) {
  return AsyncStorage.setItem(KEYS.PASSENGER_ID, id);
}

export async function getPassengerName() {
  return AsyncStorage.getItem(KEYS.PASSENGER_NAME);
}

export async function setPassengerName(name) {
  return AsyncStorage.setItem(KEYS.PASSENGER_NAME, name);
}

export async function getPairingCode() {
  return AsyncStorage.getItem(KEYS.PAIRING_CODE);
}

export async function setPairingCode(code) {
  return AsyncStorage.setItem(KEYS.PAIRING_CODE, code);
}

export async function getHasOnboarded() {
  const v = await AsyncStorage.getItem(KEYS.HAS_ONBOARDED);
  return v === 'true';
}

export async function setHasOnboarded() {
  return AsyncStorage.setItem(KEYS.HAS_ONBOARDED, 'true');
}

export async function clearAll() {
  return AsyncStorage.multiRemove([
    KEYS.PASSENGER_ID,
    KEYS.PASSENGER_NAME,
    KEYS.PAIRING_CODE,
    KEYS.HAS_ONBOARDED,
  ]);
}
