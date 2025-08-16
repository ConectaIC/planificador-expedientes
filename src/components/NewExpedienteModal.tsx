// src/components/NewExpedienteModal.tsx
// Tipo: Client Component

'use client';

import React, { useState, useEffect } from 'react';
import Modal from './Modal';

type Prioridad = 'Baja' | 'Media' | 'Alta';
type EstadoExp = 'Pendiente' | 'En curso' | 'En supervisión' | 'Entregado' | 'Cerrado';

export type ExpedienteInput = {
  codigo: string;
  proyecto: string;
  cliente: string;
  inicio?: string | null; // yyyy-mm-dd
  fin?: string | null;    // yyyy-mm-dd
  prioridad?: Prioridad | '';
  estado?: EstadoExp | '';
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (data: ExpedienteInput) => Promise<void> | void;
  /** Opcional: valores por defecto si quieres abrir “pre-rellenado” */
  defaults?: Partial<ExpedienteInput>;
};

export default function NewExpedienteModal({ open, onClose, onCreate, defaults }: Props) {
  const [form, setForm] = useState<ExpedienteInput>({
    codigo: '',
    proyecto: '',
    cliente: '',
    inicio: null,
    fin: null,
    prioridad: '',
    estado: '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({
        codigo: defaults?.codigo ?? '',
        proyecto: defaults?.proyecto ?? '',
        cliente: defaults?.cliente ?? '',
        inicio: defaults?.inicio ?? null,
        fin: defaults?.fin ?? null,
        prioridad: (defaults?.prioridad as Prioridad | '') ?? '',
        estado: (defaults?.estado as EstadoExp | '') ?? '',
      });
      setErr(null);
      setBusy(false);
    }
  }, [open, defaults]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setBusy(true);
      setErr(null);
      // Validación mínima
      if (!form.codigo.trim()) throw new Error('El código es obligatorio');
      if (!form.proyecto.trim()) throw new Error('El proyecto es obligatorio');
      await onCreate(form);
      setBusy(false);
      onClose();
    } catch (e: any) {
      setBusy(false);
      setErr(e?.message ?? 'No se pudo crear el expediente');
    }
  }

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title="Nuevo expediente">
      <form onSubmit={handleSubmit} className="space-y-3">
        {err && <div className="alert error">{err}</div>}

        <div>
          <label className="lbl">Código</label>
          <input
            className="inp"
            value={form.codigo}
            placeholder="25.201ATG, 25.107PR..."
            onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
          />
        </div>

        <div>
          <label className="lbl">Proyecto</label>
          <input
            className="inp"
            value={form.proyecto}
            placeholder="Descripción del proyecto"
            onChange={(e) => setForm((f) => ({ ...f, proyecto: e.target.value }))}
          />
        </div>

        <div>
          <label className="lbl">Cliente</label>
          <input
            className="inp"
            value={form.cliente}
            placeholder="Ayuntamiento / Privado..."
            onChange={(e) => setForm((f) => ({ ...f, cliente: e.target.value }))}
          />
        </div>

        <div className="grid grid-2">
          <div>
            <label className="lbl">Inicio</label>
            <input
              type="date"
              className="inp"
              value={form.inicio ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, inicio: e.target.value || null }))}
            />
          </div>
          <div>
            <label className="lbl">Fin (entrega prevista)</label>
            <input
              type="date"
              className="inp"
              value={form.fin ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, fin: e.target.value || null }))}
            />
          </div>
        </div>

        <div className="grid grid-2">
          <div>
            <label className="lbl">Prioridad</label>
            <select
              className="inp"
              value={form.prioridad ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value as Prioridad | '' }))}
            >
              <option value="">—</option>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
          <div>
            <label className="lbl">Estado</label>
            <select
              className="inp"
              value={form.estado ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value as EstadoExp | '' }))}
            >
              <option value="">—</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En curso">En curso</option>
              <option value="En supervisión">En supervisión</option>
              <option value="Entregado">Entregado</option>
              <option value="Cerrado">Cerrado</option>
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="btn primary" disabled={busy}>
            Crear
          </button>
        </div>
      </form>
    </Modal>
  );
}
