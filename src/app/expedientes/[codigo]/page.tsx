// src/app/expedientes/[codigo]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabaseServer';

type Expediente = {
  id: number;
  codigo: string;
  proyecto: string;
  cliente: string | null;
  inicio: string | null;
  fin: string | null;
  prioridad: 'Baja' | 'Media' | 'Alta' | null;
  estado: 'Pendiente' | 'En curso' | 'En supervisión' | 'Entregado' | 'Cerrado' | null;
  horas_previstas: number | null;
  horas_reales: number | null;
};

type Tarea = {
  id: number;
  expediente_id: number;
  titulo: string;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  estado: 'Pendiente' | 'En curso' | 'Completada' | null;
  prioridad: 'Baja' | 'Media' | 'Alta' | null;
  vencimiento: string | null;
};

async function fetchExpedienteYtareas(codigo: string) {
  const supabase = createClient(); // ✅ sin cookies()

  // 1) expediente por código
  const { data: exp, error: e1 } = await supabase
    .from('expedientes')
    .select('*')
    .eq('codigo', codigo)
    .maybeSingle();

  if (e1) throw new Error(`Error al cargar expediente: ${e1.message}`);
  if (!exp) return { exp: null, tareas: [] as Tarea[] };

  // 2) tareas del expediente
  const { data: tareas, error: e2 } = await supabase
    .from('tareas')
    .select('id, expediente_id, titulo, horas_previstas, horas_realizadas, estado, prioridad, vencimiento')
    .eq('expediente_id', exp.id)
    .order('vencimiento', { ascending: true, nullsFirst: true });

  if (e2) throw new Error(`Error al cargar tareas: ${e2.message}`);

  return { exp: exp as Expediente, tareas: (tareas ?? []) as Tarea[] };
}

export default async function Page({ params }: { params: { codigo: string } }) {
  const codigo = decodeURIComponent(params.codigo);
  const { exp, tareas } = await fetchExpedienteYtareas(codigo);

  if (!exp) notFound();

  const fmt = (n: number | null | undefined) =>
    Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '—';

  return (
    <main className="container">
      <div
        className="card"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}
      >
        <h2>Expediente · {exp.codigo}</h2>
        {/* Aquí más adelante va el botón ➕ para “Nueva tarea” con modal cliente */}
        <Link href="/expedientes" className="btn-link">← Volver</Link>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
          <div><div className="muted">Proyecto</div><div>{exp.proyecto}</div></div>
          <div><div className="muted">Cliente</div><div>{exp.cliente ?? '—'}</div></div>
          <div><div className="muted">Inicio / Fin</div><div>{exp.inicio ?? '—'} / {exp.fin ?? '—'}</div></div>
          <div><div className="muted">Prioridad / Estado</div><div>{exp.prioridad ?? '—'} / {exp.estado ?? '—'}</div></div>
          <div><div className="muted">Horas previstas</div><div>{fmt(exp.horas_previstas)}</div></div>
          <div><div className="muted">Horas reales</div><div>{fmt(exp.horas_reales)}</div></div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 12px' }}>Tareas vinculadas</h3>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Vencimiento</th>
                <th style={{ textAlign: 'right' }}>Horas prev.</th>
                <th style={{ textAlign: 'right' }}>Horas real.</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tareas.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 16 }}>
                    No hay tareas vinculadas.
                  </td>
                </tr>
              ) : (
                tareas.map((t) => (
                  <tr key={t.id}>
                    <td>{t.titulo}</td>
                    <td>{t.estado ?? '—'}</td>
                    <td>{t.prioridad ?? '—'}</td>
                    <td>{t.vencimiento ?? '—'}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(t.horas_previstas)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(t.horas_realizadas)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {/* En breve: botones (emoji) Editar/Borrar con modales cliente */}
                      <span className="muted">✏️ / 🗑️</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
