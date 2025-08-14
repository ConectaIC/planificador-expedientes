// src/types/tareas.ts
export type Tarea = {
  id: string;
  titulo: string;
  estado: 'Pendiente' | 'En curso' | 'Completada';
  prioridad: 'Alta' | 'Media' | 'Baja' | null;
  vencimiento?: string | null;
  horas_previstas?: number | null;
  horas_realizadas?: number | null;
};
