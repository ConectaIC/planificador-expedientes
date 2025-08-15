// src/app/tareas/[id]/page.tsx
export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../../lib/supabaseAdmin';

type Params = { params: { id: string } };

export default async function TareaDetallePage({ params }: Params) {
  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return (
      <main>
        <div className="card" style={{ marginBottom: 12 }}>
          <h2>Tarea</h2>
        </div>
        <p className="error-state">ID de tarea no válido.</p>
        <p style={{ marginTop: 8 }}>
          <a href="/tareas" style={{ color: 'var(--cic-primary)' }}>← Volver al listado</a>
        </p>
      </main>
    );
  }

  const sb = supabaseAdmin();

  // 1) Tarea + expediente relacionado (campos confirmados)
  const { data: tarea, error: errTarea } = await sb
    .from('tareas')
    .select(`
      id,
      expediente_id,
      titulo,
      horas_previstas,
      horas_realizadas,
      estado,
      prioridad,
      vencimiento,
      expedientes ( codigo, proyecto, cliente )
    `)
    .eq('id', idNum)
    .single();

  if (errTarea || !tarea) {
    return (
      <main>
        <div className="card" style={{ marginBottom: 12 }}>
          <h2>Tarea</h2>
        </div>
        <p className="error-state">No se pudo cargar la tarea #{params.id}{errTarea ? `: ${errTarea.message}` : ''}</p>
        <p style={{ marginTop: 8 }}>
          <a href="/tareas" style={{ color: 'var(--cic-primary)' }}>← Volver al listado</a>
        </p>
      </main>
    );
  }

  // 2) Partes vinculados a la tarea (campos habituales)
  const { data: partes, error: errP } = await sb
    .from('partes')
    .select('id, fecha, horas, comentario')
    .eq('tarea_id', tarea.id)
    .order('fecha', { ascending: false });

  const box: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 };
  const th: React.CSSProperties = { textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid var(--cic-border)', background: '#f1f6ff' };
  const td: React.CSSProperties = { padding: '10px 8px', borderBottom: '1px solid var(--cic-border)' };
  const fmt2 = (n: any) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '—');

  const exp = tarea.expedientes as any;

  return (
    <main>
      <div className="card" style={{ marginBottom: 12 }}>
        <h2>Tarea · #{tarea.id}</h2>
      </div>

      <section className="card" style={{ marginBottom: 12 }}>
        <div style={box}>
          <div>
            <div style={{ opacity: .7, fontSize: '.9rem' }}>Título</div>
            <div style={{ fontWeight: 700 }}>{tarea.titulo || '—'}</div>
          </div>
          <div>
            <div style={{ opacity: .7, fontSize: '.9rem' }}>Estado</div>
            <div style={{ fontWeight: 700 }}>{tarea.estado || '—'}</div>
          </div>
          <div>
            <div style={{ opacity: .7, fontSize: '.9rem' }}>Prioridad</div>
            <div style={{ fontWeight: 700 }}>{tarea.prioridad || '—'}</div>
          </div>
          <div>
            <div style={{ opacity: .7, fontSize: '.9rem' }}>Vencimiento</div>
            <div style={{ fontWeight: 700 }}>{tarea.vencimiento || '—'}</div>
          </div>
          <div>
            <div style={{ opacity: .7, fontSize: '.9rem' }}>Horas previstas</div>
            <div style={{ fontWeight: 700 }}>{fmt2(tarea.horas_previstas)}</div>
          </div>
          <div>
            <div style={{ opacity: .7, fontSize: '.9rem' }}>Horas realizadas</div>
            <div style={{ fontWeight: 700 }}>{fmt2(tarea.horas_realizadas)}</div>
          </div>
          <div>
            <div style={{ opacity: .7, fontSize: '.9rem' }}>Expediente</div>
            <div style={{ fontWeight: 700 }}>
              {exp?.codigo ? (
                <a href={`/expedientes/${encodeURIComponent(String(exp.codigo))}`} style={{ color: 'var(--cic-primary)' }}>
                  [{exp.codigo}] {exp.proyecto || '—'}
                </a>
              ) : '—'}
            </div>
          </div>
          <div>
            <div style={{ opacity: .7, fontSize: '.9rem' }}>Cliente</div>
            <div style={{ fontWeight: 700 }}>{exp?.cliente || '—'}</div>
          </div>
        </div>
      </section>

      <div className="card" style={{ marginBottom: 8 }}>
        <h3>Partes vinculados</h3>
      </div>

      {errP ? (
        <p className="error-state">Error al cargar partes: {errP.message}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th style={th}>Fecha</th>
              <th style={th}>Horas</th>
              <th style={th}>Comentario</th>
            </tr>
          </thead>
          <tbody>
            {(partes || []).map((p) => (
              <tr key={p.id}>
                <td style={td}>{p.fecha || '—'}</td>
                <td style={td}>{fmt2(p.horas)}</td>
                <td style={td}>{p.comentario || '—'}</td>
              </tr>
            ))}
            {!partes?.length && (
              <tr><td colSpan={3} style={{ ...td, textAlign: 'center', opacity: .7 }}>Sin partes registrados para esta tarea.</td></tr>
            )}
          </tbody>
        </table>
      )}

      <p style={{ marginTop: 12 }}>
        <a href="/tareas" style={{ color: 'var(--cic-primary)' }}>← Volver a tareas</a>
      </p>
    </main>
  );
}
