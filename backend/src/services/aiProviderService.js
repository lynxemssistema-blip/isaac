import { genAI, CHAT_MODEL, FALLBACK_CHAT_MODELS } from '../config/gemini.js';
import { supabaseAdmin } from '../config/supabase.js';
import { getOrFetchCached, invalidateCache, setCached } from '../utils/memoryCache.js';

const AI_CONFIG_CACHE_KEY = 'system:ai_config';
const AI_CONFIG_TTL_MS = 15_000;

const DEFAULT_VPS_BASE_URL = (process.env.LYNX_VPS_AI_URL || 'https://lynxhub.lynxems.com.br').replace(/\/+$/, '');
const DEFAULT_VPS_API_KEY = (process.env.LYNX_VPS_AI_KEY || 'lynx_sk_live_vps_default_2026').trim();

export const VALID_AI_MODES = ['gemini', 'hybrid', 'vps'];

export const DEFAULT_AI_CONFIG = {
  ai_provider_mode: 'gemini', // 'gemini' | 'hybrid' | 'vps'
  vps_model: 'qwen2.5-coder:1.5b',
  vps_auto_fallback_gemini: true,
  gemini_auto_fallback_vps: true,
  vps_max_concurrent: 12,
};

let inFlightVpsRequests = 0;

export function normalizeAiConfig(raw = {}) {
  const mode = VALID_AI_MODES.includes(raw?.ai_provider_mode) ? raw.ai_provider_mode : DEFAULT_AI_CONFIG.ai_provider_mode;
  const vpsModel = String(raw?.vps_model || DEFAULT_AI_CONFIG.vps_model).trim() || DEFAULT_AI_CONFIG.vps_model;
  const maxConc = Math.min(30, Math.max(2, Number(raw?.vps_max_concurrent) || DEFAULT_AI_CONFIG.vps_max_concurrent));
  return {
    ai_provider_mode: mode,
    vps_model: vpsModel,
    vps_auto_fallback_gemini:
      raw?.vps_auto_fallback_gemini !== undefined ? Boolean(raw.vps_auto_fallback_gemini) : true,
    gemini_auto_fallback_vps:
      raw?.gemini_auto_fallback_vps !== undefined ? Boolean(raw.gemini_auto_fallback_vps) : true,
    vps_max_concurrent: maxConc,
  };
}

/**
 * Lê a configuração ativa do motor de IA com cache Singleflight ultrarrápido (15s)
 */
export async function getActiveAiConfig() {
  return getOrFetchCached(
    AI_CONFIG_CACHE_KEY,
    async () => {
      try {
        const { data: edsonRow } = await supabaseAdmin
          .from('izaque_profiles')
          .select('preferences')
          .eq('email', 'edsonmanoel2012@gmail.com')
          .maybeSingle();

        const stored = edsonRow?.preferences?.system_ai_config || {};
        return normalizeAiConfig(stored);
      } catch (err) {
        console.warn('⚠️ [AI Provider] Aviso ao ler system_ai_config, usando padrão seguro:', err.message);
        return { ...DEFAULT_AI_CONFIG };
      }
    },
    AI_CONFIG_TTL_MS
  );
}

/**
 * Salva imediatamente a configuração da Chave Mestra de IA (sem reiniciar servidor)
 */
export async function saveActiveAiConfig(partialConfig = {}) {
  const current = await getActiveAiConfig();
  const nextConfig = normalizeAiConfig({ ...current, ...partialConfig });

  const { data: edsonRow, error: readErr } = await supabaseAdmin
    .from('izaque_profiles')
    .select('id, preferences')
    .eq('email', 'edsonmanoel2012@gmail.com')
    .maybeSingle();

  if (readErr) throw readErr;

  if (edsonRow?.id) {
    const mergedPreferences = {
      ...(edsonRow.preferences || {}),
      system_ai_config: {
        ...nextConfig,
        updated_at: new Date().toISOString(),
      },
    };
    const { error: updateErr } = await supabaseAdmin
      .from('izaque_profiles')
      .update({
        preferences: mergedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', edsonRow.id);

    if (updateErr) throw updateErr;
  }

  invalidateCache(AI_CONFIG_CACHE_KEY);
  invalidateCache('system:settings');
  setCached(AI_CONFIG_CACHE_KEY, nextConfig, AI_CONFIG_TTL_MS);
  return nextConfig;
}

/**
 * Remove tags <think>...</think> caso modelos reasoning (ex: deepseek-r1) sejam selecionados
 */
function stripThinkingTags(text = '') {
  return String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * Extrai JSON limpo mesmo quando LLMs locais envolvem em blocos markdown ```json
 */
export function extractCleanJsonText(rawText = '') {
  const cleaned = stripThinkingTags(rawText)
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

function buildOpenAiMessages({ systemInstruction = '', recentHistory = [], message = '' }) {
  const msgs = [];
  if (systemInstruction && systemInstruction.trim()) {
    msgs.push({ role: 'system', content: systemInstruction.trim() });
  }
  if (Array.isArray(recentHistory)) {
    for (const turn of recentHistory) {
      const content = String(turn?.content || turn?.parts?.[0]?.text || '').trim();
      if (!content) continue;
      const role = turn.role === 'model' || turn.role === 'assistant' ? 'assistant' : 'user';
      msgs.push({ role, content });
    }
  }
  if (message && String(message).trim()) {
    msgs.push({ role: 'user', content: String(message).trim() });
  }
  return msgs;
}

/**
 * Decide a ordem dos provedores ('vps' vs 'gemini') conforme o modo ativo e a carga em voo
 * @param {'chat' | 'background'} purpose
 */
function resolveProviderChain(config, purpose = 'chat') {
  const mode = config.ai_provider_mode;

  // No modo Híbrido: Chat ao vivo usa Gemini (<1s), e Background (memórias/resumos/rascunhos) usa VPS a R$ 0,00!
  const prefersVps = mode === 'vps' || (mode === 'hybrid' && purpose === 'background');

  if (prefersVps) {
    // Proteção inteligente anti-fila: se a VPS já está com o teto de inferências simultâneas na CPU
    // e o transbordo automático está ativo, desvia o excedente direto para o Gemini sem fila!
    if (inFlightVpsRequests >= config.vps_max_concurrent && config.vps_auto_fallback_gemini) {
      console.log(
        `⚡ [AI Smart Overflow] VPS com ${inFlightVpsRequests} inferências ativas -> Transbordando requisição para Gemini Cloud.`
      );
      return ['gemini', 'vps'];
    }
    return config.vps_auto_fallback_gemini ? ['vps', 'gemini'] : ['vps'];
  }

  return config.gemini_auto_fallback_vps ? ['gemini', 'vps'] : ['gemini'];
}

/**
 * Chamada não-streaming para a VPS LynxHub (/v1/chat/completions)
 */
async function callVpsCompletion({
  model,
  systemInstruction = '',
  recentHistory = [],
  message = '',
  temperature = 0.7,
  maxOutputTokens = 1200,
  jsonMode = false,
  timeoutMs = 28_000,
}) {
  const effectiveSys = jsonMode
    ? `${systemInstruction}\nResponda APENAS com um objeto JSON válido, sem markdown e sem comentários extras.`.trim()
    : systemInstruction;

  const messages = buildOpenAiMessages({
    systemInstruction: effectiveSys,
    recentHistory,
    message,
  });

  inFlightVpsRequests += 1;
  try {
    const bodyPayload = {
      model: model || DEFAULT_AI_CONFIG.vps_model,
      messages,
      temperature: Number(temperature ?? 0.7),
      max_tokens: Math.min(Number(maxOutputTokens) || 1200, 2048),
      stream: false,
    };
    if (jsonMode) {
      bodyPayload.format = 'json';
    }

    const res = await fetch(`${DEFAULT_VPS_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEFAULT_VPS_API_KEY}`,
      },
      body: JSON.stringify(bodyPayload),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`VPS LynxHub HTTP ${res.status}: ${errBody.slice(0, 180)}`);
    }

    const data = await res.json();
    const rawContent = data?.choices?.[0]?.message?.content || data?.message?.content || '';
    const cleaned = jsonMode ? extractCleanJsonText(rawContent) : stripThinkingTags(rawContent);
    if (!cleaned) {
      throw new Error('VPS LynxHub retornou resposta vazia.');
    }
    return cleaned;
  } finally {
    inFlightVpsRequests = Math.max(0, inFlightVpsRequests - 1);
  }
}

/**
 * Chamada não-streaming para o Google Gemini Cloud com fallback interno de modelos Gemini
 */
async function callGeminiCompletion({
  systemInstruction = '',
  recentHistory = [],
  message = '',
  temperature = 0.7,
  maxOutputTokens = 4096,
  jsonMode = false,
}) {
  const modelsToTry = [CHAT_MODEL, ...(FALLBACK_CHAT_MODELS || [])].filter(
    (m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx
  );
  let lastErr = null;

  for (const modelCandidate of modelsToTry) {
    try {
      // Modelos Gemini 2.5+ / 3.6+ usam orçamento interno de raciocínio; piso de 1024 evita truncar a resposta visível
      const safeGeminiMaxTokens = Math.max(Number(maxOutputTokens) || 4096, 1024);
      const generationConfig = {
        temperature: Number(temperature ?? 0.7),
        maxOutputTokens: safeGeminiMaxTokens,
      };
      if (jsonMode) {
        generationConfig.responseMimeType = 'application/json';
      }

      const model = genAI.getGenerativeModel({
        model: modelCandidate,
        ...(systemInstruction ? { systemInstruction } : {}),
        generationConfig,
      });

      let text = '';
      if (Array.isArray(recentHistory) && recentHistory.length > 0) {
        const chatSession = model.startChat({ history: recentHistory });
        const result = await chatSession.sendMessage(message);
        text = result.response.text();
      } else {
        const result = await model.generateContent(message);
        text = result.response.text();
      }

      const cleaned = jsonMode ? extractCleanJsonText(text) : String(text || '').trim();
      if (cleaned) return cleaned;
    } catch (err) {
      lastErr = err;
      const isNotFound = err?.message && (err.message.includes('404') || err.message.includes('not found'));
      if (isNotFound) continue;
      throw err;
    }
  }

  throw lastErr || new Error('Falha ao obter resposta do Google Gemini.');
}

/**
 * Orquestrador Unificado Não-Streaming (Chat REST, WhatsApp, Áudio pós-transcrição, Memórias, Resumos, Incômodo Criativo)
 */
export async function generateUnifiedText({
  systemInstruction = '',
  recentHistory = [],
  message = '',
  temperature = 0.7,
  maxOutputTokens = 4096,
  jsonMode = false,
  purpose = 'chat', // 'chat' | 'background'
}) {
  const config = await getActiveAiConfig();
  const chain = resolveProviderChain(config, purpose);
  let lastError = null;

  for (const provider of chain) {
    try {
      if (provider === 'vps') {
        const text = await callVpsCompletion({
          model: config.vps_model,
          systemInstruction,
          recentHistory,
          message,
          temperature,
          maxOutputTokens,
          jsonMode,
          timeoutMs: purpose === 'background' ? 45_000 : 25_000,
        });
        return { text, providerUsed: 'vps', modelUsed: config.vps_model };
      }

      const text = await callGeminiCompletion({
        systemInstruction,
        recentHistory,
        message,
        temperature,
        maxOutputTokens,
        jsonMode,
      });
      return { text, providerUsed: 'gemini', modelUsed: CHAT_MODEL };
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ [AI Router] Provedor "${provider}" falhou (${err.message}). Tentando contingência se ativa...`);
    }
  }

  throw lastError || new Error('Nenhum provedor de IA conseguiu responder no momento.');
}

/**
 * Streaming SSE em tempo real a partir da VPS LynxHub (/v1/chat/completions com stream: true)
 */
async function streamFromVps({
  model,
  systemInstruction = '',
  recentHistory = [],
  message = '',
  temperature = 0.7,
  maxOutputTokens = 1500,
  isClientClosed = () => false,
  onDelta,
}) {
  const messages = buildOpenAiMessages({ systemInstruction, recentHistory, message });

  inFlightVpsRequests += 1;
  const controller = new AbortController();
  // Timeout de 18s para o primeiro byte/cabeçalho (evita fila longa na tela do usuário)
  const firstByteTimer = setTimeout(() => controller.abort(new Error('Timeout aguardando primeiro token da VPS')), 18_000);

  try {
    const res = await fetch(`${DEFAULT_VPS_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEFAULT_VPS_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || DEFAULT_AI_CONFIG.vps_model,
        messages,
        temperature: Number(temperature ?? 0.7),
        max_tokens: Math.min(Number(maxOutputTokens) || 1500, 2048),
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(firstByteTimer);

    if (!res.ok || !res.body) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`VPS Stream HTTP ${res.status}: ${errBody.slice(0, 180)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullReply = '';
    let insideThink = false;

    while (true) {
      if (isClientClosed()) {
        await reader.cancel().catch(() => {});
        break;
      }
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || !line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') break;

        try {
          const parsed = JSON.parse(payload);
          let delta = parsed?.choices?.[0]?.delta?.content ?? parsed?.message?.content ?? '';
          if (!delta) continue;

          // Filtra tags <think> caso modelo reasoning esteja ativo
          if (delta.includes('<think>')) insideThink = true;
          if (insideThink) {
            if (delta.includes('</think>')) {
              insideThink = false;
              delta = delta.split('</think>').pop() || '';
            } else {
              continue;
            }
          }

          if (delta) {
            fullReply += delta;
            onDelta(delta, fullReply);
          }
        } catch {
          // Ignora linhas parciais não-JSON
        }
      }
    }

    if (!fullReply.trim() && !isClientClosed()) {
      throw new Error('Stream da VPS encerrou sem gerar conteúdo.');
    }

    return { fullReply, providerUsed: 'vps', modelUsed: model };
  } finally {
    clearTimeout(firstByteTimer);
    inFlightVpsRequests = Math.max(0, inFlightVpsRequests - 1);
  }
}

/**
 * Streaming SSE em tempo real a partir do Google Gemini Cloud
 */
async function streamFromGemini({
  systemInstruction = '',
  recentHistory = [],
  message = '',
  temperature = 0.7,
  maxOutputTokens = 8192,
  isClientClosed = () => false,
  onDelta,
}) {
  const modelsToTry = [CHAT_MODEL, ...(FALLBACK_CHAT_MODELS || [])].filter(
    (m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx
  );
  let fullReply = '';
  let lastErr = null;

  for (const modelCandidate of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelCandidate,
        ...(systemInstruction ? { systemInstruction } : {}),
        generationConfig: {
          temperature: Number(temperature ?? 0.7),
          maxOutputTokens: Number(maxOutputTokens) || 8192,
        },
      });

      const chatSession = model.startChat({ history: recentHistory || [] });
      const streamRes = await chatSession.sendMessageStream(message);

      for await (const chunk of streamRes.stream) {
        if (isClientClosed()) break;
        const delta = chunk.text();
        if (delta) {
          fullReply += delta;
          onDelta(delta, fullReply);
        }
      }

      if (fullReply || isClientClosed()) {
        return { fullReply, providerUsed: 'gemini', modelUsed: modelCandidate };
      }
    } catch (err) {
      lastErr = err;
      const isNotFound = err?.message && (err.message.includes('404') || err.message.includes('not found'));
      if (isNotFound && !fullReply) continue;
      throw err;
    }
  }

  throw lastErr || new Error('Falha no streaming do Google Gemini.');
}

/**
 * Orquestrador Unificado de Streaming SSE (POST /api/chat/stream):
 * Se o provedor primário falhar antes de emitir o 1º caractere, faz failover transparente em tempo real!
 */
export async function streamUnifiedChat({
  systemInstruction = '',
  recentHistory = [],
  message = '',
  temperature = 0.7,
  maxOutputTokens = 8192,
  isClientClosed = () => false,
  onDelta,
}) {
  const config = await getActiveAiConfig();
  const chain = resolveProviderChain(config, 'chat');
  let emittedAnyDelta = false;
  let lastError = null;

  const wrappedOnDelta = (delta, fullSoFar) => {
    emittedAnyDelta = true;
    onDelta(delta, fullSoFar);
  };

  for (const provider of chain) {
    try {
      if (provider === 'vps') {
        return await streamFromVps({
          model: config.vps_model,
          systemInstruction,
          recentHistory,
          message,
          temperature,
          maxOutputTokens,
          isClientClosed,
          onDelta: wrappedOnDelta,
        });
      }

      return await streamFromGemini({
        systemInstruction,
        recentHistory,
        message,
        temperature,
        maxOutputTokens,
        isClientClosed,
        onDelta: wrappedOnDelta,
      });
    } catch (err) {
      lastError = err;
      if (emittedAnyDelta) {
        // Já enviou parte do texto na tela, não repete do zero em outro modelo
        throw err;
      }
      console.warn(
        `⚠️ [AI Stream Failover] Provedor "${provider}" falhou antes do 1º token (${err.message}). Chaveando automaticamente...`
      );
    }
  }

  throw lastError || new Error('Erro ao gerar resposta em tempo real.');
}

/**
 * Status em tempo real para o Painel SuperAdmin (lista modelos instalados na VPS, modelo aquecido em RAM e latência)
 */
export async function getAiEngineLiveStatus() {
  const config = await getActiveAiConfig();
  const t0 = performance.now();
  let vpsOnline = false;
  let vpsLatencyMs = null;
  let installedModels = [];
  let loadedModels = [];
  let vpsError = null;

  try {
    const [modelsRes, psRes] = await Promise.all([
      fetch(`${DEFAULT_VPS_BASE_URL}/v1/models`, {
        headers: { Authorization: `Bearer ${DEFAULT_VPS_API_KEY}` },
        signal: AbortSignal.timeout(5_000),
      }),
      fetch(`${DEFAULT_VPS_BASE_URL}/api/ps`, {
        headers: { Authorization: `Bearer ${DEFAULT_VPS_API_KEY}` },
        signal: AbortSignal.timeout(3_500),
      }).catch(() => null),
    ]);

    vpsLatencyMs = Math.round(performance.now() - t0);
    if (modelsRes.ok) {
      vpsOnline = true;
      const body = await modelsRes.json().catch(() => ({}));
      const rawList = Array.isArray(body?.models) ? body.models : Array.isArray(body?.data) ? body.data : [];
      installedModels = rawList
        .map((m) => ({
          name: m.name || m.id,
          sizeMb: m.size ? Math.round(m.size / (1024 * 1024)) : null,
          parameterSize: m.details?.parameter_size || null,
          quantization: m.details?.quantization_level || null,
        }))
        .filter((m) => m.name && !m.name.includes('embed'));
    } else {
      vpsError = `HTTP ${modelsRes.status}`;
    }

    if (psRes && psRes.ok) {
      const psBody = await psRes.json().catch(() => ({}));
      loadedModels = (psBody?.models || []).map((m) => m.name || m.model).filter(Boolean);
    }
  } catch (err) {
    vpsError = err.message;
  }

  return {
    config,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    geminiDefaultModel: CHAT_MODEL,
    vpsEndpoint: DEFAULT_VPS_BASE_URL,
    vpsOnline,
    vpsLatencyMs,
    vpsError,
    inFlightVpsRequests,
    installedModels,
    loadedModels,
  };
}

/**
 * Teste rápido sob demanda acionado pelo SuperAdmin no painel
 */
export async function runAiEngineLiveTest({ targetProvider = 'vps', vpsModelOverride = '' } = {}) {
  const config = await getActiveAiConfig();
  const chosenVpsModel = (vpsModelOverride || config.vps_model || DEFAULT_AI_CONFIG.vps_model).trim();
  const t0 = performance.now();

  if (targetProvider === 'vps') {
    const reply = await callVpsCompletion({
      model: chosenVpsModel,
      systemInstruction: 'Você é ISAAC, mentor de clareza emocional. Responda em 1 frase curta e acolhedora em português.',
      message: 'Confirme em uma frase curta que o motor LynxHub na VPS está ativo e conectado ao ISAAC.',
      temperature: 0.5,
      maxOutputTokens: 80,
      timeoutMs: 25_000,
    });
    return {
      ok: true,
      providerUsed: 'vps',
      modelUsed: chosenVpsModel,
      latencyMs: Math.round(performance.now() - t0),
      reply,
    };
  }

  const reply = await callGeminiCompletion({
    systemInstruction: 'Você é ISAAC, mentor de clareza emocional. Responda em 1 frase curta e acolhedora em português.',
    message: 'Confirme em uma frase curta que o motor Google Gemini Cloud está ativo e conectado ao ISAAC.',
    temperature: 0.5,
    maxOutputTokens: 80,
  });
  return {
    ok: true,
    providerUsed: 'gemini',
    modelUsed: CHAT_MODEL,
    latencyMs: Math.round(performance.now() - t0),
    reply,
  };
}
