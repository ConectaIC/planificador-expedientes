'use client';
import { useState } from 'react';

export default function CopyBox({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const rows = Math.min(24, Math.max(8, text.split('\n').length + 2));

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <textarea readOnly rows={rows} value={text} />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="button" onClick={copy}>Copiar</button>
        {copied && <span>Copiado ✓</span>}
      </div>
    </div>
  );
}
