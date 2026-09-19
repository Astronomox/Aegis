'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Incident } from '@/types';
import { supabase, MOCK_MODE } from '@/lib/supabase';
import { MOCK_INCIDENTS } from '@/lib/mock-data';
import { usePassengerNames } from '@/lib/usePassengerNames';
import AppTopBar, { BackToDashboardLink } from '@/components/AppTopBar';

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const passengerName = usePassengerNames();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    async function load() {
      if (MOCK_MODE) {
        setIncident(MOCK_INCIDENTS.find((i) => i.id === id) || null);
        setLoading(false);
        return;
      }
      const { data } = await supabase!.from('incidents').select('*').eq('id', id).single();
      if (data) setIncident(data as Incident);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleResolve = async () => {
    if (!incident) return;
    setResolving(true);
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 400));
      setIncident({ ...incident, status: 'resolved' });
    } else {
      await supabase!.from('incidents').update({ status: 'resolved' }).eq('id', incident.id);
      setIncident({ ...incident, status: 'resolved' });
    }
    setResolving(false);
  };

  if (loading) return (
    <>
      <AppTopBar variant="static" />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-paper)', color: 'var(--color-ink-faint)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>
        Loading...
      </div>
    </>
  );

  if (!incident) return (
    <>
      <AppTopBar variant="static" />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-paper)', gap: 14 }}>
        <p style={{ color: 'var(--color-ink-faint)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>Incident not found</p>
        <button onClick={() => router.push('/dashboard')} style={{
          fontSize: 'var(--text-sm)', fontWeight: 600, fontFamily: 'var(--font-mono)',
          color: 'var(--color-accent)', background: 'var(--color-accent-dim)',
          border: '1px solid var(--color-accent-dim)',
          padding: '8px 20px', borderRadius: 'var(--radius-sm)',
        }}>Back to dashboard</button>
      </div>
    </>
  );

  const isActive = incident.status === 'active';

  return (
    <>
      <AppTopBar variant="static" />
      <div style={{ minHeight: 'calc(100vh - 52px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-paper)', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          <BackToDashboardLink />

          <div style={{
            background: 'var(--color-paper-raised)', border: '1px solid var(--color-rule)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid var(--color-rule)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isActive ? 'var(--color-danger)' : 'var(--color-safe)',
              }} />
              <span style={{
                fontSize: 'var(--text-base)', fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                color: isActive ? 'var(--color-danger)' : 'var(--color-safe)',
              }}>
                {isActive ? 'ACTIVE' : 'RESOLVED'}
              </span>
            </div>

            <div style={{ padding: 18 }}>
              {[
                ['PASSENGER', passengerName(incident.passenger_id)],
                ['LATITUDE', incident.latitude.toFixed(6)],
                ['LONGITUDE', incident.longitude.toFixed(6)],
                ['TRIGGER', incident.trigger_type === 'audio' ? 'SOUND' : 'TAP'],
                ['TIME', new Date(incident.created_at).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-faint)', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
                  <div style={{
                    fontFamily: label === 'PASSENGER' || label === 'TRIGGER' ? 'var(--font-body)' : 'var(--font-mono)',
                    fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-ink)',
                  }}>{value}</div>
                </div>
              ))}

              {incident.audio_url && !incident.audio_url.startsWith('mock://') && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-faint)', letterSpacing: '0.05em', marginBottom: 5 }}>AUDIO</div>
                  <audio controls src={incident.audio_url} style={{ width: '100%' }} />
                </div>
              )}

              <a href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'block', textAlign: 'center', fontSize: 'var(--text-sm)', fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-paper)', background: 'var(--color-accent)',
                  padding: '10px 0', borderRadius: 'var(--radius-sm)', marginBottom: 8,
                  textDecoration: 'none',
                }}>Open in Maps</a>

              {isActive && (
                <button onClick={handleResolve} disabled={resolving} style={{
                  width: '100%', fontSize: 'var(--text-sm)', fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-paper)', background: 'var(--color-safe)',
                  padding: '10px 0', borderRadius: 'var(--radius-sm)',
                  opacity: resolving ? 0.5 : 1,
                  cursor: resolving ? 'not-allowed' : 'pointer',
                  transition: 'opacity 120ms ease',
                }}>{resolving ? 'Resolving...' : 'Mark resolved'}</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
