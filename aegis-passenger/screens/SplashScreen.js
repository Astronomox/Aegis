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
      <Text style={styles.tagline}>Your silent safety shield</Text>
      <ActivityIndicator
        color={COLORS.green}
        size="small"
        style={{ marginTop: SPACING.xl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  logo: {
    width: 200,
    height: 70,
    tintColor: '#fff',
  },
  tagline: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    marginTop: SPACING.md,
    textAlign: 'center',
    fontWeight: '500',
  },
});
