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
  Modal,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  getEmergencyContact,
  setEmergencyContact,
  getEmergencyContactName,
  setEmergencyContactName,
  getHealthConditions,
  setHealthConditions,
  getDisabilities,
  setDisabilities,
  getPassengerName,
  setPassengerName,
  getPairingCode,
  setPairingCode,
  getPassengerId,
  setPassengerId,
} from '../lib/storage';
import { getLocationFast } from '../lib/location';
import {
  insertIncident,
  createPassengerPairingCode,
  upsertPassengerProfile,
  fetchPassengerWatchers,
  deleteWatcher,
} from '../lib/supabase';
import { buildSOSMessage, openNativeSMS } from '../lib/sms';

const { width, height } = Dimensions.get('window');
const HEALTH_OPTIONS = ['Asthma', 'Diabetes', 'Heart Condition', 'Epilepsy', 'Hypertension', 'Other'];
const DISABILITY_OPTIONS = ['Hearing Impaired', 'Visually Impaired', 'Mobility Impaired', 'Speech Impaired', 'Other'];

export default function PassengerMainScreen({ passengerId: initialPassengerId }) {
  const [activeTab, setActiveTab] = useState('sos');
  const [loading, setLoading] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);

  // Profile state
  const [passengerId, setPassengerIdState] = useState(initialPassengerId || 'passenger-' + Date.now());
  const [passengerName, setPassengerNameState] = useState('');
  const [emergencyContactName, setEmContactName] = useState('');
  const [emergencyContactPhone, setEmContactPhone] = useState('');
  const [selectedHealth, setSelectedHealth] = useState([]);
  const [selectedDisabilities, setSelectedDisabilities] = useState([]);
  const [pairingCode, setPairingCodeState] = useState('');

  // Watchers state
  const [activeWatchers, setActiveWatchers] = useState([]);
  const [loadingWatchers, setLoadingWatchers] = useState(false);

  // UI state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showPairingSuccess, setShowPairingSuccess] = useState(false);

  // SOS state
  const [sosSending, setSosSending] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(false);
  const [sosMessage, setSosMessage] = useState('');

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideInAnim = useRef(new Animated.Value(height)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProfile();
  }, []);

  const startPulseAnimation = () => {
    // Just set initial value, no animation
    pulseAnim.setValue(1);
  };


  const showProfileCompleteAnimation = () => {
    slideInAnim.setValue(height);
    Animated.timing(slideInAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };


  const loadWatchers = async (pId) => {
    const targetId = pId || passengerId;
    if (!targetId) return;
    try {
      setLoadingWatchers(true);
      const { data } = await fetchPassengerWatchers(targetId);
      if (data) setActiveWatchers(data);
    } catch (e) {
      console.log('[loadWatchers error]', e);
    } finally {
      setLoadingWatchers(false);
    }
  };

  const handleRevokeWatcher = async (watcherId) => {
    const performRevoke = async () => {
      try {
        await deleteWatcher(watcherId, passengerId);
        setActiveWatchers((prev) => prev.filter((w) => w.id !== watcherId));
        if (Platform.OS === 'web') {
          alert('Watcher permission revoked.');
        } else {
          Alert.alert('Permission Revoked', 'Watcher access has been removed.');
        }
      } catch (e) {
        Alert.alert('Error', 'Failed to revoke watcher permission');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to revoke access for this watcher?')) {
        performRevoke();
      }
    } else {
      Alert.alert(
        'Revoke Permission',
        'Are you sure you want to remove this watcher? They will no longer be able to track your trips or receive alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Revoke Access', style: 'destructive', onPress: performRevoke },
        ]
      );
    }
  };

  const loadProfile = async () => {
    try {
      const [emContact, code, storedId] = await Promise.all([
        getEmergencyContact(),
        getPairingCode(),
        getPassengerId(),
      ]);

      const currentId = storedId || passengerId;
      if (emContact && code) {
        setProfileComplete(true);
      }

      getPassengerName().then((name) => name && setPassengerNameState(name));
      getEmergencyContactName().then((name) => name && setEmContactName(name));
      getHealthConditions().then((health) => health.length > 0 && setSelectedHealth(health));
      getDisabilities().then((d) => d.length > 0 && setSelectedDisabilities(d));
      getPassengerId().then((id) => id && setPassengerIdState(id));

      await loadWatchers(currentId);
    } catch (e) {
      console.log('[loadProfile error]', e);
    }
  };

  const saveProfile = async () => {
    if (!passengerName.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    if (!emergencyContactPhone.trim()) {
      Alert.alert('Required', 'Please enter emergency contact phone number');
      return;
    }

    try {
      setLoading(true);
      await Promise.all([
        setPassengerName(passengerName),
        setPassengerId(passengerId),
        setEmergencyContactName(emergencyContactName),
        setEmergencyContact(emergencyContactPhone),
        setHealthConditions(selectedHealth),
        setDisabilities(selectedDisabilities),
      ]);

      await upsertPassengerProfile({
        passenger_id: passengerId,
        name: passengerName,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        health_conditions: selectedHealth,
        disabilities: selectedDisabilities,
        pairing_code: pairingCode,
      });

      setProfileComplete(true);
      showProfileCompleteAnimation();
      setShowProfileModal(false);

      setTimeout(() => {
        setSosMessage('✓ Profile saved successfully!');
        setTimeout(() => setSosMessage(''), 2000);
      }, 500);
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePairingCode = async () => {
    if (!passengerName.trim()) {
      Alert.alert('Required', 'Please complete your profile first');
      setShowProfileModal(true);
      return;
    }

    try {
      setLoading(true);
      const result = await createPassengerPairingCode(passengerId, passengerName);
      if (result.code) {
        await setPairingCode(result.code);
        setPairingCodeState(result.code);

        await upsertPassengerProfile({
          passenger_id: passengerId,
          name: passengerName,
          emergency_contact_name: emergencyContactName,
          emergency_contact_phone: emergencyContactPhone,
          health_conditions: selectedHealth,
          disabilities: selectedDisabilities,
          pairing_code: result.code,
        });

        setShowPairingSuccess(true);
        setTimeout(() => setShowPairingSuccess(false), 3000);
      }
    } catch (e) {
      Alert.alert('Error', `Failed to generate pairing code: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = async () => {
    await Clipboard.setStringAsync(pairingCode);
    Alert.alert('Copied', 'Pairing code copied to clipboard');
  };

  const handleSOS = async () => {
    if (!emergencyContactPhone.trim()) {
      Alert.alert('Setup Required', 'Please complete your emergency contact in Profile');
      setActiveTab('profile');
      return;
    }

    try {
      setSosSending(true);

      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 300]);
      }

      const coords = await getLocationFast();
      const message = buildSOSMessage({
        name: passengerName || 'Passenger',
        lat: coords.latitude,
        lng: coords.longitude,
        health: selectedHealth,
        disabilities: selectedDisabilities,
      });

      await Promise.all([
        openNativeSMS(emergencyContactPhone, message),
        insertIncident({
          passenger_id: passengerId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          trigger_type: 'manual',
          status: 'active',
          health_conditions: selectedHealth.join(','),
          disabilities: selectedDisabilities.join(','),
        }),
      ]);

      setSosSuccess(true);
      setTimeout(() => setSosSuccess(false), 4000);
    } catch (e) {
      Alert.alert('Error', `SOS failed: ${e.message}`);
    } finally {
      setSosSending(false);
    }
  };

  const ProfileCheckItem = ({ label, value, complete }) => (
    <View style={styles.checkItem}>
      <View style={[styles.checkBox, complete && styles.checkBoxDone]}>
        {complete && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.checkContent}>
        <Text style={styles.checkLabel}>{label}</Text>
        <Text style={styles.checkValue}>{value || 'Not set'}</Text>
      </View>
    </View>
  );

  const renderSOSTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sosHeader}>
        <Text style={styles.sosTitle}>EMERGENCY SOS</Text>
        <Text style={styles.sosSubtitle}>
          One tap sends SMS + alerts emergency contact & watchers
        </Text>
      </View>

      {!profileComplete && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>⚠️ Complete your profile first</Text>
          <TouchableOpacity
            style={styles.warningButton}
            onPress={() => setShowProfileModal(true)}
          >
            <Text style={styles.warningButtonText}>Setup Now</Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.View style={{ transform: [{ scale: pulseAnim }], marginVertical: 40 }}>
        <TouchableOpacity
          style={[styles.sosButton, sosSending && styles.sosButtonDisabled]}
          onPress={handleSOS}
          disabled={sosSending || !profileComplete}
          activeOpacity={0.8}
        >
          {sosSending ? (
            <>
              <ActivityIndicator size={60} color="#fff" />
              <Text style={styles.sosSendingText}>SENDING...</Text>
            </>
          ) : (
            <>
              <Text style={styles.sosButtonText}>SOS</Text>
              <Text style={styles.sosButtonSubtext}>TAP FOR HELP</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {sosSuccess && (
        <Animated.View style={[styles.sosSuccessBox, { opacity: fadeInAnim }]}>
          <Text style={styles.sosSuccessTitle}>✓ ALERT SENT</Text>
          <Text style={styles.sosSuccessText}>
            SMS sent to {emergencyContactName || 'emergency contact'}
          </Text>
          <Text style={styles.sosSuccessDetail}>
            Watcher dashboard has been notified
          </Text>
        </Animated.View>
      )}

      <View style={styles.sosInfoCard}>
        <Text style={styles.sosInfoTitle}>What happens when you tap SOS:</Text>
        <View style={styles.sosInfoItem}>
          <Text style={styles.sosInfoIcon}>📍</Text>
          <Text style={styles.sosInfoText}>Your GPS location is shared</Text>
        </View>
        <View style={styles.sosInfoItem}>
          <Text style={styles.sosInfoIcon}>🗺️</Text>
          <Text style={styles.sosInfoText}>Google Maps link included</Text>
        </View>
        <View style={styles.sosInfoItem}>
          <Text style={styles.sosInfoIcon}>🩺</Text>
          <Text style={styles.sosInfoText}>Health & disability info sent</Text>
        </View>
        <View style={styles.sosInfoItem}>
          <Text style={styles.sosInfoIcon}>📱</Text>
          <Text style={styles.sosInfoText}>SMS works on 2G/3G/4G</Text>
        </View>
      </View>
    </View>
  );

  const renderProfileTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.profileHeader}>
        <Text style={styles.profileTitle}>Your Safety Profile</Text>
        <Text style={styles.profileSubtitle}>
          First responders will see this information
        </Text>
      </View>

      <View style={styles.profileCard}>
        <Text style={styles.profileSectionTitle}>Profile Status</Text>
        <ProfileCheckItem
          label="Name"
          value={passengerName}
          complete={!!passengerName}
        />
        <ProfileCheckItem
          label="Emergency Contact"
          value={emergencyContactName || emergencyContactPhone}
          complete={!!emergencyContactPhone}
        />
        <ProfileCheckItem
          label="Health Information"
          value={selectedHealth.length > 0 ? selectedHealth.join(', ') : 'None'}
          complete={selectedHealth.length > 0}
        />

        {!profileComplete && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => setShowProfileModal(true)}
          >
            <Text style={styles.completeButtonText}>Complete Profile Now</Text>
          </TouchableOpacity>
        )}
      </View>

      {profileComplete && (
        <>
          <View style={styles.pairingSection}>
            <Text style={styles.profileSectionTitle}>Pair with Watcher</Text>
            <Text style={styles.pairingDescription}>
              Share this code with someone you trust to watch over your trips
            </Text>

            {pairingCode ? (
              <View style={styles.pairingCodeBox}>
                <View style={styles.codeDisplay}>
                  <Text style={styles.codeText}>{pairingCode}</Text>
                </View>
                <TouchableOpacity
                  style={styles.copyCodeButton}
                  onPress={copyCodeToClipboard}
                >
                  <Text style={styles.copyButtonText}>📋 Copy Code</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={generatePairingCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Generate Pairing Code</Text>
                )}
              </TouchableOpacity>
            )}

            {showPairingSuccess && (
              <View style={styles.successNotification}>
                <Text style={styles.successNotificationText}>
                  ✓ Pairing code generated!
                </Text>
              </View>
            )}
          </View>

          {/* ACTIVE WATCHERS & PERMISSION MANAGEMENT */}
          <View style={[styles.pairingSection, { marginTop: 12 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.profileSectionTitle}>👁️ Active Watchers ({activeWatchers.length})</Text>
              <TouchableOpacity onPress={() => loadWatchers(passengerId)}>
                <Text style={{ fontSize: 12, color: '#F0C3BE', fontWeight: '600' }}>🔄 Refresh</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.pairingDescription}>
              These fleet operators and contacts can view your safety status. Revoke permission anytime.
            </Text>

            {activeWatchers.length > 0 ? (
              activeWatchers.map((watcher) => (
                <View key={watcher.id} style={styles.watcherRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.watcherName}>{watcher.label || watcher.passenger_id || 'Fleet Command Watcher'}</Text>
                    <Text style={styles.watcherTime}>
                      Connected: {watcher.created_at ? new Date(watcher.created_at).toLocaleDateString() : 'Active'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.revokeButton}
                    onPress={() => handleRevokeWatcher(watcher.id)}
                  >
                    <Text style={styles.revokeButtonText}>🚫 Revoke</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyWatchersBox}>
                <Text style={{ color: '#D4C5BE', fontSize: 12, fontStyle: 'italic' }}>
                  No active watchers currently paired. Share your pairing code to pair with fleet command.
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => setShowProfileModal(true)}
          >
            <Text style={styles.editProfileButtonText}>✎ Edit Profile Card</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <SafeAreaView style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLogo}>AEGIS</Text>
            <Text style={styles.headerTagline}>Travel Safety Network</Text>
          </View>
          <View style={styles.headerStatus}>
            <View style={[styles.statusDot, profileComplete && styles.statusDotActive]} />
            <Text style={styles.statusText}>
              {profileComplete ? 'Active' : 'Setup'}
            </Text>
          </View>
        </View>

        {/* TAB NAVIGATION */}
        <View style={styles.tabNav}>
          {[
            { id: 'sos', icon: '🚨', label: 'SOS' },
            { id: 'profile', icon: '👤', label: 'Profile' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.navTab, activeTab === tab.id && styles.navTabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.navTabIcon}>{tab.icon}</Text>
              <Text style={[styles.navTabLabel, activeTab === tab.id && styles.navTabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CONTENT */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollPad}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'sos' && renderSOSTab()}
          {activeTab === 'profile' && renderProfileTab()}
        </ScrollView>
      </SafeAreaView>

      {/* PROFILE MODAL */}
      <Modal visible={showProfileModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowProfileModal(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <View style={{ width: 30 }} />
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalPad}
            showsVerticalScrollIndicator={false}
          >
            {/* Name */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Your Name</Text>
              <TextInput
                style={styles.formInput}
                value={passengerName}
                onChangeText={setPassengerNameState}
                placeholder="Enter your full name"
                placeholderTextColor="#64748B"
              />
            </View>

            {/* Emergency Contact Name */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Emergency Contact Name</Text>
              <TextInput
                style={styles.formInput}
                value={emergencyContactName}
                onChangeText={setEmContactName}
                placeholder="e.g., Mum, Best Friend"
                placeholderTextColor="#64748B"
              />
            </View>

            {/* Emergency Contact Phone */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Emergency Contact Phone *</Text>
              <TextInput
                style={styles.formInput}
                value={emergencyContactPhone}
                onChangeText={setEmContactPhone}
                placeholder="+234 803 123 4567"
                keyboardType="phone-pad"
                placeholderTextColor="#64748B"
              />
              <Text style={styles.formHelper}>This is who gets the SOS alert</Text>
            </View>

            {/* Health Conditions */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Health Conditions</Text>
              <Text style={styles.formHelper}>Select any that apply</Text>
              <View style={styles.optionsGrid}>
                {HEALTH_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionChip,
                      selectedHealth.includes(option) && styles.optionChipActive,
                    ]}
                    onPress={() => {
                      setSelectedHealth((prev) =>
                        prev.includes(option)
                          ? prev.filter((x) => x !== option)
                          : [...prev, option]
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        selectedHealth.includes(option) && styles.optionChipTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Disabilities */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Accessibility Needs</Text>
              <Text style={styles.formHelper}>Select any that apply</Text>
              <View style={styles.optionsGrid}>
                {DISABILITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionChip,
                      selectedDisabilities.includes(option) && styles.optionChipActive,
                    ]}
                    onPress={() => {
                      setSelectedDisabilities((prev) =>
                        prev.includes(option)
                          ? prev.filter((x) => x !== option)
                          : [...prev, option]
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        selectedDisabilities.includes(option) && styles.optionChipTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.primaryButton, styles.savButton, loading && styles.buttonDisabled]}
              onPress={saveProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>💾 Save Profile</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* PAIRING SUCCESS NOTIFICATION */}
      {showPairingSuccess && (
        <View style={styles.notificationOverlay}>
          <View style={styles.notificationCard}>
            <Text style={styles.notificationIcon}>✓</Text>
            <Text style={styles.notificationTitle}>Pairing Code Generated!</Text>
            <Text style={styles.notificationText}>Share the code with watchers</Text>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#312C51',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#48426D',
    borderBottomWidth: 1,
    borderBottomColor: '#5A5380',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLogo: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F0C3BE',
    letterSpacing: 3,
  },
  headerTagline: {
    fontSize: 11,
    color: '#D4C5BE',
    marginTop: 2,
    fontWeight: '500',
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9A8FA3',
  },
  statusDotActive: {
    backgroundColor: '#F1AA9B',
  },
  statusText: {
    fontSize: 11,
    color: '#D4C5BE',
    fontWeight: '600',
  },

  tabNav: {
    flexDirection: 'row',
    backgroundColor: '#48426D',
    borderBottomWidth: 1,
    borderBottomColor: '#5A5380',
    paddingHorizontal: 12,
  },
  navTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  navTabActive: {
    borderBottomColor: '#F0C3BE',
  },
  navTabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navTabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A8FA3',
    letterSpacing: 0.5,
  },
  navTabLabelActive: {
    color: '#F0C3BE',
  },

  scrollContent: {
    flex: 1,
  },
  scrollPad: {
    paddingBottom: 40,
  },

  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // SOS Tab
  sosHeader: {
    marginBottom: 24,
  },
  sosTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sosSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },

  warningBox: {
    backgroundColor: 'rgba(241, 170, 155, 0.15)',
    borderColor: '#F1AA9B',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warningText: {
    color: '#F1AA9B',
    fontSize: 13,
    fontWeight: '600',
  },
  warningButton: {
    backgroundColor: '#F1AA9B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  warningButtonText: {
    color: '#312C51',
    fontSize: 11,
    fontWeight: '700',
  },

  sosButton: {
    width: '100%',
    paddingVertical: 70,
    backgroundColor: '#F1AA9B',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F1AA9B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  sosButtonDisabled: {
    opacity: 0.6,
  },
  sosButtonText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#312C51',
    letterSpacing: 2,
  },
  sosButtonSubtext: {
    fontSize: 13,
    fontWeight: '700',
    color: '#312C51',
    marginTop: 8,
    letterSpacing: 1.5,
  },
  sosSendingText: {
    fontSize: 12,
    color: '#312C51',
    marginTop: 8,
    fontWeight: '600',
  },

  sosSuccessBox: {
    backgroundColor: 'rgba(240, 195, 190, 0.15)',
    borderColor: '#F0C3BE',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
    marginBottom: 20,
  },
  sosSuccessTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F0C3BE',
    marginBottom: 6,
    letterSpacing: 1,
  },
  sosSuccessText: {
    fontSize: 13,
    color: '#F0C3BE',
    fontWeight: '600',
    marginBottom: 4,
  },
  sosSuccessDetail: {
    fontSize: 11,
    color: '#D4C5BE',
    fontWeight: '500',
  },

  sosInfoCard: {
    backgroundColor: '#48426D',
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#5A5380',
  },
  sosInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4C5BE',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  sosInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  sosInfoIcon: {
    fontSize: 18,
    width: 24,
  },
  sosInfoText: {
    fontSize: 12,
    color: '#D4C5BE',
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },

  // Profile Tab
  profileHeader: {
    marginBottom: 20,
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  profileSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },

  profileCard: {
    backgroundColor: '#48426D',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#5A5380',
  },
  profileSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F0C3BE',
    marginBottom: 14,
    letterSpacing: 0.5,
  },

  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#5A5380',
    gap: 12,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#5A5380',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxDone: {
    backgroundColor: '#F0C3BE',
    borderColor: '#F0C3BE',
  },
  checkmark: {
    color: '#312C51',
    fontWeight: '900',
    fontSize: 14,
  },
  checkContent: {
    flex: 1,
  },
  checkLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4C5BE',
  },
  checkValue: {
    fontSize: 11,
    color: '#9A8FA3',
    marginTop: 2,
    fontWeight: '500',
  },

  completeButton: {
    backgroundColor: '#F0C3BE',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  completeButtonText: {
    color: '#312C51',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  pairingSection: {
    backgroundColor: '#48426D',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#5A5380',
  },
  pairingDescription: {
    fontSize: 12,
    color: '#9A8FA3',
    marginBottom: 14,
    fontWeight: '500',
  },

  pairingCodeBox: {
    backgroundColor: '#312C51',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#F0C3BE',
    marginBottom: 14,
  },
  codeDisplay: {
    alignItems: 'center',
    marginBottom: 12,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F0C3BE',
    letterSpacing: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyCodeButton: {
    backgroundColor: '#F0C3BE',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#312C51',
    fontWeight: '800',
    fontSize: 12,
  },

  editProfileButton: {
    backgroundColor: '#48426D',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5A5380',
    marginBottom: 20,
  },
  editProfileButtonText: {
    color: '#F0C3BE',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  primaryButton: {
    backgroundColor: '#F0C3BE',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#312C51',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  savButton: {
    marginBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  successNotification: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22C55E',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  successNotificationText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#312C51',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#5A5380',
    backgroundColor: '#48426D',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#9A8FA3',
    fontWeight: '600',
    width: 30,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F0C3BE',
    letterSpacing: 0.3,
  },
  modalContent: {
    flex: 1,
  },
  modalPad: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D4C5BE',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#312C51',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F0C3BE',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#5A5380',
    fontWeight: '500',
  },
  formHelper: {
    fontSize: 11,
    color: '#9A8FA3',
    marginTop: 6,
    fontWeight: '500',
  },

  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  optionChip: {
    borderWidth: 1.5,
    borderColor: '#5A5380',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  optionChipActive: {
    backgroundColor: '#F0C3BE',
    borderColor: '#F0C3BE',
  },
  optionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D4C5BE',
  },
  optionChipTextActive: {
    color: '#312C51',
    fontWeight: '800',
  },

  notificationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  notificationCard: {
    backgroundColor: '#48426D',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0C3BE',
  },
  notificationIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F0C3BE',
    marginBottom: 6,
  },
  notificationText: {
    fontSize: 12,
    color: '#D4C5BE',
    fontWeight: '500',
  },

  watcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#312C51',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#5A5380',
  },
  watcherName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  watcherTime: {
    fontSize: 11,
    color: '#9A8FA3',
    marginTop: 2,
  },
  revokeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  revokeButtonText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyWatchersBox: {
    padding: 12,
    backgroundColor: '#312C51',
    borderRadius: 8,
    alignItems: 'center',
  },
});