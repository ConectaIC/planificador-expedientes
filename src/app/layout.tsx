// src/app/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Planificador | CIC',
    template: '%s · CIC',
  },
  description:
    'Planificador de expedientes, tareas y partes — Conecta Ingenieros Civiles (CIC).',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {/* Barra superior fija */}
        <div className="topbar">
          <div className="container">
            {/* Marca */}
            <Link href="/" className="brand" aria-label="Ir a inicio">
              {/* Asegúrate de tener el logo en /public/logo_cic.png */}
              <img src="/logo_cic.png" alt="CIC" />
              <span>CIC · Conecta Ingenieros Civiles</span>
            </Link>

            {/* Navegación principal */}
            <nav className="nav" aria-label="Navegación principal">
              <Link href="/">Inicio</Link>
              <Link href="/expedientes">Expedientes</Link>
              <Link href="/tareas">Tareas</Link>
              <Link href="/partes">Partes</Link>
              <Link href="/resumen">Resumen</Link>
            </nav>
          </div>
        </div>

        {/* Contenido de la aplicación */}
        {children}
      </body>
    </html>
  );
}
