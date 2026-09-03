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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING } from '../lib/theme';
import { MOCK_MODE, supabase } from '../lib/supabase';

export default function OnboardingScreen({ onComplete }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [watcherPhone, setWatcherPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim() || !watcherPhone.trim()) {
      Alert.alert('Missing info', 'Fill in all fields to continue.');
      return;
    }

    setSaving(true);
    try {
      if (MOCK_MODE) {
        console.log('[MOCK] onboarding save:', { name, phone, watcherPhone });
        await new Promise((r) => setTimeout(r, 400));
      } else {
        const { data: user, error: userErr } = await supabase
          .from('users')
          .insert({ name: name.trim(), phone_number: phone.trim() })
          .select()
          .single();

        if (userErr) throw userErr;

        const { error: watcherErr } = await supabase
          .from('watchers')
          .insert({
            passenger_id: user.id,
            watcher_phone: watcherPhone.trim(),
          });

        if (watcherErr) throw watcherErr;
      }
      onComplete();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      <Image
        source={require('../assets/aegis-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.heading}>Set up your shield</Text>
      <Text style={styles.sub}>
        Enter your info and your emergency contact. This person will be alerted
        if you trigger an SOS.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Abdullahi"
          placeholderTextColor={COLORS.midGray}
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

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Watcher's phone number</Text>
        <TextInput
          style={styles.input}
          value={watcherPhone}
          onChangeText={setWatcherPhone}
          placeholder="+234 901 234 5678"
          placeholderTextColor={COLORS.midGray}
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
          {saving ? 'Saving...' : 'Activate Aegis'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
