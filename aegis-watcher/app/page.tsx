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
          <a href="#watcher" style={{
            fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
            color: 'var(--text)', letterSpacing: 1,
            background: 'transparent', border: '1px solid rgba(0,0,0,0.15)',
            padding: '13px 24px', borderRadius: 6,
          }}>I'M A WATCHER</a>
        </div>
      </section>

      {/* PROBLEM STATEMENT */}
      <section style={{
        padding: '40px 24px', maxWidth: 720, margin: '0 auto', textAlign: 'center',
      }}>
        <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.7 }}>
          Interstate bus travel across Nigeria carries real risk, including armed
          robbery, kidnapping, and situations where a passenger cannot safely make
          a call or send a text without escalating danger. Aegis exists for exactly
          that moment: a way to signal for help without saying a word.
        </p>
      </section>

      {/* PASSENGER SECTION */}
      <section id="passenger" style={{
        padding: '70px 24px', background: '#fff',
        borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            display: 'inline-block', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
            color: 'var(--blue)', letterSpacing: 2, background: 'var(--blue-dim)',
            padding: '5px 12px', borderRadius: 20, marginBottom: 16,
          }}>FOR PASSENGERS</div>

          <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 16 }}>
            A phone screen that looks off. It isn't.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 40, maxWidth: 620 }}>
            Before you board, open Aegis and leave it running. The screen stays
            completely black. Nothing to explain, nothing to hide. It's quietly
            listening in the background the entire trip.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { step: '01', title: 'Open before you travel', desc: 'Set up your watcher contact once. Leave the app open and your phone unlocked in your pocket or bag.' },
              { step: '02', title: 'Two ways to trigger', desc: 'Double-tap the black screen manually, or let Aegis detect loud distress sounds automatically via the microphone.' },
              { step: '03', title: 'Silent alert sent', desc: 'Your live location and a short audio clip are sent instantly to your watcher, with no call and no visible action.' },
              { step: '04', title: 'Your watcher responds', desc: 'They see you on a live map immediately and can act: call for help, alert authorities, or reach out.' },
            ].map((item) => (
              <div key={item.step} style={{
                padding: 20, background: '#f9fafb', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10,
              }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--blue)', marginBottom: 8 }}>
                  {item.step}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 32, padding: '16px 20px', background: 'var(--red-dim)',
            border: '1px solid rgba(217,45,45,0.15)', borderRadius: 8,
          }}>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
              <strong>Important:</strong> Aegis currently works while the app is open
