'use client';
import { useState } from 'react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';

export type Parte = {
  id: string;
  fecha: string; // yyyy-mm-dd
  expediente: string;
  tarea: string | null;
  inicio: string; // HH:mm:ss
  fin: string;    // HH:mm:ss
  horas: number;
  comentario: string | null;
};

type Props = {
  partes: Parte[];
};

export default function PartesTabla({ partes }: Props) {
  const [edit, setEdit] = useState<Parte | null>(null);
  const [del, setDel] = useState<Parte | null>(null);

  async function onDelete(id: string) {
    const r = await fetch(`/api/partes/${id}`, { method: 'DELETE' });
    const j = await r.json();
    if (!r.ok || j.ok === false) alert(j.error || 'Error al borrar');
    else window.location.reload();
  }

  return (
    <>
      <table className="w-full border-separate border-spacing-y-1">
        <thead>
          <tr className="text-left text-sm text-gray-600">
            <th>Fecha</th>
            <th>Expediente</th>
            <th>Tarea</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Horas</th>
            <th>Comentario</th>
            <th className="w-[90px]">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {partes.map((p) => (
            <tr key={p.id} className="bg-white border rounded">
              <td className="px-2 py-1">
                {p.fecha.split('-').reverse().join('/')}
              </td>
              <td className="px-2">{p.expediente}</td>
              <td className="px-2">{p.tarea ?? '—'}</td>
              <td className="px-2">{p.inicio}</td>
              <td className="px-2">{p.fin}</td>
              <td className="px-2">{p.horas.toFixed(2)}</td>
              <td className="px-2">{p.comentario ?? '—'}</td>
              <td className="px-2">
                <div className="flex gap-2">
                  <button
                    title="Editar"
                    onClick={() => setEdit(p)}
                    className="px-2 py-1 rounded border"
                  >
                    ✏️
                  </button>
                  <button
                    title="Borrar"
                    onClick={() => setDel(p)}
                    className="px-2 py-1 rounded border"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {partes.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="text-center py-6 text-gray-500"
              >
                No hay partes
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {edit && (
        <ParteEditModal parte={edit} onClose={() => setEdit(null)} />
      )}

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        title="Borrar parte"
        message={`¿Borrar el parte del ${del?.fecha.split('-').reverse().join('/')}?`}
        confirmText="Borrar"
        onConfirm={() => del && onDelete(del.id)}
      />
    </>
  );
}

/* ------- Modal de edición de parte ------- */
function ParteEditModal({ parte, onClose }: { parte: Parte; onClose: () => void }) {
  const [form, setForm] = useState<Parte>(parte);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function upd<K extends keyof Parte>(k: K, v: Parte[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/partes/${form.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: form.fecha,
          expediente: form.expediente,
          tarea: form.tarea,
          inicio: form.inicio,
          fin: form.fin,
          horas: form.horas,
          comentario: form.comentario,
        }),
      });
      const j = await res.json();
      if (!res.ok || j.ok === false) throw new Error(j.error || 'Error al guardar');
      window.location.reload();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={true} onClose={onClose} title="Editar parte" widthClass="max-w-lg">
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Fecha</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={form.fecha}
            onChange={(e) => upd('fecha', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Expediente</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.expediente}
            onChange={(e) => upd('expediente', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Tarea</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.tarea ?? ''}
            onChange={(e) => upd('tarea', e.target.value || null)}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Inicio</label>
            <input
              type="time"
              step="1"
              className="w-full border rounded px-3 py-2"
              value={form.inicio}
              onChange={(e) => upd('inicio', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Fin</label>
            <input
              type="time"
              step="1"
              className="w-full border rounded px-3 py-2"
              value={form.fin}
              onChange={(e) => upd('fin', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Horas</label>
            <input
              type="number"
              step="0.25"
              min="0"
              className="w-full border rounded px-3 py-2"
              value={form.horas}
              onChange={(e) => upd('horas', Number(e.target.value))}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Comentario</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            value={form.comentario ?? ''}
            onChange={(e) => upd('comentario', e.target.value || null)}
          />
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border"
          >
            Cancelar
          </button>
          <button
            disabled={busy}
            className="px-4 py-2 rounded bg-[var(--cic-primary)] text-white"
          >
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
