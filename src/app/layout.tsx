// src/app/layout.tsx
import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planificador de Expedientes — Conecta Ingenieros',
  description: 'Gestión de expedientes, tareas y partes',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--cic-bg, #f7f7fb)', borderBottom: '1px solid #e5e7eb' }}>
          <nav style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <img src="/logo_cic.png" alt="Conecta Ingenieros" width={36} height={36} style={{ borderRadius: 8, objectFit: 'contain' }} />
              <span style={{ fontWeight: 700, color: 'var(--cic-primary, #005bbb)' }}>Conecta Ingenieros</span>
            </Link>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link className="navlink" href="/">Inicio</Link>
              <Link className="navlink" href="/expedientes">Expedientes</Link>
              <Link className="navlink" href="/tareas">Tareas</Link>
              <Link className="navlink" href="/partes">Partes</Link>
              <span style={{ width: 12 }} />
              <Link className="navlink strong" href="/resumen-diario">Resumen diario</Link>
              <Link className="navlink" href="/resumen-mensual">Resumen mensual</Link>
            </div>
          </nav>
        </header>

        <main style={{ maxWidth: 1200, margin: '16px auto', padding: '0 16px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
