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
import { COLORS, SPACING } from '../lib/theme';
import { MOCK_MODE, supabase } from '../lib/supabase';
import { setPassengerId, setHasOnboarded } from '../lib/storage';

const MOCK_PASSENGER_ID = 'demo-passenger-001';

export default function OnboardingScreen({ onComplete }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  // Multiple watcher phone numbers, comma-separated display
  const [watcherInputs, setWatcherInputs] = useState(['']);
  const [saving, setSaving] = useState(false);

  const addWatcher = () => {
    if (watcherInputs.length < 3) {
      setWatcherInputs((prev) => [...prev, '']);
    }
  };

  const updateWatcher = (index, value) => {
    setWatcherInputs((prev) => prev.map((w, i) => (i === index ? value : w)));
  };

  const removeWatcher = (index) => {
    setWatcherInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const filledWatchers = watcherInputs.map((w) => w.trim()).filter(Boolean);

    if (!name.trim() || !phone.trim() || filledWatchers.length === 0) {
      Alert.alert('Missing info', 'Enter your name, phone number, and at least one watcher.');
      return;
    }

    setSaving(true);
    try {
      if (MOCK_MODE) {
        console.log('[MOCK] onboarding:', { name, phone, watchers: filledWatchers });
        await new Promise((r) => setTimeout(r, 400));
        await setPassengerId(MOCK_PASSENGER_ID);
        await setHasOnboarded();
        onComplete(MOCK_PASSENGER_ID);
        return;
      }

      // 1. Create the passenger user row
      const { data: user, error: userErr } = await supabase
        .from('users')
        .insert({ name: name.trim(), phone_number: phone.trim() })
        .select()
        .single();

      if (userErr) throw userErr;

      // 2. Insert all watcher rows linked to this passenger
      const watcherRows = filledWatchers.map((wp) => ({
        passenger_id: user.id,
        watcher_phone: wp,
      }));

      const { error: watcherErr } = await supabase
        .from('watchers')
        .insert(watcherRows);

      if (watcherErr) throw watcherErr;

      // 3. Persist ID locally so we never need to re-onboard
      await setPassengerId(user.id);
      await setHasOnboarded();
      onComplete(user.id);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StatusBar style="light" />

        <Image
          source={require('../assets/aegis-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.heading}>Set up your shield</Text>
        <Text style={styles.sub}>
          Your info and emergency contacts are saved once. Aegis runs silently
          every trip after this.
        </Text>

        {/* Your info */}
        <Text style={styles.sectionLabel}>YOUR INFO</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Abdullahi Musa"
            placeholderTextColor={COLORS.midGray}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your phone number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+234 801 234 5678"
            placeholderTextColor={COLORS.midGray}
            keyboardType="phone-pad"
          />
        </View>

        {/* Watchers */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>WATCHERS</Text>
          {watcherInputs.length < 3 && (
            <TouchableOpacity onPress={addWatcher}>
              <Text style={styles.addBtn}>+ Add another</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.watcherHint}>
          These people will receive an alert if you trigger an SOS. You can add
          up to 3.
        </Text>

        {watcherInputs.map((w, i) => (
          <View key={i} style={styles.watcherRow}>
            <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
              <Text style={styles.label}>Watcher {i + 1}</Text>
              <TextInput
                style={styles.input}
                value={w}
                onChangeText={(v) => updateWatcher(i, v)}
                placeholder="+234 901 234 5678"
                placeholderTextColor={COLORS.midGray}
                keyboardType="phone-pad"
              />
            </View>
            {watcherInputs.length > 1 && (
              <TouchableOpacity
                onPress={() => removeWatcher(i)}
                style={styles.removeBtn}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.btn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>
            {saving ? 'Activating...' : 'Activate Aegis'}
          </Text>
        </TouchableOpacity>

        {MOCK_MODE && (
          <Text style={styles.mockNote}>
            Running in demo mode — no Supabase connection.
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: COLORS.black },
  container: {
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl,
  },
  logo: {
    width: 160,
    height: 55,
    alignSelf: 'center',
    marginBottom: SPACING.xl,
    tintColor: COLORS.white,
  },
  heading: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  sub: {
    color: COLORS.lightGray,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sectionLabel: {
    color: COLORS.red,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  watcherHint: {
    color: COLORS.lightGray,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: SPACING.md,
  },
  addBtn: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: '600',
  },
  watcherRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  removeBtn: {
    width: 36,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  removeBtnText: {
    color: COLORS.lightGray,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.lightGray,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    color: COLORS.white,
    fontSize: 16,
  },
  btn: {
    backgroundColor: COLORS.red,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  mockNote: {
    color: COLORS.midGray,
    fontSize: 11,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
});
