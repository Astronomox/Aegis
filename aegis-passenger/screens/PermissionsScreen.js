import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Linking, Image,
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
          'Permissions needed',
          'Aegis needs microphone and location access to keep you safe. Please enable them in Settings.',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'Try again', onPress: requestAll },
          ]
        );
      }
    } catch {
      Alert.alert('Something went wrong', 'Could not request permissions. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Image
        source={require('../assets/aegis-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.heading}>Before we start</Text>
      <Text style={styles.sub}>Aegis needs two permissions to protect you on your journey.</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🎙</Text>
          </View>
          <View style={styles.rowText}>
            <Text style={styles.permTitle}>Microphone</Text>
            <Text style={styles.permDesc}>
              Detects loud distress sounds in the background so Aegis can alert your watcher automatically.
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>📍</Text>
          </View>
          <View style={styles.rowText}>
            <Text style={styles.permTitle}>Location</Text>
            <Text style={styles.permDesc}>
              Sends your coordinates to your watcher when an emergency is triggered.
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
          {requesting ? 'Requesting...' : 'Allow permissions'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Your data stays private. We only share your location with your chosen
        watcher during an active emergency.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  logo: {
    width: 140,
    height: 48,
    alignSelf: 'center',
    marginBottom: SPACING.xl,
  },
  heading: {
    color: COLORS.blue,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  sub: {
    color: COLORS.textDim,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.blueDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: { fontSize: 18 },
  rowText: { flex: 1 },
  permTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  permDesc: {
    color: COLORS.textDim,
    fontSize: 13,
    lineHeight: 18,
  },
  btn: {
    backgroundColor: COLORS.blue,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: SPACING.lg,
    lineHeight: 16,
    maxWidth: 280,
    alignSelf: 'center',
  },
});
