import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseAdmin } from '../config/supabase.js';
import {
  normalizeBrazilPhone,
  extractComparablePhoneKey,
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

function getEvoConfig() {
  return {
    baseUrl: (process.env.EVOLUTION_API_URL || DEFAULT_EVO_URL).replace(/\/$/, ''),
    instanceName: (process.env.EVOLUTION_INSTANCE_NAME || DEFAULT_EVO_INSTANCE).trim(),
    apiKey: (process.env.EVOLUTION_API_KEY || '').trim(),
    instanceJid: (process.env.EVOLUTION_INSTANCE_JID || DEFAULT_EVO_JID).trim(),
    appUrl: (process.env.APP_URL || DEFAULT_APP_URL).replace(/\/$/, ''),
  };
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

function cleanContactFirstName(rawName) {
  if (!rawName) return '';
  const cleaned = String(rawName)
    .replace(/[^\p{L}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  const first = cleaned.split(' ')[0];
  if (!first || first.length < 2) return '';
  const blocked = ['whatsapp', 'business', 'contato', 'cliente', 'suporte', 'atendimento', 'voce', 'você'];
  if (blocked.includes(first.toLowerCase())) return '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/**
 * Carrega a imagem oficial do ISAAC do disco (base64 rápido e 100% confiável) ou URL externa
 */
function loadDefaultIsaacImageBase64() {
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
  const isDefaultCover =
    !mediaUrl ||
    mediaUrl === DEFAULT_ISAAC_IMAGE_URL ||
    mediaUrl.endsWith('/og-isaac-cover.jpg');

  if (isDefaultCover) {
    const localBase64 = loadDefaultIsaacImageBase64();
    if (localBase64) {
      mediaPayload = localBase64;
    }
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
  return getOutreachSafetyConfig();
}

export function isPhoneAllowedBySafetyLock(phoneOrJid, safetyCfg) {
  if (!safetyCfg?.restrictedMode) return true;
  const targetKey = extractComparablePhoneKey(phoneOrJid);
  if (!targetKey) return false;
  return safetyCfg.allowedComparableKeys.includes(targetKey);
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
    supabaseAdmin
      .from('izaque_profiles')
      .select('id, full_name, email, phone, plan_id, plan_status, main_goal, whatsapp_opt_out'),
    supabaseAdmin
      .from('izaque_whatsapp_contacts')
      .select('jid, opt_out, last_outreach_at, last_outreach_status, outreach_count'),
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
    if (rawDigits.length < 10) continue;

    const comparable = extractComparablePhoneKey(rawDigits) || rawDigits;
    const matchedProfile = profileByComparableKey.get(comparable) || null;
    const existing = existingByJid.get(jid) || null;

    const optOut = Boolean(existing?.opt_out || matchedProfile?.whatsapp_opt_out);

    dedupByJid.set(jid, {
      jid,
      phone_digits: rawDigits,
      comparable_phone: comparable,
      push_name: c.pushName || c.profileName || c.name || matchedProfile?.full_name || null,
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

  return {
    syncedTotal: rows.length,
    registeredCount,
    unregisteredCount,
    optOutCount,
    syncedAt: nowIso,
  };
}

/**
 * 2. MONTAGEM PERSONALIZADA E ANTI-BAN DAS MENSAGENS (NÃO CADASTRADO vs CADASTRADO)
 */
export function buildUnregisteredInviteMessage(contact, customTemplate = '') {
  const { greeting } = getBrtTimeInfo();
  const firstName = cleanContactFirstName(contact?.push_name);
  const hello = firstName ? `${greeting}, ${firstName}! Tudo bem com você?` : `${greeting}! Tudo bem com você?`;

  if (customTemplate && customTemplate.trim()) {
    return customTemplate
      .replace(/\{saudacao\}/gi, greeting)
      .replace(/\{nome\}/gi, firstName || 'amigo(a)')
      .trim();
  }

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

export async function buildRegisteredPlansMessage(contact, customTemplate = '') {
  const { greeting } = getBrtTimeInfo();
  const firstName =
    cleanContactFirstName(contact?.app_full_name) ||
    cleanContactFirstName(contact?.push_name) ||
    'amigo(a)';

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
        recentTopicHint = ` Suas conversas (como *"${lastSess.title}"*) seguem guardadas com todo sigilo esperando por você.`;
      }
    } catch {}
  }

  if (!recentTopicHint && contact?.app_main_goal) {
    recentTopicHint = ` Seguimos juntos apoiando o seu foco em *${contact.app_main_goal}*.`;
  }

  if (customTemplate && customTemplate.trim()) {
    return customTemplate
      .replace(/\{saudacao\}/gi, greeting)
      .replace(/\{nome\}/gi, firstName)
      .replace(/\{contexto\}/gi, recentTopicHint.trim())
      .trim();
  }

  return `${greeting}, ${firstName}! Que alegria ter você na *Mentoria ISAAC*.${recentTopicHint}\n\nAgora sua conta está integrada ao nosso canal e queremos lembrar como funcionam os nossos *2 planos* para você aproveitar cada recurso da melhor forma:\n\n✅ *Plano Gratuito (R$ 0,00 — Sempre Livre):*\n• Acesso 100% liberado no App Web em texto e voz\n• Agente Orquestrador ISAAC + todos os Mentores Especialistas\n• Memória evolutiva contínua e Laboratório do Incômodo Criativo\n• Sem cartão de crédito e sem vínculo financeiro\n\n💬 *Plano Pago — ISAAC no WhatsApp (R$ 14,99 / vencimento mensal):*\n• Tudo do Plano Gratuito liberado no App\n• Conversa direta aqui pelo *WhatsApp em Texto e Áudio* com o Agente Orquestrador ISAAC\n• Reconhecimento automático pelo seu telefone e sincronização imediata no mesmo chat do App\n• Assinatura mensal segura via Asaas (PIX, Cartão ou Boleto)\n\n👉 Acesse sua mentoria ou veja os detalhes dos planos aqui:\nhttps://isaac.lynxems.com.br/#planos\n\n_(Se preferir não receber comunicados no WhatsApp, basta responder "parar".)_`;
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

    if (logItem.flow_type === 'unregistered_invite_image') {
      finalMessageText =
        finalMessageText || buildUnregisteredInviteMessage(contact || { push_name: logItem.recipient_name, jid: check.jid }, campaign?.unregistered_template);
      finalMediaUrl = finalMediaUrl || campaign?.unregistered_image_url || DEFAULT_ISAAC_IMAGE_URL;

      sendResult = await sendWhatsAppImageSafe({
        jidOrNumber: check.jid,
        caption: finalMessageText,
        mediaUrl: finalMediaUrl,
      });
    } else {
      finalMessageText =
        finalMessageText ||
        (await buildRegisteredPlansMessage(
          contact || {
            app_user_id: logItem.app_user_id,
            app_full_name: logItem.recipient_name,
            jid: check.jid,
          },
          campaign?.registered_template
        ));

      sendResult = await sendWhatsAppTextSafe({
        jidOrNumber: check.jid,
        text: finalMessageText,
      });

      // Integração direta com o usuário no App (registra também no Mural de Notificações In-App)
      const targetUserId = logItem.app_user_id || contact?.app_user_id;
      if (targetUserId) {
        await supabaseAdmin
          .from('izaque_user_notifications')
          .insert({
            user_id: targetUserId,
            title: 'Conheça os Planos Grátis & WhatsApp do ISAAC',
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
  forceFlowType = null, // permite testar ambos os fluxos no número autorizado 31995574906
  createdBy = null,
}) {
  const safetyCfg = await getOutreachSafetyConfig();

  let query = supabaseAdmin.from('izaque_whatsapp_contacts').select('*').eq('opt_out', false);

  if (Array.isArray(contactIds) && contactIds.length > 0) {
    query = query.in('id', contactIds);
  } else if (audienceType === 'unregistered') {
    query = query.eq('is_registered_user', false);
  } else if (audienceType === 'registered') {
    query = query.eq('is_registered_user', true);
  }

  // Se a Trava de Segurança estiver ativa e não foi seleção manual, filtra ou marca na fila
  const { data: candidates, error: candErr } = await query.order('is_registered_user', { ascending: false }).limit(500);
  if (candErr) throw candErr;

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
      unregistered_image_url: unregisteredImageUrl || DEFAULT_ISAAC_IMAGE_URL,
      unregistered_template: unregisteredTemplate || null,
      registered_template: registeredTemplate || null,
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
      recipient_name: contact.app_full_name || contact.push_name || contact.phone_digits,
      is_registered_user: Boolean(contact.is_registered_user),
      flow_type: flowType,
      status: 'queued',
      media_url: flowType === 'unregistered_invite_image' ? unregisteredImageUrl || DEFAULT_ISAAC_IMAGE_URL : null,
      scheduled_for: new Date(cursorMs).toISOString(),
    };
  });

  const { error: logsErr } = await supabaseAdmin.from('izaque_whatsapp_outreach_logs').insert(queueRows);
  if (logsErr) throw logsErr;

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
  createdBy = null,
}) {
  const safetyCfg = await getOutreachSafetyConfig();
  if (!isPhoneAllowedBySafetyLock(phone, safetyCfg)) {
    throw new Error(
      `Bloqueado pela Trava de Segurança: o envio só está autorizado para ${safetyCfg.allowedPhonesRaw}.`
    );
  }

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
        flowType === 'unregistered_invite_image'
          ? `Envio Convite com Imagem ISAAC (${phone})`
          : `Envio Integração Planos Grátis & Pago (${phone})`,
      audience_type: 'selected',
      status: 'running',
      scheduled_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      respect_window: false,
      unregistered_image_url: customImageUrl || DEFAULT_ISAAC_IMAGE_URL,
      unregistered_template: flowType === 'unregistered_invite_image' ? customTemplate || null : null,
      registered_template: flowType === 'registered_plans_integration' ? customTemplate || null : null,
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
      phone_digits: normalizeBrazilPhone(phone),
      recipient_name: contact?.app_full_name || contact?.push_name || check.whatsappName || phone,
      is_registered_user: Boolean(contact?.is_registered_user),
      flow_type: flowType,
      status: 'queued',
      media_url: flowType === 'unregistered_invite_image' ? customImageUrl || DEFAULT_ISAAC_IMAGE_URL : null,
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
  const { data: logs } = await supabaseAdmin
    .from('izaque_whatsapp_outreach_logs')
    .select('status')
    .eq('campaign_id', campaignId);

  const list = logs || [];
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

export async function getOutreachDashboardOverview({ search = '', filter = 'all', limit = 250 } = {}) {
  const safetyCfg = await getOutreachSafetyConfig();
  const since24hIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  let contactsQuery = supabaseAdmin
    .from('izaque_whatsapp_contacts')
    .select('*', { count: 'exact' });

  if (filter === 'registered') {
    contactsQuery = contactsQuery.eq('is_registered_user', true);
  } else if (filter === 'unregistered') {
    contactsQuery = contactsQuery.eq('is_registered_user', false);
  } else if (filter === 'opt_out') {
    contactsQuery = contactsQuery.eq('opt_out', true);
  } else if (filter === 'sent') {
    contactsQuery = contactsQuery.gt('outreach_count', 0);
  } else if (filter === 'allowed_only' && safetyCfg.restrictedMode) {
    contactsQuery = contactsQuery.in('comparable_phone', safetyCfg.allowedComparableKeys);
  }

  if (search && search.trim()) {
    const term = search.trim().replace(/[%_]/g, '');
    contactsQuery = contactsQuery.or(
      `push_name.ilike.%${term}%,app_full_name.ilike.%${term}%,phone_digits.ilike.%${term}%,app_email.ilike.%${term}%`
    );
  }

  const [
    contactsRes,
    { count: totalContacts },
    { count: totalRegistered },
    { count: totalUnregistered },
    { count: totalOptOut },
    { count: sentLast24h },
    campaignsRes,
    logsRes,
  ] = await Promise.all([
    contactsQuery
      .order('is_registered_user', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(Math.min(500, Number(limit) || 250)),
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

  // Garante que o contato autorizado (31995574906) apareça no topo da listagem para fácil visualização/teste
  const contactsList = (contactsRes.data || []).map((c) => ({
    ...c,
    is_allowed_by_safety_lock: isPhoneAllowedBySafetyLock(c.jid || c.phone_digits, safetyCfg),
  }));

  contactsList.sort((a, b) => {
    if (a.is_allowed_by_safety_lock !== b.is_allowed_by_safety_lock) {
      return a.is_allowed_by_safety_lock ? -1 : 1;
    }
    if (a.is_registered_user !== b.is_registered_user) {
      return a.is_registered_user ? -1 : 1;
    }
    return 0;
  });

  return {
    safety: safetyCfg,
    stats: {
      totalContacts: totalContacts || 0,
      totalRegistered: totalRegistered || 0,
      totalUnregistered: totalUnregistered || 0,
      totalOptOut: totalOptOut || 0,
      sentLast24h: sentLast24h || 0,
      dailyLimit: safetyCfg.dailyLimit,
    },
    contacts: contactsList,
    filteredTotal: contactsRes.count || contactsList.length,
    campaigns: campaignsRes.data || [],
    recentLogs: logsRes.data || [],
    defaultImageUrl: DEFAULT_ISAAC_IMAGE_URL,
    sampleUnregisteredText: buildUnregisteredInviteMessage({ push_name: 'Visitante', jid: 'sample' }),
    sampleRegisteredText: await buildRegisteredPlansMessage({ app_full_name: 'Membro', jid: 'sample' }),
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
