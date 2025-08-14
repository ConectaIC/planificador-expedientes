// src/app/resumen/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../lib/supabaseAdmin';

function iso(d: Date) { return d.toISOString().split('T')[0]; }
function fmt(d?: string | null) {
  if (!d) return '—';
  const ymd = d.split('T')[0] ?? d;
  const [y, m, dd] = ymd.split('-');
  return (y && m && dd) ? `${dd}/${m}/${y}` : d;
}

function startOfWeek(d = new Date()) {
  const t = new Date(d);
  const day = t.getDay(); // 0=Dom
  const diff = (day === 0 ? -6 : 1 - day); // lunes
  t.setDate(t.getDate() + diff);
  t.setHours(0,0,0,0);
  return t;
}

export default async function ResumenPage() {
  const sb = supabaseAdmin();
  const hoy = new Date();
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
  const hace3 = new Date(hoy); hace3.setDate(hoy.getDate() - 3);
  const hace30 = new Date(hoy); hace30.setDate(hoy.getDate() - 30);
  const prox7 = new Date(hoy); prox7.setDate(hoy.getDate() + 7);
  const prox14 = new Date(hoy); prox14.setDate(hoy.getDate() + 14);
  const semanaIni = startOfWeek(hoy);

  // --- 0) Métricas rápidas ----------------------------------------
  // Expedientes activos (no cerrados)
  const { data: expsAct } = await sb
    .from('expedientes')
    .select('id, codigo, prioridad, estado, fin')
    .not('estado', 'in', '(Cerrado)')
    .order('fin', { ascending: true });

  // Horas semana (sum partes desde lunes)
  const { data: partesSemana } = await sb
    .from('partes')
    .select('horas, fecha')
    .gte('fecha', iso(semanaIni));

  const horasSemana = (partesSemana ?? []).reduce((s:any, p:any) => s + Number(p.horas || 0), 0);

  // --- 1) Últimos partes (20) -------------------------------------
  const { data: ultPartes } = await sb
    .from('partes')
    .select(`
      id, fecha, inicio, fin, horas, comentario,
      expediente:expediente_id ( codigo ),
      tarea:tarea_id ( titulo )
    `)
    .order('fecha', { ascending: false })
    .order('inicio', { ascending: false })
    .limit(20);

  // --- 2) Tareas pendientes con vto <= 7 días ----------------------
  const { data: tareasPend7 } = await sb
    .from('tareas')
    .select(`
      id, titulo, estado, prioridad, vencimiento, horas_previstas, horas_realizadas,
      expedientes:expediente_id ( codigo )
    `)
    .in('estado', ['Pendiente', 'En curso', 'En Supervisión'])
    .gte('vencimiento', iso(hoy))
    .lte('vencimiento', iso(prox7))
    .order('vencimiento', { ascending: true });

  // --- 3) Tareas completadas últimos 3 días ------------------------
  const { data: tareasCompl3 } = await sb
    .from('tareas')
    .select(`
      id, titulo, estado, prioridad, vencimiento,
      expedientes:expediente_id ( codigo )
    `)
    .in('estado', ['Entregado', 'Cerrado'])
    .gte('vencimiento', iso(hace3))
    .order('vencimiento', { ascending: false });

  // --- 4) Expedientes creados o modificados últimas 24 h -----------
  let expNuevos24: any[] = [];
  let expMod24: any[] = [];
  try {
    const { data: eN } = await sb
      .from('expedientes')
      .select('id, codigo, proyecto, fin, prioridad, estado, created_at')
      .gte('created_at', ayer.toISOString());
    expNuevos24 = eN || [];
  } catch {}
  try {
    const { data: eM } = await sb
      .from('expedientes')
      .select('id, codigo, proyecto, fin, prioridad, estado, updated_at')
      .gte('updated_at', ayer.toISOString());
    expMod24 = (eM || []).filter((x:any) => !expNuevos24.some(n => n.id === x.id));
  } catch {}

  // --- 5) Próximas entregas (14 días) -------------------------------
  const { data: expProx14 } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, fin, prioridad, estado')
    .gte('fin', iso(hoy))
    .lte('fin', iso(prox14))
    .order('fin', { ascending: true });

  const { data: tarProx14 } = await sb
    .from('tareas')
    .select('id, titulo, vencimiento, prioridad, estado, expedientes:expediente_id(codigo)')
    .gte('vencimiento', iso(hoy))
    .lte('vencimiento', iso(prox14))
    .order('vencimiento', { ascending: true });

  // --- 6) Atrasos ---------------------------------------------------
  const { data: expLate } = await sb
    .from('expedientes')
    .select('id, codigo, proyecto, fin, prioridad, estado')
    .lt('fin', iso(hoy))
    .not('estado', 'in', '(Entregado, Cerrado)')
    .order('fin', { ascending: true });

  const { data: tarLate } = await sb
    .from('tareas')
    .select('id, titulo, vencimiento, prioridad, estado, expedientes:expediente_id(codigo)')
    .lt('vencimiento', iso(hoy))
    .not('estado', 'in', '(Entregado, Cerrado)')
    .order('vencimiento', { ascending: true });

  // --- 7) Expedientes no cerrados por prioridad ---------------------
  // Prios: Alta, Media, Baja, Null (sin prioridad)
  const noCerrados = (expsAct ?? []).map((e:any) => ({
    ...e,
    prioKey: (e.prioridad ?? '').toLowerCase() || 'null'
  }));
  const bucket = {
    alta: [] as any[], media: [] as any[], baja: [] as any[], null: [] as any[]
  };
  noCerrados.forEach((e:any) => {
    if (e.prioKey === 'alta') bucket.alta.push(e);
    else if (e.prioKey === 'media') bucket.media.push(e);
    else if (e.prioKey === 'baja') bucket.baja.push(e);
    else bucket.null.push(e);
  });

  // --- Super Prompt -------------------------------------------------
  const superPrompt = [
    `Contexto para planificación (generado ${fmt(hoy.toISOString())}):`,
    ``,
    `Métricas rápidas:`,
    `- Expedientes activos (no cerrados): ${expsAct?.length ?? 0}`,
    `- Horas registradas esta semana: ${horasSemana.toFixed(2)} h`,
    ``,
    `Últimos partes:`,
    ...(ultPartes ?? []).map((p:any)=>`- ${fmt(p.fecha)} ${p.inicio}-${p.fin} · ${Number(p.horas||0).toFixed(2)}h · ${p.expediente?.codigo ?? '—'} · ${p.tarea?.titulo ?? '—'} · ${p.comentario ?? ''}`),
    ``,
    `Tareas urgentes (vencen ≤ 7 días):`,
    ...(tareasPend7 ?? []).map((t:any)=>`- ${fmt(t.vencimiento)} · ${t.expedientes?.codigo ?? '—'} · ${t.titulo} · Pri: ${t.prioridad ?? '—'} · Estado: ${t.estado ?? '—'}`),
    ``,
    `Próximas entregas (≤14 días):`,
    `• Expedientes:`,
    ...(expProx14 ?? []).map((e:any)=>`  - ${fmt(e.fin)} · ${e.codigo} · ${e.proyecto} · Pri: ${e.prioridad ?? '—'} · Estado: ${e.estado ?? '—'}`),
    `• Tareas:`,
    ...(tarProx14 ?? []).map((t:any)=>`  - ${fmt(t.vencimiento)} · ${t.expedientes?.codigo ?? '—'} · ${t.titulo} · Pri: ${t.prioridad ?? '—'} · Estado: ${t.estado ?? '—'}`),
    ``,
    `Atrasos:`,
    `• Expedientes:`,
    ...(expLate ?? []).map((e:any)=>`  - ${fmt(e.fin)} · ${e.codigo} · ${e.proyecto} · Pri: ${e.prioridad ?? '—'} · Estado: ${e.estado ?? '—'}`),
    `• Tareas:`,
    ...(tarLate ?? []).map((t:any)=>`  - ${fmt(t.vencimiento)} · ${t.expedientes?.codigo ?? '—'} · ${t.titulo} · Pri: ${t.prioridad ?? '—'} · Estado: ${t.estado ?? '—'}`),
    ``,
    `Expedientes no cerrados (por prioridad):`,
    `• Alta (${bucket.alta.length})`,
    ...bucket.alta.map((e:any)=>`  - ${e.codigo} · Fin: ${fmt(e.fin)} · Estado: ${e.estado ?? '—'}`),
    `• Media (${bucket.media.length})`,
    ...bucket.media.map((e:any)=>`  - ${e.codigo} · Fin: ${fmt(e.fin)} · Estado: ${e.estado ?? '—'}`),
    `• Baja (${bucket.baja.length})`,
    ...bucket.baja.map((e:any)=>`  - ${e.codigo} · Fin: ${fmt(e.fin)} · Estado: ${e.estado ?? '—'}`),
    `• Sin prioridad (${bucket.null.length})`,
    ...bucket.null.map((e:any)=>`  - ${e.codigo} · Fin: ${fmt(e.fin)} · Estado: ${e.estado ?? '—'}`),
    ``,
    `Instrucciones fijas (no olvidar):`,
    `- Reprogramar automáticamente todas las tareas no acabadas.`,
    `- Mantener control mensual de expedientes no productivos (GEST, RRSS, ADMON, FORM).`,
    `- Visitas de obra: se registran como tareas del expediente o por indicación.`,
    `- Dedicaciones mínimas:`,
    `  • GEST – Gestión y Organización: 3–4 h/semana`,
    `  • RRSS – Community Management: según carga y disponibilidad`,
    `  • ADMON – Administración y Contabilidad: 1 h/semana (4 h la primera semana de cada mes)`,
    `  • FORM – Formación/Jornadas: cuando se indique`,
    ``,
    `Solicito (responder con planificación):`,
    `1) Plan de prioridades para hoy y próximos 7 días (incluye GEST/RRSS/ADMON según reglas).`,
    `2) Orden de trabajo recomendado y horas estimadas por bloque.`,
    `3) Reprogramación de tareas no finalizadas y aviso de riesgos de plazo.`,
  ].join('\n');

  return (
    <main>
      <h2>Resumen para asistente</h2>

      {/* Métricas rápidas */}
      <section>
        <h3>Métricas rápidas</h3>
        <ul>
          <li>Expedientes activos (no cerrados): <strong>{expsAct?.length ?? 0}</strong></li>
          <li>Horas registradas esta semana: <strong>{horasSemana.toFixed(2)} h</strong></li>
        </ul>
      </section>

      {/* Últimos partes */}
      <section>
        <h3>Últimos partes (20)</h3>
        <table>
          <thead><tr><th>Fecha</th><th>Horario</th><th>Horas</th><th>Expediente</th><th>Tarea</th><th>Comentario</th></tr></thead>
          <tbody>
            {(ultPartes||[]).map((p:any)=>(
              <tr key={p.id}>
                <td>{fmt(p.fecha)}</td>
                <td>{p.inicio}–{p.fin}</td>
                <td>{Number(p.horas||0).toFixed(2)}</td>
                <td>{p.expediente?.codigo || '—'}</td>
                <td>{p.tarea?.titulo || '—'}</td>
                <td>{p.comentario || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Tareas urgentes */}
      <section>
        <h3>Tareas urgentes (vencen ≤ 7 días)</h3>
        <table>
          <thead><tr><th>Vencimiento</th><th>Expediente</th><th>Tarea</th><th>Prioridad</th><th>Estado</th></tr></thead>
          <tbody>
            {(tareasPend7||[]).map((t:any)=>(
              <tr key={t.id}>
                <td>{fmt(t.vencimiento)}</td>
                <td>{t.expedientes?.codigo || '—'}</td>
                <td>{t.titulo}</td>
                <td>{t.prioridad || '—'}</td>
                <td>{t.estado || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Tareas completadas últimos 3 días */}
      <section>
        <h3>Tareas completadas (últimos 3 días)</h3>
        <table>
          <thead><tr><th>Vencimiento</th><th>Expediente</th><th>Tarea</th><th>Prioridad</th><th>Estado</th></tr></thead>
          <tbody>
            {(tareasCompl3||[]).map((t:any)=>(
              <tr key={t.id}>
                <td>{fmt(t.vencimiento)}</td>
                <td>{t.expedientes?.codigo || '—'}</td>
                <td>{t.titulo}</td>
                <td>{t.prioridad || '—'}</td>
                <td>{t.estado || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Próximas entregas */}
      <section>
        <h3>Próximas entregas (14 días)</h3>
        <h4>Expedientes</h4>
        <table>
          <thead><tr><th>Fin</th><th>Expediente</th><th>Proyecto</th><th>Prioridad</th><th>Estado</th></tr></thead>
          <tbody>
            {(expProx14||[]).map((e:any)=>(
              <tr key={e.id}>
                <td>{fmt(e.fin)}</td>
                <td>{e.codigo}</td>
                <td>{e.proyecto}</td>
                <td>{e.prioridad || '—'}</td>
                <td>{e.estado || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4 style={{marginTop:12}}>Tareas</h4>
        <table>
          <thead><tr><th>Vencimiento</th><th>Expediente</th><th>Tarea</th><th>Prioridad</th><th>Estado</th></tr></thead>
          <tbody>
            {(tarProx14||[]).map((t:any)=>(
              <tr key={t.id}>
                <td>{fmt(t.vencimiento)}</td>
                <td>{t.expedientes?.codigo || '—'}</td>
                <td>{t.titulo}</td>
                <td>{t.prioridad || '—'}</td>
                <td>{t.estado || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Atrasos */}
      <section>
        <h3>Atrasos</h3>
        <h4>Expedientes</h4>
        <table>
          <thead><tr><th>Fin</th><th>Expediente</th><th>Proyecto</th><th>Prioridad</th><th>Estado</th></tr></thead>
          <tbody>
            {(expLate||[]).map((e:any)=>(
              <tr key={e.id}>
                <td>{fmt(e.fin)}</td>
                <td>{e.codigo}</td>
                <td>{e.proyecto}</td>
                <td>{e.prioridad || '—'}</td>
                <td>{e.estado || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4 style={{marginTop:12}}>Tareas</h4>
        <table>
          <thead><tr><th>Vencimiento</th><th>Expediente</th><th>Tarea</th><th>Prioridad</th><th>Estado</th></tr></thead>
          <tbody>
            {(tarLate||[]).map((t:any)=>(
              <tr key={t.id}>
                <td>{fmt(t.vencimiento)}</td>
                <td>{t.expedientes?.codigo || '—'}</td>
                <td>{t.titulo}</td>
                <td>{t.prioridad || '—'}</td>
                <td>{t.estado || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* No cerrados por prioridad */}
      <section>
        <h3>Expedientes no cerrados por prioridad</h3>

        <h4>Alta ({bucket.alta.length})</h4>
        <table>
          <thead><tr><th>Expediente</th><th>Fin</th><th>Estado</th></tr></thead>
          <tbody>
            {bucket.alta.map((e:any)=>(
              <tr key={e.id}><td>{e.codigo}</td><td>{fmt(e.fin)}</td><td>{e.estado || '—'}</td></tr>
            ))}
          </tbody>
        </table>

        <h4 style={{marginTop:12}}>Media ({bucket.media.length})</h4>
        <table>
          <thead><tr><th>Expediente</th><th>Fin</th><th>Estado</th></tr></thead>
          <tbody>
            {bucket.media.map((e:any)=>(
              <tr key={e.id}><td>{e.codigo}</td><td>{fmt(e.fin)}</td><td>{e.estado || '—'}</td></tr>
            ))}
          </tbody>
        </table>

        <h4 style={{marginTop:12}}>Baja ({bucket.baja.length})</h4>
        <table>
          <thead><tr><th>Expediente</th><th>Fin</th><th>Estado</th></tr></thead>
          <tbody>
            {bucket.baja.map((e:any)=>(
              <tr key={e.id}><td>{e.codigo}</td><td>{fmt(e.fin)}</td><td>{e.estado || '—'}</td></tr>
            ))}
          </tbody>
        </table>

        <h4 style={{marginTop:12}}>Sin prioridad ({bucket.null.length})</h4>
        <table>
          <thead><tr><th>Expediente</th><th>Fin</th><th>Estado</th></tr></thead>
          <tbody>
            {bucket.null.map((e:any)=>(
              <tr key={e.id}><td>{e.codigo}</td><td>{fmt(e.fin)}</td><td>{e.estado || '—'}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Super prompt listo para copiar */}
      <section style={{marginTop:20}}>
        <h3>Super prompt (copiar y pegar aquí en el chat)</h3>
        <p style={{margin:'6px 0 8px', opacity:.8}}>
          Selecciona el cuadro y copia el contenido completo. Después pégalo aquí para que te entregue la planificación optimizada.
        </p>
        <textarea readOnly value={superPrompt} style={{width:'100%', minHeight:260}} />
      </section>
    </main>
  );
}
