import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { supabase } from './services/supabase';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ReflectionSpace from './components/ReflectionSpace';
import AuthModal from './components/AuthModal';
import MobileBottomNav from './components/MobileBottomNav';
import TermsOfUseModal, { TERMS_VERSION } from './components/TermsOfUseModal';
import { AlertTriangle, LifeBuoy, Loader2 } from 'lucide-react';
import { applyAppTheme, getCurrentTheme } from './services/themeService';
import { fetchSystemSettings, acceptTermsOfUseApi } from './services/adminApi';

// Proteção anti-404 de chunks em novos deploys (recarrega silenciosamente 1x se o hash do arquivo mudou)
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    const reloadedAt = Number(sessionStorage.getItem('__isaac_chunk_reload_ts') || '0');
    if (Date.now() - reloadedAt > 15_000) {
      sessionStorage.setItem('__isaac_chunk_reload_ts', String(Date.now()));
      window.location.reload();
    }
  });
}

function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      return await importer();
    } catch (err) {
      if (typeof window !== 'undefined') {
        const reloadedAt = Number(sessionStorage.getItem('__isaac_chunk_reload_ts') || '0');
        if (Date.now() - reloadedAt > 15_000) {
          sessionStorage.setItem('__isaac_chunk_reload_ts', String(Date.now()));
          window.location.reload();
          return new Promise(() => {});
        }
      }
      throw err;
    }
  });
}

// Code-Splitting (React.lazy com auto-recovery pós-deploy): isola painéis pesados do pacote inicial
const AdminDashboard = lazyWithRetry(() => import('./components/AdminDashboard'));
const CreativeTroubleLab = lazyWithRetry(() => import('./components/CreativeTroubleLab'));
const DirectSignupPage = lazyWithRetry(() => import('./components/DirectSignupPage'));
const SimpleInscriptionPage = lazyWithRetry(() => import('./components/SimpleInscriptionPage'));
const WelcomeOnboarding = lazyWithRetry(() => import('./components/WelcomeOnboarding'));
const UserProfileModal = lazyWithRetry(() => import('./components/UserProfileModal'));
const UserSettingsModal = lazyWithRetry(() => import('./components/UserSettingsModal'));
const ResetPasswordModal = lazyWithRetry(() => import('./components/ResetPasswordModal'));
const SubscriberFeedbackModal = lazyWithRetry(() => import('./components/SubscriberFeedbackModal'));
const TopicLandingPage = lazyWithRetry(() => import('./components/TopicLandingPage'));

function LazyFallbackLoader() {
  return (
    <div className="flex-1 min-h-[40vh] flex items-center justify-center p-6">
      <Loader2 className="w-7 h-7 text-teal-600 dark:text-teal-400 animate-spin" />
    </div>
  );
}

function parseDirectSignupLocation() {
  if (typeof window === 'undefined') return null;
  const pathname = window.location.pathname || '/';
  const searchParams = new URLSearchParams(window.location.search);

  // Suporta /cadastro, /cadastro/slug, /c/slug
  const pathMatch = pathname.match(/^\/(?:cadastro|c)(?:\/([^/?#]+))?\/?$/i);
  if (pathMatch) {
    return { slug: decodeURIComponent(pathMatch[1] || '').trim() };
  }

  // Suporta ?cadastro=slug ou ?cadastro=1
  if (searchParams.has('cadastro')) {
    const raw = searchParams.get('cadastro') || '';
    const slug = raw === '1' || raw === 'true' ? '' : raw.trim();
    return { slug };
  }

  return null;
}

function parseInscriptionLocation() {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname || '/';
  const searchParams = new URLSearchParams(window.location.search);

  // Suporta /inscricao ou ?inscricao=1
  if (/^\/inscricao(?:\/.*)?$/i.test(pathname)) {
    return true;
  }
  if (searchParams.has('inscricao')) {
    return true;
  }
  return false;
}

function parseTopicLocation() {
  if (typeof window === 'undefined') return null;
  const pathname = window.location.pathname || '/';
  const match = pathname.match(/^\/temas\/([^/?#]+)\/?$/i);
  if (match) {
    return { slug: decodeURIComponent(match[1] || '').trim() };
  }
  return null;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('landing'); // 'landing' | 'chat' | 'admin'
  const [directSignupRoute, setDirectSignupRoute] = useState(() => parseDirectSignupLocation());
  const [isInscriptionRoute, setIsInscriptionRoute] = useState(() => parseInscriptionLocation());
  const [topicRoute, setTopicRoute] = useState(() => parseTopicLocation());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('login');
  const [authInitialEmail, setAuthInitialEmail] = useState('');
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetTokenHash, setResetTokenHash] = useState('');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTermsPromptOpen, setIsTermsPromptOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [systemSettings, setSystemSettings] = useState(null);

  // Estado do Onboarding do Guia
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [guideName, setGuideName] = useState(() => {
    return localStorage.getItem('isaac_guide_name') || localStorage.getItem('izaque_guide_name') || 'Isaac';
  });

  // Carregar perfil do usuário em public.izaque_profiles
  const loadUserProfile = async (currentUser) => {
    if (!currentUser) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('izaque_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        // Sincroniza preferências do banco de dados (Supabase) com o localStorage e estado local
        if (data.preferences && typeof data.preferences === 'object') {
          const p = data.preferences;
          if (p.guide_name) {
            localStorage.setItem('izaque_guide_name', p.guide_name);
            setGuideName(p.guide_name);
          }
          if (p.ambient_track) localStorage.setItem('izaque_ambient_track', p.ambient_track);
          if (p.ambient_volume !== undefined) localStorage.setItem('izaque_ambient_volume', p.ambient_volume.toString());
          if (p.ambient_enabled !== undefined) localStorage.setItem('izaque_ambient_enabled', p.ambient_enabled ? 'true' : 'false');
          if (p.immersive_voice !== undefined) localStorage.setItem('izaque_immersive_voice', p.immersive_voice ? 'true' : 'false');
          if (p.voice_engine) localStorage.setItem('izaque_voice_engine', p.voice_engine);
          if (p.gemini_voice) localStorage.setItem('izaque_gemini_voice', p.gemini_voice);
          if (p.voice_gender) localStorage.setItem('izaque_voice_gender', p.voice_gender);
          if (p.voice_rate !== undefined) localStorage.setItem('izaque_voice_rate', p.voice_rate.toString());
          if (p.voice_pitch !== undefined) localStorage.setItem('izaque_voice_pitch', p.voice_pitch.toString());
          if (p.voice_uri) localStorage.setItem('izaque_voice_uri', p.voice_uri);
          if (p.app_theme) {
            localStorage.setItem('izaque_app_theme', p.app_theme);
            applyAppTheme(p.app_theme);
          }
          if (p.prefer_browser !== undefined) {
            localStorage.setItem('izaque_voice_prefer_browser', p.prefer_browser ? 'true' : 'false');
          }

          window.dispatchEvent(new Event('storage'));
        }
      } else {
        setProfile({
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
          role: currentUser.email === 'edsonmanoel2012@gmail.com' ? 'master' : 'user',
        });
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const directSignupRef = useRef(directSignupRoute);
  useEffect(() => {
    directSignupRef.current = directSignupRoute;
  }, [directSignupRoute]);

  const inscriptionRouteRef = useRef(isInscriptionRoute);
  useEffect(() => {
    inscriptionRouteRef.current = isInscriptionRoute;
  }, [isInscriptionRoute]);

  useEffect(() => {
    const handlePopState = () => {
      setDirectSignupRoute(parseDirectSignupLocation());
      setIsInscriptionRoute(parseInscriptionLocation());
      setTopicRoute(parseTopicLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (directSignupRoute || isInscriptionRoute || topicRoute) return;
    if (activeTab === 'landing') {
      document.title = 'Mentoria ISAAC — Clareza Emocional, Escuta Profunda & Transformação 24h';
    } else if (activeTab === 'chat') {
      document.title = `${guideName || 'Isaac'} • Espaço de Mentoria — ISAAC`;
    } else if (activeTab === 'incomodo') {
      document.title = 'Laboratório do Incômodo Criativo — Mentoria ISAAC';
    } else if (activeTab === 'admin') {
      document.title = 'Painel Administrativo — Mentoria ISAAC';
    }
  }, [activeTab, guideName, directSignupRoute, isInscriptionRoute, topicRoute]);

  useEffect(() => {
    // Carrega Parâmetros Globais do Sistema (Superadmin)
    fetchSystemSettings().then((res) => {
      if (res) {
        setSystemSettings(res);
        const savedTheme = localStorage.getItem('isaac_app_theme') || localStorage.getItem('izaque_app_theme');
        // Se o Superadmin ocultou a seleção de temas ou se ainda não há tema salvo, aplica o padrão global (indigo)
        const themeToApply = (!res.show_theme_selector || !savedTheme)
          ? (res.default_theme || 'indigo')
          : savedTheme;
        applyAppTheme(themeToApply);
        localStorage.setItem('izaque_app_theme', themeToApply);

        // Define trilha e voz padrão se o usuário for novo
        if (!localStorage.getItem('izaque_ambient_track') && res.default_ambient_track) {
          localStorage.setItem('izaque_ambient_track', res.default_ambient_track);
        }
        if (!localStorage.getItem('izaque_gemini_voice') && res.default_gemini_voice) {
          localStorage.setItem('izaque_gemini_voice', res.default_gemini_voice);
        }
        if (!localStorage.getItem('izaque_voice_engine') && res.default_voice_engine) {
          localStorage.setItem('izaque_voice_engine', res.default_voice_engine);
        }
        if (!localStorage.getItem('izaque_guide_name') && res.default_guide_name) {
          localStorage.setItem('izaque_guide_name', res.default_guide_name);
          setGuideName(res.default_guide_name);
        }
      } else {
        applyAppTheme(getCurrentTheme());
      }
    }).catch(() => {
      applyAppTheme(getCurrentTheme());
    });

    const handleSystemSettingsUpdated = (e) => {
      if (e.detail) {
        setSystemSettings(e.detail);
        if (!e.detail.show_theme_selector && e.detail.default_theme) {
          applyAppTheme(e.detail.default_theme);
          localStorage.setItem('izaque_app_theme', e.detail.default_theme);
        }
      }
    };
    window.addEventListener('system-settings-updated', handleSystemSettingsUpdated);

    const handleThemeChange = (e) => {
      if (e.detail) applyAppTheme(e.detail);
    };
    window.addEventListener('app-theme-changed', handleThemeChange);

    // Detecta se a URL contém instrução de recuperação de senha
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash || '';
      const tokenHash = searchParams.get('token_hash');
      if (tokenHash) {
        setResetTokenHash(tokenHash);
        setIsResetPasswordOpen(true);
      } else if (searchParams.get('mode') === 'reset-password' || hash.includes('type=recovery')) {
        setIsResetPasswordOpen(true);
      }
    }

    let initialSessionHandled = false;

    // 1. Obter sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      initialSessionHandled = true;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        loadUserProfile(currentUser);
        // Se estiver em link direto de cadastro (/cadastro/...), ficha (/inscricao) ou trilha (/temas/...), mantém a página pública visível
        const onPublicRoute =
          Boolean(parseDirectSignupLocation()) ||
          parseInscriptionLocation() ||
          Boolean(parseTopicLocation());
        if (!onPublicRoute) {
          // REQUISITO: Usuário autenticado já abre direto na página de conversa com ISAAC
          setActiveTab('chat');
        }
      } else {
        setLoadingProfile(false);
      }
    });

    // 2. Escutar mudanças de autenticação (evitando disparo duplicado em INITIAL_SESSION)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPasswordOpen(true);
      }
      if (event === 'INITIAL_SESSION' && initialSessionHandled) {
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        if (event !== 'TOKEN_REFRESHED') {
          loadUserProfile(currentUser);
        }
      } else {
        setProfile(null);
        if (activeTabRef.current === 'chat' || activeTabRef.current === 'admin') {
          setActiveTab('landing');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('app-theme-changed', handleThemeChange);
      window.removeEventListener('system-settings-updated', handleSystemSettingsUpdated);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setActiveTab('landing');
  };

  // Verifica se o usuário autenticado precisa aceitar os termos de uso (Clickwrap)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.__izaqueSignupFlowActive) {
      return;
    }
    if (directSignupRoute || isInscriptionRoute) {
      return;
    }
    if (user && profile && !loadingProfile) {
      if (profile.terms_accepted !== true) {
        setIsTermsPromptOpen(true);
      } else {
        setIsTermsPromptOpen(false);
      }
    }
  }, [user, profile, loadingProfile, directSignupRoute, isInscriptionRoute]);

  const handleAcceptTerms = async () => {
    if (!user) return;
    try {
      await acceptTermsOfUseApi({ userId: user.id, termsVersion: TERMS_VERSION });
      setProfile((prev) => (prev ? { ...prev, terms_accepted: true } : prev));
      setIsTermsPromptOpen(false);
    } catch (err) {
      console.error('Erro ao aceitar termos de uso:', err);
    }
  };

  const handleAuthSuccess = (loggedUser, savedProfile = null) => {
    setDirectSignupRoute(null);
    setUser(loggedUser);
    if (savedProfile) {
      setProfile(savedProfile);
    }
    loadUserProfile(loggedUser);
    setActiveTab('chat');
  };

  const openAuthModal = (mode = 'login', emailPrefill = '') => {
    setAuthInitialMode(mode);
    setAuthInitialEmail(emailPrefill || '');
    setIsAuthOpen(true);
  };

  const handleCompleteOnboarding = (chosenName) => {
    setGuideName(chosenName);
    setShowOnboarding(false);
    // Dispara evento para o Navbar atualizar o nome instantaneamente
    window.dispatchEvent(new Event('storage'));
  };

  const handleStartChat = () => {
    if (topicRoute && typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      setTopicRoute(null);
    }
    if (!user) {
      openAuthModal('login', '');
    } else {
      setActiveTab('chat');
    }
  };

  const handleNavigateTopic = (slug) => {
    if (!slug) return;
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/temas/${encodeURIComponent(slug)}`);
    }
    setTopicRoute({ slug });
  };

  const handleBackFromTopic = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
    setTopicRoute(null);
    setActiveTab('landing');
  };

  // PÁGINAS PÚBLICAS DE TRILHAS TEMÁTICAS INDEXÁVEIS (/temas/:slug)
  if (topicRoute) {
    return (
      <Suspense fallback={<LazyFallbackLoader />}>
        <TopicLandingPage
          slug={topicRoute.slug}
          user={user}
          onStartChat={handleStartChat}
          onBackToHome={handleBackFromTopic}
          onNavigateTopic={handleNavigateTopic}
        />
        <AuthModal
          isOpen={isAuthOpen}
          initialMode={authInitialMode}
          initialEmail={authInitialEmail}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(loggedUser, savedProfile) => {
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, '', '/');
            }
            setTopicRoute(null);
            handleAuthSuccess(loggedUser, savedProfile);
          }}
        />
      </Suspense>
    );
  }

  // PÁGINA NOVA E INDEPENDENTE DE FICHA DE INSCRIÇÃO SIMPLES (/inscricao)
  if (isInscriptionRoute) {
    return (
      <Suspense fallback={<LazyFallbackLoader />}>
        <SimpleInscriptionPage />
      </Suspense>
    );
  }

  // PÁGINA DEDICADA DE CADASTRO DIRETO POR LINK (/cadastro ou /cadastro/:slug)
  if (directSignupRoute) {
    return (
      <Suspense fallback={<LazyFallbackLoader />}>
        <DirectSignupPage
          slug={directSignupRoute.slug}
          currentUser={user}
          onEnterApp={(loggedUser, savedProfile) => {
            handleAuthSuccess(loggedUser, savedProfile);
          }}
          onOpenLogin={(emailPrefill) => {
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, '', '/');
            }
            setDirectSignupRoute(null);
            openAuthModal('login', emailPrefill);
          }}
          onBackToHome={() => {
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, '', '/');
            }
            setDirectSignupRoute(null);
            setActiveTab('landing');
          }}
        />

        <AuthModal
          isOpen={isAuthOpen}
          initialMode={authInitialMode}
          initialEmail={authInitialEmail}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </Suspense>
    );
  }

  // BLOQUEIO DE ACESSO PELO SUPERADMIN
  if (user && profile && profile.is_active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 text-center font-sans">
        <div className="max-w-md p-8 sm:p-10 rounded-4xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 shadow-2xl space-y-4 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-medium text-stone-900 dark:text-stone-50">
            Acesso Temporariamente Suspenso
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-serif leading-relaxed">
            O acesso ao seu refúgio pessoal está temporariamente inativo por decisão administrativa ou pendência cadastral.
          </p>
          <div className="pt-4 space-y-2.5">
            <a
              href="mailto:suporte@lynxems.com.br"
              className="w-full py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold tracking-wide shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2"
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Falar com o Suporte Oficial</span>
            </a>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-2xl bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-xs font-medium text-stone-600 dark:text-stone-300 transition"
            >
              Encerrar Sessão
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 flex flex-col font-sans selection:bg-teal-700/20 selection:text-teal-900 dark:selection:text-teal-200 transition-colors duration-300 ${
        activeTab === 'chat' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-[100dvh] pb-20 md:pb-0'
      }`}
    >
      {/* ONBOARDING DO GUIA (Primeiro Acesso) */}
      {showOnboarding && (
        <Suspense fallback={null}>
          <WelcomeOnboarding
            userName={profile?.full_name || user?.email?.split('@')[0] || 'Viajante'}
            onComplete={handleCompleteOnboarding}
          />
        </Suspense>
      )}

      {/* BARRA SUPERIOR FIXA (NAVBAR) - Permanece sempre visível no topo da tela durante a navegação */}
      <div className={`sticky top-0 z-50 w-full shrink-0 ${activeTab === 'chat' ? 'hidden md:block' : ''}`}>
        <Navbar
          user={user}
          profile={profile}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if ((tab === 'chat' || tab === 'admin') && !user) {
              openAuthModal('login', '');
              return;
            }
            setActiveTab(tab);
          }}
          onOpenAuth={() => openAuthModal('login', '')}
          onLogout={handleLogout}
          onOpenOnboarding={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
          systemSettings={systemSettings}
        />
      </div>

      {/* ROTEAMENTO PRINCIPAL */}
      <main className={`flex-1 flex flex-col ${activeTab === 'chat' ? 'min-h-0 overflow-hidden' : ''}`}>
        {activeTab === 'landing' && (
          <LandingPage
            onStartChat={handleStartChat}
            user={user}
            systemSettings={systemSettings}
            onOpenTopic={handleNavigateTopic}
          />
        )}

        {activeTab === 'chat' && (
          <>
            {user ? (
              <ReflectionSpace
                user={profile || user}
                onEditGuideName={() => setIsSettingsOpen(true)}
                onBackToHome={() => setActiveTab('landing')}
                systemSettings={systemSettings}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div className="max-w-md p-8 rounded-4xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 shadow-xl space-y-4">
                  <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-100">
                    Sua Mentoria Pessoal
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    Para que seus momentos de reflexão e desenvolvimento fiquem guardados com total sigilo e continuidade, entre na sua conta.
                  </p>
                  <button
                    onClick={() => openAuthModal('login', '')}
                    className="w-full py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs tracking-wide shadow-md shadow-teal-700/20 transition"
                  >
                    Acessar Mentoria
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'admin' && (
          <>
            {profile?.role === 'master' || profile?.role === 'admin' || user?.email === 'edsonmanoel2012@gmail.com' ? (
              <Suspense fallback={<LazyFallbackLoader />}>
                <AdminDashboard currentUser={profile || { ...user, role: 'master' }} />
              </Suspense>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div className="max-w-md p-8 rounded-4xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
                  <h3 className="text-xl font-serif font-medium text-rose-600 dark:text-rose-400 mb-2">
                    Acesso Reservado
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
                    Esta área é exclusiva para a administração do ecossistema.
                  </p>
                  <button
                    onClick={() => setActiveTab('landing')}
                    className="px-6 py-2.5 rounded-xl bg-stone-200 dark:bg-slate-700 hover:bg-stone-300 font-medium text-xs transition"
                  >
                    Voltar para a Mentoria
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'incomodo' && (
          <>
            {user ? (
              <Suspense fallback={<LazyFallbackLoader />}>
                <CreativeTroubleLab
                  user={profile || user}
                  profile={profile}
                  onBackToChat={() => setActiveTab('chat')}
                />
              </Suspense>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div className="max-w-md p-8 rounded-4xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 shadow-xl space-y-4">
                  <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-100">
                    Laboratório do Incômodo Criativo
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    Para mapear e transformar seus incômodos com a metodologia e ter seus diagnósticos guardados, acesse sua conta.
                  </p>
                  <button
                    onClick={() => openAuthModal('login', '')}
                    className="w-full py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs tracking-wide shadow-md shadow-teal-700/20 transition"
                  >
                    Entrar ou Criar Conta
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL DE ENTRADA / CADASTRO */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authInitialMode}
        initialEmail={authInitialEmail}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* MODAIS SECUNDÁRIOS CARREGADOS SOB DEMANDA */}
      <Suspense fallback={null}>
        {isResetPasswordOpen && (
          <ResetPasswordModal
            isOpen={isResetPasswordOpen}
            tokenHash={resetTokenHash}
            onClose={() => {
              setIsResetPasswordOpen(false);
              setResetTokenHash('');
            }}
            onOpenForgot={() => openAuthModal('forgot', '')}
          />
        )}

        {user && isProfileOpen && (
          <UserProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            user={user}
            profile={profile}
            onProfileUpdated={(updated) => setProfile(updated)}
          />
        )}

        {isSettingsOpen && (
          <UserSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            user={user}
            profile={profile}
            onProfileUpdated={(updated) => setProfile(updated)}
            onGuideNameChanged={(newName) => {
              setGuideName(newName);
              window.dispatchEvent(new Event('storage'));
            }}
          />
        )}

        {isFeedbackOpen && (
          <SubscriberFeedbackModal
            isOpen={isFeedbackOpen}
            onClose={() => setIsFeedbackOpen(false)}
            user={user}
            profile={profile}
          />
        )}
      </Suspense>

      {/* MENU INFERIOR FIXO PARA CELULARES E TABLETS (BOTTOM NAVIGATION BAR) */}
      <MobileBottomNav
        activeTab={activeTab}
        onNavigate={(tab) => {
          if ((tab === 'chat' || tab === 'admin') && !user) {
            openAuthModal('login', '');
            return;
          }
          setActiveTab(tab);
        }}
        onOpenProfile={() => {
          if (!user) {
            openAuthModal('login', '');
          } else {
            setIsProfileOpen(true);
          }
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        user={user}
        profile={profile}
        systemSettings={systemSettings}
      />

      {/* MODAL JURÍDICO DE TERMOS OBRIGATÓRIOS PARA USUÁRIOS LOGADOS */}
      {user && profile && (
        <TermsOfUseModal
          isOpen={isTermsPromptOpen}
          onClose={() => setIsTermsPromptOpen(false)}
          onAccept={handleAcceptTerms}
          alreadyAccepted={profile.terms_accepted === true}
        />
      )}
    </div>
  );
}
