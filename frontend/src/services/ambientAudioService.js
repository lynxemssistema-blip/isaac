/**
 * Serviço de Áudio Ambiente & Audio Ducking Terapêutico (Web Audio API)
 * Gera frequências binaurais de 432 Hz (Theta relaxamento) e som de chuva leve
 * com transições dinâmicas de volume (Audio Ducking) quando o Guia fala.
 */

class AmbientAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.ambientGain = null;
    this.currentTrack = '432hz'; // '432hz' | 'rain' | 'silent'
    this.userVolume = 0.20; // 20% volume padrão suave
    this.isPlaying = false;
    this.isDucked = false;

    // Nós de sintetização
    this.oscillators = [];
    this.noiseNode = null;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      this.audioCtx = new AudioContextClass();

      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);

      this.ambientGain = this.audioCtx.createGain();
      this.ambientGain.gain.setValueAtTime(this.userVolume, this.audioCtx.currentTime);
      this.ambientGain.connect(this.masterGain);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Inicia o gerador de frequência de cura 432 Hz com batimento binaural Theta (4 Hz)
   */
  start432HzDrone() {
    this.stopNodes();
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    // Oscilador 1: Tom puro 432 Hz
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(432, now);

    // Oscilador 2: Sub-grave acolhedor 216 Hz (oitava abaixo)
    const oscSub = ctx.createOscillator();
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(216, now);

    // Oscilador 3: 436 Hz (Gera batimento Theta de 4 Hz para desaceleração cerebral)
    const oscBinaural = ctx.createOscillator();
    oscBinaural.type = 'sine';
    oscBinaural.frequency.setValueAtTime(436, now);

    // Filtro passa-baixas para eliminar qualquer aspereza e deixar o som aveludado
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now);

    // Ganhos individuais calibrados
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.5, now);

    const gainSub = ctx.createGain();
    gainSub.gain.setValueAtTime(0.35, now);

    const gainBinaural = ctx.createGain();
    gainBinaural.gain.setValueAtTime(0.25, now);

    // LFO suave de respiração (0.1 Hz = 1 ciclo a cada 10 segundos)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.08, now);
    lfo.connect(lfoGain.gain);

    osc1.connect(gain1);
    oscSub.connect(gainSub);
    oscBinaural.connect(gainBinaural);

    gain1.connect(filter);
    gainSub.connect(filter);
    gainBinaural.connect(filter);

    filter.connect(this.ambientGain);

    osc1.start(now);
    oscSub.start(now);
    oscBinaural.start(now);
    lfo.start(now);

    this.oscillators = [osc1, oscSub, oscBinaural, lfo];
  }

  /**
   * Inicia o som de Chuva Suave usando gerador de ruído rosa filtrado
   */
  startGentleRain() {
    this.stopNodes();
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Algoritmo Paul Kellet para ruído rosa realista de chuva
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filtros de modelagem acústica de chuva mansa
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(300, now);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(2600, now);

    whiteNoise.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(this.ambientGain);

    whiteNoise.start(now);
    this.noiseNode = whiteNoise;
  }

  stopNodes() {
    this.oscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.oscillators = [];

    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch {}
      this.noiseNode = null;
    }
  }

  /**
   * Define o tipo de trilha sonora ('432hz', 'rain', 'silent')
   */
  setTrack(trackType) {
    this.currentTrack = trackType;
    if (!this.isPlaying) return;

    if (trackType === '432hz') {
      this.start432HzDrone();
    } else if (trackType === 'rain') {
      this.startGentleRain();
    } else {
      this.stopNodes();
    }
  }

  /**
   * Ajusta o volume da música ambiente (0.0 a 1.0)
   */
  setVolume(volume) {
    this.userVolume = Math.max(0, Math.min(1, volume));
    if (this.ambientGain && this.audioCtx && !this.isDucked) {
      const now = this.audioCtx.currentTime;
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.linearRampToValueAtTime(this.userVolume, now + 0.3);
    }
  }

  /**
   * Inicia a reprodução da música ambiente
   */
  play() {
    this.initContext();
    this.isPlaying = true;
    this.setTrack(this.currentTrack);

    const now = this.audioCtx.currentTime;
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.linearRampToValueAtTime(this.userVolume, now + 1.2);
  }

  /**
   * Pausa a música ambiente com fade-out suave
   */
  pause() {
    if (!this.ambientGain || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.linearRampToValueAtTime(0, now + 0.8);
    setTimeout(() => {
      this.stopNodes();
      this.isPlaying = false;
    }, 850);
  }

  /**
   * AUDIO DUCKING (O Toque de Milhões):
   * Abaixa suavemente a música de fundo quando o Guia fala
   */
  duckForSpeech(duckVolume = 0.04, rampTimeSeconds = 0.8) {
    if (!this.ambientGain || !this.audioCtx || !this.isPlaying) return;
    this.isDucked = true;
    const now = this.audioCtx.currentTime;
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.linearRampToValueAtTime(duckVolume, now + rampTimeSeconds);
  }

  /**
   * AUDIO RESTORE:
   * Sobe suavemente a música de fundo quando o Guia termina de falar
   */
  restoreAfterSpeech(rampTimeSeconds = 1.6) {
    if (!this.ambientGain || !this.audioCtx || !this.isPlaying) return;
    this.isDucked = false;
    const now = this.audioCtx.currentTime;
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.linearRampToValueAtTime(this.userVolume, now + rampTimeSeconds);
  }
}

export const ambientAudio = new AmbientAudioEngine();
