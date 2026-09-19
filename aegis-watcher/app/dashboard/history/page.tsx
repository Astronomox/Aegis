'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Incident } from '@/types';
import { supabase, MOCK_MODE } from '@/lib/supabase';
import { MOCK_INCIDENTS } from '@/lib/mock-data';
import { usePassengerNames } from '@/lib/usePassengerNames';
import AppTopBar, { BackToDashboardLink } from '@/components/AppTopBar';

const PAGE_SIZE = 10;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins}M AGO`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}H AGO`;

  return `${Math.floor(hours / 24)}D AGO`;
}

function HistoryPageInner() {
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
        const resolved = MOCK_INCIDENTS.filter((incident) => incident.status === 'resolved');
        setTotal(resolved.length);
        setIncidents(resolved.slice(from, to + 1));
        setLoading(false);
        return;
      }

      const { count } = await supabase!
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved');

      const { data } = await supabase!
        .from('incidents')
        .select('*')
        .eq('status', 'resolved')
        .order('created_at', { ascending: false })
        .range(from, to);

      setTotal(count || 0);
      if (data) setIncidents(data as Incident[]);
      setLoading(false);
    }

    load();
  }, [currentPage]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="history-page">
      <AppTopBar variant="static" />

      <section className="history-shell">
        <div className="back-link">
          <BackToDashboardLink />
        </div>

        <div className="eyebrow">
          <span />
          SECURITY RECORD
        </div>

        <header className="history-header">
          <div>
            <h1>
              Incidents
             
            </h1>
            <p>
              A private record of resolved safety events from your connected
              passengers.
            </p>
          </div>

          <div className="resolved-count">
            <strong>{total.toString().padStart(2, '0')}</strong>
            <span>RESOLVED EVENTS</span>
          </div>
        </header>

        <section className="archive-panel">
          <div className="archive-panel-header">
            <span>EVENT LOG</span>
            <span>SELECT AN EVENT TO VIEW DETAILS ↗</span>
          </div>

          {loading ? (
            <div className="empty-state">LOADING EVENT ARCHIVE...</div>
          ) : incidents.length === 0 ? (
            <div className="empty-state">
              <strong>NO RESOLVED INCIDENTS</strong>
              <p>Resolved safety events will appear here.</p>
            </div>
          ) : (
            incidents.map((incident, index) => (
              <button
                key={incident.id}
                className="incident-row"
                onClick={() => router.push(`/dashboard/incidents/${incident.id}`)}
              >
                <span className="incident-number">
                  {(currentPage * PAGE_SIZE - PAGE_SIZE + index + 1)
                    .toString()
                    .padStart(2, '0')}
                </span>

                <div className="incident-main">
                  <strong>{passengerName(incident.passenger_id)}</strong>
                  <span className="coordinates">
                    {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                  </span>
                </div>

                <div className="incident-meta">
                  <span className="trigger">
                    {incident.trigger_type === 'audio' ? 'SOUND DETECTED' : 'HELP TAP'}
                  </span>
                  <span className="time">{timeAgo(incident.created_at)}</span>
                </div>

                <span className="open-arrow">↗</span>
              </button>
            ))
          )}
        </section>

        {totalPages > 1 && (
          <nav className="pagination" aria-label="Incident history pages">
            <button
              disabled={currentPage <= 1}
              onClick={() => router.push(`/dashboard/history?page=${currentPage - 1}`)}
            >
              ← PREVIOUS
            </button>

            <span>
              PAGE {currentPage.toString().padStart(2, '0')} /{' '}
              {totalPages.toString().padStart(2, '0')}
            </span>

            <button
              disabled={currentPage >= totalPages}
              onClick={() => router.push(`/dashboard/history?page=${currentPage + 1}`)}
            >
              NEXT →
            </button>
          </nav>
        )}
      </section>

      <style jsx>{`
        .history-page {
          min-height: 100dvh;
          color: #f5f2eb;
          background: transparent;
        }

        .history-shell {
          max-width: 1050px;
          margin: 0 auto;
          padding: 42px 28px 72px;
        }

        .back-link {
          margin-bottom: 38px;
          filter: grayscale(1) brightness(2);
          opacity: 0.8;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #d8d0c3;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
        }

        .eyebrow span {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #ec524b;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 32px;
          margin: 27px 0 54px;
        }

        h1,
        h1 span,
        p {
          margin: 0;
        }

        h1 {
          font-size: clamp(54px, 7vw, 86px);
          font-weight: 850;
          letter-spacing: -0.075em;
          line-height: 0.87;
        }

        h1 span {
          color: #898783;
        }

        .history-header p {
          max-width: 500px;
          margin-top: 25px;
          color: #aaa39a;
          font-size: 15px;
          line-height: 1.65;
        }

        .resolved-count {
          min-width: 145px;
          padding: 18px 0 18px 22px;
          border-left: 1px solid #4a4742;
        }

        .resolved-count strong,
        .resolved-count span {
          display: block;
        }

        .resolved-count strong {
          color: #e9b779;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 30px;
          letter-spacing: -0.08em;
        }

        .resolved-count span,
        .archive-panel-header,
        .incident-number,
        .coordinates,
        .trigger,
        .time,
        .pagination {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .resolved-count span {
          margin-top: 5px;
          color: #88847c;
        }

        .archive-panel {
          border: 1px solid #393834;
          background: rgba(10, 11, 11, 0.88);
        }

        .archive-panel-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 15px 19px;
          border-bottom: 1px solid #393834;
          color: #9c968b;
        }

        .archive-panel-header span:last-child {
          color: #68655f;
        }

        .incident-row {
          display: flex;
          width: 100%;
          align-items: center;
          gap: 18px;
          padding: 19px;
          border: 0;
          border-bottom: 1px solid #393834;
          color: inherit;
          background: transparent;
          text-align: left;
          transition: background 160ms ease;
          cursor: pointer;
        }

        .incident-row:hover {
          background: #171716;
        }

        .incident-number {
          color: #6f6b64;
        }

        .incident-main {
          min-width: 0;
          flex: 1;
        }

        .incident-main strong,
        .coordinates {
          display: block;
        }

        .incident-main strong {
          overflow: hidden;
          color: #f3f0e9;
          font-size: 15px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .coordinates {
          margin-top: 6px;
          color: #858078;
          font-size: 10px;
        }

        .incident-meta {
          display: flex;
          min-width: 180px;
          flex-direction: column;
          align-items: flex-end;
          gap: 7px;
        }

        .trigger {
          color: #e9b779;
        }

        .time {
          color: #77736d;
          font-size: 9px;
        }

        .open-arrow {
          color: #ccc5b8;
          font-size: 20px;
        }

        .empty-state {
          padding: 68px 20px;
          color: #87837b;
          text-align: center;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .empty-state strong,
        .empty-state p {
          display: block;
        }

        .empty-state strong {
          color: #c3b9aa;
        }

        .empty-state p {
          margin-top: 11px;
          color: #77736d;
          font-family: inherit;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.04em;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          margin-top: 25px;
          color: #88837a;
        }

        .pagination button {
          border: 1px solid #45423d;
          padding: 11px 14px;
          color: #e5ddcf;
          background: #111212;
          font: inherit;
          font-size: 10px;
          cursor: pointer;
        }

        .pagination button:disabled {
          cursor: not-allowed;
          opacity: 0.3;
        }

        @media (max-width: 650px) {
          .history-shell {
            padding: 28px 18px 56px;
          }

          .history-header {
            display: block;
            margin-bottom: 38px;
          }

          .resolved-count {
            width: fit-content;
            margin-top: 28px;
          }

          .archive-panel-header span:last-child,
          .coordinates {
            display: none;
          }

          .incident-row {
            gap: 12px;
            padding: 16px 13px;
          }

          .incident-meta {
            min-width: auto;
          }

          .trigger {
            max-width: 85px;
            text-align: right;
            line-height: 1.35;
          }

          .pagination {
            gap: 9px;
          }

          .pagination button {
            padding: 10px;
          }
        }
      `}</style>
    </main>
  );
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: '100dvh',
            display: 'grid',
            placeItems: 'center',
            background: '#080909',
            color: '#aaa39a',
            fontFamily: 'ui-monospace, monospace',
            fontSize: 12,
          }}
        >
          Loading archive...
        </main>
      }
    >
      <HistoryPageInner />
    </Suspense>
  );
}