'use client';

import { useState, FormEvent } from 'react';
import Modal from '@/components/Modal';
import { createExpedienteAction } from '@/app/expedientes/actions';

export default function NewExpedienteButton({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setErr(null);
    try {
      await createExpedienteAction(fd);
      setOpen(false);
      onCreated?.();
    } catch (ex: any) {
      setErr(ex?.message ?? 'Error al crear');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="rounded-md border px-2 py-1 hover:bg-gray-50"
        title="Nuevo expediente"
        onClick={() => setOpen(true)}
      >
        ➕
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo expediente" widthClass="max-w-xl">
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm">Código*</span>
              <input name="codigo" required className="rounded-md border px-3 py-2" placeholder="25.999DT…" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Cliente</span>
              <input name="cliente" className="rounded-md border px-3 py-2" />
            </label>
            <label className="md:col-span-2 flex flex-col gap-1">
              <span className="text-sm">Proyecto</span>
              <input name="proyecto" className="rounded-md border px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Prioridad</span>
              <input name="prioridad" className="rounded-md border px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Estado</span>
              <input name="estado" className="rounded-md border px-3 py-2" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm">Fin (AAAA-MM-DD)</span>
              <input name="fin" placeholder="2025-12-31" className="rounded-md border px-3 py-2" />
            </label>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-md border px-3 py-2">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
