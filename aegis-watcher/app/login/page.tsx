'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PasscodeGate() {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!passcode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError('ACCESS DENIED');
        setPasscode('');
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflowY: 'auto',
      padding: '24px 0',
    }}>
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      {/* Scan line animation */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,59,59,0.3), transparent)',
        animation: 'scanline 4s ease-in-out infinite',
      }} />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 400,
        padding: '0 24px',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <img
          src="/aegis-logo.png"
          alt="AEGIS"
          style={{
            width: 220,
            height: 'auto',
            
            marginBottom: 4,
          }}
        />

        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          fontWeight: 500,
          color: 'var(--text-muted)',
          letterSpacing: 4,
          textTransform: 'uppercase',
          marginBottom: 48,
        }}>Watcher Command Interface</div>

        {/* Status indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 24,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--green)',
            boxShadow: '0 0 8px var(--green)',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--text-dim)',
            letterSpacing: 2,
          }}>SYSTEM ONLINE</span>
        </div>

        {/* Input */}
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="ENTER ACCESS CODE"
          autoFocus
          style={{
            width: '100%',
            background: 'rgba(0,0,0,0.03)',
            border: '1px solid var(--glass-border)',
            borderRadius: 4,
            padding: '14px 16px',
            fontFamily: 'var(--mono)',
            fontSize: 14,
            color: 'var(--text)',
            textAlign: 'center',
            letterSpacing: 6,
            outline: 'none',
            transition: 'border-color 0.3s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'rgba(255,59,59,0.3)'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
