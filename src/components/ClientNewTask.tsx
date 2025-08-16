// src/components/ClientNewTask.tsx
'use client';

import { useState } from 'react';

type Props = {
  expedienteId: number;
  action: (expedienteId: number, fd: FormData) => Promise<{ ok: boolean; error?: string } | void>;
};

export default function ClientNewTask({ expedienteId, action }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = (await action(expedienteId, fd)) as any;
    if (res?.ok === false) {
      setError(res.error || 'Error al crear la tarea');
      return;
    }
    setOpen(false);
    e.currentTarget.reset();
  };

  return (
    <>
      <button className="btn" title="Nueva tarea" onClick={() => setOpen(true)}>➕</button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-header">
              <h3>Nueva tarea</h3>
              <button className="icon-btn" onClick={() => setOpen(false)}>✖️</button>
            </div>

            <form onSubmit={onSubmit} className="form-grid">
              <label>Título<input name="titulo" required /></label>
              <label>Horas previstas<input name="horas_previstas" type="number" step="0.1" /></label>
              <label>Horas realizadas<input name="horas_realizadas" type="number" step="0.1" /></label>
              <label>Estado
                <select name="estado" defaultValue="Pendiente">
                  <option>Pendiente</option><option>En curso</option><option>Completada</option>
                </select>
              </label>
              <label>Prioridad
                <select name="prioridad" defaultValue="Media">
                  <option>Baja</option><option>Media</option><option>Alta</option>
                </select>
              </label>
              <label>Vencimiento<input name="vencimiento" type="date" /></label>

              {error && <p className="error">{error}</p>}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
