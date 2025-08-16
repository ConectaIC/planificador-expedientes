export const metadata = {
  title: 'Gestión y Planificador - Conecta Ingenieros Civiles',
  description: 'Planificador de expedientes, tareas y partes',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="app-header">
          <div className="container app-header-inner">
            <img className="logo" src="/logo_cic.png" alt="Conecta Ingenieros Civiles" />
            <div>
              <div className="app-title">Gestión y Planificador - Conecta Ingenieros Civiles</div>
              <div className="app-sub">Expedientes · Tareas · Partes</div>
            </div>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
