import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING } from '../lib/theme';
import { createPassengerPairingCode, MOCK_MODE } from '../lib/supabase';
import { setPassengerId, setPassengerName, setPairingCode, setHasOnboarded } from '../lib/storage';

export default function OnboardingScreen({ onComplete }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [watcherPhone, setWatcherPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [activePassengerId, setActivePassengerId] = useState(null);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing info', 'Please enter your name and phone number.');
      return;
    }

    setSaving(true);

    try {
      const passengerId = `p-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      await setPassengerId(passengerId);
      await setPassengerName(name.trim());
      setActivePassengerId(passengerId);

      // Generate initial 6-digit pairing code
      const codeData = await createPassengerPairingCode(passengerId, name.trim());
      const code = codeData?.code || 'AEGIS1';
      await setPairingCode(code);
      setGeneratedCode(code);
    } catch (e) {
      console.log('[Onboarding] Error:', e.message);
      Alert.alert('Error', e.message || 'Could not create pairing code. Please try again.');
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
      <StatusBar style="dark" />

      <Image
        source={require('../assets/aegis-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {generatedCode ? (
        <View style={styles.codeStep}>
          <Text style={styles.heading}>Your Adding Code</Text>
          <Text style={styles.sub}>
            Share this 6-digit code with your emergency contact / watcher. They will enter it on their Aegis Web Dashboard to monitor your trip.
          </Text>

          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>PASSENGER ADDING CODE</Text>
            <Text style={styles.codeText}>{generatedCode}</Text>
            <Text style={styles.codeSubtext}>Valid for 24 hours · One-time pairing</Text>
          </View>

          <TouchableOpacity
            style={styles.btn}
            onPress={handleFinish}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>Start Travel Shield</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.formStep}>
          <Text style={styles.heading}>Set up your shield</Text>
          <Text style={styles.sub}>
            Enter your details to generate your Aegis adding code for your watchers.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Amina"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your phone number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+234 801 234 5678"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Watcher's phone number (optional)</Text>
            <TextInput
              style={styles.input}
              value={watcherPhone}
              onChangeText={setWatcherPhone}
              placeholder="+234 901 234 5678"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>
              {saving ? 'Generating Code...' : 'Generate Adding Code'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
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
    width: 130,
    height: 45,
    alignSelf: 'center',
    marginBottom: SPACING.xl,
  },
  formStep: { width: '100%' },
  codeStep: { width: '100%', alignItems: 'center' },
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
    lineHeight: 20,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.textDim,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  codeCard: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.blue,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginVertical: SPACING.md,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDim,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.blue,
    letterSpacing: 4,
    marginVertical: 4,
  },
  codeSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  btn: {
    backgroundColor: COLORS.blue,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: SPACING.lg,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
