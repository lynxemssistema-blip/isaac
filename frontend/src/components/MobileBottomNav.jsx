import React from 'react';
import { Home, MessageSquareHeart, User, Sliders, Shield, Compass } from 'lucide-react';

export default function MobileBottomNav({
  activeTab,
  onNavigate,
  onOpenProfile,
  onOpenSettings,
  user,
  profile,
  systemSettings,
}) {
  const isSuperAdmin =
    profile?.role === 'master' ||
    user?.email === 'edsonmanoel2012@gmail.com' ||
    profile?.email === 'edsonmanoel2012@gmail.com';
  const isMasterOrAdmin = isSuperAdmin || profile?.role === 'admin';
  const guideName = localStorage.getItem('isaac_guide_name') || localStorage.getItem('izaque_guide_name') || 'Isaac';

  return (
    <nav
      className={`mobile-bottom-nav md:hidden z-30 bg-stone-50/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-stone-200/80 dark:border-slate-800 pb-safe pt-1 px-2 shadow-2xl transition-all select-none touch-manipulation ${
        activeTab === 'chat' ? 'w-full shrink-0 relative' : 'fixed bottom-0 left-0 right-0'
      }`}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto py-1">
        {/* INÍCIO */}
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 active:scale-95 min-w-[52px] min-h-[46px] ${
            activeTab === 'landing'
              ? 'nav-item-active text-teal-800 dark:text-teal-300 font-semibold'
              : 'text-stone-400 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-all duration-200 ${
              activeTab === 'landing'
                ? 'nav-pill-active bg-teal-700/15 dark:bg-teal-500/25 shadow-sm scale-105'
                : 'hover:bg-stone-200/40 dark:hover:bg-slate-800/40'
            }`}
          >
            <Home className="w-5 h-5 stroke-[1.85]" />
          </div>
          <span className="text-[10px] font-sans font-medium tracking-tight mt-0.5 leading-none">Início</span>
        </button>

        {/* SESSÃO DE CHAT COM ISAAC */}
        <button
          type="button"
          onClick={() => onNavigate('chat')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 active:scale-95 min-w-[52px] min-h-[46px] ${
            activeTab === 'chat'
              ? 'nav-item-active text-teal-800 dark:text-teal-300 font-semibold'
              : 'text-stone-400 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-all duration-200 relative ${
              activeTab === 'chat'
                ? 'nav-pill-active bg-teal-700/15 dark:bg-teal-500/25 shadow-sm scale-105'
                : 'hover:bg-stone-200/40 dark:hover:bg-slate-800/40'
            }`}
          >
            <MessageSquareHeart className="w-5 h-5 stroke-[1.85]" />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-400 ring-2 ring-stone-50 dark:ring-slate-900 animate-pulse" />
          </div>
          <span className="text-[10px] font-sans font-medium tracking-tight mt-0.5 leading-none">Sessão</span>
        </button>

        {/* INCÔMODO CRIATIVO */}
        {(isSuperAdmin || systemSettings?.show_creative_troubles !== false) && (
          <button
            type="button"
            onClick={() => onNavigate('incomodo')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 active:scale-95 min-w-[52px] min-h-[46px] ${
              activeTab === 'incomodo'
                ? 'nav-item-active text-teal-800 dark:text-teal-300 font-semibold'
                : 'text-stone-400 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all duration-200 ${
                activeTab === 'incomodo'
                  ? 'nav-pill-active bg-teal-700/15 dark:bg-teal-500/25 shadow-sm scale-105'
                  : 'hover:bg-stone-200/40 dark:hover:bg-slate-800/40'
              }`}
            >
              <Compass className="w-5 h-5 stroke-[1.85]" />
            </div>
            <span className="text-[10px] font-sans font-medium tracking-tight mt-0.5 leading-none">Incômodo</span>
          </button>
        )}

        {/* MEU PERFIL */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 active:scale-95 min-w-[52px] min-h-[46px] text-stone-400 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
        >
          <div className="p-1.5 rounded-xl transition-all duration-200 hover:bg-stone-200/40 dark:hover:bg-slate-800/40">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-5 h-5 rounded-full object-cover border border-stone-300 dark:border-slate-700"
              />
            ) : (
              <User className="w-5 h-5 stroke-[1.85]" />
            )}
          </div>
          <span className="text-[10px] font-sans font-medium tracking-tight mt-0.5 leading-none">Perfil</span>
        </button>

        {/* PREFERÊNCIAS SENSORIAIS / CONFIGURAÇÕES (SEMPRE VISÍVEL PARA SUPERADMIN) */}
        {(isSuperAdmin || systemSettings?.show_settings_button !== false) && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 active:scale-95 min-w-[52px] min-h-[46px] text-stone-400 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <div className="p-1.5 rounded-xl transition-all duration-200 hover:bg-stone-200/40 dark:hover:bg-slate-800/40">
              <Sliders className="w-5 h-5 stroke-[1.85]" />
            </div>
            <span className="text-[10px] font-sans font-medium tracking-tight mt-0.5 leading-none">Ajustes</span>
          </button>
        )}

        {/* SUPER ADMIN (CONDICIONAL) */}
        {isMasterOrAdmin && (
          <button
            type="button"
            onClick={() => onNavigate('admin')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 active:scale-95 min-w-[52px] min-h-[46px] ${
              activeTab === 'admin'
                ? 'text-amber-700 dark:text-amber-300 font-semibold'
                : 'text-amber-600/70 dark:text-amber-400/60 hover:text-amber-700 dark:hover:text-amber-300'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'bg-amber-500/20 dark:bg-amber-500/25 shadow-sm shadow-amber-500/10 scale-105'
                  : 'hover:bg-amber-500/10'
              }`}
            >
              <Shield className="w-5 h-5 stroke-[1.85]" />
            </div>
            <span className="text-[10px] font-sans font-medium tracking-tight mt-0.5 leading-none">Admin</span>
          </button>
        )}
      </div>
    </nav>
  );
}
