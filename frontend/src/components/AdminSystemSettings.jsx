import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Eye,
  EyeOff,
  Palette,
  Sliders,
  Volume2,
  Sparkles,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Music,
  Mic,
  Cpu,
  RotateCcw,
  Compass,
  Layout,
  Home,
  User,
  Heart,
  Lock,
  ListOrdered,
  Feather,
  MessageCircle,
  Send,
  Play,
  Square,
  Server,
  Cloud,
  Zap,
} from 'lucide-react';
import {
  fetchSystemSettings,
  updateSystemSettings,
  fetchAdminEvolutionStatus,
  toggleAdminEvolutionApi,
  sendAdminEvolutionTest,
  fetchAdminAiEngineStatusApi,
  updateAdminAiEngineConfigApi,
  testAdminAiEngineApi,
} from '../services/adminApi';
import { THEMES, MULTI_THEME_ENABLED, LOCKED_ACTIVE_THEME_ID } from '../services/themeService';
import {
  GEMINI_VOICES,
  humanVoiceService,
  normalizeGeminiVoiceId,
  unlockHtmlAudioElement,
} from '../services/voiceService';

export default function AdminSystemSettings({ currentUser }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [evoStatus, setEvoStatus] = useState(null);
  const [togglingEvo, setTogglingEvo] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const audioPreviewRef = React.useRef(null);

  // Estado da Chave Mestra do Motor de IA (Gemini Cloud ⇄ Híbrido ⇄ VPS LynxHub)
  const [aiStatus, setAiStatus] = useState(null);
  const [aiConfig, setAiConfig] = useState({
    ai_provider_mode: 'gemini',
    vps_model: 'qwen2.5-coder:1.5b',
    vps_auto_fallback_gemini: true,
    gemini_auto_fallback_vps: true,
    vps_max_concurrent: 12,
  });
  const [switchingAi, setSwitchingAi] = useState(false);
  const [testingProvider, setTestingProvider] = useState('');
  const [aiTestResult, setAiTestResult] = useState(null);

  // Estado dos parâmetros avançados do sistema
  const [settings, setSettings] = useState({
    id: 'global',
    // Visibilidade na Sessão da Plataforma
    show_theme_selector: false,
    show_settings_button: true,
    show_ambient_sound_button: true,
    // Módulos
    show_creative_troubles: true,
    evolution_whatsapp_enabled: true,
    // Visibilidade na Página Inicial (Landing Page)
    show_landing_creator: true,
    show_landing_sensations: true,
    show_landing_features: true,
    show_landing_security: true,
    show_landing_steps: true,
    show_landing_cta: true,
    // Padrões Herdados da conta do Edson
    default_theme: 'gold',
    default_guide_name: 'Isaac',
    default_ambient_track: '432hz',
    default_ambient_volume: 0.20,
    default_ambient_enabled: false,
    default_voice_engine: 'gemini',
    default_gemini_voice: 'Aoede',
    default_voice_gender: 'male',
    default_voice_rate: 0.90,
    default_voice_pitch: 0.95,
    default_immersive_voice: false,
    updated_at: null,
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [data, evo, aiLive] = await Promise.all([
        fetchSystemSettings(),
        fetchAdminEvolutionStatus().catch(() => null),
        fetchAdminAiEngineStatusApi().catch(() => null),
      ]);
      if (evo) setEvoStatus(evo);
      if (aiLive) {
        setAiStatus(aiLive);
        if (aiLive.config) {
          setAiConfig((prev) => ({ ...prev, ...aiLive.config }));
        }
      }
      if (data) {
        setSettings((prev) => ({
          ...prev,
          ...data,
          show_theme_selector: MULTI_THEME_ENABLED ? Boolean(data.show_theme_selector) : false,
          default_theme: MULTI_THEME_ENABLED ? (data.default_theme || 'gold') : LOCKED_ACTIVE_THEME_ID,
          default_gemini_voice: normalizeGeminiVoiceId(data.default_gemini_voice || 'Aoede'),
          default_voice_engine: data.default_voice_engine || 'gemini',
          default_voice_gender: data.default_voice_gender || 'male',
          default_voice_rate: data.default_voice_rate !== undefined ? Number(data.default_voice_rate) : 0.90,
          default_voice_pitch: data.default_voice_pitch !== undefined ? Number(data.default_voice_pitch) : 0.95,
          show_creative_troubles: data.show_creative_troubles !== undefined ? data.show_creative_troubles : true,
          evolution_whatsapp_enabled:
            data.evolution_whatsapp_enabled !== undefined ? data.evolution_whatsapp_enabled : true,
          show_landing_creator: data.show_landing_creator !== undefined ? data.show_landing_creator : true,
          show_landing_sensations: data.show_landing_sensations !== undefined ? data.show_landing_sensations : true,
          show_landing_features: data.show_landing_features !== undefined ? data.show_landing_features : true,
          show_landing_security: data.show_landing_security !== undefined ? data.show_landing_security : true,
          show_landing_steps: data.show_landing_steps !== undefined ? data.show_landing_steps : true,
          show_landing_cta: data.show_landing_cta !== undefined ? data.show_landing_cta : true,
        }));
      }
    } catch (err) {
      console.error('Erro ao carregar configurações do sistema:', err);
      showFeedback('error', 'Falha ao carregar parâmetros do sistema.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4500);
  };

  // Alterna imediatamente o Motor de IA (Gemini / Híbrido / VPS LynxHub) com 1 clique
  const handleApplyAiConfigImmediate = async (partialUpdate, customSuccessMsg = '') => {
    const previous = { ...aiConfig };
    const optimistic = { ...aiConfig, ...partialUpdate };
    setAiConfig(optimistic);
    try {
      setSwitchingAi(true);
      const res = await updateAdminAiEngineConfigApi(optimistic);
      if (res?.config) {
        setAiConfig(res.config);
      }
      const freshStatus = await fetchAdminAiEngineStatusApi().catch(() => null);
      if (freshStatus) setAiStatus(freshStatus);
      const modeLabel =
        optimistic.ai_provider_mode === 'vps'
          ? `VPS LynxHub (${optimistic.vps_model})`
          : optimistic.ai_provider_mode === 'hybrid'
          ? 'Modo Híbrido Inteligente (Chat Gemini + Background VPS R$ 0,00)'
          : 'Google Gemini Cloud';
      showFeedback('success', customSuccessMsg || `Chave Mestra alterada em tempo real para: ${modeLabel}!`);
    } catch (err) {
      setAiConfig(previous);
      showFeedback('error', err.message || 'Falha ao alternar o Motor de IA.');
    } finally {
      setSwitchingAi(false);
    }
  };

  const handleRunLiveAiTest = async (targetProvider) => {
    try {
      setTestingProvider(targetProvider);
      setAiTestResult(null);
      const result = await testAdminAiEngineApi({
        targetProvider,
        vpsModelOverride: aiConfig.vps_model,
      });
      setAiTestResult(result);
      const freshStatus = await fetchAdminAiEngineStatusApi().catch(() => null);
      if (freshStatus) setAiStatus(freshStatus);
    } catch (err) {
      setAiTestResult({
        ok: false,
        providerUsed: targetProvider,
        error: err.message || 'Erro ao testar provedor de IA.',
      });
    } finally {
      setTestingProvider('');
    }
  };

  // Ativa ou desativa imediatamente a função da Evolution API (WhatsApp) no banco
  const handleToggleEvolutionImmediate = async (checked) => {
    setSettings((prev) => ({ ...prev, evolution_whatsapp_enabled: checked }));
    try {
      setTogglingEvo(true);
      await toggleAdminEvolutionApi(checked);
      setEvoStatus((prev) => (prev ? { ...prev, dbEnabled: checked, enabled: checked } : prev));
      showFeedback(
        'success',
        checked
          ? 'Função Evolution API (WhatsApp) ATIVADA com sucesso!'
          : 'Função Evolution API (WhatsApp) DESATIVADA com sucesso! Nenhum envio automático será realizado.'
      );
    } catch (err) {
      setSettings((prev) => ({ ...prev, evolution_whatsapp_enabled: !checked }));
      showFeedback('error', err.message || 'Erro ao alterar estado da Evolution API.');
    } finally {
      setTogglingEvo(false);
    }
  };

  const handleSendQuickTest = async () => {
    if (!testPhone.trim()) {
      showFeedback('error', 'Informe o número com DDD para enviar o teste.');
      return;
    }
    try {
      setSendingTest(true);
      const res = await sendAdminEvolutionTest(testPhone.trim());
      showFeedback('success', `Mensagem de teste enviada para ${res?.resolvedJid || testPhone}!`);
      setTestPhone('');
    } catch (err) {
      showFeedback('error', err.message || 'Falha ao enviar teste na Evolution API.');
    } finally {
      setSendingTest(false);
    }
  };

  const handleToggleVoicePreview = async () => {
    if (isPlayingPreview || loadingPreview) {
      humanVoiceService.stop();
      if (audioPreviewRef.current) audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
      setLoadingPreview(false);
      return;
    }

    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio();
    }
    unlockHtmlAudioElement(audioPreviewRef.current);

    const previewSentence = `Olá! Sou a voz do seu mentor ${settings.default_guide_name || 'Isaac'}. Estou aqui para acolher suas reflexões com serenidade e clareza.`;
    setLoadingPreview(true);

    await humanVoiceService.playSmartAudio(previewSentence, {
      audioElement: audioPreviewRef.current,
      voiceNameOverride: settings.default_gemini_voice,
      engineOverride: settings.default_voice_engine,
      customBrowserSettings: {
        gender: settings.default_voice_gender || 'male',
        rate: Number(settings.default_voice_rate || 0.90),
        pitch: Number(settings.default_voice_pitch || 0.95),
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

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const payloadToSave = {
        ...settings,
        ...aiConfig,
        default_gemini_voice: normalizeGeminiVoiceId(settings.default_gemini_voice),
        default_prefer_browser: settings.default_voice_engine === 'browser',
        updated_by: currentUser?.id || 'superadmin',
      };
      const updated = await updateSystemSettings(payloadToSave);
      setSettings((prev) => ({
        ...prev,
        ...updated,
        default_gemini_voice: normalizeGeminiVoiceId(updated.default_gemini_voice),
      }));
      humanVoiceService.applySystemMasterSettings(updated);
      showFeedback('success', 'Parâmetros de voz, áudio e visibilidade salvos e aplicados para todos os usuários!');

      // Notifica todos os componentes em tempo real
      window.dispatchEvent(new CustomEvent('system-settings-updated', { detail: updated }));
    } catch (err) {
      console.error('Erro ao salvar parâmetros:', err);
      showFeedback('error', 'Erro ao salvar alterações: ' + (err.message || 'Falha na conexão'));
    } finally {
      setSaving(false);
    }
  };

  // Restaura os padrões oficiais recomendados da conta do Edson
  const handleResetToEdsonDefault = () => {
    setSettings((prev) => ({
      ...prev,
      show_theme_selector: false,
      show_settings_button: true,
      show_ambient_sound_button: false,
      show_creative_troubles: false,
      show_landing_creator: true,
      show_landing_sensations: true,
      show_landing_features: true,
      show_landing_security: true,
      show_landing_steps: true,
      show_landing_cta: true,
      default_theme: 'gold',
      default_guide_name: 'Isaac',
      default_ambient_track: '432hz',
      default_ambient_volume: 0.20,
      default_ambient_enabled: false,
      default_voice_engine: 'gemini',
      default_gemini_voice: 'Aoede',
      default_voice_gender: 'male',
      default_voice_rate: 0.90,
      default_voice_pitch: 0.95,
      default_immersive_voice: false,
    }));
    showFeedback('info', 'Padrão do Edson aplicado! Clique em "Salvar Parâmetros" para confirmar.');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-sm font-serif text-stone-500">Carregando parâmetros avançados do sistema...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER DA SEÇÃO */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-50">
                Parâmetros Avançados do Sistema
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Exclusivo Superadmin
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
              Configure a visibilidade de seções na Página Inicial, controles na sessão do Isaac, módulo Incômodo Criativo e defina os estilos e ajustes padrão herdados da conta de Edson Manoel.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToEdsonDefault}
            title="Preencher com os padrões aprovados da conta do Edson"
            className="px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-50 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-200 text-xs font-medium transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>Padrão Edson</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold tracking-wide transition flex items-center gap-2 shadow-md shadow-amber-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Gravando...' : 'Salvar Parâmetros'}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK MENSAGEM */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium transition animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              : feedback.type === 'info'
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
          }`}
        >
          {feedback.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
          {feedback.type === 'info' && <Sparkles className="w-4 h-4 shrink-0" />}
          {feedback.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* CHAVE MESTRA DO MOTOR DE IA: GEMINI CLOUD ⇄ HÍBRIDO ⇄ VPS LYNXHUB    */}
      {/* =================================================================== */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/95 border-2 border-indigo-500/35 dark:border-indigo-500/40 shadow-md space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-serif font-semibold text-stone-900 dark:text-stone-100">
                  Chave Mestra do Motor de IA (Gemini Cloud ⇄ VPS LynxHub)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                  Troca Instantânea • Zero Perda
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Alterne com 1 clique entre Google Gemini e sua VPS própria (`lynxhub.lynxems.com.br`) preservando 100% dos livros RAG, memórias evolutivas, microfone e voz neural.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 ${
                aiStatus?.vpsOnline
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              {aiStatus?.vpsOnline
                ? `VPS LynxHub Online (${aiStatus.vpsLatencyMs ?? 0}ms)`
                : 'VPS LynxHub Verificando'}
            </span>
            {aiStatus?.loadedModels?.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                RAM Aquecida: {aiStatus.loadedModels.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* SELETOR DE 3 MODOS COM 1 CLIQUE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {[
            {
              id: 'gemini',
              title: 'Google Gemini Cloud',
              badge: 'Ultra Escala (< 1s)',
              icon: Cloud,
              desc: 'Chat ao vivo, streaming e memórias no Gemini Cloud, com estepe automático na VPS caso a nuvem oscile.',
              activeRing: 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/30',
            },
            {
              id: 'hybrid',
              title: 'Híbrido Inteligente',
              badge: 'Recomendado • Economia 50%',
              icon: Zap,
              desc: 'Chat ao vivo ultrarrápido no Gemini + 100% das extrações de memória, resumos e rascunhos na VPS a R$ 0,00.',
              activeRing: 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30',
            },
            {
              id: 'vps',
              title: 'VPS LynxHub (Local)',
              badge: 'Custo R$ 0,00 / Token',
              icon: Server,
              desc: 'Chat, streaming, reflexões na plataforma, memórias e resumos direto na sua VPS KVM 8, mantendo RAG dos livros e voz neural intactos.',
              activeRing: 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30',
            },
          ].map((opt) => {
            const IconComp = opt.icon;
            const isSelected = aiConfig.ai_provider_mode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={switchingAi}
                onClick={() => handleApplyAiConfigImmediate({ ai_provider_mode: opt.id })}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer disabled:opacity-60 ${
                  isSelected
                    ? opt.activeRing
                    : 'bg-stone-50 dark:bg-slate-900/60 border-stone-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <IconComp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {opt.title}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-600 text-white">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 mt-1">
                  {opt.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* CONTROLES DO MODELO DA VPS + CONTINGÊNCIA AUTOMÁTICA + BOTÕES DE TESTE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700">
            <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1.5">
              Modelo Ativo na VPS (Ollama KVM 8)
            </label>
            <select
              value={aiConfig.vps_model}
              disabled={switchingAi}
              onChange={(e) =>
                handleApplyAiConfigImmediate(
                  { vps_model: e.target.value },
                  `Modelo da VPS alterado para ${e.target.value}!`
                )
              }
              className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-indigo-500"
            >
              {(aiStatus?.installedModels?.length > 0
                ? aiStatus.installedModels
                : [
                    { name: 'qwen2.5-coder:1.5b', parameterSize: '1.5B', sizeMb: 940 },
                    { name: 'llama3.2:3b', parameterSize: '3.2B', sizeMb: 1925 },
                    { name: 'deepseek-r1:7b', parameterSize: '7.6B', sizeMb: 4466 },
                    { name: 'llama3:latest', parameterSize: '8.0B', sizeMb: 4445 },
                    { name: 'codegemma:latest', parameterSize: '9B', sizeMb: 4780 },
                    { name: 'gemma2:latest', parameterSize: '9.2B', sizeMb: 5191 },
                  ]
              ).map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} {m.parameterSize ? `(${m.parameterSize})` : ''}{' '}
                  {m.name === 'qwen2.5-coder:1.5b' ? '— Ultra Leve / Recomendado RAM' : ''}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1.5">
              `qwen2.5-coder:1.5b` usa ~1,2 GB de RAM e entrega 4 respostas simultâneas sem risco de memória.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 space-y-2.5 flex flex-col justify-center">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-100 block">
                  Transbordo VPS → Gemini (Anti-Fila)
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block">
                  Se houver pico acima de {aiConfig.vps_max_concurrent} perguntas simultâneas na VPS, o excedente vai ao Gemini sem fila.
                </span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(aiConfig.vps_auto_fallback_gemini)}
                onChange={(e) =>
                  handleApplyAiConfigImmediate({ vps_auto_fallback_gemini: e.target.checked })
                }
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
              />
            </label>

            <label className="flex items-center justify-between gap-3 cursor-pointer pt-2 border-t border-stone-200 dark:border-slate-700">
              <div>
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-100 block">
                  Contingência Gemini → VPS
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block">
                  Se a API do Gemini atingir cota (429) ou oscilar, a VPS assume na hora.
                </span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(aiConfig.gemini_auto_fallback_vps)}
                onChange={(e) =>
                  handleApplyAiConfigImmediate({ gemini_auto_fallback_vps: e.target.checked })
                }
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
              />
            </label>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex flex-col justify-between gap-2.5">
            <div>
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-100 block">
                Diagnóstico &amp; Teste em Tempo Real
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 block mt-0.5">
                Dispare um teste real em qualquer um dos dois motores para comparar latência e resposta agora.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={Boolean(testingProvider)}
                onClick={() => handleRunLiveAiTest('vps')}
                className="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {testingProvider === 'vps' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Server className="w-3.5 h-3.5" />
                )}
                <span>Testar VPS</span>
              </button>
              <button
                type="button"
                disabled={Boolean(testingProvider)}
                onClick={() => handleRunLiveAiTest('gemini')}
                className="flex-1 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {testingProvider === 'gemini' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5" />
                )}
                <span>Testar Gemini</span>
              </button>
            </div>
          </div>
        </div>

        {aiTestResult && (
          <div
            className={`p-3.5 rounded-2xl border text-xs ${
              aiTestResult.ok
                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}
          >
            {aiTestResult.ok ? (
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-2 flex-wrap">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Resposta {aiTestResult.providerUsed === 'vps' ? 'VPS LynxHub' : 'Google Gemini'} (
                    {aiTestResult.modelUsed}) em {aiTestResult.latencyMs} ms:
                  </span>
                </div>
                <p className="pl-6 italic text-[11px] opacity-90">&ldquo;{aiTestResult.reply}&rdquo;</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Falha no teste ({aiTestResult.providerUsed}): {aiTestResult.error}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* GRID PRINCIPAL DE CONFIGURAÇÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ========================================================= */}
        {/* BLOCO 1: VISIBILIDADE NA PÁGINA INICIAL (LANDING PAGE)    */}
        {/* ========================================================= */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-stone-200/80 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200 dark:border-slate-700">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                Página Inicial (Landing Page)
              </h3>
              <p className="text-xs text-stone-400">
                Oculte ou exiba seções da tela inicial para moldar a narrativa e o foco do visitante.
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* 1.1 SEÇÃO DO IDEALIZADOR */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    Apresentação do Idealizador (Thiago Prata)
                    <span className={`text-[10px] font-normal px-2 py-0.2 rounded-full ${
                      settings.show_landing_creator
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60'
                        : 'text-stone-500 bg-stone-200 dark:bg-slate-700'
                    }`}>
                      {settings.show_landing_creator ? 'Visível' : 'Oculto'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                    Exibe o bloco com foto, biografia, redes sociais e citação do Idealizador no topo da página.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.show_landing_creator}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, show_landing_creator: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {/* 1.2 CARTÕES DE SENSAÇÕES TERAPÊUTICAS (HERO) */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    Cartões de Sensações (100% Sigilo, Sem Pressa...)
                    <span className={`text-[10px] font-normal px-2 py-0.2 rounded-full ${
                      settings.show_landing_sensations
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60'
                        : 'text-stone-500 bg-stone-200 dark:bg-slate-700'
                    }`}>
                      {settings.show_landing_sensations ? 'Visível' : 'Oculto'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                    Exibe a grade de 4 cartões de acolhimento rápido logo abaixo dos botões de ação do Hero.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.show_landing_sensations}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, show_landing_sensations: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* 1.3 PROPOSTA DA PLATAFORMA & 3 PILARES */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mt-0.5">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    Proposta da Plataforma (Quem é Isaac &amp; 3 Pilares)
                    <span className={`text-[10px] font-normal px-2 py-0.2 rounded-full ${
                      settings.show_landing_features
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60'
                        : 'text-stone-500 bg-stone-200 dark:bg-slate-700'
                    }`}>
                      {settings.show_landing_features ? 'Visível' : 'Oculto'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                    Apresenta os pilares: Escuta Profunda, Clareza nos Momentos de Dúvida e Constância.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.show_landing_features}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, show_landing_features: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {/* 1.4 ESPAÇO DE CONFIANÇA & SIGILO */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    Espaço de Confiança & Sigilo Absoluto
                    <span className={`text-[10px] font-normal px-2 py-0.2 rounded-full ${
                      settings.show_landing_security
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60'
                        : 'text-stone-500 bg-stone-200 dark:bg-slate-700'
                    }`}>
                      {settings.show_landing_security ? 'Visível' : 'Oculto'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                    Exibe a grade completa de 6 diferenciais éticos e a caixa de compromisso com a serenidade.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.show_landing_security}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, show_landing_security: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* 1.5 COMO FUNCIONA A EXPERIÊNCIA */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5">
                  <ListOrdered className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    Passo a Passo (Como Funciona o Seu Momento)
                    <span className={`text-[10px] font-normal px-2 py-0.2 rounded-full ${
                      settings.show_landing_steps
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60'
                        : 'text-stone-500 bg-stone-200 dark:bg-slate-700'
                    }`}>
                      {settings.show_landing_steps ? 'Visível' : 'Oculto'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                    Mostra os 3 passos simples (Sem formulários, Reflexão acolhedora, Personalização).
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.show_landing_steps}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, show_landing_steps: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* 1.6 CONVITE FINAL / CTA */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mt-0.5">
                  <Feather className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    Card de Convite Final (Chamada para Ação)
                    <span className={`text-[10px] font-normal px-2 py-0.2 rounded-full ${
                      settings.show_landing_cta
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60'
                        : 'text-stone-500 bg-stone-200 dark:bg-slate-700'
                    }`}>
                      {settings.show_landing_cta ? 'Visível' : 'Oculto'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                    Exibe a caixa de encerramento com o botão "Começar Minha Sessão Agora" antes do rodapé.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.show_landing_cta}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, show_landing_cta: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BLOCO 2: VISIBILIDADE NA SESSÃO & MÓDULOS                 */}
        {/* ========================================================= */}
        <div className="space-y-6">
          {/* INTEGRAÇÃO WHATSAPP — EVOLUTION API (EXCLUSIVO SUPERADMIN) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-emerald-500/30 dark:border-emerald-700/50 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200 dark:border-slate-700 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                    Função Evolution API (WhatsApp Oficial)
                  </h3>
                  <p className="text-xs text-stone-400">
                    Controle geral da conversa no WhatsApp (Texto/Áudio) e do lembrete diário das 09:50.
                  </p>
                </div>
              </div>

              {evoStatus && (
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    evoStatus?.connectionState?.instance?.state === 'open'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  }`}
                >
                  Instância {evoStatus.instanceName || 'isaac'}:{' '}
                  {evoStatus?.connectionState?.instance?.state === 'open' ? 'Conectada' : 'Verificar'}
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2 flex-wrap">
                    Ativar Função da Evolution API
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        settings.evolution_whatsapp_enabled
                          ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60'
                          : 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60'
                      }`}
                    >
                      {settings.evolution_whatsapp_enabled ? 'Ativada' : 'Desativada'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                    Quando desativada, pausa imediatamente os lembretes diários das 09:50 e o atendimento automático do agente via WhatsApp (mantendo apenas o respeito a pedidos de cancelamento/opt-out).
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  disabled={togglingEvo}
                  checked={Boolean(settings.evolution_whatsapp_enabled)}
                  onChange={(e) => handleToggleEvolutionImmediate(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {settings.evolution_whatsapp_enabled && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="Enviar mensagem de teste (Ex: 31995574906)"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleSendQuickTest}
                  disabled={sendingTest}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {sendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Testar Envio</span>
                </button>
              </div>
            )}
          </div>

          {/* MÓDULO INCÔMODO CRIATIVO */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-stone-200/80 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200 dark:border-slate-700">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                  Módulo Incômodo Criativo
                </h3>
                <p className="text-xs text-stone-400">
                  Ative ou desative o acesso ao Laboratório do Incômodo Criativo na barra de navegação e menu mobile.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mt-0.5">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    Acesso ao Incômodo Criativo
                    <span className={`text-[10px] font-normal px-2 py-0.2 rounded-full ${
                      settings.show_creative_troubles
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60'
                        : 'text-stone-500 bg-stone-200 dark:bg-slate-700'
                    }`}>
                      {settings.show_creative_troubles ? 'Ativado' : 'Desativado'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                    Quando ativado, exibe o botão na barra superior e no menu mobile para usuários acessarem a ferramenta de desconstrução de incômodos.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.show_creative_troubles}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, show_creative_troubles: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>
          </div>

          {/* VISIBILIDADE NA TELA DE SESSÃO */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-stone-200/80 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200 dark:border-slate-700">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                  Visibilidade na Sessão (Controles do Cabeçalho)
                </h3>
                <p className="text-xs text-stone-400">
                  Defina quais botões aparecem no topo da conversa de reflexão com o Isaac.
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* SELETOR DE ESTILOS VISUAIS */}
              {/* BOTÃO DE TEMAS VISUAIS (OCULTO ENQUANTO MULTI_THEME_ENABLED === false) */}
              {MULTI_THEME_ENABLED && (
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                      Botão de Estilos Visuais (Temas)
                      <span className={`text-[10px] font-normal px-2 py-0.2 rounded-full ${
                        settings.show_theme_selector
                          ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60'
                          : 'text-stone-500 bg-stone-200 dark:bg-slate-700'
                      }`}>
                        {settings.show_theme_selector ? 'Visível' : 'Oculto'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                      Permite que o usuário clique na paleta e alterne o tema visual.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.show_theme_selector}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, show_theme_selector: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
              )}

              {/* BOTÃO DE AJUSTES */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mt-0.5">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                      Botão de Ajustes (Preferências)
                      <span className={`text-[10px] font-normal px-2 py-0.2 rounded-full ${
                        settings.show_settings_button
                          ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60'
                          : 'text-stone-500 bg-stone-200 dark:bg-slate-700'
                      }`}>
                        {settings.show_settings_button ? 'Visível' : 'Oculto'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                      Exibe o botão de preferências no cabeçalho e menu para trocar som, voz e nome.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.show_settings_button}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, show_settings_button: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {/* BOTÃO DE SOM AMBIENTE */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mt-0.5">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                      Botão de Som Ambiente Terapêutico
                      <span className={`text-[10px] font-normal px-2 py-0.2 rounded-full ${
                        settings.show_ambient_sound_button
                          ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60'
                          : 'text-stone-500 bg-stone-200 dark:bg-slate-700'
                      }`}>
                        {settings.show_ambient_sound_button ? 'Visível' : 'Oculto'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                      Exibe o botão de tocar/pausar frequências sonoras direto no cabeçalho da reflexão.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.show_ambient_sound_button}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, show_ambient_sound_button: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BLOCO 3: PADRONIZAÇÃO GLOBAL HERDADA DO EDSON             */}
        {/* ========================================================= */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-stone-200/80 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200 dark:border-slate-700">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                Padrão Global Herdado da Conta do Edson Manoel
              </h3>
              <p className="text-xs text-stone-400">
                Estilo visual, voz neural e configurações acústicas aplicados como diretriz oficial em toda a plataforma.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* SELEÇÃO DO ESTILO VISUAL PADRÃO */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                Estilo Visual Padrão da Plataforma
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {THEMES.map((theme) => {
                  const isSelected = settings.default_theme === theme.id;
                  const isEdsonActive = theme.id === 'gold';
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSettings((prev) => ({ ...prev, default_theme: theme.id }))}
                      className={`p-3.5 rounded-2xl border text-left transition relative flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                          : 'bg-stone-50 dark:bg-slate-900/60 border-stone-200 dark:border-slate-700 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{theme.previewIcon}</span>
                          <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                            {theme.name}
                          </span>
                        </div>
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/50"
                          style={{ backgroundColor: theme.accent }}
                        />
                      </div>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate">
                        {theme.tagline}
                      </span>
                      {isEdsonActive && (
                        <span className="mt-2 inline-flex items-center text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 rounded-md self-start">
                          ✨ Ativo na conta do Edson
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* VOZ NEURAL, TRILHA E MOTOR (PARÂMETRO MESTRE EDSON PARA TODOS OS USUÁRIOS) */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-stone-200 dark:border-slate-700">
              <div>
                <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-100">
                  Agente Leitor &amp; Voz Oficial (Aplicado para Todos os Usuários)
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Sincronizado bidirecionalmente com o perfil do usuário Edson Manoel.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleVoicePreview}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 border cursor-pointer ${
                  isPlayingPreview || loadingPreview
                    ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                    : 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700 hover:bg-teal-100'
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
                    <span>Pausar Demonstração</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Ouvir Demonstração</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-teal-600" />
                  Voz Padrão (Gemini Neural)
                </label>
                <select
                  value={normalizeGeminiVoiceId(settings.default_gemini_voice)}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, default_gemini_voice: e.target.value }))
                  }
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  {GEMINI_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.gender === 'male' ? 'Masc.' : v.gender === 'female' ? 'Fem.' : 'Neutra'}) — {v.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-indigo-600" />
                  Trilha Sonora Padrão
                </label>
                <select
                  value={settings.default_ambient_track}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, default_ambient_track: e.target.value }))
                  }
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="432hz">Frequência 432 Hz (Paz e Cura Interior)</option>
                  <option value="rain">Chuva Serena no Refúgio</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nome do Mentor Padrão
                </label>
                <input
                  type="text"
                  value={settings.default_guide_name}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, default_guide_name: e.target.value }))
                  }
                  placeholder="Isaac"
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-amber-600" />
                  Motor de Síntese
                </label>
                <select
                  value={settings.default_voice_engine}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, default_voice_engine: e.target.value }))
                  }
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="gemini">Google Gemini Neural (Recomendado)</option>
                  <option value="browser">Sintetizador Nativo do Navegador</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
