'use client';
import { useState } from 'react';
import Modal from './Modal';

const PRIORIDADES = ['Alta','Media','Baja', ''];
const ESTADOS = ['Pendiente','En curso','En Supervisión','Entregado','Cerrado'];

export type ExpedienteData = {
  id: string;
  codigo: string|null;
  proyecto: string|null;
  cliente: string|null;
  fin: string|null;           // yyyy-mm-dd
  prioridad: string|null;
  estado: string|null;
};

type Props = {
  open: boolean;
  expediente: ExpedienteData;
  onClose: () => void;
  onSaved?: () => void; // callback tras guardar
};

export default function ExpedienteEditModal({ open, expediente, onClose, onSaved }: Props) {
  const [form, setForm] = useState<ExpedienteData>(expediente);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  function upd<K extends keyof ExpedienteData>(k: K, v: ExpedienteData[K]) {
    setForm(f => ({ ...f, [k]: v ?? null }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/expedientes/${form.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          codigo: form.codigo ?? null,
          proyecto: form.proyecto ?? null,
          cliente: form.cliente ?? null,
          fin: form.fin ?? null,
          prioridad: form.prioridad ?? null,
          estado: form.estado ?? null
        })
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'Error al guardar');
      onSaved?.();
      onClose();
      // refrescamos lista
      window.location.reload();
    } catch (e:any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Editar expediente ${expediente.codigo ?? ''}`}>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Código</label>
          <input className="w-full border rounded px-3 py-2" value={form.codigo ?? ''} onChange={e=>upd('codigo', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Proyecto</label>
          <input className="w-full border rounded px-3 py-2" value={form.proyecto ?? ''} onChange={e=>upd('proyecto', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Cliente</label>
          <input className="w-full border rounded px-3 py-2" value={form.cliente ?? ''} onChange={e=>upd('cliente', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Fin</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={form.fin ?? ''} onChange={e=>upd('fin', e.target.value || null)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Prioridad</label>
            <select className="w-full border rounded px-3 py-2" value={form.prioridad ?? ''} onChange={e=>upd('prioridad', e.target.value || null)}>
              <option value="">—</option>
              {PRIORIDADES.slice(0,3).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Estado</label>
            <select className="w-full border rounded px-3 py-2" value={form.estado ?? ''} onChange={e=>upd('estado', e.target.value || null)}>
              {ESTADOS.map(s => <option key={s} value={s}>{s || '—'}</option>)}
            </select>
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
