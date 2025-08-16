// src/lib/supabaseServer.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let _client: ReturnType<typeof createSupabaseClient> | null = null;

/**
 * Server-side Supabase client (sin cookies, 1 sola instancia por proceso).
 * Usa las envs públicas ya configuradas en Vercel/Supabase.
 */
export function createClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  _client = createSupabaseClient(url, anon);
  return _client;
}
