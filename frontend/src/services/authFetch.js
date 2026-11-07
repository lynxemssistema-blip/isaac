import { supabase } from './supabase';

/**
 * Resolve a URL base do Backend ISAAC (relativa em monólito Docker/proxy Vite, ou explícita via env).
 */
export function resolveBackendUrl() {
  if (import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim() !== '') {
    return import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && window.location) {
    const { hostname, port } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocal && port && port !== '5173' && port !== '4173' && port !== '3001') {
      return 'http://localhost:3001';
    }
  }

  return '';
}

export const BACKEND_URL = resolveBackendUrl();

/**
 * Wrapper seguro sobre window.fetch que anexa automaticamente o JWT da sessão ativa do Supabase
 * no header Authorization: Bearer <access_token>.
 */
export async function authFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  let attachedSessionToken = false;

  if (!headers.has('Authorization')) {
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
        attachedSessionToken = true;
      }
    } catch {
      // Prossegue sem token (ex: rotas públicas ou visitante deslogado)
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Se o token em cache era inválido/revogado (ex: troca de servidor Auth ou sessão expirada),
  // tenta renovar 1 vez; se falhar, limpa a sessão local silenciosamente para abrir o login limpo.
  if (response.status === 401 && attachedSessionToken) {
    try {
      const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
      if (!refreshErr && refreshed?.session?.access_token) {
        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set('Authorization', `Bearer ${refreshed.session.access_token}`);
        return fetch(url, { ...options, headers: retryHeaders });
      }
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }
  }

  return response;
}

