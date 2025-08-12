'use client';
import { useEffect, useMemo, useState } from 'react';

type AgendaItem = {
  id: string;
  fecha: string;     // YYYY-MM-DD
  tramo: 'mañana' | 'tarde';
  tipo: 'Expediente' | 'RRSS' | 'Gestión' | 'Admon' | 'Visita DO';
  horas: number;
  expediente_id?: string | null;
  notas?: string | null;
  expediente_codigo?: string; // sólo UI
};
type ExpLite = { id: string; codigo: string; proyecto: string };

function ymd(d: Date) {
  const z = (n:number)=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

export default function AgendaSemana() {
  const [inicio, setInicio] = useState<Date>(() => {
    const d = new Date(); // lunes de esta semana
    const wd = (d.getDay()+6)%7; d.setDate(d.getDate()-wd);
    return d;
  });
  const [capacidadDia, setCapacidadDia] = useState<number>(6);
  const [usarTarde, setUsarTarde] = useState<boolean>(false);

  const [items, setItems] = useState<AgendaItem[]>([]);
  const [exps, setExps] = useState<ExpLite[]>([]);
  const [form, setForm] = useState({
    fecha: '', tramo: 'mañana', tipo: 'Expediente', horas: '1',
    expediente_codigo: '', notas: ''
  });

  const dias = useMemo(() => Array.from({length:7}, (_,i)=>addDays(inicio,i)), [inicio]);
  const rango = useMemo(()=>({start: ymd(dias[0]), end: ymd(dias[6])}), [dias]);

  // cargar agenda de la semana
  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/agenda?start=${rango.start}&end=${rango.end}`, { cache: 'no-store' });
      const j = await r.json();
      if (j?.ok) setItems(j.data);
    })();
  }, [rango.start, rango.end]);

  // cargar expedientes para el selector
  useEffect(() => {
    (async () => {
      const r = await fetch('/api/expedientes', { cache: 'no-store' });
      const j = await r.json();
      if (j?.ok) setExps(j.data);
    })();
  }, []);

  // helpers
  function horasDia(d: Date, tramo: 'mañana'|'tarde'|'ambos'='ambos') {
    const f = ymd(d);
    return items
      .filter(x => x.fecha.slice(0,10) === f && (tramo==='ambos' || x.tramo===tramo))
      .reduce((s,x)=>s+(Number(x.horas)||0), 0);
  }
  function libreDia(d: Date) {
    const h = horasDia(d,'ambos');
    return Math.max(0, capacidadDia - h);
  }
  function setInicioDesdeInput(v: string) {
    const nd = new Date(v);
    if (!isNaN(+nd)) setInicio(nd);
  }

  async function addItem(e:any) {
    e.preventDefault();
    const body = {
      fecha: form.fecha || ymd(dias[0]),
      tramo: form.tramo,
      tipo: form.tipo,
      horas: form.horas,
      expediente_codigo: form.tipo==='Expediente' ? form.expediente_codigo : undefined,
      notas: form.notas || undefined
    };
    const res = await fetch('/api/agenda', { method:'POST', body: JSON.stringify(body) });
    const j = await res.json();
    if (j.ok) {
      // recargar semana
      const r = await fetch(`/api/agenda?start=${rango.start}&end=${rango.end}`, { cache: 'no-store' });
      const jj = await r.json();
      if (jj?.ok) setItems(jj.data);
      // reset suave
      setForm(f=>({ ...f, horas:'1', notas:'' }));
    } else {
      alert('Error: '+j.error);
    }
  }

  async function delItem(id:string) {
    if (!confirm('¿Eliminar bloque?')) return;
    const r = await fetch(`/api/agenda/${id}`, { method:'DELETE' });
    const j = await r.json();
    if (j.ok) setItems(prev=>prev.filter(x=>x.id!==id));
    else alert('Error: '+j.error);
  }

  return (
    <div style={{ display:'grid', gap:16 }}>
      <section style={{ display:'grid', gap:8 }}>
        <h2>Agenda semanal</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8 }}>
          <label>Semana que empieza en
            <input type="date" value={ymd(inicio)} onChange={e=>setInicioDesdeInput(e.target.value)} />
          </label>
          <label>Capacidad diaria (h)
            <select value={capacidadDia} onChange={e=>setCapacidadDia(Number(e.target.value))}>
              <option value={6}>6 h</option>
              <option value={8}>8 h</option>
              <option value={10}>10 h</option>
            </select>
          </label>
          <label><input type="checkbox" checked={usarTarde} onChange={e=>setUsarTarde(e.target.checked)} /> Usar tarde (17–20)</label>
          <div />
        </div>
      </section>

      <section style={{ overflowX:'auto' }}>
        <table>
          <thead>
            <tr>
              {dias.map(d=>(
                <th key={d.toISOString()} style={{ minWidth: 180 }}>
                  {d.toLocaleDateString('es-ES', { weekday:'short', day:'2-digit', month:'2-digit' })}
                  <div style={{ fontSize:12, opacity:.7 }}>
                    Ocupado: {horasDia(d,'ambos').toFixed(2)} h · Libre: {libreDia(d).toFixed(2)} h
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* mañana */}
            <tr>
              {dias.map(d=>{
                const f = ymd(d);
                const lista = items.filter(x=>x.fecha.slice(0,10)===f && x.tramo==='mañana');
                return (
                  <td key={f+'m'}>
                    <strong>Mañana</strong>
                    <ul style={{paddingLeft:16}}>
                      {lista.map(x=>(
                        <li key={x.id}>
                          {x.tipo}{x.tipo==='Expediente'?' · ':''}
                          {x.notas || ''}
                          {x.horas?` (${x.horas} h)`:''}
                          {' '}
                          <button onClick={()=>delItem(x.id)}>Eliminar</button>
                        </li>
                      ))}
                      {lista.length===0 && <li style={{opacity:.7}}>—</li>}
                    </ul>
                  </td>
                );
              })}
            </tr>
            {/* tarde opcional */}
            {usarTarde && (
              <tr>
                {dias.map(d=>{
                  const f = ymd(d);
                  const lista = items.filter(x=>x.fecha.slice(0,10)===f && x.tramo==='tarde');
                  return (
                    <td key={f+'t'}>
                      <strong>Tarde</strong>
                      <ul style={{paddingLeft:16}}>
                        {lista.map(x=>(
                          <li key={x.id}>
                            {x.tipo}{x.tipo==='Expediente'?' · ':''}
                            {x.notas || ''}
                            {x.horas?` (${x.horas} h)`:''}
                            {' '}
                            <button onClick={()=>delItem(x.id)}>Eliminar</button>
                          </li>
                        ))}
                        {lista.length===0 && <li style={{opacity:.7}}>—</li>}
                      </ul>
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Añadir bloque</h3>
        <form onSubmit={addItem} style={{ display:'grid', gap:8, maxWidth:640 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8 }}>
            <label>Fecha
              <input type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})} required />
            </label>
            <label>Tramo
              <select value={form.tramo} onChange={e=>setForm({...form,tramo:e.target.value as any})}>
                <option value="mañana">Mañana</option>
                {usarTarde && <option value="tarde">Tarde</option>}
              </select>
            </label>
            <label>Tipo
              <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value as any})}>
                <option>Expediente</option>
                <option>RRSS</option>
                <option>Gestión</option>
                <option>Admon</option>
                <option>Visita DO</option>
              </select>
            </label>
            <label>Horas
              <input type="number" step="0.25" min="0.25" value={form.horas} onChange={e=>setForm({...form,horas:e.target.value})} />
            </label>
          </div>

          {form.tipo==='Expediente' && (
            <label>Expediente
              <select value={form.expediente_codigo} onChange={e=>setForm({...form,expediente_codigo:e.target.value})} required>
                <option value="">— Selecciona —</option>
                {exps.map(x => <option key={x.id} value={x.codigo}>{x.codigo} — {x.proyecto}</option>)}
              </select>
            </label>
          )}

          <label>Notas
            <input value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} placeholder="p.ej. Predim. bombeo 25.107PR" />
          </label>

          <div style={{ fontSize:12, opacity:.8 }}>
            Consejo: intenta no superar la capacidad diaria. El cuadro superior te muestra **Ocupado** y **Libre** por día.
          </div>

          <button type="submit">Añadir a agenda</button>
        </form>
      </section>
    </div>
  );
}
