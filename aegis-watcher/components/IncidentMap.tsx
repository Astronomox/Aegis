'use client';

import { useEffect, useRef } from 'react';
import type { Incident, Trip } from '@/types';

interface Props {
  incidents: Incident[];
  trips?: Trip[];
  onMarkerClick?: (id: string, type: 'incident' | 'trip') => void;
}

export default function IncidentMap({ incidents, trips = [], onMarkerClick }: Props) {
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
        center: [7.8, 6.0], // Centered over Nigeria interstate highway grid
        zoom: 7,
        zoomControl: false,
        attributionControl: false,
      });

      // Watermark-free OpenStreetMap tile layer
      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19, attribution: '' }
      ).addTo(map);

      mapInstanceRef.current = map;
      updateMarkers(L, map, incidents, trips);
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
    updateMarkers(L, mapInstanceRef.current, incidents, trips);
  }, [incidents, trips]);

  function updateMarkers(L: any, map: any, incidentList: Incident[], tripList: Trip[]) {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 1. Draw SOS / Incidents (Red Markers)
    incidentList.forEach((inc) => {
      const isActive = inc.status === 'active';
      const size = isActive ? 36 : 14;

      const icon = L.divIcon({
        className: '',
        html: isActive
          ? `<div style="position:relative;width:${size}px;height:${size}px;">
              <div style="position:absolute;inset:0;border-radius:50%;border:2px solid rgba(201,48,44,0.6);animation:radar 2s ease-out infinite;"></div>
              <div style="position:absolute;inset:0;border-radius:50%;border:1px solid rgba(201,48,44,0.3);animation:radar 2s ease-out infinite 0.6s;"></div>
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#c9302c;border:2.5px solid #ffffff;box-shadow:0 2px 10px rgba(201,48,44,0.5);"></div>
            </div>`
          : `<div style="width:10px;height:10px;border-radius:50%;background:#9e9890;opacity:0.4;border:2px solid #ffffff;"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon }).addTo(map);
      if (onMarkerClick) marker.on('click', () => onMarkerClick(inc.id, 'incident'));

      marker.bindTooltip(
        `<div style="font-family:'Geist Sans',-apple-system,sans-serif;font-size:12px;line-height:1.5;padding:2px 0;">
          <div style="font-weight:800;color:${isActive ? '#c9302c' : '#9e9890'};font-size:11px;margin-bottom:2px;">
            🚨 ${isActive ? 'SOS DISTRESS SIGNAL' : 'Resolved Alert'}
          </div>
          <div style="font-size:12px;font-weight:700;color:#2c2924;">Passenger ID: ${inc.passenger_id}</div>
          <div style="font-family:monospace;font-size:11px;color:#6b6560;margin-top:2px;">GPS: ${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}</div>
        </div>`,
        { className: 'aegis-tooltip', direction: 'top', offset: [0, isActive ? -20 : -8] }
      );

      markersRef.current.push(marker);
    });

    // 2. Draw Active Trips (Green Vehicle Dots/Icons on Highways)
    tripList.forEach((trip) => {
      const isActive = trip.status === 'active';
      const isAlert = trip.status === 'alert';
      const color = isAlert ? '#c9302c' : isActive ? '#3da35a' : '#9e9890';
      const size = 32;

      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:${color};border-radius:50%;border:3px solid #ffffff;box-shadow:0 3px 12px rgba(0,0,0,0.25);">
                <span style="color:#ffffff;font-size:14px;">🚌</span>
              </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([trip.latitude, trip.longitude], { icon }).addTo(map);
      if (onMarkerClick) marker.on('click', () => onMarkerClick(trip.id, 'trip'));

      marker.bindTooltip(
        `<div style="font-family:'Geist Sans',-apple-system,sans-serif;font-size:12px;line-height:1.5;padding:2px 0;">
          <div style="font-weight:800;color:${color};font-size:11px;margin-bottom:2px;">
            ${isAlert ? '⚠️ MISSED CHECKOUT' : isActive ? '🟢 ACTIVE BUS TRIP' : '✓ ARRIVED SAFELY'}
          </div>
          <div style="font-size:13px;font-weight:700;color:#2c2924;">${trip.passenger_name}</div>
          <div style="font-size:11px;color:#6b6560;margin-top:2px;">Route: ${trip.bus_route}</div>
          <div style="font-size:10px;color:#9e9890;">Bus: ${trip.vehicle_id || 'N/A'}</div>
        </div>`,
        { className: 'aegis-tooltip', direction: 'top', offset: [0, -18] }
      );

      markersRef.current.push(marker);
    });

    // Fit bounds if elements exist
    const allCoords: [number, number][] = [
      ...incidentList.filter((i) => i.status === 'active').map((i) => [i.latitude, i.longitude] as [number, number]),
      ...tripList.filter((t) => t.status === 'active' || t.status === 'alert').map((t) => [t.latitude, t.longitude] as [number, number]),
    ];

    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 10 });
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
          background: #ffffff !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
          border-radius: 12px !important;
          padding: 10px 14px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important;
        }
        .aegis-tooltip::before, .leaflet-tooltip-top::before { display: none !important; }
        .leaflet-control-attribution, .leaflet-control-container .leaflet-bottom { display: none !important; }
      `}</style>
    </>
  );
}
