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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 14 }}>
        Loading...
      </div>
    </>
  );

  if (!incident) return (
    <>
      <AppTopBar variant="static" />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 16 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Incident not found</p>
        <button onClick={() => router.push('/dashboard')} style={{
          fontSize: 13, fontWeight: 700, color: 'var(--blue)', background: 'var(--blue-dim)',
          padding: '10px 24px', borderRadius: 'var(--radius-pill)',
        }}>Back to dashboard</button>
      </div>
    </>
  );

  const isActive = incident.status === 'active';

  return (
    <>
      <AppTopBar variant="static" />
      <div style={{ minHeight: 'calc(100vh - 65px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <BackToDashboardLink />

        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: isActive ? 'var(--red)' : 'var(--green-dark)',
            }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: isActive ? 'var(--red)' : 'var(--green-dark)' }}>
              {isActive ? 'Active alert' : 'Resolved'}
            </span>
          </div>

          <div style={{ padding: 22 }}>
            {[
              ['Passenger', passengerName(incident.passenger_id)],
              ['Latitude', incident.latitude.toFixed(6)],
              ['Longitude', incident.longitude.toFixed(6)],
              ['Trigger', incident.trigger_type === 'audio' ? 'Sound detected' : 'Manual tap'],
              ['Time', new Date(incident.created_at).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: label === 'Passenger' || label === 'Trigger' ? 'var(--sans)' : 'var(--mono)', fontSize: 15, fontWeight: 600 }}>{value}</div>
              </div>
            ))}

            {incident.audio_url && !incident.audio_url.startsWith('mock://') && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Audio recording</div>
                <audio controls src={incident.audio_url} style={{ width: '100%' }} />
              </div>
            )}

            <a href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'block', textAlign: 'center', fontSize: 14, fontWeight: 700,
                color: 'var(--blue)', background: 'var(--blue-dim)',
                padding: '12px 0', borderRadius: 'var(--radius-sm)', marginBottom: 8,
              }}>Open in Google Maps</a>

            {isActive && (
              <button onClick={handleResolve} disabled={resolving} style={{
                width: '100%', fontSize: 14, fontWeight: 700,
                color: '#fff', background: 'var(--green-dark)',
                padding: '12px 0', borderRadius: 'var(--radius-sm)',
                opacity: resolving ? 0.6 : 1,
              }}>{resolving ? 'Resolving...' : 'Mark as resolved'}</button>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
