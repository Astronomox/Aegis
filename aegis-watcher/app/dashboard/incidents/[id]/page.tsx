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
        setIncident(MOCK_INCIDENTS.find((item) => item.id === id) || null);
        setLoading(false);
        return;
      }

      const { data } = await supabase!
        .from('incidents')
        .select('*')
        .eq('id', id)
        .single();

      if (data) setIncident(data as Incident);
      setLoading(false);
    }

    load();
  }, [id]);

  const handleResolve = async () => {
    if (!incident) return;

    setResolving(true);

    if (MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    } else {
      await supabase!
        .from('incidents')
        .update({ status: 'resolved' })
        .eq('id', incident.id);
    }

    setIncident({ ...incident, status: 'resolved' });
    setResolving(false);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#080909',
          color: '#aaa39a',
        }}
      >
        <AppTopBar variant="static" />

        <div
          style={{
            minHeight: 'calc(100vh - 65px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--mono)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.5,
          }}
        >
          LOADING INCIDENT...
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#080909',
          color: '#f5f2eb',
        }}
      >
        <AppTopBar variant="static" />

        <div
          style={{
            minHeight: 'calc(100vh - 65px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <div style={{ color: '#ec524b', fontSize: 34 }}>×</div>

          <p style={{ margin: 0, color: '#aaa39a', fontSize: 14 }}>
            Incident record not found
          </p>

          <button
            onClick={() => router.push('/dashboard')}
            style={{
              border: 'none',
              padding: '12px 18px',
              background: '#f3efe7',
              color: '#111',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            RETURN TO DASHBOARD →
          </button>
        </div>
      </div>
    );
  }

  const isActive = incident.status === 'active';
  const statusColor = isActive ? '#ec524b' : '#62bd93';

  const details: Array<{
    label: string;
    value: string;
    mono: boolean;
  }> = [
    {
      label: 'Passenger',
      value: passengerName(incident.passenger_id),
      mono: false,
    },
    {
      label: 'Trigger',
      value: incident.trigger_type === 'audio' ? 'Sound detected' : 'Manual help tap',
      mono: false,
    },
    {
      label: 'Event time',
      value: new Date(incident.created_at).toLocaleString(),
      mono: false,
    },
    {
      label: 'Latitude',
      value: incident.latitude.toFixed(6),
      mono: true,
    },
    {
      label: 'Longitude',
      value: incident.longitude.toFixed(6),
      mono: true,
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        color: '#f5f2eb',
        backgroundColor: '#080909',
        backgroundImage:
          'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1.5px)',
        backgroundSize: '36px 36px',
      }}
    >
      <AppTopBar variant="static" />

      <main
        style={{
          width: '100%',
          maxWidth: 1040,
          margin: '0 auto',
          padding: '42px 24px 72px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            marginBottom: 38,
            filter: 'grayscale(1) brightness(2)',
            opacity: 0.8,
          }}
        >
          <BackToDashboardLink />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: statusColor,
            fontFamily: 'var(--mono)',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.5,
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 10px ${statusColor}`,
            }}
          />

          {isActive ? 'ACTIVE SAFETY ALERT' : 'RESOLVED SAFETY EVENT'}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
            margin: '26px 0 48px',
          }}
        >
          <div>
            <p
              style={{
                margin: '0 0 15px',
                color: '#9d9589',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 1.2,
              }}
            >
              INCIDENT RECORD / {incident.id.slice(0, 8).toUpperCase()}
            </p>

            <h1
              style={{
                margin: 0,
                color: '#f5f2eb',
                fontSize: 'clamp(50px, 7vw, 88px)',
                fontWeight: 900,
                letterSpacing: '-0.075em',
                lineHeight: 0.86,
              }}
            >
              {isActive ? 'Help is' : 'Event'}
              <br />
              <span style={{ color: '#898783' }}>
                {isActive ? 'needed.' : 'resolved.'}
              </span>
            </h1>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 5,
              color: '#b1aaa0',
              fontFamily: 'var(--mono)',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1,
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: statusColor,
              }}
            />

            {isActive ? 'ACTION REQUIRED' : 'CLOSED'}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(290px, 0.8fr)',
            border: '1px solid #393834',
            background: '#0b0c0c',
          }}
        >
          <section
            style={{
              padding: 30,
              borderRight: '1px solid #393834',
            }}
          >
            <div
              style={{
                paddingBottom: 16,
                borderBottom: '1px solid #393834',
                color: '#aaa296',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 1.4,
              }}
            >
              EVENT DETAILS
            </div>

            {details.map((detail) => (
              <div
                key={detail.label}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 24,
                  padding: '18px 0',
                  borderBottom: '1px solid #302f2c',
                }}
              >
                <span
                  style={{
                    color: '#817c74',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1,
                  }}
                >
                  {detail.label.toUpperCase()}
                </span>

                <strong
                  style={{
                    color: '#e8e3da',
                    fontFamily: detail.mono ? 'var(--mono)' : 'var(--sans)',
                    fontSize: 13,
                    fontWeight: 700,
                    textAlign: 'right',
                  }}
                >
                  {detail.value}
                </strong>
              </div>
            ))}

            {incident.audio_url && !incident.audio_url.startsWith('mock://') && (
              <div style={{ marginTop: 25 }}>
                <div
                  style={{
                    marginBottom: 10,
                    color: '#aaa296',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.2,
                  }}
                >
                  AUDIO RECORDING
                </div>

                <audio controls src={incident.audio_url} style={{ width: '100%' }} />
              </div>
            )}
          </section>

          <aside
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: 30,
              background: '#111212',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 13,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 42,
                  height: 42,
                  border: '1px solid #806c4c',
                  borderRadius: '50%',
                  color: '#e9b779',
                  fontSize: 23,
                }}
              >
                ⌖
              </div>

              <span
                style={{
                  color: '#c1b6a5',
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 1.1,
                  lineHeight: 1.55,
                }}
              >
                LAST KNOWN
                <br />
                LOCATION
              </span>
            </div>

            <p
              style={{
                margin: '31px 0',
                color: '#aaa39a',
                fontSize: 13,
                lineHeight: 1.65,
              }}
            >
              Open this incident’s coordinates in Maps for directions and local context.
            </p>

            <a
              href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 15px',
                border: '1px solid #d7a967',
                color: '#e9b779',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.6,
                textDecoration: 'none',
              }}
            >
              OPEN IN GOOGLE MAPS
              <span style={{ fontSize: 17 }}>↗</span>
            </a>

            {isActive ? (
              <button
                onClick={handleResolve}
                disabled={resolving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 10,
                  border: 'none',
                  padding: '14px 15px',
                  background: '#8fcbab',
                  color: '#101311',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.6,
                  cursor: resolving ? 'not-allowed' : 'pointer',
                  opacity: resolving ? 0.6 : 1,
                }}
              >
                {resolving ? 'RESOLVING EVENT...' : 'MARK AS RESOLVED'}
                <span style={{ fontSize: 16 }}>✓</span>
              </button>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 18,
                  color: '#8fcbab',
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    border: '1px solid #5e967a',
                    borderRadius: '50%',
                  }}
                >
                  ✓
                </span>

                This incident has been resolved.
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}