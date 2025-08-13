'use client';
import { useEffect, useMemo, useState } from 'react';

type Exp = { id: string; codigo: string; proyecto: string };
type Tarea = { id: string; titulo: string };

export default function PartesPage() {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [exps, setExps] = useState<Exp[]>([]);
  const [filtro, setFiltro] = useState<string>('');
  const [tareas, setTareas] = useState<Tarea[]>([]);

  const [inicio, setInicio] = useState<string>('');
  const [fin, setFin] = useState<string>('');
  const [horas, setHoras] = useState<string>('');
  const [horasBloqueadas, setHorasBloqueadas] = useState<boolean>(false);

  const [partes, setPartes] = useState<any[]>([]);

  // fecha por defecto: hoy
  const hoy = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }, []);

  // cargar expedientes
  useEffect(() => {
    (async () => {
      const r = await fetch('/api/expedientes', { cache: 'no-store' });
      const j = await r.json();
      if (j?.ok) setExps(j.data as Exp[]);
    })();
  }, []);

  // cargar partes recientes
  async function cargaPartes() {
    const r = await fetch('/api/partes?limit=100', { cache: 'no-store' });
    const j = await r.json();
    if (j?.ok) setPartes(j.data);
  }
  useEffect(() => { cargaPartes(); }, []);

  // Expedientes filtrados
  const expsFiltrados = useMemo(() => {
    const n = filtro.trim().toLowerCase();
    if (!n) return exps;
    return exps.filter(x =>
      x.codigo.toLowerCase().includes(n) ||
      (x.proyecto || '').toLowerCase().includes(n)
    );
  }, [exps, filtro]);

  // Cargar tareas al elegir expediente
  async function onExpedienteChange(codigo: string) {
    if (!codigo) { setTareas([]); return; }
    const rt = await fetch(`/api/expediente-tareas?codigo=${encodeURIComponent(codigo)}`, { cache: 'no-store' });
    const jt = await rt.json();
    if (jt?.ok) setTareas(jt.data as Tarea[]);
    else setTareas([]);
  }

  // Redondear a 15 min
  function norm15(value: string) {
    if (!value) return value;
    const [h, m] = value.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return value;
    const q = Math.round(m / 15) * 15;
    const mm = String(q === 60 ? 0 : q).padStart(2, '0');
    const hh = String((h + (q === 60 ? 1 : 0)) % 24).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // Recalcular horas cuando cambien inicio/fin (si el usuario no las “bloquea”)
  useEffect(() => {
    if (!horasBloqueadas && inicio && fin) {
      const i = norm15(inicio);
      const f = norm15(fin);
      if (i !== inicio) setInicio(i);
      if (f !== fin) setFin(f);
      const [h1, m1] = i.split(':').map(Number);
      const [h2, m2] = f.split(':').map(Number);
      if (!isNaN(h1) && !isNaN(h2)) {
        let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (mins < 0) mins += 24 * 60;
        const h = Math.round((mins / 60) * 100) / 100;
        setHoras(String(h));
      }
    }
  }, [inicio, fin]); // eslint-disable-line

  async function onSubmit(e: any) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const form = new FormData(e.currentTarget);
    if (!form.get('horas') && horas) form.set('horas', horas);
    const payload = Object.fromEntries(form.entries());
    const res = await fetch('/api/partes', { method: 'POST', body: JSON.stringify(payload) });
    const j = await res.json();
    setSaving(false);
    setMsg(j.ok ? '✔ Parte guardado' : 'Error: ' + j.error);
    if (j.ok) {
      (e.target as HTMLFormElement).reset();
      setInicio(''); setFin(''); setHoras(''); setHorasBloqueadas(false);
      setFiltro(''); setTareas([]);
      await cargaPartes(); // refrescar tabla
    }
  }

  return (
    <main>
      <h2>Imputación de horas</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 560 }}>
        <label>Fecha <input type="date" name="fecha" defaultValue={hoy} required /></label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label>Inicio
            <input type="time" name="inicio" step={900}
              value={inicio} onChange={e=>{ setInicio(e.target.value); setHorasBloqueadas(false); }} />
          </label>
          <label>Fin
            <input type="time" name="fin" step={900}
              value={fin} onChange={e=>{ setFin(e.target.value); setHorasBloqueadas(false); }} />
          </label>
        </div>

        <label>Horas
          <input
            type="number" name="horas" step="0.25" min="0"
            placeholder="Se calcula con Inicio/Fin"
            value={horas}
            onChange={e=>{ setHoras(e.target.value); setHorasBloqueadas(true); }}
          />
        </label>

        <div style={{ display:'grid', gap:6 }}>
          <small style={{opacity:.8}}>Filtrar expedientes por código o proyecto</small>
          <input placeholder="Escribe para filtrar…"
            value={filtro} onChange={e=>setFiltro(e.target.value)} />
        </div>

        <label>Expediente
          <select name="expediente" required defaultValue="" onChange={e=>onExpedienteChange(e.target.value)}>
            <option value="" disabled>— Selecciona expediente —</option>
            {expsFiltrados.map(x => (
              <option key={x.id} value={x.codigo}>{x.codigo} — {x.proyecto}</option>
            ))}
          </select>
        </label>

        {tareas.length > 0 && (
          <label>Tarea (opcional)
            <select name="tarea_id" defaultValue="">
              <option value="">— Sin asignar a tarea —</option>
              {tareas.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
            </select>
          </label>
        )}

        <label>Comentario
          <textarea name="comentario" placeholder="Descripción breve" rows={6} />
        </label>

        <button disabled={saving} type="submit">{saving ? 'Guardando…' : 'Guardar'}</button>
        {msg && <p>{msg}</p>}
      </form>

      <h3 style={{marginTop:24}}>Partes recientes</h3>
      <table>
        <thead>
          <tr>
            <th>Fecha</th><th>Expediente</th><th>Tarea</th><th>Inicio</th><th>Fin</th><th>Horas</th><th>Comentario</th>
          </tr>
        </thead>
        <tbody>
          {partes.length ? partes.map((p:any)=>(
            <tr key={p.id}>
              <td>{p.fecha ? new Date(p.fecha).toLocaleDateString('es-ES') : '—'}</td>
              <td>{p.expediente ? `${p.expediente} — ${p.proyecto||''}` : '—'}</td>
              <td>{p.tarea || '—'}</td>
              <td>{p.hora_inicio || '—'}</td>
              <td>{p.hora_fin || '—'}</td>
              <td>{(p.horas ?? 0).toFixed?.(2) ?? p.horas}</td>
              <td>{p.comentario || '—'}</td>
            </tr>
          )) : <tr><td colSpan={7}>Sin partes aún.</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
