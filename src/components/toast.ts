// src/components/toast.ts
// Tipo: Client Utility (puede usarse desde componentes cliente)

'use client';

export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
};

export function toast(opts: ToastOptions | string) {
  const msg =
    typeof opts === 'string'
      ? opts
      : [opts.title, opts.description].filter(Boolean).join(' — ');
  // Implementación mínima: alert + console.
  // Más adelante podemos sustituir por un componente visual.
  if (msg) {
    // Evita bloquear demasiado, pero garantiza feedback.
    try {
      alert(msg);
    } catch {
      /* no-op */
    }
    console.log('[toast]', opts);
  }
}

export const toastSuccess = (msg: string) => toast({ title: 'OK', description: msg, variant: 'success' });
export const toastError = (msg: string) => toast({ title: 'Error', description: msg, variant: 'error' });
