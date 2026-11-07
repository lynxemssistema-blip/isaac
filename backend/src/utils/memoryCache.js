/**
 * Cache em memória leve com TTL (Time-To-Live) para reduzir round-trips repetitivos ao Supabase
 * em dados de leitura frequente (agentes ativos, parâmetros do sistema, perfil do idealizador e sessão JWT).
 */

const store = new Map();

/**
 * Obtém um item do cache se ainda estiver dentro da validade (TTL).
 * @param {string} key
 * @returns {any|undefined}
 */
export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

/**
 * Armazena um valor em memória com tempo de expiração em milissegundos.
 * @param {string} key
 * @param {any} value
 * @param {number} ttlMs Padrão: 60 segundos
 */
export function setCached(key, value, ttlMs = 60_000) {
  // Previne crescimento infinito caso muitas chaves efêmeras sejam criadas
  if (store.size > 2000) {
    const now = Date.now();
    for (const [k, v] of store.entries()) {
      if (now > v.expiresAt) store.delete(k);
    }
    if (store.size > 2000) {
      const firstKey = store.keys().next().value;
      if (firstKey) store.delete(firstKey);
    }
  }

  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
  return value;
}

/**
 * Remove uma chave específica do cache.
 * @param {string} key
 */
export function invalidateCache(key) {
  store.delete(key);
}

/**
 * Remove todas as chaves que começam com determinado prefixo.
 * @param {string} prefix
 */
export function invalidateCachePrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

