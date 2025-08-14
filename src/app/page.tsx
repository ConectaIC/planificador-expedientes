// src/app/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main>
      <h2>Panel principal</h2>

      <div style={{display:'flex', gap:12, flexWrap:'wrap', marginTop:12}}>
        <a href="/expedientes">
          <button>📁 Expedientes</button>
        </a>
        <a href="/partes">
          <button>⏱️ Imputación de horas</button>
        </a>
        <a href="/tareas">
          <button>📝 Ver todas las tareas</button>
        </a>
        <a href="/resumen">
          <button>🧠 Resumen para asistente</button>
        </a>
      </div>

      <p style={{marginTop:16, opacity:.8}}>
        Usa los accesos rápidos para navegar. Desde <strong>Expedientes</strong> puedes crear/editar/borrar expedientes
        y desde <strong>Tareas</strong> ver el listado global con filtros.
      </p>
    </main>
  );
}
