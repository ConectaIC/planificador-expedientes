// src/lib/relations.ts

/**
 * Normaliza relaciones de Supabase que pueden llegar como array u objeto.
 * Devuelve el primer elemento si es array; el propio objeto si ya lo es;
 * o undefined si está vacío/null.
 */
export function normalizeOne<T extends Record<string, any> | null | undefined>(
  rel: T | T[]
): T | undefined {
  if (!rel) return undefined;
  return Array.isArray(rel) ? (rel[0] as T) : rel;
}

/**
 * Dado un campo relacional (por ejemplo tarea en partes),
 * intenta devolver un título seguro.
 */
export function getTituloFromRelation(rel: any): string | undefined {
  const r = normalizeOne(rel);
  const t = r?.titulo;
  return typeof t === 'string' ? t : undefined;
}
