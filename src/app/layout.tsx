// src/app/layout.tsx
// Tipo: Server Component

import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Planificador de Expedientes - Conecta Ingenieros Civiles',
  description: 'Gestión de expedientes, tareas y partes',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="cic-header">
          <div className="cic-header__brand">
            <img src="/logo_cic.png" alt="Conecta Ingenieros" className="cic-logo" />
            <strong className="cic-brand">Planificador</strong>
          </div>
          <nav className="cic-nav">
            <Link href="/" className="nav-link">Inicio</Link>
            <Link href="/expedientes" className="nav-link">Expedientes</Link>
            <Link href="/tareas" className="nav-link">Tareas</Link>
            <Link href="/partes" className="nav-link">Partes</Link>
            <Link href="/resumen-diario" className="nav-link">Resumen diario</Link>
            <Link href="/resumen-mensual" className="nav-link">Resumen mensual</Link>
          </nav>
        </header>
        <main className="cic-main">{children}</main>
      </body>
    </html>
  );
}
