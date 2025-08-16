'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/Modal';

type Estado = 'Pendiente' | 'En curso' | 'Completada';
type Prioridad = 'Baja' | 'Media' | 'Alta';

export interface Tarea {
  id: number;
  expediente_id: number | null;
  titulo: string;
  horas_previstas: number | null;
  horas_realizadas: number | null;
  estado: Estado;
  prioridad: Prioridad;
  vencimiento: string | null; // ISO date (YYYY-MM-DD) o null
}

export interface ExpedienteRef {
  id: number;
  codigo: string;
}

type Form = {
  titulo: string;
  expediente_id: number | null;
  horas_previstas: number | null;
  estado: Estado;
  prioridad: Prioridad;
  vencimiento: string | null;
};

function mapFromTarea(t: Tarea): Form {
  return {
    titulo: t.titulo ?? '',
    expediente_id: typeof t.expediente_id === 'number' ? t.expediente_id : null,
    horas_previstas: t.horas_previstas ?? null,
    estado: (t.estado as Estado) ?? 'Pendiente',
    prioridad: (t.prioridad as Prioridad) ?? 'Media',
    // normalizamos a YYYY-MM-DD si viene con tiempo
    vencimiento: t.vencimiento
      ? t.vencimiento.slice(0, 10)
      : null,
  };
}

function normalizeDate(value: string | null): string | null {
  if (!value) return null;
  // value puede venir como 'YYYY-MM-DD' o ISO; nos quedamos con YYYY-MM-DD
  return value.slice(0, 10);
}

export default function EditTareaModal({
  open,
  onClose,
  tarea,
  expedientes = [],
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  tarea: Tarea;
  expedientes?: ExpedienteRef[];
  onSave: (form: Form) => Promise<void>;
}) {
  // form **nunca** es null: lo inicializamos desde la tarea
  const initial = useMemo(() => mapFromTarea(tarea), [tarea]);
  const [form, setForm] = useState<Form>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Si cambia la tarea (o se reabre el modal con otra), reseteamos
  useEffect(() => {
    setForm(mapFromTarea(tarea));
    setErr(null);
    setBusy(false);
  }, [tarea, open]);

  const handleSubmit = async () => {
    try {
      setBusy(true);
      setErr(null);

      const titulo = (form.titulo ?? '').trim();
      if (!titulo) {
        setErr('El título es obligatorio');
        setBusy(false);
        return;
      }

      const payload: Form = {
        ...form,
        titulo,
        vencimiento: normalizeDate(form.vencimiento),
        // horas_previstas: si viene NaN de un input, lo pasamos a null
        horas_previstas:
          form.horas_previstas === null || form.horas_previstas === undefined
            ? null
            : Number.isFinite(Number(form.horas_previstas))
              ? Number(form.horas_previstas)
              : null,
      };

      await onSave(payload);
      setBusy(false);
      onClose();
    } catch (e: any) {
      setBusy(false);
      setErr(e?.message ?? 'Error al guardar la tarea');
    }
  };

  return (
    <Modal open={open} onClose={() => (!busy ? onClose() : undefined)} title="Editar tarea">
      <div className="form-grid">
        <label>
          <span>Título</span>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Título de la tarea"
          />
        </label>

        <label>
          <span>Expediente</span>
          <select
            value={form.expediente_id ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                expediente_id: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            <option value="">— Sin expediente —</option>
            {expedientes.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.codigo}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Horas previstas</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.25"
            min="0"
            value={form.horas_previstas ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                horas_previstas: e.target.value === '' ? null : Number(e.target.value),
              })
            }
            placeholder="0"
          />
        </label>

        <label>
          <span>Estado</span>
          <select
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value as Estado })}
          >
            <option value="Pendiente">Pendiente</option>
            <option value="En curso">En curso</option>
            <option value="Completada">Completada</option>
          </select>
        </label>

        <label>
          <span>Prioridad</span>
          <select
            value={form.prioridad}
            onChange={(e) => setForm({ ...form, prioridad: e.target.value as Prioridad })}
          >
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
          </select>
        </label>

        <label>
          <span>Vencimiento</span>
          <input
            type="date"
            value={form.vencimiento ?? ''}
            onChange={(e) =>
              setForm({ ...form, vencimiento: e.target.value ? e.target.value : null })
            }
          />
        </label>
      </div>

      {err && <p className="error">{err}</p>}

      <div className="modal-actions">
        <button className="btn-secondary" onClick={onClose} disabled={busy}>
          Cancelar
        </button>
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={busy || !form.titulo.trim()}
          title={!form.titulo.trim() ? 'El título es obligatorio' : 'Guardar cambios'}
        >
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      <style jsx>{`
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin: 12px 0 8px;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        label span {
          font-size: 0.9rem;
          color: var(--muted);
        }
        input,
        select {
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 10px;
          background: var(--surface);
        }
        .error {
          color: #c0392b;
          margin: 4px 0 0;
          font-size: 0.9rem;
        }
        .modal-actions {
          margin-top: 14px;
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .btn-primary,
        .btn-secondary {
          border-radius: 8px;
          padding: 8px 12px;
        }
        .btn-primary {
          background: var(--brand);
          color: white;
        }
        .btn-primary[disabled] {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-secondary {
          background: var(--surface-2);
        }
      `}</style>
    </Modal>
  );
}
