// src/app/expedientes/[codigo]/page.tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabaseServer';
import ClientNewTask from '@/components/ClientNewTask';
import ClientDeleteTask from '@/components/ClientDeleteTask';
import { createTaskAction, deleteTaskAction } from '../actions';

type Params = { params: { codigo: string } };

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
  const supabase = createClient();

  const { data: exp, error: e1 } = await supabase
    .from('expedientes')
    .select('*')
    .eq('codigo', codigo)
    .maybeSingle();

  if (e1) return { error: e1.message } as const;
  if (!exp) return { error: 'No existe el expediente' } as const;

  const { data: tareas, error: e2 } = await supabase
    .from('tareas')
    .select('*')
    .eq('expediente_id', exp.id)
    .order('vencimiento', { ascending: true });

  if (e2) return { error: e2.message } as const;

  return { exp: exp as Expediente, tareas: (tareas || []) as Tarea[] } as const;
}

export default async function ExpedienteDetallePage({ params }: Params) {
  const { codigo } = params;
  const res = await fetchExpedienteYtareas(codigo);

  if ('error' in res) {
    return <main className="container"><p className="error">No se pudo cargar el expediente “{codigo}”: {res.error}</p></main>;
  }

  const { exp, tareas } = res;

  return (
    <main className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Expediente · {exp.codigo}</h2>
          <div style={{ fontSize: 14, opacity: .8 }}>
            <span>{exp.proyecto}</span>
            {' · '}
            <span>{exp.cliente ?? '—'}</span>
          </div>
        </div>
        <ClientNewTask expedienteId={exp.id} action={createTaskAction} />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Vencimiento</th>
              <th style={{ textAlign: 'right' }}>Horas (prev/real)</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tareas.map(t => (
              <tr key={t.id}>
                <td>{t.titulo}</td>
                <td>{t.estado ?? '—'}</td>
                <td>{t.prioridad ?? '—'}</td>
                <td>{t.vencimiento ?? '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  {(t.horas_previstas ?? 0).toFixed(1)} / {(t.horas_realizadas ?? 0).toFixed(1)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {/* Aquí podríamos añadir un botón de edición similar al de borrado */}
                  <ClientDeleteTask id={t.id} action={deleteTaskAction} />
                </td>
              </tr>
            ))}
            {tareas.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', opacity: .7 }}>No hay tareas en este expediente</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16 }}>
        <Link href="/expedientes" className="btn-link">← Volver a expedientes</Link>
      </div>
    </main>
  );
}
