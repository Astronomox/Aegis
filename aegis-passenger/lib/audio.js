import { AudioModule } from 'expo-audio';
import { MOCK_MODE } from './supabase';

/**
 * Request microphone permission. Call once on mount.
 */
export async function requestAudioPermission() {
  if (MOCK_MODE) return true;
  try {
    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    return granted;
  } catch (e) {
    console.log('[audio] permission request failed:', e.message);
    return false;
  }
}
