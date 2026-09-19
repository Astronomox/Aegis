'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { performLogout } from '@/lib/logout';
import { MenuIcon, CloseIcon, ArrowLeftIcon } from '@/components/icons/Icons';
import { useIsMobile } from '@/lib/useIsMobile';

interface AppTopBarProps {
  variant: 'floating' | 'static';
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
        position: 'absolute', top: 12, left: 12, right: 12, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px',
        background: 'var(--color-paper-raised)', backdropFilter: 'blur(12px)',
        border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
      }
    : {
        position: 'sticky', top: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'var(--color-paper-raised)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-rule)',
      };

  const navBtn = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 'var(--text-sm)', fontWeight: 500,
    fontFamily: 'var(--font-body)',
    color: active ? 'var(--color-accent)' : 'var(--color-ink-muted)',
    background: active ? 'var(--color-accent-dim)' : 'transparent',
    border: '1px solid', borderColor: active ? 'var(--color-accent-dim)' : 'transparent',
    padding: '6px 12px', borderRadius: 'var(--radius-sm)',
    transition: 'color 120ms ease, background 120ms ease, border-color 120ms ease',
  });

  const handleLogout = () => performLogout(router);

  return (
    <>
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/aegis-logo.png" alt="Aegis" style={{ height: 16, opacity: 0.9 }} />
        </div>

        {isMobile ? (
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: menuOpen ? 'var(--color-accent-dim)' : 'transparent',
              border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-sm)',
              color: 'var(--color-ink)',
            }}
          >{menuOpen ? <CloseIcon size={16} /> : <MenuIcon size={16} />}</button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {extraDesktopControls}
            {NAV_LINKS.map((link) => (
              <button
                key={link.path}
                onClick={() => router.push(link.path)}
                style={navBtn(pathname === link.path)}
              >{link.label}</button>
            ))}
            <div style={{ width: 1, height: 16, background: 'var(--color-rule)', margin: '0 4px' }} />
            <button
              onClick={handleLogout}
              style={{
                ...navBtn(false),
                color: 'var(--color-danger)',
                borderColor: 'var(--color-danger-dim)',
              }}
            >
              Log out
            </button>
          </div>
        )}
      </div>

      {isMobile && menuOpen && (
        <div style={{
          position: isFloating ? 'absolute' : 'fixed',
          top: isFloating ? 60 : 52,
          left: 12, right: 12, zIndex: 25,
          background: 'var(--color-paper-overlay)',
          border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
          backdropFilter: 'blur(12px)',
        }}>
          {extraMobileControls.map((item) => (
            <button
              key={item.label}
              onClick={() => { item.onClick(); setMenuOpen(false); }}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 14px',
                fontSize: 'var(--text-base)', fontWeight: 500,
                fontFamily: 'var(--font-body)',
                color: item.color,
                background: 'transparent', borderBottom: '1px solid var(--color-rule)',
              }}
            >{item.label}</button>
          ))}
          {NAV_LINKS.map((link) => (
            <button
              key={link.path}
              onClick={() => { setMenuOpen(false); router.push(link.path); }}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 14px',
                fontSize: 'var(--text-base)', fontWeight: 500,
                fontFamily: 'var(--font-body)',
                color: pathname === link.path ? 'var(--color-accent)' : 'var(--color-ink-muted)',
                background: 'transparent', borderBottom: '1px solid var(--color-rule)',
              }}
            >{link.label}</button>
          ))}
          <button
            onClick={() => { setMenuOpen(false); handleLogout(); }}
            style={{
              width: '100%', textAlign: 'left', padding: '12px 14px',
              fontSize: 'var(--text-base)', fontWeight: 500,
              fontFamily: 'var(--font-body)',
              color: 'var(--color-danger)', background: 'transparent',
            }}
          >Log out</button>
        </div>
      )}
    </>
  );
}

export function BackToDashboardLink() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/dashboard')}
      style={{
        background: 'none', border: 'none',
        fontSize: 'var(--text-sm)', fontWeight: 500,
        fontFamily: 'var(--font-body)',
        color: 'var(--color-accent)', marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 5,
      }}
    ><ArrowLeftIcon size={13} /> Back to dashboard</button>
  );
}
