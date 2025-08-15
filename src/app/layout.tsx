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
  const linkHover: React.CSSProperties = {
    borderColor: 'var(--cic-border, #ddd)',
    background: 'var(--cic-bg-card, #fff)',
  };

  return (
    <html lang="es">
      <body>
        <header style={headerStyle}>
          <strong>Conecta Ingenieros · Planificador</strong>
          <nav style={navStyle}>
            {/* Nota: sin styled-jsx; usamos inline styles simples */}
            <Link href="/" style={linkStyle} onMouseEnter={(e)=>Object.assign((e.target as HTMLElement).style, linkHover)}>Inicio</Link>
            <Link href="/expedientes" style={linkStyle} onMouseEnter={(e)=>Object.assign((e.target as HTMLElement).style, linkHover)}>Expedientes</Link>
            <Link href="/tareas" style={linkStyle} onMouseEnter={(e)=>Object.assign((e.target as HTMLElement).style, linkHover)}>Tareas</Link>
            <Link href="/partes" style={linkStyle} onMouseEnter={(e)=>Object.assign((e.target as HTMLElement).style, linkHover)}>Partes</Link>
            <Link href="/resumen-diario" style={linkStyle} onMouseEnter={(e)=>Object.assign((e.target as HTMLElement).style, linkHover)}>Resumen diario</Link>
            <Link href="/resumen-mensual" style={linkStyle} onMouseEnter={(e)=>Object.assign((e.target as HTMLElement).style, linkHover)}>Resumen mensual</Link>
          </nav>
        </header>
        <main style={{ minHeight: 'calc(100vh - 60px)' }}>{children}</main>
      </body>
    </html>
  );
}
