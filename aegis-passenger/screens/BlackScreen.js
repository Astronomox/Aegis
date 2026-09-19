import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import { insertIncident, uploadAudio, MOCK_MODE } from '../lib/supabase';
import { getLocation } from '../lib/location';
import { requestAudioPermission } from '../lib/audio';
import { COLORS } from '../lib/theme';

const PASSENGER_ID = 'demo-passenger-001';
const RMS_THRESHOLD = 85;

const STATUS = {
  LISTENING: 'listening',
  SENDING: 'sending',
  SENT: 'sent',
  ERROR: 'error',
};

export default function BlackScreen() {
  const [status, setStatus] = useState(STATUS.LISTENING);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const hasTriggeredRef = useRef(false);

  // expo-audio hooks: recorder must live inside the component, not a lib file
  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(audioRecorder, 500); // poll every 500ms

  // Start recording on mount (mock mode skips this entirely)
  useEffect(() => {
    if (MOCK_MODE) {
      console.log('[MOCK] audio monitoring active (no real mic)');
      return;
    }

    let mounted = true;

    (async () => {
      const granted = await requestAudioPermission();
      if (!granted || !mounted) return;

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    })();

    return () => {
