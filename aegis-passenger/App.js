import React, { useEffect, useState, useCallback } from 'react';
import { Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { AudioModule } from 'expo-audio';

import SplashScreen from './screens/SplashScreen';
import PermissionsScreen from './screens/PermissionsScreen';
import BlackScreen from './screens/BlackScreen';
import OnboardingScreen from './screens/OnboardingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [permissionsGranted, setPermissionsGranted] = useState(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  const checkPermissions = useCallback(async () => {
    try {
      const locStatus = await Location.getForegroundPermissionsAsync();
