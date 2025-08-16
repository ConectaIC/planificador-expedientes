// src/components/ClientCreateParte.tsx
'use client';

import { useState } from 'react';

type ExpedienteRef = { id: number; codigo: string };
type TareaRef = { id: number; titulo: string };

type Props = {
  expedientes: ExpedienteRef[];
  tareas: TareaRef[];
  onCreate: (fd: FormData) => Promise<{ ok: boolean; error?: string } | void>;
};

export default function ClientCreateParte({ expedientes, tareas, onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = (await onCreate(fd)) as any;
    if (res?.ok === false) {
      setError(res.error || 'Error al crear el parte');
      return;
    }
    setOpen(false);
    e.currentTarget.reset();
  };

  return (
    <>
      <button className="btn" title="Nuevo parte" onClick={() => setOpen(true)}>➕</button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo parte</h3>
              <button className="icon-btn" onClick={() => setOpen(false)}>✖️</button>
            </div>

            <form onSubmit={onSubmit} className="form-grid">
              <label>Fecha<input name="fecha" type="date" required /></label>
              <label>Hora inicio<input name="hora_inicio" type="time" required /></label>
              <label>Hora fin<input name="hora_fin" type="time" required /></label>
              <label>Horas<input name="horas" type="number" step="0.1" required /></label>
              <label>Comentario<textarea name="comentario" rows={3} /></label>
              <label>Expediente
                <select name="expediente_id" defaultValue="">
                  <option value="">—</option>
                  {expedientes.map(e => <option key={e.id} value={e.id}>{e.codigo}</option>)}
                </select>
              </label>
              <label>Tarea
                <select name="tarea_id" defaultValue="">
                  <option value="">—</option>
                  {tareas.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
                </select>
              </label>

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
