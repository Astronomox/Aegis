import type { ReactNode } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        position: 'relative',
        overflowX: 'hidden',
        color: '#f5f2eb',
        backgroundColor: '#080909',
        backgroundImage:
          'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1.5px)',
        backgroundSize: '36px 36px',
      }}
    >
      {children}
    </div>
  );
}