import crypto from 'crypto';
import { spawn } from 'child_process';
import { supabaseAdmin } from '../config/supabase.js';
import { pcmBase64ToWavOffThread } from '../utils/workerPool.js';

const BUCKET_NAME = 'audio_cache';
const MAX_MEMORY_CACHE_ITEMS = 100;
const memoryAudioCache = new Map(); // key -> { base64, mimeType, ext, voiceName, createdAt }
const inFlightSynthesis = new Map(); // key -> Promise<audioResult>

let bucketChecked = false;
let cachedEdsonVoiceConfig = null;
let cachedEdsonVoiceExpiresAt = 0;

export function invalidateEdsonVoiceCache() {
  cachedEdsonVoiceConfig = null;
  cachedEdsonVoiceExpiresAt = 0;
}

export function normalizeGeminiVoiceId(rawVoice) {
  const vLower = String(rawVoice || '').trim().toLowerCase();
  if (!vLower) return 'Aoede';
  if (vLower.includes('aoede') || vLower === 'female' || vLower === 'feminino') return 'Aoede';
  if (vLower.includes('charon')) return 'Charon';
  if (vLower.includes('kore')) return 'Kore';
  if (vLower.includes('puck')) return 'Puck';
  if (vLower.includes('fenrir')) return 'Fenrir';
  return 'Charon';
}

/**
 * Busca a configuração oficial de voz/áudio do usuário Edson Manoel (parâmetro mestre para todos os casos)
 */
export async function getEdsonGlobalVoiceConfig() {
  const now = Date.now();
  if (cachedEdsonVoiceConfig && now < cachedEdsonVoiceExpiresAt) {
    return cachedEdsonVoiceConfig;
  }

  try {
    const [{ data: sys }, { data: edson }] = await Promise.all([
      supabaseAdmin.from('izaque_system_settings').select('*').eq('id', 'global').maybeSingle(),
      supabaseAdmin
        .from('izaque_profiles')
        .select('preferences')
        .eq('email', 'edsonmanoel2012@gmail.com')
        .maybeSingle(),
    ]);

    const prefs = edson?.preferences || {};
    const config = {
      voiceEngine: sys?.default_voice_engine || prefs.voice_engine || 'gemini',
      geminiVoice: normalizeGeminiVoiceId(sys?.default_gemini_voice || prefs.gemini_voice || 'Aoede'),
      voiceGender: sys?.default_voice_gender || prefs.voice_gender || 'male',
      voiceRate: Number(sys?.default_voice_rate ?? prefs.voice_rate ?? 0.90),
      voicePitch: Number(sys?.default_voice_pitch ?? prefs.voice_pitch ?? 0.95),
      voiceUri: sys?.default_voice_uri ?? prefs.voice_uri ?? '',
      preferBrowser: Boolean(sys?.default_prefer_browser ?? prefs.prefer_browser ?? false),
      guideName: sys?.default_guide_name || prefs.guide_name || 'Isaac',
    };

    cachedEdsonVoiceConfig = config;
    cachedEdsonVoiceExpiresAt = now + 60_000;
    return config;
  } catch (err) {
    console.warn('⚠️ [Voice Config] Aviso ao ler configuração mestre do Edson:', err.message);
    return {
      voiceEngine: 'gemini',
      geminiVoice: 'Aoede',
      voiceGender: 'male',
      voiceRate: 0.90,
      voicePitch: 0.95,
      voiceUri: '',
      preferBrowser: false,
      guideName: 'Isaac',
    };
  }
}

async function ensureAudioCacheBucket() {
  if (bucketChecked) return;
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const existing = Array.isArray(buckets) && buckets.find((b) => b.name === BUCKET_NAME || b.id === BUCKET_NAME);
    if (!existing) {
      await supabaseAdmin.storage.createBucket(BUCKET_NAME, { public: false });
      console.log(`🪣 [Voice Cache] Bucket privado '${BUCKET_NAME}' criado automaticamente.`);
    } else if (existing.public) {
      await supabaseAdmin.storage.updateBucket(BUCKET_NAME, { public: false });
      console.log(`🔒 [Voice Cache] Bucket '${BUCKET_NAME}' blindado como privado (public: false).`);
    }
    bucketChecked = true;
  } catch (err) {
    console.warn('⚠️ [Voice Cache] Aviso ao verificar bucket audio_cache:', err.message);
  }
}

function setMemoryAudio(cacheKey, entry) {
  if (memoryAudioCache.has(cacheKey)) {
    memoryAudioCache.delete(cacheKey);
  } else if (memoryAudioCache.size >= MAX_MEMORY_CACHE_ITEMS) {
    const oldestKey = memoryAudioCache.keys().next().value;
    if (oldestKey) memoryAudioCache.delete(oldestKey);
  }
  memoryAudioCache.set(cacheKey, { ...entry, createdAt: Date.now() });
}

/**
 * Remove formatações Markdown, emojis, URLs e caracteres que quebram o fluxo da fala.
 * Preserva reticências (...), vírgulas e pontos finais para pausas respiratórias naturais.
 */
export function cleanTextForSpeech(text) {
  if (!text) return '';

  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`.*?`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_#~>]/g, '')
    .replace(/^\s*[-•*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    .replace(/\r\n/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\.{3,}/g, '... ')
    .trim();
}

/**
 * Divide textos longos em blocos progressivos (idêntico ao frontend) para início de reprodução rápido.
 * - Bloco 1: até ~170 caracteres (1-2 frases iniciais -> sintetiza em ~2s ou já vem pré-aquecido)
 * - Demais blocos: até ~320 caracteres
 */
export function splitTextIntoFastSpeechSegments(rawText) {
  const clean = cleanTextForSpeech(rawText);
  if (!clean) return [];
  if (clean.length <= 200) return [clean];

  const rawSentences = clean.match(/[^.!?]+(?:[.!?]+|$)/g) || [clean];
  const sentences = rawSentences.map((s) => s.trim()).filter(Boolean);
  if (sentences.length <= 1) return [clean];

  const segments = [];
  let current = '';

  for (const sentence of sentences) {
    const maxLen = segments.length === 0 ? 170 : 320;
    if (!current) {
      current = sentence;
    } else if ((current + ' ' + sentence).length <= maxLen) {
      current += ' ' + sentence;
    } else {
      segments.push(current);
      current = sentence;
    }
  }
  if (current) segments.push(current);

  return segments;
}

/**
 * Converte PCM Linear 24kHz 16-bit Mono para formato WAV padrão com cabeçalho RIFF de 44 bytes.
 */
export function pcmToWav(pcmBuffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const wavHeader = Buffer.alloc(44);

  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([wavHeader, pcmBuffer]);
}

/**
 * Síntese de Voz Nativa com Modelos Oficiais Gemini TTS
 */
export async function generateGeminiAudio(text, requestedVoice = 'Aoede') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não está configurada');
  }

  const voiceName = normalizeGeminiVoiceId(requestedVoice);
  const ttsModels = ['gemini-2.5-flash-preview-tts', 'gemini-2.5-flash-tts'];
  let lastError;

  for (const model of ttsModels) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 18_000);
      console.log(`🎙️ [Gemini TTS] Sintetizando com ${model} (Voz: ${voiceName}, ${text.length} chars)...`);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName,
                  },
                },
              },
            },
          }),
        }
      ).finally(() => clearTimeout(timeout));

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini TTS API status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const pcmBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!pcmBase64) {
        throw new Error('Resposta do Gemini TTS não continha áudio inline');
      }

      const wavBuffer = await pcmBase64ToWavOffThread(pcmBase64, 24000, pcmToWav);
      console.log(`✅ [Gemini TTS] Áudio pronto via Worker Thread (${wavBuffer.length} bytes, Voz: ${voiceName})`);

      return {
        buffer: wavBuffer,
        contentType: 'audio/wav',
        ext: 'wav',
        voiceName,
      };
    } catch (err) {
      console.warn(`⚠️ [Gemini TTS Fallback] Tentativa com ${model} falhou:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Falha ao sintetizar áudio com Gemini TTS');
}

async function generateElevenLabsAudio(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.85,
        style: 0.15,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs Error (${response.status}): ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: 'audio/mpeg',
    ext: 'mp3',
    voiceName: 'ElevenLabs',
  };
}

async function generateOpenAIAudio(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  const voice = process.env.OPENAI_VOICE || 'onyx';

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice,
      input: text,
      speed: 0.94,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI TTS Error (${response.status}): ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: 'audio/mpeg',
    ext: 'mp3',
    voiceName: `OpenAI-${voice}`,
  };
}

async function generateFallbackAudio(text) {
  console.log('🎙️ [Neural Speech Fallback] Gerando áudio via Google TTS Fallback...');
  const googleTTS = await import('google-tts-api');
  const chunks = await googleTTS.getAllAudioBase64(text, {
    lang: 'pt',
    slow: false,
    timeout: 10000,
    splitPunct: '.,!?:;...',
  });
  const buffers = chunks.map((c) => Buffer.from(c.base64, 'base64'));
  return {
    buffer: Buffer.concat(buffers),
    contentType: 'audio/mpeg',
    ext: 'mp3',
    voiceName: 'GoogleTTS-Fallback',
  };
}

/**
 * Sintetiza ou resgata do cache (RAM -> Supabase Storage -> Síntese Coalescida)
 */
export async function synthesizeOrGetCachedVoice(rawText, requestedVoice, { isPreview = false } = {}) {
  const cleanText = cleanTextForSpeech(rawText);
  if (!cleanText) {
    throw new Error('Texto não possui caracteres válidos para leitura.');
  }

  const edsonConfig = await getEdsonGlobalVoiceConfig();
  // Usa SEMPRE a voz oficial do Edson em todos os casos, exceto quando o próprio Admin está testando uma voz candidata no preview
  const effectiveVoice = isPreview && requestedVoice
    ? normalizeGeminiVoiceId(requestedVoice)
    : edsonConfig.geminiVoice;

  const normalizedVoice = effectiveVoice.toLowerCase().replace(/[^a-z0-9]/g, '');
  const textHash = crypto
    .createHash('sha256')
    .update(`${normalizedVoice}_${cleanText}`)
    .digest('hex')
    .slice(0, 24);
  const cacheKey = `${normalizedVoice}_${textHash}`;

  // 1. TIER 1: Cache instantâneo em memória RAM (< 5ms)
  const memHit = memoryAudioCache.get(cacheKey);
  if (memHit) {
    return {
      audioBase64: memHit.base64,
      mimeType: memHit.mimeType,
      fromCache: true,
      cleanedText: cleanText,
      voiceName: memHit.voiceName,
    };
  }

  // 2. Coalescência de requisições simultâneas (evita chamadas duplicadas ao Gemini TTS)
  if (inFlightSynthesis.has(cacheKey)) {
    return inFlightSynthesis.get(cacheKey);
  }

  const jobPromise = (async () => {
    await ensureAudioCacheBucket();

    // 3. TIER 2: Cache persistente no Supabase Storage (download direto pelo backend)
    for (const candidateExt of ['wav', 'mp3']) {
      const candidateFile = `voice_${normalizedVoice}_${textHash}.${candidateExt}`;
      try {
        const { data: blobData, error: dlErr } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .download(candidateFile);

        if (!dlErr && blobData) {
          const arrayBuf = await blobData.arrayBuffer();
          const buf = Buffer.from(arrayBuf);
          if (buf.length > 100) {
            const mimeType = candidateExt === 'mp3' ? 'audio/mpeg' : 'audio/wav';
            const base64 = buf.toString('base64');
            setMemoryAudio(cacheKey, {
              base64,
              mimeType,
              ext: candidateExt,
              voiceName: effectiveVoice,
            });
            console.log(`⚡ [Voice Storage Hit] Carregado de audio_cache: ${candidateFile}`);
            return {
              audioBase64: base64,
              mimeType,
              fromCache: true,
              cleanedText: cleanText,
              voiceName: effectiveVoice,
            };
          }
        }
      } catch {}
    }

    // 4. TIER 3: Síntese Neural (Gemini TTS -> ElevenLabs -> OpenAI -> GoogleTTS)
    let audioResult = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        audioResult = await generateGeminiAudio(cleanText, effectiveVoice);
      } catch (geminiErr) {
        console.warn('⚠️ Falha no Gemini TTS, tentando provedor alternativo:', geminiErr.message);
      }
    }

    if (!audioResult && process.env.ELEVENLABS_API_KEY) {
      try {
        audioResult = await generateElevenLabsAudio(cleanText);
      } catch (e11Err) {
        console.warn('⚠️ Falha no ElevenLabs, tentando OpenAI:', e11Err.message);
      }
    }

    if (!audioResult && process.env.OPENAI_API_KEY) {
      try {
        audioResult = await generateOpenAIAudio(cleanText);
      } catch (oaiErr) {
        console.warn('⚠️ Falha no OpenAI TTS, tentando fallback:', oaiErr.message);
      }
    }

    if (!audioResult) {
      audioResult = await generateFallbackAudio(cleanText);
    }

    const base64 = audioResult.buffer.toString('base64');
    const mimeType = audioResult.contentType || 'audio/wav';
    const ext = audioResult.ext || 'wav';
    const actualFileName = `voice_${normalizedVoice}_${textHash}.${ext}`;

    setMemoryAudio(cacheKey, {
      base64,
      mimeType,
      ext,
      voiceName: audioResult.voiceName || effectiveVoice,
    });

    // Salva em background no Supabase Storage (não bloqueia a resposta para o usuário!)
    supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(actualFileName, audioResult.buffer, {
        contentType: mimeType,
        upsert: true,
      })
      .then(({ error }) => {
        if (error) {
          console.warn('⚠️ Aviso ao persistir áudio em audio_cache:', error.message);
        } else {
          console.log(`💾 [Voice Cache Saved] ${actualFileName}`);
        }
      })
      .catch(() => {});

    return {
      audioBase64: base64,
      mimeType,
      fromCache: false,
      cleanedText: cleanText,
      voiceName: audioResult.voiceName || effectiveVoice,
    };
  })();

  inFlightSynthesis.set(cacheKey, jobPromise);
  try {
    return await jobPromise;
  } finally {
    inFlightSynthesis.delete(cacheKey);
  }
}

/**
 * Pré-aquece silenciosamente o primeiro segmento da resposta recém-gerada no chat
 * para que, ao clicar em "Ouvir", o áudio comece quase instantaneamente.
 */
export async function prewarmReplyFirstSegment(replyText) {
  try {
    const edsonConfig = await getEdsonGlobalVoiceConfig();
    if (edsonConfig.preferBrowser || edsonConfig.voiceEngine === 'browser') return;

    const segments = splitTextIntoFastSpeechSegments(replyText);
    if (segments.length === 0) return;

    await synthesizeOrGetCachedVoice(segments[0], edsonConfig.geminiVoice, { isPreview: false });
  } catch (err) {
    console.warn('⚠️ [Voice Prewarm] Aviso silencioso no pré-aquecimento:', err.message);
  }
}

/**
 * Pré-aquece o áudio de demonstração da voz oficial do Edson ao iniciar o servidor
 */
export async function prewarmDemoVoice() {
  try {
    const edsonConfig = await getEdsonGlobalVoiceConfig();
    if (edsonConfig.preferBrowser || edsonConfig.voiceEngine === 'browser') return;
    const guide = edsonConfig.guideName || 'Isaac';
    const demoSentence = `Olá! Sou a voz do seu mentor ${guide}. Estou aqui para acolher suas reflexões com serenidade e clareza. Como você se sente hoje?`;
    await synthesizeOrGetCachedVoice(demoSentence, edsonConfig.geminiVoice, { isPreview: true });
  } catch (err) {
    console.warn('⚠️ [Demo Prewarm] Aviso ao pré-aquecer demonstração:', err.message);
  }
}

/**
 * Controller Principal: POST /api/voice
 */
export async function handleGenerateVoice(req, res) {
  try {
    const { text, voiceName, isPreview = false } = req.body || {};

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'O texto para sintetização de voz é obrigatório.' });
    }
    if (text.length > 4000) {
      return res.status(400).json({ error: 'O trecho para síntese de voz excede o limite de 4.000 caracteres.' });
    }

    const result = await synthesizeOrGetCachedVoice(text, voiceName, { isPreview: Boolean(isPreview) });

    res.status(200).json({
      audioBase64: result.audioBase64,
      mimeType: result.mimeType,
      audioUrl: `data:${result.mimeType};base64,${result.audioBase64}`,
      fromCache: result.fromCache,
      cleanedText: result.cleanedText,
      voiceName: result.voiceName,
    });
  } catch (error) {
    console.error('❌ [Voice Error]:', error);
    res.status(500).json({
      error: 'Erro ao gerar voz humanizada da reflexão.',
      details: error.message,
    });
  }
}

/**
 * Extrai metadados e o payload PCM bruto de um buffer WAV RIFF padrão.
 */
function extractWavPcmPayload(wavBuf) {
  if (!Buffer.isBuffer(wavBuf) || wavBuf.length < 44) {
    return { sampleRate: 24000, numChannels: 1, bitsPerSample: 16, pcm: wavBuf };
  }
  const riff = wavBuf.toString('ascii', 0, 4);
  const wave = wavBuf.toString('ascii', 8, 12);
  if (riff !== 'RIFF' || wave !== 'WAVE') {
    return { sampleRate: 24000, numChannels: 1, bitsPerSample: 16, pcm: wavBuf };
  }

  let sampleRate = 24000;
  let numChannels = 1;
  let bitsPerSample = 16;
  let offset = 12;

  while (offset + 8 <= wavBuf.length) {
    const chunkId = wavBuf.toString('ascii', offset, offset + 4);
    const chunkSize = wavBuf.readUInt32LE(offset + 4);
    const dataStart = offset + 8;

    if (chunkId === 'fmt ' && dataStart + 16 <= wavBuf.length) {
      numChannels = wavBuf.readUInt16LE(dataStart + 2) || 1;
      sampleRate = wavBuf.readUInt32LE(dataStart + 4) || 24000;
      bitsPerSample = wavBuf.readUInt16LE(dataStart + 14) || 16;
    } else if (chunkId === 'data') {
      const safeEnd = Math.min(wavBuf.length, dataStart + chunkSize);
      return {
        sampleRate,
        numChannels,
        bitsPerSample,
        pcm: wavBuf.subarray(dataStart, safeEnd),
      };
    }

    offset = dataStart + chunkSize + (chunkSize % 2);
  }

  return {
    sampleRate,
    numChannels,
    bitsPerSample,
    pcm: wavBuf.subarray(44),
  };
}

/**
 * Converte buffer de áudio (WAV ou MP3 concatenado) para MP3 96kbps Mono via FFmpeg
 * (formato ideal para encaminhamento e reprodução nativa em bolha no WhatsApp).
 * Caso FFmpeg não esteja instalado no ambiente local, retorna o buffer original com segurança.
 */
function transcodeBufferToMp3(inputBuffer, inputFormat = 'wav') {
  return new Promise((resolve) => {
    let settled = false;
    const fallback = () => {
      if (settled) return;
      settled = true;
      resolve({
        buffer: inputBuffer,
        mimeType: inputFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav',
        ext: inputFormat === 'mp3' ? 'mp3' : 'wav',
      });
    };

    let ff;
    try {
      ff = spawn('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-f',
        inputFormat,
        '-i',
        'pipe:0',
        '-vn',
        '-ar',
        '24000',
        '-ac',
        '1',
        '-codec:a',
        'libmp3lame',
        '-b:a',
        '96k',
        '-f',
        'mp3',
        'pipe:1',
      ]);
    } catch {
      return fallback();
    }

    const outChunks = [];
    const safetyTimer = setTimeout(() => {
      try {
        ff.kill('SIGKILL');
      } catch {}
      fallback();
    }, 30_000);

    ff.stdout.on('data', (chunk) => outChunks.push(chunk));
    ff.on('error', () => {
      clearTimeout(safetyTimer);
      fallback();
    });
    ff.on('close', (code) => {
      clearTimeout(safetyTimer);
      if (settled) return;
      const outBuf = Buffer.concat(outChunks);
      if (code === 0 && outBuf.length > 256) {
        settled = true;
        resolve({
          buffer: outBuf,
          mimeType: 'audio/mpeg',
          ext: 'mp3',
        });
      } else {
        fallback();
      }
    });

    ff.stdin.on('error', () => {});
    ff.stdin.end(inputBuffer);
  });
}

/**
 * Gera (ou recupera do cache) o arquivo de áudio completo e contínuo de uma reflexão
 * pronto para download e compartilhamento via WhatsApp (.mp3).
 * POST /api/voice/download
 */
export async function handleDownloadVoice(req, res) {
  try {
    const { text, voiceName } = req.body || {};

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'O texto para download do áudio é obrigatório.' });
    }
    if (text.length > 16000) {
      return res.status(400).json({ error: 'O texto excede o limite máximo de 16.000 caracteres para exportação em áudio.' });
    }

    const cleanFull = cleanTextForSpeech(text);
    if (!cleanFull) {
      return res.status(400).json({ error: 'O texto não possui conteúdo falável para gerar áudio.' });
    }

    const edsonConfig = await getEdsonGlobalVoiceConfig();
    const effectiveVoice = edsonConfig.geminiVoice || normalizeGeminiVoiceId(voiceName || 'Aoede');
    const normalizedVoice = effectiveVoice.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fullHash = crypto
      .createHash('sha256')
      .update(`full_dl_v1_${normalizedVoice}_${cleanFull}`)
      .digest('hex')
      .slice(0, 24);
    const fullCacheKey = `full_${normalizedVoice}_${fullHash}`;
    const storageFileName = `voice_full_${normalizedVoice}_${fullHash}.mp3`;

    // 1. Cache rápido em RAM
    const memHit = memoryAudioCache.get(fullCacheKey);
    if (memHit) {
      const buf = Buffer.from(memHit.base64, 'base64');
      const ext = memHit.ext || (memHit.mimeType === 'audio/mpeg' ? 'mp3' : 'wav');
      res.setHeader('Content-Type', memHit.mimeType);
      res.setHeader('Content-Length', String(buf.length));
      res.setHeader('Content-Disposition', `attachment; filename="mentoria-isaac-reflexao.${ext}"`);
      return res.status(200).send(buf);
    }

    await ensureAudioCacheBucket();

    // 2. Cache persistente no Supabase Storage
    try {
      const { data: blobData, error: dlErr } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .download(storageFileName);
      if (!dlErr && blobData) {
        const arrBuf = await blobData.arrayBuffer();
        const storedBuf = Buffer.from(arrBuf);
        if (storedBuf.length > 256) {
          setMemoryAudio(fullCacheKey, {
            base64: storedBuf.toString('base64'),
            mimeType: 'audio/mpeg',
            ext: 'mp3',
            voiceName: effectiveVoice,
          });
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Content-Length', String(storedBuf.length));
          res.setHeader('Content-Disposition', 'attachment; filename="mentoria-isaac-reflexao.mp3"');
          return res.status(200).send(storedBuf);
        }
      }
    } catch {}

    // 3. Sintetiza/reaproveita os segmentos idênticos ao botão "Ouvir Reflexão" (concorrência controlada = 2)
    const segments = splitTextIntoFastSpeechSegments(text);
    if (segments.length === 0) {
      return res.status(400).json({ error: 'Não foi possível segmentar o texto para áudio.' });
    }

    const segResults = new Array(segments.length);
    let cursor = 0;
    const workerCount = Math.min(2, segments.length);
    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (cursor < segments.length) {
          const idx = cursor++;
          segResults[idx] = await synthesizeOrGetCachedVoice(segments[idx], effectiveVoice, {
            isPreview: false,
          });
        }
      })
    );

    const allMp3 = segResults.every((r) => r.mimeType === 'audio/mpeg');
    let stitchedBuffer;
    let stitchedFormat;

    if (allMp3) {
      stitchedBuffer = Buffer.concat(segResults.map((r) => Buffer.from(r.audioBase64, 'base64')));
      stitchedFormat = 'mp3';
    } else {
      const pcmParts = [];
      let sampleRate = 24000;
      let numChannels = 1;
      let bitsPerSample = 16;

      segResults.forEach((r, idx) => {
        const rawBuf = Buffer.from(r.audioBase64, 'base64');
        const parsed = extractWavPcmPayload(rawBuf);
        if (idx === 0) {
          sampleRate = parsed.sampleRate;
          numChannels = parsed.numChannels;
          bitsPerSample = parsed.bitsPerSample;
        }
        pcmParts.push(parsed.pcm);
        if (idx < segResults.length - 1) {
          const blockAlign = Math.max(2, (numChannels * bitsPerSample) / 8);
          const pauseBytes =
            Math.floor((sampleRate * blockAlign * 0.16) / blockAlign) * blockAlign;
          pcmParts.push(Buffer.alloc(pauseBytes));
        }
      });

      stitchedBuffer = pcmToWav(Buffer.concat(pcmParts), sampleRate, numChannels, bitsPerSample);
      stitchedFormat = 'wav';
    }

    const transcoded = await transcodeBufferToMp3(stitchedBuffer, stitchedFormat);

    setMemoryAudio(fullCacheKey, {
      base64: transcoded.buffer.toString('base64'),
      mimeType: transcoded.mimeType,
      ext: transcoded.ext,
      voiceName: effectiveVoice,
    });

    if (transcoded.ext === 'mp3') {
      supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(storageFileName, transcoded.buffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        })
        .catch(() => {});
    }

    res.setHeader('Content-Type', transcoded.mimeType);
    res.setHeader('Content-Length', String(transcoded.buffer.length));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="mentoria-isaac-reflexao.${transcoded.ext}"`
    );
    return res.status(200).send(transcoded.buffer);
  } catch (error) {
    console.error('❌ [Voice Download Error]:', error);
    return res.status(500).json({
      error: 'Não foi possível preparar o arquivo de áudio para download.',
      details: error.message,
    });
  }
}
