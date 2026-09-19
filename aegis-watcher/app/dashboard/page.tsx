'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Incident, Trip, PassengerProfile } from '@/types';
import { supabase, MOCK_MODE } from '@/lib/supabase';
import { MOCK_INCIDENTS, MOCK_TRIPS, MOCK_PASSENGER_PROFILES, MOCK_USERS } from '@/lib/mock-data';
import { fetchPassengerProfile } from '@/lib/profiles';
import IncidentMap from '@/components/IncidentMap';
import { playAlertSound } from '@/lib/alertSound';
import { useIsMobile } from '@/lib/useIsMobile';
import AppTopBar from '@/components/AppTopBar';

function DashboardPageInner() {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [clientTime, setClientTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setClientTime(new Date().toLocaleTimeString());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, PassengerProfile>>({});
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: 'incident' | 'trip' } | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'sos' | 'active_trips' | 'completed'>('all');

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: {
      id: string;
      type: 'incident' | 'trip';
      passenger_id: string;
      created_at?: string;
      latitude?: number;
      longitude?: number;
      trigger_type?: string;
      bus_route?: string;
    };
  } | null>(null);

  // High Priority Emergency Alert Banner
  const [alertBanner, setAlertBanner] = useState<{
    id: string;
    passenger_id: string;
    passenger_name: string;
    latitude: number;
    longitude: number;
    trigger_type: string;
  } | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    async function loadData() {
      let savedIncidents: Incident[] = [];
      let savedTrips: Trip[] = [];

      if (typeof window !== 'undefined') {
        try {
          const incStr = localStorage.getItem('aegis_incidents');
          const tripStr = localStorage.getItem('aegis_trips');
          if (incStr) savedIncidents = JSON.parse(incStr);
          if (tripStr) savedTrips = JSON.parse(tripStr);
        } catch (e) {
          console.error(e);
        }
      }

      if (MOCK_MODE || !supabase) {
        setIncidents(savedIncidents.length > 0 ? savedIncidents : MOCK_INCIDENTS);
        setTrips(savedTrips.length > 0 ? savedTrips : MOCK_TRIPS);
        setLoading(false);
        return;
      }

      try {
        const [incRes, tripRes] = await Promise.all([
          supabase.from('incidents').select('*').order('created_at', { ascending: false }).limit(50),
          supabase.from('trips').select('*').order('created_at', { ascending: false }).limit(50),
        ]);

        const dbIncidents = (incRes.data as Incident[]) || [];
        const dbTrips = (tripRes.data as Trip[]) || [];

        const mergedIncidents = [...dbIncidents, ...savedIncidents.filter((s) => !dbIncidents.some((d) => d.id === s.id))];
        const mergedTrips = [...dbTrips, ...savedTrips.filter((s) => !dbTrips.some((d) => d.id === s.id))];

        setIncidents(mergedIncidents.length > 0 ? mergedIncidents : MOCK_INCIDENTS);
        setTrips(mergedTrips.length > 0 ? mergedTrips : MOCK_TRIPS);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const saveIncidents = (updater: (prev: Incident[]) => Incident[]) => {
    setIncidents((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        localStorage.setItem('aegis_incidents', JSON.stringify(next));
      }
      return next;
    });
  };

  const saveTrips = (updater: (prev: Trip[]) => Trip[]) => {
    setTrips((prev) => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        localStorage.setItem('aegis_trips', JSON.stringify(next));
      }
      return next;
    });
  };

  const getPassengerNameLabel = (passengerId: string): string => {
    if (!passengerId) return 'Passenger';
    if (profilesMap[passengerId]?.name) return profilesMap[passengerId].name;
    if (MOCK_PASSENGER_PROFILES[passengerId]?.name) return MOCK_PASSENGER_PROFILES[passengerId].name;
    if (MOCK_USERS[passengerId]) return MOCK_USERS[passengerId];

    if (passengerId.startsWith('passenger-') || passengerId.startsWith('p-')) {
      const code = passengerId.replace(/^passenger-|^p-/, '').toUpperCase();
      return `Passenger (${code})`;
    }
    return `Passenger (${passengerId})`;
  };

  useEffect(() => {
    const ids = Array.from(new Set([...incidents.map((i) => i.passenger_id), ...trips.map((t) => t.passenger_id)]));
    if (ids.length > 0) {
      Promise.all(ids.map((id) => fetchPassengerProfile(id))).then((results) => {
        const map: Record<string, PassengerProfile> = {};
        results.forEach((p) => {
          if (p) map[p.passenger_id] = p;
        });
        setProfilesMap((prev) => ({ ...prev, ...map }));
      });
    }
  }, [incidents, trips]);

  const triggerSOSAlert = (inc: Incident) => {
    playAlertSound();
    const name = getPassengerNameLabel(inc.passenger_id);
    setAlertBanner({
      id: inc.id,
      passenger_id: inc.passenger_id,
      passenger_name: name,
      latitude: inc.latitude,
      longitude: inc.longitude,
      trigger_type: inc.trigger_type || 'manual',
    });
  };

  const clearAllAlerts = () => {
    saveIncidents((prev) => prev.map((i) => ({ ...i, status: 'resolved' as const })));
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aegis_incidents');
    }
    setContextMenu(null);
    setAlertBanner(null);
  };

  const dismissAlert = (id: string, type: 'incident' | 'trip') => {
    if (type === 'incident') {
      saveIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'resolved' } : i)));
    } else {
      saveTrips((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'completed' } : t)));
    }
    setContextMenu(null);
    setAlertBanner(null);
  };

  useEffect(() => {
    if (MOCK_MODE || !supabase) return;
    const client = supabase;

    const channel = client
      .channel('fleet-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incidents' }, (payload: { new: Incident }) => {
        saveIncidents((prev) => {
          const idx = prev.findIndex(
            (i) => i.passenger_id === payload.new.passenger_id && i.status === 'active'
          );
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...payload.new, created_at: payload.new.created_at || new Date().toISOString() };
            return next;
          }
          return [payload.new, ...prev];
        });
        triggerSOSAlert(payload.new);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'incidents' }, (payload: { new: Incident }) => {
        saveIncidents((prev) =>
          prev.map((i) =>
            i.id === payload.new.id || (i.passenger_id === payload.new.passenger_id && i.status === 'active')
              ? { ...i, ...payload.new }
              : i
          )
        );
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trips' }, (payload: { new: Trip }) => {
        saveTrips((prev) => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips' }, (payload: { new: Trip }) => {
        saveTrips((prev) => prev.map((t) => (t.id === payload.new.id ? payload.new : t)));
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const simulateSOSAlert = async () => {
    const spread = () => (Math.random() - 0.5) * 0.05;
    const now = new Date().toISOString();

    let fakeIncident: Incident = {
      id: `sim-sos-${Date.now()}`,
      passenger_id: 'demo-passenger-001',
      latitude: 7.8023 + spread(),
      longitude: 6.7331 + spread(),
      trigger_type: 'manual',
      audio_url: null,
      status: 'active',
      created_at: now,
    };

    saveIncidents((prev) => {
      const idx = prev.findIndex((i) => i.passenger_id === 'demo-passenger-001' && i.status === 'active');
      if (idx !== -1) {
        const next = [...prev];
        fakeIncident = {
          ...next[idx],
          latitude: 7.8023 + spread(),
          longitude: 6.7331 + spread(),
          created_at: now,
        };
        next[idx] = fakeIncident;
        return next;
      }
      return [fakeIncident, ...prev];
    });

    triggerSOSAlert(fakeIncident);

    if (supabase) {
      await supabase.from('incidents').insert(fakeIncident);
    }
  };

  const simulateNewTrip = async () => {
    const routes = [
      { name: 'Lagos ➔ Abuja (Expressway)', bus: 'GIGM - Bus #3090', lat: 7.15, lng: 5.21 },
      { name: 'Lagos ➔ Benin City', bus: 'Peace Mass - Bus #112', lat: 6.62, lng: 4.31 },
      { name: 'Abuja ➔ Port Harcourt', bus: 'ABC Transport - Bus #771', lat: 5.48, lng: 7.02 },
    ];
    const picked = routes[Math.floor(Math.random() * routes.length)];
    const fakeTrip: Trip = {
      id: `sim-trip-${Date.now()}`,
      passenger_id: `user-${Math.floor(Math.random() * 900 + 100)}`,
      passenger_name: 'Chidi Nnamdi',
      bus_route: picked.name,
      vehicle_id: picked.bus,
      departure_location: picked.name.split('➔')[0].trim(),
      arrival_location: picked.name.split('➔')[1].trim(),
      departure_time: new Date().toISOString(),
      expected_arrival: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      status: 'active',
      latitude: picked.lat,
      longitude: picked.lng,
      emergency_contact: '+234 802 999 0000',
      created_at: new Date().toISOString(),
    };
    saveTrips((prev) => [fakeTrip, ...prev]);

    if (supabase) {
      await supabase.from('trips').insert(fakeTrip);
    }
  };

  const simulateTimeoutAlert = async () => {
    const fakeAlertTrip: Trip = {
      id: `sim-alert-${Date.now()}`,
      passenger_id: 'demo-passenger-001',
      passenger_name: 'Demo Passenger',
      bus_route: 'Lagos ➔ Abuja (Expressway)',
      vehicle_id: 'GIGM - Bus #1042',
      departure_location: 'Lagos (Jibowu)',
      arrival_location: 'Abuja (Utako)',
      departure_time: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      expected_arrival: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      status: 'alert',
      latitude: 8.5214,
      longitude: 7.1023,
      emergency_contact: '+234 803 123 4567',
      created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    };
    saveTrips((prev) => [fakeAlertTrip, ...prev]);
    playAlertSound();

    if (supabase) {
      await supabase.from('trips').insert(fakeAlertTrip);
    }
  };

  const resetDemoData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aegis_incidents');
      localStorage.removeItem('aegis_trips');
    }
    setIncidents(MOCK_INCIDENTS);
    setTrips(MOCK_TRIPS);
  };

  const activeSOS = incidents
    .filter((i) => i.status === 'active')
    .reduce<Incident[]>((acc, current) => {
      const idx = acc.findIndex((item) => item.passenger_id === current.passenger_id);
      if (idx === -1) {
        acc.push(current);
      } else {
        if (new Date(current.created_at) >= new Date(acc[idx].created_at)) {
          acc[idx] = current;
        }
      }
      return acc;
    }, []);
  const activeTripsList = trips.filter((t) => t.status === 'active');
  const alertTripsList = trips.filter((t) => t.status === 'alert');
  const completedTripsList = trips.filter((t) => t.status === 'completed');

  const displayTrips = trips.filter((t) => {
    if (activeFilter === 'sos') return t.status === 'alert';
    if (activeFilter === 'active_trips') return t.status === 'active';
    if (activeFilter === 'completed') return t.status === 'completed';
    return true;
  });

  const selectedTrip = selectedItem?.type === 'trip' ? trips.find((t) => t.id === selectedItem.id) : null;
  const selectedIncident = selectedItem?.type === 'incident' ? incidents.find((i) => i.id === selectedItem.id) : null;

  const hasEmergency = activeSOS.length > 0 || alertTripsList.length > 0;

  const statusBadge = (label: string, color: 'danger' | 'safe' | 'accent' | 'muted', opts?: { pulse?: boolean }): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-mono)',
    color: `var(--color-${color === 'danger' ? 'danger' : color === 'safe' ? 'safe' : color === 'accent' ? 'accent' : 'ink-muted'})`,
    background: `var(--color-${color === 'danger' ? 'danger' : color === 'safe' ? 'safe' : color === 'accent' ? 'accent' : 'ink'}-dim)`,
    padding: '4px 10px', borderRadius: 'var(--radius-sm)',
    border: `1px solid var(--color-${color === 'danger' ? 'danger' : color === 'safe' ? 'safe' : color === 'accent' ? 'accent' : 'rule'})`,
  });

  const simBtn = (bg: string): React.CSSProperties => ({
    background: bg, color: 'var(--color-ink)', border: '1px solid var(--color-rule)',
    padding: '5px 10px', borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-mono)',
    cursor: 'pointer', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--color-paper)', fontFamily: 'var(--font-body)' }}>
      {/* MAP */}
      <IncidentMap
        incidents={incidents}
        trips={trips}
        onMarkerClick={(id, type) => setSelectedItem({ id, type })}
      />

      {/* TOP COMMAND BAR */}
      <AppTopBar
        variant="floating"
        extraDesktopControls={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={statusBadge(`${activeSOS.length + alertTripsList.length} alerts`, hasEmergency ? 'danger' : 'safe', { pulse: hasEmergency })}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: hasEmergency ? 'var(--color-danger)' : 'var(--color-safe)',
                animation: hasEmergency ? 'pulse 2s var(--ease-in-out) infinite' : 'none',
              }} />
              {hasEmergency ? 'ALERT' : 'CLEAR'}
            </span>

            <span style={statusBadge(`${activeTripsList.length} active`, 'accent')}>
              {activeTripsList.length} trips
            </span>

            <div style={{ width: 1, height: 14, background: 'var(--color-rule)', margin: '0 2px' }} />

            <button onClick={simulateSOSAlert} style={simBtn('var(--color-danger-dim)')}>+ SOS</button>
            <button onClick={simulateNewTrip} style={simBtn('var(--color-accent-dim)')}>+ Trip</button>
            <button onClick={simulateTimeoutAlert} style={simBtn('var(--color-warn-dim)')}>+ Timeout</button>
            <button onClick={resetDemoData} style={simBtn('var(--color-paper-overlay)')} title="Reset to mock data">Reset</button>
          </div>
        }
      />

      {/* LEFT SIDEBAR: FLEET TRIPS & INCIDENTS FEED */}
      <div style={{
        position: 'absolute', top: 60, left: 12, bottom: 12, width: 340, zIndex: 10,
        background: 'var(--color-paper-raised)', backdropFilter: 'blur(16px)',
        border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Sidebar header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-rule)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-accent)', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>FLEET OPS</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-ink)', marginTop: 2 }}>Command Center</div>
            </div>
            <span style={{
              fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-mono)',
              color: 'var(--color-safe)', background: 'var(--color-safe-dim)',
              padding: '3px 8px', borderRadius: 'var(--radius-sm)',
            }}>
              LIVE
            </span>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 3, background: 'var(--color-paper)', padding: 3, borderRadius: 'var(--radius-sm)' }}>
            {[
              { id: 'all', label: `All (${trips.length})` },
              { id: 'sos', label: `Alerts (${alertTripsList.length + activeSOS.length})` },
              { id: 'active_trips', label: `Active (${activeTripsList.length})` },
              { id: 'completed', label: `Done (${completedTripsList.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                style={{
                  flex: 1, padding: '5px 0', border: 'none', borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-mono)',
                  cursor: 'pointer', transition: 'all 120ms ease',
                  background: activeFilter === tab.id ? 'var(--color-paper-raised)' : 'transparent',
                  color: activeFilter === tab.id ? 'var(--color-accent)' : 'var(--color-ink-faint)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* FEED LIST */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
          {activeSOS.map((inc) => {
            const formattedTime = inc.created_at
              ? new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : 'Just now';
            return (
              <div
                key={inc.id}
                onClick={() => setSelectedItem({ id: inc.id, type: 'incident' })}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    item: {
                      id: inc.id,
                      type: 'incident',
                      passenger_id: inc.passenger_id,
                      created_at: inc.created_at,
                      latitude: inc.latitude,
                      longitude: inc.longitude,
                      trigger_type: inc.trigger_type,
                    },
                  });
                }}
                title="Right click for metadata & actions"
                style={{
                  background: 'var(--color-danger-dim)', border: '1px solid var(--color-danger)',
                  borderRadius: 'var(--radius-md)', padding: 10, marginBottom: 8, cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>SOS DISTRESS</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)' }}>{formattedTime}</span>
                </div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-ink)' }}>
                  {getPassengerNameLabel(inc.passenger_id)}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)', marginTop: 3 }}>
                  {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
                </div>
              </div>
            );
          })}

          {displayTrips.map((trip) => {
            const isAlert = trip.status === 'alert';
            const isActive = trip.status === 'active';
            const formattedTime = trip.created_at
              ? new Date(trip.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : '';

            return (
              <div
                key={trip.id}
                onClick={() => setSelectedItem({ id: trip.id, type: 'trip' })}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    item: {
                      id: trip.id,
                      type: 'trip',
                      passenger_id: trip.passenger_id,
                      created_at: trip.created_at,
                      latitude: trip.latitude,
                      longitude: trip.longitude,
                      bus_route: trip.bus_route,
                    },
                  });
                }}
                title="Right click for metadata & actions"
                style={{
                  background: selectedItem?.id === trip.id ? 'var(--color-paper-hover)' : 'transparent',
                  border: isAlert ? '1px solid var(--color-danger)' : '1px solid var(--color-rule)',
                  borderRadius: 'var(--radius-md)', padding: 10, marginBottom: 6, cursor: 'pointer',
                  transition: 'background 120ms ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{
                    fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)',
                    color: isAlert ? 'var(--color-danger)' : isActive ? 'var(--color-safe)' : 'var(--color-ink-faint)',
                  }}>
                    {isAlert ? 'MISSED CHECKOUT' : isActive ? 'IN TRANSIT' : 'ARRIVED'}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>
                    {formattedTime || trip.vehicle_id || '—'}
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-ink)' }}>{trip.passenger_name}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted)', marginTop: 2 }}>{trip.bus_route}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAIL DRAWER */}
      {(selectedTrip || selectedIncident) && (() => {
        const passengerId = selectedTrip ? selectedTrip.passenger_id : selectedIncident?.passenger_id;
        const profile: PassengerProfile = (passengerId && MOCK_PASSENGER_PROFILES[passengerId]) || {
          id: passengerId || 'p-default',
          passenger_id: passengerId || 'p-default',
          name: selectedTrip?.passenger_name || selectedIncident?.passenger_id || 'Interstate Passenger',
          emergency_contact_name: 'Emergency Dispatcher Contact',
          emergency_contact_phone: selectedTrip?.emergency_contact || '+234 803 123 4567',
          health_conditions: ['Asthma', 'Hypertension'],
          disabilities: ['Hearing Impaired'],
          pairing_code: 'AEG901',
          created_at: new Date().toISOString(),
        };

        return (
          <div style={{
            position: 'absolute', top: 60, right: 12, width: 340, zIndex: 10,
            background: 'var(--color-paper-raised)', backdropFilter: 'blur(16px)',
            border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)', padding: 16, maxHeight: 'calc(100vh - 80px)',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--color-rule)' }}>
              <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
                {selectedTrip ? 'MONITORED PASSENGER' : 'SOS EMERGENCY ALERT'}
              </span>
              <button
                onClick={() => setSelectedItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-ink-faint)', fontSize: 18, cursor: 'pointer', padding: 2 }}
              >×</button>
            </div>

            {/* Profile Info Header */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-ink)', marginBottom: 2 }}>
                {profile.name}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-faint)' }}>
                Pairing Code: <strong style={{ color: 'var(--color-accent)' }}>{profile.pairing_code || 'AEG901'}</strong>
              </div>
            </div>

            {/* Health & Accessibility Tags */}
            {((profile.health_conditions && profile.health_conditions.length > 0) || (profile.disabilities && profile.disabilities.length > 0)) && (
              <div style={{ marginBottom: 12, background: 'var(--color-paper)', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-rule)' }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)', marginBottom: 6 }}>
                  MOBILE PROFILE & MEDICAL NEEDS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {profile.health_conditions?.map((hc) => (
                    <span key={hc} style={{
                      fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-mono)',
                      background: 'var(--color-danger-dim)', color: 'var(--color-danger)',
                      padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-danger)',
                    }}>
                      🩺 {hc}
                    </span>
                  ))}
                  {profile.disabilities?.map((dis) => (
                    <span key={dis} style={{
                      fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-mono)',
                      background: 'var(--color-warn-dim)', color: 'var(--color-warn)',
                      padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-warn)',
                    }}>
                      ♿ {dis}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            <div style={{ background: 'var(--color-paper)', padding: 10, borderRadius: 'var(--radius-md)', marginBottom: 12, border: '1px solid var(--color-rule)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>EMERGENCY CONTACT</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-ink)', marginTop: 2 }}>{profile.emergency_contact_name || 'Family Contact'}</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-safe)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {profile.emergency_contact_phone || selectedTrip?.emergency_contact || '+234 803 123 4567'}
              </div>
            </div>

            {/* Trigger Details */}
            {selectedTrip && (
              <div style={{ marginBottom: 12, background: 'var(--color-paper)', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-rule)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginBottom: 4 }}>
                  TRIP & TRIGGER STATUS
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-accent)' }}>{selectedTrip.bus_route}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>Vehicle: {selectedTrip.vehicle_id || 'Fleet Unit'}</div>
                
                <div style={{
                  marginTop: 8, padding: 8, borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-mono)',
                  background: selectedTrip.status === 'alert' ? 'var(--color-danger-dim)' : 'var(--color-safe-dim)',
                  color: selectedTrip.status === 'alert' ? 'var(--color-danger)' : 'var(--color-safe)',
                  border: `1px solid ${selectedTrip.status === 'alert' ? 'var(--color-danger)' : 'var(--color-safe)'}`,
                }}>
                  {selectedTrip.status === 'alert'
                    ? '⚠️ MISSED CHECKOUT ALERT: Passenger failed to confirm safe arrival within the 15-minute expected arrival window.'
                    : selectedTrip.status === 'active'
                    ? '🟢 IN TRANSIT: Active continuous satellite & GSM location tracking.'
                    : '✅ ARRIVED: Safe trip completed.'}
                </div>
              </div>
            )}

            {selectedIncident && (
              <div style={{ marginBottom: 12, background: 'var(--color-danger-dim)', padding: 10, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginBottom: 4 }}>
                  DISTRESS TRIGGER CAUSE
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-danger)' }}>
                  {selectedIncident.trigger_type === 'audio'
                    ? '🔊 High Decibel Audio Warning (Scream/Crash Detected)'
                    : '🚨 Manual SOS Panic Button Triggered from Mobile App'}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)', marginTop: 4 }}>
                  Coordinates: {selectedIncident.latitude.toFixed(6)}, {selectedIncident.longitude.toFixed(6)}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              <a
                href="/dashboard/passengers"
                style={{
                  display: 'block', textAlign: 'center',
                  background: 'var(--color-paper)', color: 'var(--color-ink)',
                  border: '1px solid var(--color-rule)',
                  padding: '8px 0', borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)', fontWeight: 700, textDecoration: 'none',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                📋 View Full Passenger Mobile Profile
              </a>

              <a
                href={`https://www.google.com/maps?q=${selectedTrip ? selectedTrip.latitude : selectedIncident?.latitude},${selectedTrip ? selectedTrip.longitude : selectedIncident?.longitude}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block', textAlign: 'center',
                  background: selectedIncident ? 'var(--color-danger)' : 'var(--color-accent)',
                  color: 'var(--color-paper)',
                  padding: '8px 0', borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)', fontWeight: 700, textDecoration: 'none',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                📍 Open Location in Google Maps
              </a>
            </div>
          </div>
        );
      })()}

      {/* BOTTOM CLOCK */}
      {!isMobile && (
        <div style={{
          position: 'absolute', bottom: 12, right: 12, zIndex: 10,
          padding: '6px 10px', background: 'var(--color-paper-raised)',
          border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)',
        }}>
          {MOCK_MODE ? 'MOCK' : 'LIVE'} · {clientTime ?? '--:--:--'}
        </div>
      )}

      {/* RIGHT-CLICK CONTEXT MENU */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 280 : contextMenu.x),
            top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 300 : contextMenu.y),
            zIndex: 1000,
            background: 'var(--color-paper-raised)',
            border: '1px solid var(--color-rule)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '6px 0',
            minWidth: 260,
            fontFamily: 'var(--font-mono)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 800, color: 'var(--color-accent)', borderBottom: '1px solid var(--color-rule)', letterSpacing: '0.08em' }}>
            ACTIONS: {getPassengerNameLabel(contextMenu.item.passenger_id).toUpperCase()}
          </div>

          {/* METADATA INFO BOX */}
          <div style={{ padding: '8px 14px', background: 'var(--color-paper)', borderBottom: '1px solid var(--color-rule)', fontSize: 'var(--text-xs)' }}>
            <div style={{ color: 'var(--color-ink-muted)', marginBottom: 2 }}>
              ⏱️ <strong>Time:</strong> {contextMenu.item.created_at ? new Date(contextMenu.item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' }) : new Date().toLocaleTimeString()}
            </div>
            {contextMenu.item.latitude !== undefined && contextMenu.item.longitude !== undefined && (
              <div style={{ color: 'var(--color-ink-muted)', marginBottom: 2 }}>
                📍 <strong>GPS:</strong> {contextMenu.item.latitude.toFixed(4)}, {contextMenu.item.longitude.toFixed(4)}
              </div>
            )}
            <div style={{ color: 'var(--color-ink-muted)' }}>
              ⚡ <strong>Type:</strong> {contextMenu.item.type === 'incident' ? (contextMenu.item.trigger_type || 'SOS Panic Distress') : (contextMenu.item.bus_route || 'Interstate Trip')}
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedItem({ id: contextMenu.item.id, type: contextMenu.item.type });
              setContextMenu(null);
            }}
            style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px',
              background: 'none', border: 'none', color: 'var(--color-ink)',
              fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-paper-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            📍 Focus Location on Map
          </button>

          <button
            onClick={() => {
              router.push('/dashboard/passengers');
              setContextMenu(null);
            }}
            style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px',
              background: 'none', border: 'none', color: 'var(--color-ink)',
              fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-paper-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            📋 View Passenger Mobile Profile
          </button>

          <button
            onClick={() => {
              dismissAlert(contextMenu.item.id, contextMenu.item.type);
            }}
            style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px',
              background: 'none', border: 'none', color: 'var(--color-safe)',
              fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-paper-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            ✅ Resolve / Dismiss Alert
          </button>

          <div style={{ height: 1, background: 'var(--color-rule)', margin: '4px 0' }} />

          <button
            onClick={clearAllAlerts}
            style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px',
              background: 'none', border: 'none', color: 'var(--color-danger)',
              fontSize: 'var(--text-xs)', fontWeight: 800, cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-danger-dim)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            🧹 Clear All Alerts & Reset Feed
          </button>
        </div>
      )}

      {/* HIGH-PRIORITY EMERGENCY ALERT BANNER */}
      {alertBanner && (
        <div
          style={{
            position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
            zIndex: 999, width: '90%', maxWidth: 560,
            background: 'var(--color-danger)', border: '2px solid var(--color-danger)',
            borderRadius: 'var(--radius-lg)', boxShadow: '0 12px 40px oklch(58% 0.22 25 / 0.3)',
            padding: 16, color: 'var(--color-paper-raised)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28, animation: 'pulse 1s infinite' }}>🚨</span>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'oklch(90% 0.04 25)', letterSpacing: '0.1em' }}>
                  IMPORTANT DISTRESS SOS ALERT
                </div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginTop: 2 }}>
                  {alertBanner.passenger_name}
                </div>
              </div>
            </div>

            <button
              onClick={() => setAlertBanner(null)}
              style={{ background: 'none', border: 'none', color: 'oklch(90% 0.04 25)', fontSize: 22, cursor: 'pointer', padding: 4 }}
            >
              ×
            </button>
          </div>

          <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'oklch(93% 0.03 25)', marginTop: 8 }}>
            GPS: {alertBanner.latitude.toFixed(4)}, {alertBanner.longitude.toFixed(4)} · Trigger: {alertBanner.trigger_type === 'audio' ? 'Decibel Spike Warning' : 'Manual SOS Panic Button'}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button
              onClick={() => {
                setSelectedItem({ id: alertBanner.id, type: 'incident' });
                setAlertBanner(null);
              }}
              style={{
                flex: 1, padding: '9px 0', background: 'var(--color-danger)', color: 'var(--color-paper-raised)',
                border: 'none', borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer',
              }}
            >
              📍 Track on Map
            </button>
            <button
              onClick={() => {
                router.push('/dashboard/passengers');
                setAlertBanner(null);
              }}
              style={{
                flex: 1, padding: '9px 0', background: 'rgba(255,255,255,0.15)', color: 'var(--color-paper-raised)',
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer',
              }}
            >
              📋 Passenger Profile
            </button>
            <button
              onClick={clearAllAlerts}
              style={{
                padding: '9px 14px', background: 'transparent', color: 'var(--color-paper-raised)',
                border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', cursor: 'pointer',
              }}
            >
              🧹 Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-paper)', color: 'var(--color-ink-muted)', fontSize: 'var(--text-base)', fontFamily: 'var(--font-body)' }}>
        Loading...
      </div>
    }>
      <DashboardPageInner />
    </Suspense>
  );
}
