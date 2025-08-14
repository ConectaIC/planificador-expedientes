// src/app/expedientes/[codigo]/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import TareasTabla, { Tarea } from '../../../components/TareasTabla';

type PageProps = { params: { codigo: string } };

export default async function ExpedienteDetallePage({ params }: PageProps) {
  const codigo = decodeURIComponent(params.codigo);
  const sb = supabaseAdmin();

  // 1) Buscar expediente por código
  const { data: expediente, error: eExp } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, cliente, fin, prioridad, estado')
    .eq('codigo', codigo)
    .maybeSingle();

  if (eExp) {
    return (
      <main>
        <h2>Expediente: {codigo}</h2>
        <p>Error al cargar expediente: {eExp.message}</p>
      </main>
    );
  }
  if (!expediente) {
    return (
      <main>
        <h2>Expediente: {codigo}</h2>
        <p>No se encontró el expediente.</p>
      </main>
    );
  }

  // 2) Cargar tareas del expediente
  const { data: tareasData, error: eTar } = await sb
    .from('tareas')
    .select('id, titulo, estado, prioridad, horas_previstas, horas_realizadas, vencimiento')
    .eq('expediente_id', expediente.id)
    .order('vencimiento', { ascending: true });

  const tareas: Tarea[] = (tareasData || []).map((t: any) => ({
    id: t.id,
    titulo: t.titulo,
    estado: t.estado,
    prioridad: t.prioridad,
    horas_previstas: t.horas_previstas,
    horas_realizadas: t.horas_realizadas,
    vencimiento: t.vencimiento
  }));

  function fmtFin(d?: string | null) {
    return d ? d.split('T')[0].split('-').reverse().join('/') : '—';
  }

  return (
    <main>
      <a href="/expedientes" style={{ display: 'inline-block', marginBottom: 8 }}>← Volver a expedientes</a>

      <h2>{expediente.codigo}</h2>
      <p style={{ margin: 0, opacity: 0.9 }}>{expediente.proyecto}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginTop: 12 }}>
        <div><strong>Cliente:</strong><br />{expediente.cliente || '—'}</div>
        <div><strong>Fin previsto:</strong><br />{fmtFin(expediente.fin)}</div>
        <div><strong>Prioridad:</strong><br />{expediente.prioridad || '—'}</div>
        <div><strong>Estado:</strong><br />{expediente.estado || '—'}</div>
      </div>

      <h3 style={{ marginTop: 20 }}>Tareas</h3>
      {eTar ? (
        <p>Error al cargar tareas: {eTar.message}</p>
      ) : (
        <TareasTabla tareasIniciales={tareas} />
      )}
    </main>
  );
}
