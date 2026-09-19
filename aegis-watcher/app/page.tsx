'use client';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f4f5f7',
      color: 'var(--text)',
      fontFamily: 'var(--sans)',
      overflowX: 'hidden',
    }}>
      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px',
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <img src="/aegis-logo.png" alt="AEGIS" style={{ height: 20 }} />
        <button
          onClick={() => router.push('/login')}
          style={{
            fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
            color: 'var(--red)', letterSpacing: 1,
            background: 'var(--red-dim)', border: '1px solid rgba(217,45,45,0.2)',
            padding: '9px 18px', borderRadius: 6,
          }}
        >WATCHER LOGIN →</button>
      </nav>

      {/* HERO */}
      <section style={{
        padding: '80px 24px 60px', textAlign: 'center', maxWidth: 780, margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-block', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
          color: 'var(--red)', letterSpacing: 2, background: 'var(--red-dim)',
          padding: '5px 12px', borderRadius: 20, marginBottom: 20,
        }}>SILENT. ALWAYS LISTENING.</div>

        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 900, lineHeight: 1.1,
          letterSpacing: -1, marginBottom: 20,
        }}>
          When speaking is fatal,<br />silence saves lives.
        </h1>

        <p style={{
          fontSize: 17, color: 'var(--text-dim)', lineHeight: 1.6,
          maxWidth: 560, margin: '0 auto 36px',
        }}>
          Aegis is a two-sided safety system for interstate travel. A black-screen
          app that quietly detects distress on the passenger's phone, and a live
          command dashboard that lets a trusted watcher see and respond in real time.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#passenger" style={{
            fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
            color: '#fff', letterSpacing: 1,
            background: 'var(--text)', padding: '13px 24px', borderRadius: 6,
          }}>I'M A PASSENGER</a>
