// src/lib/supabaseServer.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // mejor si existe
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || (!serviceKey && !anon)) {
    throw new Error('Faltan variables de entorno de Supabase (URL y SERVICE_ROLE o ANON).');
  }

  return createSupabaseClient(url, serviceKey || anon!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'planificador-expedientes/server' } },
  });
}
