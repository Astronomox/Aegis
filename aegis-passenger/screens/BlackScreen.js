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
      mounted = false;
      try {
        if (audioRecorder.isRecording) audioRecorder.stop();
      } catch {}
    };
  }, []);

  // Watch metering for RMS threshold breach
  useEffect(() => {
    if (MOCK_MODE || hasTriggeredRef.current) return;
    const metering = recorderState.metering;
    if (metering === undefined || metering === null) return;

    const dB = 20 * Math.log10(Math.abs(metering) || 0.001);
    if (dB > RMS_THRESHOLD) {
      hasTriggeredRef.current = true;
      triggerSOS('audio');
    }
  }, [recorderState.metering]);

  // Flash status overlay
  useEffect(() => {
    if (status === STATUS.LISTENING) return;
    Animated.sequence([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      if (status === STATUS.SENT || status === STATUS.ERROR) {
        setStatus(STATUS.LISTENING);
        hasTriggeredRef.current = false;
      }
    });
  }, [status]);

  const triggerSOS = async (triggerType = 'manual') => {
    if (status === STATUS.SENDING) return;
    setStatus(STATUS.SENDING);

    try {
      const coords = await getLocation();

      // Grab whatever's been recorded so far as the distress clip
      let audioUrl = null;
      if (!MOCK_MODE && audioRecorder.isRecording) {
        await audioRecorder.stop();
        audioUrl = audioRecorder.uri ? await uploadAudio(audioRecorder.uri) : null;
        // Restart recording for continuous monitoring
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
      } else if (MOCK_MODE) {
        audioUrl = 'mock://audio/sample-distress.m4a';
      }

      const { error } = await insertIncident({
        passenger_id: PASSENGER_ID,
        latitude: coords.latitude,
        longitude: coords.longitude,
        trigger_type: triggerType,
        audio_url: audioUrl,
      });

      if (!error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Heavy);
