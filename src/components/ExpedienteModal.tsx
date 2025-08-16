'use client';

import React, { useState, useEffect } from 'react';
import Modal from './Modal';

type Expediente = {
  id?: number;
  codigo: string;
  proyecto: string;
  cliente: string;
  inicio?: string | null;
  fin?: string | null;
  prioridad?: 'Baja' | 'Media' | 'Alta';
  estado?: 'Pendiente' | 'En curso' | 'En supervisión' | 'Entregado' | 'Cerrado';
};

type Props = {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Expediente> | null;
  onSubmit: (form: FormData) => Promise<void>; // server action
  submitting?: boolean;
  title?: string;
};

export default function ExpedienteModal({
  open,
  onClose,
  initial,
  onSubmit,
  submitting,
  title = 'Expediente',
}: Props) {
  const [form, setForm] = useState<Expediente>({
    codigo: '',
    proyecto: '',
    cliente: '',
    inicio: '',
    fin: '',
    prioridad: 'Media',
    estado: 'Pendiente',
  });

  useEffect(() => {
    if (initial) {
      setForm({
        codigo: initial.codigo ?? '',
        proyecto: initial.proyecto ?? '',
        cliente: initial.cliente ?? '',
        inicio: (initial.inicio as string) ?? '',
        fin: (initial.fin as string) ?? '',
        prioridad: (initial.prioridad as any) ?? 'Media',
        estado: (initial.estado as any) ?? 'Pendiente',
        id: initial.id,
      });
    }
  }, [initial]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (form.id) fd.set('id', String(form.id));
    await onSubmit(fd);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid" style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <label>
            <div className="text-sm">Código</div>
            <input name="codigo" value={form.codigo} onChange={handleChange} required className="input" />
          </label>
          <label>
            <div className="text-sm">Cliente</div>
            <input name="cliente" value={form.cliente} onChange={handleChange} className="input" />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <div className="text-sm">Proyecto</div>
            <input name="proyecto" value={form.proyecto} onChange={handleChange} className="input" />
          </label>
          <label>
            <div className="text-sm">Inicio</div>
            <input type="date" name="inicio" value={form.inicio ?? ''} onChange={handleChange} className="input" />
          </label>
          <label>
            <div className="text-sm">Fin</div>
            <input type="date" name="fin" value={form.fin ?? ''} onChange={handleChange} className="input" />
          </label>
          <label>
            <div className="text-sm">Prioridad</div>
            <select name="prioridad" value={form.prioridad ?? 'Media'} onChange={handleChange} className="input">
              <option>Baja</option>
              <option>Media</option>
              <option>Alta</option>
            </select>
          </label>
          <label>
            <div className="text-sm">Estado</div>
            <select name="estado" value={form.estado ?? 'Pendiente'} onChange={handleChange} className="input">
              <option>Pendiente</option>
              <option>En curso</option>
              <option>En supervisión</option>
              <option>Entregado</option>
              <option>Cerrado</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={onClose} className="btn-secondary">✖️</button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? '…' : '💾'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
