/**
 * Máscara e Formatação Inteligente de Telefone (Brasil + Internacional E.164)
 * - Números brasileiros locais: (31) 99557-4906
 * - Números internacionais (ex: Austrália 61434484212 / +61 434 484 212, Portugal +351, EUA +1, etc.):
 *   preserva até 15 dígitos E.164 sem truncar em 11 dígitos nem aplicar máscara errada de DDD brasileiro.
 */

export const VALID_BR_DDDS = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99',
]);

export function formatPhoneMask(value = '') {
  const raw = String(value || '');
  const trimmed = raw.trimStart();
  const startsWithPlus = trimmed.startsWith('+');
  const digits = raw.replace(/\D/g, '').slice(0, 15);

  if (!digits) {
    return startsWithPlus ? '+' : '';
  }

  // Se começou explicitamente com '+'
  if (startsWithPlus) {
    if (digits.startsWith('55') && digits.length <= 13) {
      const br = digits.slice(2);
      if (!br) return '+55 ';
      if (br.length <= 2) return `+55 (${br}`;
      if (br.length <= 6) return `+55 (${br.slice(0, 2)}) ${br.slice(2)}`;
      if (br.length <= 10) return `+55 (${br.slice(0, 2)}) ${br.slice(2, 6)}-${br.slice(6)}`;
      return `+55 (${br.slice(0, 2)}) ${br.slice(2, 7)}-${br.slice(7, 11)}`;
    }
    return formatInternationalDigits(digits);
  }

  // Sem '+': detecta automaticamente se é Internacional (ex: 61434484212 da Austrália, 351910562175 de Portugal, etc.)
  const dddCandidate = digits.slice(0, 2);
  const isBrWithCountry =
    digits.startsWith('55') &&
    (digits.length === 12 || digits.length === 13) &&
    VALID_BR_DDDS.has(digits.slice(2, 4));

  if (isBrWithCountry) {
    const br = digits.slice(2);
    return br.length === 11
      ? `+55 (${br.slice(0, 2)}) ${br.slice(2, 7)}-${br.slice(7)}`
      : `+55 (${br.slice(0, 2)}) ${br.slice(2, 6)}-${br.slice(6)}`;
  }

  // Se tiver 12+ dígitos sem começar com 55, ou 11 dígitos onde 3º dígito != '9' (ex: Austrália 61434484212),
  // ou DDD inexistente no Brasil (ex: Chile 56..., Portugal 35...) quando já tem >= 10 dígitos:
  const isClearlyInternational =
    digits.length >= 12 ||
    (digits.length === 11 && (!VALID_BR_DDDS.has(dddCandidate) || digits[2] !== '9')) ||
    (digits.length >= 10 && !VALID_BR_DDDS.has(dddCandidate));

  if (isClearlyInternational) {
    return formatInternationalDigits(digits);
  }

  // Máscara padrão brasileira (até 11 dígitos locais)
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function formatInternationalDigits(digits) {
  let clean = digits;
  if (clean.startsWith('610') && clean.length === 12) {
    clean = `61${clean.slice(3)}`;
  }
  if (clean.startsWith('61')) {
    if (clean.length <= 2) return `+${clean}`;
    if (clean.length <= 5) return `+61 ${clean.slice(2)}`;
    if (clean.length <= 8) return `+61 ${clean.slice(2, 5)} ${clean.slice(5)}`;
    return `+61 ${clean.slice(2, 5)} ${clean.slice(5, 8)} ${clean.slice(8, 11)}`;
  }
  if (clean.startsWith('1') && clean.length <= 11) {
    if (clean.length === 1) return '+1';
    if (clean.length <= 4) return `+1 (${clean.slice(1)}`;
    if (clean.length <= 7) return `+1 (${clean.slice(1, 4)}) ${clean.slice(4)}`;
    return `+1 (${clean.slice(1, 4)}) ${clean.slice(4, 7)}-${clean.slice(7, 11)}`;
  }
  if (clean.startsWith('351') || clean.startsWith('244') || clean.startsWith('258')) {
    const ddi = clean.slice(0, 3);
    const rest = clean.slice(3);
    if (!rest) return `+${ddi}`;
    if (rest.length <= 3) return `+${ddi} ${rest}`;
    if (rest.length <= 6) return `+${ddi} ${rest.slice(0, 3)} ${rest.slice(3)}`;
    return `+${ddi} ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
  }
  if (clean.length <= 3) return `+${clean}`;
  if (clean.length <= 6) return `+${clean.slice(0, 2)} ${clean.slice(2)}`;
  const ddi = clean.slice(0, 2);
  const rest = clean.slice(2);
  const mid = Math.ceil(rest.length / 2);
  return `+${ddi} ${rest.slice(0, mid)} ${rest.slice(mid)}`;
}

export function formatContactPhoneBadge(phoneDigits = '') {
  const clean = String(phoneDigits || '').replace(/\D/g, '');
  if (!clean) return { formatted: '', badge: '' };
  if (clean.startsWith('55') && (clean.length === 12 || clean.length === 13)) {
    const br = clean.slice(2);
    const formatted =
      br.length === 11
        ? `+55 (${br.slice(0, 2)}) ${br.slice(2, 7)}-${br.slice(7)}`
        : `+55 (${br.slice(0, 2)}) ${br.slice(2, 6)}-${br.slice(6)}`;
    return { formatted, badge: '🇧🇷 Brasil', isInternational: false };
  }
  if (clean.startsWith('61')) {
    return {
      formatted: formatInternationalDigits(clean),
      badge: '🇦🇺 Austrália',
      isInternational: true,
    };
  }
  if (clean.startsWith('351')) {
    return { formatted: formatInternationalDigits(clean), badge: '🇵🇹 Portugal', isInternational: true };
  }
  if (clean.startsWith('244')) {
    return { formatted: formatInternationalDigits(clean), badge: '🇦🇴 Angola', isInternational: true };
  }
  if (clean.startsWith('258')) {
    return { formatted: formatInternationalDigits(clean), badge: '🇲🇿 Moçambique', isInternational: true };
  }
  if (clean.startsWith('1') && clean.length === 11) {
    return { formatted: formatInternationalDigits(clean), badge: '🇺🇸 EUA/Canadá', isInternational: true };
  }
  return {
    formatted: formatInternationalDigits(clean),
    badge: '🌏 Internacional',
    isInternational: true,
  };
}

