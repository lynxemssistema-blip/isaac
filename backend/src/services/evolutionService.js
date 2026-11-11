import crypto from 'crypto';
import { genAI, CHAT_MODEL, FALLBACK_CHAT_MODELS } from '../config/gemini.js';
import { supabaseAdmin } from '../config/supabase.js';
import { invalidateCache } from '../utils/memoryCache.js';
import { generateUnifiedText } from './aiProviderService.js';
import { processChatMessageCore, ensureUserSession } from '../controllers/chatController.js';
import { transcribeAudioWithGemini } from './audioService.js';
import { cleanTextForSpeech, generateGeminiAudio, getEdsonGlobalVoiceConfig } from '../controllers/voiceController.js';
import {
  normalizeBrazilPhone,
  normalizeWhatsAppPhone,
  extractComparablePhoneKey,
  parseUniversalPhone,
  formatUniversalPhoneDisplay,
} from '../utils/phoneUtils.js';

export {
  normalizeBrazilPhone,
  normalizeWhatsAppPhone,
  extractComparablePhoneKey,
  parseUniversalPhone,
  formatUniversalPhoneDisplay,
};

const DEFAULT_EVO_URL = 'https://evo.lynxems.com.br';
const DEFAULT_EVO_INSTANCE = 'isaac';
const DEFAULT_EVO_JID = '553175235531@s.whatsapp.net';
const DEFAULT_CRON_TIME = '09:50';
const DEFAULT_APP_URL = 'https://isaac.lynxems.com.br/';
const TIMEZONE = 'America/Sao_Paulo';

// 8 arquétipos distintos de abertura/estrutura para garantir 100% de unicidade textual (Anti-Ban)
const POLITE_STYLE_VARIATIONS = [
  'Abertura serena desejando uma manhã tranquila, seguida de lembrança gentil e discreta sobre a reflexão em aberto.',
  'Saudação calorosa e respeitosa em 2 parágrafos curtos, valorizando o passo que a pessoa já deu e convidando a não deixar o ritmo esfriar.',
  'Tom acolhedor e humano, começando pelo nome preferido, reconhecendo que a rotina corrige o foco e lembrando com delicadeza do ponto conversado.',
  'Abordagem breve, elegante e encorajadora, destacando que pequenos passos diários evitam retrocessos na clareza conquistada.',
  'Mensagem cordial como um mentor discreto que passa apenas para deixar uma palavra de continuidade sobre o último diálogo.',
  'Estrutura reflexiva suave, fazendo uma única pergunta leve conectada ao tema pendente e deixando o link para retomar quando puder.',
  'Saudação matinal educada e empática, reforçando que a constância protege a evolução pessoal construída até aqui.',
  'Estilo próximo, respeitoso e sem pressa, relembrando o compromisso de evolução conversado na última sessão.',
];

function getEvoConfig() {
  return {
    baseUrl: (process.env.EVOLUTION_API_URL || DEFAULT_EVO_URL).replace(/\/$/, ''),
    instanceName: (process.env.EVOLUTION_INSTANCE_NAME || DEFAULT_EVO_INSTANCE).trim(),
    apiKey: (process.env.EVOLUTION_API_KEY || '').trim(),
    instanceJid: (process.env.EVOLUTION_INSTANCE_JID || DEFAULT_EVO_JID).trim(),
    cronTime: (process.env.EVOLUTION_DAILY_CRON_TIME || DEFAULT_CRON_TIME).trim(),
    enabled: String(process.env.EVOLUTION_FOLLOWUP_ENABLED ?? 'true').toLowerCase() !== 'false',
    appUrl: (process.env.APP_URL || DEFAULT_APP_URL).replace(/\/$/, '') + '/',
  };
}

/**
 * Consulta no banco (izaque_system_settings.evolution_whatsapp_enabled) se o SuperAdmin ativou/desativou a Evolution API
 */
export async function isEvolutionEnabledInDatabase() {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_system_settings')
      .select('evolution_whatsapp_enabled')
      .eq('id', 'global')
      .maybeSingle();

    if (error) return true;
    if (data && data.evolution_whatsapp_enabled !== undefined && data.evolution_whatsapp_enabled !== null) {
      return Boolean(data.evolution_whatsapp_enabled);
    }
    return true;
  } catch {
    return true;
  }
}

/**
 * Ativa ou desativa imediatamente a integração Evolution API pelo Painel do SuperAdmin
 */
export async function setEvolutionIntegrationEnabled(enabled, updatedBy = null) {
  const nextValue = Boolean(enabled);
  const nowIso = new Date().toISOString();

  const { data: existing } = await supabaseAdmin
    .from('izaque_system_settings')
    .select('id')
    .eq('id', 'global')
    .maybeSingle();

  let data;
  let error;

  if (existing?.id) {
    const res = await supabaseAdmin
      .from('izaque_system_settings')
      .update({
        evolution_whatsapp_enabled: nextValue,
        updated_at: nowIso,
        updated_by: updatedBy || null,
      })
      .eq('id', 'global')
      .select()
      .single();
    data = res.data;
    error = res.error;
  } else {
    const res = await supabaseAdmin
      .from('izaque_system_settings')
      .insert({
        id: 'global',
        evolution_whatsapp_enabled: nextValue,
        updated_at: nowIso,
        updated_by: updatedBy || null,
      })
      .select()
      .single();
    data = res.data;
    error = res.error;
  }

  if (error) throw error;
  invalidateCache('system:settings');
  return {
    evolution_whatsapp_enabled: Boolean(data?.evolution_whatsapp_enabled),
    updated_at: data?.updated_at || nowIso,
  };
}

export function randomBetween(minMs, maxMs) {
  return crypto.randomInt(minMs, maxMs + 1);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Consulta a Evolution API (/chat/whatsappNumbers/:instance) para:
 * 1. Confirmar que o número realmente possui WhatsApp ativo (Brasil + Internacional: Austrália +61, EUA +1, Portugal +351, etc.)
 * 2. Resolver o JID exato (8 vs 9 dígitos no Brasil e formato oficial E.164 internacional)
 */
export async function resolveWhatsAppJid(rawPhone) {
  const cfg = getEvoConfig();
  if (!cfg.apiKey) {
    throw new Error('EVOLUTION_API_KEY não configurada no servidor.');
  }

  const normalized = normalizeWhatsAppPhone(rawPhone);
  if (normalized.length < 8 || normalized.length > 15) {
    return { exists: false, number: normalized, jid: null, reason: 'invalid_length' };
  }

  const resp = await fetch(`${cfg.baseUrl}/chat/whatsappNumbers/${encodeURIComponent(cfg.instanceName)}`, {
    method: 'POST',
    headers: {
      apikey: cfg.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ numbers: [normalized] }),
  });

  if (!resp.ok) {
    const errTxt = await resp.text();
    throw new Error(`Falha ao validar número na Evolution (${resp.status}): ${errTxt.slice(0, 200)}`);
  }

  const list = await resp.json();
  const entry = Array.isArray(list) ? list[0] : null;
  if (!entry || !entry.exists || !entry.jid) {
    return { exists: false, number: normalized, jid: null, reason: 'not_on_whatsapp' };
  }

  if (entry.jid === cfg.instanceJid) {
    return { exists: false, number: normalized, jid: entry.jid, reason: 'self_instance_number' };
  }

  return {
    exists: true,
    number: normalized,
    jid: entry.jid,
    whatsappName: entry.name || null,
  };
}

/**
 * Envia mensagem de texto pela Evolution API com proteções Anti-Ban:
 * - Jitter variável entre 280ms e 450ms antes do disparo da requisição
 * - Simulação humana de digitação ("composing...") com tempo variável proporcional ao texto
 */
export async function sendWhatsAppTextSafe({ jidOrNumber, text }) {
  const cfg = getEvoConfig();
  if (!cfg.apiKey) {
    throw new Error('EVOLUTION_API_KEY não configurada no servidor.');
  }

  // 1. Intervalo variável solicitado (280ms a 450ms) para cadência orgânica de requisições
  const interRequestJitterMs = randomBetween(280, 450);
  await sleep(interRequestJitterMs);

  // 2. Presença humana "digitando..." variável na Evolution (1600ms a 2950ms)
  const typingPresenceMs = randomBetween(1600, 2950);

  const resp = await fetch(`${cfg.baseUrl}/message/sendText/${encodeURIComponent(cfg.instanceName)}`, {
    method: 'POST',
    headers: {
      apikey: cfg.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      number: jidOrNumber,
      text,
      delay: typingPresenceMs,
      linkPreview: true,
    }),
  });

  const bodyText = await resp.text();
  if (!resp.ok) {
    throw new Error(`Evolution sendText HTTP ${resp.status}: ${bodyText.slice(0, 250)}`);
  }

  let parsed = {};
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    parsed = { raw: bodyText };
  }

  const sentMsgId = parsed?.key?.id || null;
  if (sentMsgId) registerBotSentMessageId(sentMsgId);

  return {
    messageId: sentMsgId,
    remoteJid: parsed?.key?.remoteJid || jidOrNumber,
    interRequestJitterMs,
    typingPresenceMs,
    totalCadenceMs: interRequestJitterMs + typingPresenceMs,
    raw: parsed,
  };
}

/**
 * Envia nota de voz nativa no WhatsApp pela Evolution API com proteções Anti-Ban:
 * - Jitter variável entre 280ms e 450ms antes do envio
 * - Presença humana "gravando áudio..." (1800ms a 3200ms)
 */
export async function sendWhatsAppAudioSafe({ jidOrNumber, audioBuffer }) {
  const cfg = getEvoConfig();
  if (!cfg.apiKey) {
    throw new Error('EVOLUTION_API_KEY não configurada no servidor.');
  }

  const interRequestJitterMs = randomBetween(280, 450);
  await sleep(interRequestJitterMs);

  const recordingPresenceMs = randomBetween(1800, 3200);
  const audioBase64 = Buffer.isBuffer(audioBuffer) ? audioBuffer.toString('base64') : String(audioBuffer);

  const resp = await fetch(`${cfg.baseUrl}/message/sendWhatsAppAudio/${encodeURIComponent(cfg.instanceName)}`, {
    method: 'POST',
    headers: {
      apikey: cfg.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      number: jidOrNumber,
      audio: audioBase64,
      delay: recordingPresenceMs,
      encoding: true,
    }),
  });

  const bodyText = await resp.text();
  if (!resp.ok) {
    throw new Error(`Evolution sendWhatsAppAudio HTTP ${resp.status}: ${bodyText.slice(0, 250)}`);
  }

  let parsed = {};
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    parsed = { raw: bodyText };
  }

  const sentAudioMsgId = parsed?.key?.id || null;
  if (sentAudioMsgId) registerBotSentMessageId(sentAudioMsgId);

  return {
    messageId: sentAudioMsgId,
    remoteJid: parsed?.key?.remoteJid || jidOrNumber,
    interRequestJitterMs,
    recordingPresenceMs,
    raw: parsed,
  };
}

/**
 * Baixa o base64 de uma mensagem de áudio recebida no WhatsApp via Evolution API v2
 */
async function fetchIncomingAudioBase64(data = {}) {
  const cfg = getEvoConfig();
  const inlineB64 = data?.message?.base64 || data?.base64 || null;
  const rawMime = data?.message?.audioMessage?.mimetype || 'audio/ogg';

  if (inlineB64) {
    const clean = String(inlineB64).replace(/^data:[^;]+;base64,/, '');
    return { base64: clean, mimeType: rawMime };
  }

  if (!cfg.apiKey || !data?.key?.id) {
    throw new Error('Chave de mensagem ausente para baixar áudio na Evolution API.');
  }

  const resp = await fetch(`${cfg.baseUrl}/chat/getBase64FromMediaMessage/${encodeURIComponent(cfg.instanceName)}`, {
    method: 'POST',
    headers: {
      apikey: cfg.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: { key: data.key },
      convertToMp4: false,
    }),
  });

  if (!resp.ok) {
    const errTxt = await resp.text();
    throw new Error(`Falha ao baixar áudio da Evolution (${resp.status}): ${errTxt.slice(0, 200)}`);
  }

  const json = await resp.json();
  const b64 = String(json?.base64 || '').replace(/^data:[^;]+;base64,/, '');
  if (!b64) {
    throw new Error('Evolution retornou base64 vazio para o áudio recebido.');
  }

  return {
    base64: b64,
    mimeType: json?.mimetype || rawMime || 'audio/ogg',
  };
}

/**
 * Detecta intenção universal de cancelar ou reativar o envio de mensagens/lembretes no WhatsApp
 * Funciona para TODOS os usuários (Plano Gratuito ou Pago), em comandos diretos ou linguagem natural,
 * sem confundir desabafos terapêuticos (ex: "quero parar de beber" ou "quero parar de procrastinar").
 */
export function detectWhatsAppPermissionIntent(rawText) {
  const clean = String(rawText || '').trim();
  if (!clean) return null;
  const lower = clean.toLowerCase().replace(/[.!?]+$/g, '').trim();

  // 1. Comandos diretos isolados (PT-BR + EN-GB)
  const exactOptOutCommands = [
    'parar',
    'sair',
    'cancelar',
    'stop',
    'descadastrar',
    'unsubscribe',
    'opt out',
    'opt-out',
    'remove me',
    'no messages',
    'stop messages',
    'please stop',
    'parar mensagens',
    'parar lembretes',
    'cancelar lembretes',
    'cancelar mensagens',
  ];
  if (exactOptOutCommands.includes(lower)) {
    return 'opt_out';
  }

  // 2. Frases naturais pedindo para parar de receber mensagens/lembretes no WhatsApp (PT-BR + Inglês)
  const naturalOptOutRegex =
    /(?:n[aã]o\s+quero\s+(?:mais\s+)?receber|par(?:ar|e)\s+de\s+(?:me\s+)?(?:mandar|enviar)\s+(?:mensage[nm]|msg|lembrete|aviso|notifica|zap|whats)|n[aã]o\s+(?:me\s+)?(?:mande|envie)\s+(?:mais\s+)?(?:mensage[nm]|msg|lembrete|aviso|nada)|cancel(?:ar|e)\s+(?:a\s+permiss[aã]o|os?\s+lembretes?|as?\s+mensagens?|a\s+mensagem|notifica[cç][oõ]es)|desativ(?:ar|e)\s+(?:os?\s+lembretes?|as?\s+mensagens?|o\s+envio)|tir(?:ar|e)\s+meu\s+n[uú]mero|remov(?:er|a)\s+meu\s+n[uú]mero|prefiro\s+(?:usar|conversar)\s+s[oó]\s+pelo\s+(?:app|site|aplicativo)|(?:do\s+not|don'?t)\s+(?:send|message|text)\s+me|stop\s+(?:sending|messaging|texting)|remove\s+my\s+number|take\s+me\s+off\s+(?:the|your)\s+list)/i;

  if (naturalOptOutRegex.test(clean)) {
    return 'opt_out';
  }

  // 3. Reativação voluntária explícita pelo próprio usuário
  const exactOptInCommands = ['voltar', 'reativar', 'ativar lembretes', 'reativar lembretes', 'reativar mensagens'];
  if (exactOptInCommands.includes(lower)) {
    return 'opt_in';
  }

  const naturalOptInRegex =
    /(?:voltar\s+a\s+receber\s+(?:os?\s+|as?\s+)?(?:lembretes?|mensage[nm])|reativ(?:ar|e)\s+(?:os?\s+|as?\s+)?(?:lembretes?|mensage[nm])|ativar\s+lembretes|pode\s+(?:voltar\s+a\s+)?(?:me\s+)?(?:mandar|enviar)\s+(?:mensage[nm]|msg|lembrete).*?(?:novamente|de\s+novo))/i;

  if (naturalOptInRegex.test(clean)) {
    return 'opt_in';
  }

  return null;
}

/**
 * Extrai primeiro nome amigável como fallback seguro
 */
function extractFallbackName(fullName) {
  if (!fullName || typeof fullName !== 'string') return '';
  const clean = fullName.trim().split(/\s+/)[0] || '';
  if (!clean) return '';
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

/**
 * Agente de Continuidade & Gentileza (Gemini):
 * Analisa o histórico da última conversa com o Orquestrador + memórias do usuário para:
 * 1. Identificar como o usuário prefere ser chamado conforme o histórico
 * 2. Verificar se ficou algum assunto/reflexão/passo pendente na última conversa
 * 3. Redigir uma mensagem sempre única, extremamente educada e acolhedora lembrando de continuar no app
 */
export async function craftPersonalizedFollowUp({
  profile,
  recentMessages = [],
  memories = [],
  forceGenerateForTest = false,
}) {
  const cfg = getEvoConfig();
  const fallbackFirstName = extractFallbackName(profile?.full_name) || 'amigo(a)';
  const randomStyle = POLITE_STYLE_VARIATIONS[randomBetween(0, POLITE_STYLE_VARIATIONS.length - 1)];
  const randomSeed = crypto.randomBytes(4).toString('hex');

  const chronologicalMsgs = [...recentMessages].reverse();
  const transcript = chronologicalMsgs
    .map((m) => `${m.role === 'user' ? 'USUÁRIO' : 'MENTOR ISAAC'}: ${(m.content || '').slice(0, 700)}`)
    .join('\n\n');

  const memoriesText = (memories || [])
    .slice(0, 8)
    .map((mem) => `- [${mem.category}] ${mem.content}`)
    .join('\n');

  const prompt = `
Você é o Agente de Cuidado e Continuidade da plataforma Mentoria ISAAC (${cfg.appUrl}).
Sua personalidade é EXTREMAMENTE educada, serena, respeitosa, discreta, calorosa e humana.

OBJETIVO DA ANÁLISE:
1. Descubra como o usuário prefere ser chamado observando o histórico da conversa e memórias (ex.: apelido ou forma pela qual pediu para ser tratado; se não houver pedido específico, use o primeiro nome "${fallbackFirstName}").
2. Analise a última conversa abaixo e verifique se ficou algum ASSUNTO PENDENTE, pergunta em aberto, tarefa/micro-ação de 24h, desabafo em andamento ou tema de evolução pessoal que mereça continuidade para que o avanço conquistado não sofra regressão/retrocesso.
${forceGenerateForTest ? 'NOTA DE TESTE: Mesmo se a conversa parecer concluída, considere hasPendingTopic = true para gerar uma mensagem real de demonstração baseada no contexto do usuário.' : ''}
3. Caso haja assunto pendente (hasPendingTopic = true), escreva uma mensagem de WhatsApp ÚNICA (semente criativa: ${randomSeed}):
   - Estilo desta mensagem específica: "${randomStyle}"
   - Trate a pessoa pelo nome/forma preferida identificada.
   - Seja profundamente educado(a), gentil e zero invasivo(a) (lembre-se de que a mensagem aparece na tela do celular: cite o tema com delicadeza e elegância, sem expor detalhes íntimos de forma crua).
   - Lembre-a com carinho de continuar sua conversa no app ${cfg.appUrl} para que o avanço que ela vem construindo não sofra nenhuma retroação ou regresso na sua evolução pessoal.
   - Use de 2 a 4 parágrafos curtos, naturais de WhatsApp (máximo ~550 caracteres), sem cara de robô ou disparo em massa, sem listas artificiais e sem excesso de emojis (no máximo 1 emoji sutil, ou nenhum).

DADOS DO PERFIL:
- Nome cadastrado: ${profile?.full_name || 'Não informado'}
- Objetivo principal: ${profile?.main_goal || 'Evolução pessoal e clareza'}

MEMÓRIAS DE LONGO PRAZO DO USUÁRIO:
${memoriesText || '(Sem memórias adicionais registradas)'}

ÚLTIMAS MENSAGENS DA CONVERSA COM O ORQUESTRADOR:
${transcript || '(Sem histórico recente — gere uma saudação gentil convidando a iniciar/retomar sua jornada de clareza)'}

Retorne EXCLUSIVAMENTE um JSON válido neste formato:
{
  "hasPendingTopic": true ou false,
  "preferredName": "Nome ou forma como o usuário prefere ser chamado",
  "pendingTopicSummary": "Resumo interno curto de 1 frase do assunto pendente identificado",
  "whatsappMessage": "Texto final completo, único e extremamente educado para enviar no WhatsApp incluindo ${cfg.appUrl}"
}
`;

  const { text: rawJson } = await generateUnifiedText({
    message: prompt,
    temperature: 0.88,
    maxOutputTokens: 900,
    jsonMode: true,
    purpose: 'background',
  });

  let parsed = null;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    parsed = null;
  }

  const preferredName = (parsed?.preferredName || fallbackFirstName).trim();
  const hasPendingTopic = forceGenerateForTest ? true : Boolean(parsed?.hasPendingTopic);
  const pendingTopicSummary = (parsed?.pendingTopicSummary || 'Continuidade da jornada reflexiva').trim();

  let whatsappMessage = (parsed?.whatsappMessage || '').trim();
  if (!whatsappMessage) {
    whatsappMessage = `Bom dia, ${preferredName}. Espero que esteja tudo em paz com você.\n\nPassando com todo respeito apenas para lembrar da nossa última reflexão que ficou em aberto. Quando tiver um momento tranquilo hoje, continue sua conversa lá no ${cfg.appUrl} para que todo o avanço que você vem construindo siga firme, sem nenhum retrocesso na sua evolução pessoal.`;
  } else if (!whatsappMessage.includes('isaac.lynxems.com.br')) {
    whatsappMessage = `${whatsappMessage}\n\nQuando puder continuar, seu espaço segue aberto aqui: ${cfg.appUrl}`;
  }

  return {
    hasPendingTopic,
    preferredName,
    pendingTopicSummary,
    whatsappMessage,
  };
}

/**
 * Executa a varredura diária de inatividade (> 24h) + assunto pendente nos usuários ativos com celular
 */
let isDailyJobRunning = false;

export async function runDailyInactivityFollowUp({ dryRun = false, triggerType = 'daily_cron' } = {}) {
  if (isDailyJobRunning) {
    return { skipped: true, reason: 'already_running' };
  }

  const cfg = getEvoConfig();
  if (!cfg.enabled && triggerType === 'daily_cron') {
    return { skipped: true, reason: 'disabled_by_env' };
  }

  const dbEnabled = await isEvolutionEnabledInDatabase();
  if (!dbEnabled && !dryRun) {
    return { skipped: true, reason: 'disabled_by_superadmin' };
  }

  isDailyJobRunning = true;
  const summary = {
    startedAt: new Date().toISOString(),
    triggerType,
    dryRun,
    activeProfilesWithPhone: 0,
    inactiveOver24h: 0,
    pendingTopicsDetected: 0,
    messagesSent: 0,
    skippedAlreadyReminded: 0,
    skippedNoWhatsApp: 0,
    errors: 0,
    details: [],
  };

  try {
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from('izaque_profiles')
      .select('id, full_name, email, phone, whatsapp_jid, preferences, main_goal, is_active, whatsapp_opt_out')
      .eq('is_active', true)
      .eq('whatsapp_opt_out', false)
      .not('phone', 'is', null);

    if (profErr) throw profErr;

    const validProfiles = (profiles || []).filter((p) => normalizeWhatsAppPhone(p.phone).length >= 8);
    summary.activeProfilesWithPhone = validProfiles.length;

    const nowMs = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    const fortyEightHoursAgoIso = new Date(nowMs - 48 * 60 * 60 * 1000).toISOString();

    let sentInBatchCounter = 0;

    for (const profile of validProfiles) {
      try {
        // 1. Busca as últimas 10 mensagens do usuário com o orquestrador
        const { data: recentMsgs, error: msgErr } = await supabaseAdmin
          .from('izaque_messages')
          .select('id, session_id, role, content, created_at')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (msgErr || !recentMsgs || recentMsgs.length === 0) {
          continue;
        }

        const latestMsg = recentMsgs[0];
        const lastInteractionMs = new Date(latestMsg.created_at).getTime();
        if (!Number.isFinite(lastInteractionMs) || nowMs - lastInteractionMs < twentyFourHoursMs) {
          // Interagiu nas últimas 24h -> não incomodar
          continue;
        }

        // Respeita janela de 6h de Atendimento Humano (fromMe manual) — não atravessa conversa humana recente
        const takeoverCheck = await isHumanTakeoverActiveForTarget(profile.whatsapp_jid || profile.phone);
        if (takeoverCheck.active) {
          summary.details.push({
            userId: profile.id,
            name: profile.full_name,
            action: 'skipped_human_takeover_6h',
            mutedUntil: takeoverCheck.expiresAtIso,
          });
          continue;
        }

        summary.inactiveOver24h++;

        // 2. Proteção Anti-Spam / Anti-Ban:
        // Se já enviamos lembrete referente a este exato último turno (last_message_id) OU nas últimas 48h, não repetir!
        const { data: existingFollowups } = await supabaseAdmin
          .from('izaque_whatsapp_followups')
          .select('id, last_message_id, created_at')
          .eq('user_id', profile.id)
          .eq('status', 'sent')
          .order('created_at', { ascending: false })
          .limit(5);

        const alreadyRemindedThisTurn = (existingFollowups || []).some(
          (f) => f.last_message_id === latestMsg.id || f.created_at >= fortyEightHoursAgoIso
        );

        if (alreadyRemindedThisTurn) {
          summary.skippedAlreadyReminded++;
          continue;
        }

        // 3. Carrega memórias do usuário para enriquecer nome preferido e contexto
        const { data: memories } = await supabaseAdmin
          .from('izaque_user_memories')
          .select('category, content, importance_score')
          .eq('user_id', profile.id)
          .order('importance_score', { ascending: false })
          .limit(8);

        // 4. Agente avalia se há assunto pendente e gera mensagem única e educada
        const aiResult = await craftPersonalizedFollowUp({
          profile,
          recentMessages: recentMsgs,
          memories: memories || [],
          forceGenerateForTest: false,
        });

        if (!aiResult.hasPendingTopic) {
          summary.details.push({
            userId: profile.id,
            name: profile.full_name,
            action: 'skipped_no_pending_topic',
          });
          continue;
        }

        summary.pendingTopicsDetected++;

        // 5. Valida JID oficial do WhatsApp na Evolution (evita erro 8/9 dígitos e protege contra banimento)
        const jidCheck = await resolveWhatsAppJid(profile.whatsapp_jid || profile.phone);
        if (!jidCheck.exists || !jidCheck.jid) {
          summary.skippedNoWhatsApp++;
          summary.details.push({
            userId: profile.id,
            name: profile.full_name,
            action: 'skipped_not_on_whatsapp',
            reason: jidCheck.reason,
          });
          continue;
        }

        if (jidCheck.jid !== profile.whatsapp_jid) {
          await supabaseAdmin
            .from('izaque_profiles')
            .update({ whatsapp_jid: jidCheck.jid })
            .eq('id', profile.id);
        }

        if (dryRun) {
          summary.details.push({
            userId: profile.id,
            preferredName: aiResult.preferredName,
            jid: jidCheck.jid,
            pendingTopicSummary: aiResult.pendingTopicSummary,
            preview: aiResult.whatsappMessage,
            action: 'dry_run_ready',
          });
          continue;
        }

        // Pausa extra de respiro orgânico a cada 8 envios seguidos em lote (Anti-Ban adicional)
        if (sentInBatchCounter > 0 && sentInBatchCounter % 8 === 0) {
          await sleep(randomBetween(3800, 6200));
        }

        const sendRes = await sendWhatsAppTextSafe({
          jidOrNumber: jidCheck.jid,
          text: aiResult.whatsappMessage,
        });

        sentInBatchCounter++;
        summary.messagesSent++;

        await supabaseAdmin.from('izaque_whatsapp_followups').insert({
          user_id: profile.id,
          session_id: latestMsg.session_id || null,
          last_message_id: latestMsg.id,
          phone_raw: profile.phone,
          whatsapp_jid: jidCheck.jid,
          preferred_name: aiResult.preferredName,
          pending_topic_summary: aiResult.pendingTopicSummary,
          message_content: aiResult.whatsappMessage,
          trigger_type: triggerType,
          status: 'sent',
          evolution_message_id: sendRes.messageId,
          delay_ms: sendRes.interRequestJitterMs,
        });

        summary.details.push({
          userId: profile.id,
          preferredName: aiResult.preferredName,
          jid: jidCheck.jid,
          messageId: sendRes.messageId,
          jitterMs: sendRes.interRequestJitterMs,
          action: 'sent',
        });
      } catch (userErr) {
        summary.errors++;
        console.error(`⚠️ [Evolution FollowUp] Erro ao processar usuário ${profile.id}:`, userErr.message);
        summary.details.push({
          userId: profile.id,
          name: profile.full_name,
          action: 'error',
          error: userErr.message,
        });
      }
    }

    summary.finishedAt = new Date().toISOString();
    console.log(
      `📲 [Evolution FollowUp] Ciclo finalizado: ${summary.messagesSent} enviadas | ${summary.inactiveOver24h} inativos >24h | ${summary.errors} erros.`
    );
    return summary;
  } finally {
    isDailyJobRunning = false;
  }
}

/**
 * Envia mensagem de teste real (buscando contexto real do usuário se o telefone existir em izaque_profiles)
 */
export async function sendTestFollowUpToPhone(rawPhone) {
  const dbEnabled = await isEvolutionEnabledInDatabase();
  if (!dbEnabled) {
    throw new Error(
      'A função Evolution API está desativada nos Parâmetros Avançados do Superadmin. Ative-a primeiro para enviar mensagens.'
    );
  }

  const targetKey = extractComparablePhoneKey(rawPhone);
  if (!targetKey) {
    throw new Error('Número de telefone inválido para teste.');
  }

  const jidInfo = await resolveWhatsAppJid(rawPhone);
  if (!jidInfo.exists || !jidInfo.jid) {
    throw new Error(`O número ${rawPhone} não foi localizado no WhatsApp (${jidInfo.reason}).`);
  }

  // Tenta localizar o perfil real do usuário pelo telefone para usar o histórico verdadeiro dele!
  const { data: profiles } = await supabaseAdmin
    .from('izaque_profiles')
    .select('id, full_name, email, phone, preferences, main_goal')
    .not('phone', 'is', null);

  const matchedProfile = (profiles || []).find(
    (p) => extractComparablePhoneKey(p.phone) === targetKey
  ) || {
    id: null,
    full_name: jidInfo.whatsappName || 'Amigo',
    phone: rawPhone,
    main_goal: 'Evolução pessoal e clareza de decisões',
  };

  let recentMsgs = [];
  let memories = [];

  if (matchedProfile.id) {
    const [msgsRes, memsRes] = await Promise.all([
      supabaseAdmin
        .from('izaque_messages')
        .select('id, session_id, role, content, created_at')
        .eq('user_id', matchedProfile.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('izaque_user_memories')
        .select('category, content, importance_score')
        .eq('user_id', matchedProfile.id)
        .order('importance_score', { ascending: false })
        .limit(8),
    ]);
    recentMsgs = msgsRes.data || [];
    memories = memsRes.data || [];
  }

  const aiResult = await craftPersonalizedFollowUp({
    profile: matchedProfile,
    recentMessages: recentMsgs,
    memories,
    forceGenerateForTest: true,
  });

  const sendRes = await sendWhatsAppTextSafe({
    jidOrNumber: jidInfo.jid,
    text: aiResult.whatsappMessage,
  });

  await supabaseAdmin.from('izaque_whatsapp_followups').insert({
    user_id: matchedProfile.id || null,
    session_id: recentMsgs[0]?.session_id || null,
    last_message_id: null, // null em teste manual para não bloquear o ciclo diário real de 09:50
    phone_raw: rawPhone,
    whatsapp_jid: jidInfo.jid,
    preferred_name: aiResult.preferredName,
    pending_topic_summary: aiResult.pendingTopicSummary,
    message_content: aiResult.whatsappMessage,
    trigger_type: 'manual_test',
    status: 'sent',
    evolution_message_id: sendRes.messageId,
    delay_ms: sendRes.interRequestJitterMs,
  });

  return {
    success: true,
    matchedUserId: matchedProfile.id,
    matchedName: matchedProfile.full_name,
    preferredName: aiResult.preferredName,
    pendingTopicSummary: aiResult.pendingTopicSummary,
    resolvedJid: jidInfo.jid,
    messageId: sendRes.messageId,
    interRequestJitterMs: sendRes.interRequestJitterMs,
    typingPresenceMs: sendRes.typingPresenceMs,
    messageSent: aiResult.whatsappMessage,
  };
}

// Controle em memória contra reprocessamento de webhooks duplicados, avisos repetidos e Atendimento Humano (6 horas)
const processedInboundMessageIds = new Set();
const noticeCooldownByJid = new Map();
const botSentMessageIds = new Set();
const humanTakeoverUntilByTarget = new Map(); // jid ou comparablePhoneKey -> expiresAtMs

export const HUMAN_TAKEOVER_SILENCE_MS = 6 * 60 * 60 * 1000; // 6 horas exatas sem nenhuma ação do agente

export function registerBotSentMessageId(msgId) {
  const cleanId = String(msgId || '').trim();
  if (!cleanId) return;
  botSentMessageIds.add(cleanId);
  if (botSentMessageIds.size > 2500) {
    const oldest = botSentMessageIds.values().next().value;
    botSentMessageIds.delete(oldest);
  }
}

function isBotGeneratedFromMeEvent(eventType, msgId, payloadLike = {}) {
  const cleanType = String(eventType || '').toUpperCase();
  if (cleanType === 'SEND_MESSAGE') return true;
  const cleanId = String(msgId || '').trim();
  if (cleanId && botSentMessageIds.has(cleanId)) return true;
  // Disparos automáticos via Baileys/Evolution REST API sempre geram IDs 3EB0... com pushName "Você" ou status PENDING
  if (
    cleanId.startsWith('3EB0') &&
    (payloadLike?.pushName === 'Você' || payloadLike?.status === 'PENDING')
  ) {
    return true;
  }
  return false;
}

function setHumanTakeoverMemory(jidOrPhone, expiresAtMs) {
  if (!jidOrPhone || !Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) return;
  const cleanTarget = String(jidOrPhone).trim();
  const prevDirect = humanTakeoverUntilByTarget.get(cleanTarget) || 0;
  if (expiresAtMs > prevDirect) {
    humanTakeoverUntilByTarget.set(cleanTarget, expiresAtMs);
  }
  const compKey = extractComparablePhoneKey(cleanTarget);
  if (compKey) {
    const prevComp = humanTakeoverUntilByTarget.get(compKey) || 0;
    if (expiresAtMs > prevComp) {
      humanTakeoverUntilByTarget.set(compKey, expiresAtMs);
    }
  }
  if (humanTakeoverUntilByTarget.size > 3000) {
    const now = Date.now();
    for (const [k, exp] of humanTakeoverUntilByTarget.entries()) {
      if (exp <= now) humanTakeoverUntilByTarget.delete(k);
    }
  }
}

export function activateHumanTakeoverSilence(remoteJid, customDurationMs = HUMAN_TAKEOVER_SILENCE_MS) {
  const expiresAtMs = Date.now() + customDurationMs;
  setHumanTakeoverMemory(remoteJid, expiresAtMs);
  return {
    active: true,
    expiresAtMs,
    expiresAtIso: new Date(expiresAtMs).toISOString(),
  };
}

let recentDbHumanEventsCache = { fetchedAt: 0, rows: [] };

/**
 * Verifica se um humano enviou mensagem manual pelo número da Evolution (fromMe: true)
 * para este contato nas últimas 6 horas (em memória + fallback persistente no banco).
 */
export async function isHumanTakeoverActiveForTarget(jidOrPhone) {
  if (!jidOrPhone) return { active: false, expiresAtIso: null };
  const now = Date.now();
  const cleanTarget = String(jidOrPhone).trim();
  const compKey = extractComparablePhoneKey(cleanTarget);

  const directExp = humanTakeoverUntilByTarget.get(cleanTarget) || 0;
  const compExp = compKey ? humanTakeoverUntilByTarget.get(compKey) || 0 : 0;
  const memExp = Math.max(directExp, compExp);

  if (memExp > now) {
    return {
      active: true,
      expiresAtMs: memExp,
      expiresAtIso: new Date(memExp).toISOString(),
    };
  }

  // Fallback persistente no Supabase (garante as 6h mesmo após deploy/restart do servidor)
  try {
    let rows = recentDbHumanEventsCache.rows;
    if (now - recentDbHumanEventsCache.fetchedAt > 4000) {
      const since6hIso = new Date(now - HUMAN_TAKEOVER_SILENCE_MS).toISOString();
      const { data } = await supabaseAdmin
        .from('izaque_whatsapp_webhook_events')
        .select('remote_jid, payload, created_at')
        .eq('event_type', 'MESSAGES_UPSERT')
        .eq('from_me', true)
        .gte('created_at', since6hIso)
        .order('created_at', { ascending: false })
        .limit(150);

      rows = data || [];
      recentDbHumanEventsCache = { fetchedAt: now, rows };
    }

    for (const row of rows) {
      if (!row?.remote_jid) continue;
      const rowMsgId = row?.payload?.key?.id || null;
      if (isBotGeneratedFromMeEvent('MESSAGES_UPSERT', rowMsgId, row?.payload || {})) {
        continue;
      }
      const rowComp = extractComparablePhoneKey(row.remote_jid);
      const isMatch =
        row.remote_jid === cleanTarget || (Boolean(compKey) && Boolean(rowComp) && rowComp === compKey);

      if (isMatch) {
        const createdMs = new Date(row.created_at).getTime();
        const expMs = createdMs + HUMAN_TAKEOVER_SILENCE_MS;
        if (Number.isFinite(expMs) && expMs > now) {
          setHumanTakeoverMemory(row.remote_jid, expMs);
          setHumanTakeoverMemory(cleanTarget, expMs);
          return {
            active: true,
            expiresAtMs: expMs,
            expiresAtIso: new Date(expMs).toISOString(),
          };
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ [Human Takeover Check]:', err.message);
  }

  return { active: false, expiresAtIso: null };
}

function rememberProcessedMessage(msgId) {
  if (!msgId) return false;
  if (processedInboundMessageIds.has(msgId)) return true;
  processedInboundMessageIds.add(msgId);
  if (processedInboundMessageIds.size > 1500) {
    const oldest = processedInboundMessageIds.values().next().value;
    processedInboundMessageIds.delete(oldest);
  }
  return false;
}

/**
 * Processa eventos recebidos via Webhook da Evolution API (/api/webhooks/evolution e /api/webhooks/evolution/:event):
 * 0. REGRA SOBERANA DE ATENDIMENTO HUMANO (fromMe: true):
 *    - Qualquer mensagem enviada a partir do número da Evolution (fromMe === true) NÃO gera NENHUMA resposta nem NENHUMA ação do agente.
 *    - Quando um HUMANO envia mensagem manual pelo celular/WhatsApp Web (MESSAGES_UPSERT com fromMe === true), o agente fica
 *      100% DESATIVADO por 6 HORAS para aquele contato (renovando +6h a cada nova mensagem humana), sem atravessar a conversa.
 * 1. Respeita imediatamente pedidos de cancelamento de lembretes (opt-out) para TODOS os usuários (texto ou áudio) quando não houver atendimento humano ativo.
 * 2. Para assinantes do Plano WhatsApp (R$ 14,99) e SuperAdmin: processa conversa por Texto e Áudio direto no Agente Orquestrador,
 *    gravando na mesma sessão ativa de izaque_chat_sessions / izaque_messages como se estivesse no App.
 * 3. Para usuários do Plano Gratuito: informa gentilmente (com cooldown anti-spam) que o App Web é 100% gratuito e que a conversa via WhatsApp faz parte do Plano de R$ 14,99.
 */
export async function processEvolutionWebhookPayload(eventParam, body = {}) {
  const eventType = String(body?.event || eventParam || 'unknown')
    .toUpperCase()
    .replace(/[.-]/g, '_');
  const instanceName = body?.instance || getEvoConfig().instanceName;
  const rawData = Array.isArray(body?.data) ? body.data[0] || {} : body?.data || {};
  const data = rawData?.messages?.[0] || rawData;
  const key = data?.key || rawData?.key || {};
  const rawRemoteJid = key?.remoteJid || data?.remoteJid || null;
  const altRemoteJid = key?.remoteJidAlt || key?.senderPn || data?.remoteJidAlt || null;
  const remoteJid =
    rawRemoteJid && rawRemoteJid.endsWith('@s.whatsapp.net')
      ? rawRemoteJid
      : altRemoteJid && altRemoteJid.endsWith('@s.whatsapp.net')
      ? altRemoteJid
      : rawRemoteJid;
  const fromMe =
    key?.fromMe === true ||
    key?.fromMe === 'true' ||
    data?.fromMe === true ||
    data?.fromMe === 'true';
  const inboundMsgId = key?.id || null;

  const messageObj = data?.message || {};
  const isAudioInbound = Boolean(
    messageObj?.audioMessage ||
      data?.messageType === 'audioMessage' ||
      messageObj?.ephemeralMessage?.message?.audioMessage
  );

  const reactionEmoji = String(messageObj?.reactionMessage?.text || '').trim() || null;

  let messageText =
    messageObj?.conversation ||
    messageObj?.extendedTextMessage?.text ||
    messageObj?.ephemeralMessage?.message?.extendedTextMessage?.text ||
    messageObj?.ephemeralMessage?.message?.conversation ||
    null;

  const compactPayload = {
    event: eventType,
    instance: instanceName,
    date_time: body?.date_time || null,
    sender: body?.sender || null,
    key,
    pushName: data?.pushName || null,
    messageType: data?.messageType || (isAudioInbound ? 'audioMessage' : null),
    status: data?.status || null,
    messageText: messageText ? String(messageText).slice(0, 2000) : null,
  };

  // BARREIRA IMEDIATA SOBERANA PARA fromMe === true (ZERO AÇÃO DO AGENTE):
  if (fromMe) {
    if (isBotGeneratedFromMeEvent(eventType, inboundMsgId, compactPayload)) {
      if (inboundMsgId) registerBotSentMessageId(inboundMsgId);
      await supabaseAdmin.from('izaque_whatsapp_webhook_events').insert({
        event_type: eventType,
        instance_name: instanceName,
        remote_jid: remoteJid,
        matched_user_id: null,
        from_me: true,
        message_text: messageText ? String(messageText).slice(0, 2000) : null,
        payload: compactPayload,
      });
      return { eventType, remoteJid, fromMe: true, skipped: 'bot_from_me_no_action' };
    }

    const isDirectContactJid =
      Boolean(remoteJid && remoteJid.endsWith('@s.whatsapp.net')) &&
      remoteJid !== getEvoConfig().instanceJid;

    let mutedUntil = null;
    if (eventType.includes('MESSAGES_UPSERT') && isDirectContactJid) {
      const silence = activateHumanTakeoverSilence(remoteJid, HUMAN_TAKEOVER_SILENCE_MS);
      mutedUntil = silence.expiresAtIso;
      // Invalida micro-cache de leitura de eventos humanos para refletir instantaneamente
      recentDbHumanEventsCache = { fetchedAt: 0, rows: [] };
      console.log(
        `🤫 [Evolution Human Takeover] Mensagem humana detectada (fromMe) para ${remoteJid} — agente desativado por 6h (até ${mutedUntil}).`
      );
    }

    await supabaseAdmin.from('izaque_whatsapp_webhook_events').insert({
      event_type: eventType,
      instance_name: instanceName,
      remote_jid: remoteJid,
      matched_user_id: null,
      from_me: true,
      message_text: messageText ? String(messageText).slice(0, 2000) : isAudioInbound ? '[Áudio enviado pelo humano]' : null,
      payload: compactPayload,
    });

    return {
      eventType,
      remoteJid,
      fromMe: true,
      skipped: 'human_from_me_no_action',
      mutedUntil,
    };
  }

  const isDirectUserMessage =
    !fromMe &&
    eventType.includes('MESSAGES_UPSERT') &&
    Boolean(remoteJid && remoteJid.endsWith('@s.whatsapp.net')) &&
    remoteJid !== getEvoConfig().instanceJid;

  if (!isDirectUserMessage) {
    await supabaseAdmin.from('izaque_whatsapp_webhook_events').insert({
      event_type: eventType,
      instance_name: instanceName,
      remote_jid: remoteJid,
      matched_user_id: null,
      from_me: false,
      message_text: messageText ? String(messageText).slice(0, 2000) : null,
      payload: compactPayload,
    });
    return { eventType, matchedUserId: null, remoteJid };
  }

  // Evita duplicidade caso a Evolution reenvie o mesmo messageId
  if (rememberProcessedMessage(inboundMsgId)) {
    return { eventType, matchedUserId: null, remoteJid, duplicateSkipped: true };
  }

  // BARREIRA DE 6 HORAS DE SILÊNCIO QUANDO HUMANO ASSUMIU A CONVERSA:
  // Não transcreve áudio, não dispara aviso de cadastro/plano, não aciona IA nem realiza nenhuma ação!
  const activeTakeover = await isHumanTakeoverActiveForTarget(remoteJid);
  if (activeTakeover.active) {
    await supabaseAdmin.from('izaque_whatsapp_webhook_events').insert({
      event_type: eventType,
      instance_name: instanceName,
      remote_jid: remoteJid,
      matched_user_id: null,
      from_me: false,
      message_text: messageText ? String(messageText).slice(0, 2000) : isAudioInbound ? '[Áudio recebido]' : null,
      payload: compactPayload,
    });
    console.log(
      `🤫 [Evolution Human Takeover] Mensagem recebida de ${remoteJid} ignorada — agente silenciado até ${activeTakeover.expiresAtIso}.`
    );
    return {
      eventType,
      matchedUserId: null,
      remoteJid,
      skipped: 'human_takeover_active_6h',
      mutedUntil: activeTakeover.expiresAtIso,
    };
  }

  let matchedProfile = null;

  if (remoteJid && remoteJid.endsWith('@s.whatsapp.net')) {
    const incomingKey = extractComparablePhoneKey(remoteJid);
    if (incomingKey) {
      const { data: profiles } = await supabaseAdmin
        .from('izaque_profiles')
        .select('id, full_name, email, role, phone, whatsapp_jid, whatsapp_opt_out, plan_id, plan_status, plan_expires_at, is_active, preferences')
        .not('phone', 'is', null);

      matchedProfile =
        (profiles || []).find(
          (p) => p.whatsapp_jid === remoteJid || extractComparablePhoneKey(p.phone) === incomingKey
        ) || null;
    }
  }

  // Registra o evento bruto de auditoria
  await supabaseAdmin.from('izaque_whatsapp_webhook_events').insert({
    event_type: eventType,
    instance_name: instanceName,
    remote_jid: remoteJid,
    matched_user_id: matchedProfile?.id || null,
    from_me: false,
    message_text: messageText ? String(messageText).slice(0, 2000) : isAudioInbound ? '[Áudio recebido]' : null,
    payload: compactPayload,
  });

  const evoEnabled = await isEvolutionEnabledInDatabase();

  // Se for áudio de um usuário cadastrado, transcrevemos para detectar opt-out universal OU conversar no Orquestrador
  if (isAudioInbound && !messageText && matchedProfile) {
    try {
      const audioData = await fetchIncomingAudioBase64(data);
      const transcribed = await transcribeAudioWithGemini(audioData.base64, audioData.mimeType);
      if (transcribed && transcribed !== '[Áudio inaudível]') {
        messageText = transcribed;
      }
    } catch (audioErr) {
      console.error('⚠️ [Evolution Audio] Erro ao transcrever áudio recebido:', audioErr.message);
    }
  }

  // 0. Opt-out / Opt-in também sincronizado na tabela izaque_whatsapp_contacts (inclusive não cadastrados) + cancelamento imediato de fila pendente
  if (messageText) {
    const universalIntent = detectWhatsAppPermissionIntent(messageText);
    if (universalIntent === 'opt_out') {
      await Promise.all([
        supabaseAdmin
          .from('izaque_whatsapp_contacts')
          .update({ opt_out: true, updated_at: new Date().toISOString() })
          .eq('jid', remoteJid)
          .then(() => {})
          .catch(() => {}),
        supabaseAdmin
          .from('izaque_whatsapp_outreach_logs')
          .update({
            status: 'skipped_opt_out',
            error_reason: 'Cancelado na fila imediatamente após pedido de opt-out do contato.',
          })
          .eq('jid', remoteJid)
          .eq('status', 'queued')
          .then(() => {})
          .catch(() => {}),
      ]);

      if (!matchedProfile) {
        if (evoEnabled) {
          const isIntlOptOut = !parseUniversalPhone(remoteJid).isBrazil;
          await sendWhatsAppTextSafe({
            jidOrNumber: remoteJid,
            text: isIntlOptOut
              ? 'Understood completely. Your number has been removed from our invitation list straight away, with full respect for your space.'
              : 'Perfeitamente compreendido. Seu número foi removido da nossa lista de convites imediatamente, com total respeito ao seu espaço.',
          }).catch(() => {});
        }
        return { eventType, matchedUserId: null, remoteJid, action: 'unregistered_opt_out_applied' };
      }
    } else if (universalIntent === 'opt_in') {
      await supabaseAdmin
        .from('izaque_whatsapp_contacts')
        .update({ opt_out: false, updated_at: new Date().toISOString() })
        .eq('jid', remoteJid)
        .then(() => {})
        .catch(() => {});
    }
  }

  // 1. REGRA UNIVERSAL PARA TODOS OS USUÁRIOS (INDEPENDENTE DO PLANO):
  // Pedido para parar (ou reativar) o envio de mensagens/lembretes pelo WhatsApp
  if (matchedProfile && messageText) {
    const permissionIntent = detectWhatsAppPermissionIntent(messageText);

    if (permissionIntent === 'opt_out') {
      await supabaseAdmin
        .from('izaque_profiles')
        .update({
          whatsapp_jid: remoteJid,
          whatsapp_opt_out: true,
          whatsapp_opt_out_at: new Date().toISOString(),
          last_whatsapp_inbound_at: new Date().toISOString(),
        })
        .eq('id', matchedProfile.id);

      if (evoEnabled) {
        const isIntlMemberOptOut = !parseUniversalPhone(remoteJid).isBrazil;
        const firstName = (matchedProfile.full_name || '').trim().split(/\s+/)[0];
        const confirmOptOutText = isIntlMemberOptOut
          ? `Understood completely${firstName ? `, ${firstName}` : ''}. I have cancelled WhatsApp reminders for your number straight away, with full respect for your space.\n\nYour access to https://isaac.lynxems.com.br/ remains 100% open whenever you wish to reflect there.`
          : `Perfeitamente compreendido${firstName ? `, ${firstName}` : ''}. Cancelei agora mesmo a permissão de envio de lembretes para o seu WhatsApp, com total respeito ao seu espaço.\n\nSeu acesso ao aplicativo https://isaac.lynxems.com.br/ continua 100% liberado sempre que desejar refletir por lá.`;
        await sendWhatsAppTextSafe({ jidOrNumber: remoteJid, text: confirmOptOutText }).catch(() => {});
      }

      return { eventType, matchedUserId: matchedProfile.id, remoteJid, action: 'opt_out_applied' };
    }

    if (permissionIntent === 'opt_in') {
      await supabaseAdmin
        .from('izaque_profiles')
        .update({
          whatsapp_jid: remoteJid,
          whatsapp_opt_out: false,
          whatsapp_opt_out_at: null,
          last_whatsapp_inbound_at: new Date().toISOString(),
        })
        .eq('id', matchedProfile.id);

      if (evoEnabled) {
        const firstName = (matchedProfile.full_name || 'amigo(a)').trim().split(/\s+/)[0];
        await sendWhatsAppTextSafe({
          jidOrNumber: remoteJid,
          text: `Combinado, ${firstName}! Reativei seus lembretes de acompanhamento por aqui. Sempre que precisar, estou à disposição.`,
        }).catch(() => {});
      }

      return { eventType, matchedUserId: matchedProfile.id, remoteJid, action: 'opt_in_applied' };
    }
  }

  // Se o SuperAdmin desativou a função da Evolution API no painel, encerra aqui sem responder no chat
  if (!evoEnabled) {
    return { eventType, matchedUserId: matchedProfile?.id || null, remoteJid, skipped: 'disabled_by_superadmin' };
  }

  // 1B. MODO BLINDADO 2 ETAPAS (PROTEÇÃO DE LINKS DE VENDA NA META):
  // Se este contato estava aguardando resposta à Etapa 1 ("Posso te mandar o link? Responda 'sim' ou 👍"),
  // a resposta dele acabou de abrir a Janela Oficial Bidirecional de 24h da Meta -> entrega Capa + Link Editorial automaticamente!
  const inboundSignalForEbook = messageText || reactionEmoji;
  if (inboundSignalForEbook) {
    try {
      const { handleIncomingReplyForPendingEbookLink } = await import('./evolutionOutreachService.js');
      const step2Res = await handleIncomingReplyForPendingEbookLink(remoteJid, inboundSignalForEbook);
      if (step2Res?.handled) {
        if (matchedProfile?.id) {
          await supabaseAdmin
            .from('izaque_profiles')
            .update({
              whatsapp_jid: remoteJid,
              last_whatsapp_inbound_at: new Date().toISOString(),
            })
            .eq('id', matchedProfile.id)
            .then(() => {})
            .catch(() => {});
        }
        return {
          eventType,
          matchedUserId: matchedProfile?.id || null,
          remoteJid,
          action: step2Res.outcome,
          ebookSlug: step2Res.ebookSlug,
        };
      }
    } catch (step2Err) {
      console.error('⚠️ [Evolution Step-2 eBook Link]:', step2Err.message);
    }
  }

  // Ignora mensagens vazias (ex: figurinhas, reações sem texto)
  if (!messageText && !isAudioInbound) {
    return { eventType, matchedUserId: matchedProfile?.id || null, remoteJid, skipped: 'empty_content' };
  }

  // 2. Número ainda não vinculado a nenhuma conta em izaque_profiles
  if (!matchedProfile) {
    if ((await isHumanTakeoverActiveForTarget(remoteJid)).active) {
      return { eventType, matchedUserId: null, remoteJid, skipped: 'human_takeover_inflight_6h' };
    }
    const lastUnknownNotice = noticeCooldownByJid.get(`unknown:${remoteJid}`) || 0;
    if (Date.now() - lastUnknownNotice > 12 * 60 * 60 * 1000) {
      noticeCooldownByJid.set(`unknown:${remoteJid}`, Date.now());
      const appUrl = getEvoConfig().appUrl;
      await sendWhatsAppTextSafe({
        jidOrNumber: remoteJid,
        text: `Olá! Aqui é o *ISAAC*.\n\nAinda não localizei este número vinculado ao seu cadastro. Você pode criar sua conta gratuita e usar toda a mentoria livremente em ${appUrl}\n\nSe já possui conta, basta cadastrar este número em *Meu Perfil* lá no aplicativo!`,
      }).catch(() => {});
    }
    return { eventType, matchedUserId: null, remoteJid, action: 'unregistered_phone_notice' };
  }

  // Atualiza JID e timestamp da última interação recebida no WhatsApp
  await supabaseAdmin
    .from('izaque_profiles')
    .update({
      whatsapp_jid: remoteJid,
      last_whatsapp_inbound_at: new Date().toISOString(),
    })
    .eq('id', matchedProfile.id);

  if (matchedProfile.is_active === false && matchedProfile.role !== 'master') {
    return { eventType, matchedUserId: matchedProfile.id, remoteJid, skipped: 'inactive_account' };
  }

  // 3. Verifica Plano:
  // - SuperAdmin (edsonmanoel2012@gmail.com / role master): Plano Completo vitalício sem necessidade de assinar
  // - Assinante Pago (whatsapp_monthly): ativo dentro do ciclo de vencimento mensal
  // - Plano Gratuito (R$ 0,00): acesso 100% livre no App Web, sem conversa pelo WhatsApp
  const superAdminEmail = (process.env.SUPERADMIN_EMAIL || 'edsonmanoel2012@gmail.com').trim().toLowerCase();
  const isSuperAdmin =
    matchedProfile.role === 'master' ||
    String(matchedProfile.email || '').trim().toLowerCase() === superAdminEmail;

  const isMonthlySubscriptionValid =
    matchedProfile.plan_id === 'whatsapp_monthly' &&
    matchedProfile.plan_status === 'active' &&
    (!matchedProfile.plan_expires_at || new Date(matchedProfile.plan_expires_at).getTime() > Date.now());

  const hasWhatsappChatAccess = isSuperAdmin || isMonthlySubscriptionValid;

  if (!hasWhatsappChatAccess) {
    const lastFreeNotice = noticeCooldownByJid.get(`free:${remoteJid}`) || 0;
    if (Date.now() - lastFreeNotice > 12 * 60 * 60 * 1000) {
      noticeCooldownByJid.set(`free:${remoteJid}`, Date.now());
      const firstName = (matchedProfile.full_name || 'amigo(a)').trim().split(/\s+/)[0];
      const appUrl = getEvoConfig().appUrl;
      const wasPreviouslySubscriber = matchedProfile.plan_id === 'whatsapp_monthly';
      const noticeText = wasPreviouslySubscriber
        ? `Olá, ${firstName}! Seu ciclo mensal do *Plano ISAAC no WhatsApp* chegou ao vencimento.\n\nSeu acesso à mentoria pelo aplicativo continua *100% gratuito e liberado* em ${appUrl}\n\nCaso deseje renovar a conversa comigo por texto e áudio aqui no WhatsApp (R$ 14,99/mês), basta regularizar a assinatura mensal lá no aplicativo!`
        : `Olá, ${firstName}! Que bom receber sua mensagem.\n\nNo seu *Plano Gratuito*, você tem tudo 100% liberado para conversar comigo à vontade diretamente pelo aplicativo em ${appUrl}\n\nPara conversar comigo também aqui pelo WhatsApp (por *texto e áudio*, integrado à mesma conversa do app), basta ativar o *Plano Mensal ISAAC no WhatsApp (R$ 14,99/mês)* dentro do aplicativo!`;

      await sendWhatsAppTextSafe({
        jidOrNumber: remoteJid,
        text: noticeText,
      }).catch(() => {});
    }
    return { eventType, matchedUserId: matchedProfile.id, remoteJid, action: 'free_plan_notice' };
  }

  // Se enviou áudio mas a transcrição falhou / ficou inaudível
  if (!messageText && isAudioInbound) {
    await sendWhatsAppTextSafe({
      jidOrNumber: remoteJid,
      text: 'Não consegui ouvir com clareza o seu áudio agora... Pode gravar novamente ou me escrever em poucas palavras?',
    }).catch(() => {});
    return { eventType, matchedUserId: matchedProfile.id, remoteJid, action: 'inaudible_audio' };
  }

  // 4. CONVERSA UNIFICADA NO MESMO CHAT DO APP (izaque_chat_sessions + izaque_messages + Agente Orquestrador)
  const sessionId = await ensureUserSession(matchedProfile.id, null, messageText);

  let sessionHistory = [];
  if (sessionId) {
    const { data: recentDbMsgs } = await supabaseAdmin
      .from('izaque_messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10);

    sessionHistory = (recentDbMsgs || []).reverse();
  }

  const { reply, selectedAgent } = await processChatMessageCore({
    message: messageText,
    userId: matchedProfile.id,
    agentId: 'auto',
    history: sessionHistory,
    sessionId,
  });

  // Se um humano assumiu a conversa nos segundos em que o Gemini gerava a resposta, aborta totalmente o envio do agente!
  if ((await isHumanTakeoverActiveForTarget(remoteJid)).active) {
    console.log(
      `🤫 [Evolution Human Takeover] Humano assumiu durante o processamento — resposta automática abortada para ${remoteJid}.`
    );
    return {
      eventType,
      matchedUserId: matchedProfile.id,
      remoteJid,
      skipped: 'human_takeover_inflight_6h',
    };
  }

  const wantsAudioReply =
    isAudioInbound ||
    /\b(?:manda|mande|envia|envie|responda|responder|fala|fale)\s+(?:um\s+|em\s+|por\s+)?[aá]udio\b/i.test(
      messageText
    );

  // Grava imediatamente na mesma sessão de izaque_messages -> aparece em tempo real no App Web!
  const isAgentUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedAgent?.id || '');
  const safeAgentId = isAgentUuid ? selectedAgent.id : null;

  await supabaseAdmin.from('izaque_messages').insert([
    {
      user_id: matchedProfile.id,
      agent_id: safeAgentId,
      session_id: sessionId,
      role: 'user',
      content: messageText,
      is_audio: isAudioInbound,
    },
    {
      user_id: matchedProfile.id,
      agent_id: safeAgentId,
      session_id: sessionId,
      role: 'assistant',
      content: reply,
      is_audio: wantsAudioReply,
    },
  ]);

  // 5. Envia a resposta no WhatsApp (Áudio Neural se o usuário falou por áudio / pediu áudio, ou Texto)
  if (wantsAudioReply) {
    try {
      const edsonVoice = await getEdsonGlobalVoiceConfig();
      const preferredVoice = edsonVoice.geminiVoice || 'Aoede';
      const speechClean = cleanTextForSpeech(reply);
      const ttsResult = await generateGeminiAudio(speechClean, preferredVoice);
      await sendWhatsAppAudioSafe({
        jidOrNumber: remoteJid,
        audioBuffer: ttsResult.buffer,
      });
      return {
        eventType,
        matchedUserId: matchedProfile.id,
        remoteJid,
        sessionId,
        repliedAs: 'audio',
      };
    } catch (ttsErr) {
      console.warn('⚠️ [Evolution TTS Fallback] Falha ao enviar áudio no WhatsApp, enviando em texto:', ttsErr.message);
    }
  }

  await sendWhatsAppTextSafe({
    jidOrNumber: remoteJid,
    text: reply,
  });

  return {
    eventType,
    matchedUserId: matchedProfile.id,
    remoteJid,
    sessionId,
    repliedAs: 'text',
  };
}

/**
 * Consulta status ao vivo da instância na Evolution + últimos envios
 */
export async function getEvolutionIntegrationStatus() {
  const cfg = getEvoConfig();
  const dbEnabled = await isEvolutionEnabledInDatabase();
  let connectionState = null;
  let webhookConfig = null;

  if (cfg.apiKey) {
    try {
      const [connRes, whRes] = await Promise.all([
        fetch(`${cfg.baseUrl}/instance/connectionState/${encodeURIComponent(cfg.instanceName)}`, {
          headers: { apikey: cfg.apiKey },
        }),
        fetch(`${cfg.baseUrl}/webhook/find/${encodeURIComponent(cfg.instanceName)}`, {
          headers: { apikey: cfg.apiKey },
        }),
      ]);
      if (connRes.ok) connectionState = await connRes.json();
      if (whRes.ok) webhookConfig = await whRes.json();
    } catch (err) {
      connectionState = { error: err.message };
    }
  }

  const { data: recentFollowups } = await supabaseAdmin
    .from('izaque_whatsapp_followups')
    .select('id, user_id, preferred_name, whatsapp_jid, pending_topic_summary, trigger_type, status, delay_ms, created_at')
    .order('created_at', { ascending: false })
    .limit(15);

  return {
    enabled: Boolean(cfg.enabled && dbEnabled),
    dbEnabled,
    envEnabled: cfg.enabled,
    baseUrl: cfg.baseUrl,
    instanceName: cfg.instanceName,
    instanceJid: cfg.instanceJid,
    dailyCronTimeBrt: cfg.cronTime,
    webhookUrlRecommended: `${cfg.appUrl.replace(/\/$/, '')}/api/webhooks/evolution`,
    connectionState,
    webhookConfig,
    recentFollowups: recentFollowups || [],
  };
}

/**
 * Agendador Diário Interno — dispara exatamente às 09:50 (America/Sao_Paulo) uma única vez por dia
 */
let lastExecutedDateBrt = null;
let schedulerInterval = null;

function getBrtClockParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    hhmm: `${hour}:${parts.minute}`,
  };
}

export function startEvolutionDailyScheduler() {
  if (schedulerInterval) return;

  const cfg = getEvoConfig();
  console.log(
    `⏰ [Evolution Scheduler] Agendado para rodar todos os dias às ${cfg.cronTime} (${TIMEZONE}) — Instância: ${cfg.instanceName}`
  );

  schedulerInterval = setInterval(async () => {
    try {
      const currentCfg = getEvoConfig();
      if (!currentCfg.enabled || !currentCfg.apiKey) return;

      const { dateKey, hhmm } = getBrtClockParts();
      if (hhmm !== currentCfg.cronTime) return;
      if (lastExecutedDateBrt === dateKey) return;

      lastExecutedDateBrt = dateKey;
      const dbEnabled = await isEvolutionEnabledInDatabase();
      if (!dbEnabled) {
        console.log(
          `⏸️ [Evolution Scheduler] 09:50 BRT (${dateKey}) — função desativada no Painel SuperAdmin. Nenhum envio realizado.`
        );
        return;
      }

      console.log(`🌅 [Evolution Scheduler] 09:50 BRT atingido (${dateKey}) — iniciando verificação de interações > 24h...`);
      await runDailyInactivityFollowUp({ dryRun: false, triggerType: 'daily_cron' });
    } catch (err) {
      console.error('❌ [Evolution Scheduler] Falha na execução agendada:', err.message);
    }
  }, 25_000);

  if (typeof schedulerInterval.unref === 'function') {
    schedulerInterval.unref();
  }
}

