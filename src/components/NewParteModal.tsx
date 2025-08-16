// src/components/NewParteModal.tsx
// Tipo: Client Component

'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Modal from './Modal';

type ExpedienteMini = { id: number; codigo: string; proyecto?: string | null };
type TareaMini = { id: number; titulo: string; expediente_id: number };

type Props = {
  expedientes: ExpedienteMini[];
  tareas: TareaMini[];
  onCreate: (formData: FormData) => Promise<void>;
};

export default function NewParteModal({ expedientes, tareas, onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [expedienteId, setExpedienteId] = useState<number | ''>('');
  const [isPending, startTransition] = useTransition();

  // Tareas filtradas por expediente seleccionado
  const tareasFiltradas = useMemo(() => {
    if (!expedienteId) return [];
    return tareas.filter((t) => Number(t.expediente_id) === Number(expedienteId));
  }, [tareas, expedienteId]);

  useEffect(() => {
    // Si cambia el expediente, limpias tarea seleccionada (por name en el form)
    const input = document.querySelector<HTMLInputElement | HTMLSelectElement>('select[name="tarea_id"]');
    if (input) input.value = '';
  }, [expedienteId]);

  const close = () => setOpen(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // Si hay hora_inicio y hora_fin pero no horas, podemos calcular (redondeo a 15 min)
    const hi = String(fd.get('hora_inicio') || '');
    const hf = String(fd.get('hora_fin') || '');
    const horas = String(fd.get('horas') || '');
    if (!horas && hi && hf) {
      const [h1, m1] = hi.split(':').map(Number);
      const [h2, m2] = hf.split(':').map(Number);
      if (Number.isFinite(h1) && Number.isFinite(m1) && Number.isFinite(h2) && Number.isFinite(m2)) {
        const t1 = h1 * 60 + m1;
        const t2 = h2 * 60 + m2;
        const diff = Math.max(0, t2 - t1);
        const quarterHours = Math.round(diff / 15) / 4;
        fd.set('horas', String(quarterHours));
      }
    }

    startTransition(async () => {
      try {
        await onCreate(fd);
        alert('Parte creado correctamente');
        close();
      } catch (err: any) {
        alert(err?.message || 'Error al crear parte');
      }
    });
  };

  const btnClass = 'inline-flex items-center gap-1 px-3 py-2 rounded-lg btn';

  return (
    <>
      <button className={btnClass} onClick={() => setOpen(true)} aria-label="Nuevo parte">
        <span style={{ fontSize: 18 }}>➕</span> Nuevo
      </button>

      <Modal open={open} onClose={close} title="Nuevo parte" widthClass="max-w-xl">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="block text-sm mb-1">Fecha *</label>
              <input type="date" name="fecha" required className="input" />
            </div>
            <div>
              <label className="block text-sm mb-1">Horas</label>
              <input name="horas" type="number" min="0" step="0.25" className="input" placeholder="0.00" />
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="block text-sm mb-1">Hora inicio</label>
              <input type="time" name="hora_inicio" className="input" />
            </div>
            <div>
              <label className="block text-sm mb-1">Hora fin</label>
              <input type="time" name="hora_fin" className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Expediente *</label>
            <select
              name="expediente_id"
              required
              className="input"
              value={expedienteId}
              onChange={(e) => setExpedienteId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value=""></option>
              {expedientes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.codigo} {e.proyecto ? `— ${e.proyecto}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Tarea</label>
            <select name="tarea_id" className="input" disabled={!expedienteId}>
              <option value=""></option>
              {tareasFiltradas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titulo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Comentario</label>
            <textarea name="comentario" className="input" rows={3} placeholder="Descripción del trabajo…" />
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
