import React, { useState, useEffect } from 'react';
import { Feather, Shield, Wind, LogOut, Heart, Home, Edit3, Sparkles, LifeBuoy, Sliders, Palette, Compass, MessageCircle } from 'lucide-react';
import { THEMES, saveAppTheme, getCurrentTheme } from '../services/themeService';
import { updateUserProfile } from '../services/api';
import UserNotificationsPopover from './UserNotificationsPopover';

export default function Navbar({
  user,
  profile,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
  onOpenOnboarding,
  onOpenProfile,
  onOpenSettings,
  onOpenFeedback,
  onOpenWhatsappPlan,
  systemSettings,
}) {
  const isSuperAdmin =
    profile?.role === 'master' ||
    user?.email === 'edsonmanoel2012@gmail.com' ||
    profile?.email === 'edsonmanoel2012@gmail.com';
  const isMasterOrAdmin = isSuperAdmin || profile?.role === 'admin';
  const [guideName, setGuideName] = useState(() => {
    return localStorage.getItem('isaac_guide_name') || localStorage.getItem('izaque_guide_name') || 'Isaac';
  });

  const [currentTheme, setCurrentTheme] = useState(() => getCurrentTheme());
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  useEffect(() => {
    const handleThemeEvent = (e) => {
      if (e.detail) setCurrentTheme(e.detail);
    };
    window.addEventListener('app-theme-changed', handleThemeEvent);
    return () => window.removeEventListener('app-theme-changed', handleThemeEvent);
  }, []);

  // Atualiza o nome caso mude
  useEffect(() => {
    const handleStorage = () => {
      setGuideName(localStorage.getItem('isaac_guide_name') || localStorage.getItem('izaque_guide_name') || 'Isaac');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const getInitials = () => {
    const name = profile?.full_name || user?.email || 'V';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="w-full border-b border-stone-200/80 dark:border-slate-800 bg-stone-50/95 dark:bg-slate-900/95 backdrop-blur-xl transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* LOGO DA MENTORIA */}
        <div
          onClick={() => setActiveTab('landing')}
          className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group min-w-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400 shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <Feather className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
          </div>
          <div className="min-w-0">
            <span className="text-base sm:text-lg font-serif font-medium tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-1.5 truncate">
              Mentoria
              <span className="hidden sm:inline-block text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/40">
                Clareza & Direção
              </span>
            </span>
            <p className="hidden sm:block text-[10px] text-stone-500 dark:text-stone-400 -mt-0.5 truncate">
              Escuta atenta e desenvolvimento pessoal
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO CENTRAL TERAPÊUTICA */}
        <nav className="hidden md:flex items-center space-x-1 bg-stone-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-stone-300/50 dark:border-slate-700/50">
          <button
            onClick={() => setActiveTab('landing')}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'landing'
                ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            Início
          </button>

          <button
            onClick={() => {
              if (!user) {
                onOpenAuth();
              } else {
                setActiveTab('chat');
              }
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            Sessão com {guideName}
            {!user && (
              <span className="text-[9px] bg-stone-300 dark:bg-slate-700 text-stone-700 dark:text-stone-300 px-1.5 py-0.2 rounded">
                Entrar
              </span>
            )}
          </button>

          {(isSuperAdmin || systemSettings?.show_creative_troubles !== false) && (
            <button
              onClick={() => {
                if (!user) {
                  onOpenAuth();
                } else {
                  setActiveTab('incomodo');
                }
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'incomodo'
                  ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Incômodo Criativo
            </button>
          )}

          {isMasterOrAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white font-medium shadow-sm'
                  : 'text-amber-700 dark:text-amber-400 hover:text-amber-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Super Admin
            </button>
          )}

        </nav>

        {/* ÁREA DO USUÁRIO OU ENTRADA */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* SELETOR RÁPIDO DE TEMA VISUAL (PC & DESKTOP — SEMPRE VISÍVEL PARA SUPERADMIN) */}
          {(isSuperAdmin || (systemSettings ? systemSettings.show_theme_selector !== false : true)) && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsThemeMenuOpen((prev) => !prev)}
                title={`Mudar Estilo Visual (Atual: ${THEMES.find((t) => t.id === currentTheme)?.name || 'Esmeralda'})`}
                className={`p-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  isThemeMenuOpen
                    ? 'bg-teal-700/15 text-teal-800 dark:text-teal-300 ring-1 ring-teal-500/40'
                    : 'text-stone-500 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-stone-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span className="hidden xl:inline text-xs font-serif">
                  {THEMES.find((t) => t.id === currentTheme)?.name.split(' ')[1] || 'Tema'}
                </span>
              </button>

              {isThemeMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsThemeMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 shadow-2xl z-50 space-y-1 text-stone-800 dark:text-stone-100">
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                      Estilos Visuais
                    </div>
                    {THEMES.map((t) => {
                      const isSelected = currentTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            saveAppTheme(t.id);
                            setCurrentTheme(t.id);
                            setIsThemeMenuOpen(false);
                            if (user?.id) {
                              updateUserProfile(user.id, {
                                preferences: {
                                  ...(user.preferences || {}),
                                  app_theme: t.id,
                                },
                              }).catch(() => {});
                            }
                          }}
                          className={`w-full px-2.5 py-2 rounded-xl text-left text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 font-semibold'
                              : 'hover:bg-stone-100 dark:hover:bg-slate-700/60 text-stone-700 dark:text-stone-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">{t.previewIcon}</span>
                            <div className="min-w-0 truncate">
                              <span className="block truncate text-xs">{t.name}</span>
                              <span className="block truncate text-[10px] text-stone-400 font-normal">
                                {t.tagline}
                              </span>
                            </div>
                          </div>
                          <div
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/50 shadow-xs"
                            style={{ backgroundColor: t.accent }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* BOTÃO DE PREFERÊNCIAS / CONFIGURAÇÕES (SEMPRE VISÍVEL PARA SUPERADMIN) */}
          {onOpenSettings && (isSuperAdmin || (systemSettings ? systemSettings.show_settings_button !== false : true)) && (
            <button
              type="button"
              onClick={onOpenSettings}
              title="Configurações e Preferências Sensoriais (Voz Neural Gemini, Áudio Ambiente e Ajustes)"
              className="p-2 text-stone-500 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-stone-200/60 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden lg:inline text-xs font-serif">Configurações</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {/* Botão ISAAC no WhatsApp (Plano R$ 14,99 / Status) */}
              {onOpenWhatsappPlan && (
                <button
                  type="button"
                  onClick={onOpenWhatsappPlan}
                  title="Conversar com o ISAAC no WhatsApp (Texto e Áudio)"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border ${
                    profile?.role === 'master' ||
                    (profile?.plan_id === 'whatsapp_monthly' && profile?.plan_status === 'active')
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              )}

              {/* Notificações & Mural de Comunicados (Áudio e Texto) */}
              <UserNotificationsPopover user={user} />

              {/* Botão de Suporte Oficial Lynx (Sugestões & Reclamações) */}
              <button
                type="button"
                onClick={onOpenFeedback}
                title="Suporte Oficial Lynx (Sugestões ou Reclamações)"
                className="p-2 text-stone-500 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-stone-200/60 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <LifeBuoy className="w-4 h-4" />
              </button>

              {/* Botão de Perfil com Avatar */}
              <button
                type="button"
                onClick={onOpenProfile}
                title="Visualizar e editar seu perfil"
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-2xl hover:bg-stone-200/60 dark:hover:bg-slate-800 transition text-left"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-teal-700/10 dark:bg-teal-500/20 border border-teal-700/20 dark:border-teal-500/30 overflow-hidden flex items-center justify-center text-teal-800 dark:text-teal-300 font-serif text-xs font-semibold shrink-0">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{getInitials()}</span>
                  )}
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate max-w-[120px]">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-teal-700 dark:text-teal-400">
                    Meu Perfil
                  </span>
                </div>
              </button>

              {onOpenOnboarding && (
                <button
                  type="button"
                  onClick={onOpenOnboarding}
                  title="Alterar o nome do seu Guia"
                  className="p-2 text-stone-500 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-stone-200/60 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onLogout}
                title="Sair com segurança"
                className="p-2 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-200/60 dark:hover:bg-slate-800 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-medium tracking-wide shadow-md shadow-teal-700/20 transition flex items-center gap-1.5 shrink-0"
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Acessar Mentoria</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
