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

      // Light, clean basemap to match the light-themed dashboard
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

      // Pulsing ring for active, static dot for resolved
      const size = isActive ? 40 : 14;
      const icon = L.divIcon({
        className: '',
        html: isActive
          ? `<div style="position:relative;width:${size}px;height:${size}px;">
              <div style="position:absolute;inset:0;border-radius:50%;border:2px solid rgba(255,59,59,0.6);animation:radar 2s ease-out infinite;"></div>
              <div style="position:absolute;inset:0;border-radius:50%;border:1px solid rgba(255,59,59,0.3);animation:radar 2s ease-out infinite 0.5s;"></div>
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:10px;height:10px;border-radius:50%;background:#ff3b3b;box-shadow:0 0 12px #ff3b3b,0 0 24px rgba(255,59,59,0.4);"></div>
            </div>`
          : `<div style="width:8px;height:8px;border-radius:50%;background:rgba(20,22,28,0.35);border:1px solid rgba(20,22,28,0.15);"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon }).addTo(map);
