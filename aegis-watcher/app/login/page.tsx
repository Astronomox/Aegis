'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const ink = '#090909';
const paper = '#f3f1ec';
const muted = '#a3a29d';
const red = '#d94a42';
const line = '#2a2a2a';
const dots = 'radial-gradient(circle, rgba(255,255,255,0.14) 1px, transparent 1.2px)';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true); setError('');
    try {
      const response = await fetch(isSignUp ? '/api/auth/signup' : '/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      if (response.ok) router.push('/dashboard');
      else { const data = await response.json().catch(() => ({})); setError(data.error || (isSignUp ? 'Could not create account' : 'Invalid email or password')); }
    } catch { setError('Connection failed. Please try again.'); }
    finally { setLoading(false); }
  }

  const input: CSSProperties = { width: '100%', background: '#111', color: paper, border: `1px solid ${line}`, borderRadius: 4, padding: '14px 15px', outline: 'none', fontSize: 14 };
  const label: CSSProperties = { display: 'block', color: '#c5c3bd', fontSize: 11, fontWeight: 750, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 };

  return <main style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(310px, 1.05fr) minmax(390px, .95fr)', background: ink, color: paper, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
    <section className="aegis-auth-aside" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', padding: 'clamp(28px, 6vw, 72px)', backgroundImage: dots, backgroundSize: '24px 24px', borderRight: `1px solid ${line}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <img src="/aegis-logo.png" alt="Aegis" style={{ height: 20, width: 'fit-content', filter: 'grayscale(1) brightness(3)' }} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 500 }}>
        <p style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 10, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: '#bbb9b2' }}><i style={{ width: 7, height: 7, borderRadius: '50%', background: red }} />Watcher access</p>
        <h1 style={{ fontSize: 'clamp(40px, 5vw, 66px)', letterSpacing: '-.07em', lineHeight: .94, margin: '25px 0 22px' }}>Stay close<br /><span style={{ color: '#777671' }}>from afar.</span></h1>
        <p style={{ color: muted, maxWidth: 390, fontSize: 15, lineHeight: 1.75 }}>Your dashboard turns a quiet signal into the information you need to respond with care and clarity.</p>
      </div>
      <div style={{ position: 'relative', zIndex: 1, borderTop: `1px solid ${line}`, paddingTop: 18, color: '#85837d', fontSize: 12, lineHeight: 1.55 }}><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#aebda1', marginRight: 7 }} />Aegis systems are operational<br /><span style={{ marginLeft: 14 }}>Private. Discreet. Always on your side.</span></div>
    </section>

    <section style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '48px 28px', background: '#0d0d0d' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <button onClick={() => router.push('/')} style={{ background: 'transparent', border: 0, padding: 0, color: '#98968f', fontSize: 13, cursor: 'pointer', marginBottom: 54 }}>← Back to Aegis</button>
        <p style={{ color: '#a7a59f', fontSize: 10, fontWeight: 800, letterSpacing: '.17em', textTransform: 'uppercase', marginBottom: 15 }}>{isSignUp ? 'Create watcher account' : 'Secure watcher sign in'}</p>
        <h2 style={{ fontSize: 34, letterSpacing: '-.055em', margin: '0 0 10px' }}>{isSignUp ? 'Create your access.' : 'Welcome back.'}</h2>
        <p style={{ color: muted, lineHeight: 1.6, fontSize: 14, margin: '0 0 32px' }}>{isSignUp ? 'Set up your account and start looking out for the people who matter.' : 'Sign in to open your watcher dashboard.'}</p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}><label htmlFor="email" style={label}>Email address</label><input id="email" type="email" autoComplete="email" autoFocus value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={input} onFocus={e => e.currentTarget.style.borderColor = '#76736b'} onBlur={e => e.currentTarget.style.borderColor = line} /></div>
          <div style={{ marginBottom: 13 }}><label htmlFor="password" style={label}>Password</label><input id="password" type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={input} onFocus={e => e.currentTarget.style.borderColor = '#76736b'} onBlur={e => e.currentTarget.style.borderColor = line} /></div>
          {!isSignUp && <div style={{ textAlign: 'right', marginBottom: 26 }}><button type="button" style={{ border: 0, padding: 0, background: 'transparent', color: '#bdbab2', fontSize: 12, cursor: 'pointer' }}>Forgot password?</button></div>}
          {isSignUp && <div style={{ height: 26 }} />}
          {error && <p role="alert" style={{ margin: '0 0 15px', padding: '10px 12px', background: '#281312', border: '1px solid #65302c', borderRadius: 4, color: '#f47d75', fontSize: 12 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', border: 0, borderRadius: 4, background: paper, color: '#111', fontSize: 14, fontWeight: 800, cursor: loading ? 'wait' : 'pointer', opacity: loading ? .6 : 1 }}>{loading ? (isSignUp ? 'Creating account…' : 'Signing in…') : (isSignUp ? 'Create account' : 'Sign in')}</button>
        </form>
        <p style={{ color: muted, fontSize: 13, textAlign: 'center', marginTop: 26 }}>{isSignUp ? 'Already have an account? ' : 'New to Aegis? '}<button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} style={{ border: 0, background: 'transparent', padding: 0, color: paper, fontWeight: 750, cursor: 'pointer', fontSize: 13 }}>{isSignUp ? 'Sign in' : 'Create an account'}</button></p>
        <p style={{ color: '#66645f', fontSize: 11, textAlign: 'center', marginTop: 22 }}>Demo: watcher@aegis.demo / aegis1234</p>
      </div>
    </section>
  </main>;
}
