'use client';

import { useEffect, useState } from 'react';
import AppTopBar from '@/components/AppTopBar';
import {
  detectAIAnomalies,
  aggregateSOSClusters,
  DANGEROUS_ROUTES_DATA,
  type AIAnomaly,
  type SOSCluster,
  type RouteSafetyAdvisory,
} from '@/lib/ai-safety';
import { MOCK_INCIDENTS, MOCK_TRIPS } from '@/lib/mock-data';
import type { Incident, Trip } from '@/types';
import { supabase, MOCK_MODE } from '@/lib/supabase';

export default function AISafetyPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [anomalies, setAnomalies] = useState<AIAnomaly[]>([]);
  const [clusters, setClusters] = useState<SOSCluster[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteSafetyAdvisory | null>(DANGEROUS_ROUTES_DATA[0]);
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    async function loadData() {
      let savedIncidents: Incident[] = [];
      let savedTrips: Trip[] = [];
      if (typeof window !== 'undefined') {
        try {
          const incStr = localStorage.getItem('aegis_incidents');
          const tripStr = localStorage.getItem('aegis_trips');
          if (incStr) savedIncidents = JSON.parse(incStr);
          if (tripStr) savedTrips = JSON.parse(tripStr);
        } catch (e) {
          console.error(e);
        }
      }

      const currentIncidents = savedIncidents.length > 0 ? savedIncidents : MOCK_INCIDENTS;
      const currentTrips = savedTrips.length > 0 ? savedTrips : MOCK_TRIPS;

      setIncidents(currentIncidents);
      setTrips(currentTrips);

      const detected = detectAIAnomalies(currentIncidents, currentTrips);
      const aggClusters = aggregateSOSClusters(currentIncidents);

      setAnomalies(detected);
      setClusters(aggClusters);
    }

    loadData();
  }, []);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      const detected = detectAIAnomalies(incidents, trips);
      const aggClusters = aggregateSOSClusters(incidents);
      setAnomalies(detected);
      setClusters(aggClusters);
      setScanning(false);
    }, 800);
  };

  const handleBroadcastWarning = (routeName: string) => {
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'SEVERE':
      case 'critical':
        return { bg: 'var(--color-danger-dim)', text: 'var(--color-danger)', border: 'var(--color-danger)' };
      case 'HIGH':
      case 'high':
        return { bg: 'var(--color-danger-dim)', text: 'var(--color-danger)', border: 'var(--color-danger)' };
      case 'MODERATE':
      case 'medium':
        return { bg: 'var(--color-warn-dim)', text: 'var(--color-warn)', border: 'var(--color-warn)' };
      default:
        return { bg: 'var(--color-safe-dim)', text: 'var(--color-safe)', border: 'var(--color-safe)' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-paper)', color: 'var(--color-ink)', fontFamily: 'var(--font-body)' }}>
      <AppTopBar variant="static" />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        {/* PAGE HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>🤖</span>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-ink)' }}>
                AI Safety & Dangerous Routes Intelligence
              </h1>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-muted)', marginTop: 4 }}>
              Automated spatial-temporal anomaly detection, SOS distress spatial clusters, and interstate route security advisories.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleScan}
              disabled={scanning}
              style={{
                padding: '8px 16px', background: 'var(--color-paper-raised)',
                border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: 'var(--color-ink)', cursor: 'pointer',
              }}
            >
              {scanning ? '⏳ Scanning Telemetry...' : '🔄 Run AI Scan'}
            </button>
          </div>
        </div>

        {/* BROADCAST ALERT NOTIFICATION BANNER */}
        {broadcastSent && (
          <div style={{
            background: 'var(--color-safe-dim)', border: '1px solid var(--color-safe)',
            color: 'var(--color-safe)', padding: 12, borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)', fontWeight: 700, fontFamily: 'var(--font-mono)',
            marginBottom: 20, textAlign: 'center',
          }}>
            📡 AI Route Advisory Broadcast Sent to All Monitored Passengers & Fleet Drivers!
          </div>
        )}

        {/* METRICS & OVERVIEW GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ background: 'var(--color-paper-raised)', border: '1px solid var(--color-rule)', padding: 16, borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>AI ANOMALIES DETECTED</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-danger)', marginTop: 4 }}>{anomalies.length}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)', marginTop: 4 }}>Real-time telemetry pattern flags</div>
          </div>

          <div style={{ background: 'var(--color-paper-raised)', border: '1px solid var(--color-rule)', padding: 16, borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>SOS DISTRESS CLUSTERS</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-accent)', marginTop: 4 }}>{clusters.length}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)', marginTop: 4 }}>Spatial distress hot-spots</div>
          </div>

          <div style={{ background: 'var(--color-paper-raised)', border: '1px solid var(--color-rule)', padding: 16, borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>HIGH RISK CORRIDORS</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-danger)', marginTop: 4 }}>
              {DANGEROUS_ROUTES_DATA.filter((r) => r.riskLevel === 'HIGH' || r.riskLevel === 'SEVERE').length}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)', marginTop: 4 }}>Monitored interstate highways</div>
          </div>

          <div style={{ background: 'var(--color-paper-raised)', border: '1px solid var(--color-rule)', padding: 16, borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>AI MONITORED TRIPS</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-safe)', marginTop: 4 }}>{trips.length}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)', marginTop: 4 }}>Active passenger journeys</div>
          </div>
        </div>

        {/* MAIN TWO-COLUMN SECTION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
          {/* LEFT: AI ANOMALY RADAR & SOS AGGREGATIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* ANOMALY RADAR */}
            <div style={{ background: 'var(--color-paper-raised)', border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-lg)', padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--color-rule)' }}>
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
                  📡 AI ANOMALY RADAR FEED
                </h2>
                <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-safe)' }}>LIVE SCANNING</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {anomalies.map((anom) => {
                  const styleColors = getRiskColor(anom.severity);
                  return (
                    <div
                      key={anom.id}
                      style={{
                        background: styleColors.bg, border: `1px solid ${styleColors.border}`,
                        borderRadius: 'var(--radius-md)', padding: 14,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: styleColors.text }}>
                          {anom.title.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(anom.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink)', margin: '4px 0' }}>
                        {anom.description}
                      </p>
                      <div style={{ marginTop: 8, background: 'var(--color-paper)', padding: 8, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-rule)' }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
                          💡 RECOMMENDED ACTION:
                        </span>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)', marginTop: 2 }}>
                          {anom.recommendedAction}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SOS CLUSTERS & AGGREGATIONS */}
            <div style={{ background: 'var(--color-paper-raised)', border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-lg)', padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--color-rule)' }}>
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
                  📍 SOS SPATIAL CLUSTER AGGREGATIONS
                </h2>
                <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-faint)' }}>HEATMAP DATA</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {clusters.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: 'var(--color-paper)', border: '1px solid var(--color-rule)',
                      borderRadius: 'var(--radius-md)', padding: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-ink)' }}>
                        {c.regionName}
                      </div>
                      <span style={{
                        fontSize: 'var(--text-xs)', fontWeight: 800, fontFamily: 'var(--font-mono)',
                        background: c.riskLevel === 'SEVERE' ? 'var(--color-danger-dim)' : 'var(--color-warn-dim)',
                        color: c.riskLevel === 'SEVERE' ? 'var(--color-danger)' : 'var(--color-warn)',
                        padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${c.riskLevel === 'SEVERE' ? 'var(--color-danger)' : 'var(--color-warn)'}`,
                      }}>
                        {c.riskLevel} SEVERITY
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-muted)' }}>
                      <span>🚨 {c.incidentCount} distress alerts</span>
                      <span>⚡ {c.dominantTrigger}</span>
                    </div>

                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)', marginTop: 6 }}>
                      {c.advisoryText}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: DANGEROUS ROUTES MATRIX & ADVISORY DETAILS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: 'var(--color-paper-raised)', border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-lg)', padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--color-rule)' }}>
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
                  🛣️ DANGEROUS HIGHWAY ROUTES ADVISORY
                </h2>
                <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-danger)' }}>SECURITY MATRIX</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {DANGEROUS_ROUTES_DATA.map((route) => {
                  const isSelected = selectedRoute?.id === route.id;
                  const colors = getRiskColor(route.riskLevel);
                  return (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRoute(route)}
                      style={{
                        background: isSelected ? 'var(--color-paper-hover)' : 'var(--color-paper)',
                        border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-rule)',
                        borderRadius: 'var(--radius-md)', padding: 14, cursor: 'pointer',
                        transition: 'all 120ms ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-ink)' }}>{route.routeName}</div>
                          <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-faint)' }}>Corridor: {route.corridorCode}</div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontSize: 'var(--text-xs)', fontWeight: 800, fontFamily: 'var(--font-mono)',
                            background: colors.bg, color: colors.text, padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${colors.border}`,
                          }}>
                            RISK {route.riskScore}% · {route.riskLevel}
                          </span>
                        </div>
                      </div>

                      <div style={{ marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)' }}>
                        🕒 Safe Window: <strong>{route.safeHoursWindow}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SELECTED ROUTE DETAILS & FLEET ACTION */}
            {selectedRoute && (
              <div style={{ background: 'var(--color-paper-raised)', border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-lg)', padding: 18 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', marginBottom: 4 }}>
                  DETAILED SECURITY DOSSIER: {selectedRoute.routeName.toUpperCase()}
                </div>

                <div style={{ background: 'var(--color-paper)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-rule)', margin: '10px 0' }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-danger)', marginBottom: 6 }}>
                    ⚠️ KNOWN THREAT FACTORS
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)' }}>
                    {selectedRoute.knownThreats.map((threat) => (
                      <li key={threat} style={{ marginBottom: 2 }}>{threat}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: 'var(--color-paper)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-rule)', marginBottom: 10 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-safe)', marginBottom: 4 }}>
                    📱 PASSENGER ADVISORY TIP
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)' }}>
                    {selectedRoute.passengerAdvice}
                  </div>
                </div>

                <div style={{ background: 'var(--color-paper)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-rule)', marginBottom: 14 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', marginBottom: 4 }}>
                    🛡️ FLEET MANAGER DIRECTIVE
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-muted)' }}>
                    {selectedRoute.fleetManagerAdvice}
                  </div>
                </div>

                <button
                  onClick={() => handleBroadcastWarning(selectedRoute.routeName)}
                  style={{
                    width: '100%', padding: '10px 0', background: 'var(--color-accent)',
                    color: 'var(--color-paper)', border: 'none', borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)', fontWeight: 800, fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                  }}
                >
                  📢 Broadcast AI Safety Advisory to Route Drivers & Passengers
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
