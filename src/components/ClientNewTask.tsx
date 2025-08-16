// src/components/ClientNewTask.tsx
'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';

export default function ClientNewTask({
  expedienteId,
  expedienteCodigo,
  action,
}: {
  expedienteId: number;
  expedienteCodigo: string;
  action: (fd: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn-icon" aria-label="Nueva tarea" onClick={() => setOpen(true)}>➕</button>
      {open && (
        <Modal open={open} onClose={() => setOpen(false)} title="Nueva tarea">
          <form action={async (fd) => { 
            fd.set('expediente_id', String(expedienteId));
            fd.set('expediente_codigo', expedienteCodigo);
            await action(fd); 
            setOpen(false); 
          }} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Título</label>
              <input name="titulo" className="input" required />
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="block text-sm mb-1">Horas previstas</label>
                <input type="number" step="0.25" min="0" name="horas_previstas" className="input" />
              </div>
              <div>
                <label className="block text-sm mb-1">Vencimiento</label>
                <input type="date" name="vencimiento" className="input" />
              </div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="block text-sm mb-1">Estado</label>
                <select name="estado" className="input">
                  <option value="Pendiente">Pendiente</option>
                  <option value="En curso">En curso</option>
                  <option value="Completada">Completada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Prioridad</label>
                <select name="prioridad" className="input">
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
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
