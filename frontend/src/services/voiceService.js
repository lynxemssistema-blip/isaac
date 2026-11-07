/**
 * Serviço de Voz Humanizada & Síntese Neural (Web Speech API)
 * Permite selecionar vozes masculinas, femininas e neurais do sistema,
 * com ajuste fino de tom (pitch), ritmo (rate) e prevenção do bug de corte do Chrome.
 */

import { cleanTextForSpeech } from './api';

export const GEMINI_VOICES = [
  { id: 'Charon', name: 'Charon (Mentor Isaac)', gender: 'male', description: 'Voz masculina profunda, reflexiva e madura' },
  { id: 'Aoede', name: 'Aoede (Mentora Acolhedora)', gender: 'female', description: 'Voz feminina suave, serena e confortante' },
  { id: 'Kore', name: 'Kore (Encorajadora)', gender: 'female', description: 'Voz feminina firme, clara e segura' },
  { id: 'Puck', name: 'Puck (Dinâmica)', gender: 'neutral', description: 'Voz expressiva, leve e conversacional' },
  { id: 'Fenrir', name: 'Fenrir (Firme)', gender: 'male', description: 'Voz masculina enérgica e determinada' },
];

class HumanVoiceService {
  constructor() {
    this.currentUtterance = null;
    this.isPlaying = false;
    this.currentSessionId = 0;
  }

  /**
   * Verifica se o navegador suporta síntese de voz
   */
  isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  /**
   * Retorna todas as vozes disponíveis no navegador, com prioridade para Português (Brasil)
   */
  getAvailableVoices() {
    if (!this.isSupported()) return [];
    const allVoices = window.speechSynthesis.getVoices() || [];

    // Filtra vozes em português
    const ptVoices = allVoices.filter((v) => {
      const lang = (v.lang || '').toLowerCase().replace('_', '-');
      return lang.startsWith('pt');
    });

    // Se houver vozes em português, retorna elas com metadados enriquecidos
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

  /**
   * Registra listener para atualização de vozes (assíncrono no Chrome/Edge)
   */
  onVoicesChanged(callback) {
    if (!this.isSupported()) return () => {};

    const handler = () => {
      const voices = this.getAvailableVoices();
      callback(voices);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handler);
    // Dispara imediatamente se as vozes já estiverem disponíveis
    const current = this.getAvailableVoices();
    if (current.length > 0) callback(current);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
    };
  }

  /**
   * Obtém as configurações salvas de voz do usuário
   */
  getSettings() {
    if (typeof window === 'undefined') {
      return {
        voiceEngine: 'gemini',
        geminiVoice: 'Charon',
        voiceURI: '',
        gender: 'auto',
        rate: 0.90,
        pitch: 0.95,
        preferBrowser: false,
      };
    }

    return {
      voiceEngine: localStorage.getItem('isaac_voice_engine') || localStorage.getItem('izaque_voice_engine') || 'gemini', // 'gemini' | 'browser'
      geminiVoice: localStorage.getItem('isaac_gemini_voice') || localStorage.getItem('izaque_gemini_voice') || 'Charon',
      voiceURI: localStorage.getItem('isaac_voice_uri') || localStorage.getItem('izaque_voice_uri') || '',
      gender: localStorage.getItem('isaac_voice_gender') || localStorage.getItem('izaque_voice_gender') || 'auto', // 'auto' | 'male' | 'female' | 'custom'
      rate: parseFloat(localStorage.getItem('isaac_voice_rate') || localStorage.getItem('izaque_voice_rate') || '0.90'),
      pitch: parseFloat(localStorage.getItem('isaac_voice_pitch') || localStorage.getItem('izaque_voice_pitch') || '0.95'),
      preferBrowser: (localStorage.getItem('isaac_voice_prefer_browser') || localStorage.getItem('izaque_voice_prefer_browser')) === 'true',
    };
  }

  /**
   * Salva as preferências de voz
   */
  saveSettings({ voiceEngine, geminiVoice, voiceURI, gender, rate, pitch, preferBrowser }) {
    if (typeof window === 'undefined') return;

    if (voiceEngine !== undefined) {
      localStorage.setItem('isaac_voice_engine', voiceEngine);
      localStorage.setItem('izaque_voice_engine', voiceEngine);
    }
    if (geminiVoice !== undefined) {
      localStorage.setItem('isaac_gemini_voice', geminiVoice);
      localStorage.setItem('izaque_gemini_voice', geminiVoice);
    }
    if (voiceURI !== undefined) {
      localStorage.setItem('isaac_voice_uri', voiceURI);
      localStorage.setItem('izaque_voice_uri', voiceURI);
    }
    if (gender !== undefined) {
      localStorage.setItem('isaac_voice_gender', gender);
      localStorage.setItem('izaque_voice_gender', gender);
    }
    if (rate !== undefined) {
      localStorage.setItem('isaac_voice_rate', rate.toString());
      localStorage.setItem('izaque_voice_rate', rate.toString());
    }
    if (pitch !== undefined) {
      localStorage.setItem('isaac_voice_pitch', pitch.toString());
      localStorage.setItem('izaque_voice_pitch', pitch.toString());
    }
    if (preferBrowser !== undefined) {
      const val = preferBrowser ? 'true' : 'false';
      localStorage.setItem('isaac_voice_prefer_browser', val);
      localStorage.setItem('izaque_voice_prefer_browser', val);
    }

    window.dispatchEvent(new Event('storage'));
  }

  /**
   * Encontra a melhor voz com base nas preferências
   */
  resolveVoice(savedSettings = null) {
    if (!this.isSupported()) return null;

    const settings = savedSettings || this.getSettings();
    const rawVoices = window.speechSynthesis.getVoices() || [];
    if (rawVoices.length === 0) return null;

    // 1. Se houver uma voz específica escolhida pelo URI ou Nome
    if (settings.voiceURI) {
      const match = rawVoices.find(
        (v) => v.voiceURI === settings.voiceURI || v.name === settings.voiceURI
      );
      if (match) return match;
    }

    // 2. Filtra vozes em Português
    const ptVoices = rawVoices.filter((v) => {
      const l = (v.lang || '').toLowerCase().replace('_', '-');
      return l.startsWith('pt');
    });
    const pool = ptVoices.length > 0 ? ptVoices : rawVoices;

    // 3. Filtra por gênero se solicitado
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

    // 4. Se 'auto' ou não achou gênero específico, prefere vozes Naturais/Neurais
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

    // 5. Fallback para a primeira de pt-BR ou a padrão
    const brDefault = pool.find((v) => v.lang === 'pt-BR' || v.lang === 'pt_BR');
    return brDefault || pool[0];
  }

  /**
   * Divide o texto em frases para pausas respiratórias naturais
   * e contorna o bug do Chrome que congela falas longas após 15 segundos.
   */
  splitIntoSentences(text) {
    if (!text) return [];

    // Limpa Markdown, links e emojis
    const clean = cleanTextForSpeech(text);
    if (!clean) return [];

    // Divide por pontuação (. ! ? :) evitando cortes repetitivos
    const rawMatches = clean.match(/[^.!?:\n]+[.!?:\n]+|[^.!?:\n]+$/g);
    if (!rawMatches) return [clean];

    return rawMatches
      .map((s) => s.replace(/[\n\r]+/g, ' ').trim())
      .filter((s) => s.length > 1);
  }

  /**
   * Fala um texto completo de forma humanizada e compassiva
   */
  async speak(text, { onStart, onEnd, onError, customSettings } = {}) {
    if (!this.isSupported()) {
      onError?.(new Error('Síntese de voz não suportada neste navegador.'));
      return;
    }

    // Cancela qualquer reprodução anterior e gera ID único de sessão
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
      // Se a sessão mudou ou parou, encerra sem duplicar fala
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

      utterance.rate = Math.max(0.70, Math.min(1.25, settings.rate));
      utterance.pitch = Math.max(0.75, Math.min(1.25, settings.pitch));

      utterance.onstart = () => {
        if (this.currentSessionId !== currentSession) return;
        if (sentenceIndex === 1) {
          onStart?.();
        }
      };

      utterance.onend = () => {
        if (this.currentSessionId !== currentSession) return;
        // Pausa respiratória natural entre frases (70ms)
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
        console.warn('⚠️ Erro na fala de frase:', e.error);
        speakNext();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    };

    // Pequeno intervalo antes de disparar para permitir o cancel() anterior ser processado
    setTimeout(() => {
      if (this.currentSessionId === currentSession) {
        speakNext();
      }
    }, 60);
  }

  /**
   * Para imediatamente qualquer fala em andamento
   */
  stop() {
    this.currentSessionId++;
    this.isPlaying = false;
    this.currentUtterance = null;
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}

export const humanVoiceService = new HumanVoiceService();
