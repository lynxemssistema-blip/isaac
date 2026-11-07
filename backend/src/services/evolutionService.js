import crypto from 'crypto';
import { genAI, CHAT_MODEL, FALLBACK_CHAT_MODELS } from '../config/gemini.js';
import { supabaseAdmin } from '../config/supabase.js';

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

export function randomBetween(minMs, maxMs) {
  return crypto.randomInt(minMs, maxMs + 1);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Normaliza números brasileiros (com ou sem +55, parênteses, traços, 8 ou 9 dígitos)
 */
export function normalizeBrazilPhone(rawPhone) {
  if (!rawPhone) return '';
  let digits = String(rawPhone).split('@')[0].replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
    digits = digits.slice(1);
  }
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  return digits;
}

/**
 * Extrai chave comparável (DDD + últimos 8 dígitos) para casar números brasileiros com ou sem o 9º dígito
 */
export function extractComparablePhoneKey(phoneOrJid) {
  const digits = normalizeBrazilPhone(phoneOrJid);
  if (digits.length < 10) return '';
  const withoutCountry = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
  const ddd = withoutCountry.slice(0, 2);
  const last8 = withoutCountry.slice(-8);
  return `${ddd}${last8}`;
}

/**
 * Consulta a Evolution API (/chat/whatsappNumbers/:instance) para:
 * 1. Confirmar que o número realmente possui WhatsApp ativo (evita tentativa em número inválido -> proteção Anti-Ban)
 * 2. Resolver o JID exato (8 vs 9 dígitos em MG e demais estados)
 */
export async function resolveWhatsAppJid(rawPhone) {
  const cfg = getEvoConfig();
  if (!cfg.apiKey) {
    throw new Error('EVOLUTION_API_KEY não configurada no servidor.');
  }

  const normalized = normalizeBrazilPhone(rawPhone);
  if (normalized.length < 12) {
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

  const modelsToTry = [CHAT_MODEL, ...(FALLBACK_CHAT_MODELS || [])].filter(
    (m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx
  );

  let rawJson = '';
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.88,
        },
      });
      const result = await model.generateContent(prompt);
      rawJson = result.response.text();
      if (rawJson) break;
    } catch (err) {
      if (err?.message && (err.message.includes('404') || err.message.includes('not found'))) {
        continue;
      }
      throw err;
    }
  }

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

    const validProfiles = (profiles || []).filter((p) => normalizeBrazilPhone(p.phone).length >= 12);
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

/**
 * Processa eventos recebidos via Webhook da Evolution API (/api/webhooks/evolution e /api/webhooks/evolution/:event)
 */
export async function processEvolutionWebhookPayload(eventParam, body = {}) {
  const eventType = String(body?.event || eventParam || 'unknown').toUpperCase().replace(/-/g, '_');
  const instanceName = body?.instance || getEvoConfig().instanceName;
  const data = body?.data || {};
  const key = data?.key || {};
  const remoteJid = key?.remoteJid || data?.remoteJid || null;
  const fromMe = Boolean(key?.fromMe);

  const messageObj = data?.message || {};
  const messageText =
    messageObj?.conversation ||
    messageObj?.extendedTextMessage?.text ||
    messageObj?.ephemeralMessage?.message?.extendedTextMessage?.text ||
    messageObj?.ephemeralMessage?.message?.conversation ||
    null;

  // Sanitiza base64 pesados antes de gravar no banco
  const compactPayload = {
    event: eventType,
    instance: instanceName,
    date_time: body?.date_time || null,
    sender: body?.sender || null,
    key,
    pushName: data?.pushName || null,
    messageType: data?.messageType || null,
    status: data?.status || null,
    messageText: messageText ? String(messageText).slice(0, 2000) : null,
  };

  let matchedUserId = null;
  if (remoteJid && remoteJid.endsWith('@s.whatsapp.net')) {
    const incomingKey = extractComparablePhoneKey(remoteJid);
    if (incomingKey) {
      const { data: profiles } = await supabaseAdmin
        .from('izaque_profiles')
        .select('id, phone, whatsapp_jid, whatsapp_opt_out')
        .not('phone', 'is', null);

      const matched = (profiles || []).find(
        (p) => p.whatsapp_jid === remoteJid || extractComparablePhoneKey(p.phone) === incomingKey
      );

      if (matched) {
        matchedUserId = matched.id;

        if (!fromMe && eventType.includes('MESSAGES_UPSERT')) {
          const cleanLower = (messageText || '').trim().toLowerCase();
          const isOptOut = ['parar', 'sair', 'cancelar', 'stop', 'descadastrar', 'nao quero', 'não quero'].includes(
            cleanLower
          );

          const updates = {
            whatsapp_jid: remoteJid,
            last_whatsapp_inbound_at: new Date().toISOString(),
          };
          if (isOptOut) {
            updates.whatsapp_opt_out = true;
            updates.whatsapp_opt_out_at = new Date().toISOString();
          }

          await supabaseAdmin.from('izaque_profiles').update(updates).eq('id', matched.id);
        }
      }
    }
  }

  await supabaseAdmin.from('izaque_whatsapp_webhook_events').insert({
    event_type: eventType,
    instance_name: instanceName,
    remote_jid: remoteJid,
    matched_user_id: matchedUserId,
    from_me: fromMe,
    message_text: messageText ? String(messageText).slice(0, 2000) : null,
    payload: compactPayload,
  });

  return { eventType, matchedUserId, remoteJid };
}

/**
 * Consulta status ao vivo da instância na Evolution + últimos envios
 */
export async function getEvolutionIntegrationStatus() {
  const cfg = getEvoConfig();
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
    enabled: cfg.enabled,
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
