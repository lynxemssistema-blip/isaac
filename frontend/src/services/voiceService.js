/**
 * Serviço Unificado de Voz Neural Gemini & Síntese Humanizada (Padrão Mestre Edson Manoel)
 * - Sincroniza os parâmetros oficiais de voz/áudio do usuário Edson para todos os casos
 * - Reprodução progressiva em blocos rápidos (1º segmento curto toca rápido enquanto os próximos carregam em paralelo)
 * - Desbloqueio síncrono de <audio> para iOS Safari / Android Chrome
 */

import { cleanTextForSpeech, fetchVoiceAudio } from './api';

export const GEMINI_VOICES = [
  { id: 'Aoede', name: 'Aoede (Mentora Acolhedora)', gender: 'female', description: 'Voz feminina suave, serena e confortante' },
  { id: 'Charon', name: 'Charon (Mentor Isaac)', gender: 'male', description: 'Voz masculina profunda, reflexiva e madura' },
  { id: 'Kore', name: 'Kore (Encorajadora)', gender: 'female', description: 'Voz feminina firme, clara e segura' },
  { id: 'Puck', name: 'Puck (Dinâmica)', gender: 'neutral', description: 'Voz expressiva, leve e conversacional' },
  { id: 'Fenrir', name: 'Fenrir (Firme)', gender: 'male', description: 'Voz masculina enérgica e determinada' },
];

// WAV silencioso mínimo de 46 bytes para destravar reprodução assíncrona no Safari iOS e Android
const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIAAAAAAA==';

export function normalizeGeminiVoiceId(rawVoice) {
  const v = String(rawVoice || '').trim().toLowerCase();
  if (!v) return 'Aoede';
  if (v.includes('aoede') || v === 'female' || v === 'feminino') return 'Aoede';
  if (v.includes('charon')) return 'Charon';
  if (v.includes('kore')) return 'Kore';
  if (v.includes('puck')) return 'Puck';
  if (v.includes('fenrir')) return 'Fenrir';
  return 'Aoede';
}

/**
 * Destrava o elemento HTMLAudioElement dentro do clique do usuário (obrigatório no iOS/Android antes de await)
 */
export function unlockHtmlAudioElement(audioEl) {
  if (!audioEl) return;
  try {
    if (!audioEl.__isaacUnlocked) {
      audioEl.src = SILENT_WAV_DATA_URI;
      const p = audioEl.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          audioEl.pause();
          audioEl.currentTime = 0;
          audioEl.__isaacUnlocked = true;
        }).catch(() => {});
      }
    }
  } catch {}
}

/**
 * Divide textos longos em blocos progressivos (100% idêntico ao algoritmo do backend)
 * para que a primeira frase comece a tocar em ~1.5s–2.5s (ou instantaneamente se pré-aquecida)
 * enquanto os blocos seguintes são baixados em paralelo.
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

class HumanVoiceService {
  constructor() {
    this.currentUtterance = null;
    this.isPlaying = false;
    this.currentSessionId = 0;
    this.activeNeuralRunId = 0;
    this.activeAudioEl = null;
  }

  isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  getAvailableVoices() {
    if (!this.isSupported()) return [];
    const allVoices = window.speechSynthesis.getVoices() || [];

    const ptVoices = allVoices.filter((v) => {
      const lang = (v.lang || '').toLowerCase().replace('_', '-');
      return lang.startsWith('pt');
    });

    const targetList = ptVoices.length > 0 ? ptVoices : allVoices;

    return targetList.map((v) => {
      const nameLower = v.name.toLowerCase();
      const isNatural =
        nameLower.includes('natural') ||
        nameLower.includes('online') ||
        nameLower.includes('neural') ||
        nameLower.includes('google') ||
        nameLower.includes('enhanced');

      let gender = 'neutral';
      if (
        nameLower.includes('daniel') ||
        nameLower.includes('antonio') ||
        nameLower.includes('felipe') ||
        nameLower.includes('male') ||
        nameLower.includes('homem')
      ) {
        gender = 'male';
      } else if (
        nameLower.includes('francisca') ||
        nameLower.includes('luciana') ||
        nameLower.includes('maria') ||
        nameLower.includes('leticia') ||
        nameLower.includes('heloisa') ||
        nameLower.includes('vitória') ||
        nameLower.includes('vitoria') ||
        nameLower.includes('female') ||
        nameLower.includes('mulher')
      ) {
        gender = 'female';
      }

      return {
        voiceURI: v.voiceURI,
        name: v.name,
        lang: v.lang,
        isDefault: v.default,
        isNatural,
        gender,
        rawVoice: v,
      };
    });
  }

  onVoicesChanged(callback) {
    if (!this.isSupported()) return () => {};

    const handler = () => {
      const voices = this.getAvailableVoices();
      callback(voices);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handler);
    const current = this.getAvailableVoices();
    if (current.length > 0) callback(current);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
    };
  }

  getSettings() {
    if (typeof window === 'undefined') {
      return {
        voiceEngine: 'gemini',
        geminiVoice: 'Aoede',
        voiceURI: '',
        gender: 'male',
        rate: 0.90,
        pitch: 0.95,
        preferBrowser: false,
      };
    }

    const rawGemini =
      localStorage.getItem('isaac_gemini_voice') ||
      localStorage.getItem('izaque_gemini_voice') ||
      'Aoede';

    return {
      voiceEngine: localStorage.getItem('isaac_voice_engine') || localStorage.getItem('izaque_voice_engine') || 'gemini',
      geminiVoice: normalizeGeminiVoiceId(rawGemini),
      voiceURI: localStorage.getItem('isaac_voice_uri') || localStorage.getItem('izaque_voice_uri') || '',
      gender: localStorage.getItem('isaac_voice_gender') || localStorage.getItem('izaque_voice_gender') || 'male',
      rate: parseFloat(localStorage.getItem('isaac_voice_rate') || localStorage.getItem('izaque_voice_rate') || '0.90'),
      pitch: parseFloat(localStorage.getItem('isaac_voice_pitch') || localStorage.getItem('izaque_voice_pitch') || '0.95'),
      preferBrowser: (localStorage.getItem('isaac_voice_prefer_browser') || localStorage.getItem('izaque_voice_prefer_browser')) === 'true',
    };
  }

  saveSettings({ voiceEngine, geminiVoice, voiceURI, gender, rate, pitch, preferBrowser }) {
    if (typeof window === 'undefined') return;

    if (voiceEngine !== undefined) {
      localStorage.setItem('isaac_voice_engine', voiceEngine);
      localStorage.setItem('izaque_voice_engine', voiceEngine);
    }
    if (geminiVoice !== undefined) {
      const cleanVoice = normalizeGeminiVoiceId(geminiVoice);
      localStorage.setItem('isaac_gemini_voice', cleanVoice);
      localStorage.setItem('izaque_gemini_voice', cleanVoice);
    }
    if (voiceURI !== undefined) {
      localStorage.setItem('isaac_voice_uri', voiceURI);
      localStorage.setItem('izaque_voice_uri', voiceURI);
    }
    if (gender !== undefined) {
      localStorage.setItem('isaac_voice_gender', gender);
      localStorage.setItem('izaque_voice_gender', gender);
    }
    if (rate !== undefined && !Number.isNaN(Number(rate))) {
      localStorage.setItem('isaac_voice_rate', Number(rate).toString());
      localStorage.setItem('izaque_voice_rate', Number(rate).toString());
    }
    if (pitch !== undefined && !Number.isNaN(Number(pitch))) {
      localStorage.setItem('isaac_voice_pitch', Number(pitch).toString());
      localStorage.setItem('izaque_voice_pitch', Number(pitch).toString());
    }
    if (preferBrowser !== undefined) {
      const val = preferBrowser ? 'true' : 'false';
      localStorage.setItem('isaac_voice_prefer_browser', val);
      localStorage.setItem('izaque_voice_prefer_browser', val);
    }

    window.dispatchEvent(new Event('storage'));
  }

  /**
   * Aplica os parâmetros globais herdados da conta do Edson Manoel em ambos os namespaces de storage
   */
  applySystemMasterSettings(sys) {
    if (!sys || typeof window === 'undefined') return;
    const engine = sys.default_voice_engine || 'gemini';
    const preferBrowser =
      sys.default_prefer_browser !== undefined
        ? Boolean(sys.default_prefer_browser)
        : engine === 'browser';

    this.saveSettings({
      voiceEngine: engine,
      geminiVoice: normalizeGeminiVoiceId(sys.default_gemini_voice || 'Aoede'),
      gender: sys.default_voice_gender || 'male',
      rate: sys.default_voice_rate !== undefined ? Number(sys.default_voice_rate) : 0.90,
      pitch: sys.default_voice_pitch !== undefined ? Number(sys.default_voice_pitch) : 0.95,
      voiceURI: sys.default_voice_uri ?? '',
      preferBrowser,
    });
  }

  resolveVoice(savedSettings = null) {
    if (!this.isSupported()) return null;

    const settings = savedSettings || this.getSettings();
    const rawVoices = window.speechSynthesis.getVoices() || [];
    if (rawVoices.length === 0) return null;

    if (settings.voiceURI) {
      const match = rawVoices.find(
        (v) => v.voiceURI === settings.voiceURI || v.name === settings.voiceURI
      );
      if (match) return match;
    }

    const ptVoices = rawVoices.filter((v) => {
      const l = (v.lang || '').toLowerCase().replace('_', '-');
      return l.startsWith('pt');
    });
    const pool = ptVoices.length > 0 ? ptVoices : rawVoices;

    if (settings.gender === 'male') {
      const male = pool.find((v) => {
        const n = v.name.toLowerCase();
        return n.includes('daniel') || n.includes('antonio') || n.includes('felipe') || n.includes('male');
      });
      if (male) return male;
    } else if (settings.gender === 'female') {
      const female = pool.find((v) => {
        const n = v.name.toLowerCase();
        return (
          n.includes('francisca') ||
          n.includes('luciana') ||
          n.includes('maria') ||
          n.includes('leticia') ||
          n.includes('heloisa') ||
          n.includes('female')
        );
      });
      if (female) return female;
    }

    const natural = pool.find((v) => {
      const n = v.name.toLowerCase();
      return (
        n.includes('natural') ||
        n.includes('online') ||
        n.includes('neural') ||
        n.includes('google') ||
        n.includes('enhanced')
      );
    });
    if (natural) return natural;

    const brDefault = pool.find((v) => v.lang === 'pt-BR' || v.lang === 'pt_BR');
    return brDefault || pool[0];
  }

  splitIntoSentences(text) {
    if (!text) return [];
    const clean = cleanTextForSpeech(text);
    if (!clean) return [];
    const rawMatches = clean.match(/[^.!?:\n]+[.!?:\n]+|[^.!?:\n]+$/g);
    if (!rawMatches) return [clean];
    return rawMatches
      .map((s) => s.replace(/[\n\r]+/g, ' ').trim())
      .filter((s) => s.length > 1);
  }

  async speak(text, { onStart, onEnd, onError, customSettings } = {}) {
    if (!this.isSupported()) {
      onError?.(new Error('Síntese de voz não suportada neste navegador.'));
      return;
    }

    this.stop();
    const currentSession = ++this.currentSessionId;

    const sentences = this.splitIntoSentences(text);
    if (sentences.length === 0) {
      onEnd?.();
      return;
    }

    const settings = customSettings || this.getSettings();
    const voice = this.resolveVoice(settings);

    this.isPlaying = true;
    let sentenceIndex = 0;

    const speakNext = () => {
      if (this.currentSessionId !== currentSession || !this.isPlaying || sentenceIndex >= sentences.length) {
        if (this.currentSessionId === currentSession) {
          this.isPlaying = false;
          onEnd?.();
        }
        return;
      }

      const sentence = sentences[sentenceIndex];
      sentenceIndex++;

      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = voice?.lang || 'pt-BR';
      if (voice) utterance.voice = voice;

      utterance.rate = Math.max(0.70, Math.min(1.25, settings.rate || 0.90));
      utterance.pitch = Math.max(0.75, Math.min(1.25, settings.pitch || 0.95));

      utterance.onstart = () => {
        if (this.currentSessionId !== currentSession) return;
        if (sentenceIndex === 1) {
          onStart?.();
        }
      };

      utterance.onend = () => {
        if (this.currentSessionId !== currentSession) return;
        setTimeout(() => {
          if (this.currentSessionId === currentSession) {
            speakNext();
          }
        }, 70);
      };

      utterance.onerror = (e) => {
        if (this.currentSessionId !== currentSession) return;
        if (e.error === 'canceled' || e.error === 'interrupted') {
          return;
        }
        speakNext();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    };

    setTimeout(() => {
      if (this.currentSessionId === currentSession) {
        speakNext();
      }
    }, 50);
  }

  /**
   * Pré-aquece silenciosamente o 1º segmento de uma mensagem em RAM/Backend
   */
  prewarmFirstSegment(text) {
    const settings = this.getSettings();
    if (settings.preferBrowser || settings.voiceEngine === 'browser') return;
    const segments = splitTextIntoFastSpeechSegments(text);
    if (segments.length === 0) return;
    fetchVoiceAudio({
      text: segments[0],
      voiceName: settings.geminiVoice,
      isPreview: false,
    }).catch(() => {});
  }

  /**
   * Reproduz áudio neural Gemini em fila progressiva ultra-rápida (ou Web Speech se configurado pelo Edson):
   * - Baixa o Segmento 1 curto e inicia o som imediatamente
   * - Faz prefetch paralelo dos Segmentos 2..N enquanto o usuário já está ouvindo
   */
  async playSmartAudio(
    text,
    {
      audioElement,
      voiceNameOverride,
      engineOverride,
      customBrowserSettings,
      isPreview = false,
      onStart,
      onEnd,
      onError,
    } = {}
  ) {
    this.stop();
    const runId = ++this.activeNeuralRunId;

    const saved = this.getSettings();
    const engine = engineOverride || saved.voiceEngine || 'gemini';
    const useBrowser = engine === 'browser' || (!engineOverride && saved.preferBrowser);

    if (useBrowser) {
      return this.speak(text, {
        customSettings: customBrowserSettings || saved,
        onStart,
        onEnd,
        onError,
      });
    }

    const targetVoice = normalizeGeminiVoiceId(voiceNameOverride || saved.geminiVoice || 'Aoede');
    const audio = audioElement || new Audio();
    this.activeAudioEl = audio;
    unlockHtmlAudioElement(audio);

    const segments = isPreview
      ? [cleanTextForSpeech(text)].filter(Boolean)
      : splitTextIntoFastSpeechSegments(text);

    if (segments.length === 0) {
      onEnd?.();
      return;
    }

    // Dispara busca do 1º segmento imediatamente; os demais serão pré-carregados assim que o 1º iniciar!
    const segmentPromises = new Array(segments.length);
    segmentPromises[0] = fetchVoiceAudio({
      text: segments[0],
      voiceName: targetVoice,
      isPreview,
    });

    try {
      const firstRes = await segmentPromises[0];
      if (this.activeNeuralRunId !== runId) return;

      if (!firstRes?.audioUrl || firstRes.useSpeechSynthesis) {
        return this.speak(text, {
          customSettings: customBrowserSettings || saved,
          onStart,
          onEnd,
          onError,
        });
      }

      // Dispara prefetch em paralelo dos segmentos restantes (até 2 simultâneos em sequência rápida)
      if (segments.length > 1) {
        (async () => {
          for (let i = 1; i < segments.length; i++) {
            if (this.activeNeuralRunId !== runId) break;
            segmentPromises[i] = fetchVoiceAudio({
              text: segments[i],
              voiceName: targetVoice,
              isPreview,
            }).catch(() => null);
            await segmentPromises[i];
          }
        })();
      }

      let started = false;
      for (let idx = 0; idx < segments.length; idx++) {
        if (this.activeNeuralRunId !== runId) return;

        const segPromise =
          segmentPromises[idx] ||
          fetchVoiceAudio({
            text: segments[idx],
            voiceName: targetVoice,
            isPreview,
          }).catch(() => null);

        const segRes = await segPromise;
        if (this.activeNeuralRunId !== runId) return;

        if (!segRes?.audioUrl) {
          // Se um segmento intermediário falhar, continua o restante na voz local
          const remainingText = segments.slice(idx).join(' ');
          return this.speak(remainingText, {
            customSettings: customBrowserSettings || saved,
            onStart: started ? undefined : onStart,
            onEnd,
            onError,
          });
        }

        await new Promise((resolve, reject) => {
          if (this.activeNeuralRunId !== runId) return resolve();

          audio.onplay = () => {
            if (!started) {
              started = true;
              onStart?.();
            }
          };
          audio.onended = () => resolve();
          audio.onerror = (err) => reject(err);

          audio.src = segRes.audioUrl;
          audio.currentTime = 0;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(reject);
          }
        });
      }

      if (this.activeNeuralRunId === runId) {
        onEnd?.();
      }
    } catch (err) {
      if (this.activeNeuralRunId !== runId) return;
      console.warn('⚠️ [SmartAudio Fallback] Acionando voz nativa após falha no player:', err?.message || err);
      this.speak(text, {
        customSettings: customBrowserSettings || saved,
        onStart,
        onEnd,
        onError,
      });
    }
  }

  stop() {
    this.currentSessionId++;
    this.activeNeuralRunId++;
    this.isPlaying = false;
    this.currentUtterance = null;
    if (this.activeAudioEl) {
      try {
        this.activeAudioEl.onended = null;
        this.activeAudioEl.onerror = null;
        this.activeAudioEl.pause();
      } catch {}
      this.activeAudioEl = null;
    }
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}

export const humanVoiceService = new HumanVoiceService();
