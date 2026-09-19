import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PASSENGER_ID: 'aegis_passenger_id',
  PASSENGER_NAME: 'aegis_passenger_name',
  PAIRING_CODE: 'aegis_pairing_code',
  HAS_ONBOARDED: 'aegis_has_onboarded',
  EMERGENCY_CONTACT: 'aegis_emergency_contact',
  EMERGENCY_CONTACT_NAME: 'aegis_emergency_contact_name',
  HEALTH_CONDITIONS: 'aegis_health_conditions',
  DISABILITIES: 'aegis_disabilities',
};

// Passenger ID
export async function getPassengerId() {
  return AsyncStorage.getItem(KEYS.PASSENGER_ID);
}

export async function setPassengerId(id) {
  return AsyncStorage.setItem(KEYS.PASSENGER_ID, id);
}

// Passenger Name
export async function getPassengerName() {
  return AsyncStorage.getItem(KEYS.PASSENGER_NAME);
}

export async function setPassengerName(name) {
  return AsyncStorage.setItem(KEYS.PASSENGER_NAME, name);
}

// Pairing Code
export async function getPairingCode() {
  return AsyncStorage.getItem(KEYS.PAIRING_CODE);
}

export async function setPairingCode(code) {
  return AsyncStorage.setItem(KEYS.PAIRING_CODE, code);
}

// Onboarding
export async function getHasOnboarded() {
  const v = await AsyncStorage.getItem(KEYS.HAS_ONBOARDED);
  return v === 'true';
}

export async function setHasOnboarded() {
  return AsyncStorage.setItem(KEYS.HAS_ONBOARDED, 'true');
}

// Emergency Contact Phone
export async function getEmergencyContact() {
  return AsyncStorage.getItem(KEYS.EMERGENCY_CONTACT);
}

export async function setEmergencyContact(phone) {
  return AsyncStorage.setItem(KEYS.EMERGENCY_CONTACT, phone);
}

// Emergency Contact Name
export async function getEmergencyContactName() {
  return AsyncStorage.getItem(KEYS.EMERGENCY_CONTACT_NAME);
}

export async function setEmergencyContactName(name) {
  return AsyncStorage.setItem(KEYS.EMERGENCY_CONTACT_NAME, name);
}

// Health Conditions (stored as JSON array)
export async function getHealthConditions() {
  const val = await AsyncStorage.getItem(KEYS.HEALTH_CONDITIONS);
  return val ? JSON.parse(val) : [];
}

export async function setHealthConditions(conditions) {
  return AsyncStorage.setItem(KEYS.HEALTH_CONDITIONS, JSON.stringify(conditions));
}

// Disabilities (stored as JSON array)
export async function getDisabilities() {
  const val = await AsyncStorage.getItem(KEYS.DISABILITIES);
  return val ? JSON.parse(val) : [];
}

export async function setDisabilities(disabilities) {
  return AsyncStorage.setItem(KEYS.DISABILITIES, JSON.stringify(disabilities));
}

// Clear all stored data
export async function clearAll() {
  return AsyncStorage.multiRemove([
    KEYS.PASSENGER_ID,
    KEYS.PASSENGER_NAME,
    KEYS.PAIRING_CODE,
    KEYS.HAS_ONBOARDED,
    KEYS.EMERGENCY_CONTACT,
    KEYS.EMERGENCY_CONTACT_NAME,
    KEYS.HEALTH_CONDITIONS,
    KEYS.DISABILITIES,
  ]);
}