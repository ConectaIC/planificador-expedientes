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
  return (
    <html lang="es">
      <body>
        <header>
          <div className="header-inner">
            <div className="brand">
              <img src="/logo_cic.png" alt="Conecta Ingenieros" />
              <span>Conecta Ingenieros · Planificador</span>
            </div>
            <nav>
              <Link href="/">Inicio</Link>
              <Link href="/expedientes">Expedientes</Link>
              <Link href="/tareas">Tareas</Link>
              <Link href="/partes">Partes</Link>
              <Link href="/resumen-diario">Resumen diario</Link>
              <Link href="/resumen-mensual">Resumen mensual</Link>
            </nav>
          </div>
        </header>
        <main className="main-wrap">{children}</main>
      </body>
    </html>
  );
}
