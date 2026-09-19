export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', width: '100vw', position: 'relative', overflowY: 'auto', overflowX: 'hidden' }}>
      {children}
    </div>
  );
}
