'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Incident } from '@/types';
import { supabase, MOCK_MODE } from '@/lib/supabase';
import { MOCK_INCIDENTS, MOCK_USERS } from '@/lib/mock-data';
import IncidentMap from '@/components/IncidentMap';
import { playAlertSound } from '@/lib/alertSound';
import { useIsMobile } from '@/lib/useIsMobile';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'NOW';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function DashboardPage() {
  const isMobile = useIsMobile();

  // Clock must be client-only: rendering Date.now() during SSR causes a
  // hydration mismatch since the server and client render at different times.
  const [clientTime, setClientTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setClientTime(new Date().toLocaleTimeString());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      if (MOCK_MODE) {
        setIncidents(MOCK_INCIDENTS);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase!
        .from('incidents').select('*')
        .order('created_at', { ascending: false }).limit(50);
      if (!error && data) setIncidents(data as Incident[]);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (MOCK_MODE || !supabase) return;
    const channel = supabase
      .channel('incidents-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incidents' },
        (payload: { new: Incident }) => {
          setIncidents((prev) => [payload.new, ...prev]);
          playAlertSound();
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'incidents' },
        (payload: { new: Incident }) => setIncidents((prev) => prev.map((i) => i.id === payload.new.id ? payload.new : i)))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const active = incidents.filter((i) => i.status === 'active');
  const resolved = incidents.filter((i) => i.status === 'resolved');
  const selected = incidents.find((i) => i.id === selectedId);

  const todayCount = incidents.filter((i) => {
    const created = new Date(i.created_at);
    const now = new Date();
    return created.toDateString() === now.toDateString();
  }).length;

  const avgResponseMs = (() => {
    if (resolved.length === 0) return null;
    const totalMins = resolved.reduce((sum, i) => {
      const diff = Date.now() - new Date(i.created_at).getTime();
      return sum + diff / 60000;
    }, 0);
    return Math.round(totalMins / resolved.length);
  })();

  const resolvedRate = incidents.length > 0
    ? Math.round((resolved.length / incidents.length) * 100)
    : 0;

  const simulateIncident = () => {
    const lagosSpread = () => (Math.random() - 0.5) * 0.08;
    const fake: Incident = {
      id: `sim-${Date.now()}`,
      passenger_id: 'demo-passenger-001',
      latitude: 6.5244 + lagosSpread(),
      longitude: 3.3792 + lagosSpread(),
      trigger_type: Math.random() > 0.5 ? 'audio' : 'manual',
      audio_url: null,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    setIncidents((prev) => [fake, ...prev]);
    playAlertSound();
    setMobileMenuOpen(false);
  };

  const selectIncident = (id: string) => {
    setSelectedId(id);
    if (isMobile) setFeedOpen(false); // don't stack two bottom sheets
  };

  return (
    <>
      {/* FULL-SCREEN MAP */}
      <IncidentMap incidents={incidents} onMarkerClick={selectIncident} />

      {/* TOP BAR */}
      <div style={{
        position: 'absolute', top: 16, left: 16, right: 16, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'var(--glass)', backdropFilter: 'var(--blur)',
        border: '1px solid var(--glass-border)', borderRadius: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/aegis-logo.png" alt="AEGIS" style={{ height: 20 }} />
          {!isMobile && (
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600,
              color: 'var(--red)', letterSpacing: 2,
              background: 'var(--red-dim)', padding: '3px 8px', borderRadius: 3,
            }}>WATCHER</span>
          )}
        </div>

        {isMobile ? (
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: mobileMenuOpen ? 'rgba(0,0,0,0.06)' : 'transparent',
              border: 'none', borderRadius: 6, fontSize: 16, color: 'var(--text)',
            }}
            aria-label="Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: active.length > 0 ? 'var(--red)' : 'var(--green)',
                boxShadow: active.length > 0 ? '0 0 8px var(--red)' : '0 0 8px var(--green)',
                animation: active.length > 0 ? 'pulse 1.5s infinite' : 'none',
              }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1 }}>
                {active.length} ACTIVE
              </span>
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>
              {incidents.length} TOTAL
            </span>
            <button
              onClick={simulateIncident}
              style={{
                fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
                color: 'var(--red)', letterSpacing: 1,
                background: 'var(--red-dim)', border: '1px solid rgba(217,45,45,0.2)',
                padding: '5px 12px', borderRadius: 4, transition: 'all 0.2s',
              }}
              title="Dev only, injects a fake incident for demo purposes"
            >SIMULATE</button>
            <button
              onClick={() => router.push('/dashboard/history')}
              style={{
                fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
                color: 'var(--text-dim)', letterSpacing: 1,
                background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)',
                padding: '5px 12px', borderRadius: 4, transition: 'all 0.2s',
              }}
            >HISTORY</button>
          </div>
        )}
      </div>
