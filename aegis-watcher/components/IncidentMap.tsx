'use client';

import { useEffect, useRef } from 'react';
import type { Incident } from '@/types';

interface Props {
  incidents: Incident[];
  onMarkerClick?: (id: string) => void;
}

export default function IncidentMap({ incidents, onMarkerClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

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
      if (mapInstanceRef.current) return;
      const map = L.map(mapRef.current!, {
        center: [6.5244, 3.3792],
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
      });

      // Warm, clean light map
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 19 }
      ).addTo(map);

      mapInstanceRef.current = map;
      updateMarkers(L, map, incidents);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = (window as any)?.L;
    if (!L || !mapInstanceRef.current) return;
    updateMarkers(L, mapInstanceRef.current, incidents);
  }, [incidents]);

  function updateMarkers(L: any, map: any, data: Incident[]) {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    data.forEach((inc) => {
      const isActive = inc.status === 'active';
      const size = isActive ? 36 : 12;

      const icon = L.divIcon({
        className: '',
        html: isActive
          ? `<div style="position:relative;width:${size}px;height:${size}px;">
              <div style="position:absolute;inset:0;border-radius:50%;border:2px solid rgba(224,64,64,0.4);animation:radar 2s ease-out infinite;"></div>
              <div style="position:absolute;inset:0;border-radius:50%;border:1px solid rgba(224,64,64,0.2);animation:radar 2s ease-out infinite 0.6s;"></div>
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:12px;height:12px;border-radius:50%;background:#E04040;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(224,64,64,0.4);"></div>
            </div>`
          : `<div style="width:10px;height:10px;border-radius:50%;background:var(--blue);opacity:0.3;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.1);"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon }).addTo(map);
      if (onMarkerClick) marker.on('click', () => onMarkerClick(inc.id));

      marker.bindTooltip(
        `<div style="font-family:'Montserrat',sans-serif;font-size:12px;line-height:1.5;padding:2px 0;">
          <div style="font-weight:700;color:${isActive ? '#E04040' : '#888'};font-size:11px;margin-bottom:2px;">${isActive ? 'Active alert' : 'Resolved'}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#555;">${inc.latitude.toFixed(5)}, ${inc.longitude.toFixed(5)}</div>
          <div style="font-size:11px;color:#999;margin-top:2px;">${inc.trigger_type === 'audio' ? 'Sound detected' : 'Manual trigger'}</div>
        </div>`,
        {
          className: 'aegis-tooltip',
          direction: 'top',
          offset: [0, isActive ? -20 : -8],
        }
      );

      markersRef.current.push(marker);
    });

    const active = data.filter((i) => i.status === 'active');
    if (active.length > 0) {
      const bounds = L.latLngBounds(active.map((i: Incident) => [i.latitude, i.longitude]));
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 13 });
    }
  }

  return (
    <>
      <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
      <style>{`
        @keyframes radar {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        .aegis-tooltip {
          background: #fff !important;
          border: 1px solid rgba(15,33,103,0.1) !important;
          border-radius: 12px !important;
          padding: 10px 14px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important;
        }
        .aegis-tooltip::before, .leaflet-tooltip-top::before { display: none !important; }
      `}</style>
    </>
  );
}
