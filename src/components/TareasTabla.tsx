'use client';
import { useMemo, useState } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';

export type Tarea = {
  id: string;
  titulo: string|null;
  estado: 'Pendiente'|'En curso'|'Completada';
  prioridad: 'Alta'|'Media'|'Baja'|null;
  vencimiento: string|null;          // yyyy-mm-dd
  horas_previstas: number|null;
  horas_realizadas: number|null;
};

type Props = {
  tareas: Tarea[];
  expedienteId: string;
};

export default function TareasTabla({ tareas, expedienteId }: Props) {
  const [edit, setEdit] = useState<Tarea|null>(null);
  const [del, setDel] = useState<Tarea|null>(null);

  const rows = useMemo(()=> (tareas || []).slice().sort((a,b)=>{
    const da = a.vencimiento ?? ''; const db = b.vencimiento ?? '';
    return da.localeCompare(db);
  }),[tareas]);

  async function onDelete(id: string) {
    const r = await fetch(`/api/tareas/${id}`, { method: 'DELETE' });
    const j = await r.json();
    if (!r.ok || j.ok === false) alert(j.error || 'Error al borrar');
    else window.location.reload();
  }

  return (
    <>
      <table className="w-full border-separate border-spacing-y-1">
        <thead>
          <tr className="text-left text-sm text-gray-600">
            <th>Título</th><th>Estado</th><th>Prioridad</th><th>Vencimiento</th>
            <th>Previstas (h)</th><th>Realizadas (h)</th><th>%</th><th className="w-[90px]">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(t =>
            <tr key={t.id} className="bg-white border rounded">
              <td className="py-2 px-2">{t.titulo ?? '—'}</td>
              <td className="px-2">{t.estado}</td>
              <td className="px-2">{t.prioridad ?? '—'}</td>
              <td className="px-2">{t.vencimiento ? t.vencimiento.split('-').reverse().join('/') : '—'}</td>
              <td className="px-2">{(t.horas_previstas ?? 0).toFixed(2)}</td>
              <td className="px-2">{(t.horas_realizadas ?? 0).toFixed(2)}</td>
              <td className="px-2">
                {((t.horas_realizadas ?? 0) && (t.horas_previstas ?? 0))
                  ? Math.min(100, Math.round(((t.horas_realizadas ?? 0)/(t.horas_previstas ?? 1))*100))+'%'
                  : '0%'}
              </td>
              <td className="px-2">
                <div className="flex gap-2">
                  <button title="Editar" onClick={()=>setEdit(t)} className="px-2 py-1 rounded border">✏️</button>
                  <button title="Borrar" onClick={()=>setDel(t)}  className="px-2 py-1 rounded border">🗑️</button>
                </div>
              </td>
            </tr>
          )}
          {rows.length === 0 && (
            <tr><td colSpan={8} className="text-center py-6 text-gray-500">No hay tareas</td></tr>
          )}
        </tbody>
      </table>

      {edit && (
        <TareaEditModal
          tarea={edit}
          expedienteId={expedienteId}
          onClose={()=>setEdit(null)}
        />
      )}

      <ConfirmDialog
        open={!!del}
        onClose={()=>setDel(null)}
        title="Borrar tarea"
        message={`¿Borrar la tarea "${del?.titulo ?? ''}"? Esta acción no se puede deshacer.`}
        confirmText="Borrar"
        onConfirm={()=> del && onDelete(del.id)}
      />
    </>
  );
}

/* -------- Modal de edición de tarea -------- */
function TareaEditModal({ tarea, expedienteId, onClose }:{
  tarea: Tarea, expedienteId: string, onClose: ()=>void
}) {
  const [form, setForm] = useState<Tarea>(tarea);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  function upd<K extends keyof Tarea>(k: K, v: Tarea[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/tareas/${form.id}`, {
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          titulo: form.titulo,
          estado: form.estado,
          prioridad: form.prioridad,
          vencimiento: form.vencimiento,
          horas_previstas: form.horas_previstas ?? 0,
          horas_realizadas: form.horas_realizadas ?? 0
        })
      });
      const j = await res.json();
      if (!res.ok || j.ok === false) throw new Error(j.error || 'Error al guardar');
      window.location.reload();
    } catch(e:any){ setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <Modal open={true} onClose={onClose} title="Editar tarea" widthClass="max-w-lg">
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Título</label>
          <input className="w-full border rounded px-3 py-2"
                 value={form.titulo ?? ''} onChange={e=>upd('titulo', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Estado</label>
            <select className="w-full border rounded px-3 py-2"
                    value={form.estado}
                    onChange={e=>upd('estado', e.target.value as Tarea['estado'])}>
              <option>Pendiente</option>
              <option>En curso</option>
              <option>Completada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Prioridad</label>
            <select className="w-full border rounded px-3 py-2"
                    value={form.prioridad ?? ''}
                    onChange={e=>upd('prioridad', (e.target.value || null) as Tarea['prioridad'])}>
              <option value="">—</option>
              <option>Alta</option><option>Media</option><option>Baja</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Vencimiento</label>
            <input type="date" className="w-full border rounded px-3 py-2"
                   value={form.vencimiento ?? ''} onChange={e=>upd('vencimiento', e.target.value || null)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Previstas (h)</label>
            <input type="number" step="0.25" min="0" className="w-full border rounded px-3 py-2"
                   value={form.horas_previstas ?? 0} onChange={e=>upd('horas_previstas', Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Realizadas (h)</label>
            <input type="number" step="0.25" min="0" className="w-full border rounded px-3 py-2"
                   value={form.horas_realizadas ?? 0} onChange={e=>upd('horas_realizadas', Number(e.target.value))} />
          </div>
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancelar</button>
          <button disabled={busy} className="px-4 py-2 rounded bg-[var(--cic-primary)] text-white">
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
