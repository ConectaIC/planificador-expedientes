'use client';

export default function CopyBar({ diario, mensual }:{ diario:string; mensual:string }) {
  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    alert('Copiado al portapapeles.');
  }
  return (
    <div style={{display:'flex', gap:8, margin:'8px 0 16px'}}>
      <button onClick={()=>copy(diario)}>📋 Copiar prompt diario</button>
      <button onClick={()=>copy(mensual)}>📋 Copiar prompt mensual</button>
    </div>
  );
}
