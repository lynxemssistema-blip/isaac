import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { supabaseAdmin } from '../config/supabase.js';
import { invalidateCache } from '../utils/memoryCache.js';
import {
  normalizeBrazilPhone,
  normalizeWhatsAppPhone,
  extractComparablePhoneKey,
  parseUniversalPhone,
  formatUniversalPhoneDisplay,
  resolveWhatsAppJid,
  sendWhatsAppTextSafe,
  isEvolutionEnabledInDatabase,
  randomBetween,
  sleep,
} from './evolutionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_EVO_URL = 'https://evo.lynxems.com.br';
const DEFAULT_EVO_INSTANCE = 'isaac';
const DEFAULT_EVO_JID = '553175235531@s.whatsapp.net';
const DEFAULT_APP_URL = 'https://isaac.lynxems.com.br';
const DEFAULT_ISAAC_IMAGE_URL = 'https://isaac.lynxems.com.br/og-isaac-cover.jpg';
const OFFICIAL_ASAAS_MONTHLY_URL = 'https://www.asaas.com/000/c/ak85n2ouw2z6j6xv';
const STRICT_DEFAULT_SAFE_PHONE = '31995574906';
const TIMEZONE = 'America/Sao_Paulo';

export const DEFAULT_UNREGISTERED_TEMPLATE = `{saudacao}, {nome}! Tudo bem com você?

Quero te apresentar uma ferramenta maravilhosa de clareza mental e desenvolvimento pessoal: a *Mentoria ISAAC*.

O ISAAC é um mentor confidencial, disponível 24h em texto e voz, criado para ouvir sem julgamentos, ajudar a desatar bloqueios emocionais e trazer direção para as suas decisões.

O acesso completo pelo App Web é *100% gratuito*. Venha conhecer e experimentar agora:
https://isaac.lynxems.com.br/

_(Se não desejar receber convites por aqui, basta responder "parar".)_`;

export const DEFAULT_REGISTERED_TEMPLATE = `{saudacao}, {nome}! Que alegria ter você na *Mentoria ISAAC*. {contexto}

Agora sua conta está integrada ao nosso canal e queremos lembrar como funcionam os nossos *2 planos* para você aproveitar cada recurso da melhor forma:

✅ *Plano Gratuito (R$ 0,00 — Sempre Livre):*
• Acesso 100% liberado no App Web em texto e voz
• Agente Orquestrador ISAAC + todos os Mentores Especialistas
• Memória evolutiva contínua e Laboratório do Incômodo Criativo
• Sem cartão de crédito e sem vínculo financeiro

💬 *Plano Pago — ISAAC no WhatsApp (R$ 14,99 / vencimento mensal):*
• Tudo do Plano Gratuito liberado no App
• Conversa direta aqui pelo *WhatsApp em Texto e Áudio* com o Agente Orquestrador ISAAC
• Reconhecimento automático pelo seu telefone e sincronização imediata no mesmo chat do App
• Assinatura mensal segura via Asaas (PIX, Cartão ou Boleto)

👉 Acesse sua mentoria ou veja os detalhes dos planos aqui:
https://isaac.lynxems.com.br/#planos

_(Se preferir não receber comunicados no WhatsApp, basta responder "parar".)_`;

export const DEFAULT_INTL_UNREGISTERED_TEMPLATE = `{saudacao}, {nome}! How are you doing?

I would love to introduce you to a wonderful tool for mental clarity and personal growth: *ISAAC Mentoring*.

ISAAC is a confidential mentor available 24/7 by text and voice, created to listen without judgement, help untangle emotional blocks, and bring clear direction to your decisions.

Full access via the Web App is *100% free of charge*. Come and experience your personalised space for reflection right now:
https://isaac.lynxems.com.br/

_(If you would rather not receive invitations here, simply reply "stop".)_`;

export const DEFAULT_INTL_REGISTERED_TEMPLATE = `{saudacao}, {nome}! It is a pleasure to have you with us at *ISAAC Mentoring*. {contexto}

Your account is now connected to our channel, and we would like to share a quick reminder of how our *2 plans* work so you can make the most of every feature:

✅ *Free Plan (100% Free — Always Open):*
• Full access on the Web App via text and voice
• ISAAC Orchestrator Agent + all Specialist Mentors
• Continuous evolutionary memory & Creative Trouble Lab
• No credit card required and no financial commitment

💬 *WhatsApp Plan — ISAAC on WhatsApp (Monthly Subscription):*
• Everything included in the Free Plan on the Web App
• Direct conversations right here on *WhatsApp via Text and Voice* with ISAAC
• Automatic recognition by your phone number and instant sync with your App chat
• Simple and secure monthly subscription

👉 Access your mentoring space or view plan details here:
https://isaac.lynxems.com.br/#planos

_(If you prefer not to receive updates on WhatsApp, simply reply "stop".)_`;

const HONORIFIC_PREFIXES = new Set([
  'dr', 'dra', 'prof', 'profa', 'pr', 'pra', 'pe', 'sr', 'sra', 'srta',
  'dona', 'seu', 'ir', 'irma', 'irmã', 'eng', 'arq', 'adv', 'mr', 'mrs', 'ms', 'miss',
]);

const BLOCKED_NAME_WORDS = new Set([
  'whatsapp', 'business', 'contato', 'cliente', 'suporte', 'atendimento',
  'voce', 'você', 'desconhecido', 'unknown', 'numero', 'número', 'empresa',
  'loja', 'comercial', 'vendas', 'financeiro', 'recepcao', 'recepção',
  'secretaria', 'portaria', 'sac', 'adm', 'admin', 'rh', 'ti', 'ok', 'oi',
  'ola', 'olá', 'teste', 'test', 'null', 'undefined', 'user', 'usuario',
  'usuário', 'membro', 'visitante', 'amigo', 'amiga', 'friend', 'member',
]);

const DDI_TIMEZONES = [
  { prefix: '351', tz: 'Europe/Lisbon' },
  { prefix: '353', tz: 'Europe/Dublin' },
  { prefix: '244', tz: 'Africa/Luanda' },
  { prefix: '258', tz: 'Africa/Maputo' },
  { prefix: '971', tz: 'Asia/Dubai' },
  { prefix: '972', tz: 'Asia/Jerusalem' },
  { prefix: '61', tz: 'Australia/Sydney' },
  { prefix: '64', tz: 'Pacific/Auckland' },
  { prefix: '44', tz: 'Europe/London' },
  { prefix: '34', tz: 'Europe/Madrid' },
  { prefix: '33', tz: 'Europe/Paris' },
  { prefix: '39', tz: 'Europe/Rome' },
  { prefix: '49', tz: 'Europe/Berlin' },
  { prefix: '41', tz: 'Europe/Zurich' },
  { prefix: '81', tz: 'Asia/Tokyo' },
  { prefix: '54', tz: 'America/Argentina/Buenos_Aires' },
  { prefix: '56', tz: 'America/Santiago' },
  { prefix: '57', tz: 'America/Bogota' },
  { prefix: '52', tz: 'America/Mexico_City' },
  { prefix: '1', tz: 'America/New_York' },
];

export function isInternationalContact(contactOrPhone) {
  const raw =
    typeof contactOrPhone === 'string'
      ? contactOrPhone
      : contactOrPhone?.jid || contactOrPhone?.phone_digits || '';
  if (!raw || raw === 'sample') return false;
  if (raw === 'sample_intl') return true;
  const meta = parseUniversalPhone(raw);
  if (!meta.e164Digits) return false;
  return !meta.isBrazil;
}

function getGreetingForContact(contactOrPhone, forceIntl = null, date = new Date()) {
  const isIntl = forceIntl !== null ? Boolean(forceIntl) : isInternationalContact(contactOrPhone);
  let tz = TIMEZONE;

  if (isIntl) {
    const raw =
      typeof contactOrPhone === 'string'
        ? contactOrPhone
        : contactOrPhone?.phone_digits || contactOrPhone?.jid || '';
    const digits = String(raw).split('@')[0].replace(/\D/g, '');
    const matchedTz = DDI_TIMEZONES.find((item) => digits.startsWith(item.prefix));
    tz = matchedTz ? matchedTz.tz : 'Europe/London';
  }

  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
    const hourNum = Number(parts.hour === '24' ? 0 : parts.hour);
    if (isIntl) {
      return hourNum < 12 ? 'Good morning' : hourNum < 18 ? 'Good afternoon' : 'Good evening';
    }
    return hourNum < 12 ? 'Bom dia' : hourNum < 18 ? 'Boa tarde' : 'Boa noite';
  } catch {
    return isIntl ? 'Good morning' : 'Bom dia';
  }
}

function getBrtTimeInfo(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const hourNum = Number(parts.hour === '24' ? 0 : parts.hour);
  const hhmm = `${String(hourNum).padStart(2, '0')}:${parts.minute}`;
  const greeting = hourNum < 12 ? 'Bom dia' : hourNum < 18 ? 'Boa tarde' : 'Boa noite';
  return { hourNum, hhmm, greeting };
}

/**
 * Analisa se o nome do contato possui um Primeiro Nome próprio válido e retorna o Primeiro Nome formatado.
 * Rejeita vazios, emojis, números de telefone, letras isoladas ("M", "A."), siglas sem vogal ("CP", "RD", "M.A.G") e termos genéricos.
 */
export function analyzeContactName(rawName) {
  if (!rawName) {
    return { hasValidName: false, firstName: '', cleanedFullName: '' };
  }

  const normalized = String(rawName).normalize('NFKC').trim();
  if (!normalized) {
    return { hasValidName: false, firstName: '', cleanedFullName: '' };
  }

  // Se parece número de telefone (6+ dígitos), não é nome próprio
  const digitCount = (normalized.match(/\d/g) || []).length;
  if (digitCount >= 6) {
    return { hasValidName: false, firstName: '', cleanedFullName: '' };
  }

  // Separa tokens formados apenas por letras (incluindo acentos)
  const rawLetterTokens = normalized.match(/\p{L}+/gu) || [];
  if (rawLetterTokens.length === 0) {
    return { hasValidName: false, firstName: '', cleanedFullName: '' };
  }

  let idx = 0;
  while (
    idx < rawLetterTokens.length - 1 &&
    HONORIFIC_PREFIXES.has(rawLetterTokens[idx].toLowerCase())
  ) {
    idx += 1;
  }

  const rawFirst = rawLetterTokens[idx] || '';
  const lowerFirst = rawFirst.toLowerCase();

  if (rawFirst.length < 2) {
    return { hasValidName: false, firstName: '', cleanedFullName: '' };
  }

  if (BLOCKED_NAME_WORDS.has(lowerFirst)) {
    return { hasValidName: false, firstName: '', cleanedFullName: '' };
  }

  // Deve conter ao menos 1 vogal (rejeita siglas como CP, RD, MG, LTDA, CNPJ, MKT)
  const hasVowel = /[aeiouáàâãäéèêëíìîïóòôõöúùûüýÿ]/i.test(rawFirst);
  if (!hasVowel) {
    return { hasValidName: false, firstName: '', cleanedFullName: '' };
  }

  // Sigla curta de 2 letras em CAIXA ALTA isolada (ex: "PJ", "TV", "SP") sem sobrenome válido
  const secondToken = rawLetterTokens[idx + 1] || '';
  const hasRealSecondToken =
    secondToken.length >= 3 && /[aeiouáàâãäéèêëíìîïóòôõöúùûüýÿ]/i.test(secondToken);
  if (
    rawFirst.length === 2 &&
    rawFirst === rawFirst.toUpperCase() &&
    !/[áàâãäéèêëíìîïóòôõöúùûü]/i.test(rawFirst) &&
    !hasRealSecondToken
  ) {
    return { hasValidName: false, firstName: '', cleanedFullName: '' };
  }

  const formattedFirst = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase();
  const formattedFull = rawLetterTokens
    .slice(idx)
    .filter((t) => t.length >= 2 || /^(e|da|de|do|das|dos)$/i.test(t))
    .map((t) =>
      /^(e|da|de|do|das|dos)$/i.test(t)
        ? t.toLowerCase()
        : t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
    )
    .join(' ');

  return {
    hasValidName: true,
    firstName: formattedFirst,
    cleanedFullName: formattedFull || formattedFirst,
  };
}

export function resolveContactIdentity(contact) {
  const candidates = [contact?.custom_name, contact?.app_full_name, contact?.push_name];
  for (const src of candidates) {
    const res = analyzeContactName(src);
    if (res.hasValidName) {
      return {
        hasValidName: true,
        firstName: res.firstName,
        displayName: String(contact?.custom_name || contact?.app_full_name || contact?.push_name || res.cleanedFullName).trim(),
        isCustomEdited: Boolean(contact?.custom_name && String(contact.custom_name).trim()),
      };
    }
  }
  const rawFallback = String(contact?.custom_name || contact?.app_full_name || contact?.push_name || '').trim();
  return {
    hasValidName: false,
    firstName: '',
    displayName: rawFallback,
    isCustomEdited: Boolean(contact?.custom_name && String(contact.custom_name).trim()),
  };
}

function cleanContactFirstName(rawName) {
  return analyzeContactName(rawName).firstName;
}

/**
 * Carrega a imagem oficial do ISAAC do disco (base64 rápido e 100% confiável) ou URL externa
 */
function getEvoConfig() {
  return {
    baseUrl: (process.env.EVOLUTION_API_URL || DEFAULT_EVO_URL).replace(/\/$/, ''),
    instanceName: (process.env.EVOLUTION_INSTANCE_NAME || DEFAULT_EVO_INSTANCE).trim(),
    apiKey: (process.env.EVOLUTION_API_KEY || '').trim(),
    instanceJid: (process.env.EVOLUTION_INSTANCE_JID || DEFAULT_EVO_JID).trim(),
    appUrl: (process.env.APP_URL || DEFAULT_APP_URL).replace(/\/$/, ''),
  };
}

function loadLocalCoverImageBase64(mediaUrl = '') {
  const cleanUrl = String(mediaUrl || '').trim();
  const ebookCoverMatch = cleanUrl.match(/\/ebooks\/covers\/([a-z0-9_-]+\.(?:jpg|jpeg|png))$/i);
  if (ebookCoverMatch) {
    const coverFile = ebookCoverMatch[1];
    const ebookCandidates = [
      path.resolve(__dirname, `../assets/ebooks/covers/${coverFile}`),
      path.resolve(__dirname, `../../../frontend/public/ebooks/covers/${coverFile}`),
      path.resolve(__dirname, `../../../frontend/dist/ebooks/covers/${coverFile}`),
      path.resolve(process.cwd(), `backend/src/assets/ebooks/covers/${coverFile}`),
      path.resolve(process.cwd(), `frontend/public/ebooks/covers/${coverFile}`),
    ];
    for (const filePath of ebookCandidates) {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath).toString('base64');
      }
    }
  }

  const isDefaultCover =
    !cleanUrl ||
    cleanUrl === DEFAULT_ISAAC_IMAGE_URL ||
    cleanUrl.endsWith('/og-isaac-cover.jpg');

  if (isDefaultCover) {
    const candidates = [
      path.resolve(__dirname, '../../../frontend/public/og-isaac-cover.jpg'),
      path.resolve(__dirname, '../../../frontend/dist/og-isaac-cover.jpg'),
      path.resolve(process.cwd(), 'frontend/public/og-isaac-cover.jpg'),
      path.resolve(process.cwd(), 'frontend/dist/og-isaac-cover.jpg'),
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath).toString('base64');
      }
    }
  }
  return null;
}

/**
 * Envia Imagem + Legenda via Evolution API v2 (/message/sendMedia/:instance) com cadência humana Anti-Ban
 */
export async function sendWhatsAppImageSafe({ jidOrNumber, caption, mediaUrl }) {
  const cfg = getEvoConfig();
  if (!cfg.apiKey) {
    throw new Error('EVOLUTION_API_KEY não configurada no servidor.');
  }

  const interRequestJitterMs = randomBetween(280, 450);
  await sleep(interRequestJitterMs);

  const typingPresenceMs = randomBetween(1800, 3200);

  let mediaPayload = mediaUrl || DEFAULT_ISAAC_IMAGE_URL;
  const localBase64 = loadLocalCoverImageBase64(mediaPayload);
  if (localBase64) {
    mediaPayload = localBase64;
  }

  const resp = await fetch(`${cfg.baseUrl}/message/sendMedia/${encodeURIComponent(cfg.instanceName)}`, {
    method: 'POST',
    headers: {
      apikey: cfg.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      number: jidOrNumber,
      mediatype: 'image',
      mimetype: 'image/jpeg',
      caption: caption || '',
      media: mediaPayload,
      fileName: 'mentoria-isaac.jpg',
      delay: typingPresenceMs,
    }),
  });

  const bodyText = await resp.text();
  if (!resp.ok) {
    throw new Error(`Evolution sendMedia HTTP ${resp.status}: ${bodyText.slice(0, 280)}`);
  }

  let parsed = {};
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    parsed = { raw: bodyText };
  }

  return {
    messageId: parsed?.key?.id || null,
    remoteJid: parsed?.key?.remoteJid || jidOrNumber,
    interRequestJitterMs,
    typingPresenceMs,
    totalCadenceMs: interRequestJitterMs + typingPresenceMs,
    raw: parsed,
  };
}

/**
 * Obtém configuração da Trava de Segurança e limites Anti-Ban da Meta
 */
export async function getOutreachSafetyConfig() {
  try {
    const { data } = await supabaseAdmin
      .from('izaque_system_settings')
      .select(
        'whatsapp_outreach_restricted_mode, whatsapp_outreach_allowed_phones, whatsapp_outreach_daily_limit, whatsapp_outreach_cooldown_hours'
      )
      .eq('id', 'global')
      .maybeSingle();

    const restrictedMode =
      data?.whatsapp_outreach_restricted_mode !== undefined && data?.whatsapp_outreach_restricted_mode !== null
        ? Boolean(data.whatsapp_outreach_restricted_mode)
        : true;

    const allowedPhonesRaw = String(data?.whatsapp_outreach_allowed_phones || STRICT_DEFAULT_SAFE_PHONE).trim();
    const allowedPhonesList = allowedPhonesRaw
      .split(/[,;\s]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (allowedPhonesList.length === 0) {
      allowedPhonesList.push(STRICT_DEFAULT_SAFE_PHONE);
    }

    const allowedComparableKeys = Array.from(
      new Set(allowedPhonesList.map((p) => extractComparablePhoneKey(p)).filter(Boolean))
    );

    return {
      restrictedMode,
      allowedPhonesRaw: allowedPhonesList.join(', '),
      allowedPhonesList,
      allowedComparableKeys,
      dailyLimit: Number(data?.whatsapp_outreach_daily_limit) || 40,
      cooldownHours: Number(data?.whatsapp_outreach_cooldown_hours) || 72,
    };
  } catch {
    return {
      restrictedMode: true,
      allowedPhonesRaw: STRICT_DEFAULT_SAFE_PHONE,
      allowedPhonesList: [STRICT_DEFAULT_SAFE_PHONE],
      allowedComparableKeys: [extractComparablePhoneKey(STRICT_DEFAULT_SAFE_PHONE)],
      dailyLimit: 40,
      cooldownHours: 72,
    };
  }
}

export async function updateOutreachSafetyConfig({
  restrictedMode,
  allowedPhones,
  dailyLimit,
  cooldownHours,
  updatedBy,
}) {
  const payload = {
    updated_at: new Date().toISOString(),
    updated_by: updatedBy || null,
  };
  if (restrictedMode !== undefined) payload.whatsapp_outreach_restricted_mode = Boolean(restrictedMode);
  if (allowedPhones !== undefined) {
    payload.whatsapp_outreach_allowed_phones = String(allowedPhones || STRICT_DEFAULT_SAFE_PHONE).trim() || STRICT_DEFAULT_SAFE_PHONE;
  }
  if (dailyLimit !== undefined) payload.whatsapp_outreach_daily_limit = Math.max(1, Math.min(250, Number(dailyLimit) || 40));
  if (cooldownHours !== undefined) payload.whatsapp_outreach_cooldown_hours = Math.max(0, Number(cooldownHours) ?? 72);

  const { error } = await supabaseAdmin
    .from('izaque_system_settings')
    .update(payload)
    .eq('id', 'global');

  if (error) throw error;
  invalidateCache('system:settings');
  return getOutreachSafetyConfig();
}

export async function getSavedOutreachTemplates() {
  try {
    const { data } = await supabaseAdmin
      .from('izaque_system_settings')
      .select(
        'whatsapp_outreach_image_url, whatsapp_outreach_unregistered_template, whatsapp_outreach_registered_template, whatsapp_outreach_intl_unregistered_template, whatsapp_outreach_intl_registered_template'
      )
      .eq('id', 'global')
      .maybeSingle();

    const savedImageUrl = String(data?.whatsapp_outreach_image_url || '').trim();
    const savedUnregistered = String(data?.whatsapp_outreach_unregistered_template || '').trim();
    const savedRegistered = String(data?.whatsapp_outreach_registered_template || '').trim();
    const savedIntlUnregistered = String(data?.whatsapp_outreach_intl_unregistered_template || '').trim();
    const savedIntlRegistered = String(data?.whatsapp_outreach_intl_registered_template || '').trim();

    return {
      unregisteredImageUrl: savedImageUrl || DEFAULT_ISAAC_IMAGE_URL,
      unregisteredTemplate: savedUnregistered,
      registeredTemplate: savedRegistered,
      intlUnregisteredTemplate: savedIntlUnregistered,
      intlRegisteredTemplate: savedIntlRegistered,
      effectiveUnregisteredTemplate: savedUnregistered || DEFAULT_UNREGISTERED_TEMPLATE,
      effectiveRegisteredTemplate: savedRegistered || DEFAULT_REGISTERED_TEMPLATE,
      effectiveIntlUnregisteredTemplate: savedIntlUnregistered || DEFAULT_INTL_UNREGISTERED_TEMPLATE,
      effectiveIntlRegisteredTemplate: savedIntlRegistered || DEFAULT_INTL_REGISTERED_TEMPLATE,
      hasCustomUnregistered: Boolean(savedUnregistered),
      hasCustomRegistered: Boolean(savedRegistered),
      hasCustomIntlUnregistered: Boolean(savedIntlUnregistered),
      hasCustomIntlRegistered: Boolean(savedIntlRegistered),
      defaultImageUrl: DEFAULT_ISAAC_IMAGE_URL,
      defaultUnregisteredTemplate: DEFAULT_UNREGISTERED_TEMPLATE,
      defaultRegisteredTemplate: DEFAULT_REGISTERED_TEMPLATE,
      defaultIntlUnregisteredTemplate: DEFAULT_INTL_UNREGISTERED_TEMPLATE,
      defaultIntlRegisteredTemplate: DEFAULT_INTL_REGISTERED_TEMPLATE,
    };
  } catch {
    return {
      unregisteredImageUrl: DEFAULT_ISAAC_IMAGE_URL,
      unregisteredTemplate: '',
      registeredTemplate: '',
      intlUnregisteredTemplate: '',
      intlRegisteredTemplate: '',
      effectiveUnregisteredTemplate: DEFAULT_UNREGISTERED_TEMPLATE,
      effectiveRegisteredTemplate: DEFAULT_REGISTERED_TEMPLATE,
      effectiveIntlUnregisteredTemplate: DEFAULT_INTL_UNREGISTERED_TEMPLATE,
      effectiveIntlRegisteredTemplate: DEFAULT_INTL_REGISTERED_TEMPLATE,
      hasCustomUnregistered: false,
      hasCustomRegistered: false,
      hasCustomIntlUnregistered: false,
      hasCustomIntlRegistered: false,
      defaultImageUrl: DEFAULT_ISAAC_IMAGE_URL,
      defaultUnregisteredTemplate: DEFAULT_UNREGISTERED_TEMPLATE,
      defaultRegisteredTemplate: DEFAULT_REGISTERED_TEMPLATE,
      defaultIntlUnregisteredTemplate: DEFAULT_INTL_UNREGISTERED_TEMPLATE,
      defaultIntlRegisteredTemplate: DEFAULT_INTL_REGISTERED_TEMPLATE,
    };
  }
}

export async function updateSavedOutreachTemplates({
  unregisteredImageUrl,
  unregisteredTemplate,
  registeredTemplate,
  intlUnregisteredTemplate,
  intlRegisteredTemplate,
  resetDefaults,
  updatedBy,
}) {
  const payload = {
    updated_at: new Date().toISOString(),
    updated_by: updatedBy || null,
  };

  if (resetDefaults === 'all') {
    payload.whatsapp_outreach_image_url = DEFAULT_ISAAC_IMAGE_URL;
    payload.whatsapp_outreach_unregistered_template = null;
    payload.whatsapp_outreach_registered_template = null;
    payload.whatsapp_outreach_intl_unregistered_template = null;
    payload.whatsapp_outreach_intl_registered_template = null;
  } else if (resetDefaults === 'unregistered') {
    payload.whatsapp_outreach_image_url = DEFAULT_ISAAC_IMAGE_URL;
    payload.whatsapp_outreach_unregistered_template = null;
  } else if (resetDefaults === 'registered') {
    payload.whatsapp_outreach_registered_template = null;
  } else if (resetDefaults === 'intl_unregistered') {
    payload.whatsapp_outreach_intl_unregistered_template = null;
  } else if (resetDefaults === 'intl_registered') {
    payload.whatsapp_outreach_intl_registered_template = null;
  } else {
    if (unregisteredImageUrl !== undefined) {
      payload.whatsapp_outreach_image_url =
        String(unregisteredImageUrl || '').trim() || DEFAULT_ISAAC_IMAGE_URL;
    }
    if (unregisteredTemplate !== undefined) {
      const cleanedUnreg = String(unregisteredTemplate || '').trim();
      payload.whatsapp_outreach_unregistered_template = cleanedUnreg || null;
    }
    if (registeredTemplate !== undefined) {
      const cleanedReg = String(registeredTemplate || '').trim();
      payload.whatsapp_outreach_registered_template = cleanedReg || null;
    }
    if (intlUnregisteredTemplate !== undefined) {
      const cleanedIntlUnreg = String(intlUnregisteredTemplate || '').trim();
      payload.whatsapp_outreach_intl_unregistered_template = cleanedIntlUnreg || null;
    }
    if (intlRegisteredTemplate !== undefined) {
      const cleanedIntlReg = String(intlRegisteredTemplate || '').trim();
      payload.whatsapp_outreach_intl_registered_template = cleanedIntlReg || null;
    }
  }

  const { error } = await supabaseAdmin
    .from('izaque_system_settings')
    .update(payload)
    .eq('id', 'global');

  if (error) throw error;
  invalidateCache('system:settings');
  return getSavedOutreachTemplates();
}

function interpolateOutreachVariables(template, { greeting, firstName = '', contextHint = '' }) {
  const safeFirstName = String(firstName || '').trim();
  const cleanContext = String(contextHint || '').trim();

  return String(template || '')
    .replace(/\{saudacao\}\s*,\s*\{nome\}/gi, safeFirstName ? `${greeting}, ${safeFirstName}` : greeting)
    .replace(/,\s*\{nome\}/gi, safeFirstName ? `, ${safeFirstName}` : '')
    .replace(/\{saudacao\}/gi, greeting)
    .replace(/\{nome\}\s*,?\s*/gi, safeFirstName ? `${safeFirstName} ` : '')
    .replace(/[ \t]*\{contexto\}/gi, cleanContext ? ` ${cleanContext}` : '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function isPhoneAllowedBySafetyLock(phoneOrJid, safetyCfg) {
  if (!safetyCfg?.restrictedMode) return true;
  const targetKey = extractComparablePhoneKey(phoneOrJid);
  if (!targetKey) return false;
  return safetyCfg.allowedComparableKeys.includes(targetKey);
}

async function fetchPaginatedSupabaseRows(buildQueryFn, maxRows = 5000) {
  const pageSize = 1000;
  const allRows = [];
  let totalCount = 0;

  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const end = Math.min(offset + pageSize - 1, maxRows - 1);
    const { data, count, error } = await buildQueryFn().range(offset, end);
    if (error) throw error;
    if (typeof count === 'number') totalCount = count;
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
  }

  return { data: allRows, count: totalCount || allRows.length };
}

/**
 * 1. SINCRONIZAR CONTATOS DO WHATSAPP DA EVOLUTION API PARA O BANCO DO APP
 *    Cruza automaticamente pelo telefone para classificar quem JÁ ESTÁ no App e quem NÃO ESTÁ
 */
export async function syncEvolutionContactsToDatabase() {
  const cfg = getEvoConfig();
  if (!cfg.apiKey) {
    throw new Error('EVOLUTION_API_KEY não configurada.');
  }

  const [contactsResp, profilesRes, existingContactsRes] = await Promise.all([
    fetch(`${cfg.baseUrl}/chat/findContacts/${encodeURIComponent(cfg.instanceName)}`, {
      method: 'POST',
      headers: {
        apikey: cfg.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ where: {} }),
    }),
    fetchPaginatedSupabaseRows(
      () => supabaseAdmin.from('izaque_profiles').select('id, full_name, email, phone, plan_id, plan_status, main_goal, whatsapp_opt_out'),
      5000
    ),
    fetchPaginatedSupabaseRows(
      () =>
        supabaseAdmin
          .from('izaque_whatsapp_contacts')
          .select('jid, custom_name, opt_out, last_outreach_at, last_outreach_status, outreach_count'),
      5000
    ),
  ]);

  if (!contactsResp.ok) {
    const errTxt = await contactsResp.text();
    throw new Error(`Falha ao buscar contatos na Evolution (${contactsResp.status}): ${errTxt.slice(0, 200)}`);
  }

  const rawContacts = await contactsResp.json();
  if (!Array.isArray(rawContacts)) {
    throw new Error('Formato inesperado de contatos retornado pela Evolution API.');
  }

  // Mapa de perfis cadastrados no App por chave comparável de telefone (DDD + 8 dígitos finais)
  const profileByComparableKey = new Map();
  for (const prof of profilesRes.data || []) {
    if (!prof.phone) continue;
    const key = extractComparablePhoneKey(prof.phone);
    if (key) {
      // Prioriza perfil com email / master se houver duplicata
      const prev = profileByComparableKey.get(key);
      if (!prev || prof.email === 'edsonmanoel2012@gmail.com') {
        profileByComparableKey.set(key, prof);
      }
    }
  }

  const existingByJid = new Map();
  for (const ex of existingContactsRes.data || []) {
    existingByJid.set(ex.jid, ex);
  }

  const nowIso = new Date().toISOString();
  const dedupByJid = new Map();

  for (const c of rawContacts) {
    const jid = String(c?.remoteJid || '').trim();
    if (!jid.endsWith('@s.whatsapp.net')) continue;
    if (jid === '0@s.whatsapp.net' || jid === cfg.instanceJid) continue;

    const rawDigits = jid.split('@')[0].replace(/\D/g, '');
    if (rawDigits.length < 8 || rawDigits.length > 15) continue;

    // Passa o JID completo para preservar números internacionais (ex: 61434484212@s.whatsapp.net da Austrália)
    const comparable = extractComparablePhoneKey(jid) || `intl:${rawDigits}`;
    const matchedProfile = profileByComparableKey.get(comparable) || null;
    const existing = existingByJid.get(jid) || null;

    const optOut = Boolean(existing?.opt_out || matchedProfile?.whatsapp_opt_out);
    const preservedCustomName = existing?.custom_name ? String(existing.custom_name).trim() : null;
    const evoPushName = c.pushName || c.profileName || c.name || matchedProfile?.full_name || null;
    const effectivePushName = preservedCustomName || evoPushName;

    const identity = resolveContactIdentity({
      custom_name: preservedCustomName,
      app_full_name: matchedProfile?.full_name || null,
      push_name: effectivePushName,
    });

    dedupByJid.set(jid, {
      jid,
      phone_digits: rawDigits,
      comparable_phone: comparable,
      custom_name: preservedCustomName,
      push_name: effectivePushName,
      first_name_clean: identity.firstName || null,
      has_valid_name: identity.hasValidName,
      profile_pic_url: c.profilePicUrl || null,
      is_saved_in_phone: Boolean(c.isSaved),
      is_registered_user: Boolean(matchedProfile),
      app_user_id: matchedProfile?.id || null,
      app_full_name: matchedProfile?.full_name || null,
      app_email: matchedProfile?.email || null,
      app_plan_id: matchedProfile?.plan_id || null,
      app_plan_status: matchedProfile?.plan_status || null,
      app_main_goal: matchedProfile?.main_goal || null,
      opt_out: optOut,
      last_outreach_at: existing?.last_outreach_at || null,
      last_outreach_status: existing?.last_outreach_status || null,
      outreach_count: existing?.outreach_count || 0,
      synced_at: nowIso,
      updated_at: nowIso,
    });
  }

  // Inclui também usuários cadastrados no App (izaque_profiles) com telefone válido que ainda não estavam na agenda Evolution
  const seenComparables = new Set(Array.from(dedupByJid.values()).map((r) => r.comparable_phone));
  for (const prof of profilesRes.data || []) {
    if (!prof.phone) continue;
    const normalizedDigits = normalizeWhatsAppPhone(prof.phone);
    if (normalizedDigits.length < 10 || normalizedDigits.length > 15) continue;
    const jid = `${normalizedDigits}@s.whatsapp.net`;
    if (jid === cfg.instanceJid) continue;
    const comparable = extractComparablePhoneKey(jid) || `intl:${normalizedDigits}`;
    if (seenComparables.has(comparable) || dedupByJid.has(jid)) continue;
    seenComparables.add(comparable);

    const existing = existingByJid.get(jid) || null;
    const preservedCustomName = existing?.custom_name ? String(existing.custom_name).trim() : null;
    const identity = resolveContactIdentity({
      custom_name: preservedCustomName,
      app_full_name: prof.full_name || null,
      push_name: preservedCustomName || prof.full_name || null,
    });

    dedupByJid.set(jid, {
      jid,
      phone_digits: normalizedDigits,
      comparable_phone: comparable,
      custom_name: preservedCustomName,
      push_name: preservedCustomName || prof.full_name || normalizedDigits,
      first_name_clean: identity.firstName || null,
      has_valid_name: identity.hasValidName,
      profile_pic_url: null,
      is_saved_in_phone: false,
      is_registered_user: true,
      app_user_id: prof.id,
      app_full_name: prof.full_name || null,
      app_email: prof.email || null,
      app_plan_id: prof.plan_id || null,
      app_plan_status: prof.plan_status || null,
      app_main_goal: prof.main_goal || null,
      opt_out: Boolean(existing?.opt_out || prof.whatsapp_opt_out),
      last_outreach_at: existing?.last_outreach_at || null,
      last_outreach_status: existing?.last_outreach_status || null,
      outreach_count: existing?.outreach_count || 0,
      synced_at: nowIso,
      updated_at: nowIso,
    });
  }

  const rows = Array.from(dedupByJid.values());
  const chunkSize = 250;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const { error } = await supabaseAdmin
      .from('izaque_whatsapp_contacts')
      .upsert(slice, { onConflict: 'jid' });
    if (error) throw error;
  }

  const registeredCount = rows.filter((r) => r.is_registered_user).length;
  const unregisteredCount = rows.length - registeredCount;
  const optOutCount = rows.filter((r) => r.opt_out).length;
  const validNameCount = rows.filter((r) => r.has_valid_name).length;
  const invalidNameCount = rows.length - validNameCount;

  return {
    syncedTotal: rows.length,
    registeredCount,
    unregisteredCount,
    optOutCount,
    validNameCount,
    invalidNameCount,
    syncedAt: nowIso,
  };
}

let evoDbPool = null;
async function tryUpdateEvolutionContactDb(remoteJid, newName) {
  const evoDbUrl = (process.env.EVOLUTION_DATABASE_URL || process.env.EVOLUTION_DB_URI || '').trim();
  if (!evoDbUrl) {
    return { updatedInEvoDb: false, reason: 'no_direct_evo_db_uri' };
  }
  try {
    if (!evoDbPool) {
      evoDbPool = new pg.Pool({ connectionString: evoDbUrl, max: 2, connectionTimeoutMillis: 4000 });
    }
    const res = await evoDbPool.query(
      'UPDATE "Contact" SET "pushName" = $1, "updatedAt" = NOW() WHERE "remoteJid" = $2',
      [newName, remoteJid]
    );
    return { updatedInEvoDb: (res.rowCount || 0) > 0, rowCount: res.rowCount || 0 };
  } catch (err) {
    console.warn('⚠️ [Evolution Contact DB Sync]:', err.message);
    return { updatedInEvoDb: false, reason: err.message };
  }
}

/**
 * 1.B EDITAR E SALVAR NOME DO CONTATO NA AGENDA (APP + EVOLUTION API)
 */
export async function updateOutreachContactName({ contactId, customName }) {
  if (!contactId) {
    throw new Error('ID do contato é obrigatório.');
  }

  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('izaque_whatsapp_contacts')
    .select('*')
    .eq('id', contactId)
    .maybeSingle();

  if (fetchErr || !existing) {
    throw new Error('Contato não encontrado.');
  }

  const trimmed = String(customName || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  const nextCustomName = trimmed || null;

  const identity = resolveContactIdentity({
    custom_name: nextCustomName,
    app_full_name: existing.app_full_name,
    push_name: nextCustomName || existing.push_name,
  });

  const nowIso = new Date().toISOString();
  const updatePayload = {
    custom_name: nextCustomName,
    push_name: nextCustomName || existing.push_name,
    first_name_clean: identity.firstName || null,
    has_valid_name: identity.hasValidName,
    updated_at: nowIso,
  };

  const { data: updatedContact, error: updErr } = await supabaseAdmin
    .from('izaque_whatsapp_contacts')
    .update(updatePayload)
    .eq('id', contactId)
    .select('*')
    .single();

  if (updErr) throw updErr;

  // Se o contato já é usuário do App e não tinha nome válido no perfil, sincroniza também
  if (existing.app_user_id && nextCustomName && !analyzeContactName(existing.app_full_name).hasValidName) {
    await supabaseAdmin
      .from('izaque_profiles')
      .update({ full_name: nextCustomName, updated_at: nowIso })
      .eq('id', existing.app_user_id)
      .then(() => {})
      .catch(() => {});
  }

  // Sincroniza também com a base da Evolution API quando disponível
  let evoSyncResult = { updatedInEvoDb: false };
  if (nextCustomName && existing.jid) {
    evoSyncResult = await tryUpdateEvolutionContactDb(existing.jid, nextCustomName);
  }

  const phoneMeta = parseUniversalPhone(updatedContact.jid || updatedContact.phone_digits);
  return {
    contact: {
      ...updatedContact,
      display_name: identity.displayName || updatedContact.push_name || '',
      first_name_clean: identity.firstName || null,
      has_valid_name: identity.hasValidName,
      formatted_phone: phoneMeta.displayFormatted || updatedContact.phone_digits,
      is_international: !phoneMeta.isBrazil,
      country_name: phoneMeta.country || (phoneMeta.isBrazil ? 'Brasil' : 'Internacional'),
      country_flag: phoneMeta.flag || (phoneMeta.isBrazil ? '🇧🇷' : '🌏'),
    },
    evolutionSync: evoSyncResult,
  };
}

/**
 * 2. MONTAGEM PERSONALIZADA E ANTI-BAN DAS MENSAGENS (NÃO CADASTRADO vs CADASTRADO)
 */
export function buildUnregisteredInviteMessage(contact, customTemplate = '', { forceIntl = null } = {}) {
  const isIntl = forceIntl !== null ? Boolean(forceIntl) : isInternationalContact(contact);
  const greeting = getGreetingForContact(contact, isIntl);
  const identity = resolveContactIdentity(contact);
  const firstName = identity.firstName; // Sempre Primeiro Nome (ou vazio se sem nome válido)

  if (customTemplate && customTemplate.trim()) {
    return interpolateOutreachVariables(customTemplate, {
      greeting,
      firstName,
    });
  }

  if (isIntl) {
    const intlHello = firstName
      ? `${greeting}, ${firstName}! How are you doing?`
      : `${greeting}! How are you doing?`;

    const intlVariations = [
      `${intlHello}\n\nI would love to introduce you to a wonderful tool for mental clarity and personal growth: *ISAAC Mentoring*.\n\nISAAC is a confidential mentor available 24/7 by text and voice, created to listen without judgement, help untangle emotional blocks, and bring clear direction to your decisions.\n\nFull access via the Web App is *100% free of charge*. Come and experience your personalised space for reflection right now:\nhttps://isaac.lynxems.com.br/\n\n_(If you would rather not receive invitations here, simply reply "stop".)_`,
      `${intlHello}\n\nJust dropping a quick note to share a truly meaningful experience with you: meet *ISAAC*, a confidential mentoring space designed for deep listening, emotional clarity, and thoughtful decision-making.\n\nYou can reflect at your own pace by text or voice with complete privacy, 100% free of charge on the Web App:\nhttps://isaac.lynxems.com.br/\n\n_(Should you prefer not to receive messages here, simply reply "stop" at any time.)_`,
      `${intlHello}\n\nHave you heard of *ISAAC Mentoring*? It is a calm, confidential space built for anyone wishing to quiet the mind, overcome hesitation, and make clearer choices with purpose.\n\nExperience your personalised mentoring session free of charge today:\nhttps://isaac.lynxems.com.br/\n\n_(To opt out of future invitations, simply reply "stop".)_`,
    ];

    const idx = Math.abs(
      String(contact?.jid || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    ) % intlVariations.length;

    return intlVariations[idx];
  }

  const hello = firstName ? `${greeting}, ${firstName}! Tudo bem com você?` : `${greeting}! Tudo bem com você?`;

  const variations = [
    `${hello}\n\nQuero te apresentar uma ferramenta maravilhosa de clareza mental e desenvolvimento pessoal: a *Mentoria ISAAC*.\n\nO ISAAC é um mentor confidencial, disponível 24h em texto e voz, criado para ouvir sem julgamentos, ajudar a desatar bloqueios emocionais e trazer direção para as suas decisões.\n\nO acesso completo pelo App Web é *100% gratuito*. Venha conhecer e experimentar agora:\nhttps://isaac.lynxems.com.br/\n\n_(Se não desejar receber convites por aqui, basta responder "parar".)_`,
    `${hello}\n\nPassando para compartilhar com você uma experiência transformadora: conheça o *ISAAC*, uma ferramenta maravilhosa de escuta profunda, clareza emocional e mentoria pessoal.\n\nLá você pode conversar escrevendo ou gravando áudios com total sigilo, no seu próprio ritmo, e começar gratuitamente agora mesmo pelo App:\nhttps://isaac.lynxems.com.br/\n\n_(Caso prefira não receber mensagens, responda "parar" a qualquer momento.)_`,
    `${hello}\n\nVocê já conhece a *Mentoria ISAAC*? É uma ferramenta maravilhosa criada para quem busca desacelerar a mente, vencer a hesitação e tomar decisões com serenidade e propósito.\n\nExperimente gratuitamente hoje mesmo o seu espaço confidencial de reflexão:\nhttps://isaac.lynxems.com.br/\n\n_(Para não receber novas mensagens, basta responder "parar".)_`,
  ];

  const idx = Math.abs(
    String(contact?.jid || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  ) % variations.length;

  return variations[idx];
}

export async function buildRegisteredPlansMessage(contact, customTemplate = '', { forceIntl = null } = {}) {
  const isIntl = forceIntl !== null ? Boolean(forceIntl) : isInternationalContact(contact);
  const greeting = getGreetingForContact(contact, isIntl);
  const identity = resolveContactIdentity(contact);
  const firstName = identity.firstName; // Sempre Primeiro Nome (ou vazio se sem nome válido)

  let recentTopicHint = '';
  if (contact?.app_user_id) {
    try {
      const { data: lastSess } = await supabaseAdmin
        .from('izaque_chat_sessions')
        .select('title')
        .eq('user_id', contact.app_user_id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastSess?.title && !['Nova Reflexão', 'Reflexão Inicial'].includes(lastSess.title)) {
        recentTopicHint = isIntl
          ? ` Your conversations (such as *"${lastSess.title}"*) remain safely and confidentially stored waiting for you.`
          : ` Suas conversas (como *"${lastSess.title}"*) seguem guardadas com todo sigilo esperando por você.`;
      }
    } catch {}
  }

  if (!recentTopicHint && contact?.app_main_goal) {
    recentTopicHint = isIntl
      ? ` We continue supporting your focus on *${contact.app_main_goal}*.`
      : ` Seguimos juntos apoiando o seu foco em *${contact.app_main_goal}*.`;
  }

  if (customTemplate && customTemplate.trim()) {
    return interpolateOutreachVariables(customTemplate, {
      greeting,
      firstName,
      contextHint: recentTopicHint,
    });
  }

  if (isIntl) {
    return interpolateOutreachVariables(DEFAULT_INTL_REGISTERED_TEMPLATE, {
      greeting,
      firstName,
      contextHint: recentTopicHint,
    });
  }

  const opening = firstName
    ? `${greeting}, ${firstName}! Que alegria ter você na *Mentoria ISAAC*.`
    : `${greeting}! Que alegria ter você na *Mentoria ISAAC*.`;

  return `${opening}${recentTopicHint}\n\nAgora sua conta está integrada ao nosso canal e queremos lembrar como funcionam os nossos *2 planos* para você aproveitar cada recurso da melhor forma:\n\n✅ *Plano Gratuito (R$ 0,00 — Sempre Livre):*\n• Acesso 100% liberado no App Web em texto e voz\n• Agente Orquestrador ISAAC + todos os Mentores Especialistas\n• Memória evolutiva contínua e Laboratório do Incômodo Criativo\n• Sem cartão de crédito e sem vínculo financeiro\n\n💬 *Plano Pago — ISAAC no WhatsApp (R$ 14,99 / vencimento mensal):*\n• Tudo do Plano Gratuito liberado no App\n• Conversa direta aqui pelo *WhatsApp em Texto e Áudio* com o Agente Orquestrador ISAAC\n• Reconhecimento automático pelo seu telefone e sincronização imediata no mesmo chat do App\n• Assinatura mensal segura via Asaas (PIX, Cartão ou Boleto)\n\n👉 Acesse sua mentoria ou veja os detalhes dos planos aqui:\nhttps://isaac.lynxems.com.br/#planos\n\n_(Se preferir não receber comunicados no WhatsApp, basta responder "parar".)_`;
}

/**
 * 3. EXECUÇÃO UNITÁRIA CONTROLADA DE UM ITEM DE ENVIO (COM TRAVA DE SEGURANÇA E LOG)
 */
export async function executeSingleOutreachLogItem(logItem, campaign, safetyCfg, { bypassCooldown = false } = {}) {
  const nowIso = new Date().toISOString();

  // Barreira 0: Evolution global habilitada?
  const evoEnabled = await isEvolutionEnabledInDatabase();
  if (!evoEnabled) {
    await supabaseAdmin
      .from('izaque_whatsapp_outreach_logs')
      .update({
        status: 'failed',
        error_reason: 'Integração Evolution desativada no painel SuperAdmin.',
      })
      .eq('id', logItem.id);
    return { outcome: 'failed', reason: 'evolution_disabled' };
  }

  // Barreira 1 (CRÍTICA): TRAVA DE SEGURANÇA — SÓ PERMITE NÚMEROS AUTORIZADOS (31995574906)
  if (!isPhoneAllowedBySafetyLock(logItem.jid || logItem.phone_digits, safetyCfg)) {
    await supabaseAdmin
      .from('izaque_whatsapp_outreach_logs')
      .update({
        status: 'blocked_safety_lock',
        error_reason: `Bloqueado pela Trava de Segurança: envio restrito somente a ${safetyCfg.allowedPhonesRaw}.`,
      })
      .eq('id', logItem.id);
    return { outcome: 'blocked_safety_lock' };
  }

  // Busca dados frescos do contato
  let contact = null;
  if (logItem.contact_id) {
    const { data } = await supabaseAdmin
      .from('izaque_whatsapp_contacts')
      .select('*')
      .eq('id', logItem.contact_id)
      .maybeSingle();
    contact = data;
  }
  if (!contact) {
    const { data } = await supabaseAdmin
      .from('izaque_whatsapp_contacts')
      .select('*')
      .eq('jid', logItem.jid)
      .maybeSingle();
    contact = data;
  }

  // Barreira 2: Opt-out respeitado rigorosamente (Regra Anti-Ban Meta)
  if (contact?.opt_out) {
    await supabaseAdmin
      .from('izaque_whatsapp_outreach_logs')
      .update({
        status: 'skipped_opt_out',
        error_reason: 'Contato solicitou opt-out ("parar") anteriormente.',
      })
      .eq('id', logItem.id);
    return { outcome: 'skipped_opt_out' };
  }

  // Barreira 3: Cooldown Anti-Spam por contato
  if (!bypassCooldown && safetyCfg.cooldownHours > 0 && contact?.last_outreach_at) {
    const elapsedMs = Date.now() - new Date(contact.last_outreach_at).getTime();
    const minCooldownMs = safetyCfg.cooldownHours * 3600 * 1000;
    if (elapsedMs < minCooldownMs) {
      await supabaseAdmin
        .from('izaque_whatsapp_outreach_logs')
        .update({
          status: 'skipped_cooldown',
          error_reason: `Proteção Anti-Ban: contato já recebeu disparo nas últimas ${safetyCfg.cooldownHours}h.`,
        })
        .eq('id', logItem.id);
      return { outcome: 'skipped_cooldown' };
    }
  }

  // Barreira 4: Validação prévia de número WhatsApp ativo na Evolution
  const check = await resolveWhatsAppJid(logItem.phone_digits || logItem.jid);
  if (!check.exists || !check.jid) {
    await supabaseAdmin
      .from('izaque_whatsapp_outreach_logs')
      .update({
        status: 'skipped_invalid_whatsapp',
        error_reason: `Número sem WhatsApp ativo (${check.reason || 'not_found'}).`,
      })
      .eq('id', logItem.id);
    return { outcome: 'skipped_invalid_whatsapp' };
  }

  // Marca como enviando
  await supabaseAdmin
    .from('izaque_whatsapp_outreach_logs')
    .update({ status: 'sending' })
    .eq('id', logItem.id);

  try {
    let sendResult;
    let finalMessageText = logItem.message_sent || '';
    let finalMediaUrl = logItem.media_url || null;
    const savedTemplates = await getSavedOutreachTemplates();
    const isIntlTarget = isInternationalContact(contact || { jid: check.jid, phone_digits: logItem.phone_digits });

    if (logItem.flow_type === 'unregistered_invite_image') {
      const effectiveUnregTpl = isIntlTarget
        ? campaign?.intl_unregistered_template || savedTemplates.intlUnregisteredTemplate || ''
        : campaign?.unregistered_template || savedTemplates.unregisteredTemplate || '';
      finalMessageText =
        finalMessageText ||
        buildUnregisteredInviteMessage(
          contact || { push_name: logItem.recipient_name, jid: check.jid },
          effectiveUnregTpl,
          { forceIntl: isIntlTarget }
        );
      finalMediaUrl =
        finalMediaUrl ||
        campaign?.unregistered_image_url ||
        savedTemplates.unregisteredImageUrl ||
        DEFAULT_ISAAC_IMAGE_URL;

      sendResult = await sendWhatsAppImageSafe({
        jidOrNumber: check.jid,
        caption: finalMessageText,
        mediaUrl: finalMediaUrl,
      });
    } else {
      const effectiveRegTpl = isIntlTarget
        ? campaign?.intl_registered_template || savedTemplates.intlRegisteredTemplate || ''
        : campaign?.registered_template || savedTemplates.registeredTemplate || '';
      finalMessageText =
        finalMessageText ||
        (await buildRegisteredPlansMessage(
          contact || {
            app_user_id: logItem.app_user_id,
            app_full_name: logItem.recipient_name,
            jid: check.jid,
          },
          effectiveRegTpl,
          { forceIntl: isIntlTarget }
        ));

      const campaignCoverUrl = String(campaign?.unregistered_image_url || finalMediaUrl || '').trim();
      const isEbookCoverCampaign = campaignCoverUrl.includes('/ebooks/covers/');

      if (isEbookCoverCampaign) {
        finalMediaUrl = campaignCoverUrl;
        sendResult = await sendWhatsAppImageSafe({
          jidOrNumber: check.jid,
          caption: finalMessageText,
          mediaUrl: campaignCoverUrl,
        });
      } else {
        sendResult = await sendWhatsAppTextSafe({
          jidOrNumber: check.jid,
          text: finalMessageText,
        });
      }

      // Integração direta com o usuário no App (registra também no Mural de Notificações In-App)
      const targetUserId = logItem.app_user_id || contact?.app_user_id;
      if (targetUserId) {
        await supabaseAdmin
          .from('izaque_user_notifications')
          .insert({
            user_id: targetUserId,
            title: isEbookCoverCampaign
              ? isIntlTarget
                ? 'New Bilingual eBook by Thiago Prata — ISAAC®'
                : 'Novo eBook Bilíngue por Thiago Prata — ISAAC®'
              : isIntlTarget
                ? 'Discover ISAAC Free & WhatsApp Plans'
                : 'Conheça os Planos Grátis & WhatsApp do ISAAC',
            content: finalMessageText,
            is_read: false,
          })
          .then(() => {})
          .catch(() => {});
      }
    }

    const sentAtIso = new Date().toISOString();
    await supabaseAdmin
      .from('izaque_whatsapp_outreach_logs')
      .update({
        status: 'sent',
        jid: check.jid,
        media_url: finalMediaUrl,
        message_sent: finalMessageText,
        evolution_message_id: sendResult.messageId,
        anti_ban_delay_ms: sendResult.totalCadenceMs || 0,
        sent_at: sentAtIso,
        error_reason: null,
      })
      .eq('id', logItem.id);

    if (contact?.id) {
      await supabaseAdmin
        .from('izaque_whatsapp_contacts')
        .update({
          last_outreach_at: sentAtIso,
          last_outreach_status: 'sent',
          outreach_count: (contact.outreach_count || 0) + 1,
          updated_at: sentAtIso,
        })
        .eq('id', contact.id);
    }

    return {
      outcome: 'sent',
      messageId: sendResult.messageId,
      jid: check.jid,
      flowType: logItem.flow_type,
    };
  } catch (err) {
    await supabaseAdmin
      .from('izaque_whatsapp_outreach_logs')
      .update({
        status: 'failed',
        error_reason: err.message?.slice(0, 300) || 'Erro no disparo Evolution API.',
      })
      .eq('id', logItem.id);

    if (contact?.id) {
      await supabaseAdmin
        .from('izaque_whatsapp_contacts')
        .update({
          last_outreach_status: 'failed',
          updated_at: nowIso,
        })
        .eq('id', contact.id);
    }

    return { outcome: 'failed', error: err.message };
  }
}

/**
 * 4. CRIAR / PROGRAMAR CAMPANHA DE DISPARO CONTROLADO (IMEDIATA OU AGENDADA)
 */
export async function createOrScheduleOutreachCampaign({
  title,
  audienceType = 'selected', // 'unregistered' | 'registered' | 'mixed' | 'selected'
  contactIds = [],
  scheduledAt = null,
  minDelaySec = 18,
  maxDelaySec = 38,
  dailyLimit = 40,
  windowStartHhmm = '08:30',
  windowEndHhmm = '20:00',
  respectWindow = true,
  unregisteredImageUrl = DEFAULT_ISAAC_IMAGE_URL,
  unregisteredTemplate = '',
  registeredTemplate = '',
  intlUnregisteredTemplate = '',
  intlRegisteredTemplate = '',
  forceFlowType = null, // permite testar ambos os fluxos no número autorizado 31995574906
  createdBy = null,
}) {
  const [safetyCfg, savedTemplates] = await Promise.all([
    getOutreachSafetyConfig(),
    getSavedOutreachTemplates(),
  ]);

  const resolvedImageUrl =
    String(unregisteredImageUrl || '').trim() ||
    savedTemplates.unregisteredImageUrl ||
    DEFAULT_ISAAC_IMAGE_URL;
  const resolvedUnregisteredTemplate =
    String(unregisteredTemplate || '').trim() ||
    savedTemplates.unregisteredTemplate ||
    null;
  const resolvedRegisteredTemplate =
    String(registeredTemplate || '').trim() ||
    savedTemplates.registeredTemplate ||
    null;
  const resolvedIntlUnregisteredTemplate =
    String(intlUnregisteredTemplate || '').trim() ||
    savedTemplates.intlUnregisteredTemplate ||
    null;
  const resolvedIntlRegisteredTemplate =
    String(intlRegisteredTemplate || '').trim() ||
    savedTemplates.intlRegisteredTemplate ||
    null;

  let candidates = [];
  if (Array.isArray(contactIds) && contactIds.length > 0) {
    const cleanIds = Array.from(new Set(contactIds.filter(Boolean)));
    const idChunkSize = 180;
    for (let i = 0; i < cleanIds.length; i += idChunkSize) {
      const sliceIds = cleanIds.slice(i, i + idChunkSize);
      const { data: batchRows, error: batchErr } = await supabaseAdmin
        .from('izaque_whatsapp_contacts')
        .select('*')
        .eq('opt_out', false)
        .in('id', sliceIds);
      if (batchErr) throw batchErr;
      if (batchRows) candidates.push(...batchRows);
    }
  } else {
    const pagedRes = await fetchPaginatedSupabaseRows(() => {
      let query = supabaseAdmin.from('izaque_whatsapp_contacts').select('*').eq('opt_out', false);
      if (audienceType === 'unregistered') {
        query = query.eq('is_registered_user', false);
      } else if (audienceType === 'registered') {
        query = query.eq('is_registered_user', true);
      } else if (audienceType === 'valid_name') {
        query = query.eq('has_valid_name', true);
      } else if (audienceType === 'international') {
        query = query.not('phone_digits', 'like', '55%');
      }
      return query.order('is_registered_user', { ascending: false }).order('id', { ascending: true });
    }, 5000);
    candidates = pagedRes.data || [];
  }

  // Filtra apenas contatos permitidos pela trava quando restrito, para nunca enfileirar disparos indevidos em massa
  const filteredContacts = safetyCfg.restrictedMode
    ? (candidates || []).filter((c) => isPhoneAllowedBySafetyLock(c.jid || c.phone_digits, safetyCfg))
    : candidates || [];

  if (filteredContacts.length === 0) {
    throw new Error(
      safetyCfg.restrictedMode
        ? `Trava de Segurança ativa: apenas o número autorizado (${safetyCfg.allowedPhonesRaw}) pode receber disparos no momento.`
        : 'Nenhum contato elegível encontrado para os filtros selecionados.'
    );
  }

  const schedDate = scheduledAt ? new Date(scheduledAt) : new Date();
  const safeMinDelay = Math.max(8, Number(minDelaySec) || 18);
  const safeMaxDelay = Math.max(safeMinDelay + 5, Number(maxDelaySec) || 38);

  const { data: campaign, error: campErr } = await supabaseAdmin
    .from('izaque_whatsapp_outreach_campaigns')
    .insert({
      title: String(title || 'Disparo Programado Mentoria ISAAC').trim(),
      audience_type: audienceType,
      status: 'scheduled',
      scheduled_at: schedDate.toISOString(),
      min_delay_sec: safeMinDelay,
      max_delay_sec: safeMaxDelay,
      daily_limit: Math.max(1, Number(dailyLimit) || safetyCfg.dailyLimit || 40),
      window_start_hhmm: windowStartHhmm || '08:30',
      window_end_hhmm: windowEndHhmm || '20:00',
      respect_window: Boolean(respectWindow),
      unregistered_image_url: resolvedImageUrl,
      unregistered_template: resolvedUnregisteredTemplate,
      registered_template: resolvedRegisteredTemplate,
      intl_unregistered_template: resolvedIntlUnregisteredTemplate,
      intl_registered_template: resolvedIntlRegisteredTemplate,
      total_targets: filteredContacts.length,
      created_by: createdBy || null,
    })
    .select()
    .single();

  if (campErr) throw campErr;

  // Escalonamento progressivo de horários individuais (scheduled_for) respeitando a regra Anti-Ban da Meta
  let cursorMs = schedDate.getTime();
  const queueRows = filteredContacts.map((contact, idx) => {
    if (idx > 0) {
      cursorMs += randomBetween(safeMinDelay * 1000, safeMaxDelay * 1000);
    }
    const flowType =
      forceFlowType === 'unregistered_invite_image' || forceFlowType === 'registered_plans_integration'
        ? forceFlowType
        : contact.is_registered_user
        ? 'registered_plans_integration'
        : 'unregistered_invite_image';

    return {
      campaign_id: campaign.id,
      contact_id: contact.id,
      app_user_id: contact.app_user_id || null,
      jid: contact.jid,
      phone_digits: contact.phone_digits,
      recipient_name: contact.custom_name || contact.app_full_name || contact.push_name || contact.phone_digits,
      is_registered_user: Boolean(contact.is_registered_user),
      flow_type: flowType,
      status: 'queued',
      media_url: flowType === 'unregistered_invite_image' ? resolvedImageUrl : null,
      scheduled_for: new Date(cursorMs).toISOString(),
    };
  });

  const insertBatchSize = 400;
  for (let i = 0; i < queueRows.length; i += insertBatchSize) {
    const batch = queueRows.slice(i, i + insertBatchSize);
    const { error: logsErr } = await supabaseAdmin.from('izaque_whatsapp_outreach_logs').insert(batch);
    if (logsErr) throw logsErr;
  }

  // Se agendado para agora (<= +5s), dispara o primeiro tick assíncrono
  if (schedDate.getTime() <= Date.now() + 5000) {
    setImmediate(() => {
      processOutreachQueueTick({ bypassCooldown: true }).catch((e) =>
        console.warn('⚠️ [Outreach Immediate Tick]:', e.message)
      );
    });
  }

  return {
    campaign,
    queuedCount: queueRows.length,
    safetyLockActive: safetyCfg.restrictedMode,
    allowedPhones: safetyCfg.allowedPhonesRaw,
  };
}

/**
 * 5. DISPARO DIRETO DE TESTE / DEMONSTRAÇÃO DOS 2 FLUXOS (RESPEITANDO A TRAVA DE SEGURANÇA 31995574906)
 */
export async function sendDirectOutreachPreview({
  phone = STRICT_DEFAULT_SAFE_PHONE,
  flowType = 'unregistered_invite_image', // 'unregistered_invite_image' | 'registered_plans_integration'
  customImageUrl = '',
  customTemplate = '',
  customTitle = '',
  createdBy = null,
}) {
  const [safetyCfg, savedTemplates] = await Promise.all([
    getOutreachSafetyConfig(),
    getSavedOutreachTemplates(),
  ]);
  if (!isPhoneAllowedBySafetyLock(phone, safetyCfg)) {
    throw new Error(
      `Bloqueado pela Trava de Segurança: o envio só está autorizado para ${safetyCfg.allowedPhonesRaw}.`
    );
  }

  const isIntlPreview = isInternationalContact(phone);
  const resolvedPreviewImageUrl =
    String(customImageUrl || '').trim() ||
    savedTemplates.unregisteredImageUrl ||
    DEFAULT_ISAAC_IMAGE_URL;
  const resolvedPreviewTemplate =
    String(customTemplate || '').trim() ||
    (flowType === 'unregistered_invite_image'
      ? isIntlPreview
        ? savedTemplates.intlUnregisteredTemplate
        : savedTemplates.unregisteredTemplate
      : isIntlPreview
      ? savedTemplates.intlRegisteredTemplate
      : savedTemplates.registeredTemplate) ||
    null;

  const comparable = extractComparablePhoneKey(phone);
  const { data: contact } = await supabaseAdmin
    .from('izaque_whatsapp_contacts')
    .select('*')
    .eq('comparable_phone', comparable)
    .maybeSingle();

  const check = await resolveWhatsAppJid(phone);
  if (!check.exists || !check.jid) {
    throw new Error(`O número ${phone} não possui WhatsApp ativo na Evolution API.`);
  }

  const { data: campaign } = await supabaseAdmin
    .from('izaque_whatsapp_outreach_campaigns')
    .insert({
      title:
        (customTitle && String(customTitle).trim()) ||
        (flowType === 'unregistered_invite_image'
          ? `Envio Convite com Imagem ISAAC (${phone})`
          : `Envio Integração Planos Grátis & Pago (${phone})`),
      audience_type: 'selected',
      status: 'running',
      scheduled_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      respect_window: false,
      unregistered_image_url: resolvedPreviewImageUrl,
      unregistered_template:
        !isIntlPreview && flowType === 'unregistered_invite_image' ? resolvedPreviewTemplate : null,
      registered_template:
        !isIntlPreview && flowType === 'registered_plans_integration' ? resolvedPreviewTemplate : null,
      intl_unregistered_template:
        isIntlPreview && flowType === 'unregistered_invite_image' ? resolvedPreviewTemplate : null,
      intl_registered_template:
        isIntlPreview && flowType === 'registered_plans_integration' ? resolvedPreviewTemplate : null,
      total_targets: 1,
      created_by: createdBy || null,
    })
    .select()
    .single();

  const { data: logRow, error: logErr } = await supabaseAdmin
    .from('izaque_whatsapp_outreach_logs')
    .insert({
      campaign_id: campaign?.id || null,
      contact_id: contact?.id || null,
      app_user_id: contact?.app_user_id || null,
      jid: check.jid,
      phone_digits: normalizeWhatsAppPhone(phone),
      recipient_name:
        contact?.custom_name || contact?.app_full_name || contact?.push_name || check.whatsappName || phone,
      is_registered_user: Boolean(contact?.is_registered_user),
      flow_type: flowType,
      status: 'queued',
      media_url: flowType === 'unregistered_invite_image' ? resolvedPreviewImageUrl : null,
      scheduled_for: new Date().toISOString(),
    })
    .select()
    .single();

  if (logErr) throw logErr;

  const execRes = await executeSingleOutreachLogItem(logRow, campaign, safetyCfg, { bypassCooldown: true });

  if (campaign?.id) {
    await supabaseAdmin
      .from('izaque_whatsapp_outreach_campaigns')
      .update({
        status: execRes.outcome === 'sent' ? 'completed' : 'failed',
        sent_count: execRes.outcome === 'sent' ? 1 : 0,
        blocked_safety_count: execRes.outcome === 'blocked_safety_lock' ? 1 : 0,
        failed_count: execRes.outcome === 'failed' ? 1 : 0,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaign.id);
  }

  return execRes;
}

/**
 * 6. ATUALIZAR CONTADORES E STATUS DA CAMPANHA
 */
async function refreshCampaignCounters(campaignId) {
  const logsRes = await fetchPaginatedSupabaseRows(
    () =>
      supabaseAdmin
        .from('izaque_whatsapp_outreach_logs')
        .select('status')
        .eq('campaign_id', campaignId)
        .order('id', { ascending: true }),
    6000
  );

  const list = logsRes.data || [];
  const queued = list.filter((l) => l.status === 'queued' || l.status === 'sending').length;
  const sent = list.filter((l) => l.status === 'sent').length;
  const blocked = list.filter((l) => l.status === 'blocked_safety_lock').length;
  const skipped = list.filter((l) =>
    ['skipped_opt_out', 'skipped_cooldown', 'skipped_invalid_whatsapp', 'cancelled'].includes(l.status)
  ).length;
  const failed = list.filter((l) => l.status === 'failed').length;

  const isDone = queued === 0;
  const nowIso = new Date().toISOString();

  await supabaseAdmin
    .from('izaque_whatsapp_outreach_campaigns')
    .update({
      status: isDone ? 'completed' : 'running',
      sent_count: sent,
      blocked_safety_count: blocked,
      skipped_count: skipped,
      failed_count: failed,
      completed_at: isDone ? nowIso : null,
      updated_at: nowIso,
    })
    .eq('id', campaignId);
}

/**
 * 7. MOTOR DE FILA ANTI-BAN AGENDADO (PROCESSA 1 ENVIO POR CICLO RESPEITANDO JANELA E LIMITE DIÁRIO)
 */
let isProcessingTick = false;
let outreachInterval = null;

export async function processOutreachQueueTick({ bypassCooldown = false } = {}) {
  if (isProcessingTick) return { skipped: 'already_running' };
  isProcessingTick = true;

  try {
    const evoEnabled = await isEvolutionEnabledInDatabase();
    if (!evoEnabled) return { skipped: 'evolution_disabled' };

    const safetyCfg = await getOutreachSafetyConfig();
    const now = new Date();
    const nowIso = now.toISOString();
    const { hhmm } = getBrtTimeInfo(now);

    // Verifica limite diário global nas últimas 24h (Proteção Anti-Ban Meta)
    const since24hIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count: sentLast24h } = await supabaseAdmin
      .from('izaque_whatsapp_outreach_logs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', since24hIso);

    if ((sentLast24h || 0) >= safetyCfg.dailyLimit) {
      return { skipped: 'daily_limit_reached', sentLast24h };
    }

    // Busca campanhas agendadas ou em andamento cujo horário já chegou
    const { data: activeCampaigns } = await supabaseAdmin
      .from('izaque_whatsapp_outreach_campaigns')
      .select('*')
      .in('status', ['scheduled', 'running'])
      .lte('scheduled_at', nowIso)
      .order('scheduled_at', { ascending: true })
      .limit(5);

    if (!activeCampaigns || activeCampaigns.length === 0) {
      return { processed: 0 };
    }

    let processedCount = 0;

    for (const camp of activeCampaigns) {
      if (camp.respect_window) {
        const startW = camp.window_start_hhmm || '08:30';
        const endW = camp.window_end_hhmm || '20:00';
        if (hhmm < startW || hhmm > endW) {
          continue;
        }
      }

      if (!camp.started_at) {
        await supabaseAdmin
          .from('izaque_whatsapp_outreach_campaigns')
          .update({ status: 'running', started_at: nowIso, updated_at: nowIso })
          .eq('id', camp.id);
      }

      // Pega APENAS 1 item da fila cujo scheduled_for já chegou (cadência orgânica humana)
      const { data: nextItems } = await supabaseAdmin
        .from('izaque_whatsapp_outreach_logs')
        .select('*')
        .eq('campaign_id', camp.id)
        .eq('status', 'queued')
        .lte('scheduled_for', nowIso)
        .order('scheduled_for', { ascending: true })
        .limit(1);

      if (!nextItems || nextItems.length === 0) {
        // Verifica se toda a fila da campanha já encerrou
        const { count: remaining } = await supabaseAdmin
          .from('izaque_whatsapp_outreach_logs')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', camp.id)
          .in('status', ['queued', 'sending']);

        if ((remaining || 0) === 0) {
          await refreshCampaignCounters(camp.id);
        }
        continue;
      }

      await executeSingleOutreachLogItem(nextItems[0], camp, safetyCfg, { bypassCooldown });
      await refreshCampaignCounters(camp.id);
      processedCount += 1;
      break; // Apenas 1 disparo por ciclo para nunca gerar rajadas simultâneas na Meta
    }

    return { processed: processedCount };
  } finally {
    isProcessingTick = false;
  }
}

export async function updateCampaignControlStatus(campaignId, action) {
  const nowIso = new Date().toISOString();
  if (action === 'pause') {
    await supabaseAdmin
      .from('izaque_whatsapp_outreach_campaigns')
      .update({ status: 'paused', updated_at: nowIso })
      .eq('id', campaignId);
  } else if (action === 'resume') {
    await supabaseAdmin
      .from('izaque_whatsapp_outreach_campaigns')
      .update({ status: 'running', updated_at: nowIso })
      .eq('id', campaignId);
  } else if (action === 'cancel') {
    await supabaseAdmin
      .from('izaque_whatsapp_outreach_campaigns')
      .update({ status: 'cancelled', completed_at: nowIso, updated_at: nowIso })
      .eq('id', campaignId);
    await supabaseAdmin
      .from('izaque_whatsapp_outreach_logs')
      .update({ status: 'cancelled', error_reason: 'Campanha cancelada pelo administrador.' })
      .eq('campaign_id', campaignId)
      .eq('status', 'queued');
  }
  return { success: true };
}

export async function getOutreachDashboardOverview({ search = '', filter = 'all', limit = 2500 } = {}) {
  const [safetyCfg, savedTemplates] = await Promise.all([
    getOutreachSafetyConfig(),
    getSavedOutreachTemplates(),
  ]);
  const since24hIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const buildContactsQuery = () => {
    let q = supabaseAdmin.from('izaque_whatsapp_contacts').select('*', { count: 'exact' });

    if (filter === 'registered') {
      q = q.eq('is_registered_user', true);
    } else if (filter === 'unregistered') {
      q = q.eq('is_registered_user', false);
    } else if (filter === 'valid_name') {
      q = q.eq('has_valid_name', true);
    } else if (filter === 'invalid_name') {
      q = q.eq('has_valid_name', false);
    } else if (filter === 'opt_out') {
      q = q.eq('opt_out', true);
    } else if (filter === 'sent') {
      q = q.gt('outreach_count', 0);
    } else if (filter === 'allowed_only' && safetyCfg.restrictedMode) {
      q = q.in('comparable_phone', safetyCfg.allowedComparableKeys);
    } else if (filter === 'international') {
      q = q.not('phone_digits', 'like', '55%');
    } else if (filter === 'brazil') {
      q = q.like('phone_digits', '55%');
    }

    if (search && search.trim()) {
      const term = search.trim().replace(/[%_]/g, '');
      const digitsOnly = term.replace(/\D/g, '');
      const digitsClause = digitsOnly.length >= 4 ? `,phone_digits.ilike.%${digitsOnly}%` : '';
      q = q.or(
        `custom_name.ilike.%${term}%,push_name.ilike.%${term}%,app_full_name.ilike.%${term}%,first_name_clean.ilike.%${term}%,phone_digits.ilike.%${term}%,app_email.ilike.%${term}%${digitsClause}`
      );
    }

    return q
      .order('is_registered_user', { ascending: false })
      .order('has_valid_name', { ascending: false })
      .order('updated_at', { ascending: false })
      .order('id', { ascending: true });
  };

  const [
    contactsRes,
    { count: totalContacts },
    { count: totalRegistered },
    { count: totalUnregistered },
    { count: totalValidName },
    { count: totalInvalidName },
    { count: totalInternational },
    { count: totalOptOut },
    { count: sentLast24h },
    campaignsRes,
    logsRes,
  ] = await Promise.all([
    fetchPaginatedSupabaseRows(buildContactsQuery, Math.min(5000, Number(limit) || 2500)),
    supabaseAdmin.from('izaque_whatsapp_contacts').select('id', { count: 'exact', head: true }),
    supabaseAdmin
      .from('izaque_whatsapp_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('is_registered_user', true),
    supabaseAdmin
      .from('izaque_whatsapp_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('is_registered_user', false),
    supabaseAdmin
      .from('izaque_whatsapp_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('has_valid_name', true),
    supabaseAdmin
      .from('izaque_whatsapp_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('has_valid_name', false),
    supabaseAdmin
      .from('izaque_whatsapp_contacts')
      .select('id', { count: 'exact', head: true })
      .not('phone_digits', 'like', '55%'),
    supabaseAdmin
      .from('izaque_whatsapp_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('opt_out', true),
    supabaseAdmin
      .from('izaque_whatsapp_outreach_logs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', since24hIso),
    supabaseAdmin
      .from('izaque_whatsapp_outreach_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25),
    supabaseAdmin
      .from('izaque_whatsapp_outreach_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60),
  ]);

  const contactsList = (contactsRes.data || []).map((c) => {
    const phoneMeta = parseUniversalPhone(c.jid || c.phone_digits);
    const identity = resolveContactIdentity(c);
    return {
      ...c,
      display_name: identity.displayName || c.push_name || '',
      first_name_clean: identity.firstName || c.first_name_clean || null,
      has_valid_name: identity.hasValidName,
      is_custom_name: identity.isCustomEdited,
      formatted_phone: phoneMeta.displayFormatted || c.phone_digits,
      is_international: !phoneMeta.isBrazil,
      country_name: phoneMeta.country || (phoneMeta.isBrazil ? 'Brasil' : 'Internacional'),
      country_flag: phoneMeta.flag || (phoneMeta.isBrazil ? '🇧🇷' : '🌏'),
      is_allowed_by_safety_lock: isPhoneAllowedBySafetyLock(c.jid || c.phone_digits, safetyCfg),
    };
  });

  contactsList.sort((a, b) => {
    if (a.is_allowed_by_safety_lock !== b.is_allowed_by_safety_lock) {
      return a.is_allowed_by_safety_lock ? -1 : 1;
    }
    if (a.is_registered_user !== b.is_registered_user) {
      return a.is_registered_user ? -1 : 1;
    }
    if (a.has_valid_name !== b.has_valid_name) {
      return a.has_valid_name ? -1 : 1;
    }
    return 0;
  });

  return {
    safety: safetyCfg,
    stats: {
      totalContacts: totalContacts || 0,
      totalRegistered: totalRegistered || 0,
      totalUnregistered: totalUnregistered || 0,
      totalValidName: totalValidName || 0,
      totalInvalidName: totalInvalidName || 0,
      totalInternational: totalInternational || 0,
      totalOptOut: totalOptOut || 0,
      sentLast24h: sentLast24h || 0,
      dailyLimit: safetyCfg.dailyLimit,
    },
    contacts: contactsList,
    filteredTotal: contactsRes.count || contactsList.length,
    campaigns: campaignsRes.data || [],
    recentLogs: logsRes.data || [],
    templates: savedTemplates,
    defaultImageUrl: DEFAULT_ISAAC_IMAGE_URL,
    sampleUnregisteredText: buildUnregisteredInviteMessage(
      { push_name: 'Thiago', jid: 'sample' },
      savedTemplates.unregisteredTemplate,
      { forceIntl: false }
    ),
    sampleRegisteredText: await buildRegisteredPlansMessage(
      { app_full_name: 'Edson', jid: 'sample' },
      savedTemplates.registeredTemplate,
      { forceIntl: false }
    ),
    sampleIntlUnregisteredText: buildUnregisteredInviteMessage(
      { push_name: 'Thiago', jid: 'sample_intl' },
      savedTemplates.intlUnregisteredTemplate,
      { forceIntl: true }
    ),
    sampleIntlRegisteredText: await buildRegisteredPlansMessage(
      { app_full_name: 'Thiago', jid: 'sample_intl' },
      savedTemplates.intlRegisteredTemplate,
      { forceIntl: true }
    ),
  };
}

export function startEvolutionOutreachScheduler() {
  if (outreachInterval) return;
  console.log('🛡️ [Evolution Outreach Scheduler] Motor de fila controlada Anti-Ban iniciado (ciclo 20s).');

  outreachInterval = setInterval(() => {
    processOutreachQueueTick().catch((err) => {
      console.error('⚠️ [Evolution Outreach Scheduler] Erro no ciclo:', err.message);
    });
  }, 20_000);

  if (typeof outreachInterval.unref === 'function') {
    outreachInterval.unref();
  }
}

