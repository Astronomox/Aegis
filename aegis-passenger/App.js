import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { AudioModule } from 'expo-audio';

import SplashScreen from './screens/SplashScreen';
import PermissionsScreen from './screens/PermissionsScreen';
import PassengerMainScreen from './screens/PassengerMainScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { getHasOnboarded, getPassengerId } from './lib/storage';

const Stack = createNativeStackNavigator();

export default function App() {
  const [permissionsGranted, setPermissionsGranted] = useState(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  // Real passenger ID from DB (or 'demo-passenger-001' in mock mode)
  const [passengerId, setPassengerId] = useState(null);

  const checkPermissions = useCallback(async () => {
    try {
      const locStatus = await Location.getForegroundPermissionsAsync();
      setPermissionsGranted(locStatus.granted);
    } catch {
      setPermissionsGranted(false);
    }
  }, []);

  // On boot: load persisted state then check permissions
  useEffect(() => {
    (async () => {
      const [onboarded, storedId] = await Promise.all([
        getHasOnboarded(),
        getPassengerId(),
      ]);
      if (onboarded && storedId) {
        setHasOnboarded(true);
        setPassengerId(storedId);
      }
      // Small splash delay then check permissions
      setTimeout(() => checkPermissions(), 1500);
    })();
  }, [checkPermissions]);

  const handleOnboardingComplete = (id) => {
    setPassengerId(id);
    setHasOnboarded(true);
  };

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
                onComplete={handleOnboardingComplete}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="PassengerMain">
            {(props) => (
              <PassengerMainScreen
                {...props}
                passengerId={passengerId}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

