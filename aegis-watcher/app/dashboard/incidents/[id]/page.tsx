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
