// src/app/expedientes/[codigo]/page.tsx
// Tipo: Server Component

import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import NuevaTareaModal from '../../../components/NuevaTareaModal';
import TareaRowActions from '../../../components/TareaRowActions';

type Expediente = {
  id: number;
  codigo: string;
  proyecto: string | null;
  cliente: string | null;
  estado: string | null;
  prioridad: string | null;
  fin: string | null;
};

type Tarea = {
  id: number;
  titulo: string;
  estado: string | null;
  prioridad: string | null;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  vencimiento: string | null;
  expediente_id: number;
};

function fmt2(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v.toFixed(2) : '—';
}

export default async function Page({ params }: { params: { codigo: string } }) {
  const codigo = decodeURIComponent(params.codigo);
  const sb = supabaseAdmin();

  // Cargamos el expediente por código
  const { data: expData, error: expErr } = await sb
    .from('expedientes')
    .select('id,codigo,proyecto,cliente,estado,prioridad,fin')
    .eq('codigo', codigo)
    .limit(1);

  if (expErr) {
    return (
      <main className="container">
        <h1>Expediente</h1>
        <div className="error">Error al cargar expediente: {expErr.message}</div>
      </main>
    );
  }
  const exp = (expData && expData[0]) as Expediente | undefined;
  if (!exp) {
    return (
      <main className="container">
        <h1>Expediente</h1>
        <div className="error">No se encontró el expediente “{codigo}”.</div>
      </main>
    );
  }

  // Tareas del expediente
  const { data: tareasData, error: tareasErr } = await sb
    .from('tareas')
    .select('id,titulo,estado,prioridad,horas_previstas,horas_realizadas,vencimiento,expediente_id')
    .eq('expediente_id', exp.id)
    .order('vencimiento', { ascending: true });

  const tareas = (tareasData || []) as Tarea[];

  // Para edición de tareas en modal necesitamos el listado de expedientes (selector en TareaForm)
  const { data: expsMini } = await sb
    .from('expedientes')
    .select('id,codigo,proyecto')
    .order('codigo', { ascending: true });

  return (
    <main className="container">
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Expediente · {exp.codigo}</h2>
        {/* Alta de tarea vinculada mediante modal existente (usa botón ➕) */}
        <NuevaTareaModal expedienteId={String(exp.id)} />
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div><strong>Proyecto:</strong> {exp.proyecto || '—'}</div>
        <div><strong>Cliente:</strong> {exp.cliente || '—'}</div>
        <div><strong>Estado:</strong> {exp.estado || '—'} · <strong>Prioridad:</strong> {exp.prioridad || '—'}</div>
        <div><strong>Entrega:</strong> {exp.fin ? new Date(exp.fin).toLocaleDateString('es-ES') : '—'}</div>
      </div>

      <h3 style={{ margin: '8px 0' }}>Tareas vinculadas</h3>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Vencimiento</th>
              <th>Horas (real / prev.)</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tareas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>No hay tareas para este expediente.</td>
              </tr>
            ) : (
              tareas.map((t) => (
                <tr key={t.id}>
                  <td>{t.titulo}</td>
                  <td>{t.estado || '—'}</td>
                  <td>{t.prioridad || '—'}</td>
                  <td>{t.vencimiento ? new Date(t.vencimiento).toLocaleDateString('es-ES') : '—'}</td>
                  <td><strong>{fmt2(t.horas_realizadas)}</strong> / {fmt2(t.horas_previstas)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {/* Reutilizamos TareaForm en modal (wrapper cliente) */}
                    <TareaRowActions tarea={t as any} expedientes={(expsMini || []) as any[]} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
