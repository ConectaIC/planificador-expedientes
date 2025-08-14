import './globals.css';
import TopNav from '../components/TopNav';

export const metadata = {
  title: 'Conecta · Planner',
  description: 'Planificador de expedientes y tareas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <TopNav />
        <div style={{maxWidth:1100, margin:'0 auto', padding:'16px 12px'}}>
          {children}
        </div>
      </body>
    </html>
  );
}
