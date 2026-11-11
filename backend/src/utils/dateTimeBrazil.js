/**
 * Utilitário oficial de Data & Hora — Fuso Horário do Brasil (Brasília: America/Sao_Paulo)
 * Garante que todos os registros e exibições de horários de mensagens usem
 * 24h (pt-BR) no fuso America/Sao_Paulo, independentemente do SO/container UTC.
 */

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte qualquer valor de data/hora do banco (TIMESTAMPTZ com offset ou
 * TIMESTAMP sem offset em UTC) para instância Date válida.
 */
export function parseDatabaseDate(value) {
  if (!value) return new Date();
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? new Date() : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }

  const raw = String(value).trim();
  if (!raw) return new Date();

  // Caso venha apenas YYYY-MM-DD (data pura), ancora ao meio-dia UTC para nunca virar o dia anterior em -03:00
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T12:00:00Z`);
  }

  // Caso venha string ISO/SQL sem indicador de fuso (Z ou +/-HH:MM), assume UTC do Postgres
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const hasExplicitZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  const parsed = new Date(hasExplicitZone ? normalized : `${normalized}Z`);

  if (!Number.isNaN(parsed.getTime())) return parsed;

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
}

/**
 * Formata horário de envio no padrão brasileiro 24h (ex.: "23:35") em America/Sao_Paulo
 */
export function formatBrazilTime(value = new Date(), extraOptions = {}) {
  const dateObj = parseDatabaseDate(value);
  return dateObj.toLocaleTimeString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...extraOptions,
  });
}

/**
 * Formata data no padrão brasileiro (ex.: "10/11/2026") em America/Sao_Paulo
 */
export function formatBrazilDate(value = new Date(), extraOptions = {}) {
  const dateObj = parseDatabaseDate(value);
  return dateObj.toLocaleDateString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    ...extraOptions,
  });
}

/**
 * Formata data e hora completas no padrão brasileiro em America/Sao_Paulo
 */
export function formatBrazilDateTime(value = new Date(), extraOptions = {}) {
  const dateObj = parseDatabaseDate(value);
  return dateObj.toLocaleString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...extraOptions,
  });
}

/**
 * Ordena mensagens de chat estritamente em ordem cronológica (mais antigas -> mais recentes).
 * Desempate determinístico: quando duas linhas possuem exatamente o mesmo `created_at`
 * (ex.: pares gravados no mesmo INSERT transacional), a mensagem do usuário (`user`)
 * SEMPRE precede a resposta do mentor (`assistant` / `guide`).
 */
export function sortChatMessagesChronologically(messages = []) {
  if (!Array.isArray(messages)) return [];
  return [...messages].sort((a, b) => {
    const timeA = a?.created_at ? parseDatabaseDate(a.created_at).getTime() : 0;
    const timeB = b?.created_at ? parseDatabaseDate(b.created_at).getTime() : 0;
    if (timeA !== timeB) return timeA - timeB;

    const roleRankA = a?.role === 'user' ? 0 : 1;
    const roleRankB = b?.role === 'user' ? 0 : 1;
    if (roleRankA !== roleRankB) return roleRankA - roleRankB;

    return 0;
  });
}
