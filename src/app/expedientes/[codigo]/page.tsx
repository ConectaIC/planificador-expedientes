import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import TareasTabla from '../../../components/TareasTabla';
import NuevaTareaModal from '../../../components/NuevaTareaModal';

type PageProps = { params: { codigo: string } };

function fmtDate(d?: string | null) {
  if (!d) return '—';
  const ymd = d.includes('T') ? d.split('T')[0] : d;
  const [y, m, day] = ymd.split('-');
  return `${day}/${m}/${y}`;
}

export default async function ExpedienteDetallePage({ params }: PageProps) {
  const { codigo } = params;
  const sb = supabaseAdmin();

  // 1) Cargar expediente por código
  const { data: expList, error: expErr } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, cliente, fin, prioridad, estado')
    .eq('codigo', codigo)
    .limit(1);

  if (expErr) {
    return (
      <main>
        <h2>Expediente</h2>
        <p>Error al cargar expediente: {expErr.message}</p>
      </main>
    );
  }
  const exp = expList?.[0];
  if (!exp) {
    return (
      <main>
        <h2>Expediente</h2>
        <p>No existe expediente con código {codigo}.</p>
      </main>
    );
  }

  // 2) Tareas del expediente
  const { data: tareasData, error: tarErr } = await sb
    .from('tareas')
    .select('id, titulo, estado, prioridad, vencimiento, horas_previstas, horas_realizadas')
    .eq('expediente_id', exp.id)
    .order('vencimiento', { ascending: true })
    .order('titulo', { ascending: true });

  if (tarErr) {
    return (
      <main>
        <h2>{exp.codigo} — {exp.proyecto}</h2>
        <p>Error al cargar tareas: {tarErr.message}</p>
      </main>
    );
  }

const tareas = (tareasData || []).map((t: any) => ({
  id: t.id,
  titulo: t.titulo ?? null,
  estado: t.estado ?? 'Pendiente',
  prioridad: t.prioridad ?? null,
  vencimiento: t.vencimiento ?? null,      // ← importante para evitar undefined
  horas_previstas: t.horas_previstas ?? 0,
  horas_realizadas: t.horas_realizadas ?? 0,
}));

  return (
    <main>
      <h2>
        {exp.codigo} — {exp.proyecto}
      </h2>
      <p style={{ marginTop: 4, color: '#274e3b' }}>
        <b>Cliente:</b> {exp.cliente ?? '—'} · <b>Fin:</b> {fmtDate(exp.fin)} · <b>Prioridad:</b> {exp.prioridad ?? '—'} ·{' '}
        <b>Estado:</b> {exp.estado ?? '—'}
      </p>

      {/* Botón / modal para nueva tarea */}
      <div style={{ margin: '12px 0' }}>
        <NuevaTareaModal expedienteId={exp.id} />
      </div>

      {/* Tabla de tareas */}
      <TareasTabla tareas={tareas} expedienteId={exp.id} />

      <div style={{ marginTop: 16 }}>
        <a href="/expedientes">← Volver a expedientes</a>
      </div>
    </main>
  );
}
