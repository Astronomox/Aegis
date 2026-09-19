'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Incident } from '@/types';
import { supabase, MOCK_MODE } from '@/lib/supabase';
import { MOCK_INCIDENTS, MOCK_USERS } from '@/lib/mock-data';

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [passengerName, setPassengerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    async function load() {
      if (MOCK_MODE) {
        const found = MOCK_INCIDENTS.find((i) => i.id === id) || null;
        setIncident(found);
        if (found) setPassengerName(MOCK_USERS[found.passenger_id] || found.passenger_id);
        setLoading(false);
        return;
      }
      const { data } = await supabase!.from('incidents').select('*').eq('id', id).single();
      if (data) {
        setIncident(data as Incident);
        const { data: user } = await supabase!.from('users').select('name').eq('id', data.passenger_id).single();
        if (user) setPassengerName(user.name);
      }
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

  const s: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 30%, #ffffff 0%, #f4f5f7 70%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
      overflowY: 'auto',
      padding: '24px 0',
    },
    grid: {
      position: 'absolute', inset: 0,
      backgroundImage: `linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)`,
      backgroundSize: '60px 60px',
    },
    card: {
      position: 'relative', width: '100%', maxWidth: 480, margin: '0 24px',
      background: 'var(--glass)', backdropFilter: 'var(--blur)',
      border: '1px solid var(--glass-border)', borderRadius: 10,
      overflow: 'hidden',
    },
    header: {
      padding: '16px 20px',
      borderBottom: '1px solid var(--glass-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    body: { padding: 20 },
    label: {
      fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)',
      letterSpacing: 1.5, marginBottom: 4,
    },
    value: {
      fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600,
      color: 'var(--text)', marginBottom: 16,
    },
    btn: {
      width: '100%', padding: '12px 0', borderRadius: 4,
      fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
      letterSpacing: 2, transition: 'all 0.2s', marginTop: 8,
    },
  };

  if (loading) return (
    <div style={{ ...s.page, color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 2 }}>
      LOADING INCIDENT DATA...
    </div>
  );

  if (!incident) return (
    <div style={{ ...s.page, flexDirection: 'column', gap: 16, color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: 11 }}>
      <span>INCIDENT NOT FOUND</span>
      <button onClick={() => router.push('/dashboard')} style={{ ...s.btn, width: 'auto', padding: '10px 24px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(255,59,59,0.2)' }}>
        RETURN TO DASHBOARD
      </button>
    </div>
  );

  const isActive = incident.status === 'active';

  return (
    <div style={s.page}>
      <div style={s.grid} />
      <div style={s.card}>
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isActive ? 'var(--red)' : 'var(--green)',
              boxShadow: isActive ? '0 0 8px var(--red)' : '0 0 8px var(--green)',
            }} />
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
              color: isActive ? 'var(--red)' : 'var(--green)', letterSpacing: 2,
            }}>
              {isActive ? 'ACTIVE EMERGENCY' : 'RESOLVED'}
            </span>
