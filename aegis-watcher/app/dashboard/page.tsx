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

      {/* MOBILE DROPDOWN MENU - replaces top-bar buttons on small screens */}
      {isMobile && mobileMenuOpen && (
        <div style={{
          position: 'absolute', top: 68, left: 16, right: 16, zIndex: 20,
          background: 'var(--glass)', backdropFilter: 'var(--blur)',
          border: '1px solid var(--glass-border)', borderRadius: 8,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid var(--glass-border)',
          }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1 }}>
              {active.length} ACTIVE · {incidents.length} TOTAL
            </span>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: active.length > 0 ? 'var(--red)' : 'var(--green)',
              boxShadow: active.length > 0 ? '0 0 8px var(--red)' : '0 0 8px var(--green)',
            }} />
          </div>
          <button
            onClick={simulateIncident}
            style={{
              width: '100%', textAlign: 'left', padding: '14px 16px',
              fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
              color: 'var(--red)', letterSpacing: 1, background: 'transparent',
              borderBottom: '1px solid var(--glass-border)',
            }}
          >⚡ SIMULATE INCIDENT</button>
          <button
            onClick={() => { setMobileMenuOpen(false); router.push('/dashboard/history'); }}
            style={{
              width: '100%', textAlign: 'left', padding: '14px 16px',
              fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
              color: 'var(--text-dim)', letterSpacing: 1, background: 'transparent',
            }}
          >📋 VIEW HISTORY</button>
        </div>
      )}

      {/* DESKTOP: left sidebar feed | MOBILE: toggle pill + bottom drawer */}
      {!isMobile ? (
        <div style={{
          position: 'absolute', top: 72, left: 16, bottom: 16, width: 300, zIndex: 10,
          background: 'var(--glass)', backdropFilter: 'var(--blur)',
          border: '1px solid var(--glass-border)', borderRadius: 8,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <FeedHeader />
          <FeedList
            loading={loading}
            incidents={incidents}
            selectedId={selectedId}
            onSelect={selectIncident}
          />
        </div>
      ) : (
        <>
          {/* Floating toggle pill, bottom-left */}
          {!feedOpen && (
            <button
              onClick={() => { setFeedOpen(true); setSelectedId(null); }}
              style={{
                position: 'absolute', bottom: 16, left: 16, zIndex: 15,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 14px', borderRadius: 20,
                background: 'var(--glass)', backdropFilter: 'var(--blur)',
                border: '1px solid var(--glass-border)',
                fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text)',
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: active.length > 0 ? 'var(--red)' : 'var(--green)',
              }} />
              FEED ({incidents.length})
            </button>
          )}

          {/* Bottom sheet drawer */}
          {feedOpen && (
            <div style={{
              position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 25,
              maxHeight: '65vh', display: 'flex', flexDirection: 'column',
              background: 'var(--glass)', backdropFilter: 'var(--blur)',
              borderTop: '1px solid var(--glass-border)',
              borderRadius: '16px 16px 0 0', overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'center', padding: '8px 0 4px',
              }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.15)' }} />
              </div>
              <FeedHeader onClose={() => setFeedOpen(false)} />
              <FeedList
                loading={loading}
                incidents={incidents}
                selectedId={selectedId}
                onSelect={selectIncident}
              />
            </div>
          )}
        </>
      )}

      {/* INCIDENT DETAIL - right panel on desktop, bottom sheet on mobile */}
      {selected && (
        <div style={
          isMobile
            ? {
                position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 25,
                maxHeight: '75vh', overflowY: 'auto',
                background: 'var(--glass)', backdropFilter: 'var(--blur)',
                borderTop: '1px solid var(--glass-border)',
                borderRadius: '16px 16px 0 0',
              }
            : {
                position: 'absolute', top: 72, right: 16, width: 320, zIndex: 10,
                background: 'var(--glass)', backdropFilter: 'var(--blur)',
                border: '1px solid var(--glass-border)', borderRadius: 8,
                overflow: 'hidden',
              }
        }>
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.15)' }} />
            </div>
          )}

          <div style={{
            padding: '12px 14px', borderBottom: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: 2 }}>
              INCIDENT DETAIL
            </span>
            <button
              onClick={() => setSelectedId(null)}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontFamily: 'var(--mono)', fontSize: 14, padding: '0 4px', cursor: 'pointer',
              }}
            >×</button>
          </div>

          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: selected.status === 'active' ? 'var(--red)' : 'var(--green)',
                boxShadow: selected.status === 'active' ? '0 0 8px var(--red)' : '0 0 8px var(--green)',
              }} />
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                color: selected.status === 'active' ? 'var(--red)' : 'var(--green)',
                letterSpacing: 2,
              }}>
                {selected.status === 'active' ? 'ACTIVE EMERGENCY' : 'RESOLVED'}
              </span>
            </div>

            {[
              ['PASSENGER', MOCK_MODE ? MOCK_USERS[selected.passenger_id] || selected.passenger_id : selected.passenger_id],
              ['LATITUDE', selected.latitude.toFixed(6)],
              ['LONGITUDE', selected.longitude.toFixed(6)],
              ['TRIGGER', selected.trigger_type.toUpperCase()],
              ['TIME', new Date(selected.created_at).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5, marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  {value}
                </div>
              </div>
            ))}

            {selected.audio_url && !selected.audio_url.startsWith('mock://') && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5, marginBottom: 6 }}>
                  AUDIO CAPTURE
                </div>
                <audio controls src={selected.audio_url} style={{ width: '100%', height: 32 }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <a
                href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  flex: 1, textAlign: 'center',
                  fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
                  color: 'var(--blue)', letterSpacing: 1,
                  background: 'var(--blue-dim)', border: '1px solid rgba(68,138,255,0.15)',
                  padding: '10px 0', borderRadius: 4, transition: 'all 0.2s',
                }}
              >OPEN MAP</a>

              {selected.status === 'active' && (
                <button
                  onClick={() => router.push(`/dashboard/incidents/${selected.id}`)}
                  style={{
                    flex: 1,
                    fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
                    color: 'var(--green)', letterSpacing: 1,
                    background: 'var(--green-dim)', border: '1px solid rgba(0,230,118,0.15)',
                    padding: '10px 0', borderRadius: 4, transition: 'all 0.2s',
                  }}
                >RESPOND</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATS STRIP - hidden on mobile when a drawer is open, to avoid clutter */}
      {!(isMobile && (feedOpen || selected)) && (
        <div style={{
          position: 'absolute',
          bottom: isMobile ? 76 : 16,
          left: '50%', transform: 'translateX(-50%)', zIndex: 10,
          display: 'flex', alignItems: 'stretch',
          background: 'var(--glass)', backdropFilter: 'var(--blur)',
          border: '1px solid var(--glass-border)', borderRadius: 8,
          overflow: 'hidden',
        }}>
          {[
            { label: 'TODAY', value: todayCount },
            { label: 'AVG AGE', value: avgResponseMs !== null ? `${avgResponseMs}m` : '--' },
            { label: 'RESOLVED', value: `${resolvedRate}%` },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: isMobile ? '6px 12px' : '8px 18px',
                borderLeft: i > 0 ? '1px solid var(--glass-border)' : 'none',
                textAlign: 'center',
              }}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: isMobile ? 12 : 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 2 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BOTTOM STATUS BAR - desktop only, mobile has no room for it */}
      {!isMobile && (
        <div style={{
          position: 'absolute', bottom: 16, right: 16, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '8px 14px',
          background: 'var(--glass)', backdropFilter: 'var(--blur)',
          border: '1px solid var(--glass-border)', borderRadius: 6,
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>
            {MOCK_MODE ? 'MOCK' : 'LIVE'} MODE
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)' }}>
            LAT 6.5244 · LON 3.3792
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)' }}>
            {clientTime ?? '--:--:--'}
          </span>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </>
  );
}

function FeedHeader({ onClose }: { onClose?: () => void }) {
  return (
    <div style={{
      padding: '12px 14px', borderBottom: '1px solid var(--glass-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: 2 }}>
        INCIDENT FEED
      </span>
      {onClose ? (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, padding: '0 4px' }}
        >×</button>
      ) : (
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)' }}>LIVE</span>
      )}
    </div>
  );
}

function FeedList({
  loading, incidents, selectedId, onSelect,
}: {
  loading: boolean;
  incidents: Incident[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          LOADING...
        </div>
      ) : incidents.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2 }}>
            NO INCIDENTS
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 8 }}>
            MONITORING...
          </div>
        </div>
      ) : (
        incidents.map((inc) => {
          const isActive = inc.status === 'active';
          const isSelected = inc.id === selectedId;
          return (
            <button
              key={inc.id}
              onClick={() => onSelect(inc.id)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '10px 12px', marginBottom: 2,
                background: isSelected ? 'rgba(0,0,0,0.05)' : 'transparent',
                border: 'none', borderRadius: 6,
                borderLeft: isActive ? '2px solid var(--red)' : '2px solid transparent',
                transition: 'all 0.15s', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: 1,
                  color: isActive ? 'var(--red)' : 'var(--text-muted)',
                }}>
                  {isActive ? '● ACTIVE' : '○ RESOLVED'}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                  {timeAgo(inc.created_at)}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
                {MOCK_MODE ? MOCK_USERS[inc.passenger_id] || inc.passenger_id : inc.passenger_id}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)',
                  background: 'rgba(0,0,0,0.03)', padding: '2px 6px', borderRadius: 3,
                }}>
                  {inc.trigger_type === 'audio' ? 'MIC' : 'TAP'}
                </span>
                {inc.audio_url && (
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--blue)',
                    background: 'var(--blue-dim)', padding: '2px 6px', borderRadius: 3,
                  }}>AUDIO</span>
                )}
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
