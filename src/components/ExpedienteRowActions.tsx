'use client';

import { useState, FormEvent } from 'react';
import Modal from '@/components/Modal';
import { updateExpedienteAction, deleteExpedienteAction } from '@/app/expedientes/actions';

export type Expediente = {
  id: number;
  codigo: string;
  proyecto: string | null;
  cliente: string | null;
  prioridad: string | null;
  estado: string | null;
  fin: string | null;
};

type Props = {
  expediente: Expediente;
  onUpdate?: () => void;
  onDelete?: () => void;
};

export default function ExpedienteRowActions({ expediente, onUpdate, onDelete }: Props) {
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
      await updateExpedienteAction(fd);
      setOpenEdit(false);
      onUpdate?.();
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
      fd.set('id', String(expediente.id));
      await deleteExpedienteAction(fd);
      setOpenDel(false);
      onDelete?.();
    } catch (ex: any) {
      setErr(ex?.message ?? 'Error al borrar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 justify-center">
      <button
        type="button"
        className="rounded-md border px-2 py-1 hover:bg-gray-50"
        title="Editar"
        onClick={() => setOpenEdit(true)}
      >
        ✏️
      </button>
      <button
        type="button"
        className="rounded-md border px-2 py-1 hover:bg-gray-50"
        title="Borrar"
        onClick={() => setOpenDel(true)}
      >
        🗑️
      </button>

      {/* Editar */}
      <Modal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        title={`Editar ${expediente.codigo}`}
        widthClass="max-w-xl"
      >
        <form onSubmit={submitEdit} className="space-y-3">
          <input type="hidden" name="id" value={expediente.id} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Código</span>
              <input
                name="codigo"
                defaultValue={expediente.codigo}
                className="rounded-md border px-3 py-2"
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Cliente</span>
              <input
                name="cliente"
                defaultValue={expediente.cliente ?? ''}
                className="rounded-md border px-3 py-2"
              />
            </label>
            <label className="md:col-span-2 flex flex-col gap-1">
              <span className="text-sm">Proyecto</span>
              <input
                name="proyecto"
                defaultValue={expediente.proyecto ?? ''}
                className="rounded-md border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Prioridad</span>
              <input
                name="prioridad"
                defaultValue={expediente.prioridad ?? ''}
                className="rounded-md border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Estado</span>
              <input
                name="estado"
                defaultValue={expediente.estado ?? ''}
                className="rounded-md border px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Fin (AAAA-MM-DD)</span>
              <input
                name="fin"
                defaultValue={expediente.fin ?? ''}
                placeholder="2025-12-31"
                className="rounded-md border px-3 py-2"
              />
            </label>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpenEdit(false)} className="rounded-md border px-3 py-2">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Borrar */}
      <Modal
        open={openDel}
        onClose={() => setOpenDel(false)}
        title={`Borrar ${expediente.codigo}`}
      >
        <p className="mb-3">¿Seguro que quieres borrar este expediente? Esta acción no se puede deshacer.</p>
        {err && <p className="text-sm text-red-600 mb-2">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setOpenDel(false)} className="rounded-md border px-3 py-2">
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={confirmDelete}
            className="rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? 'Borrando…' : 'Borrar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
