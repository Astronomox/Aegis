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
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import {
  insertIncident,
  updateIncident,
  uploadAudio,
  createPassengerPairingCode,
  MOCK_MODE,
} from '../lib/supabase';
import {
  getPairingCode,
  getPassengerName,
  setPairingCode,
} from '../lib/storage';
import { getLocationFast, getLocationAccurate } from '../lib/location';
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

  useEffect(() => {
    (async () => {
      const storedCode = await getPairingCode();
      const storedName = await getPassengerName();

      if (storedCode) setPairingCodeStr(storedCode);
      if (storedName) setPassengerNameStr(storedName);
    })();
  }, []);

  useEffect(() => {
    if (MOCK_MODE) {
      console.log('[MOCK] audio monitoring active — passenger:', activePassengerId);
      return;
    }

    let mounted = true;

    (async () => {
      const granted = await requestAudioPermission();

      if (!granted || !mounted) return;

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    })();

    return () => {
      mounted = false;

      try {
        if (audioRecorder.isRecording) {
          audioRecorder.stop();
        }
      } catch {}
    };
  }, []);

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

  useEffect(() => {
    if (status === STATUS.LISTENING) return;

    Animated.sequence([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1800),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
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
      // Fast path only: cached GPS fix, no audio wait. This is the entire
      // hot path to the watcher's dashboard — keep it to one round trip.
      const coords = await getLocationFast();

      const { data, error } = await insertIncident({
        passenger_id: activePassengerId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        trigger_type: triggerType,
        audio_url: null,
      });

      if (error) {
        console.log('[triggerSOS] insert error:', error.message);
        setStatus(STATUS.ERROR);
        return;
      }

      // Watcher has the ping now. Everything below is refinement and
      // runs after the fact — never blocks the alert itself.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Heavy);
      setStatus(STATUS.SENT);

      const incidentId = data?.id;
      refineIncident(incidentId, triggerType);
    } catch (error) {
      console.log('[triggerSOS] failed:', error.message);
      setStatus(STATUS.ERROR);
    }
  };

  // Backfills accurate GPS and the audio clip onto an incident that's
  // already been sent. Fire-and-forget: errors here never flip the UI
  // to STATUS.ERROR, since the watcher has already been alerted.
  const refineIncident = async (incidentId, triggerType) => {
    if (!incidentId) return;

    const patch = {};

    try {
      const accurate = await getLocationAccurate();
      if (accurate) {
        patch.latitude = accurate.latitude;
        patch.longitude = accurate.longitude;
      }
    } catch (e) {
      console.log('[refineIncident] location failed:', e.message);
    }

    try {
      if (!MOCK_MODE && audioRecorder.isRecording) {
        await audioRecorder.stop();
        if (audioRecorder.uri) {
          patch.audio_url = await uploadAudio(audioRecorder.uri);
        }
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
      } else if (MOCK_MODE) {
        patch.audio_url = 'mock://audio/sample-distress.m4a';
      }
    } catch (e) {
      console.log('[refineIncident] audio failed:', e.message);
    }

    if (Object.keys(patch).length > 0) {
      const { error } = await updateIncident(incidentId, patch);
      if (error) console.log('[refineIncident] update error:', error.message);
    }
  };

  const handleTap = () => {
    tapCountRef.current += 1;

    if (tapCountRef.current >= 2) {
      tapCountRef.current = 0;

      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }

      triggerSOS('manual');
      return;
    }

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 600);
  };

  const handleGenerateNewCode = async () => {
    setGeneratingCode(true);

    try {
      const codeData = await createPassengerPairingCode(
        activePassengerId,
        passengerNameStr || 'Passenger',
      );

      const code = codeData?.code || 'AEGIS1';

      await setPairingCode(code);
      setPairingCodeStr(code);
    } catch (error) {
      console.log('[BlackScreen] Code generation error:', error.message);
    } finally {
      setGeneratingCode(false);
    }
  };

  const overlayColor =
    status === STATUS.SENDING
      ? COLORS.red
      : status === STATUS.SENT
        ? COLORS.green
        : status === STATUS.ERROR
          ? COLORS.red
          : 'transparent';

  const overlayText =
    status === STATUS.SENDING
      ? 'Sending SOS...'
      : status === STATUS.SENT
        ? 'Alert sent'
        : status === STATUS.ERROR
          ? 'Failed — tap again'
          : '';

  return (
    <Pressable style={styles.flex} onPress={handleTap}>
      <View style={styles.screen}>
        <StatusBar hidden />

        <View pointerEvents="none" style={styles.doubleTapHint}>
          <Text style={styles.doubleTapHintText}>
            DOUBLE TAP ANYWHERE TO SEND AN ALERT
          </Text>
        </View>

        <TouchableOpacity
          style={styles.pairButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.6}
        >
          <Text style={styles.pairButtonText}>☰ MENU</Text>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity,
              backgroundColor: overlayColor,
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.overlayText}>{overlayText}</Text>
        </Animated.View>

        <Text style={styles.debug}>
          {MOCK_MODE ? 'M' : 'L'} · {status === STATUS.LISTENING ? '◉' : '⏳'}
        </Text>

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalEyebrow}>PASSENGER CONTROL</Text>

              <Text style={styles.modalTitle}>Your safety shield.</Text>

              <Text style={styles.modalSub}>
                Your watcher code lets someone you trust monitor your journey.
                Double tap the black screen whenever you need help.
              </Text>

              <View style={styles.statusCard}>
                <View style={styles.statusDot} />

                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusTitle}>MONITORING ACTIVE</Text>
                  <Text style={styles.statusDescription}>
                    Aegis is ready to send an emergency alert.
                  </Text>
                </View>
              </View>

              <View style={styles.codeContainer}>
                <Text style={styles.codeTitle}>YOUR WATCHER CODE</Text>

                <Text style={styles.codeVal}>
                  {pairingCodeStr || '------'}
                </Text>

                <Text style={styles.codeHint}>
                  Share only with a trusted watcher.
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>PASSENGER ID</Text>
                <Text style={styles.infoVal}>{activePassengerId}</Text>
              </View>

              <TouchableOpacity
                style={styles.genBtn}
                onPress={handleGenerateNewCode}
                disabled={generatingCode}
                activeOpacity={0.8}
              >
                {generatingCode ? (
                  <ActivityIndicator color="#111111" size="small" />
                ) : (
                  <Text style={styles.genBtnText}>GENERATE NEW CODE</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>RETURN TO SAFETY SCREEN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: '#080909',
  },

  doubleTapHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 42,
    alignItems: 'center',
  },

  doubleTapHintText: {
    color: '#77736d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  overlayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  pairButton: {
    position: 'absolute',
    top: 42,
    right: 20,
    zIndex: 20,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#4b473f',
    backgroundColor: 'rgba(14, 15, 15, 0.92)',
  },

  pairButtonText: {
    color: '#ded6c9',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },

  debug: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    color: '#4e4b46',
    fontSize: 9,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
  },

  modalCard: {
    paddingTop: 30,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 38 : 28,
    borderTopWidth: 1,
    borderColor: '#403e39',
    backgroundColor: '#111212',
  },

  modalEyebrow: {
    marginBottom: 9,
    color: '#a99f90',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },

  modalTitle: {
    color: '#f5f2eb',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -1.1,
  },

  modalSub: {
    marginTop: 10,
    marginBottom: 22,
    color: '#aaa39a',
    fontSize: 13,
    lineHeight: 19,
  },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: '#345746',
    backgroundColor: '#101714',
  },

  statusDot: {
    width: 8,
    height: 8,
    marginTop: 4,
    marginRight: 10,
    borderRadius: 99,
    backgroundColor: '#62bd93',
  },

  statusTextContainer: {
    flex: 1,
  },

  statusTitle: {
    color: '#8fcbab',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },

  statusDescription: {
    marginTop: 5,
    color: '#a2aba4',
    fontSize: 12,
    lineHeight: 17,
  },

  codeContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    paddingVertical: 23,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#806c4c',
    backgroundColor: '#151411',
  },

  codeTitle: {
    marginBottom: 10,
    color: '#c5b99f',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.25,
  },

  codeVal: {
    color: '#f5f2eb',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 5,
  },

  codeHint: {
    marginTop: 10,
    color: '#928a7e',
    fontSize: 11,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },

  infoLabel: {
    marginRight: 8,
    color: '#77736d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  infoVal: {
    color: '#aaa39a',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  genBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 50,
    marginBottom: 8,
    backgroundColor: '#f3efe7',
  },

  genBtnText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  closeBtn: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 14,
  },

  closeBtnText: {
    color: '#aaa39a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.85,
  },
});