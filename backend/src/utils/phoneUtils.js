/**
 * Utilitário Universal de Telefones (Brasil ANATEL + Internacional ITU-T E.164)
 * Suporta números brasileiros (8/9 dígitos, com ou sem +55) e números internacionais
 * na agenda do WhatsApp / Evolution API (ex: Austrália 61434484212, EUA +1, Portugal +351, Angola +244, etc.)
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

const KNOWN_DDI_META = [
  { prefix: '351', flag: '🇵🇹', country: 'Portugal' },
  { prefix: '353', flag: '🇮🇪', country: 'Irlanda' },
  { prefix: '244', flag: '🇦🇴', country: 'Angola' },
  { prefix: '258', flag: '🇲🇿', country: 'Moçambique' },
  { prefix: '245', flag: '🇬🇼', country: 'Guiné-Bissau' },
  { prefix: '238', flag: '🇨🇻', country: 'Cabo Verde' },
  { prefix: '239', flag: '🇸🇹', country: 'São Tomé' },
  { prefix: '595', flag: '🇵🇾', country: 'Paraguai' },
  { prefix: '598', flag: '🇺🇾', country: 'Uruguai' },
  { prefix: '591', flag: '🇧🇴', country: 'Bolívia' },
  { prefix: '593', flag: '🇪🇨', country: 'Equador' },
  { prefix: '974', flag: '🇶🇦', country: 'Catar' },
  { prefix: '971', flag: '🇦🇪', country: 'Emirados' },
  { prefix: '972', flag: '🇮🇱', country: 'Israel' },
  { prefix: '55', flag: '🇧🇷', country: 'Brasil' },
  { prefix: '61', flag: '🇦🇺', country: 'Austrália' },
  { prefix: '64', flag: '🇳🇿', country: 'Nova Zelândia' },
  { prefix: '44', flag: '🇬🇧', country: 'Reino Unido' },
  { prefix: '34', flag: '🇪🇸', country: 'Espanha' },
  { prefix: '33', flag: '🇫🇷', country: 'França' },
  { prefix: '39', flag: '🇮🇹', country: 'Itália' },
  { prefix: '49', flag: '🇩🇪', country: 'Alemanha' },
  { prefix: '41', flag: '🇨🇭', country: 'Suíça' },
  { prefix: '32', flag: '🇧🇪', country: 'Bélgica' },
  { prefix: '31', flag: '🇳🇱', country: 'Holanda' },
  { prefix: '54', flag: '🇦🇷', country: 'Argentina' },
  { prefix: '56', flag: '🇨🇱', country: 'Chile' },
  { prefix: '57', flag: '🇨🇴', country: 'Colômbia' },
  { prefix: '52', flag: '🇲🇽', country: 'México' },
  { prefix: '51', flag: '🇵🇪', country: 'Peru' },
  { prefix: '81', flag: '🇯🇵', country: 'Japão' },
  { prefix: '90', flag: '🇹🇷', country: 'Turquia' },
  { prefix: '1', flag: '🇺🇸', country: 'EUA/Canadá' },
];

export function detectCountryMetaFromE164(e164Digits = '') {
  const clean = String(e164Digits || '').replace(/\D/g, '');
  if (!clean) return { prefix: '', flag: '🌐', country: 'Desconhecido' };
  for (const item of KNOWN_DDI_META) {
    if (clean.startsWith(item.prefix)) {
      return item;
    }
  }
  return { prefix: clean.slice(0, 2), flag: '🌏', country: 'Internacional' };
}

/**
 * Analisa qualquer entrada de telefone (JID Evolution, +DDI, máscara BR ou dígitos puros como 61434484212)
 */
export function parseUniversalPhone(rawInput) {
  if (!rawInput) {
    return {
      isValid: false,
      isBrazil: false,
      e164Digits: '',
      comparableKey: '',
      displayFormatted: '',
      country: '',
      flag: '',
    };
  }

  const rawStr = String(rawInput).trim();
  const isFromJid = rawStr.includes('@');
  const beforeAt = rawStr.split('@')[0].trim();
  const hasExplicitIntlPrefix = beforeAt.startsWith('+') || beforeAt.startsWith('00');

  let digits = beforeAt.replace(/\D/g, '');
  if (!digits) {
    return {
      isValid: false,
      isBrazil: false,
      e164Digits: '',
      comparableKey: '',
      displayFormatted: '',
      country: '',
      flag: '',
    };
  }

  if (beforeAt.startsWith('00')) {
    digits = digits.slice(2);
  }

  // Normaliza zero de tronco australiano caso digitado como +61 0434 484 212 -> 61434484212
  if (digits.startsWith('610') && digits.length === 12) {
    digits = `61${digits.slice(3)}`;
  }

  let isBrazil = false;
  let e164Digits = digits;

  if (isFromJid) {
    // JIDs vindos do WhatsApp / Evolution SEMPRE contêm o DDI do país
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      isBrazil = true;
      e164Digits = digits;
    } else {
      isBrazil = false;
      e164Digits = digits;
    }
  } else if (hasExplicitIntlPrefix) {
    // Digitado explicitamente com + ou 00 (ex: +61 434 484 212 ou +55 31 99557-4906)
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13) && VALID_BR_DDDS.has(digits.slice(2, 4))) {
      isBrazil = true;
      e164Digits = digits;
    } else {
      isBrazil = false;
      e164Digits = digits;
    }
  } else {
    // Digitado sem '+' e sem '@' (ex: "31995574906", "(31) 99557-4906", "61434484212", "(61) 43448-4212", "351910562175")
    if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
      const strippedZero = digits.slice(1);
      if (VALID_BR_DDDS.has(strippedZero.slice(0, 2)) && (strippedZero.length === 10 || strippedZero[2] === '9')) {
        digits = strippedZero;
      }
    }

    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13) && VALID_BR_DDDS.has(digits.slice(2, 4))) {
      isBrazil = true;
      e164Digits = digits;
    } else if (digits.length >= 12) {
      // 12 a 15 dígitos que não começam com 55+DDD válido -> Internacional (Portugal 351, Angola 244, Japão 81, etc.)
      isBrazil = false;
      e164Digits = digits;
    } else if (digits.length === 11) {
      // Regra ANATEL Brasil: todo número nacional de 11 dígitos (DDD + 9 dígitos) tem OBRIGATORIAMENTE o 3º dígito = '9'
      // Portanto 61434484212 (Austrália 61 + 4...), 41764361981 (Suíça), 34600672596 (Espanha), 56984383241 (Chile, DDD 56 não existe no BR), 16282258183 (EUA) são 100% Internacionais!
      const dddCandidate = digits.slice(0, 2);
      if (VALID_BR_DDDS.has(dddCandidate) && digits[2] === '9') {
        isBrazil = true;
        e164Digits = `55${digits}`;
      } else {
        isBrazil = false;
        e164Digits = digits;
      }
    } else if (digits.length === 10) {
      const dddCandidate = digits.slice(0, 2);
      if (VALID_BR_DDDS.has(dddCandidate) && digits[2] >= '2') {
        isBrazil = true;
        e164Digits = `55${digits}`;
      } else {
        isBrazil = false;
        e164Digits = digits;
      }
    } else {
      isBrazil = false;
      e164Digits = digits;
    }
  }

  const isValid = e164Digits.length >= 8 && e164Digits.length <= 15;
  if (!isValid) {
    return {
      isValid: false,
      isBrazil,
      e164Digits,
      comparableKey: '',
      displayFormatted: rawStr,
      country: '',
      flag: '',
    };
  }

  if (isBrazil) {
    const national = e164Digits.slice(2);
    const ddd = national.slice(0, 2);
    const last8 = national.slice(-8);
    const comparableKey = `${ddd}${last8}`;
    const subscriber = national.slice(2);
    const displayFormatted =
      subscriber.length === 9
        ? `+55 (${ddd}) ${subscriber.slice(0, 5)}-${subscriber.slice(5)}`
        : `+55 (${ddd}) ${subscriber.slice(0, 4)}-${subscriber.slice(4)}`;

    return {
      isValid: true,
      isBrazil: true,
      e164Digits,
      comparableKey,
      displayFormatted,
      country: 'Brasil',
      flag: '🇧🇷',
    };
  }

  const meta = detectCountryMetaFromE164(e164Digits);
  let displayFormatted = `+${e164Digits}`;
  if (e164Digits.startsWith('61') && e164Digits.length === 11) {
    // Austrália: +61 434 484 212
    displayFormatted = `+61 ${e164Digits.slice(2, 5)} ${e164Digits.slice(5, 8)} ${e164Digits.slice(8)}`;
  } else if (e164Digits.startsWith('1') && e164Digits.length === 11) {
    // EUA / Canadá: +1 (628) 225-8183
    displayFormatted = `+1 (${e164Digits.slice(1, 4)}) ${e164Digits.slice(4, 7)}-${e164Digits.slice(7)}`;
  } else if (e164Digits.startsWith('351') && e164Digits.length === 12) {
    // Portugal: +351 910 562 175
    displayFormatted = `+351 ${e164Digits.slice(3, 6)} ${e164Digits.slice(6, 9)} ${e164Digits.slice(9)}`;
  } else if (meta.prefix && e164Digits.length > meta.prefix.length + 4) {
    const rest = e164Digits.slice(meta.prefix.length);
    const mid = Math.ceil(rest.length / 2);
    displayFormatted = `+${meta.prefix} ${rest.slice(0, mid)} ${rest.slice(mid)}`;
  }

  return {
    isValid: true,
    isBrazil: false,
    e164Digits,
    comparableKey: `intl:${e164Digits}`,
    displayFormatted,
    country: meta.country,
    flag: meta.flag,
  };
}

/**
 * Retorna dígitos E.164 prontos para a Evolution API (ex: "5531995574906" ou "61434484212")
 */
export function normalizeWhatsAppPhone(rawPhone) {
  const parsed = parseUniversalPhone(rawPhone);
  return parsed.e164Digits || '';
}

// Alias mantido para compatibilidade com todos os módulos existentes
export const normalizeBrazilPhone = normalizeWhatsAppPhone;

/**
 * Extrai chave comparável única:
 * - Brasil: DDD + 8 dígitos finais (casa com ou sem 9º dígito no WhatsApp)
 * - Internacional: "intl:<e164Digits>" (ex: "intl:61434484212" — nunca colide com DDD 61 de Brasília)
 */
export function extractComparablePhoneKey(phoneOrJid) {
  const parsed = parseUniversalPhone(phoneOrJid);
  return parsed.comparableKey || '';
}

export function formatUniversalPhoneDisplay(rawPhone) {
  const parsed = parseUniversalPhone(rawPhone);
  return parsed.displayFormatted || String(rawPhone || '');
}

