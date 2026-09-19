import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { getLocationFast } from '../lib/location';
import { insertIncident, startTrip, updateTripStatus } from '../lib/supabase';
import { buildSOSMessage, openNativeSMS } from '../lib/sms';

const ROUTES = [
  { id: 'r1', name: 'Lagos ➔ Abuja (Expressway)', durationMins: 480, defaultBus: 'GIGM - Bus #1042' },
  { id: 'r2', name: 'Lagos ➔ Benin City', durationMins: 300, defaultBus: 'Peace Mass - Bus #408' },
  { id: 'r3', name: 'Abuja ➔ Port Harcourt', durationMins: 540, defaultBus: 'ABC Transport - Bus #202' },
  { id: 'r4', name: 'Ibadan ➔ Kaduna', durationMins: 420, defaultBus: 'Chisco Express - Bus #889' },
];

const DANGER_ZONES = [
  {
    id: 'dz1',
    corridor: 'Lokoja - Abuja Highway (km 45-70)',
    level: 'CRITICAL',
    time: 'Recent pings: 18:00 - 22:00',
    advice: 'Avoid night travel. Maintain active Aegis Safe Trip tracking.',
  },
  {
    id: 'dz2',
    corridor: 'Ore - Benin Expressway Bypass',
    level: 'HIGH RISK',
    time: 'Sparse cell towers / 2G zone',
    advice: 'SMS-First mode enabled automatically.',
  },
  {
    id: 'dz3',
    corridor: 'Kaduna - Abuja Expressway Junction',
    level: 'CRITICAL',
    time: 'Security checkpoints active',
    advice: 'Have ID ready. Keep emergency contact set.',
  },
];

export default function PassengerMainScreen({ passengerId }) {
  const [activeTab, setActiveTab] = useState('sos'); // 'sos' | 'trip' | 'danger'
  const [loadingSOS, setLoadingSOS] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(false);

  // Safe Trip state
  const [selectedRoute, setSelectedRoute] = useState(ROUTES[0]);
  const [vehicleId, setVehicleId] = useState(ROUTES[0].defaultBus);
  const [emergencyPhone, setEmergencyPhone] = useState('+234 803 123 4567');
  const [demoFastTimer, setDemoFastTimer] = useState(false);

  const [activeTrip, setActiveTrip] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startingTrip, setStartingTrip] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    let timer = null;
    if (activeTrip && activeTrip.status === 'active') {
      timer = setInterval(() => {
        const now = Date.now();
        const end = new Date(activeTrip.expected_arrival).getTime();
        const diff = Math.max(0, Math.floor((end - now) / 1000));
        setTimeLeft(diff);

        if (diff <= 0) {
          handleAutoAlert();
          clearInterval(timer);
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeTrip]);

  const handleSOSPress = async () => {
    try {
      setLoadingSOS(true);
      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 200, 100, 200]);
      }

      const coords = await getLocationFast();

      const message = buildSOSMessage({
        name: 'Demo Passenger',
        route: activeTrip ? activeTrip.bus_route : selectedRoute.name,
        lat: coords.latitude,
        lng: coords.longitude,
        vehicleId: activeTrip ? activeTrip.vehicle_id : vehicleId,
      });

      await Promise.all([
        openNativeSMS(emergencyPhone, message),
        insertIncident({
          passenger_id: passengerId || 'demo-passenger-001',
          latitude: coords.latitude,
          longitude: coords.longitude,
          trigger_type: 'manual',
          status: 'active',
        }),
      ]);

      setSosSuccess(true);
      setTimeout(() => setSosSuccess(false), 5000);
    } catch (e) {
      console.log('[SOS error]', e);
    } finally {
      setLoadingSOS(false);
    }
  };

  const handleStartTrip = async () => {
    setStartingTrip(true);
    const coords = await getLocationFast();

    const durationSeconds = demoFastTimer ? 30 : selectedRoute.durationMins * 60;
    const now = new Date();
    const expectedArrival = new Date(now.getTime() + durationSeconds * 1000);

    const tripData = {
      passenger_id: passengerId || 'demo-passenger-001',
      passenger_name: 'Demo Passenger',
      bus_route: selectedRoute.name,
      vehicle_id: vehicleId,
      departure_location: selectedRoute.name.split('➔')[0].trim(),
      arrival_location: selectedRoute.name.split('➔')[1].trim(),
      departure_time: now.toISOString(),
      expected_arrival: expectedArrival.toISOString(),
      status: 'active',
      latitude: coords.latitude,
      longitude: coords.longitude,
      emergency_contact: emergencyPhone,
    };

    const res = await startTrip(tripData);
    setActiveTrip(res.data || tripData);
    setTimeLeft(durationSeconds);
    setStartingTrip(false);
  };

  const handleCheckOut = async () => {
    if (!activeTrip) return;
    setCheckingOut(true);
    await updateTripStatus(activeTrip.id, 'completed', {
      actual_arrival: new Date().toISOString(),
    });
    setActiveTrip(null);
    setCheckingOut(false);
  };

  const handleAutoAlert = async () => {
    if (!activeTrip || activeTrip.status === 'alert') return;
    await updateTripStatus(activeTrip.id, 'alert');
    setActiveTrip((prev) => (prev ? { ...prev, status: 'alert' } : null));

    const coords = await getLocationFast();
    const message = `AUTO-ALERT: Passenger did not check out! Bus: ${activeTrip.bus_route} (${activeTrip.vehicle_id}). Location: https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
    openNativeSMS(emergencyPhone, message);
  };

  const formatTimeLeft = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}h ${remainMins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerBadge}>NIGERIA INTERSTATE</Text>
          <Text style={styles.headerTitle}>AEGIS</Text>
        </View>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>SMS-First Active</Text>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sos' && styles.tabActiveSOS]}
          onPress={() => setActiveTab('sos')}
        >
          <Text style={[styles.tabText, activeTab === 'sos' && styles.tabTextActive]}>
            🚨 SOS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trip' && styles.tabActiveTrip]}
          onPress={() => setActiveTab('trip')}
        >
          <Text style={[styles.tabText, activeTab === 'trip' && styles.tabTextActive]}>
            🚌 SAFE TRIP
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'danger' && styles.tabActiveDanger]}
          onPress={() => setActiveTab('danger')}
        >
          <Text style={[styles.tabText, activeTab === 'danger' && styles.tabTextActive]}>
            ⚠️ DANGER ZONES
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'sos' ? (
          /* SOS TAB */
          <View style={styles.sosContainer}>
            <Text style={styles.sosHeadline}>One-Tap Distress Signal</Text>
            <Text style={styles.sosSubhead}>
              Instant native SMS with your GPS coordinates & Google Maps link to your emergency contact. No data required.
            </Text>

            <View style={styles.sosButtonWrapper}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[styles.sosButton, loadingSOS && styles.sosButtonDisabled]}
                  onPress={handleSOSPress}
                  disabled={loadingSOS}
                  activeOpacity={0.8}
                >
                  {loadingSOS ? (
                    <ActivityIndicator size="large" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.sosButtonText}>SOS</Text>
                      <Text style={styles.sosButtonSub}>TAP FOR HELP</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

            {sosSuccess && (
              <View style={styles.alertSuccessBox}>
                <Text style={styles.alertSuccessTitle}>✓ SOS Alert Dispatched!</Text>
                <Text style={styles.alertSuccessSub}>SMS app launched & backend command center notified.</Text>
              </View>
            )}

            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Emergency Contact</Text>
              <TextInput
                style={styles.input}
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                placeholder="Emergency Phone Number"
                keyboardType="phone-pad"
              />
              <Text style={styles.infoNote}>
                * Works over GSM SMS (2G/3G/4G). Operates reliably in remote highway zones.
              </Text>
            </View>
          </View>
        ) : activeTab === 'trip' ? (
          /* SAFE TRIP TAB */
          <View style={styles.tripContainer}>
            {activeTrip ? (
              <View style={styles.activeTripCard}>
                <View style={styles.activeTripHeader}>
                  <View style={[styles.badge, activeTrip.status === 'alert' ? styles.badgeRed : styles.badgeGreen]}>
                    <Text style={styles.badgeText}>
                      {activeTrip.status === 'alert' ? 'ALERT: MISSED CHECKOUT' : 'TRIP IN PROGRESS'}
                    </Text>
                  </View>
                  <Text style={styles.activeTripRoute}>{activeTrip.bus_route}</Text>
                  <Text style={styles.activeTripBus}>{activeTrip.vehicle_id}</Text>
                </View>

                <View style={styles.timerSection}>
                  <Text style={styles.timerLabel}>ETA COUNTDOWN</Text>
                  <Text style={[styles.timerValue, activeTrip.status === 'alert' && styles.timerValueAlert]}>
                    {formatTimeLeft(timeLeft)}
                  </Text>
                  <Text style={styles.timerNote}>
                    {activeTrip.status === 'alert'
                      ? 'Auto-alert triggered to emergency contact!'
                      : 'Tap check-out when you arrive safely.'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.checkOutButton}
                  onPress={handleCheckOut}
                  disabled={checkingOut}
                >
                  {checkingOut ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.checkOutButtonText}>✓ Arrived Safely (Check Out)</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sosEmergencyLink}
                  onPress={handleSOSPress}
                >
                  <Text style={styles.sosEmergencyLinkText}>🚨 Trigger SOS Emergency Alert Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.startTripForm}>
                <Text style={styles.formTitle}>Safe Trip Check-in</Text>
                <Text style={styles.formSub}>
                  Set up arrival tracking before your interstate journey. If you don't check out on arrival, Aegis auto-alerts your contact.
                </Text>

                <Text style={styles.label}>Select Route</Text>
                {ROUTES.map((route) => (
                  <TouchableOpacity
                    key={route.id}
                    style={[styles.routeOption, selectedRoute.id === route.id && styles.routeOptionSelected]}
                    onPress={() => {
                      setSelectedRoute(route);
                      setVehicleId(route.defaultBus);
                    }}
                  >
                    <Text style={[styles.routeOptionText, selectedRoute.id === route.id && styles.routeOptionTextSelected]}>
                      {route.name}
                    </Text>
                    <Text style={styles.routeOptionSub}>{Math.round(route.durationMins / 60)} hrs expected</Text>
                  </TouchableOpacity>
                ))}

                <Text style={[styles.label, { marginTop: 16 }]}>Vehicle / Bus ID</Text>
                <TextInput
                  style={styles.input}
                  value={vehicleId}
                  onChangeText={setVehicleId}
                  placeholder="e.g. GIGM - Bus #1042"
                />

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Demo Fast Timer (30s countdown)</Text>
                  <TouchableOpacity
                    style={[styles.toggleBtn, demoFastTimer && styles.toggleBtnActive]}
                    onPress={() => setDemoFastTimer(!demoFastTimer)}
                  >
                    <Text style={styles.toggleBtnText}>{demoFastTimer ? 'ON (30s)' : 'OFF (Prod)'}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.startTripButton}
                  onPress={handleStartTrip}
                  disabled={startingTrip}
                >
                  {startingTrip ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.startTripButtonText}>🚌 Start Safe Trip Tracking</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          /* DANGER ZONES TAB */
          <View style={styles.dangerContainer}>
            <Text style={styles.formTitle}>Highway Threat Advisories</Text>
            <Text style={styles.formSub}>
              Live community & security pings along major Nigerian interstate corridors.
            </Text>

            {DANGER_ZONES.map((zone) => (
              <View key={zone.id} style={styles.dangerCard}>
                <View style={styles.dangerCardHeader}>
                  <Text style={styles.dangerTitle}>{zone.corridor}</Text>
                  <View style={[styles.dangerBadge, zone.level === 'CRITICAL' ? styles.badgeRed : styles.badgeOrange]}>
                    <Text style={styles.dangerBadgeText}>{zone.level}</Text>
                  </View>
                </View>
                <Text style={styles.dangerTime}>{zone.time}</Text>
                <Text style={styles.dangerAdvice}>💡 Advisory: {zone.advice}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FREE TIER AD SPONSORED BANNER */}
      <View style={styles.adBanner}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>SPONSORED</Text>
        </View>
        <Text style={styles.adText} numberOfLines={1}>
          🛡️ AXA Mansard Interstate Trip Insurance — Get ₦1M coverage for ₦200/trip
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'column',
  },
  headerBadge: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  statusText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  tabActiveSOS: {
    backgroundColor: '#EF4444',
  },
  tabActiveTrip: {
    backgroundColor: '#2563EB',
  },
  tabActiveDanger: {
    backgroundColor: '#EA580C',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  sosContainer: {
    alignItems: 'center',
  },
  sosHeadline: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  sosSubhead: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  sosButtonWrapper: {
    marginVertical: 28,
    alignItems: 'center',
  },
  sosButton: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sosButtonDisabled: {
    opacity: 0.7,
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 2,
  },
  sosButtonSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  alertSuccessBox: {
    width: '100%',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22C55E',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    alignItems: 'center',
  },
  alertSuccessTitle: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '700',
  },
  alertSuccessSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
  },
  infoCardTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  infoNote: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 10,
    lineHeight: 15,
  },
  tripContainer: {
    width: '100%',
  },
  startTripForm: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
  },
  formTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  formSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 17,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  routeOption: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  routeOptionSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  routeOptionText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  routeOptionTextSelected: {
    color: '#38BDF8',
  },
  routeOptionSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  switchLabel: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  toggleBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  toggleBtnActive: {
    backgroundColor: '#EA580C',
  },
  toggleBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  startTripButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  startTripButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  activeTripCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  activeTripHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  badgeRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  badgeOrange: {
    backgroundColor: 'rgba(234, 88, 12, 0.2)',
  },
  badgeText: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  activeTripRoute: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  activeTripBus: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  timerSection: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    width: '100%',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  timerLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  timerValue: {
    color: '#38BDF8',
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  timerValueAlert: {
    color: '#EF4444',
  },
  timerNote: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
  },
  checkOutButton: {
    backgroundColor: '#16A34A',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  checkOutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  sosEmergencyLink: {
    paddingVertical: 8,
  },
  sosEmergencyLinkText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  dangerContainer: {
    width: '100%',
  },
  dangerCard: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  dangerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dangerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  dangerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dangerBadgeText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '900',
  },
  dangerTime: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 6,
  },
  dangerAdvice: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 16,
  },
  adBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  adBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  adBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  adText: {
    color: '#CBD5E1',
    fontSize: 11,
    flex: 1,
  },
});
