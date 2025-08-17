// Tipos compartidos en toda la app: evita duplicados incompatibles.

export type ExpedienteRef = {
  id: number;
  codigo: string;
  proyecto?: string | null;
};

// Hacemos expediente_id OPCIONAL para que encaje con ambos usos.
export type TareaRef = {
  id: number;
  titulo: string;
  expediente_id?: number | null;
};

// Si ya tienes estos DTO en otro sitio, puedes ignorarlos.
// Los dejo aquí por comodidad si algún componente los necesita.
export type ParteDTO = {
  id: number;
  fecha: string; // YYYY-MM-DD
  hora_inicio?: string | null; // HH:MM o ISO
  hora_fin?: string | null;    // HH:MM o ISO
  expediente_id?: number | null;
  tarea_id?: number | null;
  descripcion?: string | null;
  comentario?: string | null;
};
