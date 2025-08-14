import { supabaseAdmin } from '../../lib/supabaseAdmin';
import CopyBar from './CopyBar';

// Genera textos (muy resumido: ajusta a tu lógica actual)
async function buildPrompts() {
  const sb = supabaseAdmin();

  // últimos partes
  const { data: partes } = await sb
    .from('partes')
    .select('fecha, horas, comentario, expediente_id')
    .order('fecha', { ascending: false })
    .limit(10);

  // expedientes activos (no Entregado ni Cerrado)
  const { data: exps } = await sb
    .from('expedientes')
    .select('codigo, proyecto, estado, prioridad, fin')
    .neq('estado', 'Entregado')
    .neq('estado', 'Cerrado');

  // tareas próximas a vencer (7 días)
  const { data: tareas } = await sb
    .from('tareas')
    .select('titulo, estado, prioridad, vencimiento')
    .gte('vencimiento', new Date().toISOString().slice(0,10))
    .lte('vencimiento', new Date(Date.now()+7*86400000).toISOString().slice(0,10))
    .order('vencimiento');

  const fmt = (d?: string|null) => d ? d.split('T')[0].split('-').reverse().join('/') : '—';

  const diario =
`REPORTE DIARIO
- Últimos partes:
${(partes||[]).map(p=>`  · ${fmt(p.fecha)} — ${p.horas} h — ${p.comentario || ''}`).join('\n')}

- Expedientes activos (prioridad/fin):
${(exps||[]).map(e=>`  · ${e.codigo} — ${e.proyecto} — ${e.prioridad||'—'} — Fin: ${fmt(e.fin)}`).join('\n')}

- Tareas próximas (≤7 días):
${(tareas||[]).map(t=>`  · ${fmt(t.vencimiento)} — ${t.titulo} — ${t.prioridad||'—'} — ${t.estado||'—'}`).join('\n')}

Instrucciones:
- Reprograma tareas no finalizadas.
- Reserva tiempo para GEST (3–4 h/sem), RRSS (según convenga), ADM (1 h/sem; 4 h la 1.ª semana), FORM (cuando proceda).
`;

  const mensual =
`REPORTE MENSUAL (completo)
- Partes del periodo: ${partes?.length ?? 0}
- Expedientes activos: ${(exps||[]).length}
- Tareas próximas 7 días: ${(tareas||[]).length}
- Recordatorios:
  · No olvidar expedientes en curso sin prioridad definida.
  · Repasar "Entregado" por si vuelven con cambios.
  · Planificar GEST/RRSS/ADM/FORM como marcado.
`;

  return { diario, mensual };
}

export const dynamic = 'force-dynamic';

export default async function ResumenPage() {
  const { diario, mensual } = await buildPrompts();
  return (
    <main>
      <h2>Resumen para asistente</h2>
      <CopyBar diario={diario} mensual={mensual} />

      <h3>Vista previa del prompt diario</h3>
      <pre style={{whiteSpace:'pre-wrap'}}>{diario}</pre>

      <h3>Vista previa del prompt mensual</h3>
      <pre style={{whiteSpace:'pre-wrap'}}>{mensual}</pre>
    </main>
  );
}
