'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { performLogout } from '@/lib/logout';
import { MenuIcon, CloseIcon, ArrowLeftIcon } from '@/components/icons/Icons';
import { useIsMobile } from '@/lib/useIsMobile';

interface AppTopBarProps {
  // 'floating' sits absolutely over a full-bleed map (used by the live
  // dashboard). 'static' sits at the top of a normal-flow white page
  // (used by history, incident detail, passengers).
  variant: 'floating' | 'static';
  // Optional extra controls specific to one page, rendered before the
  // shared nav links (e.g. the active-incident count and Simulate button
  // on the live dashboard).
  extraDesktopControls?: React.ReactNode;
  extraMobileControls?: { label: string; color: string; onClick: () => void }[];
}

const NAV_LINKS = [
  { label: 'Live', path: '/dashboard' },
  { label: 'Passengers', path: '/dashboard/passengers' },
  { label: 'History', path: '/dashboard/history' },
];

export default function AppTopBar({
  variant,
  extraDesktopControls,
  extraMobileControls = [],
}: AppTopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const isFloating = variant === 'floating';

  const containerStyle: React.CSSProperties = isFloating
    ? {
        position: 'absolute', top: 16, left: 16, right: 16, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }
    : {
        position: 'sticky', top: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      };

  const pill = (color: string, bg: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 600, color,
    background: bg, border: 'none',
    padding: '9px 16px', borderRadius: 'var(--radius-pill)',
  });

  const handleLogout = () => performLogout(router);

  return (
    <>
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/aegis-logo.png" alt="Aegis" style={{ height: 18 }} />
        </div>

        {isMobile ? (
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: menuOpen ? 'var(--blue-dim)' : 'transparent',
              border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--text)',
            }}
          >{menuOpen ? <CloseIcon size={18} /> : <MenuIcon size={18} />}</button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {extraDesktopControls}
            {NAV_LINKS.map((link) => (
              <button
                key={link.path}
                onClick={() => router.push(link.path)}
                style={pill(
                  pathname === link.path ? '#fff' : 'var(--text-dim)',
                  pathname === link.path ? 'var(--blue)' : 'rgba(0,0,0,0.04)'
                )}
              >{link.label}</button>
            ))}
            <button onClick={handleLogout} style={pill('var(--red)', 'var(--red-dim)')}>
              Log out
            </button>
          </div>
        )}
      </div>

      {isMobile && menuOpen && (
        <div style={{
          position: isFloating ? 'absolute' : 'fixed',
          top: isFloating ? 72 : 64,
          left: 16, right: 16, zIndex: 25,
          background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>
          {extraMobileControls.map((item) => (
            <button
              key={item.label}
              onClick={() => { item.onClick(); setMenuOpen(false); }}
              style={{
                width: '100%', textAlign: 'left', padding: '14px 16px',
                fontSize: 14, fontWeight: 600, color: item.color,
                background: 'transparent', borderBottom: '1px solid var(--border)',
              }}
            >{item.label}</button>
          ))}
          {NAV_LINKS.map((link) => (
            <button
              key={link.path}
              onClick={() => { setMenuOpen(false); router.push(link.path); }}
              style={{
                width: '100%', textAlign: 'left', padding: '14px 16px',
                fontSize: 14, fontWeight: 600,
                color: pathname === link.path ? 'var(--blue)' : 'var(--text-dim)',
                background: 'transparent', borderBottom: '1px solid var(--border)',
              }}
            >{link.label}</button>
          ))}
          <button
            onClick={() => { setMenuOpen(false); handleLogout(); }}
            style={{
              width: '100%', textAlign: 'left', padding: '14px 16px',
              fontSize: 14, fontWeight: 600, color: 'var(--red)', background: 'transparent',
            }}
          >Log out</button>
        </div>
      )}
    </>
  );
}

// Small reusable back-link used on pages nested under /dashboard (history,
// incident detail) so the "go back" affordance is visually consistent too.
export function BackToDashboardLink() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/dashboard')}
      style={{
        background: 'none', border: 'none', fontSize: 13, fontWeight: 600,
        color: 'var(--blue)', marginBottom: 16, display: 'flex',
        alignItems: 'center', gap: 6,
      }}
    ><ArrowLeftIcon size={14} /> Back to dashboard</button>
  );
}
