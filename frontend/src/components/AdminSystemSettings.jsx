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
} from 'lucide-react';
import { fetchSystemSettings, updateSystemSettings } from '../services/adminApi';
import { THEMES } from '../services/themeService';
import { GEMINI_VOICES } from '../services/voiceService';

export default function AdminSystemSettings({ currentUser }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Estado dos parâmetros avançados do sistema
  const [settings, setSettings] = useState({
    id: 'global',
    // Visibilidade na Sessão de Mentoria
    show_theme_selector: true,
    show_settings_button: true,
    show_ambient_sound_button: true,
    // Módulos
    show_creative_troubles: true,
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
    default_gemini_voice: 'Charon',
    default_immersive_voice: false,
    updated_at: null,
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchSystemSettings();
      if (data) {
        setSettings((prev) => ({
          ...prev,
          ...data,
          default_theme: data.default_theme || 'gold',
          show_creative_troubles: data.show_creative_troubles !== undefined ? data.show_creative_troubles : true,
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

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const updated = await updateSystemSettings({
        ...settings,
        updated_by: currentUser?.id || 'superadmin',
      });
      setSettings((prev) => ({ ...prev, ...updated }));
      showFeedback('success', 'Parâmetros avançados salvos com sucesso!');

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
      show_settings_button: false,
      show_ambient_sound_button: true,
      show_creative_troubles: true,
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
      default_gemini_voice: 'Charon',
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
                    Apresentação do Idealizador (Edson Manoel)
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

            {/* 1.3 PROPOSTA DA MENTORIA & 3 PILARES */}
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mt-0.5">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                    Proposta da Mentoria (Quem é Isaac & 3 Pilares)
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

            {/* VOZ NEURAL, TRILHA E MOTOR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-teal-600" />
                  Voz Padrão (Gemini Neural)
                </label>
                <select
                  value={settings.default_gemini_voice}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, default_gemini_voice: e.target.value }))
                  }
                  className="w-full text-xs p-2.5 rounded-xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  {GEMINI_VOICES.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.gender === 'masculino' ? 'Voz Masc.' : 'Voz Fem.'}) — {v.tone}
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
