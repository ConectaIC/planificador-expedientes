// src/components/ClientCreateExpediente.tsx
'use client';

import { useState } from 'react';

type Props = {
  action: (fd: FormData) => Promise<{ ok: boolean; error?: string } | void>;
};

export default function ClientCreateExpediente({ action }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = (await action(fd)) as any;
    if (res?.ok === false) {
      setError(res.error || 'Error al crear el expediente');
      return;
    }
    setOpen(false);
    e.currentTarget.reset();
  };

  return (
    <>
      <button className="btn" title="Nuevo expediente" onClick={() => setOpen(true)}>
        ➕
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo expediente</h3>
              <button className="icon-btn" onClick={() => setOpen(false)}>✖️</button>
            </div>

            <form onSubmit={onSubmit} className="form-grid">
              <label>Código<input name="codigo" required /></label>
              <label>Proyecto<input name="proyecto" required /></label>
              <label>Cliente<input name="cliente" /></label>
              <label>Inicio<input name="inicio" type="date" /></label>
              <label>Fin<input name="fin" type="date" /></label>
              <label>Prioridad
                <select name="prioridad" defaultValue="Media">
                  <option>Baja</option><option>Media</option><option>Alta</option>
                </select>
              </label>
              <label>Estado
                <select name="estado" defaultValue="Pendiente">
                  <option>Pendiente</option>
                  <option>En curso</option>
                  <option>En supervisión</option>
                  <option>Entregado</option>
                  <option>Cerrado</option>
                </select>
              </label>
              <label>Horas previstas<input name="horas_previstas" type="number" step="0.1" /></label>
              <label>Horas reales<input name="horas_reales" type="number" step="0.1" /></label>

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
