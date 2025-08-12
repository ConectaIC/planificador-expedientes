-- supabase_schema.sql
create extension if not exists pgcrypto;
create table if not exists expedientes (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  proyecto text not null,
  cliente text,
  inicio date,
  fin date,
  prioridad text,
  estado text,
  horas_previstas double precision,
  horas_reales double precision,
  observaciones text,
  inserted_at timestamptz default now()
);
create table if not exists partes (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  hora_inicio time,
  hora_fin time,
  horas double precision,
  comentario text,
  expediente_id uuid references expedientes(id) on delete set null,
  usuario_email text,
  inserted_at timestamptz default now()
);
create index if not exists idx_expedientes_fin on expedientes(fin);
create index if not exists idx_partes_fecha on partes(fecha);
create index if not exists idx_partes_expediente on partes(expediente_id);
