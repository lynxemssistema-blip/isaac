import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  Play,
  Pause,
  Check,
  CheckCheck,
  X,
  Radio,
  Download,
} from 'lucide-react';
import {
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/api';

export default function UserNotificationsPopover({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [desktopPos, setDesktopPos] = useState({ top: 72, left: 16 });
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  const audioRef = useRef(null);
  const triggerRef = useRef(null);
  const lastFetchAtRef = useRef(0);

  const updatePopoverPosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    const vw = window.innerWidth;
    const mobile = vw < 640;
    setIsMobileViewport(mobile);

    if (!mobile && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const panelWidth = Math.min(384, vw - 24);
      // Ancora a borda direita ao botão do sino, mas trava dentro de [12px, vw - panelWidth - 12px]
      const idealLeft = rect.right - panelWidth;
      const clampedLeft = Math.max(12, Math.min(vw - panelWidth - 12, idealLeft));
      const top = Math.max(60, Math.min(window.innerHeight - 160, rect.bottom + 8));
      setDesktopPos({ top, left: clampedLeft, width: panelWidth });
    }
  }, []);

  const loadNotifications = async (force = false) => {
    if (!user?.id) return;
    if (!force && typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    const now = Date.now();
    if (!force && now - lastFetchAtRef.current < 10_000) {
      return;
    }
    lastFetchAtRef.current = now;

    try {
      const data = await fetchUserNotifications(user.id);
      setNotifications(data || []);
    } catch (err) {
      console.warn('Erro ao carregar notificações:', err);
    }
  };

  useEffect(() => {
    loadNotifications(true);
    const interval = setInterval(() => loadNotifications(false), 45_000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!isOpen) return;
    updatePopoverPosition();
    window.addEventListener('resize', updatePopoverPosition);
    window.addEventListener('scroll', updatePopoverPosition, true);
    return () => {
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [isOpen, updatePopoverPosition]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const closePopover = () => {
    setIsOpen(false);
    if (audioRef.current) audioRef.current.pause();
    setPlayingAudioId(null);
  };

  const handleTogglePlay = (notif) => {
    if (!notif.audio_url) return;

    if (playingAudioId === notif.id) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(notif.id);
      if (audioRef.current) {
        audioRef.current.src = notif.audio_url;
        audioRef.current.play().catch(console.error);
      }
      if (!notif.is_read) {
        handleMarkAsRead(notif.id);
      }
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  const popoverNode =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
          <>
            {/* Backdrop em tela cheia fora do <header> (imune ao containing block de backdrop-blur) */}
            <div
              className="fixed inset-0 z-[90] bg-stone-950/25 sm:bg-transparent backdrop-blur-[1px] sm:backdrop-blur-none"
              onClick={closePopover}
            />

            <div
              role="dialog"
              aria-label="Comunicados da Mentoria"
              style={
                isMobileViewport
                  ? {
                      position: 'fixed',
                      top: 'calc(max(0.5rem, env(safe-area-inset-top, 0px)) + 3.75rem)',
                      left: '0.75rem',
                      right: '0.75rem',
                      maxHeight: 'calc(100dvh - 5.5rem)',
                    }
                  : {
                      position: 'fixed',
                      top: `${desktopPos.top}px`,
                      left: `${desktopPos.left}px`,
                      width: `${desktopPos.width || 384}px`,
                      maxHeight: 'calc(100dvh - 6rem)',
                    }
              }
              className="rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-2xl z-[95] overflow-hidden flex flex-col text-stone-800 dark:text-stone-100 font-sans animate-fadeIn"
            >
              {/* Header do Popover */}
              <div className="p-3.5 sm:p-4 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-serif font-bold text-stone-900 dark:text-white truncate">
                      Comunicados da Mentoria
                    </h4>
                    <p className="text-[10px] text-stone-400 truncate">
                      Recados e áudios enviados para você
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Marcar todas</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={closePopover}
                    title="Fechar caixa de recados"
                    className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lista de Notificações */}
              <div className="flex-1 min-h-0 max-h-[65dvh] sm:max-h-96 overflow-y-auto overscroll-contain p-3 space-y-2">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-stone-400 space-y-1">
                    <Bell className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">Nenhum recado recente</p>
                    <p className="text-[11px] text-stone-400">
                      Quando o mentor enviar uma mensagem ou áudio para você ou seu grupo, ela aparecerá aqui.
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isPlaying = playingAudioId === n.id;
                    const dateStr = new Date(n.created_at).toLocaleDateString('pt-BR', {
                      timeZone: 'America/Sao_Paulo',
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    });

                    return (
                      <div
                        key={n.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          !n.is_read
                            ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700/80 shadow-xs'
                            : 'bg-stone-50/80 dark:bg-slate-800/40 border-stone-200/70 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400 shrink-0" />
                            )}
                            <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100 break-words line-clamp-2">
                              {n.title}
                            </h5>
                          </div>

                          <span className="text-[10px] text-stone-400 shrink-0 font-mono">
                            {dateStr}
                          </span>
                        </div>

                        {n.content && (
                          <p className="text-xs text-stone-600 dark:text-stone-300 mb-2 leading-relaxed whitespace-pre-wrap break-words">
                            {n.content}
                          </p>
                        )}

                        {/* Player de Áudio Embutido */}
                        {n.audio_url && (
                          <div className="mt-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-900/60 flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => handleTogglePlay(n)}
                              className="w-8 h-8 rounded-full bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-sm transition active:scale-95 cursor-pointer"
                            >
                              {isPlaying ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5 ml-0.5" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between text-[10px] text-teal-800 dark:text-teal-300 font-medium">
                                <span>Mensagem de Voz</span>
                                <span>{isPlaying ? 'Reproduzindo...' : 'Ouvir Mentor'}</span>
                              </div>
                              <div className="w-full bg-stone-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full bg-teal-600 rounded-full transition-all duration-300 ${
                                    isPlaying ? 'w-2/3 animate-pulse' : 'w-0'
                                  }`}
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              title="Baixar áudio do comunicado"
                              onClick={async () => {
                                try {
                                  const resp = await fetch(n.audio_url);
                                  const blob = await resp.blob();
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `comunicado-isaac-${n.id || 'audio'}.mp3`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  setTimeout(() => URL.revokeObjectURL(url), 10000);
                                } catch {
                                  window.open(n.audio_url, '_blank', 'noopener,noreferrer');
                                }
                              }}
                              className="w-8 h-8 rounded-full bg-stone-100 dark:bg-slate-700 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 transition active:scale-95 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {!n.is_read && (
                          <div className="flex justify-end mt-2">
                            <button
                              type="button"
                              onClick={() => handleMarkAsRead(n.id)}
                              className="text-[10px] text-stone-400 hover:text-teal-700 dark:hover:text-teal-400 flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              Marcar como lida
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <div className="relative">
      <audio
        ref={audioRef}
        onEnded={() => setPlayingAudioId(null)}
        onError={() => setPlayingAudioId(null)}
        className="hidden"
      />

      {/* Botão de Sino de Notificações / Caixa de Recados */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) {
            updatePopoverPosition();
            loadNotifications(true);
          }
        }}
        title="Caixa de Recados & Comunicados da Mentoria"
        className="relative p-1.5 sm:p-2 text-stone-500 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-stone-200/60 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {popoverNode}
    </div>
  );
}
