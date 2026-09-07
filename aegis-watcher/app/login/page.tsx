'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');

    const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || (isSignUp ? 'Could not create account' : 'Invalid email or password'));
      }
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  // Two verified free photos, distinct per mode so login and signup feel
  // different, not just a copy-pasted screen.
  const image = isSignUp
    ? 'https://images.unsplash.com/photo-1776521908392-a68ada9bb47c?w=1200&h=1400&fit=crop'
    : 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=1200&h=1400&fit=crop&crop=face';

  const badge = isSignUp ? 'Welcome aboard' : 'Welcome back';
  const quote = isSignUp
    ? '"Silent protection starts here."'
    : '"When they\'re okay, you\'re okay."';

  const formPanel = (
    <div className="auth-form-panel">
      <div style={{ width: '100%', maxWidth: 380 }}>
        <img src="/aegis-logo.png" alt="Aegis" style={{ height: 22, marginBottom: 40 }} />

        <h1 style={{
          fontFamily: 'var(--display)', fontSize: 'clamp(32px, 5vw, 42px)',
          fontWeight: 800, color: 'var(--blue)', marginBottom: 10, lineHeight: 1.1,
        }}>
          {isSignUp ? 'Join Aegis' : 'Welcome back'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 32 }}>
          {isSignUp
            ? 'Create your watcher account and start looking out for the people who matter.'
            : 'Sign in to your watcher dashboard.'}
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoFocus
            style={{
              width: '100%', padding: '13px 16px', fontSize: 14,
              background: 'var(--bg)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)', outline: 'none',
              color: 'var(--text)', transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--blue)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        <div style={{ marginBottom: isSignUp ? 8 : 12 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="********"
            style={{
              width: '100%', padding: '13px 16px', fontSize: 14,
              background: 'var(--bg)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)', outline: 'none',
              color: 'var(--text)', transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--blue)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {!isSignUp && (
          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <button style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>
              Forgot password?
            </button>
          </div>
        )}

        {isSignUp && <div style={{ marginBottom: 24 }} />}

        {error && (
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)', marginBottom: 16 }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '15px 0', fontSize: 15, fontWeight: 700,
            color: '#fff', background: 'var(--blue)',
            borderRadius: 'var(--radius-pill)', border: 'none',
            opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s',
          }}
        >
          {loading
            ? (isSignUp ? 'Creating account...' : 'Signing in...')
            : (isSignUp ? 'Create account' : 'Sign in')}
        </button>

        <p style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', marginTop: 24 }}>
          {isSignUp ? 'Already have an account? ' : 'Do not have an account? '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 700, fontSize: 13 }}
          >{isSignUp ? 'Sign in' : 'Sign up'}</button>
        </p>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>
          Demo mode: use watcher@aegis.demo / aegis1234
        </p>
      </div>
    </div>
  );

  const imagePanel = (
    <div className="auth-image-panel" style={{
      backgroundImage: `url(${image})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(15,33,103,0.15) 0%, rgba(15,33,103,0.55) 100%)',
      }} />
      {/* Vignette mesh: a darkened radial patch behind the cursive heading so
          it reads clearly regardless of what's underneath in the photo. */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '55%',
        background: 'radial-gradient(ellipse 90% 100% at 15% 0%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, transparent 75%)',
      }} />
      <div style={{
        position: 'absolute', top: 36, left: 44, right: 24,
      }}>
        <span style={{
          fontFamily: "'Dancing Script', cursive",
          fontSize: 'clamp(40px, 6vw, 58px)',
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1.1,
          textShadow: '0 2px 12px rgba(0,0,0,0.35)',
          display: 'inline-block',
        }}>{badge}</span>
      </div>
      <div style={{
        position: 'absolute', bottom: 32, left: 32, right: 32,
      }}>
        <p style={{
          fontFamily: 'var(--display)', fontSize: 20, fontWeight: 700,
          color: '#fff', fontStyle: 'italic', lineHeight: 1.4,
        }}>{quote}</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap' }}>
      {isSignUp ? (
        <>
          {imagePanel}
          {formPanel}
        </>
      ) : (
        <>
          {formPanel}
          {imagePanel}
        </>
      )}
    </div>
  );
}
