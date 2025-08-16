'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';

export type Expediente = {
  id: number;
  codigo: string;
  cliente?: string | null;
  proyecto?: string | null;
};

type Props = {
  expediente: Expediente;
  /** Opcional: callback para guardar edición */
  onUpdate?: (form: FormData) => Promise<void> | void;
  /** Opcional: callback para borrar */
  onDelete?: (id: number) => Promise<void> | void;
};

export default function ExpedienteRowActions({
  expediente,
  onUpdate,
  onDelete,
}: Props) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submitEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!onUpdate) {
      // Sin callback: solo cerrar para no romper build
      setOpenEdit(false);
      return;
    }
    try {
      setBusy(true);
      setErr(null);
      const fd = new FormData(e.currentTarget);
      await onUpdate(fd);
      setOpenEdit(false);
    } catch (error: any) {
      setErr(error?.message ?? 'Error al guardar');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!onDelete) {
      // Sin callback: solo cerrar para no romper build
      setOpenDelete(false);
      return;
    }
    try {
      setBusy(true);
      setErr(null);
      await onDelete(expediente.id);
      setOpenDelete(false);
    } catch (error: any) {
      setErr(error?.message ?? 'Error al borrar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Editar */}
      <button
        type="button"
        className="px-2 py-1 rounded hover:bg-gray-100"
        title="Editar"
        aria-label="Editar"
        onClick={() => setOpenEdit(true)}
      >
        ✏️
      </button>

      {/* Borrar */}
      <button
        type="button"
        className="px-2 py-1 rounded hover:bg-gray-100"
        title="Borrar"
        aria-label="Borrar"
        onClick={() => setOpenDelete(true)}
      >
        🗑️
      </button>

      {/* Modal edición */}
      <Modal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        title={`Editar ${expediente.codigo}`}
        widthClass="max-w-xl"
      >
        <form onSubmit={submitEdit} className="space-y-3">
          <input type="hidden" name="id" value={expediente.id} />
          <div>
            <label className="block text-sm font-medium mb-1">Código</label>
            <input
              name="codigo"
              defaultValue={expediente.codigo}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cliente</label>
            <input
              name="cliente"
              defaultValue={expediente.cliente ?? ''}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Proyecto</label>
            <input
              name="proyecto"
              defaultValue={expediente.proyecto ?? ''}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {err && (
            <p className="text-sm text-red-600" role="alert">
              {err}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpenEdit(false)}
              className="px-3 py-2 rounded border"
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-2 rounded bg-emerald-600 text-white"
              disabled={busy}
            >
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal borrar */}
      <Modal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        title={`Borrar ${expediente.codigo}`}
        widthClass="max-w-md"
      >
        <div className="space-y-4">
          <p>
            ¿Seguro que quieres borrar el expediente{' '}
            <strong>{expediente.codigo}</strong>?
          </p>

          {err && (
            <p className="text-sm text-red-600" role="alert">
              {err}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpenDelete(false)}
              className="px-3 py-2 rounded border"
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="px-3 py-2 rounded bg-red-600 text-white"
              disabled={busy}
            >
              {busy ? 'Borrando…' : 'Borrar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
