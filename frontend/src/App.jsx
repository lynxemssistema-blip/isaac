import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { supabase } from './services/supabase';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ReflectionSpace from './components/ReflectionSpace';
import AuthModal from './components/AuthModal';
import MobileBottomNav from './components/MobileBottomNav';
import TermsOfUseModal, { TERMS_VERSION } from './components/TermsOfUseModal';
import { AlertTriangle, LifeBuoy, Loader2 } from 'lucide-react';
import { applyAppTheme, getCurrentTheme, MULTI_THEME_ENABLED, LOCKED_ACTIVE_THEME_ID } from './services/themeService';
import { fetchSystemSettings, acceptTermsOfUseApi } from './services/adminApi';
import { humanVoiceService } from './services/voiceService';

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
const WhatsappPlanModal = lazyWithRetry(() => import('./components/WhatsappPlanModal'));
const TopicLandingPage = lazyWithRetry(() => import('./components/TopicLandingPage'));
const SuperAdminEbooksPage = lazyWithRetry(() => import('./components/SuperAdminEbooksPage'));
const EbookSalesPage = lazyWithRetry(() => import('./components/EbookSalesPage'));
const EbookDownloadPage = lazyWithRetry(() => import('./components/EbookDownloadPage'));
const EbookCartDrawer = lazyWithRetry(() => import('./components/EbookCartDrawer'));

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

function parseSuperAdminEbooksLocation() {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname || '/';
  const searchParams = new URLSearchParams(window.location.search);
  if (/^\/(?:superadmin\/)?ebooks(?:\/.*)?$/i.test(pathname)) {
    return true;
  }
  return searchParams.has('superadmin_ebooks');
}

function parseEbookStoreLocation() {
  if (typeof window === 'undefined') return null;
  const pathname = window.location.pathname || '/';
  const match = pathname.match(/^\/(?:loja\/ebooks|biblioteca|leituras|acervo)(?:\/([^/?#]+))?\/?$/i);
  if (match) {
    return { slug: decodeURIComponent(match[1] || '').trim() };
  }
  return null;
}

function parseEbookDownloadLocation() {
  if (typeof window === 'undefined') return null;
  const pathname = window.location.pathname || '/';
  const match = pathname.match(/^\/meus-ebooks\/([^/?#]+)\/?$/i);
  if (match) {
    return { token: decodeURIComponent(match[1] || '').trim() };
  }
  return null;
}

function parseAdminLocation() {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname || '/';
  return /^\/admin(?:\/.*)?$/i.test(pathname);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState(() => (parseAdminLocation() ? 'admin' : 'landing')); // 'landing' | 'chat' | 'admin' | 'incomodo'
  const [directSignupRoute, setDirectSignupRoute] = useState(() => parseDirectSignupLocation());
  const [isInscriptionRoute, setIsInscriptionRoute] = useState(() => parseInscriptionLocation());
  const [topicRoute, setTopicRoute] = useState(() => parseTopicLocation());
  const [isSuperAdminEbooksRoute, setIsSuperAdminEbooksRoute] = useState(() => parseSuperAdminEbooksLocation());
  const [ebookStoreRoute, setEbookStoreRoute] = useState(() => parseEbookStoreLocation());
  const [ebookDownloadRoute, setEbookDownloadRoute] = useState(() => parseEbookDownloadLocation());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('login');
  const [authInitialEmail, setAuthInitialEmail] = useState('');
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetTokenHash, setResetTokenHash] = useState('');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWhatsappPlanOpen, setIsWhatsappPlanOpen] = useState(false);
  const [isTermsPromptOpen, setIsTermsPromptOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [systemSettings, setSystemSettings] = useState(null);

  const normalizeGuideName = (val) => {
    const clean = String(val || '').trim();
    if (!clean || /^izaque$/i.test(clean)) return 'Isaac';
    return clean;
  };

  // Estado do Onboarding do Guia
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [guideName, setGuideName] = useState(() => {
    const raw = localStorage.getItem('isaac_guide_name') || localStorage.getItem('izaque_guide_name') || 'Isaac';
    const normalized = normalizeGuideName(raw);
    if (raw !== normalized) {
      localStorage.setItem('isaac_guide_name', normalized);
      localStorage.setItem('izaque_guide_name', normalized);
    }
    return normalized;
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
        const isEdsonOrMaster =
          String(data.email || currentUser.email || '').toLowerCase() === 'edsonmanoel2012@gmail.com' ||
          data.role === 'master';

        // Sincroniza preferências do banco de dados (Supabase) com o localStorage e estado local
        if (data.preferences && typeof data.preferences === 'object') {
          const p = data.preferences;
          if (p.guide_name) {
            const safeGuide = normalizeGuideName(p.guide_name);
            localStorage.setItem('isaac_guide_name', safeGuide);
            localStorage.setItem('izaque_guide_name', safeGuide);
            setGuideName(safeGuide);
          }
          if (p.ambient_track) localStorage.setItem('izaque_ambient_track', p.ambient_track);
          if (p.ambient_volume !== undefined) localStorage.setItem('izaque_ambient_volume', p.ambient_volume.toString());
          if (p.ambient_enabled !== undefined) localStorage.setItem('izaque_ambient_enabled', p.ambient_enabled ? 'true' : 'false');
          if (p.immersive_voice !== undefined) localStorage.setItem('izaque_immersive_voice', p.immersive_voice ? 'true' : 'false');
          if (!MULTI_THEME_ENABLED) {
            localStorage.setItem('isaac_app_theme', LOCKED_ACTIVE_THEME_ID);
            localStorage.setItem('izaque_app_theme', LOCKED_ACTIVE_THEME_ID);
            applyAppTheme(LOCKED_ACTIVE_THEME_ID);
          } else if (p.app_theme) {
            localStorage.setItem('izaque_app_theme', p.app_theme);
            applyAppTheme(p.app_theme);
          }

          // REGRA MESTRE: Parâmetros de voz/leitor seguem SEMPRE os ajustes do Edson para todos os casos
          if (isEdsonOrMaster) {
            humanVoiceService.saveSettings({
              voiceEngine: p.voice_engine || 'gemini',
              geminiVoice: p.gemini_voice || 'Aoede',
              voiceURI: p.voice_uri ?? '',
              gender: p.voice_gender || 'male',
              rate: p.voice_rate !== undefined ? Number(p.voice_rate) : 0.90,
              pitch: p.voice_pitch !== undefined ? Number(p.voice_pitch) : 0.95,
              preferBrowser: p.prefer_browser !== undefined ? Boolean(p.prefer_browser) : (p.voice_engine === 'browser'),
            });
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
      setIsSuperAdminEbooksRoute(parseSuperAdminEbooksLocation());
      setEbookStoreRoute(parseEbookStoreLocation());
      setEbookDownloadRoute(parseEbookDownloadLocation());
      if (parseAdminLocation()) {
        setActiveTab('admin');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (
      directSignupRoute ||
      isInscriptionRoute ||
      topicRoute ||
      isSuperAdminEbooksRoute ||
      ebookStoreRoute ||
      ebookDownloadRoute
    ) {
      return;
    }
    if (activeTab === 'landing') {
      document.title = 'Plataforma ISAAC — Clareza Emocional, Escuta Profunda & Transformação 24h';
    } else if (activeTab === 'chat') {
      document.title = `${guideName || 'Isaac'} • Espaço da Plataforma — ISAAC`;
    } else if (activeTab === 'incomodo') {
      document.title = 'Laboratório do Incômodo Criativo — Plataforma ISAAC';
    } else if (activeTab === 'admin') {
      document.title = 'Painel Administrativo — Plataforma ISAAC';
    }
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [
    activeTab,
    guideName,
    directSignupRoute,
    isInscriptionRoute,
    topicRoute,
    isSuperAdminEbooksRoute,
    ebookStoreRoute,
    ebookDownloadRoute,
  ]);

  useEffect(() => {
    // Carrega Parâmetros Globais do Sistema (Superadmin)
    fetchSystemSettings().then((res) => {
      if (res) {
        setSystemSettings(res);
        const savedTheme = localStorage.getItem('isaac_app_theme') || localStorage.getItem('izaque_app_theme');
        const themeToApply = !MULTI_THEME_ENABLED
          ? LOCKED_ACTIVE_THEME_ID
          : (!res.show_theme_selector || !savedTheme)
            ? (res.default_theme || LOCKED_ACTIVE_THEME_ID)
            : savedTheme;
        applyAppTheme(themeToApply);
        localStorage.setItem('isaac_app_theme', themeToApply);
        localStorage.setItem('izaque_app_theme', themeToApply);

        // Aplica SEMPRE os parâmetros globais de voz/áudio herdados da conta do Edson para todos os casos
        humanVoiceService.applySystemMasterSettings(res);

        // Define trilha e guia padrão se o usuário for novo
        if (!localStorage.getItem('izaque_ambient_track') && res.default_ambient_track) {
          localStorage.setItem('izaque_ambient_track', res.default_ambient_track);
        }
        if (!localStorage.getItem('izaque_guide_name') && res.default_guide_name) {
          localStorage.setItem('isaac_guide_name', res.default_guide_name);
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
        humanVoiceService.applySystemMasterSettings(e.detail);
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
          Boolean(parseTopicLocation()) ||
          parseSuperAdminEbooksLocation() ||
          Boolean(parseEbookStoreLocation()) ||
          Boolean(parseEbookDownloadLocation());
        if (!onPublicRoute) {
          if (parseAdminLocation()) {
            setActiveTab('admin');
          } else {
            // REQUISITO: Usuário autenticado já abre direto na página de conversa com ISAAC
            setActiveTab('chat');
          }
        }
      } else {
        setLoadingProfile(false);
        if (parseAdminLocation()) {
          setIsAuthOpen(true);
        }
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
    setActiveTab(parseAdminLocation() ? 'admin' : 'chat');
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

  const handleOpenEbookStore = (slug = '') => {
    const cleanSlug = typeof slug === 'string' ? slug.trim() : '';
    const targetPath = cleanSlug ? `/loja/ebooks/${encodeURIComponent(cleanSlug)}` : '/loja/ebooks';
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', targetPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setEbookStoreRoute({ slug: cleanSlug });
    setEbookDownloadRoute(null);
    setIsSuperAdminEbooksRoute(false);
    setTopicRoute(null);
  };

  const handleOpenSuperAdminEbooks = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/ebooks');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsSuperAdminEbooksRoute(true);
    setEbookStoreRoute(null);
    setEbookDownloadRoute(null);
  };

  const handleBackFromEbookStore = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setEbookStoreRoute(null);
    setEbookDownloadRoute(null);
    setActiveTab('landing');
  };

  // PORTAL DO COMPRADOR DE EBOOKS (/meus-ebooks/:token)
  if (ebookDownloadRoute) {
    return (
      <Suspense fallback={<LazyFallbackLoader />}>
        <EbookDownloadPage
          token={ebookDownloadRoute.token}
          onBackToHome={handleBackFromEbookStore}
          onOpenStore={() => handleOpenEbookStore('')}
        />
      </Suspense>
    );
  }

  // LOJA PÚBLICA E PÁGINAS DEDICADAS DE VENDA DE EBOOKS (/loja/ebooks e /loja/ebooks/:slug)
  if (ebookStoreRoute) {
    return (
      <Suspense fallback={<LazyFallbackLoader />}>
        <EbookSalesPage
          slug={ebookStoreRoute.slug}
          onNavigateSlug={(nextSlug) => handleOpenEbookStore(nextSlug)}
          onBackToHome={handleBackFromEbookStore}
          user={user}
          profile={profile}
        />
        <EbookCartDrawer user={user} profile={profile} />
      </Suspense>
    );
  }

  // PÁGINA ISOLADA E EXCLUSIVA SUPERADMIN: ACERVO DE EBOOKS SEGMENTADOS (/ebooks ou /superadmin/ebooks)
  if (isSuperAdminEbooksRoute) {
    return (
      <Suspense fallback={<LazyFallbackLoader />}>
        <SuperAdminEbooksPage
          user={user}
          profile={profile}
          loadingProfile={loadingProfile}
          onOpenLogin={() => openAuthModal('login', '')}
          onBackToApp={() => {
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/');
            }
            setIsSuperAdminEbooksRoute(false);
          }}
        />
        <AuthModal
          isOpen={isAuthOpen}
          initialMode={authInitialMode}
          initialEmail={authInitialEmail}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(loggedUser, savedProfile) => {
            setUser(loggedUser);
            if (savedProfile) setProfile(savedProfile);
            loadUserProfile(loggedUser);
            setIsAuthOpen(false);
          }}
        />
      </Suspense>
    );
  }

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
        <SimpleInscriptionPage
          onBackToHome={() => {
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            setIsInscriptionRoute(false);
            setActiveTab('landing');
          }}
        />
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

  const navigateToTab = (tab) => {
    if ((tab === 'chat' || tab === 'admin' || tab === 'incomodo') && !user) {
      openAuthModal('login', '');
      return;
    }
    if (typeof window !== 'undefined') {
      if (tab === 'admin' && window.location.pathname !== '/admin') {
        window.history.pushState({}, '', '/admin');
      } else if (tab !== 'admin' && /^\/admin(?:\/.*)?$/i.test(window.location.pathname || '')) {
        window.history.pushState({}, '', '/');
      }
    }
    setActiveTab(tab);
  };

  return (
    <div
      className={`bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 flex flex-col font-sans selection:bg-teal-700/20 selection:text-teal-900 dark:selection:text-teal-200 transition-colors duration-300 ${
        activeTab === 'chat' ? 'h-ios-dvh max-h-[100dvh] overflow-hidden' : 'min-h-ios-dvh pb-20 md:pb-0'
      }`}
    >
      {/* ONBOARDING DO GUIA (Primeiro Acesso) */}
      {showOnboarding && (
        <Suspense fallback={null}>
          <WelcomeOnboarding
            userName={profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Viajante'}
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
          setActiveTab={navigateToTab}
          onOpenAuth={() => openAuthModal('login', '')}
          onLogout={handleLogout}
          onOpenOnboarding={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
          onOpenWhatsappPlan={() => setIsWhatsappPlanOpen(true)}
          onOpenEbookStore={(slug) => handleOpenEbookStore(typeof slug === 'string' ? slug : '')}
          onOpenSuperAdminEbooks={handleOpenSuperAdminEbooks}
          systemSettings={systemSettings}
        />
      </div>

      {/* ROTEAMENTO PRINCIPAL */}
      <main className={`flex-1 flex flex-col ${activeTab === 'chat' ? 'min-h-0 overflow-hidden' : ''}`}>
        {activeTab === 'landing' && (
          <LandingPage
            onStartChat={handleStartChat}
            onOpenPlans={() => setIsWhatsappPlanOpen(true)}
            user={user}
            systemSettings={systemSettings}
            onOpenTopic={handleNavigateTopic}
            onOpenEbookStore={(slug) => handleOpenEbookStore(typeof slug === 'string' ? slug : '')}
          />
        )}

        {activeTab === 'chat' && (
          <>
            {user ? (
              <ReflectionSpace
                user={profile || user}
                onEditGuideName={() => setIsSettingsOpen(true)}
                onBackToHome={() => navigateToTab('landing')}
                systemSettings={systemSettings}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div className="max-w-md p-8 rounded-4xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 shadow-xl space-y-4">
                  <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-100">
                    Sua Plataforma Pessoal
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                    Para que seus momentos de reflexão e desenvolvimento fiquem guardados com total sigilo e continuidade, entre na sua conta.
                  </p>
                  <button
                    onClick={() => openAuthModal('login', '')}
                    className="w-full py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs tracking-wide shadow-md shadow-teal-700/20 transition"
                  >
                    Acessar Plataforma
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
                    onClick={() => navigateToTab('landing')}
                    className="px-6 py-2.5 rounded-xl bg-stone-200 dark:bg-slate-700 hover:bg-stone-300 font-medium text-xs transition"
                  >
                    Voltar para a Plataforma
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
            onOpenWhatsappPlan={() => setIsWhatsappPlanOpen(true)}
            onOpenSettings={() => {
              setIsProfileOpen(false);
              setIsSettingsOpen(true);
            }}
            onOpenFeedback={() => {
              setIsProfileOpen(false);
              setIsFeedbackOpen(true);
            }}
            onLogout={() => {
              setIsProfileOpen(false);
              handleLogout();
            }}
          />
        )}

        {isWhatsappPlanOpen && (
          <WhatsappPlanModal
            isOpen={isWhatsappPlanOpen}
            onClose={() => setIsWhatsappPlanOpen(false)}
            user={user}
            profile={profile}
            onProfileUpdated={(updated) => setProfile(updated)}
            onOpenAuth={() => {
              setIsWhatsappPlanOpen(false);
              openAuthModal('login', '');
            }}
          />
        )}

        {isSettingsOpen && (
          <UserSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            user={user}
            profile={profile}
            systemSettings={systemSettings}
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

        <EbookCartDrawer
          user={user}
          profile={profile}
          hideFloatingButton={activeTab === 'chat'}
        />
      </Suspense>

      {/* MENU INFERIOR FIXO PARA CELULARES E TABLETS (BOTTOM NAVIGATION BAR) */}
      <MobileBottomNav
        activeTab={activeTab}
        onNavigate={navigateToTab}
        onOpenProfile={() => {
          if (!user) {
            openAuthModal('login', '');
          } else {
            setIsProfileOpen(true);
          }
        }}
        onOpenPlans={() => setIsWhatsappPlanOpen(true)}
        onOpenEbookStore={(slug) => handleOpenEbookStore(typeof slug === 'string' ? slug : '')}
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
