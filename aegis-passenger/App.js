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
      const audioStatus = await AudioModule.getRecordingPermissionsAsync();
      setPermissionsGranted(locStatus.granted && audioStatus.granted);
    } catch {
      setPermissionsGranted(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => checkPermissions(), 2000);
    return () => clearTimeout(timer);
  }, [checkPermissions]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {permissionsGranted === null ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !permissionsGranted ? (
          <Stack.Screen name="Permissions">
            {(props) => (
              <PermissionsScreen
                {...props}
                onGranted={() => setPermissionsGranted(true)}
              />
            )}
          </Stack.Screen>
        ) : !hasOnboarded ? (
          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingScreen
                {...props}
                onComplete={() => setHasOnboarded(true)}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="BlackScreen" component={BlackScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
