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

// Fallback used only in mock mode or if passengerId is somehow missing
const FALLBACK_PASSENGER_ID = 'demo-passenger-001';

const RMS_THRESHOLD = 85;

const STATUS = {
  LISTENING: 'listening',
  SENDING: 'sending',
  SENT: 'sent',
  ERROR: 'error',
};

export default function BlackScreen({ passengerId }) {
  const activePassengerId = passengerId || FALLBACK_PASSENGER_ID;

  const [status, setStatus] = useState(STATUS.LISTENING);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const hasTriggeredRef = useRef(false);

  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(audioRecorder, 500);

  // Start recording on mount
  useEffect(() => {
    if (MOCK_MODE) {
      console.log('[MOCK] audio monitoring active — passenger:', activePassengerId);
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

  // Audio threshold detection
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

  // Status overlay animation
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

      let audioUrl = null;
      if (!MOCK_MODE && audioRecorder.isRecording) {
        await audioRecorder.stop();
        audioUrl = audioRecorder.uri ? await uploadAudio(audioRecorder.uri) : null;
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
      } else if (MOCK_MODE) {
        audioUrl = 'mock://audio/sample-distress.m4a';
      }

      const { error } = await insertIncident({
        passenger_id: activePassengerId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        trigger_type: triggerType,
        audio_url: audioUrl,
      });

      if (!error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Heavy);
        setStatus(STATUS.SENT);
      } else {
        console.log('[triggerSOS] insert error:', error.message);
        setStatus(STATUS.ERROR);
      }
    } catch (e) {
      console.log('[triggerSOS] failed:', e.message);
      setStatus(STATUS.ERROR);
    }
  };

  const handleTap = () => {
    tapCountRef.current += 1;

    if (tapCountRef.current >= 2) {
      tapCountRef.current = 0;
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      triggerSOS('manual');
      return;
    }

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 600);
  };

  const overlayColor =
    status === STATUS.SENDING ? COLORS.red
    : status === STATUS.SENT   ? COLORS.green
    : status === STATUS.ERROR  ? COLORS.red
    : 'transparent';

  const overlayText =
    status === STATUS.SENDING ? 'Sending SOS...'
    : status === STATUS.SENT  ? 'Alert sent'
    : status === STATUS.ERROR ? 'Failed — tap again'
    : '';

  return (
    <Pressable style={styles.flex} onPress={handleTap}>
      <View style={styles.screen}>
        <StatusBar hidden />

        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity, backgroundColor: overlayColor }]}
          pointerEvents="none"
        >
          <Text style={styles.overlayText}>{overlayText}</Text>
        </Animated.View>

        {/* Tiny debug dot — invisible in real use */}
        <Text style={styles.debug}>
          {MOCK_MODE ? 'M' : 'L'} · {status === STATUS.LISTENING ? '◉' : '⏳'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#000000' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  debug: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    color: '#111111',
    fontSize: 9,
  },
});
