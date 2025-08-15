'use client';

import React, { useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Props = {
  orderParamName?: string; // por defecto "orden"
};

export default function FiltrosTareasGlobal({ orderParamName = 'orden' }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const params = new URLSearchParams(searchParams?.toString() || '');

    for (const [k, v] of fd.entries()) {
      const val = typeof v === 'string' ? v.trim() : '';
      if (val) params.set(k, val);
      else params.delete(k);
    }
    params.delete('page');

    router.push(`?${params.toString()}`);
  }

  return (
    <form ref={formRef} className="filters" onChange={onChange}>
      <input
        name="q"
        placeholder="Buscar por proyecto, expediente, cliente o título"
        defaultValue={searchParams?.get('q') || ''}
      />

      <select name="estado" defaultValue={searchParams?.get('estado') || ''}>
        <option value="">Estado: todos</option>
        <option value="Pendiente">Pendiente</option>
        <option value="En curso">En curso</option>
        <option value="Completada">Completada</option>
      </select>

      <select name="prioridad" defaultValue={searchParams?.get('prioridad') || ''}>
        <option value="">Prioridad: todas</option>
        <option value="Baja">Baja</option>
        <option value="Media">Media</option>
        <option value="Alta">Alta</option>
      </select>

      <select
        name={orderParamName}
        defaultValue={searchParams?.get(orderParamName) || 'vencimiento:asc'}
      >
        <option value="vencimiento:asc">Orden: Vencimiento ↑</option>
        <option value="vencimiento:desc">Orden: Vencimiento ↓</option>
        <option value="horas:asc">Orden: Horas realizadas ↑</option>
        <option value="horas:desc">Orden: Horas realizadas ↓</option>
      </select>
    </form>
  );
}
