'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Incident } from '@/types';
import { supabase, MOCK_MODE } from '@/lib/supabase';
import { MOCK_INCIDENTS, MOCK_USERS } from '@/lib/mock-data';
import { useIsMobile } from '@/lib/useIsMobile';

const PAGE_SIZE = 10;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'NOW';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function HistoryPage() {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = Number(searchParams.get('page') || '1');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      if (MOCK_MODE) {
        const resolved = MOCK_INCIDENTS.filter((i) => i.status === 'resolved');
        setTotal(resolved.length);
        setIncidents(resolved.slice(from, to + 1));
        setLoading(false);
        return;
      }
      const { count } = await supabase!.from('incidents').select('*', { count: 'exact', head: true }).eq('status', 'resolved');
      setTotal(count || 0);
      const { data } = await supabase!.from('incidents').select('*').eq('status', 'resolved').order('created_at', { ascending: false }).range(from, to);
      if (data) setIncidents(data as Incident[]);
      setLoading(false);
    }
    load();
  }, [currentPage]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{
      height: '100vh',
      background: 'radial-gradient(ellipse at 50% 30%, #ffffff 0%, #f4f5f7 70%)',
      position: 'relative', overflow: 'auto',
    }}>
      {/* Grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              style={{ background: 'none', border: 'none', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, cursor: 'pointer', marginBottom: 8, display: 'block' }}
            >← BACK TO LIVE</button>
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>INCIDENT HISTORY</h1>
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>
            {total} RECORDS
          </span>
        </div>

        {/* Table */}
        <div style={{
          background: 'var(--glass)', backdropFilter: 'var(--blur)',
          border: '1px solid var(--glass-border)', borderRadius: 8,
          overflow: 'hidden',
        }}>
          {/* Table header - hidden on mobile, cards are self-labeled instead */}
          {!isMobile && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.6fr 0.6fr',
              padding: '10px 16px', borderBottom: '1px solid var(--glass-border)',
            }}>
              {['PASSENGER', 'COORDINATES', 'TRIGGER', 'TIME'].map((h) => (
                <span key={h} style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1.5 }}>
                  {h}
                </span>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
              LOADING...
            </div>
          ) : incidents.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
              NO RESOLVED INCIDENTS
            </div>
          ) : isMobile ? (
            // Mobile: stacked card per incident, all fields labeled
            incidents.map((inc) => (
              <button
                key={inc.id}
                onClick={() => router.push(`/dashboard/incidents/${inc.id}`)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '14px 16px', background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  {MOCK_MODE ? MOCK_USERS[inc.passenger_id] || inc.passenger_id : inc.passenger_id}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>
                  {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-dim)',
                    background: 'rgba(0,0,0,0.04)', padding: '2px 7px', borderRadius: 3,
                  }}>{inc.trigger_type.toUpperCase()}</span>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)',
                    background: 'rgba(0,0,0,0.04)', padding: '2px 7px', borderRadius: 3,
                  }}>{timeAgo(inc.created_at)}</span>
                </div>
              </button>
            ))
          ) : (
            // Desktop: 4-column grid row per incident
            incidents.map((inc) => (
              <button
                key={inc.id}
                onClick={() => router.push(`/dashboard/incidents/${inc.id}`)}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.6fr 0.6fr',
                  width: '100%', padding: '12px 16px', textAlign: 'left',
                  background: 'transparent', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.025)',
                  transition: 'background 0.15s', cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.025)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                  {MOCK_MODE ? MOCK_USERS[inc.passenger_id] || inc.passenger_id : inc.passenger_id}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-dim)' }}>
                  {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                  {inc.trigger_type.toUpperCase()}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                  {timeAgo(inc.created_at)}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 16, marginTop: 20,
          }}>
            <button
              disabled={currentPage <= 1}
              onClick={() => router.push(`/dashboard/history?page=${currentPage - 1}`)}
              style={{
                fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
                color: 'var(--text-dim)', letterSpacing: 1,
                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                padding: '8px 16px', borderRadius: 4,
                opacity: currentPage <= 1 ? 0.3 : 1, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              }}
            >PREV</button>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => router.push(`/dashboard/history?page=${currentPage + 1}`)}
              style={{
                fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
                color: 'var(--text-dim)', letterSpacing: 1,
                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                padding: '8px 16px', borderRadius: 4,
                opacity: currentPage >= totalPages ? 0.3 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >NEXT</button>
          </div>
        )}
      </div>
    </div>
  );
}
