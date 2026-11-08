import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Feather,
  Mic,
  MicOff,
  Send,
  Heart,
  Wind,
  Smile,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sliders,
  Check,
  CheckCheck,
  Music,
  Headphones,
  Sparkles,
  Sun,
  Moon,
  Coffee,
  Loader2,
  ArrowLeft,
  Palette,
  X,
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  ListPlus,
  History,
  Clock,
  Compass,
  ChevronRight,
  HelpCircle,
  Pin,
} from 'lucide-react';
import {
  sendChatMessage,
  sendChatMessageStream,
  sendAudioChatMessage,
  fetchActiveAgents,
  fetchChatHistory,
  clearChatHistory,
  cleanTextForSpeech,
  updateUserProfile,
  fetchUserSessions,
  createUserSession,
  updateUserSession,
  deleteUserSession,
  fetchPublicGuidedConversations,
} from '../services/api';
import { fetchSystemSettings } from '../services/adminApi';
import { ambientAudio } from '../services/ambientAudioService';
import { humanVoiceService, unlockHtmlAudioElement } from '../services/voiceService';
import { THEMES, saveAppTheme, getCurrentTheme } from '../services/themeService';

const LazyUserSettingsModal = React.lazy(() => import('./UserSettingsModal'));

const CHAT_VIRTUAL_WINDOW_STEP = 30;

/**
 * Skeleton Screen Assimétrico de Bolhas de Chat (Feedback Visual Assíncrono sem travamento)
 */
function ChatHistorySkeleton() {
  return (
    <div className="space-y-4 py-2 animate-pulse" aria-label="Carregando histórico da conversa">
      <div className="flex flex-col items-start">
        <div className="w-[82%] sm:w-96 p-4 rounded-3xl rounded-tl-sm bg-white/80 dark:bg-slate-800/70 border border-stone-200/70 dark:border-slate-700/60 space-y-2.5">
          <div className="h-2.5 w-24 rounded-full bg-stone-200 dark:bg-slate-700" />
          <div className="h-3 w-full rounded-full bg-stone-200/90 dark:bg-slate-700/80" />
          <div className="h-3 w-5/6 rounded-full bg-stone-200/80 dark:bg-slate-700/70" />
          <div className="h-3 w-2/3 rounded-full bg-stone-200/70 dark:bg-slate-700/60" />
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="w-[68%] sm:w-72 p-4 rounded-3xl rounded-tr-sm bg-teal-700/20 dark:bg-teal-600/20 border border-teal-600/20 space-y-2">
          <div className="h-3 w-full rounded-full bg-teal-700/25 dark:bg-teal-400/20" />
          <div className="h-3 w-3/4 rounded-full bg-teal-700/20 dark:bg-teal-400/15" />
        </div>
      </div>
      <div className="flex flex-col items-start">
        <div className="w-[88%] sm:w-[28rem] p-4 rounded-3xl rounded-tl-sm bg-white/80 dark:bg-slate-800/70 border border-stone-200/70 dark:border-slate-700/60 space-y-2.5">
          <div className="h-2.5 w-28 rounded-full bg-stone-200 dark:bg-slate-700" />
          <div className="h-3 w-full rounded-full bg-stone-200/90 dark:bg-slate-700/80" />
          <div className="h-3 w-11/12 rounded-full bg-stone-200/80 dark:bg-slate-700/70" />
        </div>
      </div>
    </div>
  );
}

/**
 * Indicador de Reflexão Humanizado
 * Substitui o loading mecânico por um momento de escuta atenta e compassiva
 */
function ReflectingIndicator({ guideName = 'Isaac' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex items-center gap-3.5 py-3 px-5 rounded-3xl bg-white/80 dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/60 max-w-sm my-2 shadow-sm"
    >
      <div className="w-8 h-8 rounded-full bg-teal-700/10 dark:bg-teal-500/15 flex items-center justify-center text-teal-800 dark:text-teal-400 shrink-0">
        <Wind className="w-4 h-4 animate-breathe" />
      </div>

      <div className="flex flex-col">
        <span className="text-xs sm:text-sm font-serif text-stone-700 dark:text-stone-200">
          {guideName} está refletindo com cuidado...
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-700/60 dark:bg-teal-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-teal-700/60 dark:bg-teal-400/60 animate-bounce" style={{ animationDelay: '250ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-teal-700/60 dark:bg-teal-400/60 animate-bounce" style={{ animationDelay: '500ms' }} />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Botão de Ouvir Reflexão com Breathing UI e Audio Ducking
 */
function VoiceReflectionButton({ text, messageId, isPlaying, isAudioLoading, onTogglePlay }) {
  return (
    <div className="mt-3 pt-3 border-t border-stone-100 dark:border-slate-700/40 flex items-center justify-between">
      <motion.button
        type="button"
        onClick={onTogglePlay}
        disabled={isAudioLoading}
        animate={
          isPlaying
            ? {
                scale: [1, 1.03, 1],
                boxShadow: [
                  '0 0 0px rgba(20, 184, 166, 0)',
                  '0 0 14px rgba(20, 184, 166, 0.35)',
                  '0 0 0px rgba(20, 184, 166, 0)',
                ],
              }
            : {}
        }
        transition={
          isPlaying
            ? {
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : {}
        }
        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-2 border ${
          isPlaying
            ? 'bg-teal-700 text-white border-teal-700 shadow-md'
            : 'bg-stone-100 dark:bg-slate-750 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-slate-700 hover:border-teal-600 hover:text-teal-800 dark:hover:text-teal-300'
        }`}
      >
        {isAudioLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
            <span>Preparando voz calma...</span>
          </>
        ) : isPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pausar Voz</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5" />
            <span>Ouvir Reflexão</span>
          </>
        )}
      </motion.button>

      {isPlaying && (
        <span className="text-[10px] text-teal-700 dark:text-teal-400 font-serif italic flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Voz Humanizada Ativa
        </span>
      )}
    </div>
  );
}

export default function ReflectionSpace({ user, onEditGuideName, onBackToHome, systemSettings: propSystemSettings }) {
  const [systemSettings, setSystemSettings] = useState(propSystemSettings || null);

  useEffect(() => {
    if (propSystemSettings) {
      setSystemSettings(propSystemSettings);
    } else {
      fetchSystemSettings().then((res) => {
        if (res) setSystemSettings(res);
      }).catch(() => {});
    }

    const handleSettingsUpdated = (e) => {
      if (e.detail) setSystemSettings(e.detail);
    };
    window.addEventListener('system-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('system-settings-updated', handleSettingsUpdated);
  }, [propSystemSettings]);

  const isSuperAdmin =
    user?.role === 'master' ||
    user?.email === 'edsonmanoel2012@gmail.com';
  const canShowTheme = isSuperAdmin || (systemSettings ? systemSettings.show_theme_selector !== false : true);
  const canShowSettings = isSuperAdmin || (systemSettings ? systemSettings.show_settings_button !== false : true);
  const canShowAmbient = isSuperAdmin || (systemSettings ? systemSettings.show_ambient_sound_button !== false : true);

  const [guideName, setGuideName] = useState(() => {
    const raw = localStorage.getItem('isaac_guide_name') || localStorage.getItem('izaque_guide_name') || 'Isaac';
    return /^izaque$/i.test(String(raw).trim()) ? 'Isaac' : raw;
  });

  useEffect(() => {
    const syncGuideName = () => {
      const raw = localStorage.getItem('isaac_guide_name') || localStorage.getItem('izaque_guide_name') || 'Isaac';
      setGuideName(/^izaque$/i.test(String(raw).trim()) ? 'Isaac' : raw);
    };
    window.addEventListener('storage', syncGuideName);
    return () => window.removeEventListener('storage', syncGuideName);
  }, []);

  const [reflections, setReflections] = useState([
    {
      id: 'initial',
      role: 'guide',
      content: `Olá... Respire fundo e sinta-se em paz. Este é o seu refúgio pessoal, livre de cobranças ou julgamentos do mundo lá fora.\n\nO que tem pesado na sua mente ou no seu coração ultimamente?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      memoriesRecalled: 0,
      knowledgeApplied: 0,
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isReflecting, setIsReflecting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Agentes Especialistas e Perguntas Prontas de Condução
  const [activeAgents, setActiveAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('auto');

  // Multi-Sessões de Conversa com Memória Global Unificada
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isSessionsDrawerOpen, setIsSessionsDrawerOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitleText, setEditingTitleText] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Fixação (Pin) do Painel Lateral
  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    return localStorage.getItem('izaque_sidebar_pinned') === 'true';
  });

  const [isDesktop, setIsDesktop] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Se o usuário deixou fixado anteriormente e está no desktop, abre o painel fixado por padrão
  useEffect(() => {
    if (isSidebarPinned && typeof window !== 'undefined' && window.innerWidth >= 768) {
      setIsSessionsDrawerOpen(true);
    }
  }, []);

  const isDocked = Boolean(isSidebarPinned && isDesktop && isSessionsDrawerOpen);

  const handleTogglePin = () => {
    setIsSidebarPinned((prev) => {
      const next = !prev;
      localStorage.setItem('izaque_sidebar_pinned', String(next));
      if (next) {
        setIsSessionsDrawerOpen(true);
      }
      return next;
    });
  };

  // Conversas Direcionadas Criadas pelo Superadmin
  const [guidedConversations, setGuidedConversations] = useState([]);
  const [activeGuidedTopic, setActiveGuidedTopic] = useState(null);

  useEffect(() => {
    fetchActiveAgents().then((list) => {
      if (Array.isArray(list) && list.length > 0) {
        setActiveAgents(list);
      }
    });
  }, []);

  const activeAgent = selectedAgentId === 'auto'
    ? null
    : activeAgents.find((a) => a.id === selectedAgentId || a.slug === selectedAgentId);

  const currentStarterQuestions = React.useMemo(() => {
    const pinnedFirstQuestion = {
      id: 'starter-como-usar-isaac',
      text: 'Como devo usar o Isaac?',
      category: 'Como Começar',
    };

    // 1. Prioridade: Perguntas do Roteiro da Conversa Direcionada (Superadmin)
    if (activeGuidedTopic?.questions && Array.isArray(activeGuidedTopic.questions) && activeGuidedTopic.questions.length > 0) {
      const guidedList = activeGuidedTopic.questions
        .map((q, idx) => ({
          id: q.id || `guided-q-${idx}`,
          text: typeof q === 'string' ? q : (q.text || q.question || ''),
          category: activeGuidedTopic.category || 'Conversa Direcionada',
          isGuided: true,
        }))
        .filter((q) => q.text.trim().length > 0);
      return [
        pinnedFirstQuestion,
        ...guidedList.filter((q) => q.text.trim().toLowerCase() !== pinnedFirstQuestion.text.toLowerCase()),
      ];
    }

    let baseList = [];
    if (activeAgent) {
      baseList = Array.isArray(activeAgent.starter_questions) ? [...activeAgent.starter_questions] : [];
    } else {
      (activeAgents || []).forEach((ag) => {
        if (Array.isArray(ag.starter_questions)) {
          ag.starter_questions.slice(0, 2).forEach((q) => {
            baseList.push({
              ...q,
              agentName: ag.name,
              agentId: ag.id,
            });
          });
        }
      });
    }

    const deduplicated = baseList.filter(
      (q) => String(q?.text || '').trim().toLowerCase() !== pinnedFirstQuestion.text.toLowerCase()
    );

    return [pinnedFirstQuestion, ...deduplicated];
  }, [activeGuidedTopic, activeAgent, activeAgents]);

  const hasUserInteractedInChat = React.useMemo(
    () => reflections.some((r) => r.role === 'user'),
    [reflections]
  );

  const [showStarterQuestions, setShowStarterQuestions] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return false;
    }
    return localStorage.getItem('izaque_show_starters') !== 'false';
  });

  // Regra Mobile: Por padrão ocultas no celular, MAS se for a 1ª interação do usuário com o chat, ficam à mostra;
  // logo após a 1ª interação, recolhem automaticamente mantendo o botão para ver e usar quando quiser.
  const prevHasInteractedRef = useRef(false);
  const mobileInitSessionRef = useRef(null);
  useEffect(() => {
    if (loadingHistory) return;
    const isMobileViewport = typeof window !== 'undefined' ? window.innerWidth < 768 : !isDesktop;
    if (!isMobileViewport) return;

    const sessionKey = activeSessionId || 'guest';
    if (mobileInitSessionRef.current !== sessionKey) {
      mobileInitSessionRef.current = sessionKey;
      const isVeryFirstInteraction = !hasUserInteractedInChat && sessions.length <= 1;
      setShowStarterQuestions(isVeryFirstInteraction);
    } else if (hasUserInteractedInChat && !prevHasInteractedRef.current) {
      // Assim que ocorre a 1ª interação do usuário, recolhe automaticamente no celular
      setShowStarterQuestions(false);
    }
    prevHasInteractedRef.current = hasUserInteractedInChat;
  }, [loadingHistory, activeSessionId, hasUserInteractedInChat, sessions.length, isDesktop]);

  const handleSelectStarterQuestion = (questionText) => {
    if (!questionText || isReflecting) return;
    setInputVal('');
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowStarterQuestions(false);
    }
    handleSendReflection(null, questionText);
  };

  const [starterQuestionIndex, setStarterQuestionIndex] = useState(0);

  const handleNextStarterQuestions = () => {
    setStarterQuestionIndex((prev) => (prev + 2 >= currentStarterQuestions.length ? 0 : prev + 2));
  };

  const displayedQuestions = React.useMemo(() => {
    if (!currentStarterQuestions || currentStarterQuestions.length === 0) return [];
    const start = starterQuestionIndex % currentStarterQuestions.length;
    const slice = currentStarterQuestions.slice(start, start + 2);
    if (slice.length < 2 && currentStarterQuestions.length > 1) {
      slice.push(currentStarterQuestions[0]);
    }
    return slice;
  }, [currentStarterQuestions, starterQuestionIndex]);

  const handleToggleStarterQuestions = (val) => {
    setShowStarterQuestions(val);
    try {
      localStorage.setItem('izaque_show_starters', val ? 'true' : 'false');
    } catch (e) {}
  };

  // Estado e Controle Rápido do Som Ambiente Terapêutico
  const [isAmbientActive, setIsAmbientActive] = useState(() => {
    return localStorage.getItem('izaque_ambient_enabled') === 'true';
  });
  const [ambientTrack, setAmbientTrack] = useState(() => {
    return localStorage.getItem('izaque_ambient_track') || '432hz';
  });

  // Tema Visual e Menu Rápido de Estilos
  const [currentTheme, setCurrentTheme] = useState(() => getCurrentTheme());
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  // Sincroniza em tempo real se o som ambiente ou tema for alterado
  useEffect(() => {
    const syncAmbient = () => {
      const enabled = localStorage.getItem('izaque_ambient_enabled') === 'true';
      setIsAmbientActive(enabled);
      setAmbientTrack(localStorage.getItem('izaque_ambient_track') || '432hz');
    };
    const handleThemeEvent = (e) => {
      if (e.detail) setCurrentTheme(e.detail);
    };

    window.addEventListener('storage', syncAmbient);
    window.addEventListener('app-theme-changed', handleThemeEvent);
    return () => {
      window.removeEventListener('storage', syncAmbient);
      window.removeEventListener('app-theme-changed', handleThemeEvent);
    };
  }, []);

  const handleToggleAmbientQuick = () => {
    const nextState = !isAmbientActive;
    setIsAmbientActive(nextState);
    localStorage.setItem('izaque_ambient_enabled', nextState ? 'true' : 'false');

    if (nextState) {
      const vol = parseFloat(localStorage.getItem('izaque_ambient_volume') || '0.20');
      const track = localStorage.getItem('izaque_ambient_track') || '432hz';
      ambientAudio.setVolume(vol);
      ambientAudio.setTrack(track);
      ambientAudio.play();
    } else {
      ambientAudio.pause();
    }

    // Sincroniza também no Supabase se o usuário estiver logado
    if (user?.id) {
      updateUserProfile(user.id, {
        preferences: {
          ambient_enabled: nextState,
        },
      }).catch(() => {});
    }

    window.dispatchEvent(new Event('storage'));
  };


  // Carregar sessões e histórico persistente do banco de dados (Supabase izaque_chat_sessions & izaque_messages)
  useEffect(() => {
    if (!user?.id) {
      setLoadingHistory(false);
      return;
    }

    let isMounted = true;
    const initSessionsAndHistory = async () => {
      try {
        setLoadingHistory(true);
        const userSessions = await fetchUserSessions(user.id);
        if (!isMounted) return;

        setSessions(userSessions);

        const savedSessionId = localStorage.getItem('izaque_active_session_id');
        const matched = userSessions.find((s) => s.id === savedSessionId);
        const currentId = matched ? matched.id : (userSessions[0]?.id || null);

        setActiveSessionId(currentId);
        if (currentId) {
          localStorage.setItem('izaque_active_session_id', currentId);
          const historyData = await fetchChatHistory(user.id, currentId);
          if (isMounted) {
            if (historyData && historyData.length > 0) {
              setReflections(historyData);
            } else {
              const currentSessObj = userSessions.find((s) => s.id === currentId);
              setReflections([
                {
                  id: 'initial',
                  role: 'guide',
                  content: `Olá... Respire fundo e sinta-se em paz. Este é o seu espaço de reflexão dedicado a "${currentSessObj?.title || 'sua jornada'}", livre de cobranças ou julgamentos do mundo lá fora.\n\nO que tem pesado na sua mente ou no seu coração ultimamente?`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  memoriesRecalled: 0,
                  knowledgeApplied: 0,
                },
              ]);
            }
          }
        }
      } catch (err) {
        console.warn('Histórico persistido indisponível no momento:', err?.message);
      } finally {
        if (isMounted) {
          setLoadingHistory(false);
        }
      }
    };

    initSessionsAndHistory();

    // Carregar conversas direcionadas criadas pelo Superadmin
    fetchPublicGuidedConversations()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setGuidedConversations(data);
        }
      })
      .catch((err) => console.warn('Aviso ao buscar conversas direcionadas:', err));

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Sincronização contínua via HTTPS (sem depender de WebSocket Realtime do Supabase Self-Hosted)
  // Atualiza conversas originadas pelo WhatsApp ao focar a guia e a cada 15s enquanto a aba estiver visível
  useEffect(() => {
    if (!user?.id || !activeSessionId) return;

    let cancelled = false;
    const refreshCurrentSessionSilently = async () => {
      if (cancelled || isReflecting || document.visibilityState !== 'visible') return;
      try {
        const latest = await fetchChatHistory(user.id, activeSessionId);
        if (cancelled || !Array.isArray(latest) || latest.length === 0) return;
        setReflections((prev) => {
          if (latest.length < prev.length) return prev;
          const prevLastId = prev[prev.length - 1]?.id;
          const nextLastId = latest[latest.length - 1]?.id;
          if (latest.length === prev.length && prevLastId === nextLastId) {
            return prev;
          }
          return latest;
        });
      } catch {
        // Silencioso em segundo plano
      }
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshCurrentSessionSilently();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    const syncTimer = window.setInterval(refreshCurrentSessionSilently, 15000);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.clearInterval(syncTimer);
    };
  }, [user?.id, activeSessionId, isReflecting]);

  const handleSelectSession = async (sessionId) => {
    if (sessionId === activeSessionId || !user?.id) {
      setIsSessionsDrawerOpen(false);
      return;
    }

    try {
      setLoadingHistory(true);
      setVisibleWindowSize(CHAT_VIRTUAL_WINDOW_STEP);
      isUserNearBottomRef.current = true;
      setShowScrollBottomPill(false);
      setActiveSessionId(sessionId);
      localStorage.setItem('izaque_active_session_id', sessionId);
      setIsSessionsDrawerOpen(false);

      const sessionObj = sessions.find((s) => s.id === sessionId);
      const matchedGuided = guidedConversations.find(
        (g) => (sessionObj?.guided_conversation_id && g.id === sessionObj.guided_conversation_id) || g.title === sessionObj?.title
      );
      setActiveGuidedTopic(matchedGuided || null);

      const historyData = await fetchChatHistory(user.id, sessionId);
      if (historyData && historyData.length > 0) {
        setReflections(historyData);
      } else {
        const sessionObj = sessions.find((s) => s.id === sessionId);
        setReflections([
          {
            id: 'initial',
            role: 'guide',
            content: `Olá... Este é o espaço de reflexão dedicado a "${sessionObj?.title || 'esta conversa'}".\n\nFique à vontade para desabafar ou dar continuidade aos seus pensamentos com total sigilo.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            memoriesRecalled: 0,
            knowledgeApplied: 0,
          },
        ]);
      }
    } catch (err) {
      console.warn('Erro ao carregar sessão:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreateNewSession = async () => {
    if (!user?.id || isCreatingSession) return;
    setIsCreatingSession(true);
    try {
      const newSession = await createUserSession(user.id, 'Nova Reflexão');
      if (newSession) {
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setActiveGuidedTopic(null);
        localStorage.setItem('izaque_active_session_id', newSession.id);
        setReflections([
          {
            id: 'initial',
            role: 'guide',
            content: `Olá... Respire fundo. Iniciamos uma nova conversa para você organizar seus pensamentos e novos desafios.\n\nO que gostaria de trabalhar ou desabafar agora?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            memoriesRecalled: 0,
            knowledgeApplied: 0,
          },
        ]);
        setIsSessionsDrawerOpen(false);
      }
    } catch (err) {
      console.error('Erro ao criar sessão:', err);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleStartGuidedSession = async (guided) => {
    if (isCreatingSession) return;
    setIsCreatingSession(true);

    try {
      setIsSessionsDrawerOpen(false);

      if (guided.agent_slug && activeAgents.length > 0) {
        const targetAgent = activeAgents.find((a) => a.slug === guided.agent_slug);
        if (targetAgent) {
          setSelectedAgentId(targetAgent.id);
          setGuideName(targetAgent.name);
        }
      }

      let newSessionId = null;
      if (user?.id) {
        const newSess = await createUserSession(user.id, guided.title, guided.id);
        if (newSess) {
          newSessionId = newSess.id;
          setSessions((prev) => [newSess, ...prev]);
        }
      }

      setActiveSessionId(newSessionId);
      if (newSessionId) {
        localStorage.setItem('izaque_active_session_id', newSessionId);
      }
      setActiveGuidedTopic(guided);

      const questionsPreview = (guided.questions && Array.isArray(guided.questions) && guided.questions.length > 0)
        ? `\n\n📌 **Roteiro Prioritário Definido pelo Superadmin:**\n` +
          guided.questions.map((q, i) => `${i + 1}. *${typeof q === 'string' ? q : q.text}*`).join('\n')
        : '';

      setReflections([
        {
          id: 'initial',
          role: 'guide',
          content: `Olá... Seja muito bem-vindo(a) a esta conversa direcionada sobre "${guided.title}".\n\n${guided.description || 'Este é um espaço seguro e focado para reflexão profunda.'}${questionsPreview}\n\nO mentor conduzirá a reflexão priorizando explorar estas perguntas do roteiro. Você pode tocar em uma das perguntas sugeridas logo abaixo ou responder como isso ressoa em você agora.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          memoriesRecalled: 0,
          knowledgeApplied: 0,
        },
      ]);
    } catch (err) {
      console.error('Erro ao iniciar conversa direcionada:', err);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleStartRename = (session, e) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitleText(session.title);
  };

  const handleSaveRename = async (sessionId, e) => {
    e?.stopPropagation();
    if (!editingTitleText.trim()) {
      setEditingSessionId(null);
      return;
    }
    try {
      const updated = await updateUserSession(sessionId, editingTitleText.trim());
      if (updated) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title: updated.title } : s))
        );
      }
    } catch (err) {
      console.error('Erro ao renomear sessão:', err);
    } finally {
      setEditingSessionId(null);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente excluir esta conversa? As mensagens desta conversa serão removidas, mas suas memórias de longo prazo permanecem salvas para os mentores.')) {
      return;
    }
    try {
      await deleteUserSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);

      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          handleSelectSession(remaining[0].id);
        } else {
          handleCreateNewSession();
        }
      }
    } catch (err) {
      console.error('Erro ao excluir sessão:', err);
    }
  };

  // Estado de Reprodução de Voz do Guia
  const [activeVoiceMessageId, setActiveVoiceMessageId] = useState(null);
  const [loadingVoiceId, setLoadingVoiceId] = useState(null);
  const audioElementRef = useRef(null);

  // Estado de Reprodução do Áudio Enviado pelo Usuário
  const [activeUserAudioId, setActiveUserAudioId] = useState(null);
  const userAudioPlayerRef = useRef(null);

  // Estado de Gravação de Áudio (Voz do Usuário)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const endRef = useRef(null);
  const chatScrollRef = useRef(null);
  const isUserNearBottomRef = useRef(true);
  const [showScrollBottomPill, setShowScrollBottomPill] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [visibleWindowSize, setVisibleWindowSize] = useState(CHAT_VIRTUAL_WINDOW_STEP);

  const handleChatScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 140;
    isUserNearBottomRef.current = nearBottom;
    setShowScrollBottomPill(!nearBottom && reflections.length > 2);
  };

  const scrollToLatestSmooth = (instant = false) => {
    const el = chatScrollRef.current;
    isUserNearBottomRef.current = true;
    setShowScrollBottomPill(false);
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: instant ? 'auto' : 'smooth',
      });
    } else {
      endRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
    }
  };

  const handleLoadOlderWindow = () => {
    const el = chatScrollRef.current;
    const prevHeight = el ? el.scrollHeight : 0;
    const prevTop = el ? el.scrollTop : 0;
    setVisibleWindowSize((prev) => prev + CHAT_VIRTUAL_WINDOW_STEP);
    requestAnimationFrame(() => {
      if (el) {
        const heightDelta = el.scrollHeight - prevHeight;
        el.scrollTop = prevTop + heightDelta;
      }
    });
  };

  // Saudação contextual
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.name || user?.email?.split('@')[0] || 'Viajante';

    if (hour >= 5 && hour < 12) {
      return {
        icon: <Sun className="w-4 h-4 text-amber-600" />,
        text: `Bom dia, ${name}. Respire com calma. Que este dia comece com leveza e sem pressa.`,
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        icon: <Coffee className="w-4 h-4 text-amber-700" />,
        text: `Boa tarde, ${name}. Pause um instante. Como está o peso nos seus ombros agora?`,
      };
    } else {
      return {
        icon: <Moon className="w-4 h-4 text-teal-600" />,
        text: `Boa noite, ${name}. Respire fundo. Este espaço é seguro e é seu. Deixe aqui o que pesou hoje.`,
      };
    }
  };

  const greeting = getGreeting();

  // Prevenção de CLS no Streaming: ancora suavemente apenas se o usuário estiver acompanhando o final
  useEffect(() => {
    if (!isUserNearBottomRef.current) return;
    const el = chatScrollRef.current;
    if (!el) return;
    if (streamingMessageId) {
      // Durante o streaming token a token, usa ajuste imediato sem animação concorrente para zero salto visual
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [reflections, isReflecting, streamingMessageId]);

  // Limpeza de áudio ao desmontar (HTML5 Audio e Web Speech API)
  useEffect(() => {
    return () => {
      if (audioElementRef.current) audioElementRef.current.pause();
      if (userAudioPlayerRef.current) userAudioPlayerRef.current.pause();
      humanVoiceService.stop();
      ambientAudio.restoreAfterSpeech(0.5);
    };
  }, []);

  // Reprodução de voz via motor humanizado (Web Speech API Neural com frases e respiração)
  const playNativeSpeech = (rawText, messageId) => {
    try {
      if (!humanVoiceService.isSupported()) {
        console.warn('Navegador não possui suporte à síntese de voz nativa.');
        setLoadingVoiceId(null);
        setActiveVoiceMessageId(null);
        ambientAudio.restoreAfterSpeech(0.5);
        return;
      }

      humanVoiceService.stop();

      humanVoiceService.speak(rawText, {
        onStart: () => {
          setActiveVoiceMessageId(messageId);
          setLoadingVoiceId(null);
          ambientAudio.duckForSpeech(0.04, 0.8);
        },
        onEnd: () => {
          setActiveVoiceMessageId(null);
          ambientAudio.restoreAfterSpeech(1.5);
        },
        onError: () => {
          setActiveVoiceMessageId(null);
          setLoadingVoiceId(null);
          ambientAudio.restoreAfterSpeech(0.5);
        },
      });
    } catch (synthErr) {
      console.error('Erro ao executar voz humanizada:', synthErr);
      setLoadingVoiceId(null);
      setActiveVoiceMessageId(null);
      ambientAudio.restoreAfterSpeech(0.5);
    }
  };

  // Tocar ou Pausar Voz do Mentor (Usa parâmetros globais da voz do Edson + reprodução progressiva rápida)
  const handleToggleVoicePlay = async (messageId, text) => {
    // Se já estiver tocando ou carregando essa mensagem, pausa imediatamente
    if (activeVoiceMessageId === messageId || loadingVoiceId === messageId) {
      if (audioElementRef.current && !audioElementRef.current.paused) {
        audioElementRef.current.pause();
      }
      humanVoiceService.stop();
      setActiveVoiceMessageId(null);
      setLoadingVoiceId(null);
      ambientAudio.restoreAfterSpeech(1.2);
      return;
    }

    // Cancela áudios do usuário e qualquer fala ativa
    if (audioElementRef.current) audioElementRef.current.pause();
    if (userAudioPlayerRef.current) userAudioPlayerRef.current.pause();
    setActiveUserAudioId(null);
    humanVoiceService.stop();

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
    }
    const audio = audioElementRef.current;
    // Desbloqueio síncrono para iOS Safari e Android Chrome dentro do gesto de clique
    unlockHtmlAudioElement(audio);
    ambientAudio.initContext();
    setLoadingVoiceId(messageId);

    try {
      await humanVoiceService.playSmartAudio(text, {
        audioElement: audio,
        isPreview: false,
        onStart: () => {
          setActiveVoiceMessageId(messageId);
          setLoadingVoiceId(null);
          ambientAudio.duckForSpeech(0.04, 0.8);
        },
        onEnd: () => {
          setActiveVoiceMessageId(null);
          setLoadingVoiceId(null);
          ambientAudio.restoreAfterSpeech(1.5);
        },
        onError: () => {
          setActiveVoiceMessageId(null);
          setLoadingVoiceId(null);
          ambientAudio.restoreAfterSpeech(1.0);
        },
      });
    } catch (err) {
      console.warn('⚠️ Tentando fallback de voz local devido a:', err?.message);
      playNativeSpeech(text, messageId);
    }
  };

  // Tocar ou Pausar Áudio Gravado e Enviado pelo Usuário
  const handleToggleUserAudioPlay = (item) => {
    if (activeUserAudioId === item.id) {
      if (userAudioPlayerRef.current) userAudioPlayerRef.current.pause();
      setActiveUserAudioId(null);
      ambientAudio.restoreAfterSpeech(1.0);
      return;
    }

    if (audioElementRef.current) audioElementRef.current.pause();
    setActiveVoiceMessageId(null);
    humanVoiceService.stop();

    if (!userAudioPlayerRef.current) {
      userAudioPlayerRef.current = new Audio();
    }
    const player = userAudioPlayerRef.current;

    // Se possui áudio original gravado na sessão
    if (item.audioUrl) {
      player.src = item.audioUrl;
      player.currentTime = 0;

      player.onplay = () => {
        setActiveUserAudioId(item.id);
        ambientAudio.duckForSpeech(0.04, 0.6);
      };

      player.onended = () => {
        setActiveUserAudioId(null);
        ambientAudio.restoreAfterSpeech(1.2);
      };

      player.onerror = () => {
        playUserAudioFallback(item);
      };

      player.play().catch(() => {
        playUserAudioFallback(item);
      });
      return;
    }

    // Se for mensagem antiga do histórico sem blob salvo, reproduz a transcrição
    playUserAudioFallback(item);
  };

  const playUserAudioFallback = (item) => {
    setActiveUserAudioId(item.id);
    ambientAudio.duckForSpeech(0.04, 0.6);
    humanVoiceService.speak(item.content, {
      customSettings: {
        rate: 1.0,
        pitch: 1.0,
        gender: 'auto',
      },
      onStart: () => setActiveUserAudioId(item.id),
      onEnd: () => {
        setActiveUserAudioId(null);
        ambientAudio.restoreAfterSpeech(1.2);
      },
      onError: () => {
        setActiveUserAudioId(null);
        ambientAudio.restoreAfterSpeech(0.5);
      },
    });
  };

  // Enviar Reflexão Escrita
  const handleSendReflection = async (e, directText = null) => {
    e?.preventDefault();
    const text = (directText !== null ? directText : inputVal).trim();
    if (!text || isReflecting) return;

    const userEntry = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setReflections((prev) => [...prev, userEntry]);
    if (directText === null) setInputVal('');
    isUserNearBottomRef.current = true;
    setShowScrollBottomPill(false);
    setIsReflecting(true);

    const streamGuideId = `guide-${Date.now() + 1}`;
    let streamBubbleInserted = false;

    try {
      const history = reflections
        .filter((r) => r.id !== 'initial')
        .map((r) => ({
          role: r.role === 'guide' ? 'assistant' : 'user',
          content: r.content,
        }));

      const res = await sendChatMessageStream(
        {
          message: text,
          userId: user?.id || 'default_user_guest',
          agentId: selectedAgentId,
          history,
          sessionId: activeSessionId,
          guidedConversationId: activeGuidedTopic?.id || null,
        },
        {
          onMeta: (meta) => {
            if (meta?.sessionId && meta.sessionId !== activeSessionId) {
              setActiveSessionId(meta.sessionId);
              localStorage.setItem('izaque_active_session_id', meta.sessionId);
            }
          },
          onDelta: (_delta, fullSoFar) => {
            if (!streamBubbleInserted) {
              streamBubbleInserted = true;
              setIsReflecting(false);
              setStreamingMessageId(streamGuideId);
              setReflections((prev) => [
                ...prev,
                {
                  id: streamGuideId,
                  role: 'guide',
                  content: fullSoFar,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
            } else {
              setReflections((prev) =>
                prev.map((item) => (item.id === streamGuideId ? { ...item, content: fullSoFar } : item))
              );
            }
          },
        }
      );

      if (res.sessionId && res.sessionId !== activeSessionId) {
        setActiveSessionId(res.sessionId);
        localStorage.setItem('izaque_active_session_id', res.sessionId);
      }

      // Auto-titulação suave se for a primeira mensagem da sessão
      const currentSess = sessions.find((s) => s.id === (res.sessionId || activeSessionId));
      if (currentSess && (currentSess.title === 'Nova Reflexão' || currentSess.title === 'Reflexão Inicial' || currentSess.title === 'Reflexão')) {
        const cleanTitle = text.slice(0, 32) + (text.length > 32 ? '...' : '');
        updateUserSession(currentSess.id, cleanTitle).then((updated) => {
          if (updated) {
            setSessions((prev) =>
              prev.map((s) => (s.id === currentSess.id ? { ...s, title: updated.title } : s))
            );
          }
        }).catch(() => {});
      }

      const finalGuideEntry = {
        id: streamGuideId,
        role: 'guide',
        content: res.reply,
        agentUsed: res.agentUsed || null,
        memoriesRecalled: res.memoriesUsed?.length || 0,
        knowledgeApplied: res.knowledgeUsed?.length || 0,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      if (streamBubbleInserted) {
        setReflections((prev) =>
          prev.map((item) => (item.id === streamGuideId ? finalGuideEntry : item))
        );
      } else {
        setReflections((prev) => [...prev, finalGuideEntry]);
      }

      // Pré-aquece o 1º trecho de áudio em background no cache do navegador para clique instantâneo
      humanVoiceService.prewarmFirstSegment(finalGuideEntry.content);

      // MODO IMERSIVO: Se ativado, toca automaticamente
      const isImmersive = localStorage.getItem('izaque_immersive_voice') === 'true';
      if (isImmersive) {
        setTimeout(() => {
          handleToggleVoicePlay(finalGuideEntry.id, finalGuideEntry.content);
        }, 250);
      }
    } catch (err) {
      setReflections((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'guide',
          content: 'Houve uma breve pausa na conexão da mentoria. Mas estou aqui ouvindo você. Gostaria de reenviar?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsReflecting(false);
      setStreamingMessageId(null);
    }
  };

  const startAudioRecording = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        alert('O microfone no celular requer conexão segura (HTTPS ou localhost). Se estiver testando na rede local, ative HTTPS ou acesse via localhost.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Detecção inteligente de MIME types compatíveis (Crucial para iPhone / Safari)
      let selectedMime = 'audio/webm';
      let recorderOptions = {};

      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          selectedMime = 'audio/webm;codecs=opus';
          recorderOptions = { mimeType: selectedMime };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          selectedMime = 'audio/webm';
          recorderOptions = { mimeType: selectedMime };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          // Padrão nativo do iPhone / Safari no iOS
          selectedMime = 'audio/mp4';
          recorderOptions = { mimeType: selectedMime };
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          selectedMime = 'audio/aac';
          recorderOptions = { mimeType: selectedMime };
        }
      }

      let recorder;
      try {
        recorder = new MediaRecorder(stream, recorderOptions);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;
      const actualMime = recorder.mimeType || selectedMime || 'audio/webm';

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
        stream.getTracks().forEach((track) => track.stop());

        // Upload binário direto via multipart/form-data (sem sobrecarga de FileReader Base64 gigante)
        const localObjectUrl = URL.createObjectURL(audioBlob);
        await processVoiceReflection(audioBlob, recordingDuration, actualMime, localObjectUrl);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Não foi possível acessar o microfone para o áudio de reflexão. Verifique as permissões do navegador.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const cancelAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
      audioChunksRef.current = [];
    }
  };

  const processVoiceReflection = async (audioPayload, durationSeconds, mimeType = 'audio/webm', dataUrl = null) => {
    isUserNearBottomRef.current = true;
    setIsReflecting(true);

    try {
      const history = reflections
        .filter((r) => r.id !== 'initial')
        .map((r) => ({
          role: r.role === 'guide' ? 'assistant' : 'user',
          content: r.content,
        }));

      const res = await sendAudioChatMessage({
        audioBlob: audioPayload instanceof Blob ? audioPayload : null,
        audioBase64: typeof audioPayload === 'string' ? audioPayload : null,
        mimeType,
        userId: user?.id || 'default_user_guest',
        agentId: selectedAgentId,
        durationSeconds,
        history,
        sessionId: activeSessionId,
        guidedConversationId: activeGuidedTopic?.id || null,
      });

      if (res.sessionId && res.sessionId !== activeSessionId) {
        setActiveSessionId(res.sessionId);
        localStorage.setItem('izaque_active_session_id', res.sessionId);
      }

      const currentSess = sessions.find((s) => s.id === (res.sessionId || activeSessionId));
      if (currentSess && (currentSess.title === 'Nova Reflexão' || currentSess.title === 'Reflexão Inicial' || currentSess.title === 'Reflexão')) {
        const cleanTitle = (res.transcription || 'Reflexão em Áudio').slice(0, 32);
        updateUserSession(currentSess.id, cleanTitle).then((updated) => {
          if (updated) {
            setSessions((prev) =>
              prev.map((s) => (s.id === currentSess.id ? { ...s, title: updated.title } : s))
            );
          }
        }).catch(() => {});
      }

      // Mensagem transcrita do usuário (Estilo WhatsApp)
      const userAudioEntry = {
        id: Date.now().toString(),
        role: 'user',
        content: res.transcription || 'Reflexão em áudio gravada.',
        isVoice: true,
        audioUrl: dataUrl,
        durationSeconds,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Resposta do guia
      const guideAudioEntry = {
        id: (Date.now() + 1).toString(),
        role: 'guide',
        content: res.reply,
        agentUsed: res.agentUsed || null,
        memoriesRecalled: res.memoriesUsed?.length || 0,
        knowledgeApplied: res.knowledgeUsed?.length || 0,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setReflections((prev) => [...prev, userAudioEntry, guideAudioEntry]);

      // Pré-aquece o 1º trecho de áudio em background no cache do navegador para clique instantâneo
      humanVoiceService.prewarmFirstSegment(guideAudioEntry.content);

      // MODO IMERSIVO: Se ativado, toca a resposta do guia automaticamente
      const isImmersive = localStorage.getItem('izaque_immersive_voice') === 'true';
      if (isImmersive) {
        setTimeout(() => {
          handleToggleVoicePlay(guideAudioEntry.id, guideAudioEntry.content);
        }, 400);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReflecting(false);
    }
  };

  // Renderizador unificado do conteúdo do painel lateral (Suas Conversas & Conversas Direcionadas)
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full w-full select-none bg-stone-50 dark:bg-slate-900">
      {/* Header do Drawer / Painel */}
      <div className="p-4 sm:p-5 border-b border-stone-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-teal-700/10 dark:bg-teal-500/20 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-300 shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-serif font-medium leading-tight text-stone-900 dark:text-stone-50 truncate">
              Suas Conversas
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
              Organize reflexões por tópico ou momento
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* BOTÃO DE FIXAR / DESAFIXAR (PINAR) */}
          <button
            type="button"
            onClick={handleTogglePin}
            title={
              isSidebarPinned
                ? 'Desafixar painel lateral (tornar flutuante)'
                : 'Fixar painel lateral na página'
            }
            className={`p-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-medium ${
              isSidebarPinned
                ? 'bg-teal-700/15 text-teal-800 dark:text-teal-300 border border-teal-700/30 dark:border-teal-500/40 shadow-xs'
                : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <Pin className={`w-4 h-4 transition-transform duration-200 ${isSidebarPinned ? 'fill-current rotate-45 text-teal-700 dark:text-teal-400' : ''}`} />
            <span className="hidden sm:inline text-[11px]">
              {isSidebarPinned ? 'Fixado' : 'Fixar'}
            </span>
          </button>

          {/* BOTÃO DE FECHAR / RECOLHER */}
          <button
            type="button"
            onClick={() => setIsSessionsDrawerOpen(false)}
            title="Recolher painel"
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Banner de Memória Global dos Mentores */}
      <div className="mx-4 mt-3 p-3 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/40 flex items-start gap-2.5 text-[11px] text-teal-900 dark:text-teal-200 leading-relaxed shrink-0">
        <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <span>
          <strong>Memória Contínua Unificada:</strong> Mesmo alternando entre conversas, seus mentores reconhecem toda a sua jornada e histórico sem que você precise se repetir.
        </span>
      </div>

      {/* Botão de Criar Nova Sessão */}
      <div className="p-4 pb-2 shrink-0">
        <button
          type="button"
          onClick={handleCreateNewSession}
          disabled={isCreatingSession}
          className="w-full py-2.5 px-4 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer disabled:opacity-50"
        >
          {isCreatingSession ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>Iniciar Nova Reflexão</span>
        </button>
      </div>

      {/* Lista de Sessões e Conversas Direcionadas */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {/* SEÇÃO: CONVERSAS DIRECIONADAS DO SISTEMA */}
        {guidedConversations.length > 0 && (
          <div className="space-y-2">
            <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Conversas Direcionadas ({guidedConversations.length})</span>
            </div>

            <div className="space-y-1.5">
              {guidedConversations.map((g) => {
                const isCurrent = sessions.find((s) => s.id === activeSessionId)?.title === g.title;
                const questionsCount = Array.isArray(g.questions) ? g.questions.length : 0;

                return (
                  <div
                    key={g.id}
                    onClick={() => handleStartGuidedSession(g)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isCurrent
                        ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-400 dark:border-teal-700 shadow-xs'
                        : 'bg-white dark:bg-slate-800/70 border-stone-200/80 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-800 hover:bg-teal-50/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] uppercase font-bold text-teal-700 dark:text-teal-400 px-1.5 py-0.2 bg-teal-100/70 dark:bg-teal-900/50 rounded-md">
                          {g.category || 'Geral'}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {questionsCount} {questionsCount === 1 ? 'pergunta' : 'perguntas'}
                        </span>
                      </div>
                      <h4 className="text-xs font-serif font-medium text-stone-900 dark:text-stone-100 truncate">
                        {g.title}
                      </h4>
                    </div>

                    <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SEÇÃO: HISTÓRICO DE TÓPICOS DO USUÁRIO */}
        <div className="space-y-2">
          <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400 flex items-center justify-between">
            <span>Suas Conversas</span>
            <span>{sessions.length} {sessions.length === 1 ? 'tópico' : 'tópicos'}</span>
          </div>

          {sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            const isEditing = editingSessionId === sess.id;
            const dateStr = new Date(sess.updated_at || sess.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
            });

            return (
              <div
                key={sess.id}
                onClick={() => !isEditing && handleSelectSession(sess.id)}
                className={`group p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-300 dark:border-teal-700/80 shadow-xs'
                    : 'bg-white dark:bg-slate-800/60 border-stone-200/80 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 hover:bg-stone-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingTitleText}
                        onChange={(e) => setEditingTitleText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(sess.id, e);
                          if (e.key === 'Escape') setEditingSessionId(null);
                        }}
                        autoFocus
                        className="w-full text-xs font-serif px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-teal-600 focus:outline-none text-stone-800 dark:text-stone-100"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSaveRename(sess.id, e)}
                        className="p-1 text-teal-700 dark:text-teal-400 hover:bg-teal-100 rounded-md cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSessionId(null);
                        }}
                        className="p-1 text-stone-400 hover:bg-stone-200 rounded-md cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-serif font-medium truncate ${
                          isActive ? 'text-teal-900 dark:text-teal-200' : 'text-stone-800 dark:text-stone-200'
                        }`}>
                          {sess.title}
                        </span>
                        {isActive && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-teal-600 text-white font-sans font-semibold shrink-0">
                            Ativa
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono mt-0.5 block">
                        {dateStr}
                      </span>
                    </>
                  )}
                </div>

                {/* Ações Rápidas: Renomear e Excluir */}
                {!isEditing && (
                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleStartRename(sess, e)}
                      title="Renomear conversa"
                      className="p-1.5 text-stone-400 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-stone-200/60 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(sess.id, e)}
                        title="Excluir conversa"
                        className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`flex ${
        isDocked ? 'flex-row max-w-[1600px]' : 'flex-col max-w-5xl'
      } h-full flex-1 w-full mx-auto bg-stone-50 dark:bg-slate-900 sm:border-x border-stone-200/80 dark:border-slate-800 transition-all duration-300 font-sans text-stone-800 dark:text-stone-100 overflow-hidden`}
    >
      {/* MODAL DE CONFIGURAÇÕES DE USUÁRIO (Fallback caso usado isoladamente sem App.jsx) */}
      {!onEditGuideName && isSettingsOpen && (
        <React.Suspense fallback={null}>
          <LazyUserSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            user={user}
            profile={user}
            systemSettings={systemSettings}
            onGuideNameChanged={(name) => setGuideName(name)}
          />
        </React.Suspense>
      )}

      {/* MODO FIXADO / PINADO (SIDEBAR LATERAL DOCKADA AO LADO DO CHAT EM TELAS DESKTOP) */}
      {isDocked && (
        <aside className="w-80 lg:w-84 xl:w-92 shrink-0 h-full border-r border-stone-200/80 dark:border-slate-800 flex flex-col bg-stone-50 dark:bg-slate-900 z-10 transition-all duration-300 overflow-hidden">
          {renderSidebarContent()}
        </aside>
      )}

      {/* MODO FLUTUANTE / DRAWER (QUANDO NÃO ESTÁ FIXADO OU EM TELAS MOBILE) */}
      <AnimatePresence>
        {!isDocked && isSessionsDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-start">
            {/* Backdrop com blur escurecido */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSessionsDrawerOpen(false)}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Painel Lateral Deslizante */}
            <motion.div
              initial={{ x: '-100%', opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0.8 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative w-full max-w-sm sm:max-w-md h-full bg-stone-50 dark:bg-slate-900 border-r border-stone-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 text-stone-800 dark:text-stone-100 font-sans"
            >
              {renderSidebarContent()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ÁREA PRINCIPAL DO CHAT / MENSAGENS (SE AJUSTA AUTOMATICAMENTE AO RESTANTE DA PÁGINA) */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden transition-all duration-300">
        {/* HEADER DA SESSÃO */}
        <header className="px-3 sm:px-6 py-2 sm:py-3.5 pt-safe border-b border-stone-200/80 dark:border-slate-800 bg-stone-50/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                title="Voltar para o Início"
                className="p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-xl hover:bg-stone-200/50 dark:hover:bg-slate-800 transition min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {/* BOTÃO DE MINHAS CONVERSAS (MULTI-SESSÕES) */}
            <button
              type="button"
              onClick={() => setIsSessionsDrawerOpen((prev) => !prev)}
              title={
                isDocked
                  ? 'Recolher painel de conversas'
                  : 'Minhas Conversas & Sessões de Reflexão'
              }
              className={`p-2 rounded-xl transition min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center shrink-0 active:scale-95 cursor-pointer relative border ${
                isDocked
                  ? 'bg-teal-700/15 text-teal-800 dark:text-teal-300 border-teal-700/30 dark:border-teal-500/40 shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-stone-200/60 dark:hover:bg-slate-800 border-stone-200/80 dark:border-slate-700 shadow-2xs'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              {sessions.length > 1 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-teal-700 dark:bg-teal-500 text-[9px] text-white font-mono font-bold shadow-xs">
                  {sessions.length}
                </span>
              )}
            </button>

          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400 shrink-0">
            <Feather className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-serif font-medium text-stone-900 dark:text-stone-50 leading-tight truncate flex items-center gap-1.5">
              <span>Sessão com {guideName}</span>
              <span className="hidden md:inline text-stone-300 dark:text-stone-600 font-sans">•</span>
              <span
                onClick={() => setIsSessionsDrawerOpen(true)}
                title="Clique para ver ou mudar de conversa"
                className="hidden md:inline-block text-xs font-normal text-teal-800 dark:text-teal-300 hover:underline cursor-pointer truncate max-w-[200px]"
              >
                {sessions.find((s) => s.id === activeSessionId)?.title || 'Reflexão'}
              </span>
            </h2>
            {activeGuidedTopic ? (
              <p className="text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span>Conversa Direcionada • Mentor conduzindo roteiro do Superadmin</span>
              </p>
            ) : (
              <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mt-0.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 shrink-0" />
                <span>Mentoria ativa • Visão contínua da sua jornada</span>
              </p>
            )}
          </div>
        </div>

        {/* BOTÕES DE CONTROLE: NOVA CONVERSA, SOM AMBIENTE, TEMA & AJUSTES */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* BOTÃO RÁPIDO: + NOVA CONVERSA */}
          <button
            type="button"
            onClick={handleCreateNewSession}
            disabled={isCreatingSession}
            title="Abrir uma nova conversa de reflexão limpa"
            className="px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 border shadow-sm active:scale-95 min-h-[36px] bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white border-transparent cursor-pointer disabled:opacity-50"
          >
            {isCreatingSession ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Nova Reflexão</span>
          </button>
          {/* ATIVAÇÃO OU DESATIVAÇÃO RÁPIDA DO SOM AMBIENTE */}
          {canShowAmbient && (
            <button
              type="button"
              onClick={handleToggleAmbientQuick}
              title={
                isAmbientActive
                  ? `Som Ambiente Ativo (${ambientTrack === 'rain' ? 'Chuva' : '432 Hz'}). Clique para pausar.`
                  : 'Ativar Som Ambiente Terapêutico (Frequência 432 Hz / Chuva)'
              }
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 border shadow-sm active:scale-95 min-h-[36px] ${
                isAmbientActive
                  ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border-teal-400 dark:border-teal-700 shadow-teal-700/10'
                  : 'bg-white dark:bg-slate-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-slate-700 hover:text-stone-800 dark:hover:text-stone-200 hover:border-stone-300'
              }`}
            >
              {isAmbientActive ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0 animate-pulse" />
                  <span className="text-[11px] font-medium hidden xs:inline sm:inline">
                    {ambientTrack === 'rain' ? 'Chuva' : '432 Hz'}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-teal-400 animate-ping shrink-0" />
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 hidden xs:inline sm:inline">
                    Som Ambiente
                  </span>
                </>
              )}
            </button>
          )}

          {/* SELETOR RÁPIDO DE TEMA VISUAL */}
          {canShowTheme && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsThemeMenuOpen((prev) => !prev)}
                title={`Mudar Estilo Visual do Refúgio (Atual: ${THEMES.find((t) => t.id === currentTheme)?.name || 'Esmeralda'})`}
                className={`p-2 sm:px-3 sm:py-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-600 dark:text-stone-300 text-xs font-medium transition flex items-center gap-1.5 border shadow-sm active:scale-95 min-h-[36px] min-w-[36px] justify-center ${
                  isThemeMenuOpen ? 'border-teal-600 ring-2 ring-teal-500/30' : 'border-stone-200 dark:border-slate-700'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                <span className="hidden sm:inline text-[11px]">
                  {THEMES.find((t) => t.id === currentTheme)?.name.split(' ')[1] || 'Tema'}
                </span>
              </button>

              {/* POPOVER FLUTUANTE DE TEMAS */}
              <AnimatePresence>
                {isThemeMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsThemeMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-24px)] p-2 rounded-2xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 shadow-2xl z-40 space-y-1 text-stone-800 dark:text-stone-100"
                    >
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
                            className={`w-full px-2.5 py-2 rounded-xl text-left text-xs transition flex items-center justify-between gap-2 ${
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
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* BOTÃO DE PREFERÊNCIAS COMPLETAS */}
          {canShowSettings && (
            <button
              type="button"
              onClick={() => (onEditGuideName ? onEditGuideName() : setIsSettingsOpen(true))}
              title="Ajustes de voz, nome e som ambiente"
              className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-600 dark:text-stone-300 text-xs font-medium transition flex items-center gap-1.5 border border-stone-200 dark:border-slate-700 shadow-sm active:scale-95 min-h-[36px] min-w-[36px] justify-center"
            >
              <Sliders className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span className="hidden sm:inline">Ajustes</span>
            </button>
          )}
        </div>
      </header>

      {/* SAUDAÇÃO CONTEXTUAL */}
      <div className="px-4 sm:px-6 py-2 bg-stone-100/70 dark:bg-slate-800/40 border-b border-stone-200/60 dark:border-slate-800/60 text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2 shrink-0">
        {greeting.icon}
        <span className="truncate">{greeting.text}</span>
      </div>

      {/* ÁREA DE MENSAGENS (VIRTUALIZADA POR JANELA + ANCORAGEM INTELIGENTE ANTI-CLS) */}
      <main
        ref={chatScrollRef}
        onScroll={handleChatScroll}
        className="flex-1 overflow-y-auto overscroll-contain chat-scroll-container px-3 sm:px-6 py-4 sm:py-6 space-y-4 relative"
      >
        {activeGuidedTopic && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 shadow-xs mb-2">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-700/10 dark:bg-amber-400/15 border border-amber-700/20 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <Compass className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                    {activeGuidedTopic.category || 'Conversa Direcionada'}
                  </span>
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-100 font-serif">
                    {activeGuidedTopic.title}
                  </span>
                </div>
                {activeGuidedTopic.description && (
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                    {activeGuidedTopic.description}
                  </p>
                )}
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-1.5 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Prioridade do Mentor: Conduzir ativamente a reflexão pelas perguntas definidas pelo Superadmin.</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {loadingHistory ? (
          <ChatHistorySkeleton />
        ) : (
          <>
            {reflections.length > visibleWindowSize && (
              <div className="flex justify-center py-1">
                <button
                  type="button"
                  onClick={handleLoadOlderWindow}
                  className="px-3.5 py-1.5 rounded-full text-[11px] font-medium bg-white/90 dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-700 transition shadow-2xs cursor-pointer"
                >
                  ↑ Carregar mensagens anteriores ({reflections.length - visibleWindowSize} arquivadas nesta conversa)
                </button>
              </div>
            )}

            {reflections.slice(-visibleWindowSize).map((item, idx, visibleArr) => {
              const isUser = item.role === 'user';
              const isVoicePlaying = activeVoiceMessageId === item.id;
              const isVoiceLoading = loadingVoiceId === item.id;
              const isStreamingThis = streamingMessageId === item.id;
              const isRecentAnimated = idx >= visibleArr.length - 2 && !isStreamingThis;
              const BubbleWrapper = isRecentAnimated ? motion.div : 'div';
              const wrapperProps = isRecentAnimated
                ? {
                    initial: { opacity: 0, y: 8 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                  }
                : {};

              return (
                <BubbleWrapper
                  key={item.id}
                  {...wrapperProps}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} ${
                    !isRecentAnimated && !isStreamingThis ? 'chat-bubble-virtualized' : ''
                  }`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm ${
                      isUser
                        ? 'bg-teal-700 text-white rounded-tr-sm'
                        : 'bg-white dark:bg-slate-800 text-stone-800 dark:text-stone-100 border border-stone-200/80 dark:border-slate-700/70 rounded-tl-sm'
                    }`}
                  >
                    {/* Cabeçalho do Balão */}
                    <div
                      className={`flex items-center justify-between pb-1.5 mb-1.5 border-b text-[11px] ${
                        isUser
                          ? 'border-teal-600/60 text-teal-100'
                          : 'border-stone-100 dark:border-slate-700/50 text-stone-400 dark:text-stone-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-medium">{isUser ? 'Você' : guideName}</span>
                        {!isUser && item.agentUsed?.name && item.agentUsed.slug !== 'izaque-master' && item.agentUsed.slug !== 'isaac-master' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40 font-serif flex items-center gap-1">
                            {item.agentUsed.slug === 'pastor-joao-biblico' ? '📖 ' : item.agentUsed.slug === 'mentor-financeiro' ? '💰 ' : item.agentUsed.slug === 'mentora-lideranca' ? '👥 ' : '🌿 '}
                            {item.agentUsed.name.split(' - ')[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>{item.timestamp}</span>
                        {isUser && <CheckCheck className="w-3.5 h-3.5 text-teal-200" />}
                      </div>
                    </div>

                    {/* Badges de Conexão: Memória Relembrada e Escrituras Bíblicas */}
                    {!isUser && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {item.memoriesRecalled > 0 && (
                          <span className="text-[10px] font-medium text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            🌿 Relembrando conversas passadas
                          </span>
                        )}
                        {item.agentUsed?.slug === 'pastor-joao-biblico' && (
                          <span className="text-[10px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            📖 Fundamentado na Palavra de Deus (JFA)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Áudio enviado pelo usuário com Player Interativo */}
                    {item.isVoice && (
                      <div className="mb-2.5 p-2.5 sm:p-3 rounded-2xl bg-teal-800/60 border border-teal-600/50 flex items-center gap-3 text-xs shadow-sm">
                        <button
                          type="button"
                          onClick={() => handleToggleUserAudioPlay(item)}
                          title={activeUserAudioId === item.id ? 'Pausar áudio enviado' : 'Ouvir o áudio que você enviou'}
                          className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center shrink-0 transition transform active:scale-95 shadow-sm cursor-pointer"
                        >
                          {activeUserAudioId === item.id ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-1 h-4">
                            {[40, 75, 55, 90, 65, 45, 85, 60, 95, 50, 70, 40].map((h, i) => (
                              <span
                                key={i}
                                className={`w-1 rounded-full bg-white transition-all duration-300 ${
                                  activeUserAudioId === item.id ? 'animate-pulse' : 'opacity-75'
                                }`}
                                style={{
                                  height: `${h}%`,
                                  animationDelay: `${i * 80}ms`,
                                }}
                              />
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-teal-100 font-mono mt-1">
                            <span>{activeUserAudioId === item.id ? 'Reproduzindo seu áudio...' : 'Áudio gravado por você'}</span>
                            <span>{item.durationSeconds ? `${item.durationSeconds}s` : ''}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Conteúdo textual da mensagem com Tipografia Fluida Linear clamp() */}
                    <p className="text-fluid-chat font-serif whitespace-pre-wrap">
                      {item.content}
                      {isStreamingThis && (
                        <span className="inline-block w-1.5 h-4 ml-1 align-middle rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />
                      )}
                    </p>

                    {/* Botão para Ouvir a Reflexão do Guia com Voz Humanizada (exibido ao concluir o streaming) */}
                    {!isUser && !isStreamingThis && (
                      <VoiceReflectionButton
                        text={item.content}
                        messageId={item.id}
                        isPlaying={isVoicePlaying}
                        isAudioLoading={isVoiceLoading}
                        onTogglePlay={() => handleToggleVoicePlay(item.id, item.content)}
                      />
                    )}
                  </div>
                </BubbleWrapper>
              );
            })}
          </>
        )}

        <AnimatePresence>
          {isReflecting && <ReflectingIndicator guideName={guideName} />}
        </AnimatePresence>

        {showScrollBottomPill && (
          <div className="sticky bottom-2 flex justify-center pointer-events-none z-10">
            <button
              type="button"
              onClick={() => scrollToLatestSmooth(false)}
              className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-teal-700/95 hover:bg-teal-800 text-white text-xs font-medium shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <span>↓ Ir para o final da conversa</span>
            </button>
          </div>
        )}

        <div ref={endRef} />
      </main>

      {/* FOOTER DE ENTRADA RESPONSIVO */}
      <footer className="p-2 sm:p-3.5 pb-safe border-t border-stone-200/80 dark:border-slate-800 bg-stone-50/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0">
        {/* PERGUNTAS PRONTAS DE CONDUÇÃO DO MENTOR */}
        {!isRecording && currentStarterQuestions.length > 0 && (
          <div className="mb-2 px-1">
            {showStarterQuestions ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[11px] font-serif text-stone-500 dark:text-stone-400 flex items-center gap-1.5 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="font-medium truncate">
                      {activeGuidedTopic
                        ? `Roteiro do Superadmin: ${activeGuidedTopic.title}`
                        : (activeAgent ? `Sugestões de ${activeAgent.name.split(' - ')[0]}` : 'Perguntas sugeridas para conduzir sua reflexão')}:
                    </span>
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {currentStarterQuestions.length > 2 && (
                      <button
                        type="button"
                        onClick={handleNextStarterQuestions}
                        title="Ver outras perguntas sugeridas"
                        className="text-[10px] text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition flex items-center gap-1 font-serif px-2 py-0.5 rounded-full hover:bg-stone-200/50 dark:hover:bg-slate-800 border border-teal-600/20 dark:border-teal-400/20"
                      >
                        <span>Outras</span>
                        <span className="text-xs">↻</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleStarterQuestions(false)}
                      title="Ocultar sugestões para liberar espaço"
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-slate-800 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Grade 100% Responsiva: 1 por linha no celular, 2 no tablet/desktop, sem nenhum corte de tela ou texto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {displayedQuestions.map((q) => (
                    <button
                      key={q.id || q.text}
                      type="button"
                      onClick={() => handleSelectStarterQuestion(q.text)}
                      disabled={isReflecting}
                      title={`Conduzir reflexão: "${q.text}"`}
                      className="w-full text-left p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-stone-800 dark:text-stone-100 border border-stone-200/90 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 transition-all shadow-2xs hover:shadow-xs active:scale-[0.99] flex items-start gap-2.5 disabled:opacity-50 cursor-pointer"
                    >
                      {q.category && (
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-semibold border border-teal-200/60 dark:border-teal-800/40 shrink-0 mt-0.5 tracking-wide">
                          {q.category}
                        </span>
                      )}
                      <span className="text-xs font-serif leading-relaxed text-stone-700 dark:text-stone-200 flex-1 break-words">
                        {q.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between py-0.5 px-0.5">
                <button
                  type="button"
                  onClick={() => handleToggleStarterQuestions(true)}
                  className="px-3 py-1 rounded-full bg-teal-50/90 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-800/60 text-[11px] font-serif font-medium text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                  <span>Ver perguntas sugeridas</span>
                </button>
              </div>
            )}
          </div>
        )}

        {isRecording ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4"
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
              <div>
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-100 block">
                  Gravando seu desabafo...
                </span>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                  {Math.floor(recordingDuration / 60)}:
                  {String(recordingDuration % 60).padStart(2, '0')} min
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={cancelAudioRecording}
                className="px-3 py-2 rounded-xl text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition min-h-[40px] active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={stopAudioRecording}
                className="px-4 py-2 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition min-h-[40px] active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Áudio</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSendReflection} className="relative flex items-center gap-2">
            <textarea
              rows={2}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReflection();
                }
              }}
              placeholder="O que está pesando na mente ou coração? Desabafe aqui..."
              disabled={isReflecting}
              className="w-full resize-none px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 dark:focus:border-teal-400 focus:ring-1 focus:ring-teal-700 text-base sm:text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 outline-none leading-relaxed transition pr-22 sm:pr-26 shadow-sm"
            />

            <div className="absolute right-2 sm:right-3 flex items-center gap-1">
              <button
                type="button"
                onClick={startAudioRecording}
                disabled={isReflecting}
                title="Gravar desabafo em áudio (com transcrição automática)"
                className="p-2 sm:p-2.5 rounded-full text-stone-500 hover:text-teal-800 dark:hover:text-teal-400 hover:bg-stone-100 dark:hover:bg-slate-700 transition min-w-[38px] min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] flex items-center justify-center active:scale-95"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={isReflecting || !inputVal.trim()}
                title="Enviar desabafo"
                className="p-2 sm:p-2.5 rounded-full bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white shadow-md shadow-teal-700/20 disabled:opacity-40 transition flex items-center justify-center min-w-[38px] min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        <div className="mt-1 text-center hidden sm:block">
          <span className="text-[10px] text-stone-400 dark:text-stone-500">
            Pressione Enter para enviar • Áudio transcrito automaticamente • Total sigilo
          </span>
        </div>
      </footer>
    </div>
  </div>
);
}
