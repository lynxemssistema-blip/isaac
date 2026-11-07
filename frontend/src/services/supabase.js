import { createClient } from '@supabase/supabase-js';

const runtimeEnv = typeof window !== 'undefined' ? window.__ISAAC_ENV__ : null;

const supabaseUrl =
  runtimeEnv?.SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  'https://supabaseisaac.lynxems.com.br';

const supabaseAnonKey =
  runtimeEnv?.SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjIyMDg5ODg4MDB9.0e_X50Y4Ymor4-bmZlgaiPbKGwgIaq2J1u4nphJox80';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ [Supabase Client] Variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não encontradas.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
