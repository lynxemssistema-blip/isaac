import { createClient } from '@supabase/supabase-js';

const runtimeEnv = typeof window !== 'undefined' ? window.__ISAAC_ENV__ : null;

const supabaseUrl =
  runtimeEnv?.SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  'https://ohjuqcrpakswvnoqobiq.supabase.co';

const supabaseAnonKey =
  runtimeEnv?.SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oanVxY3JwYWtzd3Zub3FvYmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4OTEzNjksImV4cCI6MjA4ODQ2NzM2OX0.PpIwlOOx6UvpQuED6rg4fHwnjrWzfI0FA1gqdzNsmQw';

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
