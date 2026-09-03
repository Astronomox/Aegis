'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Incident } from '@/types';
import { supabase, MOCK_MODE } from '@/lib/supabase';
import { MOCK_INCIDENTS, MOCK_USERS } from '@/lib/mock-data';
import { useIsMobile } from '@/lib/useIsMobile';

const PAGE_SIZE = 10;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'NOW';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function HistoryPage() {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = Number(searchParams.get('page') || '1');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      if (MOCK_MODE) {
        const resolved = MOCK_INCIDENTS.filter((i) => i.status === 'resolved');
        setTotal(resolved.length);
        setIncidents(resolved.slice(from, to + 1));
        setLoading(false);
        return;
      }
      const { count } = await supabase!.from('incidents').select('*', { count: 'exact', head: true }).eq('status', 'resolved');
      setTotal(count || 0);
      const { data } = await supabase!.from('incidents').select('*').eq('status', 'resolved').order('created_at', { ascending: false }).range(from, to);
      if (data) setIncidents(data as Incident[]);
      setLoading(false);
    }
    load();
  }, [currentPage]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{
      height: '100vh',
      background: 'radial-gradient(ellipse at 50% 30%, #ffffff 0%, #f4f5f7 70%)',
      position: 'relative', overflow: 'auto',
    }}>
      {/* Grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
