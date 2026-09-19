import React from 'react';
import { View, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.topLine}>
        <View style={styles.dot} />
        <Text style={styles.topLineText}>QUIET PROTECTION</Text>
      </View>

      <View style={styles.center}>
        <Image
          source={require('../assets/aegis-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.status}>AEGIS IS ACTIVE</Text>

        <Text style={styles.heading}>
          Help is there.{'\n'}
          <Text style={styles.headingMuted}>No one needs to know.</Text>
        </Text>

        <Text style={styles.tagline}>
          Your silent safety companion for every journey.
        </Text>
      </View>

      <View style={styles.loadingRow}>
        <ActivityIndicator color="#e9b779" size="small" />
        <Text style={styles.loadingText}>SECURING YOUR JOURNEY</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 58,
    paddingBottom: 36,
    backgroundColor: '#080909',
  },

  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  dot: {
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

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: 170,
    height: 58,
    tintColor: '#f5f2eb',
  },

  status: {
    marginTop: 26,
    color: '#a79f92',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },

  heading: {
    marginTop: 21,
    color: '#f5f2eb',
    fontSize: 35,
    fontWeight: '900',
    letterSpacing: -1.8,
    lineHeight: 36,
    textAlign: 'center',
  },

  headingMuted: {
    color: '#898783',
  },

  tagline: {
    maxWidth: 260,
    marginTop: 19,
    color: '#aaa39a',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
  },

  loadingText: {
    color: '#817c74',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
});