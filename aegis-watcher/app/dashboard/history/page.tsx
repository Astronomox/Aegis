'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Incident } from '@/types';
import { supabase, MOCK_MODE } from '@/lib/supabase';
import { MOCK_INCIDENTS } from '@/lib/mock-data';
import { useIsMobile } from '@/lib/useIsMobile';
import { usePassengerNames } from '@/lib/usePassengerNames';
import AppTopBar, { BackToDashboardLink } from '@/components/AppTopBar';

const PAGE_SIZE = 10;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function HistoryPageInner() {
  const isMobile = useIsMobile();
  const passengerName = usePassengerNames();
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
    <div style={{ minHeight: '100vh', background: 'var(--color-paper)', overflowY: 'auto' }}>
      <AppTopBar variant="static" />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: isMobile ? '16px' : '24px 20px' }}>
        <BackToDashboardLink />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--color-ink)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>History</h1>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-faint)' }}>{total} resolved</span>
        </div>

        <div style={{
          background: 'var(--color-paper-raised)', border: '1px solid var(--color-rule)',
          borderRadius: 'var(--radius-md)', overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>Loading...</div>
          ) : incidents.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>No resolved incidents</div>
          ) : (
            incidents.map((inc, i) => (
              <button key={inc.id} onClick={() => router.push(`/dashboard/incidents/${inc.id}`)} style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '14px 16px',
                background: 'transparent', border: 'none',
                borderBottom: i < incidents.length - 1 ? '1px solid var(--color-rule)' : 'none',
                transition: 'background 120ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-paper-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-ink)' }}>{passengerName(inc.passenger_id)}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>{timeAgo(inc.created_at)}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)', marginBottom: 5 }}>
                  {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
                </div>
                <span style={{
                  fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-mono)',
                  color: 'var(--color-ink-muted)', background: 'var(--color-paper)',
                  padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-rule)',
                }}>{inc.trigger_type === 'audio' ? 'SOUND' : 'TAP'}</span>
              </button>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
            <button disabled={currentPage <= 1} onClick={() => router.push(`/dashboard/history?page=${currentPage - 1}`)}
              style={{
                fontSize: 'var(--text-sm)', fontWeight: 600, fontFamily: 'var(--font-mono)',
                color: 'var(--color-accent)', background: 'var(--color-paper-raised)',
                border: '1px solid var(--color-rule)', padding: '6px 16px', borderRadius: 'var(--radius-sm)',
                opacity: currentPage <= 1 ? 0.3 : 1, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              }}>Prev</button>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>{currentPage}/{totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => router.push(`/dashboard/history?page=${currentPage + 1}`)}
              style={{
                fontSize: 'var(--text-sm)', fontWeight: 600, fontFamily: 'var(--font-mono)',
                color: 'var(--color-accent)', background: 'var(--color-paper-raised)',
                border: '1px solid var(--color-rule)', padding: '6px 16px', borderRadius: 'var(--radius-sm)',
                opacity: currentPage >= totalPages ? 0.3 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-paper)', color: 'var(--color-ink-faint)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>
        Loading...
      </div>
    }>
      <HistoryPageInner />
    </Suspense>
  );
}
