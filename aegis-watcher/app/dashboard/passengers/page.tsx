'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, MOCK_MODE } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppTopBar from '@/components/AppTopBar';
import AddPassengerModal from '@/components/AddPassengerModal';

interface WatcherRow {
  id: string;
  passenger_id: string;
  label: string | null;
  created_at: string;
}

const MOCK_WATCHERS: WatcherRow[] = [
  { id: 'w-001', passenger_id: 'demo-passenger-001', label: 'Demo Passenger', created_at: new Date().toISOString() },
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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setAddError('6-digit pairing code is required.');
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
        setWatchers((prev) => [data.watcher as WatcherRow, ...prev]);
      } else {
        await load();
      }

      setCode('');
      setShowForm(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add passenger');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (MOCK_MODE) {
      setWatchers((prev) => prev.filter((w) => w.id !== id));
      return;
    }
    await supabase!.from('watchers').delete().eq('id', id);
    setWatchers((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 60 }}>
      <AppTopBar variant="static" />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 26 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue)', marginBottom: 6 }}>My passengers</h1>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6 }}>
            Manage who you are watching. Enter the 6-digit <strong>Adding Code</strong> generated in the passenger's Aegis mobile app to start monitoring them.
          </p>
          {user && (
            <div style={{
              marginTop: 10, display: 'inline-block', fontSize: 12, fontWeight: 500,
              color: 'var(--text-muted)', background: 'rgba(0,0,0,0.04)',
              padding: '5px 12px', borderRadius: 'var(--radius-pill)',
            }}>
              Logged in as {user.email}
            </div>
          )}
        </div>

        {/* Add passenger card */}
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          overflow: 'hidden', marginBottom: 16,
        }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Add passenger</span>
            <button
              onClick={() => { setShowForm((v) => !v); setAddError(''); }}
              style={{
                fontSize: 12, fontWeight: 700, color: 'var(--blue)',
                background: 'var(--blue-dim)', border: 'none',
                padding: '7px 16px', borderRadius: 'var(--radius-pill)',
              }}
            >{showForm ? 'Cancel' : '+ Add Code'}</button>
          </div>

          {showForm && (
            <div style={{ padding: 18 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>
                  6-Digit Pairing / Adding Code
                </label>
                <input
                  style={{
                    width: '100%', padding: '11px 14px', fontSize: 18, fontWeight: 700,
                    letterSpacing: 3, textTransform: 'uppercase',
                    background: 'var(--bg)', border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', outline: 'none', color: 'var(--text)',
                  }}
                  value={code}
                  maxLength={6}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  onFocus={(e) => (e.target.style.borderColor = 'var(--blue)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddWithCode()}
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Ask the passenger to open their Aegis app and view their Watcher Code.
                </span>
              </div>
              {addError && (
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)', marginBottom: 12 }}>
                  {addError}
                </div>
              )}
              <button
                onClick={handleAddWithCode}
                disabled={adding || code.length !== 6}
                style={{
                  width: '100%', padding: '12px 0', fontSize: 14, fontWeight: 700,
                  color: '#fff', background: 'var(--blue)', border: 'none',
                  borderRadius: 'var(--radius-sm)', opacity: adding || code.length !== 6 ? 0.6 : 1,
                  cursor: adding || code.length !== 6 ? 'not-allowed' : 'pointer',
                }}
              >{adding ? 'Redeeming code...' : 'Add Passenger'}</button>
            </div>
          )}
        </div>

        {/* Passenger list */}
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
              Watching ({watchers.length})
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              Loading...
            </div>
          ) : watchers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>
                No passengers yet
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Ask a passenger for their 6-digit adding code to start watching them.
              </div>
            </div>
          ) : (
            watchers.map((w, i) => (
              <div
                key={w.id}
                style={{
                  padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  borderBottom: i < watchers.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>
                    {w.label || 'Unnamed passenger'}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    ID: {w.passenger_id}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                    Added {new Date(w.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => router.push(`/dashboard?passenger=${w.passenger_id}`)}
                    style={{
                      fontSize: 12, fontWeight: 700, color: 'var(--blue)',
                      background: 'var(--blue-dim)', border: 'none',
                      padding: '8px 14px', borderRadius: 'var(--radius-pill)',
                    }}
                  >View</button>
                  <button
                    onClick={() => handleRemove(w.id)}
                    style={{
                      fontSize: 12, fontWeight: 700, color: 'var(--red)',
                      background: 'var(--red-dim)', border: 'none',
                      padding: '8px 14px', borderRadius: 'var(--radius-pill)',
                    }}
                  >Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, padding: '0 4px', marginTop: 16 }}>
          Passengers can view or generate their 6-digit adding code during onboarding or via the <strong>⚙ Watcher Code</strong> menu on their Aegis app screen.
        </div>
      </div>

      <AddPassengerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => load()}
      />
    </div>
  );
}
