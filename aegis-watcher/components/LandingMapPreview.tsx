'use client';

import { useEffect, useRef, useState } from 'react';

// Demo points scattered around Lagos for the landing page preview.
// Each cycles through: red (active alert) -> green (resolved) -> fades -> repeats.
const DEMO_POINTS = [
  { lat: 6.5355, lng: 3.3087, delay: 0 },
  { lat: 6.4698, lng: 3.4297, delay: 1200 },
  { lat: 6.6018, lng: 3.3515, delay: 2400 },
  { lat: 6.5000, lng: 3.3750, delay: 3600 },
  { lat: 6.4400, lng: 3.4100, delay: 600 },
];

export default function LandingMapPreview() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const loadLeaflet = (): Promise<any> => {
      if ((window as any).L) return Promise.resolve((window as any).L);
      return new Promise((resolve) => {
        if (document.getElementById('leaflet-js')) {
          const check = setInterval(() => {
            if ((window as any).L) { clearInterval(check); resolve((window as any).L); }
          }, 50);
          return;
        }
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve((window as any).L);
        document.head.appendChild(script);
      });
    };

    loadLeaflet().then((L) => {
      if (mapInstanceRef.current || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [6.5244, 3.3792], // Lagos
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '',
      }).addTo(map);


      mapInstanceRef.current = map;
      setReady(true);

      DEMO_POINTS.forEach((point) => {
        const icon = L.divIcon({
          className: '',
          html: `
            <div class="landing-map-dot" style="animation-delay:${point.delay}ms">
              <div class="landing-map-ring landing-map-ring-red" style="animation-delay:${point.delay}ms"></div>
              <div class="landing-map-ring landing-map-ring-green" style="animation-delay:${point.delay}ms"></div>
              <div class="landing-map-core" style="animation-delay:${point.delay}ms"></div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        const marker = L.marker([point.lat, point.lng], { icon }).addTo(map);
        markersRef.current.push(marker);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="landing-map-shell">
      <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />

      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--color-paper-overlay)', fontSize: 12, color: 'var(--color-ink-faint)',
        }}>Loading map...</div>
      )}

      <div style={{
        position: 'absolute', bottom: 16, left: 16, zIndex: 500,
        background: 'var(--color-paper-raised)', borderRadius: 10, padding: '8px 14px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-safe)', animation: 'landingPulse 1.5s infinite' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ink)' }}>Live monitoring active</span>
      </div>

      <div style={{
        position: 'absolute', top: 16, right: 16, zIndex: 500,
        fontSize: 10, fontWeight: 600, color: 'var(--color-ink-faint)', letterSpacing: 1,
        background: 'var(--color-paper-raised)', opacity: 0.85, padding: '4px 10px', borderRadius: 6,
      }}>LAGOS, NIGERIA</div>

      <style>{`
        @keyframes landingPulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }

        .landing-map-dot { position: relative; width: 20px; height: 20px; }

        .landing-map-ring {
          position: absolute; inset: 0; border-radius: 50%;
          animation-duration: 4s;
          animation-timing-function: ease-out;
          animation-iteration-count: infinite;
          opacity: 0;
        }
        .landing-map-ring-red {
          border: 2px solid oklch(58% 0.22 25);
          animation-name: ringRed;
        }
        .landing-map-ring-green {
          border: 2px solid oklch(62% 0.17 155);
          animation-name: ringGreen;
        }
        @keyframes ringRed {
          0% { transform: scale(0.6); opacity: 0.7; }
          25% { transform: scale(2.2); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes ringGreen {
          0%, 45% { transform: scale(0.6); opacity: 0; }
          55% { transform: scale(0.6); opacity: 0.7; }
          80% { transform: scale(2.2); opacity: 0; }
          100% { opacity: 0; }
        }
        .landing-map-core {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          width: 10px; height: 10px; border-radius: 50%;
          border: 2px solid oklch(100% 0 0);
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          animation-name: coreColor;
          animation-duration: 4s;
          animation-iteration-count: infinite;
        }
        @keyframes coreColor {
          0%, 45% { background: oklch(58% 0.22 25); }
          55%, 100% { background: oklch(62% 0.17 155); }
        }
      `}</style>
    </div>
  );
}
