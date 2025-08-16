'use client';

import { useState, FormEvent } from 'react';
import Modal from '@/components/Modal';
import { updateTareaAction, deleteTareaAction } from '@/app/tareas/actions';

export type Tarea = {
  id: number;
  expediente_id: number | null;
  titulo: string;
  vencimiento: string | null;
  prioridad: string | null;
  estado: string | null;
  horas_previstas: number | null;
  horas_realizadas?: number | null;
  tipo?: string | null;
  descripcion?: string | null;
};

export default function TareaRowActions({ tarea, onMutate }: { tarea: Tarea; onMutate?: () => void }) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submitEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setErr(null);
    try {
      await updateTareaAction(fd);
      setOpenEdit(false);
      onMutate?.();
    } catch (ex: any) {
      setErr(ex?.message ?? 'Error al guardar');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.set('id', String(tarea.id));
      await deleteTareaAction(fd);
      setOpenDel(false);
      onMutate?.();
    } catch (ex: any) {
      setErr(ex?.message ?? 'Error al borrar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button className="rounded-md border px-2 py-1 hover:bg-gray-50" title="Editar" onClick={() => setOpenEdit(true)}>✏️</button>
      <button className="rounded-md border px-2 py-1 hover:bg-gray-50" title="Borrar" onClick={() => setOpenDel(true)}>🗑️</button>

      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title={`Editar tarea`} widthClass="max-w-xl">
        <form onSubmit={submitEdit} className="space-y-3">
          <input type="hidden" name="id" value={tarea.id} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Título*</span>
              <input name="titulo" defaultValue={tarea.titulo} required className="rounded-md border px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Expediente (ID)</span>
              <input name="expediente_id" defaultValue={tarea.expediente_id ?? ''} className="rounded-md border px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Vencimiento</span>
              <input name="vencimiento" defaultValue={tarea.vencimiento ?? ''} className="rounded-md border px-3 py-2" placeholder="AAAA-MM-DD" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Horas previstas</span>
              <input name="horas_previstas" type="number" step="0.25" defaultValue={tarea.horas_previstas ?? 0} className="rounded-md border px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Prioridad</span>
              <input name="prioridad" defaultValue={tarea.prioridad ?? ''} className="rounded-md border px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Estado</span>
              <input name="estado" defaultValue={tarea.estado ?? ''} className="rounded-md border px-3 py-2" />
            </label>
            <label className="md:col-span-2 flex flex-col gap-1">
              <span className="text-sm">Descripción</span>
              <textarea name="descripcion" defaultValue={tarea.descripcion ?? ''} className="rounded-md border px-3 py-2" />
            </label>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpenEdit(false)} className="rounded-md border px-3 py-2">Cancelar</button>
            <button type="submit" disabled={busy} className="rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700 disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={openDel} onClose={() => setOpenDel(false)} title="Borrar tarea">
        <p className="mb-3">¿Seguro que quieres borrar esta tarea?</p>
        {err && <p className="text-sm text-red-600 mb-2">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setOpenDel(false)} className="rounded-md border px-3 py-2">Cancelar</button>
          <button type="button" disabled={busy} onClick={confirmDelete} className="rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:opacity-50">{busy ? 'Borrando…' : 'Borrar'}</button>
        </div>
      </Modal>
    </div>
  );
}
