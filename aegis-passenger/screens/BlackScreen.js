import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import { insertIncident, uploadAudio, createPassengerPairingCode, MOCK_MODE } from '../lib/supabase';
import { getPairingCode, getPassengerName, setPairingCode } from '../lib/storage';
import { getLocation } from '../lib/location';
import { requestAudioPermission } from '../lib/audio';
import { COLORS } from '../lib/theme';

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
  const [modalVisible, setModalVisible] = useState(false);
  const [pairingCodeStr, setPairingCodeStr] = useState('');
  const [passengerNameStr, setPassengerNameStr] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);

  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const hasTriggeredRef = useRef(false);

  const audioRecorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(audioRecorder, 500);

  // Load existing pairing code & name on mount
  useEffect(() => {
    (async () => {
      const storedCode = await getPairingCode();
      const storedName = await getPassengerName();
      if (storedCode) setPairingCodeStr(storedCode);
      if (storedName) setPassengerNameStr(storedName);
    })();
  }, []);

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

  const handleGenerateNewCode = async () => {
    setGeneratingCode(true);
    try {
      const codeData = await createPassengerPairingCode(activePassengerId, passengerNameStr || 'Passenger');
      const code = codeData?.code || 'AEGIS1';
      await setPairingCode(code);
      setPairingCodeStr(code);
    } catch (e) {
      console.log('[BlackScreen] Code generation error:', e.message);
    } finally {
      setGeneratingCode(false);
    }
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

        {/* Subtle Watcher Pairing Code Button (Top Right) */}
        <TouchableOpacity
          style={styles.pairButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.6}
        >
          <Text style={styles.pairButtonText}>⚙ Watcher Code</Text>
        </TouchableOpacity>

        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity, backgroundColor: overlayColor }]}
          pointerEvents="none"
        >
          <Text style={styles.overlayText}>{overlayText}</Text>
        </Animated.View>

        {/* Tiny debug dot */}
        <Text style={styles.debug}>
          {MOCK_MODE ? 'M' : 'L'} · {status === STATUS.LISTENING ? '◉' : '⏳'}
        </Text>

        {/* Pairing Code Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Passenger Pairing Code</Text>
              <Text style={styles.modalSub}>
                Give this 6-digit code to your watcher to let them add you on the Aegis Dashboard.
              </Text>

              <View style={styles.codeContainer}>
                <Text style={styles.codeTitle}>YOUR ADDING CODE</Text>
                <Text style={styles.codeVal}>
                  {pairingCodeStr || '------'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Passenger ID:</Text>
                <Text style={styles.infoVal}>{activePassengerId}</Text>
              </View>

              <TouchableOpacity
                style={styles.genBtn}
                onPress={handleGenerateNewCode}
                disabled={generatingCode}
              >
                {generatingCode ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.genBtnText}>Generate New Code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>Return to Black Screen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  pairButton: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  pairButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '600',
  },
  debug: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    color: '#111111',
    fontSize: 9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  codeContainer: {
    backgroundColor: '#0F172A',
    borderColor: '#38BDF8',
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  codeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  codeVal: {
    fontSize: 34,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 6,
  },
  infoVal: {
    fontSize: 12,
    color: '#CBD5E1',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  genBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  genBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  closeBtn: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
