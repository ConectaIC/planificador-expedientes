// src/components/ClientCreateExpediente.tsx
'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';

export default function ClientCreateExpediente({
  action,
}: {
  action: (form: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn-icon" aria-label="Nuevo expediente" onClick={() => setOpen(true)}>➕</button>
      {open && (
        <Modal open={open} onClose={() => setOpen(false)} title="Nuevo expediente">
          <form action={async (fd) => { await action(fd); setOpen(false); }} className="space-y-3">
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
                  <option value="">—</option>
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Estado</label>
                <select name="estado" className="input">
                  <option value="">—</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En curso">En curso</option>
                  <option value="En supervisión">En supervisión</option>
                  <option value="Entregado">Entregado</option>
                  <option value="Cerrado">Cerrado</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" className="btn" onClick={() => setOpen(false)}>✖</button>
              <button type="submit" className="btn-primary">💾</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
