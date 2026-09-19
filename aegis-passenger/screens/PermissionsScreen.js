import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Image,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { AudioModule } from 'expo-audio';

export default function PermissionsScreen({ onGranted }) {
  const [requesting, setRequesting] = useState(false);

  const requestAll = async () => {
    setRequesting(true);

    try {
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      const microphonePermission = await AudioModule.requestRecordingPermissionsAsync();

      if (locationPermission.granted && microphonePermission.granted) {
        onGranted();
        return;
      }

      Alert.alert(
        'Permissions needed',
        'Aegis needs microphone and location access to protect you during your journey.',
        [
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
          { text: 'Try again', onPress: requestAll },
        ],
      );
    } catch {
      Alert.alert(
        'Something went wrong',
        'Could not request permissions. Please try again.',
      );
    } finally {
      setRequesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        <View style={styles.topLine}>
          <View style={styles.alertDot} />
          <Text style={styles.topLineText}>QUIET PROTECTION</Text>
        </View>

        <View style={styles.brandRow}>
          <Image
            source={require('../assets/aegis-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.activeLabel}>AEGIS IS ACTIVE</Text>
        </View>

        <View style={styles.headingBlock}>
          <Text style={styles.heading}>
            Safety starts{'\n'}
            <Text style={styles.headingMuted}>with consent.</Text>
          </Text>

          <Text style={styles.sub}>
            Allow two permissions so Aegis can quietly protect you when you need it.
          </Text>
        </View>

        <View style={styles.permissionsCard}>
          <Text style={styles.cardLabel}>REQUIRED PERMISSIONS</Text>

          <View style={styles.permissionRow}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>MIC</Text>
            </View>

            <View style={styles.rowText}>
              <Text style={styles.permissionTitle}>Microphone</Text>
              <Text style={styles.permissionDescription}>
                Detects distress sounds and can alert your watcher automatically.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.permissionRow}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>LOC</Text>
            </View>

            <View style={styles.rowText}>
              <Text style={styles.permissionTitle}>Location</Text>
              <Text style={styles.permissionDescription}>
                Shares your coordinates with your watcher during an emergency.
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, requesting && styles.buttonDisabled]}
          onPress={requestAll}
          disabled={requesting}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {requesting ? 'REQUESTING ACCESS...' : 'ALLOW PERMISSIONS'}
          </Text>
          <Text style={styles.buttonArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.privateNote}>
          <Text style={styles.privateIcon}>✦</Text>
          <Text style={styles.footer}>
            Your information stays private. Your location is shared only with your
            approved watcher during an active emergency.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080909',
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 28,
    backgroundColor: '#080909',
  },

  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: '#ec524b',
  },

  topLineText: {
    color: '#d9d0c2',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  logo: {
    width: 112,
    height: 34,
    tintColor: '#f5f2eb',
  },

  activeLabel: {
    color: '#938d83',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  headingBlock: {
    marginTop: 45,
  },

  heading: {
    color: '#f5f2eb',
    fontSize: 43,
    fontWeight: '900',
    letterSpacing: -2.3,
    lineHeight: 42,
  },

  headingMuted: {
    color: '#898783',
  },

  sub: {
    maxWidth: 310,
    marginTop: 20,
    color: '#aaa39a',
    fontSize: 14,
    lineHeight: 21,
  },

  permissionsCard: {
    marginTop: 38,
    padding: 20,
    borderWidth: 1,
    borderColor: '#393834',
    backgroundColor: '#0d0e0e',
  },

  cardLabel: {
    marginBottom: 20,
    color: '#aaa296',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  permissionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  iconCircle: {
    width: 42,
    height: 42,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#806c4c',
    borderRadius: 99,
    backgroundColor: '#171614',
  },

  iconText: {
    color: '#e9b779',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  rowText: {
    flex: 1,
    paddingTop: 1,
  },

  permissionTitle: {
    color: '#f1eee7',
    fontSize: 15,
    fontWeight: '800',
  },

  permissionDescription: {
    marginTop: 5,
    color: '#969087',
    fontSize: 12,
    lineHeight: 18,
  },

  divider: {
    height: 1,
    marginVertical: 19,
    backgroundColor: '#302f2c',
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 17,
    backgroundColor: '#f3efe7',
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  buttonArrow: {
    color: '#111',
    fontSize: 22,
    fontWeight: '400',
  },

  privateNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 'auto',
    paddingTop: 24,
  },

  privateIcon: {
    color: '#e9b779',
    fontSize: 13,
  },

  footer: {
    flex: 1,
    color: '#76726b',
    fontSize: 11,
    lineHeight: 16,
  },
});