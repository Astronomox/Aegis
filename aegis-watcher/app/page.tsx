'use client';

import { useRouter } from 'next/navigation';
import LandingMapPreview from '@/components/LandingMapPreview';
import { BellIcon, MicIcon, PinIcon, CheckCircleIcon } from '@/components/icons/Icons';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--blue)', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        background: 'rgba(15,33,103,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <img src="/aegis-logo.png" alt="Aegis" style={{ height: 20, filter: 'invert(1) brightness(2)' }} />
        <div className="landing-nav-links">
          <div className="landing-nav-text-links">
            <a href="#how" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>How it works</a>
            <a href="#watcher" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>For watchers</a>
          </div>
          <button onClick={() => router.push('/login')} style={{
            fontSize: 13, fontWeight: 700, color: 'var(--blue)', background: 'var(--green)',
            padding: '10px 22px', borderRadius: 'var(--radius-pill)', border: 'none', flexShrink: 0,
          }}>Get started</button>
        </div>
      </nav>

      {/* HERO - blue bleeds left to right into full photo */}
      <section style={{ position: 'relative', minHeight: 480, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1400&h=700&fit=crop)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, var(--blue) 0%, var(--blue) 35%, rgba(15,33,103,0.85) 50%, rgba(15,33,103,0.3) 70%, transparent 100%)',
        }} />

        <div className="landing-hero-content" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
            color: 'var(--green)', marginBottom: 24,
          }}>Silent protection for Nigerian roads</div>

          <h1 style={{
            fontFamily: 'var(--display)', fontSize: 'clamp(34px, 7vw, 62px)',
            fontWeight: 800, lineHeight: 1.06, marginBottom: 20,
          }}>
            <span style={{ color: '#fff' }}>Your silent</span><br />
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>shield on</span><br />
            <span style={{ color: '#fff' }}>every journey.</span>
          </h1>

          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 30, maxWidth: 420 }}>
            Track your loved ones on interstate trips. A black-screen app they carry,
            a live dashboard you watch. Peace of mind, no words needed.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#how" style={{
              fontSize: 14, fontWeight: 700, color: 'var(--blue)', background: 'var(--green)',
              padding: '14px 28px', borderRadius: 'var(--radius-pill)',
            }}>See how it works</a>
            <button onClick={() => router.push('/login')} style={{
              fontSize: 14, fontWeight: 700, color: '#fff', background: 'transparent',
              padding: '14px 28px', borderRadius: 'var(--radius-pill)',
              border: '2px solid rgba(255,255,255,0.2)',
            }}>Watcher login</button>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{
        padding: '20px 20px', textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
          Protecting passengers on Nigerian roads
        </p>
      </section>

      {/* HOW IT WORKS - white section */}
      <section id="how" className="landing-section" style={{ background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 2,
              color: 'var(--blue)', textTransform: 'uppercase', marginBottom: 14,
            }}>How it works</div>
            <h2 style={{
              fontFamily: 'var(--display)', fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, color: 'var(--blue)',
            }}>Safety in two taps, silence in between</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { img: 'https://images.unsplash.com/photo-1776521908392-a68ada9bb47c?w=400&h=280&fit=crop', n: '01', t: 'Open before you board', d: 'The traveler opens Aegis. Screen goes black. Nothing to explain, nothing to hide. It listens quietly the whole trip.' },
              { img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=280&fit=crop', n: '02', t: 'Two ways to call for help', d: 'Double-tap the black screen manually, or let Aegis detect loud distress sounds through the microphone automatically.' },
              { img: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=280&fit=crop&crop=face', n: '03', t: 'Your watcher sees everything', d: 'Location, audio clip, and trigger type show up instantly on the watcher\'s live map. No phone call needed.' },
              { img: 'https://images.unsplash.com/photo-1689803754699-945795f08976?w=400&h=280&fit=crop', n: '04', t: 'They act, you stay safe', d: 'The watcher opens your location in Google Maps, listens to the audio, alerts authorities, and marks it resolved.' },
            ].map((item) => (
              <div key={item.n} style={{
                background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}>
                <img src={item.img} alt={item.t} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '18px 20px' }}>
                  <div style={{
                    fontFamily: 'var(--display)', fontSize: 38, fontWeight: 800,
                    color: 'rgba(15,33,103,0.06)', lineHeight: 1, marginBottom: 6,
                  }}>{item.n}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>{item.t}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>{item.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PASSENGER SECTION - blue with bus photo bleed */}
      <section style={{ position: 'relative', minHeight: 420, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1400&h=600&fit=crop)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, var(--blue) 0%, var(--blue) 40%, rgba(15,33,103,0.7) 60%, rgba(15,33,103,0.2) 80%, transparent 100%)',
        }} />
        <div className="landing-section" style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ maxWidth: 480 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
              color: 'var(--green)', marginBottom: 16,
            }}>For passengers</div>
            <h2 style={{
              fontFamily: 'var(--display)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 800,
              color: '#fff', marginBottom: 16, lineHeight: 1.15,
            }}>A phone that looks off. It isn't.</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(255,255,255,0.55)', marginBottom: 26 }}>
              Before you board, open Aegis. The screen stays pitch black. No one
              around you would know it's running. But it's listening, it knows
              where you are, and it's ready to send help the moment you need it.
            </p>
            <div style={{
              padding: '14px 18px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
            }}>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.4)' }}>
                Currently works while the app is open with the screen on.
                Background triggering is on our roadmap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WATCHER SECTION - white, with real map preview */}
      <section id="watcher" className="landing-section" style={{ background: '#fff' }}>
        <div className="landing-split-grid" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <LandingMapPreview />

          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
              color: 'var(--blue)', marginBottom: 16,
            }}>For watchers</div>
            <h2 style={{
              fontFamily: 'var(--display)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 800,
              color: 'var(--blue)', marginBottom: 16, lineHeight: 1.15,
            }}>A live map. A real person watching.</h2>
            <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.75, marginBottom: 26 }}>
              You're the trusted contact. Aegis gives you a dashboard that
              turns silence into visibility the moment it matters.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 30 }}>
              {[
                { Icon: BellIcon, text: 'Instant alerts with sound and location' },
                { Icon: MicIcon, text: 'Listen to captured audio clips' },
                { Icon: PinIcon, text: 'Open exact coordinates in Google Maps' },
                { Icon: CheckCircleIcon, text: 'Track and resolve incidents' },
              ].map(({ Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'var(--blue-dim)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={17} color="var(--blue)" />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-dim)' }}>{text}</span>
                </div>
              ))}
            </div>

            <button onClick={() => router.push('/login')} style={{
              fontSize: 14, fontWeight: 700, color: '#fff', background: 'var(--blue)',
              padding: '14px 28px', borderRadius: 'var(--radius-pill)', border: 'none',
            }}>Open watcher dashboard</button>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="landing-section" style={{ background: 'var(--blue)', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 style={{
          fontFamily: 'var(--display)', fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800,
          color: '#fff', marginBottom: 12,
        }}>Start protecting your people today</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 26, maxWidth: 400, margin: '0 auto 26px' }}>
          It takes 30 seconds to set up. One app on their phone, one login for you.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/login')} style={{
            fontSize: 14, fontWeight: 700, color: 'var(--blue)', background: 'var(--green)',
            padding: '14px 32px', borderRadius: 'var(--radius-pill)', border: 'none',
          }}>Get started free</button>
          <a href="#how" style={{
            fontSize: 14, fontWeight: 700, color: '#fff',
            padding: '14px 32px', borderRadius: 'var(--radius-pill)',
            border: '2px solid rgba(255,255,255,0.15)',
          }}>Learn more</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '24px 20px', textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)', background: 'var(--blue)',
      }}>
        <img src="/aegis-logo.png" alt="Aegis" style={{ height: 13, marginBottom: 8, opacity: 0.3, filter: 'invert(1) brightness(2)' }} />
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Built for safer journeys</p>
      </footer>
    </div>
  );
}