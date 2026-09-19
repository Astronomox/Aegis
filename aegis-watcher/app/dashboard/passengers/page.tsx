'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, MOCK_MODE } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { MOCK_PASSENGER_PROFILES, MOCK_INCIDENTS, MOCK_TRIPS } from '@/lib/mock-data';
import { fetchPassengerProfile, savePassengerProfile, getLocalProfiles } from '@/lib/profiles';
import type { Incident, Trip, PassengerProfile } from '@/types';
import AppTopBar from '@/components/AppTopBar';
import AddPassengerModal from '@/components/AddPassengerModal';
import EditPassengerModal from '@/components/EditPassengerModal';

interface WatcherRow {
  id: string;
  passenger_id: string;
  label: string | null;
  created_at: string;
}

const MOCK_WATCHERS: WatcherRow[] = [
  { id: 'w-001', passenger_id: 'demo-passenger-001', label: 'Demo Passenger', created_at: new Date().toISOString() },
  { id: 'w-002', passenger_id: 'user-001', label: 'Aisha Bello', created_at: new Date().toISOString() },
  { id: 'w-003', passenger_id: 'user-002', label: 'Emeka Okafor', created_at: new Date().toISOString() },
];

export default function PassengersPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();

  const [watchers, setWatchers] = useState<WatcherRow[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, PassengerProfile>>({});
  const [editingProfile, setEditingProfile] = useState<PassengerProfile | null>(null);

  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const saveWatchersState = (updater: (prev: WatcherRow[]) => WatcherRow[]) => {
    setWatchers((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        localStorage.setItem('aegis_watchers', JSON.stringify(next));
      }
      return next;
    });
  };

  const loadProfiles = async (watcherList: WatcherRow[]) => {
    const map: Record<string, PassengerProfile> = {};
    await Promise.all(
      watcherList.map(async (w) => {
        const p = await fetchPassengerProfile(w.passenger_id);
        map[w.passenger_id] = p;
      })
    );
    setProfilesMap(map);
  };

  const load = async () => {
    let savedWatchers: WatcherRow[] = [];
    if (typeof window !== 'undefined') {
      try {
        const str = localStorage.getItem('aegis_watchers');
        if (str) savedWatchers = JSON.parse(str);
      } catch (e) {
        console.error(e);
      }
    }

    let currentWatchers: WatcherRow[] = savedWatchers.length > 0 ? savedWatchers : MOCK_WATCHERS;

    if (!MOCK_MODE && supabase) {
      try {
        const [watchRes, incRes, tripRes] = await Promise.all([
          supabase.from('watchers').select('*').order('created_at', { ascending: false }),
          supabase.from('incidents').select('*').order('created_at', { ascending: false }),
          supabase.from('trips').select('*').order('created_at', { ascending: false }),
        ]);

        if (watchRes.data && watchRes.data.length > 0) {
          const dbWatchers = watchRes.data as WatcherRow[];
          const merged = [...dbWatchers, ...savedWatchers.filter((s) => !dbWatchers.some((d) => d.id === s.id))];
          currentWatchers = merged;
        }
        if (incRes.data) setIncidents(incRes.data as Incident[]);
        if (tripRes.data) setTrips(tripRes.data as Trip[]);
      } catch (err) {
        console.error(err);
      }
    }

    setWatchers(currentWatchers);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aegis_watchers', JSON.stringify(currentWatchers));
    }
    await loadProfiles(currentWatchers);
    setLoading(false);
  };

  useEffect(() => {
    if (!userLoading) load();
  }, [userLoading, user]);

  const handleAddWithCode = async () => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setAddError('6-digit pairing code required.');
      return;
    }
    if (cleanCode.length !== 6) {
      setAddError('Code must be 6 characters.');
      return;
    }

    setAdding(true);
    setAddError('');

    const newWatcher: WatcherRow = {
      id: `w-${Date.now()}`,
      passenger_id: `passenger-${cleanCode}`,
      label: `Passenger (${cleanCode})`,
      created_at: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/pairing/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await response.json();

      if (response.ok && data.watcher) {
        const serverWatcher = data.watcher as WatcherRow;
        saveWatchersState((prev) => [serverWatcher, ...prev.filter((w) => w.passenger_id !== serverWatcher.passenger_id)]);
      } else {
        saveWatchersState((prev) => [newWatcher, ...prev.filter((w) => w.passenger_id !== newWatcher.passenger_id)]);
      }
    } catch (err) {
      saveWatchersState((prev) => [newWatcher, ...prev.filter((w) => w.passenger_id !== newWatcher.passenger_id)]);
    } finally {
      setCode('');
      setShowForm(false);
      setAdding(false);
      loadProfiles([newWatcher, ...watchers]);
    }
  };

  const handleRemove = async (id: string) => {
    saveWatchersState((prev) => prev.filter((w) => w.id !== id));
    if (!MOCK_MODE && supabase) {
      await supabase.from('watchers').delete().eq('id', id);
    }
  };

  const getProfile = (passengerId: string): PassengerProfile => {
    if (profilesMap[passengerId]) return profilesMap[passengerId];
    if (MOCK_PASSENGER_PROFILES[passengerId]) return MOCK_PASSENGER_PROFILES[passengerId];

    const codeLabel = passengerId.replace('passenger-', '');
    return {
      id: passengerId,
      passenger_id: passengerId,
      name: `Passenger (${codeLabel})`,
      emergency_contact_name: 'Emergency Contact',
      emergency_contact_phone: 'Not set',
      health_conditions: [],
      disabilities: [],
      pairing_code: codeLabel,
      created_at: new Date().toISOString(),
    };
  };

  const getTriggers = (passengerId: string) => {
    const pIncidents = incidents.filter((i) => i.passenger_id === passengerId);
    const pTrips = trips.filter((t) => t.passenger_id === passengerId);
    return { pIncidents, pTrips };
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-paper)', paddingBottom: 60 }}>
      <AppTopBar variant="static" />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            Monitored Fleet Passengers
          </h1>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-ink-muted)', lineHeight: 1.6, marginTop: 6 }}>
            View full passenger mobile profiles, emergency contacts, health/accessibility needs, and real-time trigger history.
          </p>
        </div>

        {/* Add passenger card */}
        <div style={{
          background: 'var(--color-paper-raised)', border: '1px solid var(--color-rule)',
          borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 20,
        }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--color-rule)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-ink)' }}>+ Pair / Add New Passenger</span>
            <button
              onClick={() => { setShowForm((v) => !v); setAddError(''); }}
              style={{
                fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: 'var(--color-accent)', background: 'var(--color-accent-dim)',
                border: '1px solid var(--color-accent-dim)',
                padding: '6px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              }}
            >{showForm ? 'Cancel' : '+ Add Code'}</button>
          </div>

          {showForm && (
            <div style={{ padding: 18 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)', marginBottom: 6, letterSpacing: '0.05em' }}>
                  6-DIGIT PAIRING CODE (FROM PASSENGER APP)
                </label>
                <input
                  style={{
                    width: '100%', padding: '12px 14px', fontSize: 'var(--text-lg)', fontWeight: 800,
                    fontFamily: 'var(--font-mono)', letterSpacing: 4, textTransform: 'uppercase',
                    background: 'var(--color-paper)', border: '1px solid var(--color-rule)',
                    borderRadius: 'var(--radius-sm)', outline: 'none', color: 'var(--color-ink)',
                  }}
                  value={code}
                  maxLength={6}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="AEG901"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddWithCode()}
                />
              </div>
              {addError && (
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-danger)', marginBottom: 12 }}>
                  {addError}
                </div>
              )}
              <button
                onClick={handleAddWithCode}
                disabled={adding || code.length !== 6}
                style={{
                  width: '100%', padding: '12px 0', fontSize: 'var(--text-sm)', fontWeight: 700,
                  fontFamily: 'var(--font-mono)', color: 'var(--color-paper)', background: 'var(--color-accent)',
                  border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                }}
              >{adding ? 'Pairing Passenger...' : 'Confirm Pairing'}</button>
            </div>
          )}
        </div>

        {/* Passenger cards list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>
              Loading monitored passengers...
            </div>
          ) : watchers.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', background: 'var(--color-paper-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-rule)' }}>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-ink-muted)', marginBottom: 6 }}>
                No passengers added yet
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-faint)' }}>
                Pair a passenger using their 6-digit Aegis app code.
              </div>
            </div>
          ) : (
            watchers.map((w) => {
              const profile = getProfile(w.passenger_id);
              const { pIncidents, pTrips } = getTriggers(w.passenger_id);
              const name = profile.name || w.label || w.passenger_id;

              return (
                <div
                  key={w.id}
                  style={{
                    background: 'var(--color-paper-raised)', border: '1px solid var(--color-rule)',
                    borderRadius: 'var(--radius-md)', padding: 20, boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {/* Passenger Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-ink)' }}>{name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-accent)', marginTop: 2, fontWeight: 700 }}>
                        ID: {w.passenger_id} {profile.pairing_code ? `· Code: ${profile.pairing_code}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setEditingProfile(profile)}
                        style={{
                          fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
                          color: 'var(--color-ink)', background: 'var(--color-paper)',
                          border: '1px solid var(--color-rule)',
                          padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                        }}
                      >✎ Edit Card</button>
                      <button
                        onClick={() => router.push(`/dashboard?passenger=${w.passenger_id}`)}
                        style={{
                          fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
                          color: 'var(--color-paper-raised)', background: 'var(--color-accent)', border: 'none',
                          padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                        }}
                      >📍 View on Map</button>
                      <button
                        onClick={() => handleRemove(w.id)}
                        style={{
                          fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
                          color: 'var(--color-danger)', background: 'var(--color-danger-dim)', border: '1px solid var(--color-danger)',
                          padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                        }}
                      >Remove</button>
                    </div>
                  </div>

                  {/* Mobile App Profile Details Grid */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12,
                    backgroundColor: 'var(--color-paper)', padding: 14, borderRadius: 10,
                    border: '1px solid var(--color-rule)', marginBottom: 16,
                  }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-ink-faint)', letterSpacing: 1 }}>EMERGENCY CONTACT</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)', marginTop: 2 }}>
                        {profile.emergency_contact_phone || 'Not set'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>{profile.emergency_contact_name || 'Primary Contact'}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-ink-faint)', letterSpacing: 1 }}>HEALTH & ACCESSIBILITY</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {(profile.health_conditions || []).map((h) => (
                           <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-accent)', backgroundColor: 'var(--color-accent-dim)', padding: '2px 8px', borderRadius: 6 }}>
                            🏥 {h}
                          </span>
                        ))}
                        {(profile.disabilities || []).map((d) => (
                           <span key={d} style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-warn)', backgroundColor: 'var(--color-warn-dim)', padding: '2px 8px', borderRadius: 6 }}>
                            ♿ {d}
                          </span>
                        ))}
                        {(!profile.health_conditions || profile.health_conditions.length === 0) &&
                          (!profile.disabilities || profile.disabilities.length === 0) && (
                            <span style={{ fontSize: 11, color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
                              No health / accessibility needs reported
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Trigger History Breakdown */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-ink)', marginBottom: 8, letterSpacing: 0.5 }}>
                      ⚡ RECENT TRIGGER & ALERT HISTORY ({pIncidents.length + pTrips.length})
                    </div>

                    {pIncidents.length === 0 && pTrips.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--color-ink-faint)', fontStyle: 'italic', padding: '6px 0' }}>
                        No emergency triggers recorded yet. Safe in transit.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {pIncidents.map((inc) => (
                          <div
                            key={inc.id}
                            style={{
                              padding: 10, borderRadius: 8,
                               backgroundColor: inc.status === 'active' ? 'var(--color-danger-dim)' : 'var(--color-paper)',
                               border: inc.status === 'active' ? '1px solid var(--color-danger)' : '1px solid var(--color-rule)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}
                          >
                            <div>
                               <span style={{ fontSize: 11, fontWeight: 800, color: inc.status === 'active' ? 'var(--color-danger)' : 'var(--color-safe)' }}>
                                {inc.trigger_type === 'audio' ? '🎤 SOUND DECIBEL TRIGGER (>85dB)' : '🚨 ONE-TAP MANUAL SOS'}
                              </span>
                              <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 2 }}>
                                GPS: {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)} · {new Date(inc.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                            <a
                              href={`https://www.google.com/maps?q=${inc.latitude},${inc.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                               style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent)', textDecoration: 'underline' }}
                            >Open Map ➔</a>
                          </div>
                        ))}

                        {pTrips.map((trip) => (
                          <div
                            key={trip.id}
                            style={{
                              padding: 10, borderRadius: 8, backgroundColor: 'var(--color-paper)',
                              border: '1px solid var(--color-rule)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}
                          >
                            <div>
                               <span style={{ fontSize: 11, fontWeight: 800, color: trip.status === 'alert' ? 'var(--color-danger)' : 'var(--color-safe)' }}>
                                🚌 {trip.status === 'alert' ? '⏱️ MISSED CHECKOUT ALERT' : 'SAFE TRIP CHECK-IN'}
                              </span>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ink)', marginTop: 2 }}>
                                {trip.bus_route} ({trip.vehicle_id || 'Bus'})
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--color-ink-faint)' }}>
                                Departure: {new Date(trip.departure_time).toLocaleTimeString()} · ETA: {new Date(trip.expected_arrival).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <AddPassengerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => load()}
      />

      {editingProfile && (
        <EditPassengerModal
          isOpen={!!editingProfile}
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSuccess={(updated) => {
            setProfilesMap((prev) => ({ ...prev, [updated.passenger_id]: updated }));
            load();
          }}
        />
      )}
    </div>
  );
}
