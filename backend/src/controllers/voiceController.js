import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Remove formatações Markdown, emojis, URLs e caracteres que quebram o fluxo da fala.
 * Preserva reticências (...), vírgulas e pontos finais para pausas respiratórias naturais.
 * @param {string} text Texto bruto gerado pelo Gemini
 * @returns {string} Texto limpo otimizado para fala
 */
export function cleanTextForSpeech(text) {
  if (!text) return '';

  return text
    // Remove blocos de código
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`.*?`/g, '')
    // Remove links [texto](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove URLs soltas
    .replace(/https?:\/\/\S+/g, '')
    // Remove asteriscos e sublinhados de negrito/itálico (*, **, _, __)
    .replace(/[*_#~>]/g, '')
    // Remove marcadores de lista numerada ou bullet points no início da linha
    .replace(/^\s*[-•*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove emojis e símbolos visuais complexos
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    // Normaliza quebras de linha e espaços múltiplos
    .replace(/\r\n/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    // Garante que reticências tenham pequeno espaçamento para a pausa da API
    .replace(/\.{3,}/g, '... ')
    .trim();
}

/**
 * Converte PCM Linear 24kHz 16-bit Mono para formato WAV padrão com cabeçalho RIFF de 44 bytes.
 * Torna o áudio universalmente reproduzível em qualquer navegador, iOS Safari e Android.
 */
export function pcmToWav(pcmBuffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const wavHeader = Buffer.alloc(44);

  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16); // subchunk1 size (16 para PCM)
  wavHeader.writeUInt16LE(1, 20); // formato de áudio 1 = PCM
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
 * Utiliza as vozes neurais expressivas:
 * - Charon: Tom masculino profundo, maduro e reflexivo (Padrão ISAAC)
 * - Aoede: Tom feminino calmo, sereno e acolhedor
 * - Kore: Tom firme e confortante
 * - Puck: Tom vibrante e expressivo
 */
export async function generateGeminiAudio(text, requestedVoice = 'Charon') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não está configurada');
  }

  // Normaliza o nome da voz
  let voiceName = 'Charon';
  const vLower = (requestedVoice || '').toLowerCase();
  if (vLower.includes('aoede') || vLower === 'female' || vLower === 'feminino') {
    voiceName = 'Aoede';
  } else if (vLower.includes('kore')) {
    voiceName = 'Kore';
  } else if (vLower.includes('puck')) {
    voiceName = 'Puck';
  } else if (vLower.includes('fenrir')) {
    voiceName = 'Fenrir';
  } else {
    voiceName = 'Charon';
  }

  const ttsModels = ['gemini-2.5-flash-preview-tts', 'gemini-3.1-flash-tts-preview'];
  let lastError;

  for (const model of ttsModels) {
    try {
      console.log(`🎙️ [Gemini TTS] Sintetizando áudio nativo com ${model} (Voz: ${voiceName})...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini TTS API status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const pcmBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!pcmBase64) {
        throw new Error('Resposta do Gemini TTS não continha áudio inline');
      }

      const pcmBuffer = Buffer.from(pcmBase64, 'base64');
      const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
      console.log(`✅ [Gemini TTS] Áudio gerado com sucesso (${wavBuffer.length} bytes, Voz: ${voiceName})`);

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

/**
 * Síntese de voz via ElevenLabs API (Opcional)
 */
async function generateElevenLabsAudio(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

  console.log(`🎙️ [ElevenLabs TTS] Sintetizando fala humana (Voz: ${voiceId})...`);

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
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

/**
 * Síntese de voz via OpenAI TTS API (Opcional)
 */
async function generateOpenAIAudio(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  const voice = process.env.OPENAI_VOICE || 'onyx';

  console.log(`🎙️ [OpenAI TTS] Sintetizando fala humana (Voz: ${voice})...`);

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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

/**
 * Fallback Natural de Áudio (Neural Speech) sem custos
 */
async function generateFallbackAudio(text) {
  console.log('🎙️ [Neural Speech Fallback] Gerando áudio via Google TTS Fallback...');
  const googleTTS = await import('google-tts-api');
  const chunks = await googleTTS.getAllAudioBase64(text, {
    lang: 'pt',
    slow: false,
    timeout: 10000,
    splitPunct: '.,!?:;...',
  });
  const buffers = chunks.map(c => Buffer.from(c.base64, 'base64'));
  return {
    buffer: Buffer.concat(buffers),
    contentType: 'audio/mpeg',
    ext: 'mp3',
    voiceName: 'GoogleTTS-Fallback',
  };
}

/**
 * Controller Principal: POST /api/voice
 * 1. Limpa o texto
 * 2. Verifica se o áudio já existe em cache no Supabase Storage ('audio_cache')
 * 3. Se existir, retorna imediatamente
 * 4. Se não, sintetiza via Gemini TTS (Charon / Aoede) -> ElevenLabs -> OpenAI -> Fallback
 * 5. Salva no Supabase Storage e retorna a URL pública
 */
export async function handleGenerateVoice(req, res) {
  try {
    const { text, messageId, voiceName = 'Charon' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'O texto para sintetização de voz é obrigatório.' });
    }

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) {
      return res.status(400).json({ error: 'Texto não possui caracteres válidos para leitura.' });
    }

    // Normaliza nome da voz para cache consistente
    const normalizedVoice = (voiceName || 'Charon').toLowerCase().replace(/[^a-z0-9]/g, '');

    // Gera hash único do conteúdo do áudio e da voz para cache
    const textHash = crypto.createHash('sha256').update(`${normalizedVoice}_${cleanText}`).digest('hex').slice(0, 24);
    const fileName = `voice_${normalizedVoice}_${textHash}.wav`;
    const bucketName = 'audio_cache';

    // 1. VERIFICA SE JÁ EXISTE NO CACHE DO SUPABASE STORAGE
    try {
      const { data: existingFiles } = await supabaseAdmin.storage
        .from(bucketName)
        .list('', { search: fileName });

      if (existingFiles && existingFiles.length > 0) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        console.log(`⚡ [Voice Cache Hit] Áudio resgatado do cache do Supabase: ${fileName}`);
        return res.status(200).json({
          audioUrl: publicUrlData.publicUrl,
          fromCache: true,
          cleanedText: cleanText,
          voiceName,
        });
      }
    } catch (storageCheckErr) {
      console.warn('⚠️ Aviso ao consultar cache no Supabase Storage:', storageCheckErr.message);
    }

    // 2. SINTETIZAÇÃO DO ÁUDIO (GEMINI TTS -> ELEVENLABS -> OPENAI -> FALLBACK)
    let audioResult;

    // Prioridade 1: Voz Nativa do Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        audioResult = await generateGeminiAudio(cleanText, voiceName);
      } catch (geminiErr) {
        console.warn('⚠️ Falha no Gemini TTS, tentando provedor alternativo:', geminiErr.message);
      }
    }

    // Prioridade 2: ElevenLabs (se configurado)
    if (!audioResult && process.env.ELEVENLABS_API_KEY) {
      try {
        audioResult = await generateElevenLabsAudio(cleanText);
      } catch (e11Err) {
        console.warn('⚠️ Falha no ElevenLabs, tentando OpenAI:', e11Err.message);
      }
    }

    // Prioridade 3: OpenAI (se configurado)
    if (!audioResult && process.env.OPENAI_API_KEY) {
      try {
        audioResult = await generateOpenAIAudio(cleanText);
      } catch (oaiErr) {
        console.warn('⚠️ Falha no OpenAI TTS, tentando fallback:', oaiErr.message);
      }
    }

    // Prioridade 4: Fallback Google TTS
    if (!audioResult) {
      audioResult = await generateFallbackAudio(cleanText);
    }

    const actualFileName = `voice_${normalizedVoice}_${textHash}.${audioResult.ext || 'wav'}`;

    // 3. PERSISTÊNCIA NO SUPABASE STORAGE (CACHE PERMANENTE)
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(actualFileName, audioResult.buffer, {
        contentType: audioResult.contentType || 'audio/wav',
        upsert: true,
      });

    if (uploadError) {
      console.warn('⚠️ Não foi possível salvar áudio no cache do Supabase:', uploadError.message);
    } else {
      console.log(`💾 [Voice Cache Saved] Áudio armazenado no bucket audio_cache: ${actualFileName}`);
    }

    // 4. RETORNA A URL PÚBLICA DO ÁUDIO
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(actualFileName);

    res.status(200).json({
      audioUrl: publicUrlData.publicUrl,
      fromCache: false,
      cleanedText: cleanText,
      voiceName: audioResult.voiceName,
    });
  } catch (error) {
    console.error('❌ [Voice Error]:', error);
    res.status(500).json({
      error: 'Erro ao gerar voz humanizada da reflexão.',
      details: error.message,
    });
  }
}
