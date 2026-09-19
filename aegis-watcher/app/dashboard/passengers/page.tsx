'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, MOCK_MODE } from '@/lib/supabase';
import { useCurrentUser } from '@/lib/useCurrentUser';

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
  const [newPassengerId, setNewPassengerId] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    if (MOCK_MODE) {
      setWatchers(MOCK_WATCHERS);
      setLoading(false);
      return;
    }
    if (!user) return;
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

  const handleAdd = async () => {
    if (!newPassengerId.trim()) {
      setAddError('Passenger ID is required.');
      return;
    }
    setAdding(true);
    setAddError('');

    if (MOCK_MODE) {
      const row: WatcherRow = {
        id: `w-${Date.now()}`,
        passenger_id: newPassengerId.trim(),
        label: newLabel.trim() || null,
        created_at: new Date().toISOString(),
      };
      setWatchers((prev) => [row, ...prev]);
      setNewPassengerId('');
      setNewLabel('');
      setShowForm(false);
      setAdding(false);
      return;
    }

    const { data, error } = await supabase!
      .from('watchers')
      .insert({
        auth_id: user!.id,
        passenger_id: newPassengerId.trim(),
        label: newLabel.trim() || null,
      })
      .select()
      .single();

    if (error) {
      setAddError(
        error.code === '23505'
          ? 'You\'re already watching this passenger.'
          : error.message
      );
    } else if (data) {
      setWatchers((prev) => [data as WatcherRow, ...prev]);
      setNewPassengerId('');
      setNewLabel('');
      setShowForm(false);
    }
    setAdding(false);
  };

  const handleRemove = async (id: string) => {
    if (MOCK_MODE) {
      setWatchers((prev) => prev.filter((w) => w.id !== id));
      return;
    }
    await supabase!.from('watchers').delete().eq('id', id);
    setWatchers((prev) => prev.filter((w) => w.id !== id));
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const s: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 20%, #ffffff 0%, #f4f5f7 70%)',
      padding: '0 0 60px',
    },
    topbar: {
      position: 'sticky', top: 0, zIndex: 30,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 24px',
      background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--glass-border)',
    },
    content: { maxWidth: 680, margin: '0 auto', padding: '32px 24px' },
    card: {
      background: 'var(--glass)', backdropFilter: 'var(--blur)',
      border: '1px solid var(--glass-border)', borderRadius: 10,
      overflow: 'hidden', marginBottom: 16,
    },
    cardHeader: {
      padding: '14px 18px', borderBottom: '1px solid var(--glass-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    row: {
      padding: '14px 18px', borderBottom: '1px solid var(--glass-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12,
    },
    input: {
      width: '100%', padding: '11px 14px',
      background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)',
      borderRadius: 6, fontFamily: 'var(--mono)', fontSize: 12,
      color: 'var(--text)', outline: 'none',
    },
    btn: {
      fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
      letterSpacing: 1, padding: '9px 16px', borderRadius: 5,
      border: 'none', transition: 'all 0.15s',
    },
  };

  return (
    <div style={s.page}>
      {/* Top bar */}
      <div style={s.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/aegis-logo.png" alt="AEGIS" style={{ height: 18 }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2 }}>
            WATCHER
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ ...s.btn, color: 'var(--text-dim)', background: 'rgba(0,0,0,0.04)' }}
          >← DASHBOARD</button>
          <button
            onClick={handleLogout}
            style={{ ...s.btn, color: 'var(--red)', background: 'var(--red-dim)' }}
          >LOG OUT</button>
        </div>
      </div>

      <div style={s.content}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>My Passengers</h1>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            Manage who you're watching. Add a passenger by their Aegis ID (shown in the app
            after they complete setup). You'll see their incidents on the dashboard in real time.
          </p>
          {user && (
            <div style={{
              marginTop: 10, display: 'inline-block',
              fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 1,
              color: 'var(--text-muted)', background: 'rgba(0,0,0,0.04)',
              padding: '4px 10px', borderRadius: 4,
            }}>
              LOGGED IN AS {user.email}
            </div>
          )}
        </div>

        {/* Add passenger form */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--text-dim)' }}>
              ADD PASSENGER
            </span>
            <button
              onClick={() => { setShowForm((v) => !v); setAddError(''); }}
              style={{ ...s.btn, color: 'var(--red)', background: 'var(--red-dim)' }}
            >
              {showForm ? 'CANCEL' : '+ ADD'}
            </button>
          </div>

          {showForm && (
            <div style={{ padding: 18 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 6 }}>
                  PASSENGER ID *
                </label>
                <input
                  style={s.input}
                  value={newPassengerId}
                  onChange={(e) => setNewPassengerId(e.target.value)}
                  placeholder="e.g. demo-passenger-001 or a UUID"
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(217,45,45,0.3)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 6 }}>
                  LABEL (optional)
                </label>
                <input
                  style={s.input}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Mum, Ahmed, Sister"
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(217,45,45,0.3)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
              {addError && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--red)', marginBottom: 12, letterSpacing: 1 }}>
                  {addError}
                </div>
              )}
              <button
                onClick={handleAdd}
                disabled={adding}
                style={{
                  ...s.btn, width: '100%', padding: '12px 0',
                  color: '#fff', background: 'var(--text)',
                  opacity: adding ? 0.5 : 1,
                }}
              >
                {adding ? 'ADDING...' : 'CONFIRM'}
              </button>
            </div>
          )}
        </div>

        {/* Passenger list */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--text-dim)' }}>
              WATCHING ({watchers.length})
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2 }}>
              LOADING...
            </div>
          ) : watchers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                No passengers yet
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Add a passenger ID above to start watching them.
              </div>
            </div>
          ) : (
            watchers.map((w, i) => (
              <div
                key={w.id}
                style={{
                  ...s.row,
                  borderBottom: i < watchers.length - 1 ? '1px solid var(--glass-border)' : 'none',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>
                    {w.label || 'Unnamed Passenger'}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    ID: {w.passenger_id}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 3, letterSpacing: 0.5 }}>
                    Added {new Date(w.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => router.push(`/dashboard?passenger=${w.passenger_id}`)}
                    style={{ ...s.btn, color: 'var(--blue)', background: 'var(--blue-dim)' }}
                  >VIEW</button>
                  <button
                    onClick={() => handleRemove(w.id)}
                    style={{ ...s.btn, color: 'var(--red)', background: 'var(--red-dim)' }}
                  >REMOVE</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6, padding: '0 4px' }}>
          The passenger's Aegis ID appears in the app after they complete the setup screen.
          In mock mode the demo ID is <code style={{ background: 'rgba(0,0,0,0.05)', padding: '1px 5px', borderRadius: 3 }}>demo-passenger-001</code>.
        </div>
      </div>
    </div>
  );
}
