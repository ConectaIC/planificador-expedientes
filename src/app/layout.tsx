export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Tema ligero de estilos */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Planificador de Expedientes</title>
      </head>
      <body>
        <header style={{ marginBottom: 16 }}>
          <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <strong>Planificador</strong>
            <a href="/">Inicio</a>
            <a href="/expedientes">Expedientes</a>
            <a href="/partes">Partes</a>
            <a href="/resumen">Resumen para asistente</a>
          </nav>
        </header>
        <main>{children}</main>

        <style>{`
          table { width: 100%; }
          th, td { vertical-align: top; }
          thead th { position: sticky; top: 0; background: var(--background); }
          textarea { width: 100%; }
        `}</style>
      </body>
    </html>
  );
}
