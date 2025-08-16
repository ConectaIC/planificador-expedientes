// src/components/ClientCreateExpediente.tsx
'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';

type Props = {
  action: (fd: FormData) => Promise<void>;
};

export default function ClientCreateExpediente({ action }: Props) {
  const [open, setOpen] = useState(false);

  async function onSubmit(formData: FormData) {
    await action(formData);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Nuevo expediente"
        className="btn-icon"
        onClick={() => setOpen(true)}
        title="Nuevo expediente"
      >
        {/* Sólo emoji */}
        ➕
      </button>

      {open && (
        <Modal open onClose={() => setOpen(false)} title="Nuevo expediente">
          <form action={onSubmit} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Código</label>
              <input name="codigo" className="input" required />
            </div>

            <div>
              <label className="block text-sm mb-1">Proyecto</label>
              <input name="proyecto" className="input" required />
            </div>

            <div>
              <label className="block text-sm mb-1">Cliente</label>
              <input name="cliente" className="input" />
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="block text-sm mb-1">Inicio</label>
                <input name="inicio" type="date" className="input" />
              </div>
              <div>
                <label className="block text-sm mb-1">Fin</label>
                <input name="fin" type="date" className="input" />
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="block text-sm mb-1">Prioridad</label>
                <select name="prioridad" className="input">
                  <option value="">(sin especificar)</option>
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Estado</label>
                <select name="estado" className="input">
                  <option value="">(sin especificar)</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En curso">En curso</option>
                  <option value="En supervisión">En supervisión</option>
                  <option value="Entregado">Entregado</option>
                  <option value="Cerrado">Cerrado</option>
                </select>
              </div>
            </div>

            <div className="flex" style={{ gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
