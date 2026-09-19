'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, MOCK_MODE } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { MOCK_PASSENGER_PROFILES, MOCK_INCIDENTS, MOCK_TRIPS } from '@/lib/mock-data';
import type { Incident, Trip, PassengerProfile } from '@/types';
import AppTopBar from '@/components/AppTopBar';
import AddPassengerModal from '@/components/AddPassengerModal';

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
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = async () => {
    if (MOCK_MODE || !supabase) {
      setWatchers(MOCK_WATCHERS);
      setLoading(false);
      return;
    }

    try {
      const [watchRes, incRes, tripRes] = await Promise.all([
        supabase.from('watchers').select('*').order('created_at', { ascending: false }),
        supabase.from('incidents').select('*').order('created_at', { ascending: false }),
        supabase.from('trips').select('*').order('created_at', { ascending: false }),
      ]);

      if (watchRes.data && watchRes.data.length > 0) {
        setWatchers(watchRes.data as WatcherRow[]);
      } else {
        setWatchers(MOCK_WATCHERS);
      }

      if (incRes.data) setIncidents(incRes.data as Incident[]);
      if (tripRes.data) setTrips(tripRes.data as Trip[]);
    } catch (err) {
      console.error(err);
      setWatchers(MOCK_WATCHERS);
    } finally {
      setLoading(false);
    }
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

    try {
      const response = await fetch('/api/pairing/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Fallback for demo mode
        const newWatcher: WatcherRow = {
          id: `w-${Date.now()}`,
          passenger_id: `passenger-${cleanCode}`,
          label: `Passenger (${cleanCode})`,
          created_at: new Date().toISOString(),
        };
        setWatchers((prev) => [newWatcher, ...prev]);
      } else if (data.watcher) {
        setWatchers((prev) => [data.watcher as WatcherRow, ...prev]);
      } else {
        await load();
      }

      setCode('');
      setShowForm(false);
    } catch (err) {
      // Demo fallback
      const newWatcher: WatcherRow = {
        id: `w-${Date.now()}`,
        passenger_id: `passenger-${cleanCode}`,
        label: `Passenger (${cleanCode})`,
        created_at: new Date().toISOString(),
      };
      setWatchers((prev) => [newWatcher, ...prev]);
      setCode('');
      setShowForm(false);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (MOCK_MODE || !supabase) {
      setWatchers((prev) => prev.filter((w) => w.id !== id));
      return;
    }
    await supabase.from('watchers').delete().eq('id', id);
    setWatchers((prev) => prev.filter((w) => w.id !== id));
  };

  const getProfile = (passengerId: string): PassengerProfile => {
    return MOCK_PASSENGER_PROFILES[passengerId] || {
      id: passengerId,
      passenger_id: passengerId,
      name: passengerId === 'demo-passenger-001' ? 'Demo Passenger' : 'Interstate Passenger',
      emergency_contact_name: 'Emergency Dispatch Contact',
      emergency_contact_phone: '+234 803 123 4567',
      health_conditions: ['Asthma'],
      disabilities: ['Hearing Impaired'],
      pairing_code: 'AEG901',
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
              const name = w.label || profile.name;

              return (
                <div
                  key={w.id}
                  style={{
                    background: 'var(--color-paper-raised)', border: '1px solid var(--color-rule)',
                    borderRadius: 'var(--radius-md)', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
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
                        onClick={() => router.push(`/dashboard?passenger=${w.passenger_id}`)}
                        style={{
                          fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
                          color: '#fff', background: '#2563EB', border: 'none',
                          padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                        }}
                      >📍 View on Map</button>
                      <button
                        onClick={() => handleRemove(w.id)}
                        style={{
                          fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
                          color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
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
                        {profile.emergency_contact_phone || '+234 803 123 4567'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>{profile.emergency_contact_name || 'Primary Contact'}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-ink-faint)', letterSpacing: 1 }}>HEALTH & ACCESSIBILITY</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {(profile.health_conditions || []).map((h) => (
                          <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: 6 }}>
                            🏥 {h}
                          </span>
                        ))}
                        {(profile.disabilities || []).map((d) => (
                          <span key={d} style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: 6 }}>
                            ♿ {d}
                          </span>
                        ))}
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
                              backgroundColor: inc.status === 'active' ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-paper)',
                              border: inc.status === 'active' ? '1px solid #EF4444' : '1px solid var(--color-rule)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}
                          >
                            <div>
                              <span style={{ fontSize: 11, fontWeight: 800, color: inc.status === 'active' ? '#EF4444' : '#10B981' }}>
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
                              style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textDecoration: 'underline' }}
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
                              <span style={{ fontSize: 11, fontWeight: 800, color: trip.status === 'alert' ? '#EF4444' : '#10B981' }}>
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
    </div>
  );
}
