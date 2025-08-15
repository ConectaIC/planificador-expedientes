// src/lib/dateUtils.ts

/** Formatea un objeto Date a 'YYYY-MM-DD' (zona local). */
export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Devuelve { start, end } para los últimos `dias` días, incluyendo hoy. */
export function rangeUltimosDias(dias: number): { start: string; end: string } {
  const hoy = new Date();
  const start = new Date(hoy);
  start.setDate(hoy.getDate() - dias + 1);
  return { start: ymd(start), end: ymd(hoy) };
}

/** Devuelve { start, end } del mes natural actual (YYYY-MM-01 a último día). */
export function rangeMesActual(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: ymd(start), end: ymd(end) };
}

/** Comprueba si una fecha (YYYY-MM-DD o ISO) está entre start y end (ambos inclusive). */
export function isBetween(dateStr: string | null | undefined, start: string, end: string): boolean {
  if (!dateStr) return false;
  const d = dateStr.slice(0, 10);
  return d >= start && d <= end;
}
