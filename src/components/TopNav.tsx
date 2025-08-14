'use client';
import { usePathname } from 'next/navigation';

const link = (href:string, label:string, active:boolean)=>(
  <a href={href} style={{
    padding:'8px 12px',
    borderRadius:10,
    textDecoration:'none',
    background: active ? 'var(--brand-600)' : 'transparent',
    color: active ? '#fff' : 'var(--brand-700)'
  }}>{label}</a>
);

export default function TopNav(){
  const p = usePathname()||'';
  return (
    <header style={{
      position:'sticky', top:0, zIndex:100,
      background:'#fff', borderBottom:'1px solid #eee'
    }}>
      <nav style={{
        maxWidth:1100, margin:'0 auto', padding:'8px 12px',
        display:'flex', gap:8, alignItems:'center'
      }}>
        <div style={{fontWeight:700, marginRight:8}}>Conecta · Planner</div>
        {link('/',          'Inicio',      p === '/')}
        {link('/expedientes','Expedientes',p.startsWith('/expedientes'))}
        {link('/tareas',     'Tareas',     p.startsWith('/tareas'))}
        {link('/partes',     'Partes',     p.startsWith('/partes'))}
        {link('/resumen',    'Resumen',    p.startsWith('/resumen'))}
      </nav>
    </header>
  );
}
