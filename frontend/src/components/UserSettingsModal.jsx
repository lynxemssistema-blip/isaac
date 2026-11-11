import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Music,
  Wind,
  Headphones,
  Check,
  Feather,
  Sliders,
  Radio,
  SlidersHorizontal,
  Play,
  Square,
  Mic,
  Smile,
  User,
  Cpu,
  Globe,
  Palette,
  Type,
} from 'lucide-react';
import { ambientAudio } from '../services/ambientAudioService';
import {
  humanVoiceService,
  GEMINI_VOICES,
  normalizeGeminiVoiceId,
  unlockHtmlAudioElement,
} from '../services/voiceService';
import { updateUserProfile } from '../services/api';
import { THEMES, applyAppTheme, saveAppTheme, getCurrentTheme, MULTI_THEME_ENABLED } from '../services/themeService';

const GUIDE_NAME_SUGGESTIONS = ['Isaac', 'Mentor', 'Guia', 'Hermes', 'Sophia', 'Conselheiro'];

export default function UserSettingsModal({
  isOpen,
  onClose,
  onGuideNameChanged,
  user,
  profile,
  systemSettings,
  onProfileUpdated,
}) {
  const isEdsonOrMaster =
    profile?.role === 'master' ||
    String(user?.email || profile?.email || '').toLowerCase() === 'edsonmanoel2012@gmail.com';
  const [guideName, setGuideName] = useState(() => {
    return localStorage.getItem('isaac_guide_name') || localStorage.getItem('izaque_guide_name') || 'Isaac';
  });

  const [ambientTrack, setAmbientTrack] = useState(() => {
    return localStorage.getItem('izaque_ambient_track') || '432hz';
  });

  const [ambientVolume, setAmbientVolume] = useState(() => {
    return parseFloat(localStorage.getItem('izaque_ambient_volume') || '0.20');
  });

  const [isAmbientEnabled, setIsAmbientEnabled] = useState(() => {
    return localStorage.getItem('izaque_ambient_enabled') === 'true';
  });

  const [immersiveVoice, setImmersiveVoice] = useState(() => {
    return localStorage.getItem('izaque_immersive_voice') === 'true';
  });

  // Tema Visual & Tipografia do App (Exclusivo a nível de usuário)
  const [appTheme, setAppTheme] = useState(() => getCurrentTheme());

  const handleThemeSelect = (themeId) => {
    setAppTheme(themeId);
    applyAppTheme(themeId);
    try {
      localStorage.setItem('izaque_app_theme', themeId);
      window.dispatchEvent(new CustomEvent('app-theme-changed', { detail: themeId }));
    } catch (e) {}
  };

  // Tecnologia de Voz (Segue SEMPRE os parâmetros oficiais do Edson para todos os casos)
  const [voiceEngine, setVoiceEngine] = useState(() => {
    return humanVoiceService.getSettings().voiceEngine;
  });

  const [geminiVoice, setGeminiVoice] = useState(() => {
    return humanVoiceService.getSettings().geminiVoice;
  });

  // Configurações de Voz do Navegador (Legado/Local)
  const [availableVoices, setAvailableVoices] = useState([]);
  const [voiceGender, setVoiceGender] = useState(() => {
    return humanVoiceService.getSettings().gender;
  });
  const [voiceURI, setVoiceURI] = useState(() => {
    return humanVoiceService.getSettings().voiceURI;
  });
  const [voiceRate, setVoiceRate] = useState(() => {
    return humanVoiceService.getSettings().rate;
  });
  const [voicePitch, setVoicePitch] = useState(() => {
    return humanVoiceService.getSettings().pitch;
  });

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const audioPreviewRef = useRef(null);

  // Carrega vozes do navegador
  useEffect(() => {
    const unsub = humanVoiceService.onVoicesChanged((voices) => {
      setAvailableVoices(voices);
    });
    return () => {
      unsub();
      humanVoiceService.stop();
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
    };
  }, []);

  // Quando o modal abre, hidrata as preferências (Voz e Leitor herdam SEMPRE o padrão Mestre do Edson)
  useEffect(() => {
    if (isOpen) {
      const prefs = profile?.preferences || {};
      const globalVoice = humanVoiceService.getSettings();
      setSaveError('');

      setGuideName(prefs.guide_name || localStorage.getItem('isaac_guide_name') || localStorage.getItem('izaque_guide_name') || 'Isaac');
      setAmbientTrack(prefs.ambient_track || localStorage.getItem('izaque_ambient_track') || '432hz');
      setAmbientVolume(
        prefs.ambient_volume !== undefined
          ? Number(prefs.ambient_volume)
          : parseFloat(localStorage.getItem('izaque_ambient_volume') || '0.20')
      );
      setIsAmbientEnabled(
        prefs.ambient_enabled !== undefined
          ? Boolean(prefs.ambient_enabled)
          : localStorage.getItem('izaque_ambient_enabled') === 'true'
      );
      setImmersiveVoice(
        prefs.immersive_voice !== undefined
          ? Boolean(prefs.immersive_voice)
          : localStorage.getItem('izaque_immersive_voice') === 'true'
      );

      if (isEdsonOrMaster) {
        setVoiceEngine(prefs.voice_engine || systemSettings?.default_voice_engine || globalVoice.voiceEngine || 'gemini');
        setGeminiVoice(normalizeGeminiVoiceId(prefs.gemini_voice || systemSettings?.default_gemini_voice || globalVoice.geminiVoice || 'Aoede'));
        setVoiceGender(prefs.voice_gender || systemSettings?.default_voice_gender || globalVoice.gender || 'male');
        setVoiceURI(prefs.voice_uri ?? systemSettings?.default_voice_uri ?? globalVoice.voiceURI ?? '');
        setVoiceRate(
          prefs.voice_rate !== undefined
            ? Number(prefs.voice_rate)
            : Number(systemSettings?.default_voice_rate ?? globalVoice.rate ?? 0.90)
        );
        setVoicePitch(
          prefs.voice_pitch !== undefined
            ? Number(prefs.voice_pitch)
            : Number(systemSettings?.default_voice_pitch ?? globalVoice.pitch ?? 0.95)
        );
      } else {
        setVoiceEngine(systemSettings?.default_voice_engine || globalVoice.voiceEngine || 'gemini');
        setGeminiVoice(normalizeGeminiVoiceId(systemSettings?.default_gemini_voice || globalVoice.geminiVoice || 'Aoede'));
        setVoiceGender(systemSettings?.default_voice_gender || globalVoice.gender || 'male');
        setVoiceURI(systemSettings?.default_voice_uri ?? globalVoice.voiceURI ?? '');
        setVoiceRate(Number(systemSettings?.default_voice_rate ?? globalVoice.rate ?? 0.90));
        setVoicePitch(Number(systemSettings?.default_voice_pitch ?? globalVoice.pitch ?? 0.95));
      }

      setAppTheme(prefs.app_theme || getCurrentTheme());
      setAvailableVoices(humanVoiceService.getAvailableVoices());
    } else {
      humanVoiceService.stop();
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setIsPlayingPreview(false);
      setLoadingPreview(false);
    }
  }, [isOpen, profile, systemSettings, isEdsonOrMaster]);

  const handleToggleAmbient = (enabled) => {
    setIsAmbientEnabled(enabled);
    localStorage.setItem('izaque_ambient_enabled', enabled ? 'true' : 'false');

    if (enabled) {
      ambientAudio.setVolume(ambientVolume);
      ambientAudio.setTrack(ambientTrack);
      ambientAudio.play();
    } else {
      ambientAudio.pause();
    }
  };

  const handleSelectTrack = (track) => {
    setAmbientTrack(track);
    localStorage.setItem('izaque_ambient_track', track);
    if (isAmbientEnabled) {
      ambientAudio.setTrack(track);
    }
  };

  const handleVolumeChange = (vol) => {
    const parsed = parseFloat(vol);
    setAmbientVolume(parsed);
    localStorage.setItem('izaque_ambient_volume', parsed.toString());
    ambientAudio.setVolume(parsed);
  };

  const handleToggleImmersive = async (val) => {
    setImmersiveVoice(val);
    localStorage.setItem('izaque_immersive_voice', val ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('app-immersive-changed', { detail: val }));
    window.dispatchEvent(new Event('storage'));

    const targetUserId = user?.id || profile?.id;
    if (targetUserId) {
      try {
        const currentPrefs = profile?.preferences || {};
        const updatedPrefs = { ...currentPrefs, immersive_voice: val };
        const res = await updateUserProfile(targetUserId, {
          preferences: updatedPrefs,
        });
        if (onProfileUpdated) {
          onProfileUpdated(res?.profile || { ...(profile || {}), preferences: updatedPrefs });
        }
      } catch (err) {
        console.warn('Aviso ao sincronizar preferência imersiva no Supabase:', err);
      }
    }
  };

  // Testar demonstração da voz (Com destravamento síncrono iOS/Android e Blob direto em RAM)
  const handleTogglePreview = async () => {
    if (isPlayingPreview || loadingPreview) {
      humanVoiceService.stop();
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setIsPlayingPreview(false);
      setLoadingPreview(false);
      return;
    }

    const previewSentence = `Olá! Sou a voz do seu mentor ${guideName || 'Isaac'}. Estou aqui para acolher suas reflexões com serenidade e clareza. Como você se sente hoje?`;

    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio();
    }
    unlockHtmlAudioElement(audioPreviewRef.current);

    setLoadingPreview(true);
    await humanVoiceService.playSmartAudio(previewSentence, {
      audioElement: audioPreviewRef.current,
      voiceNameOverride: geminiVoice,
      engineOverride: voiceEngine,
      customBrowserSettings: {
        voiceURI,
        gender: voiceGender,
        rate: voiceRate,
        pitch: voicePitch,
      },
      isPreview: true,
      onStart: () => {
        setLoadingPreview(false);
        setIsPlayingPreview(true);
      },
      onEnd: () => {
        setLoadingPreview(false);
        setIsPlayingPreview(false);
      },
      onError: () => {
        setLoadingPreview(false);
        setIsPlayingPreview(false);
      },
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveError('');
    const finalGuideName = guideName.trim() || 'Isaac';
    const cleanVoice = normalizeGeminiVoiceId(geminiVoice);

    // Se for o Edson (SuperAdmin), salva e propaga os parâmetros de voz/leitor para toda a plataforma.
    // Para os demais usuários, mantém estritamente os parâmetros de voz do Edson.
    const masterVoiceSettings = isEdsonOrMaster
      ? {
          voice_engine: voiceEngine,
          gemini_voice: cleanVoice,
          voice_gender: voiceGender,
          voice_rate: voiceRate,
          voice_pitch: voicePitch,
          voice_uri: voiceURI,
          prefer_browser: voiceEngine === 'browser',
        }
      : {
          voice_engine: systemSettings?.default_voice_engine || humanVoiceService.getSettings().voiceEngine,
          gemini_voice: normalizeGeminiVoiceId(systemSettings?.default_gemini_voice || humanVoiceService.getSettings().geminiVoice),
          voice_gender: systemSettings?.default_voice_gender || humanVoiceService.getSettings().gender,
          voice_rate: Number(systemSettings?.default_voice_rate ?? humanVoiceService.getSettings().rate ?? 0.90),
          voice_pitch: Number(systemSettings?.default_voice_pitch ?? humanVoiceService.getSettings().pitch ?? 0.95),
          voice_uri: systemSettings?.default_voice_uri ?? humanVoiceService.getSettings().voiceURI ?? '',
          prefer_browser: Boolean(systemSettings?.default_prefer_browser ?? humanVoiceService.getSettings().preferBrowser),
        };

    const newPreferences = {
      ...(profile?.preferences || {}),
      guide_name: finalGuideName,
      app_theme: appTheme,
      ambient_track: ambientTrack,
      ambient_volume: ambientVolume,
      ambient_enabled: isAmbientEnabled,
      immersive_voice: immersiveVoice,
      ...masterVoiceSettings,
    };

    // 1. Persiste no localStorage do dispositivo atual para acesso instantâneo
    saveAppTheme(appTheme);
    localStorage.setItem('isaac_guide_name', finalGuideName);
    localStorage.setItem('izaque_guide_name', finalGuideName);
    localStorage.setItem('izaque_ambient_track', ambientTrack);
    localStorage.setItem('izaque_ambient_volume', ambientVolume.toString());
    localStorage.setItem('izaque_ambient_enabled', isAmbientEnabled ? 'true' : 'false');
    localStorage.setItem('izaque_immersive_voice', immersiveVoice ? 'true' : 'false');

    if (onGuideNameChanged) onGuideNameChanged(finalGuideName);

    humanVoiceService.saveSettings({
      voiceEngine: masterVoiceSettings.voice_engine,
      geminiVoice: masterVoiceSettings.gemini_voice,
      voiceURI: masterVoiceSettings.voice_uri,
      gender: masterVoiceSettings.voice_gender,
      rate: masterVoiceSettings.voice_rate,
      pitch: masterVoiceSettings.voice_pitch,
      preferBrowser: masterVoiceSettings.prefer_browser,
    });

    humanVoiceService.stop();
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    setIsPlayingPreview(false);
    setLoadingPreview(false);

    // 2. Sincroniza com a nuvem no Supabase (e propaga para toda a plataforma se for Edson/Master)
    const targetUserId = user?.id || profile?.id;
    if (targetUserId) {
      try {
        const apiRes = await updateUserProfile(targetUserId, { preferences: newPreferences });
        const updatedProfileObj = apiRes?.profile || {
          ...(profile || {}),
          preferences: newPreferences,
        };
        if (onProfileUpdated) {
          onProfileUpdated(updatedProfileObj);
        }
        if (isEdsonOrMaster) {
          window.dispatchEvent(
            new CustomEvent('system-settings-updated', {
              detail: {
                ...(systemSettings || {}),
                default_guide_name: finalGuideName,
                default_voice_engine: masterVoiceSettings.voice_engine,
                default_gemini_voice: masterVoiceSettings.gemini_voice,
                default_voice_gender: masterVoiceSettings.voice_gender,
                default_voice_rate: masterVoiceSettings.voice_rate,
                default_voice_pitch: masterVoiceSettings.voice_pitch,
                default_voice_uri: masterVoiceSettings.voice_uri,
                default_prefer_browser: masterVoiceSettings.prefer_browser,
              },
            })
          );
        }
      } catch (cloudErr) {
        console.error('⚠️ Erro ao sincronizar preferências no Supabase:', cloudErr);
        setSaveError(cloudErr.message || 'Falha ao salvar na nuvem. Tente novamente.');
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 650);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-stone-900/60 backdrop-blur-md pt-safe">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl bg-stone-50 dark:bg-slate-900 border-t sm:border border-stone-200 dark:border-slate-800 rounded-t-3xl sm:rounded-4xl p-4 sm:p-8 shadow-2xl text-stone-800 dark:text-stone-100 relative max-h-[88dvh] overflow-y-auto overscroll-contain pb-safe sm:pb-8"
      >
        {/* Barra de Arraste visual (Mobile Native Pull-bar) */}
        <div className="w-12 h-1 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        {/* CABEÇALHO */}
        <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-stone-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400 shrink-0">
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-medium tracking-tight">
                Preferências da Mentoria
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-teal-600 dark:text-teal-400 inline" />
                Sincronizado automaticamente entre PC e Celular
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              humanVoiceService.stop();
              if (audioPreviewRef.current) audioPreviewRef.current.pause();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-stone-200/60 dark:bg-slate-800 hover:bg-stone-300/80 dark:hover:bg-slate-700 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="py-4 sm:py-6 space-y-6">
          {/* 1. NOME PERSONALIZADO DO MENTOR */}
          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-400 block">
                1. Nome do seu Mentor
              </span>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Como você gostaria de chamar a inteligência acolhedora que guia suas reflexões
              </p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={guideName}
                onChange={(e) => setGuideName(e.target.value)}
                maxLength={24}
                placeholder="Ex: Isaac, Sophia, Hermes..."
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-stone-300 dark:border-slate-700 text-sm font-medium text-stone-800 dark:text-stone-100 placeholder-stone-400 outline-none focus:border-teal-700 dark:focus:border-teal-400 transition"
              />
              <span className="absolute right-3.5 top-3.5 text-[11px] font-mono text-stone-400">
                {guideName.length}/24
              </span>
            </div>

            {/* Sugestões Rápidas */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-stone-400 mr-1">Sugestões:</span>
              {GUIDE_NAME_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setGuideName(sug)}
                  className={`px-2.5 py-1 rounded-full text-[11px] border transition ${
                    guideName.toLowerCase() === sug.toLowerCase()
                      ? 'bg-teal-700 text-white border-teal-700 font-medium'
                      : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-stone-300 hover:border-stone-400'
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* 2. ESTILO VISUAL, CORES & FONTES (OCULTO TEMPORARIAMENTE ENQUANTO MULTI_THEME_ENABLED === false) */}
          {MULTI_THEME_ENABLED && (
          <div className="space-y-3.5 pt-4 border-t border-stone-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-400 block">
                    2. Estilo Visual, Cores & Fontes
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/40 font-mono">
                    4 Ambientes
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  Escolha as cores, contraste e tipografia que mais trazem paz para o seu momento
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEMES.map((theme) => {
                const isSelected = appTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleThemeSelect(theme.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between ${
                      isSelected
                        ? 'ring-2 ring-teal-500/80 dark:ring-teal-400 border-teal-600 bg-white dark:bg-slate-800 shadow-md'
                        : 'border-stone-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/60 hover:border-stone-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {/* Top row with Icon, Name & Selection badge */}
                    <div className="flex items-start justify-between w-full mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{theme.previewIcon}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-serif font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 truncate">
                            {theme.name}
                          </div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                            {theme.tagline}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px] shadow-xs shrink-0 ml-1">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-2.5 leading-relaxed">
                      {theme.description}
                    </p>

                    {/* Bottom row: Font badge and color swatches */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-slate-700/50 mt-auto w-full">
                      <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400 flex items-center gap-1">
                        <Type className="w-3 h-3 text-teal-700 dark:text-teal-400" />
                        {theme.fontName.split(' + ')[0]}
                      </span>

                      {/* Color Swatch Dots */}
                      <div className="flex items-center -space-x-1.5">
                        {theme.colors.map((c, i) => (
                          <span
                            key={i}
                            className="w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 shadow-xs inline-block"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {/* 3. SOM AMBIENTE & FREQUÊNCIA DE CURA */}
          <div className="space-y-4 pt-4 border-t border-stone-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-400 block">
                  3. Som Ambiente Terapêutico
                </span>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  Frequências restauradoras para acalmar a mente durante a conversa
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleAmbient(!isAmbientEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAmbientEnabled ? 'bg-teal-700' : 'bg-stone-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isAmbientEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isAmbientEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-2"
              >
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectTrack('432hz')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                      ambientTrack === '432hz'
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-700 text-teal-900 dark:text-teal-200'
                        : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-teal-700/10 flex items-center justify-center text-teal-800 dark:text-teal-400 shrink-0">
                      <Wind className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Frequência 432 Hz</div>
                      <div className="text-[10px] text-stone-400">Ondas Theta de relaxamento</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTrack('rain')}
                    className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                      ambientTrack === 'rain'
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-700 text-teal-900 dark:text-teal-200'
                        : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-teal-700/10 flex items-center justify-center text-teal-800 dark:text-teal-400 shrink-0">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Chuva Serena</div>
                      <div className="text-[10px] text-stone-400">Ruído de água suave</div>
                    </div>
                  </button>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Volume do Som Ambiente</span>
                    <span className="font-mono">{Math.round(ambientVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.50"
                    step="0.02"
                    value={ambientVolume}
                    onChange={(e) => handleVolumeChange(e.target.value)}
                    className="w-full accent-teal-700 cursor-pointer"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* 4. MODO IMERSIVO (VOZ AUTOMÁTICA) */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200/80 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-400 block">
                4. Modo Imersivo (Ouvir Sempre)
              </span>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Toca a voz do mentor automaticamente quando uma nova reflexão é recebida
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggleImmersive(!immersiveVoice)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                immersiveVoice ? 'bg-teal-700' : 'bg-stone-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  immersiveVoice ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 5. MOTOR DE VOZ DO MENTOR: PADRÃO MESTRE EDSON MANOEL */}
          <div className="space-y-4 pt-4 border-t border-stone-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-400 flex items-center gap-2 flex-wrap">
                  <span>5. Voz do Mentor</span>
                  {isEdsonOrMaster && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                      Parâmetro Mestre (Todos os Usuários)
                    </span>
                  )}
                </span>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  {isEdsonOrMaster
                    ? 'O tipo de voz e parâmetros salvos aqui são aplicados para todos os usuários do app'
                    : 'Voz neural oficial configurada pela curadoria da Mentoria Isaac'}
                </p>
              </div>

              {/* Botão de Demonstração / Teste Imediato */}
              <button
                type="button"
                onClick={handleTogglePreview}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 shadow-sm border cursor-pointer ${
                  isPlayingPreview || loadingPreview
                    ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                    : 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700 hover:bg-teal-100 dark:hover:bg-teal-900/60'
                }`}
              >
                {loadingPreview ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Preparando Voz...</span>
                  </>
                ) : isPlayingPreview ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Pausar Teste</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Ouvir Demonstração</span>
                  </>
                )}
              </button>
            </div>

            {!isEdsonOrMaster ? (
              <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-700/10 flex items-center justify-center text-teal-800 dark:text-teal-300 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-stone-800 dark:text-stone-100">
                      {GEMINI_VOICES.find((v) => v.id === geminiVoice)?.name || 'Voz Neural Isaac'}
                    </div>
                    <div className="text-[10px] text-stone-500 dark:text-stone-400">
                      {GEMINI_VOICES.find((v) => v.id === geminiVoice)?.description || 'Entonação serena e humanizada'}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-700 text-white shrink-0">
                  Ativa
                </span>
              </div>
            ) : (
              <>
            {/* SELEÇÃO DO MOTOR DE VOZ (EXCLUSIVO EDSON / MASTER) */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setVoiceEngine('gemini')}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                  voiceEngine === 'gemini'
                    ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-700 text-teal-900 dark:text-teal-200 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-stone-300 hover:border-teal-600'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-teal-700/10 flex items-center justify-center text-teal-800 dark:text-teal-400 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <span>Voz Gemini Nativa</span>
                    <span className="px-1.5 py-0.2 bg-teal-700 text-white text-[9px] rounded-full font-sans uppercase">
                      Top
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                    Expressão humana, pausas reais e som idêntico no PC e celular
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVoiceEngine('browser')}
                className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                  voiceEngine === 'browser'
                    ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-700 text-teal-900 dark:text-teal-200 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-stone-300 hover:border-teal-600'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-stone-500/10 flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold">Voz do Navegador</div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                    Sintetizador local do aparelho (Web Speech API)
                  </div>
                </div>
              </button>
            </div>

            {/* SE O MOTOR FOR GEMINI NATIVO: CARDS DE VOZES OFICIAIS */}
            {voiceEngine === 'gemini' && (
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-300">
                  Escolha a Personalidade da Voz do Gemini:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GEMINI_VOICES.map((v) => {
                    const isSelected = geminiVoice === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setGeminiVoice(v.id)}
                        className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-700 text-teal-900 dark:text-teal-200 shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-300 hover:border-teal-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">
                            {v.id === 'Charon' ? '🧔' : v.id === 'Aoede' ? '👩' : v.id === 'Kore' ? '🌟' : v.id === 'Puck' ? '⚡' : '🛡️'}
                          </span>
                          <div>
                            <div className="text-xs font-semibold">{v.name}</div>
                            <div className="text-[10px] text-stone-400">{v.description}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-teal-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SE O MOTOR FOR NAVEGADOR LOCAL: AJUSTES DE VOZ DO SO */}
            {voiceEngine === 'browser' && (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-300">
                    Gênero da Voz do Sistema:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceGender('male');
                        setVoiceURI('');
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                        voiceGender === 'male'
                          ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-700 text-teal-900 dark:text-teal-200 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-stone-300 hover:border-teal-600'
                      }`}
                    >
                      <span className="text-base">🧔</span>
                      <span className="text-xs font-semibold">Masculina</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setVoiceGender('female');
                        setVoiceURI('');
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                        voiceGender === 'female'
                          ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-700 text-teal-900 dark:text-teal-200 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-stone-300 hover:border-teal-600'
                      }`}
                    >
                      <span className="text-base">👩</span>
                      <span className="text-xs font-semibold">Feminina</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setVoiceGender('auto');
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                        voiceGender === 'auto'
                          ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-700 text-teal-900 dark:text-teal-200 shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-stone-300 hover:border-teal-600'
                      }`}
                    >
                      <span className="text-base">✨</span>
                      <span className="text-xs font-semibold">Automática</span>
                    </button>
                  </div>
                </div>

                {availableVoices.length > 0 && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-300">
                      Voz Específica do Sistema:
                    </label>
                    <select
                      value={voiceURI}
                      onChange={(e) => {
                        setVoiceURI(e.target.value);
                        if (e.target.value) setVoiceGender('custom');
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-100 outline-none focus:border-teal-700"
                    >
                      <option value="">Automática (Melhor voz detectada)</option>
                      {availableVoices.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} {v.isNatural ? '★ (Neural)' : ''} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Ritmo e Tom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-700 dark:text-stone-200">Ritmo da Fala</span>
                      <span className="font-mono text-teal-700 dark:text-teal-400 font-semibold">{voiceRate.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.75"
                      max="1.15"
                      step="0.05"
                      value={voiceRate}
                      onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                      className="w-full accent-teal-700 cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-700 dark:text-stone-200">Tom (Timbre)</span>
                      <span className="font-mono text-teal-700 dark:text-teal-400 font-semibold">{voicePitch.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.80"
                      max="1.20"
                      step="0.04"
                      value={voicePitch}
                      onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                      className="w-full accent-teal-700 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>

        {saveError && (
          <div className="mb-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            {saveError}
          </div>
        )}

        {/* BOTÃO SALVAR */}
        <div className="pt-4 border-t border-stone-200/80 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-medium tracking-wide shadow-md transition flex items-center justify-center gap-2"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Preferências Salvas e Sincronizadas!</span>
              </>
            ) : isSaving ? (
              <span>Sincronizando...</span>
            ) : (
              <span>Salvar Preferências</span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
