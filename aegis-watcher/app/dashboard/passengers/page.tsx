'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, MOCK_MODE } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppTopBar from '@/components/AppTopBar';

interface WatcherRow {
  id: string;
  passenger_id: string;
  label: string | null;
  created_at: string;
}

const MOCK_WATCHERS: WatcherRow[] = [
  {
    id: 'w-001',
    passenger_id: 'demo-passenger-001',
    label: 'Demo Passenger',
    created_at: new Date().toISOString(),
  },
];

export default function PassengersPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();

  const [watchers, setWatchers] = useState<WatcherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    if (MOCK_MODE) {
      setWatchers(MOCK_WATCHERS);
      setLoading(false);
      return;
    }

    if (!user) {
      setWatchers([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase!
      .from('watchers')
      .select('*')
      .eq('auth_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) setWatchers(data as WatcherRow[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!userLoading) load();
  }, [userLoading, user]);

  const handleAddWithCode = async () => {
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setAddError('A 6-character pairing code is required.');
      return;
    }

    if (cleanCode.length !== 6) {
      setAddError('Pairing code must be 6 characters long.');
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
        throw new Error(data.error || 'Failed to add passenger');
      }

      if (data.watcher) {
        setWatchers((previous) => [data.watcher as WatcherRow, ...previous]);
      } else {
        await load();
      }

      setCode('');
      setShowForm(false);
    } catch (error) {
      setAddError(error instanceof Error ? error.message : 'Failed to add passenger');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (MOCK_MODE) {
      setWatchers((previous) => previous.filter((watcher) => watcher.id !== id));
      return;
    }

    await supabase!.from('watchers').delete().eq('id', id);
    setWatchers((previous) => previous.filter((watcher) => watcher.id !== id));
  };

  return (
    <main className="passengers-page">
      <AppTopBar variant="static" />

      <section className="passengers-shell">
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          WATCHER CONTROL CENTER
        </div>

        <div className="page-heading">
          <div>
            <h1>
              Watch over
              <br />
              <span>who matters.</span>
            </h1>
            <p>
              Connect to a passenger using their private pairing code. You will be
              notified when they need help.
            </p>
          </div>

          <div className="security-note">
            <span className="security-icon">✦</span>
            <div>
              <strong>Private by design</strong>
              <span>Only paired passengers are visible to you.</span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <section className="pairing-panel">
            <div className="panel-label">01 / PAIR A PASSENGER</div>
            <h2>Add someone to your watch.</h2>
            <p>
              Ask them for the 6-character Watcher Code displayed in their Aegis app.
            </p>

            {!showForm ? (
              <button
                className="primary-button"
                onClick={() => {
                  setShowForm(true);
                  setAddError('');
                }}
              >
                Add passenger <span>→</span>
              </button>
            ) : (
              <div className="pairing-form">
                <label htmlFor="pairing-code">WATCHER CODE</label>
                <input
                  id="pairing-code"
                  value={code}
                  maxLength={6}
                  autoFocus
                  placeholder="ABC123"
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  onKeyDown={(event) => event.key === 'Enter' && handleAddWithCode()}
                />

                {addError && <p className="form-error">{addError}</p>}

                <div className="form-actions">
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setShowForm(false);
                      setCode('');
                      setAddError('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="primary-button compact"
                    disabled={adding || code.length !== 6}
                    onClick={handleAddWithCode}
                  >
                    {adding ? 'Pairing...' : 'Connect'} <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {user && <div className="signed-in">SIGNED IN AS {user.email}</div>}
          </section>

          <section className="watching-panel">
            <div className="watching-header">
              <div>
                <div className="panel-label">02 / ACTIVE CONNECTIONS</div>
                <h2>
                  Watching <span>{watchers.length.toString().padStart(2, '0')}</span>
                </h2>
              </div>
              <span className="active-status">
                <i /> ACTIVE
              </span>
            </div>

            <div className="watcher-list">
              {loading ? (
                <div className="empty-state">Loading protected connections...</div>
              ) : watchers.length === 0 ? (
                <div className="empty-state">
                  <span>NO CONNECTIONS YET</span>
                  <p>Your paired passengers will appear here.</p>
                </div>
              ) : (
                watchers.map((watcher) => (
                  <article className="watcher-row" key={watcher.id}>
                    <div className="watcher-avatar">
                      {(watcher.label || 'P').slice(0, 1).toUpperCase()}
                    </div>

                    <div className="watcher-details">
                      <strong>{watcher.label || 'Unnamed passenger'}</strong>
                      <span>CONNECTED {new Date(watcher.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="watcher-actions">
                      <button
                        className="view-button"
                        onClick={() =>
                          router.push(`/dashboard?passenger=${watcher.passenger_id}`)
                        }
                      >
                        Open dashboard <span>↗</span>
                      </button>
                      <button
                        className="remove-button"
                        aria-label={`Remove ${watcher.label || 'passenger'}`}
                        onClick={() => handleRemove(watcher.id)}
                      >
                        ×
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <p className="footer-note">
          Aegis never shares a passenger’s information outside their approved watcher
          network.
        </p>
      </section>

      <style jsx>{`
        .passengers-page {
          min-height: 100vh;
          color: #f5f2eb;
          background:
            radial-gradient(circle, rgba(255, 255, 255, 0.12) 1px, transparent 1.5px)
              0 0 / 36px 36px,
            #080909;
        }

        .passengers-shell {
          max-width: 1180px;
          margin: 0 auto;
          padding: 82px 28px 70px;
        }

        .eyebrow,
        .panel-label,
        .signed-in,
        label,
        .empty-state span {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.16em;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #ded5c5;
        }

        .eyebrow-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #ec524b;
        }

        .page-heading {
          display: flex;
          justify-content: space-between;
          gap: 40px;
          margin: 30px 0 64px;
        }

        h1,
        h2,
        p {
          margin: 0;
        }

        h1 {
          max-width: 720px;
          font-size: clamp(50px, 7vw, 92px);
          line-height: 0.93;
          letter-spacing: -0.075em;
          font-weight: 850;
        }

        h1 span {
          color: #898783;
        }

        .page-heading p {
          max-width: 560px;
          margin-top: 24px;
          color: #b5aea3;
          font-size: 17px;
          line-height: 1.65;
        }

        .security-note {
          display: flex;
          gap: 14px;
          width: 245px;
          height: fit-content;
          margin-top: 12px;
          padding: 17px;
          border: 1px solid #302f2c;
          background: rgba(12, 13, 13, 0.8);
        }

        .security-icon {
          color: #e9b779;
          font-size: 17px;
        }

        .security-note strong,
        .security-note span {
          display: block;
        }

        .security-note strong {
          margin-bottom: 4px;
          font-size: 13px;
        }

        .security-note span {
          color: #8e8b84;
          font-size: 11px;
          line-height: 1.4;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: minmax(300px, 0.82fr) minmax(0, 1.18fr);
          border: 1px solid #363532;
          background: #0b0c0c;
        }

        .pairing-panel,
        .watching-panel {
          padding: 34px;
        }

        .pairing-panel {
          border-right: 1px solid #363532;
        }

        .panel-label {
          color: #a69e92;
        }

        h2 {
          margin-top: 17px;
          color: #f5f2eb;
          font-size: 26px;
          letter-spacing: -0.045em;
        }

        .pairing-panel > p {
          margin: 13px 0 28px;
          color: #9b9790;
          font-size: 14px;
          line-height: 1.65;
        }

        button {
          cursor: pointer;
          font: inherit;
        }

        .primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 36px;
          min-width: 190px;
          padding: 14px 17px;
          border: 0;
          color: #111;
          background: #f3efe7;
          font-size: 13px;
          font-weight: 800;
        }

        .primary-button span {
          font-size: 18px;
          line-height: 0;
        }

        .primary-button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }

        .primary-button.compact {
          min-width: 0;
          padding: 11px 14px;
        }

        .pairing-form {
          margin-top: 28px;
          padding-top: 22px;
          border-top: 1px solid #363532;
        }

        label {
          display: block;
          margin-bottom: 9px;
          color: #b4aca0;
        }

        input {
          box-sizing: border-box;
          width: 100%;
          padding: 14px 15px;
          border: 1px solid #4c4943;
          outline: none;
          color: #f6f2ea;
          background: #121313;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0.24em;
          text-transform: uppercase;
        }

        input:focus {
          border-color: #e9b779;
        }

        .form-error {
          margin-top: 10px;
          color: #ed746c;
          font-size: 12px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 16px;
        }

        .secondary-button {
          border: 1px solid #4b4944;
          padding: 11px 14px;
          color: #ddd8ce;
          background: transparent;
          font-size: 13px;
          font-weight: 700;
        }

        .signed-in {
          margin-top: 34px;
          color: #696762;
          line-height: 1.5;
          word-break: break-word;
        }

        .watching-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .watching-header h2 span {
          color: #898783;
        }

        .active-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 3px;
          color: #b8b5ad;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .active-status i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #62bd93;
          box-shadow: 0 0 10px #62bd93;
        }

        .watcher-list {
          border-top: 1px solid #363532;
        }

        .watcher-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 17px 0;
          border-bottom: 1px solid #363532;
        }

        .watcher-avatar {
          display: grid;
          flex: 0 0 37px;
          width: 37px;
          height: 37px;
          place-items: center;
          border: 1px solid #716a5e;
          border-radius: 50%;
          color: #f0c282;
          background: #1a1917;
          font-size: 14px;
          font-weight: 800;
        }

        .watcher-details {
          min-width: 0;
          flex: 1;
        }

        .watcher-details strong,
        .watcher-details span {
          display: block;
        }

        .watcher-details strong {
          overflow: hidden;
          color: #f4f1e9;
          font-size: 14px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .watcher-details span {
          margin-top: 5px;
          color: #84817b;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
        }

        .watcher-actions {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .view-button {
          border: 0;
          padding: 9px 11px;
          color: #eac185;
          background: transparent;
          font-size: 12px;
          font-weight: 800;
        }

        .view-button span {
          margin-left: 4px;
          font-size: 15px;
        }

        .remove-button {
          display: grid;
          width: 28px;
          height: 28px;
          place-items: center;
          border: 1px solid #413f3b;
          color: #9b958a;
          background: transparent;
          font-size: 21px;
          line-height: 1;
        }

        .remove-button:hover {
          border-color: #b84e49;
          color: #ed746c;
        }

        .empty-state {
          padding: 54px 18px;
          color: #8d8981;
          text-align: center;
          font-size: 13px;
        }

        .empty-state span {
          color: #c3b9aa;
        }

        .empty-state p {
          margin-top: 10px;
        }

        .footer-note {
          max-width: 510px;
          margin: 23px 0 0;
          color: #77746e;
          font-size: 12px;
          line-height: 1.6;
        }

        @media (max-width: 760px) {
          .passengers-shell {
            padding: 52px 18px;
          }

          .page-heading {
            display: block;
            margin-bottom: 42px;
          }

          .security-note {
            width: auto;
            margin-top: 28px;
          }

          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .pairing-panel {
            border-right: 0;
            border-bottom: 1px solid #363532;
          }

          .pairing-panel,
          .watching-panel {
            padding: 25px 20px;
          }

          .watcher-row {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .watcher-actions {
            width: 100%;
            margin-left: 51px;
          }

          .view-button {
            padding-left: 0;
          }
        }
      `}</style>
    </main>
  );
}