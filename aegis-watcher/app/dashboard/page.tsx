'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Incident } from '@/types';
import { supabase, MOCK_MODE } from '@/lib/supabase';
import { MOCK_INCIDENTS } from '@/lib/mock-data';
import IncidentMap from '@/components/IncidentMap';
import { playAlertSound } from '@/lib/alertSound';
import { useIsMobile } from '@/lib/useIsMobile';
import { usePassengerNames } from '@/lib/usePassengerNames';
import { CloseIcon, ShieldIcon } from '@/components/icons/Icons';
import AppTopBar from '@/components/AppTopBar';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function DashboardPageInner() {
  const isMobile = useIsMobile();
  const passengerName = usePassengerNames();
  const searchParams = useSearchParams();
  const filterPassenger = searchParams.get('passenger');

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
  const [feedOpen, setFeedOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      if (MOCK_MODE) { setIncidents(MOCK_INCIDENTS); setLoading(false); return; }
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
    const client = supabase;
    const channel = client
      .channel('incidents-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incidents' },
        (payload: { new: Incident }) => { setIncidents((prev) => [payload.new, ...prev]); playAlertSound(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'incidents' },
        (payload: { new: Incident }) => setIncidents((prev) => prev.map((i) => i.id === payload.new.id ? payload.new : i)))
      .subscribe();
    return () => { client.removeChannel(channel); };
  }, []);

  const displayed = filterPassenger
    ? incidents.filter((i) => i.passenger_id === filterPassenger)
    : incidents;
  const active = displayed.filter((i) => i.status === 'active');
  const resolved = displayed.filter((i) => i.status === 'resolved');
  const selected = displayed.find((i) => i.id === selectedId);

  const todayCount = displayed.filter((i) => new Date(i.created_at).toDateString() === new Date().toDateString()).length;
  const resolvedRate = displayed.length > 0 ? Math.round((resolved.length / displayed.length) * 100) : 0;

  const simulateIncident = () => {
    const spread = () => (Math.random() - 0.5) * 0.08;
    const fake: Incident = {
      id: `sim-${Date.now()}`, passenger_id: 'demo-passenger-001',
      latitude: 6.5244 + spread(), longitude: 3.3792 + spread(),
      trigger_type: Math.random() > 0.5 ? 'audio' : 'manual',
      audio_url: null, status: 'active', created_at: new Date().toISOString(),
    };
    setIncidents((prev) => [fake, ...prev]);
    playAlertSound();
  };

  const selectIncident = (id: string) => {
    setSelectedId(id);
    if (isMobile) setFeedOpen(false);
  };

  // Shared pill/badge styles
  const pill = (color: string, bg: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 12, fontWeight: 600, color,
    background: bg, padding: '5px 12px', borderRadius: 'var(--radius-pill)',
  });

  return (
    <>
      <IncidentMap incidents={displayed} onMarkerClick={selectIncident} />

      <AppTopBar
        variant="floating"
        extraDesktopControls={
          <>
            <span style={pill(active.length > 0 ? 'var(--red)' : 'var(--green-dark)', active.length > 0 ? 'var(--red-dim)' : 'var(--green-dim)')}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: active.length > 0 ? 'var(--red)' : 'var(--green-dark)',
                animation: active.length > 0 ? 'pulse 1.5s infinite' : 'none',
              }} />
              {active.length} active
            </span>
            <button onClick={simulateIncident}
              style={{ ...pill('var(--red)', 'var(--red-dim)'), cursor: 'pointer', border: 'none' }}
              title="Demo only: simulate a fake incident"
            >Simulate</button>
          </>
        }
        extraMobileControls={[
          { label: 'Simulate incident', color: 'var(--red)', onClick: simulateIncident },
        ]}
      />

      {/* FEED: desktop sidebar / mobile bottom drawer */}
      {!isMobile ? (
        <div style={{
          position: 'absolute', top: 76, left: 16, bottom: 16, width: 320, zIndex: 10,
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <FeedHeader />
          <FeedList loading={loading} incidents={displayed} selectedId={selectedId} onSelect={selectIncident} passengerName={passengerName} />
        </div>
      ) : (
        <>
          {!feedOpen && (
            <button onClick={() => { setFeedOpen(true); setSelectedId(null); }} style={{
              position: 'absolute', bottom: 16, left: 16, zIndex: 15,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 'var(--radius-pill)',
              background: '#fff', border: '1px solid var(--border)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              fontSize: 13, fontWeight: 600, color: 'var(--text)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: active.length > 0 ? 'var(--red)' : 'var(--green-dark)' }} />
              Feed ({displayed.length})
            </button>
          )}
          {feedOpen && (
            <div style={{
              position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 25,
              maxHeight: '65vh', display: 'flex', flexDirection: 'column',
              background: '#fff', borderTop: '1px solid var(--border)',
              borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.1)' }} />
              </div>
              <FeedHeader onClose={() => setFeedOpen(false)} />
              <FeedList loading={loading} incidents={displayed} selectedId={selectedId} onSelect={selectIncident} passengerName={passengerName} />
            </div>
          )}
        </>
      )}

      {/* INCIDENT DETAIL */}
      {selected && (
        <div style={
          isMobile
            ? {
                position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 25,
                maxHeight: '75vh', overflowY: 'auto',
                background: '#fff', borderTop: '1px solid var(--border)',
                borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
              }
            : {
                position: 'absolute', top: 76, right: 16, width: 340, zIndex: 10,
                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden',
              }
        }>
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.1)' }} />
            </div>
          )}
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Incident detail</span>
            <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><CloseIcon size={16} /></button>
          </div>

          <div style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: selected.status === 'active' ? 'var(--red)' : 'var(--green-dark)',
              }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: selected.status === 'active' ? 'var(--red)' : 'var(--green-dark)' }}>
                {selected.status === 'active' ? 'Active alert' : 'Resolved'}
              </span>
            </div>

            {[
              ['Passenger', passengerName(selected.passenger_id)],
              ['Latitude', selected.latitude.toFixed(6)],
              ['Longitude', selected.longitude.toFixed(6)],
              ['Trigger', selected.trigger_type === 'audio' ? 'Sound detected' : 'Manual tap'],
              ['Time', new Date(selected.created_at).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
                <div style={{ fontFamily: label === 'Passenger' || label === 'Trigger' ? 'var(--sans)' : 'var(--mono)', fontSize: 14, fontWeight: 600 }}>{value}</div>
              </div>
            ))}

            {selected.audio_url && !selected.audio_url.startsWith('mock://') && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>Audio</div>
                <audio controls src={selected.audio_url} style={{ width: '100%', height: 36 }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <a href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700,
                  color: 'var(--blue)', background: 'var(--blue-dim)',
                  padding: '11px 0', borderRadius: 'var(--radius-sm)',
                }}
              >Open map</a>
              {selected.status === 'active' && (
                <button onClick={() => router.push(`/dashboard/incidents/${selected.id}`)} style={{
                  flex: 1, fontSize: 13, fontWeight: 700,
                  color: 'var(--green-dark)', background: 'var(--green-dim)',
                  padding: '11px 0', borderRadius: 'var(--radius-sm)',
                }}>Respond</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATS STRIP */}
      {!(isMobile && (feedOpen || selected)) && (
        <div style={{
          position: 'absolute', bottom: isMobile ? 72 : 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
          display: 'flex', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'hidden',
        }}>
          {[
            { label: 'Today', value: todayCount },
            { label: 'Resolved', value: `${resolvedRate}%` },
            { label: 'Total', value: displayed.length },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              padding: isMobile ? '8px 14px' : '10px 20px',
              borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: isMobile ? 14 : 18, fontWeight: 800, color: 'var(--blue)' }}>{stat.value}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginTop: 1 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* CLOCK - desktop only */}
      {!isMobile && (
        <div style={{
          position: 'absolute', bottom: 16, right: 16, zIndex: 10,
          padding: '8px 14px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)',
        }}>
          {MOCK_MODE ? 'Demo' : 'Live'} · {clientTime ?? '--:--:--'}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
      `}</style>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 14 }}>
        Loading...
      </div>
    }>
      <DashboardPageInner />
    </Suspense>
  );
}

function FeedHeader({ onClose }: { onClose?: () => void }) {
  return (
    <div style={{
      padding: '14px 18px', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Incidents</span>
      {onClose ? (
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><CloseIcon size={16} /></button>
      ) : (
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green-dark)', background: 'var(--green-dim)', padding: '3px 10px', borderRadius: 'var(--radius-pill)' }}>Live</span>
      )}
    </div>
  );
}

function FeedList({ loading, incidents, selectedId, onSelect, passengerName }: {
  loading: boolean; incidents: Incident[]; selectedId: string | null;
  onSelect: (id: string) => void; passengerName: (id: string) => string;
}) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Loading...</div>
      ) : incidents.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><ShieldIcon size={30} color="var(--blue)" /></div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4 }}>All clear</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No incidents right now</div>
        </div>
      ) : (
        incidents.map((inc) => {
          const isActive = inc.status === 'active';
          const isSelected = inc.id === selectedId;
          return (
            <button key={inc.id} onClick={() => onSelect(inc.id)} style={{
              width: '100%', textAlign: 'left', padding: '12px 14px', marginBottom: 4,
              background: isSelected ? 'var(--blue-dim)' : 'transparent',
              border: 'none', borderRadius: 'var(--radius-sm)',
              borderLeft: isActive ? '3px solid var(--red)' : '3px solid transparent',
              transition: 'background 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? 'var(--red)' : 'var(--text-muted)' }}>
                  {isActive ? '● Active' : 'Resolved'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(inc.created_at)}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
                {passengerName(inc.passenger_id)}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--text-dim)',
                  background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                }}>{inc.trigger_type === 'audio' ? 'Sound' : 'Tap'}</span>
                {inc.audio_url && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: 'var(--blue)',
                    background: 'var(--blue-dim)', padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                  }}>Audio</span>
                )}
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
