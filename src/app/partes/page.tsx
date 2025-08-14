// src/app/partes/page.tsx
import { supabaseAdmin } from '../../lib/supabaseAdmin';

function fmtDate(d?: string | null) {
  if (!d) return '—';
  try {
    return d.split('T')[0].split('-').reverse().join('/');
  } catch { return d || '—'; }
}
function fmtTime(t?: string | null) {
  if (!t) return '—';
  return t.slice(0,5); // HH:MM
}

export default async function PartesPage() {
  const sb = supabaseAdmin();

  // Expedientes para el selector del formulario (mismo diseño que ya tenías en cliente)
  const { data: exps } = await sb
    .from('expedientes')
    .select('id,codigo,proyecto')
    .order('codigo', { ascending: true });

  // Partes recientes (usar columnas reales: fecha, hora_inicio, hora_fin)
  const { data: partes, error } = await sb
    .from('partes')
    .select('id, fecha, hora_inicio, hora_fin, horas, comentario, expediente_id, tarea_id')
    .order('fecha', { ascending: false })
    .limit(100);

  if (error) {
    return (
      <main>
        <h2>Partes</h2>
        <p>Error al cargar: {error.message}</p>
      </main>
    );
  }

  // Mapa Expedientes (id → {codigo, proyecto})
  const mapExp = new Map<string, { codigo?: string|null; proyecto?: string|null }>();
  (exps || []).forEach(e => mapExp.set(e.id, { codigo: e.codigo, proyecto: e.proyecto }));

  // Si quieres nombre de tarea, cargamos títulos de las tareas referenciadas
  const tareaIds = Array.from(new Set((partes || [])
    .map(p => p.tarea_id)
    .filter((v): v is string => !!v)));
  let mapTar = new Map<string, string>();
  if (tareaIds.length) {
    const { data: tareas } = await sb
      .from('tareas')
      .select('id,titulo')
      .in('id', tareaIds);
    mapTar = new Map((tareas || []).map(t => [t.id, t.titulo]));
  }

  return (
    <main>
      <h2>Partes</h2>

      {/* El formulario interactivo lo tienes en el cliente (componente) */}
      {/* Si aquí tenías el mismo form, no lo toco. Dejamos esto como listado servidor. */}

      <section style={{ marginTop: 12, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Expediente</th>
              <th>Tarea</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Horas</th>
              <th>Comentario</th>
            </tr>
          </thead>
          <tbody>
            {(partes || []).map((p: any) => {
              const exp = p.expediente_id ? mapExp.get(p.expediente_id) : undefined;
              const tarea = p.tarea_id ? mapTar.get(p.tarea_id) : undefined;
              return (
                <tr key={p.id}>
                  <td>{fmtDate(p.fecha)}</td>
                  <td>
                    {exp?.codigo || '—'}
                    {exp?.proyecto ? ` — ${exp.proyecto}` : ''}
                  </td>
                  <td>{tarea || '—'}</td>
                  <td>{fmtTime(p.hora_inicio)}</td>
                  <td>{fmtTime(p.hora_fin)}</td>
                  <td>{typeof p.horas === 'number' ? p.horas.toFixed(2) : (p.horas ?? '—')}</td>
                  <td>{p.comentario || '—'}</td>
                </tr>
              );
            })}
            {(!partes || partes.length === 0) && (
              <tr><td colSpan={7}>Sin partes registrados.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
