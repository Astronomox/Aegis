'use client';

import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import LandingMapPreview from '@/components/LandingMapPreview';
import { BellIcon, MicIcon, PinIcon, CheckCircleIcon } from '@/components/icons/Icons';

const ink = '#090909';
const paper = '#f3f1ec';
const muted = '#a3a29d';
const red = '#d94a42';
const line = '#2a2a2a';
const dots = 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1.2px)';

export default function LandingPage() {
  const router = useRouter();
  const login = () => router.push('/login');
  const primary: CSSProperties = { background: paper, color: '#111', border: `1px solid ${paper}`, borderRadius: 4, padding: '12px 18px', fontSize: 13, fontWeight: 750, cursor: 'pointer', textDecoration: 'none' };
  const eyebrow: CSSProperties = { display: 'flex', alignItems: 'center', gap: 9, color: '#bbb9b2', fontSize: 10, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase' };
  const steps = [
    ['01', 'Open before you board', 'Aegis looks inactive while quietly preparing your journey.'],
    ['02', 'Signal for help', 'Double-tap the screen or trigger an alert with a distress sound.'],
    ['03', 'Your watcher sees', 'Your location, a private audio clip and trigger type arrive immediately.'],
    ['04', 'They act quickly', 'They can open directions, coordinate help and resolve the alert.'],
  ];

  return <main style={{ minHeight: '100vh', overflowX: 'hidden', background: ink, color: paper, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
    <nav style={{ height: 74, padding: '0 clamp(22px, 5vw, 74px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${line}` }}>
      <img src="/aegis-logo.png" alt="Aegis" style={{ height: 19, filter: 'grayscale(1) brightness(3)' }} />
      <div className="aegis-nav" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <a href="#how" style={{ color: muted, fontWeight: 650, fontSize: 13, textDecoration: 'none' }}>How it works</a>
        <a href="#watchers" style={{ color: muted, fontWeight: 650, fontSize: 13, textDecoration: 'none' }}>For watchers</a>
        <button style={primary} onClick={login}>Get started</button>
      </div>
    </nav>

    <section style={{ minHeight: 610, padding: 'clamp(68px, 12vw, 150px) clamp(22px, 10vw, 150px)', position: 'relative', overflow: 'hidden', backgroundImage: dots, backgroundSize: '24px 24px' }}>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760 }}>
        <p style={eyebrow}><i style={{ width: 7, height: 7, borderRadius: '50%', background: red }} />Quiet protection for every journey</p>
        <h1 style={{ fontSize: 'clamp(47px, 7vw, 86px)', letterSpacing: '-.075em', lineHeight: .94, margin: '25px 0 23px' }}>Help is there.<br /><em style={{ color: '#777671', fontStyle: 'normal' }}>No one needs to know.</em></h1>
        <p style={{ maxWidth: 490, color: muted, lineHeight: 1.7, fontSize: 16 }}>Aegis is a discreet safety companion for interstate travel. A silent phone app for them, and clear information for the people watching over them.</p>
        <div style={{ display: 'flex', gap: 11, marginTop: 30, flexWrap: 'wrap' }}><a href="#how" style={primary}>See how it works</a><button onClick={login} style={{ background: 'transparent', color: paper, border: '1px solid #505050', borderRadius: 4, padding: '12px 18px', fontWeight: 750, fontSize: 13, cursor: 'pointer' }}>Watcher login</button></div>
      </div>
      <div className="aegis-phone" style={{ position: 'absolute', right: '12%', top: 120, width: 252, height: 342, padding: '30px 22px', border: '7px solid #343434', borderRadius: 33, background: '#030303', boxShadow: '0 25px 60px #000' }}>
        <small style={{ color: '#666', fontSize: 9, letterSpacing: '.14em' }}>AEGIS IS ACTIVE</small><b style={{ position: 'absolute', bottom: 31, left: 0, right: 0, textAlign: 'center', fontSize: 31, fontWeight: 400 }}>10:09</b><span style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', color: '#666', fontSize: 9 }}>Double tap for help</span>
      </div>
    </section>

    <div style={{ padding: 20, textAlign: 'center', borderBlock: `1px solid ${line}`, color: '#777671', textTransform: 'uppercase', fontSize: 10, letterSpacing: '.18em', fontWeight: 800 }}>Designed for a calm response when it matters most</div>
    <section id="how" style={{ padding: '100px clamp(22px, 10vw, 150px)', background: '#0d0d0d', backgroundImage: dots, backgroundSize: '24px 24px' }}>
      <p style={eyebrow}><i style={{ width: 7, height: 7, borderRadius: '50%', background: red }} />How it works</p><h2 style={{ fontSize: 'clamp(30px, 4vw, 49px)', letterSpacing: '-.06em', lineHeight: 1, margin: '12px 0 40px', maxWidth: 560 }}>Safety in two taps. Silence in between.</h2>
      <div className="aegis-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: `1px solid ${line}` }}>{steps.map(([number, title, copy]) => <article key={number} style={{ padding: '25px 22px 20px 0', borderRight: `1px solid ${line}`, marginRight: 22 }}><span style={{ color: red, fontSize: 11, fontWeight: 800, letterSpacing: '.13em' }}>{number}</span><h3 style={{ fontSize: 17, margin: '17px 0 10px' }}>{title}</h3><p style={{ color: muted, fontSize: 13, lineHeight: 1.65, margin: 0 }}>{copy}</p></article>)}</div>
    </section>

    <section id="watchers" style={{ padding: '100px clamp(22px, 10vw, 150px)' }}><div className="aegis-watcher" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 75, alignItems: 'center' }}>
      <LandingMapPreview />
      <div><p style={eyebrow}><i style={{ width: 7, height: 7, borderRadius: '50%', background: red }} />For watchers</p><h2 style={{ fontSize: 'clamp(30px, 4vw, 49px)', letterSpacing: '-.06em', lineHeight: 1, margin: '12px 0 25px', maxWidth: 560 }}>A calm view when things aren’t calm.</h2><p style={{ maxWidth: 490, color: muted, lineHeight: 1.7, fontSize: 16 }}>See the exact information you need without distraction: a live location, the latest signal, and direct actions to take next.</p><div style={{ display: 'grid', gap: 14, margin: '25px 0' }}><Feature Icon={BellIcon} text="Immediate location and alert status" /><Feature Icon={MicIcon} text="Private audio clips when an alert is triggered" /><Feature Icon={PinIcon} text="Directions when every minute matters" /><Feature Icon={CheckCircleIcon} text="Resolve an incident in one place" /></div><button style={primary} onClick={login}>Open watcher dashboard</button></div>
    </div></section>
  </main>;
}

function Feature({ Icon, text }: { Icon: typeof BellIcon; text: string }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 11, color: muted, fontSize: 13 }}><Icon size={16} color={red} />{text}</div>;
}
