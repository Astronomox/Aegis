'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Incident, Trip, Company } from '@/types';
import { supabase, MOCK_MODE } from '@/lib/supabase';
import { MOCK_INCIDENTS, MOCK_TRIPS, MOCK_COMPANIES } from '@/lib/mock-data';
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
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: 'incident' | 'trip' } | null>(null);
  const [feedOpen, setFeedOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'sos' | 'active_trips' | 'completed'>('all');

  useEffect(() => {
    async function loadData() {
      if (MOCK_MODE || !supabase) {
        setIncidents(MOCK_INCIDENTS);
        setTrips(MOCK_TRIPS);
        setLoading(false);
        return;
      }

      try {
        const [incRes, tripRes] = await Promise.all([
          supabase.from('incidents').select('*').order('created_at', { ascending: false }).limit(50),
          supabase.from('trips').select('*').order('created_at', { ascending: false }).limit(50),
        ]);

        if (incRes.data) setIncidents(incRes.data as Incident[]);
        if (tripRes.data) setTrips(tripRes.data as Trip[]);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Realtime subscription for incidents & trips
  useEffect(() => {
    if (MOCK_MODE || !supabase) return;
    const client = supabase;

    const channel = client
      .channel('fleet-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incidents' }, (payload: { new: Incident }) => {
        setIncidents((prev) => [payload.new, ...prev]);
        playAlertSound();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trips' }, (payload: { new: Trip }) => {
        setTrips((prev) => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips' }, (payload: { new: Trip }) => {
        setTrips((prev) => prev.map((t) => (t.id === payload.new.id ? payload.new : t)));
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  // Simulation controls for demo purposes
  const simulateSOSAlert = () => {
    const spread = () => (Math.random() - 0.5) * 0.15;
    const fakeIncident: Incident = {
      id: `sim-sos-${Date.now()}`,
      passenger_id: 'demo-passenger-001',
      latitude: 7.8023 + spread(), // Lokoja-Abuja highway zone
      longitude: 6.7331 + spread(),
      trigger_type: 'manual',
      audio_url: null,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    setIncidents((prev) => [fakeIncident, ...prev]);
    playAlertSound();
  };

  const simulateNewTrip = () => {
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
    setTrips((prev) => [fakeTrip, ...prev]);
  };

  const simulateTimeoutAlert = () => {
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
    setTrips((prev) => [fakeAlertTrip, ...prev]);
    playAlertSound();
  };

  const activeSOS = incidents.filter((i) => i.status === 'active');
  const activeTripsList = trips.filter((t) => t.status === 'active');
  const alertTripsList = trips.filter((t) => t.status === 'alert');
  const completedTripsList = trips.filter((t) => t.status === 'completed');

  // Filtered items to show in list
  const displayTrips = trips.filter((t) => {
    if (activeFilter === 'sos') return t.status === 'alert';
    if (activeFilter === 'active_trips') return t.status === 'active';
    if (activeFilter === 'completed') return t.status === 'completed';
    return true;
  });

  const selectedTrip = selectedItem?.type === 'trip' ? trips.find((t) => t.id === selectedItem.id) : null;
  const selectedIncident = selectedItem?.type === 'incident' ? incidents.find((i) => i.id === selectedItem.id) : null;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#0F172A', fontFamily: 'Inter, sans-serif' }}>
      {/* LEAFLET INTERSTATE MAP */}
      <IncidentMap
        incidents={incidents}
        trips={trips}
        onMarkerClick={(id, type) => setSelectedItem({ id, type })}
      />

      {/* TOP COMMAND BAR */}
      <AppTopBar
        variant="floating"
        extraDesktopControls={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Live SOS Badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 700,
              color: activeSOS.length > 0 || alertTripsList.length > 0 ? '#EF4444' : '#10B981',
              backgroundColor: activeSOS.length > 0 || alertTripsList.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: activeSOS.length > 0 || alertTripsList.length > 0 ? '#EF4444' : '#10B981',
                animation: activeSOS.length > 0 || alertTripsList.length > 0 ? 'pulse 1.5s infinite' : 'none',
              }} />
              {activeSOS.length + alertTripsList.length} Emergency Alerts
            </span>

            {/* Active Trips Badge */}
            <span style={{
              fontSize: 12, fontWeight: 700, color: '#38BDF8',
              backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '6px 14px', borderRadius: 20,
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}>
              🚌 {activeTripsList.length} Active Bus Trips
            </span>

            {/* Sim Buttons */}
            <button
              onClick={simulateSOSAlert}
              style={{
                backgroundColor: '#DC2626', color: '#fff', border: 'none',
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
              }}
            >🚨 Sim SOS</button>

            <button
              onClick={simulateNewTrip}
              style={{
                backgroundColor: '#2563EB', color: '#fff', border: 'none',
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
              }}
            >+ Sim Bus Trip</button>

            <button
              onClick={simulateTimeoutAlert}
              style={{
                backgroundColor: '#EA580C', color: '#fff', border: 'none',
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
              }}
            >⏱️ Sim Missed Checkout</button>
          </div>
        }

      />

      {/* LEFT SIDEBAR: FLEET TRIPS & INCIDENTS FEED */}
      <div style={{
        position: 'absolute', top: 76, left: 16, bottom: 16, width: 360, zIndex: 10,
        backgroundColor: 'rgba(15, 23, 42, 0.94)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#38BDF8', letterSpacing: 1.2 }}>INTERSTATE NETWORK</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC' }}>Fleet Command Center</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#4ADE80', backgroundColor: 'rgba(74, 222, 128, 0.15)', padding: '3px 10px', borderRadius: 12 }}>
              Live 2G/GSM
            </span>
          </div>

          {/* FILTER TABS */}
          <div style={{ display: 'flex', gap: 6, backgroundColor: '#0F172A', padding: 4, borderRadius: 10 }}>
            {[
              { id: 'all', label: `All (${trips.length})` },
              { id: 'sos', label: `Alerts (${alertTripsList.length + activeSOS.length})` },
              { id: 'active_trips', label: `Active (${activeTripsList.length})` },
              { id: 'completed', label: `Arrivals (${completedTripsList.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                style={{
                  flex: 1, padding: '6px 0', border: 'none', borderRadius: 7,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  backgroundColor: activeFilter === tab.id ? '#1E293B' : 'transparent',
                  color: activeFilter === tab.id ? '#38BDF8' : '#94A3B8',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* FEED LIST */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {/* Active SOS Pings */}
          {activeSOS.map((inc) => (
            <div
              key={inc.id}
              onClick={() => setSelectedItem({ id: inc.id, type: 'incident' })}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444',
                borderRadius: 12, padding: 12, marginBottom: 10, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#EF4444' }}>🚨 SOS DISTRESS SIGNAL</span>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>Just now</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>Passenger ID: {inc.passenger_id}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#CBD5E1', marginTop: 4 }}>
                GPS: {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: '#38BDF8', textDecoration: 'underline' }}>
                View Incident Detail & Map Location ➔
              </div>
            </div>
          ))}

          {/* Trips */}
          {displayTrips.map((trip) => {
            const isAlert = trip.status === 'alert';
            const isActive = trip.status === 'active';
            const statusColor = isAlert ? '#EF4444' : isActive ? '#10B981' : '#64748B';

            return (
              <div
                key={trip.id}
                onClick={() => setSelectedItem({ id: trip.id, type: 'trip' })}
                style={{
                  backgroundColor: selectedItem?.id === trip.id ? '#1E293B' : 'rgba(30, 41, 59, 0.6)',
                  border: isAlert ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12, padding: 12, marginBottom: 8, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: statusColor }}>
                    {isAlert ? '⚠️ MISSED CHECKOUT' : isActive ? '🟢 IN TRANSIT' : '✓ ARRIVED SAFELY'}
                  </span>
                  <span style={{ fontSize: 10, color: '#64748B' }}>{trip.vehicle_id || 'Bus'}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{trip.passenger_name}</div>
                <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 2 }}>{trip.bus_route}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>From: {trip.departure_location}</span>
                  <span>To: {trip.arrival_location}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAIL MODAL / DRAWER FOR SELECTED ITEM */}
      {(selectedTrip || selectedIncident) && (
        <div style={{
          position: 'absolute', top: 76, right: 16, width: 340, zIndex: 10,
          backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)', padding: 18, color: '#F8FAFC',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#38BDF8' }}>
              {selectedTrip ? 'Bus Passenger Details' : 'SOS Emergency Alert'}
            </span>
            <button
              onClick={() => setSelectedItem(null)}
              style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', fontSize: 18, cursor: 'pointer' }}
            >×</button>
          </div>

          {selectedTrip && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{selectedTrip.passenger_name}</div>
              <div style={{ fontSize: 13, color: '#38BDF8', fontWeight: 700, marginBottom: 12 }}>{selectedTrip.bus_route}</div>

              <div style={{ backgroundColor: '#0F172A', padding: 12, borderRadius: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>VEHICLE / OPERATOR</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', marginTop: 2 }}>{selectedTrip.vehicle_id || 'God Is Good Motors'}</div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginTop: 8 }}>EMERGENCY CONTACT</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4ADE80', marginTop: 2 }}>{selectedTrip.emergency_contact || '+234 803 123 4567'}</div>
              </div>

              <div style={{ fontSize: 12, color: '#CBD5E1', marginBottom: 6 }}>
                <strong>Departure:</strong> {new Date(selectedTrip.departure_time).toLocaleTimeString()}
              </div>
              <div style={{ fontSize: 12, color: '#CBD5E1', marginBottom: 16 }}>
                <strong>Expected Arrival:</strong> {new Date(selectedTrip.expected_arrival).toLocaleTimeString()}
              </div>

              <a
                href={`https://www.google.com/maps?q=${selectedTrip.latitude},${selectedTrip.longitude}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block', textAlign: 'center', backgroundColor: '#2563EB', color: '#fff',
                  padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none',
                }}
              >
                📍 Open GPS Location on Google Maps
              </a>
            </div>
          )}

          {selectedIncident && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#EF4444', marginBottom: 8 }}>🚨 Emergency SOS Triggered</div>
              <div style={{ fontSize: 13, color: '#E2E8F0', marginBottom: 4 }}>Passenger ID: {selectedIncident.passenger_id}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#CBD5E1', marginBottom: 16 }}>
                GPS: {selectedIncident.latitude.toFixed(6)}, {selectedIncident.longitude.toFixed(6)}
              </div>

              <a
                href={`https://www.google.com/maps?q=${selectedIncident.latitude},${selectedIncident.longitude}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block', textAlign: 'center', backgroundColor: '#DC2626', color: '#fff',
                  padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none',
                }}
              >
                📍 Open Emergency Location on Map
              </a>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM CLOCK */}
      {!isMobile && (
        <div style={{
          position: 'absolute', bottom: 16, right: 16, zIndex: 10,
          padding: '8px 14px', backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 10,
          fontFamily: 'monospace', fontSize: 11, color: '#94A3B8',
        }}>
          {MOCK_MODE ? 'Mock Engine' : 'Live Supabase'} · {clientTime ?? '--:--:--'}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', color: '#94A3B8', fontSize: 14 }}>
        Loading Fleet Command Center...
      </div>
    }>
      <DashboardPageInner />
    </Suspense>
  );
}
