import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createPassengerPairingCode } from '../lib/supabase';
import {
  setPassengerId,
  setPassengerName,
  setPairingCode,
  setHasOnboarded,
} from '../lib/storage';

export default function OnboardingScreen({ onComplete }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [watcherPhone, setWatcherPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [activePassengerId, setActivePassengerId] = useState(null);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing information', 'Please enter your name and phone number.');
      return;
    }

    setSaving(true);

    try {
      const passengerId = `p-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .substring(2, 6)}`;

      await setPassengerId(passengerId);
      await setPassengerName(name.trim());
      setActivePassengerId(passengerId);

      const codeData = await createPassengerPairingCode(passengerId, name.trim());
      const code = codeData?.code || 'AEGIS1';

      await setPairingCode(code);
      setGeneratedCode(code);
    } catch (error) {
      Alert.alert(
        'Unable to create code',
        error?.message || 'Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    await setHasOnboarded();
    onComplete(activePassengerId);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topLine}>
          <View style={styles.alertDot} />
          <Text style={styles.topLineText}>PASSENGER SETUP</Text>
        </View>

        <View style={styles.brandRow}>
          <Image
            source={require('../assets/aegis-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.activeText}>AEGIS IS ACTIVE</Text>
        </View>

        {generatedCode ? (
          <View style={styles.codeStep}>
            <Text style={styles.eyebrow}>YOUR PRIVATE CONNECTION</Text>

            <Text style={styles.heading}>
              Your watcher{'\n'}
              <Text style={styles.headingMuted}>code is ready.</Text>
            </Text>

            <Text style={styles.sub}>
              Share this one-time code only with someone you trust to watch over
              your journey.
            </Text>

            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>PASSENGER ADDING CODE</Text>

              <Text style={styles.codeText}>{generatedCode}</Text>

              <View style={styles.codeDivider} />

              <Text style={styles.codeSubtext}>
                VALID FOR 24 HOURS · ONE-TIME PAIRING
              </Text>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>START TRAVEL SHIELD</Text>
              <Text style={styles.buttonArrow}>→</Text>
            </TouchableOpacity>

            <Text style={styles.privateNote}>
              Your location is shared only during an active emergency.
            </Text>
          </View>
        ) : (
          <View style={styles.formStep}>
            <Text style={styles.eyebrow}>QUIET PROTECTION FOR EVERY JOURNEY</Text>

            <Text style={styles.heading}>
              Set up your{'\n'}
              <Text style={styles.headingMuted}>safety shield.</Text>
            </Text>

            <Text style={styles.sub}>
              Create your private pairing code so a trusted watcher can be there
              when you need help.
            </Text>

            <View style={styles.formCard}>
              <Text style={styles.cardLabel}>YOUR DETAILS</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>YOUR NAME</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Amina"
                  placeholderTextColor="#716d66"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>YOUR PHONE NUMBER</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+234 801 234 5678"
                  placeholderTextColor="#716d66"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.lastInputGroup}>
                <Text style={styles.label}>WATCHER PHONE · OPTIONAL</Text>
                <TextInput
                  style={styles.input}
                  value={watcherPhone}
                  onChangeText={setWatcherPhone}
                  placeholder="+234 901 234 5678"
                  placeholderTextColor="#716d66"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {saving ? 'GENERATING CODE...' : 'GENERATE ADDING CODE'}
              </Text>
              <Text style={styles.buttonArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerStar}>✦</Text>
              <Text style={styles.footer}>
                Aegis keeps your information private and secure.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080909',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 58,
    paddingBottom: 36,
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
    letterSpacing: 1.6,
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

  activeText: {
    color: '#938d83',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },

  formStep: {
    flex: 1,
    marginTop: 46,
  },

  codeStep: {
    flex: 1,
    marginTop: 46,
  },

  eyebrow: {
    marginBottom: 15,
    color: '#b6ac9c',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.25,
  },

  heading: {
    color: '#f5f2eb',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -2.1,
    lineHeight: 40,
  },

  headingMuted: {
    color: '#898783',
  },

  sub: {
    maxWidth: 330,
    marginTop: 19,
    color: '#aaa39a',
    fontSize: 14,
    lineHeight: 21,
  },

  formCard: {
    marginTop: 31,
    padding: 20,
    borderWidth: 1,
    borderColor: '#393834',
    backgroundColor: '#0d0e0e',
  },

  cardLabel: {
    marginBottom: 21,
    color: '#aaa296',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  inputGroup: {
    marginBottom: 17,
  },

  lastInputGroup: {
    marginBottom: 0,
  },

  label: {
    marginBottom: 8,
    color: '#9d968c',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.05,
  },

  input: {
    borderWidth: 1,
    borderColor: '#4b4843',
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#f5f2eb',
    backgroundColor: '#151616',
    fontSize: 15,
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
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  buttonArrow: {
    color: '#111',
    fontSize: 22,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 22,
  },

  footerStar: {
    color: '#e9b779',
    fontSize: 13,
  },

  footer: {
    flex: 1,
    color: '#76726b',
    fontSize: 11,
    lineHeight: 16,
  },

  codeCard: {
    alignItems: 'center',
    marginTop: 31,
    paddingVertical: 31,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#806c4c',
    backgroundColor: '#11110f',
  },

  codeLabel: {
    color: '#c0b4a1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.25,
  },

  codeText: {
    marginTop: 17,
    color: '#f3efe7',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 6,
  },

  codeDivider: {
    width: '100%',
    height: 1,
    marginTop: 23,
    backgroundColor: '#4b4439',
  },

  codeSubtext: {
    marginTop: 15,
    color: '#928a7e',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.9,
  },

  privateNote: {
    marginTop: 22,
    color: '#76726b',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});