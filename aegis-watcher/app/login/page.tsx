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
