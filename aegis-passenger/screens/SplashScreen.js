import React from 'react';
import { View, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING } from '../lib/theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Image
        source={require('../assets/aegis-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.tagline}>When speaking is fatal, silence saves lives.</Text>
      <ActivityIndicator
        color={COLORS.red}
        size="small"
        style={{ marginTop: SPACING.xl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  logo: {
    width: 220,
    height: 80,
    tintColor: COLORS.white,
  },
  tagline: {
    color: COLORS.lightGray,
    fontSize: 14,
    marginTop: SPACING.md,
    textAlign: 'center',
    maxWidth: 260,
  },
});
