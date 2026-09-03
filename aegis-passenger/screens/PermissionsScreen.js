import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { AudioModule } from 'expo-audio';
import { COLORS, SPACING } from '../lib/theme';

export default function PermissionsScreen({ onGranted }) {
  const [requesting, setRequesting] = useState(false);

  const requestAll = async () => {
    setRequesting(true);
    try {
      const loc = await Location.requestForegroundPermissionsAsync();
      const mic = await AudioModule.requestRecordingPermissionsAsync();

      if (loc.granted && mic.granted) {
        onGranted();
      } else {
        Alert.alert(
          'Permissions Required',
          'Aegis needs microphone and location access to protect you. Please enable them in Settings.',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'Try Again', onPress: requestAll },
          ]
        );
      }
    } catch {
      Alert.alert('Error', 'Could not request permissions. Try again.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Image
        source={require('../assets/aegis-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.card}>
        <Text style={styles.heading}>Two permissions needed</Text>

        <View style={styles.row}>
          <Text style={styles.icon}>🎙</Text>
          <View style={styles.rowText}>
            <Text style={styles.permTitle}>Microphone</Text>
            <Text style={styles.permDesc}>
              Detects distress sounds silently in the background.
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.icon}>📍</Text>
          <View style={styles.rowText}>
            <Text style={styles.permTitle}>Location</Text>
            <Text style={styles.permDesc}>
              Sends your coordinates to watchers during an emergency.
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.btn, requesting && styles.btnDisabled]}
        onPress={requestAll}
        disabled={requesting}
        activeOpacity={0.8}
      >
        <Text style={styles.btnText}>
          {requesting ? 'Requesting...' : 'Grant Access'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Your data never leaves Aegis. We only share your location with your
        chosen watcher during an active emergency.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  logo: {
    width: 180,
    height: 60,
    alignSelf: 'center',
    marginBottom: SPACING.xl,
    tintColor: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  heading: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  icon: {
    fontSize: 24,
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  rowText: { flex: 1 },
  permTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  permDesc: {
    color: COLORS.lightGray,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  btn: {
    backgroundColor: COLORS.red,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    color: COLORS.lightGray,
    fontSize: 11,
    textAlign: 'center',
    marginTop: SPACING.lg,
    lineHeight: 16,
    maxWidth: 300,
    alignSelf: 'center',
  },
});
