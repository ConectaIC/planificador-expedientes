// src/components/NewExpedienteModal.tsx
// Tipo: Client Component

'use client';

import { useState, useTransition } from 'react';
import Modal from './Modal';
import { toast } from './toast'; // si no existe, sustituye por alert()

type Props = {
  onCreate: (formData: FormData) => Promise<void>;
};

export default function NewExpedienteModal({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const close = () => setOpen(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await onCreate(fd);
        // @ts-ignore si no tienes toast, usa alert
        toast ? toast.success('Expediente creado') : alert('Expediente creado');
        close();
      } catch (err: any) {
        // @ts-ignore
        toast ? toast.error(err?.message || 'Error al crear expediente') : alert(err?.message || 'Error al crear expediente');
      }
    });
  };

  const btnClass = 'inline-flex items-center gap-1 px-3 py-2 rounded-lg btn';

  return (
    <>
      <button className={btnClass} onClick={() => setOpen(true)} aria-label="Nuevo expediente">
        <span style={{ fontSize: 18 }}>➕</span> Nuevo
      </button>

      <Modal open={open} onClose={close} title="Nuevo expediente" widthClass="max-w-xl">
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Código *</label>
            <input name="codigo" required className="input" placeholder="CIC-2025-001" />
          </div>
          <div>
            <label className="block text-sm mb-1">Proyecto</label>
            <input name="proyecto" className="input" placeholder="Urbanización Calle X" />
          </div>
          <div>
            <label className="block text-sm mb-1">Cliente</label>
            <input name="cliente" className="input" placeholder="Ayuntamiento de ..." />
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="block text-sm mb-1">Inicio</label>
              <input type="date" name="inicio" className="input" />
            </div>
            <div>
              <label className="block text-sm mb-1">Fin</label>
              <input type="date" name="fin" className="input" />
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="block text-sm mb-1">Prioridad</label>
              <select name="prioridad" className="input">
                <option value=""></option>
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Estado</label>
              <select name="estado" className="input">
                <option value=""></option>
                <option value="Pendiente">Pendiente</option>
                <option value="En curso">En curso</option>
                <option value="En supervisión">En supervisión</option>
                <option value="Entregado">Entregado</option>
                <option value="Cerrado">Cerrado</option>
              </select>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="block text-sm mb-1">Horas previstas</label>
              <input name="horas_previstas" type="number" min="0" step="0.25" className="input" defaultValue="0" />
            </div>
            <div>
              <label className="block text-sm mb-1">Horas reales</label>
              <input name="horas_reales" type="number" min="0" step="0.25" className="input" defaultValue="0" />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={close} className="px-4 py-2 rounded-lg border">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg btn" disabled={isPending}>
              {isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
