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
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowY: 'auto' }}>
      <AppTopBar variant="static" />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
        <BackToDashboardLink />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue)' }}>History</h1>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{total} resolved</span>
        </div>

        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Loading...</div>
          ) : incidents.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>No resolved incidents yet</div>
          ) : (
            incidents.map((inc) => (
              <button key={inc.id} onClick={() => router.push(`/dashboard/incidents/${inc.id}`)} style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '16px 18px',
                background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
                transition: 'background 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{passengerName(inc.passenger_id)}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(inc.created_at)}</span>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                  {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--text-dim)',
                  background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                }}>{inc.trigger_type === 'audio' ? 'Sound' : 'Tap'}</span>
              </button>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 }}>
            <button disabled={currentPage <= 1} onClick={() => router.push(`/dashboard/history?page=${currentPage - 1}`)}
              style={{
                fontSize: 13, fontWeight: 600, color: 'var(--blue)', background: '#fff',
                border: '1px solid var(--border)', padding: '8px 18px', borderRadius: 'var(--radius-sm)',
                opacity: currentPage <= 1 ? 0.3 : 1,
              }}>Prev</button>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{currentPage} / {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => router.push(`/dashboard/history?page=${currentPage + 1}`)}
              style={{
                fontSize: 13, fontWeight: 600, color: 'var(--blue)', background: '#fff',
                border: '1px solid var(--border)', padding: '8px 18px', borderRadius: 'var(--radius-sm)',
                opacity: currentPage >= totalPages ? 0.3 : 1,
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 14 }}>
        Loading...
      </div>
    }>
      <HistoryPageInner />
    </Suspense>
  );
}
