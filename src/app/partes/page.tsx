'use client';
import { useEffect, useMemo, useState } from 'react';

type Exp = { id: string; codigo: string; proyecto: string };

export default function PartesPage() {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [exps, setExps] = useState<Exp[]>([]);
  const [inicio, setInicio] = useState<string>('');
  const [fin, setFin] = useState<string>('');
  const [horas, setHoras] = useState<string>('');

  // fecha por defecto: hoy
  const hoy = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }, []);

  // cargar expedientes para el desplegable
  useEffect(() => {
    (async () => {
      const r = await fetch('/api/expedientes', { cache: 'no-store' });
      const j = await r.json();
      if (j?.ok) setExps(j.data as Exp[]);
    })();
  }, []);

  // calcular horas si hay inicio y fin (y no has escrito manualmente)
  useEffect(() => {
    if (inicio && fin) {
      const [h1, m1] = inicio.split(':').map(Number);
      const [h2, m2] = fin.split(':').map(Number);
      if (!isNaN(h1) && !isNaN(h2)) {
        let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (mins < 0) mins += 24 * 60; // por si pasa de medianoche (raro, pero seguro)
        const h = Math.round((mins / 60) * 100) / 100;
        // si el usuario no ha escrito horas manualmente, autocompleta
        if (!horas) setHoras(String(h));
      }
    }
  }, [inicio, fin]); // eslint-disable-line

  async function onSubmit(e: any) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const form = new FormData(e.currentTarget);
    // si no hay "horas" pero sí inicio/fin, acordarse de meterlas en el payload
    if (!form.get('horas') && horas) form.set('horas', horas);

    const payload = Object.fromEntries(form.entries());
    const res = await fetch('/api/partes', { method: 'POST', body: JSON.stringify(payload) });
    const j = await res.json();
    setSaving(false);
    setMsg(j.ok ? '✔ Parte guardado' : 'Error: ' + j.error);
    if (j.ok) {
      (e.target as HTMLFormElement).reset();
      setInicio(''); setFin(''); setHoras('');
    }
  }

  return (
    <main>
      <h2>Imputación de horas</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
        <label>Fecha <input type="date" name="fecha" defaultValue={hoy} required /></label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label>Inicio <input type="time" name="inicio" value={inicio} onChange={e=>setInicio(e.target.value)} /></label>
          <label>Fin <input type="time" name="fin" value={fin} onChange={e=>setFin(e.target.value)} /></label>
        </div>

        <label>Horas
          <input
            type="number" name="horas" step="0.25" min="0"
            placeholder="Se calcula con Inicio/Fin"
            value={horas}
            onChange={e=>setHoras(e.target.value)}
          />
        </label>

        <label>Expediente
          <select name="expediente" required defaultValue="">
            <option value="" disabled>— Selecciona expediente —</option>
            {exps.map(x => (
              <option key={x.id} value={x.codigo}>
                {x.codigo} — {x.proyecto}
              </option>
            ))}
          </select>
        </label>

        <label>Comentario
          <textarea name="comentario" placeholder="Descripción breve" rows={4} />
        </label>

        <button disabled={saving} type="submit">{saving ? 'Guardando…' : 'Guardar'}</button>
        {msg && <p>{msg}</p>}
      </form>
    </main>
  );
}
