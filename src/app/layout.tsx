// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Planificador de Expedientes - Conecta Ingenieros Civiles',
  description: 'Gestión de expedientes, tareas y partes',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 16px',
    borderBottom: '1px solid var(--cic-border, #e5e5e5)',
    background: 'var(--cic-bg, #fafafa)',
  };
  const navStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' };
  const linkStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 8,
    textDecoration: 'none',
    color: 'var(--cic-text, #222)',
    border: '1px solid transparent',
  };

  return (
    <html lang="es">
      <body>
        <header style={headerStyle}>
          <strong>Conecta Ingenieros · Planificador</strong>
          <nav style={navStyle}>
            {/* Sin event handlers: Server Component + Link (Client) */}
            <Link href="/" style={linkStyle}>Inicio</Link>
            <Link href="/expedientes" style={linkStyle}>Expedientes</Link>
            <Link href="/tareas" style={linkStyle}>Tareas</Link>
            <Link href="/partes" style={linkStyle}>Partes</Link>
            <Link href="/resumen-diario" style={linkStyle}>Resumen diario</Link>
            <Link href="/resumen-mensual" style={linkStyle}>Resumen mensual</Link>
          </nav>
        </header>
        <main style={{ minHeight: 'calc(100vh - 60px)' }}>{children}</main>
      </body>
    </html>
  );
}
