'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_MODE } from '@/lib/supabase';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');
    setInfo('');

    try {
      if (mode === 'signup') {
        // Sign up creates the Supabase Auth user, then redirect to login
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const body = await res.json();
        if (!res.ok) {
          setError(body.error || 'SIGNUP FAILED');
        } else {
          setInfo('Account created. Check your email to confirm, then log in.');
          setMode('login');
        }
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const body = await res.json();
        if (res.ok) {
          router.push('/dashboard');
        } else {
          setError(body.error || 'ACCESS DENIED');
        }
      }
    } catch {
      setError('CONNECTION FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 50%, #ffffff 0%, #f4f5f7 70%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflowY: 'auto', padding: '24px 0',
    }}>
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Scan line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,59,59,0.3), transparent)',
        animation: 'scanline 4s ease-in-out infinite',
      }} />

      <div style={{
        position: 'relative', width: '100%', maxWidth: 400,
        padding: '0 24px', textAlign: 'center',
      }}>
        <img src="/aegis-logo.png" alt="AEGIS" style={{ width: 220, height: 'auto', marginBottom: 4 }} />

        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500,
          color: 'var(--text-muted)', letterSpacing: 4, marginBottom: 40,
        }}>
          Watcher Command Interface
        </div>

        {/* Status dot */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--green)', boxShadow: '0 0 8px var(--green)',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: 2 }}>
            SYSTEM ONLINE
          </span>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', marginBottom: 24,
          background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)', borderRadius: 6,
          overflow: 'hidden',
        }}>
          {(['login', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setInfo(''); }}
              style={{
                flex: 1, padding: '10px 0',
                fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: 2,
                color: mode === m ? 'var(--red)' : 'var(--text-muted)',
                background: mode === m ? 'var(--red-dim)' : 'transparent',
                border: 'none', transition: 'all 0.2s',
              }}
            >
              {m === 'login' ? 'LOG IN' : 'SIGN UP'}
            </button>
          ))}
        </div>

        {MOCK_MODE && (
          <div style={{
            marginBottom: 20, padding: '10px 14px',
            background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)',
            borderRadius: 6, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--blue)',
            letterSpacing: 1, lineHeight: 1.6, textAlign: 'left',
          }}>
            DEMO MODE — use:<br />
            watcher@aegis.demo / aegis1234
          </div>
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="EMAIL ADDRESS"
          autoFocus
          style={{
            width: '100%', marginBottom: 10,
            background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)',
            borderRadius: 4, padding: '13px 16px',
            fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)',
            letterSpacing: 1, outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(217,45,45,0.3)')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="PASSWORD"
          style={{
            width: '100%',
            background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)',
            borderRadius: 4, padding: '13px 16px',
            fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)',
            letterSpacing: 3, outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(217,45,45,0.3)')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
        />

        {error && (
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--red)',
            marginTop: 12, letterSpacing: 1, lineHeight: 1.5,
          }}>{error}</div>
        )}
        {info && (
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--green)',
            marginTop: 12, letterSpacing: 1, lineHeight: 1.5,
          }}>{info}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', marginTop: 16, padding: '13px 0',
            background: loading ? 'rgba(217,45,45,0.1)' : 'rgba(217,45,45,0.1)',
            border: '1px solid rgba(217,45,45,0.2)',
            borderRadius: 4, fontFamily: 'var(--mono)', fontSize: 12,
            fontWeight: 700, color: 'var(--red)', letterSpacing: 3,
            transition: 'all 0.2s', opacity: loading ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              (e.currentTarget).style.background = 'rgba(217,45,45,0.18)';
              (e.currentTarget).style.boxShadow = '0 0 20px rgba(217,45,45,0.12)';
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget).style.background = 'rgba(217,45,45,0.1)';
            (e.currentTarget).style.boxShadow = 'none';
          }}
        >
          {loading ? 'AUTHENTICATING...' : mode === 'login' ? 'AUTHENTICATE' : 'CREATE ACCOUNT'}
        </button>

        <div style={{
          fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)',
          marginTop: 32, letterSpacing: 1,
        }}>
          ENCRYPTED CHANNEL · SUPABASE AUTH
        </div>
      </div>

      <style>{`
        @keyframes scanline {
          0%, 100% { transform: translateY(0); opacity: 0; }
          50% { transform: translateY(100vh); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        input::placeholder { color: rgba(0,0,0,0.22); letter-spacing: 2px; font-size: 10px; }
      `}</style>
    </div>
  );
}
