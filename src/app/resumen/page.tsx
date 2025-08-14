// src/app/resumen/page.tsx
import { supabaseAdmin } from '../../lib/supabaseAdmin';

// utilidades simples
function fmtDateISO(d?: string | null) {
  if (!d) return '—';
  const iso = d.includes('T') ? d.split('T')[0] : d;
  const [y, m, dd] = iso.split('-');
  return `${dd}/${m}/${y}`;
}
function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
const HOY = new Date();
const ISO_HOY = toISO(HOY);
const ISO_7 = toISO(new Date(HOY.getFullYear(), HOY.getMonth(), HOY.getDate() + 7));
const ISO_14 = toISO(new Date(HOY.getFullYear(), HOY.getMonth(), HOY.getDate() + 14));

export default async function ResumenAsistente() {
  const sb = supabaseAdmin();

  // 1) EXPEDIENTES (activos y no activos)
  const { data: expedientes, error: e1 } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, cliente, fin, prioridad, estado')
    .order('fin', { ascending: true });

  if (e1) {
    return (
      <main>
        <h2>Resumen para asistente</h2>
        <p>Error al cargar expedientes: {e1.message}</p>
      </main>
    );
  }

  const activos = (expedientes || []).filter(e => {
    const est = (e.estado || '').toLowerCase();
    return est !== 'entregado'.toLowerCase() && est !== 'cerrado'.toLowerCase();
  });

  // 2) TAREAS (sólo de expedientes activos)
  const activeIds = activos.map(e => e.id);
  let tareas: any[] = [];
  if (activeIds.length) {
    const { data, error } = await sb
      .from('tareas')
      .select('id, titulo, estado, prioridad, vencimiento, horas_previstas, horas_realizadas, expediente_id')
      .in('expediente_id', activeIds);
    if (error) {
      return (
        <main>
          <h2>Resumen para asistente</h2>
          <p>Error al cargar tareas: {error.message}</p>
        </main>
      );
    }
    tareas = data || [];
  }

  // 3) PARTES recientes (últimos 7 días)
  const { data: partesRecientes, error: e3 } = await sb
    .from('partes')
    .select('id, fecha, horas, comentario, expediente_id, tarea_id')
    .gte('fecha', ISO_7) // últimos 7 días (incluye hoy+)
    .order('fecha', { ascending: false })
    .limit(100);

  if (e3) {
    return (
      <main>
        <h2>Resumen para asistente</h2>
        <p>Error al cargar partes: {e3.message}</p>
      </main>
    );
  }

  // 4) Cálculos / agrupaciones
  const mapExp = new Map((expedientes || []).map(e => [e.id, e]));
  const mapCodigo = (id?: string | null) => {
    const e = id ? mapExp.get(id) : null;
    return e ? `${e.codigo || ''}${e.proyecto ? ' — ' + e.proyecto : ''}` : '—';
  };

  // KPIs
  const kpiTotalActivos = activos.length;
  const kpiEntregas7 = activos.filter(e => e.fin && e.fin <= ISO_7).length;
  const kpiEntregas14 = activos.filter(e => e.fin && e.fin > ISO_7 && e.fin <= ISO_14).length;
  const kpiAtrasados = activos.filter(e => e.fin && e.fin < ISO_HOY).length;

  // Entregas próximas (expedientes activos)
  const entregas7 = activos
    .filter(e => e.fin && e.fin <= ISO_7)
    .sort((a, b) => (a.fin || '').localeCompare(b.fin || ''));
  const entregas14 = activos
    .filter(e => e.fin && e.fin > ISO_7 && e.fin <= ISO_14)
    .sort((a, b) => (a.fin || '').localeCompare(b.fin || ''));
  const entregasAtrasadas = activos
    .filter(e => e.fin && e.fin < ISO_HOY)
    .sort((a, b) => (a.fin || '').localeCompare(b.fin || ''));

  // Tareas por estado / vencimiento (sólo de expedientes activos)
  const tareasPend = tareas.filter(t => (t.estado || '').toLowerCase() === 'pendiente');
  const tareasCurso = tareas.filter(t => (t.estado || '').toLowerCase() === 'en curso');
  const tareasDone = tareas.filter(t => (t.estado || '').toLowerCase() === 'completada');

  const tareasVence7 = tareas.filter(t => t.vencimiento && t.vencimiento <= ISO_7);
  const tareasVence14 = tareas.filter(t => t.vencimiento && t.vencimiento > ISO_7 && t.vencimiento <= ISO_14);
  const tareasAtraso = tareas.filter(t => t.vencimiento && t.vencimiento < ISO_HOY && (t.estado || '').toLowerCase() !== 'completada');

  // Backlog: expedientes activos sin partes en los últimos 14 días
  // (evitar caer en el olvido)
  const { data: partes14 } = await sb
    .from('partes')
    .select('id, expediente_id, fecha')
    .gte('fecha', ISO_14);

  const activosSinActividad14 = activos.filter(e => {
    const hay = (partes14 || []).some(p => p.expediente_id === e.id);
    return !hay;
  });

  // 5) “Super prompt” para pegar en tu chat y planificar
  const superPrompt = [
    `# Resumen para planificación`,
    `Fecha de informe: ${fmtDateISO(ISO_HOY)}`,
    ``,
    `## KPIs`,
    `- Expedientes activos: ${kpiTotalActivos}`,
    `- Entregas ≤7 días: ${kpiEntregas7}`,
    `- Entregas 8–14 días: ${kpiEntregas14}`,
    `- Entregas atrasadas: ${kpiAtrasados}`,
    ``,
    `## Entregas próximas (≤7 días)`,
    ...entregas7.map(e => `- ${e.codigo} — ${e.proyecto || ''} · Fin: ${fmtDateISO(e.fin)} · Prioridad: ${e.prioridad || '—'}`),
    ``,
    `## Entregas próximas (8–14 días)`,
    ...entregas14.map(e => `- ${e.codigo} — ${e.proyecto || ''} · Fin: ${fmtDateISO(e.fin)} · Prioridad: ${e.prioridad || '—'}`),
    ``,
    `## Entregas atrasadas`,
    ...entregasAtrasadas.map(e => `- ${e.codigo} — ${e.proyecto || ''} · Fin: ${fmtDateISO(e.fin)} · Estado: ${e.estado || '—'}`),
    ``,
    `## Tareas pendientes`,
    ...tareasPend.map(t => `- ${t.titulo} · Exp: ${mapCodigo(t.expediente_id)} · Vence: ${fmtDateISO(t.vencimiento)} · Prev: ${t.horas_previstas ?? '—'}h`),
    ``,
    `## Tareas en curso`,
    ...tareasCurso.map(t => `- ${t.titulo} · Exp: ${mapCodigo(t.expediente_id)} · Vence: ${fmtDateISO(t.vencimiento)} · Avance: ${(Number(t.horas_realizadas)||0)}/${(Number(t.horas_previstas)||0)}h`),
    ``,
    `## Tareas completadas (recientes)`,
    ...tareasDone
      .sort((a,b) => (a.vencimiento||'').localeCompare(b.vencimiento||''))
      .slice(0,10)
      .map(t => `- ${t.titulo} · Exp: ${mapCodigo(t.expediente_id)} · Cierre: ${fmtDateISO(t.vencimiento)} · Total: ${t.horas_realizadas ?? '—'}h`),
    ``,
    `## Partes recientes (≤7 días)`,
    ...(partesRecientes || []).map(p =>
      `- ${fmtDateISO(p.fecha)} · ${mapCodigo(p.expediente_id)} · ${p.horas ?? '—'}h · ${p.comentario || ''}`
    ),
    ``,
    `## Expedientes activos SIN actividad (≤14 días)`,
    ...activosSinActividad14.map(e => `- ${e.codigo} — ${e.proyecto || ''} · Fin: ${fmtDateISO(e.fin)} · Prioridad: ${e.prioridad || '—'}`),
    ``,
    `## Instrucciones de planificación`,
    `- Expedir agenda semanal priorizando entregas cercanas y tareas críticas.`,
    `- Reprogramar tareas no finalizadas y detectar cuellos de botella.`,
    `- Incluir bloques de no productivos:`,
    `  · GEST (3–4 h/sem) · RRSS (según conveniencia) · Admon (1 h/sem; 1ª semana 4 h) · Form (cuando se indique).`,
    `- Considerar visitas de obra cuando aparezcan en las tareas del expediente.`,
  ].join('\n');

  // 6) Render
  return (
    <main>
      <h2>Resumen para asistente</h2>

      {/* KPIs */}
      <section className="kpis">
        <div className="kpi"><div className="kpi-num">{kpiTotalActivos}</div><div className="kpi-label">Expedientes activos</div></div>
        <div className="kpi"><div className="kpi-num">{kpiEntregas7}</div><div className="kpi-label">Entregas ≤ 7 días</div></div>
        <div className="kpi"><div className="kpi-num">{kpiEntregas14}</div><div className="kpi-label">Entregas 8–14 días</div></div>
        <div className="kpi warn"><div className="kpi-num">{kpiAtrasados}</div><div className="kpi-label">Entregas atrasadas</div></div>
      </section>

      {/* Entregas próximas */}
      <section>
        <h3>Entregas próximas (≤ 7 días)</h3>
        <ul>
          {entregas7.length === 0 && <li>—</li>}
          {entregas7.map(e => (
            <li key={e.id}>{e.codigo} — {e.proyecto || '—'} · Fin {fmtDateISO(e.fin)} · {e.prioridad || '—'}</li>
          ))}
        </ul>

        <h3>Entregas próximas (8–14 días)</h3>
        <ul>
          {entregas14.length === 0 && <li>—</li>}
          {entregas14.map(e => (
            <li key={e.id}>{e.codigo} — {e.proyecto || '—'} · Fin {fmtDateISO(e.fin)} · {e.prioridad || '—'}</li>
          ))}
        </ul>

        <h3>Entregas atrasadas</h3>
        <ul>
          {entregasAtrasadas.length === 0 && <li>—</li>}
          {entregasAtrasadas.map(e => (
            <li key={e.id}>{e.codigo} — {e.proyecto || '—'} · Fin {fmtDateISO(e.fin)} · Estado {e.estado || '—'}</li>
          ))}
        </ul>
      </section>

      {/* Tareas */}
      <section>
        <h3>Tareas pendientes</h3>
        <ul>
          {tareasPend.length === 0 && <li>—</li>}
          {tareasPend.map(t => (
            <li key={t.id}>
              {t.titulo} · {mapCodigo(t.expediente_id)} · Vence {fmtDateISO(t.vencimiento)} · Prev {t.horas_previstas ?? '—'}h
            </li>
          ))}
        </ul>

        <h3>Tareas en curso</h3>
        <ul>
          {tareasCurso.length === 0 && <li>—</li>}
          {tareasCurso.map(t => (
            <li key={t.id}>
              {t.titulo} · {mapCodigo(t.expediente_id)} · Vence {fmtDateISO(t.vencimiento)} · {Number(t.horas_realizadas)||0}/{Number(t.horas_previstas)||0} h
            </li>
          ))}
        </ul>

        <h3>Tareas completadas (recientes)</h3>
        <ul>
          {tareasDone.length === 0 && <li>—</li>}
          {tareasDone
            .sort((a,b)=>(a.vencimiento||'').localeCompare(b.vencimiento||''))
            .slice(0,10)
            .map(t => (
              <li key={t.id}>
                {t.titulo} · {mapCodigo(t.expediente_id)} · Cierre {fmtDateISO(t.vencimiento)} · {t.horas_realizadas ?? '—'} h
              </li>
          ))}
        </ul>
      </section>

      {/* Partes recientes */}
      <section>
        <h3>Partes recientes (≤ 7 días)</h3>
        <ul>
          {(partesRecientes||[]).length === 0 && <li>—</li>}
          {(partesRecientes||[]).map(p => (
            <li key={p.id}>
              {fmtDateISO(p.fecha)} · {mapCodigo(p.expediente_id)} · {p.horas ?? '—'} h · {p.comentario || ''}
            </li>
          ))}
        </ul>
      </section>

      {/* Backlog */}
      <section>
        <h3>Expedientes activos SIN actividad en ≤ 14 días</h3>
        <ul>
          {activosSinActividad14.length === 0 && <li>—</li>}
          {activosSinActividad14.map(e => (
            <li key={e.id}>{e.codigo} — {e.proyecto || '—'} · Fin {fmtDateISO(e.fin)} · {e.prioridad || '—'}</li>
          ))}
        </ul>
      </section>

      {/* Super prompt para copiar/pegar */}
      <section>
        <h3>Super prompt para el asistente</h3>
        <p style={{marginTop:0}}>Copia todo el bloque siguiente y pégalo en el chat para que te genere la planificación:</p>
        <textarea readOnly value={superPrompt} rows={18} style={{width:'100%'}} />
      </section>
    </main>
  );
}
