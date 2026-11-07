import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Lock,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  UserCheck,
  UserPlus,
  Image as ImageIcon,
  Pause,
  Play,
  XCircle,
  Loader2,
  Sliders,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  fetchAdminWhatsappOutreachOverview,
  syncAdminEvolutionContactsApi,
  createAdminWhatsappCampaignApi,
  controlAdminWhatsappCampaignApi,
  sendAdminWhatsappOutreachPreviewApi,
  updateAdminWhatsappSafetyApi,
} from '../services/adminApi';

const STATUS_BADGES = {
  queued: { label: 'Na Fila Agendada', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  sending: { label: 'Enviando...', cls: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30' },
  sent: { label: 'Enviado c/ Sucesso', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  blocked_safety_lock: { label: 'Bloqueado (Trava 31995574906)', cls: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30' },
  skipped_opt_out: { label: 'Opt-Out Respeitado', cls: 'bg-stone-500/15 text-stone-700 dark:text-stone-300 border-stone-500/30' },
  skipped_cooldown: { label: 'Cooldown Anti-Spam', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  skipped_invalid_whatsapp: { label: 'Sem WhatsApp Ativo', cls: 'bg-stone-500/15 text-stone-600 dark:text-stone-400 border-stone-500/30' },
  cancelled: { label: 'Cancelado', cls: 'bg-stone-500/15 text-stone-600 dark:text-stone-400 border-stone-500/30' },
  failed: { label: 'Falha', cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' },
};

export default function AdminEvolutionContacts({ currentUser }) {
  const isMaster =
    currentUser?.role === 'master' ||
    String(currentUser?.email || '').trim().toLowerCase() === 'edsonmanoel2012@gmail.com';

  const [subTab, setSubTab] = useState('contacts'); // 'contacts' | 'schedule' | 'control'
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [overview, setOverview] = useState({
    safety: {
      restrictedMode: true,
      allowedPhonesRaw: '31995574906',
      dailyLimit: 40,
      cooldownHours: 72,
    },
    stats: {
      totalContacts: 0,
      totalRegistered: 0,
      totalUnregistered: 0,
      totalOptOut: 0,
      sentLast24h: 0,
      dailyLimit: 40,
    },
    contacts: [],
    filteredTotal: 0,
    campaigns: [],
    recentLogs: [],
    defaultImageUrl: 'https://isaac.lynxems.com.br/og-isaac-cover.jpg',
    sampleUnregisteredText: '',
    sampleRegisteredText: '',
  });

  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [sendingPreviewKey, setSendingPreviewKey] = useState('');

  // Form de Agendamento / Campanha Anti-Ban
  const [campTitle, setCampTitle] = useState('Campanha Controlada Mentoria ISAAC');
  const [audienceType, setAudienceType] = useState('mixed'); // 'selected' | 'unregistered' | 'registered' | 'mixed'
  const [scheduleMode, setScheduleMode] = useState('now'); // 'now' | 'later'
  const [scheduledAtInput, setScheduledAtInput] = useState('');
  const [minDelaySec, setMinDelaySec] = useState(18);
  const [maxDelaySec, setMaxDelaySec] = useState(38);
  const [dailyLimit, setDailyLimit] = useState(40);
  const [windowStart, setWindowStart] = useState('08:30');
  const [windowEnd, setWindowEnd] = useState('20:00');
  const [respectWindow, setRespectWindow] = useState(true);
  const [unregisteredImageUrl, setUnregisteredImageUrl] = useState('https://isaac.lynxems.com.br/og-isaac-cover.jpg');
  const [unregisteredTemplate, setUnregisteredTemplate] = useState('');
  const [registeredTemplate, setRegisteredTemplate] = useState('');
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // Modal / Seção de Segurança (Master)
  const [showSafetyConfig, setShowSafetyConfig] = useState(false);
  const [safetyRestricted, setSafetyRestricted] = useState(true);
  const [safetyPhones, setSafetyPhones] = useState('31995574906');
  const [safetyDailyLimit, setSafetyDailyLimit] = useState(40);
  const [safetyCooldownHours, setSafetyCooldownHours] = useState(72);
  const [savingSafety, setSavingSafety] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const loadOverview = useCallback(
    async (opts = {}) => {
      try {
        setErrorMsg('');
        const data = await fetchAdminWhatsappOutreachOverview({
          search: opts.search !== undefined ? opts.search : search,
          filter: opts.filter !== undefined ? opts.filter : filter,
          limit: 250,
        });
        setOverview(data);
        setSafetyRestricted(Boolean(data.safety?.restrictedMode));
        setSafetyPhones(data.safety?.allowedPhonesRaw || '31995574906');
        setSafetyDailyLimit(data.safety?.dailyLimit || 40);
        setSafetyCooldownHours(data.safety?.cooldownHours ?? 72);
        setDailyLimit(data.safety?.dailyLimit || 40);
        if (!unregisteredTemplate && data.sampleUnregisteredText) {
          setUnregisteredTemplate('');
        }
      } catch (err) {
        setErrorMsg(err.message || 'Erro ao carregar dados do WhatsApp.');
      } finally {
        setLoading(false);
      }
    },
    [search, filter, unregisteredTemplate]
  );

  useEffect(() => {
    loadOverview();
  }, [filter]);

  const handleSyncContacts = async () => {
    try {
      setSyncing(true);
      setErrorMsg('');
      const res = await syncAdminEvolutionContactsApi();
      showToast(
        `Sincronização concluída: ${res.syncedTotal} contatos (${res.registeredCount} já no App e ${res.unregisteredCount} não cadastrados).`
      );
      await loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao sincronizar contatos da Evolution.');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleSelectContact = (id) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDirectSendFlow = async (phone, flowType) => {
    const key = `${phone}:${flowType}`;
    try {
      setSendingPreviewKey(key);
      setErrorMsg('');
      const res = await sendAdminWhatsappOutreachPreviewApi({
        phone,
        flowType,
        customImageUrl: unregisteredImageUrl,
        customTemplate: flowType === 'unregistered_invite_image' ? unregisteredTemplate : registeredTemplate,
      });
      if (res.outcome === 'sent') {
        showToast(
          flowType === 'unregistered_invite_image'
            ? `Convite com Imagem do ISAAC enviado com sucesso para ${phone}!`
            : `Mensagem integrada (Planos Grátis & Pago) enviada com sucesso para ${phone}!`
        );
      } else {
        setErrorMsg(`Resultado do disparo: ${res.outcome} ${res.error || res.reason || ''}`);
      }
      await loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao enviar mensagem.');
    } finally {
      setSendingPreviewKey('');
    }
  };

  const handleScheduleCampaign = async (e) => {
    e.preventDefault();
    try {
      setCreatingCampaign(true);
      setErrorMsg('');

      if (audienceType === 'selected' && selectedContactIds.length === 0) {
        setErrorMsg('Selecione pelo menos 1 contato na aba "Lista de Contatos" ou escolha outro público-alvo.');
        return;
      }

      const scheduledIso =
        scheduleMode === 'later' && scheduledAtInput
          ? new Date(scheduledAtInput).toISOString()
          : new Date().toISOString();

      const res = await createAdminWhatsappCampaignApi({
        title: campTitle,
        audienceType,
        contactIds: audienceType === 'selected' ? selectedContactIds : [],
        scheduledAt: scheduledIso,
        minDelaySec: Number(minDelaySec) || 18,
        maxDelaySec: Number(maxDelaySec) || 38,
        dailyLimit: Number(dailyLimit) || 40,
        windowStartHhmm: windowStart,
        windowEndHhmm: windowEnd,
        respectWindow: scheduleMode === 'now' ? false : respectWindow,
        unregisteredImageUrl,
        unregisteredTemplate,
        registeredTemplate,
      });

      showToast(
        `Campanha criada com sucesso! ${res.queuedCount} contato(s) enfileirado(s) com proteção Anti-Ban.`
      );
      setSelectedContactIds([]);
      setSubTab('control');
      await loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao agendar envio.');
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleCampaignControl = async (campaignId, action) => {
    try {
      await controlAdminWhatsappCampaignApi(campaignId, action);
      showToast(`Campanha atualizada (${action}).`);
      await loadOverview();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleSaveSafety = async (e) => {
    e.preventDefault();
    try {
      setSavingSafety(true);
      await updateAdminWhatsappSafetyApi({
        restrictedMode: safetyRestricted,
        allowedPhones: safetyPhones,
        dailyLimit: Number(safetyDailyLimit) || 40,
        cooldownHours: Number(safetyCooldownHours) ?? 72,
      });
      showToast('Configurações de Trava de Segurança e Anti-Ban salvas!');
      setShowSafetyConfig(false);
      await loadOverview();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSavingSafety(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* BANNER DE TRAVA DE SEGURANÇA & ANTI-BAN META */}
      <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/90 dark:bg-emerald-950/35 border border-emerald-300/80 dark:border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-serif font-bold text-emerald-950 dark:text-emerald-200">
                {overview.safety?.restrictedMode
                  ? `Trava de Segurança Ativa: Envios liberados SOMENTE para ${overview.safety?.allowedPhonesRaw}`
                  : 'Modo de Disparo Geral Ativo (Respeitando Limites Anti-Ban da Meta)'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                Anti-Ban Meta Ativo
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
              Cadência humana aleatória ({minDelaySec}s–{maxDelaySec}s + presença de digitação), validação prévia de WhatsApp, respeito automático ao &ldquo;parar&rdquo; (opt-out) e teto de {overview.safety?.dailyLimit} envios/24h.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isMaster && (
            <button
              type="button"
              onClick={() => setShowSafetyConfig((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configurar Trava / Limites</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleSyncContacts}
            disabled={syncing}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Sincronizando Evolution...' : 'Sincronizar Contatos da Evolution'}</span>
          </button>
        </div>
      </div>

      {/* PAINEL DE CONFIGURAÇÃO DA TRAVA DE SEGURANÇA (MASTER) */}
      {isMaster && showSafetyConfig && (
        <form
          onSubmit={handleSaveSafety}
          className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 space-y-4 shadow-md"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Controle Master da Trava de Segurança &amp; Regras Anti-Ban
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="sm:col-span-3 flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 cursor-pointer">
              <div>
                <span className="block text-xs font-bold text-stone-900 dark:text-white">
                  Restringir envios apenas aos números autorizados abaixo
                </span>
                <span className="block text-[11px] text-stone-500 dark:text-stone-400">
                  Enquanto marcado, nenhum outro contato da Evolution receberá mensagens acidentalmente.
                </span>
              </div>
              <input
                type="checkbox"
                checked={safetyRestricted}
                onChange={(e) => setSafetyRestricted(e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
            </label>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Número(s) Autorizado(s) na Trava
              </label>
              <input
                type="text"
                value={safetyPhones}
                onChange={(e) => setSafetyPhones(e.target.value)}
                placeholder="31995574906"
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Limite Máximo Diário (24h)
              </label>
              <input
                type="number"
                min={1}
                max={250}
                value={safetyDailyLimit}
                onChange={(e) => setSafetyDailyLimit(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Cooldown Mínimo por Contato (horas)
              </label>
              <input
                type="number"
                min={0}
                max={720}
                value={safetyCooldownHours}
                onChange={(e) => setSafetyCooldownHours(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowSafetyConfig(false)}
              className="px-4 py-2 rounded-xl text-xs text-stone-500 hover:text-stone-800"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={savingSafety}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {savingSafety ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Salvar Trava &amp; Regras</span>
            </button>
          </div>
        </form>
      )}

      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CARDS DE MÉTRICAS DOS CONTATOS E ENVIOS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Contatos na Evolution</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 dark:text-white">
            {overview.stats?.totalContacts || 0}
          </div>
          <span className="text-[11px] text-stone-400">Importados do WhatsApp</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Já Cadastrados no App</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-700 dark:text-emerald-400">
            {overview.stats?.totalRegistered || 0}
          </div>
          <span className="text-[11px] text-stone-400">Fluxo: Integração + Planos</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Não Cadastrados</span>
            <UserPlus className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-700 dark:text-amber-400">
            {overview.stats?.totalUnregistered || 0}
          </div>
          <span className="text-[11px] text-stone-400">Fluxo: Imagem ISAAC + Convite</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Envios 24h (Meta Safe)</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 dark:text-white">
            {overview.stats?.sentLast24h || 0}
            <span className="text-xs font-normal text-stone-400"> / {overview.stats?.dailyLimit || 40}</span>
          </div>
          <span className="text-[11px] text-stone-400">
            Opt-outs respeitados: {overview.stats?.totalOptOut || 0}
          </span>
        </div>
      </div>

      {/* SUB-ABAS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setSubTab('contacts')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'contacts'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Lista de Contatos Evolution ({overview.filteredTotal || 0})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('schedule')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'schedule'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Programar Envio Anti-Ban
        </button>

        <button
          type="button"
          onClick={() => setSubTab('control')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'control'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Controle &amp; Auditoria de Envios ({overview.recentLogs?.length || 0})
        </button>
      </div>

      {/* ================================================================ */}
      {/* SUB-ABA 1: LISTA DE CONTATOS SINCRONIZADOS DA EVOLUTION          */}
      {/* ================================================================ */}
      {subTab === 'contacts' && (
        <div className="bg-white/90 dark:bg-slate-800/80 rounded-3xl border border-stone-200 dark:border-slate-700 p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'allowed_only', label: 'Autorizado (31995574906)' },
                { id: 'registered', label: 'Já Cadastrados no App' },
                { id: 'unregistered', label: 'Não Cadastrados' },
                { id: 'sent', label: 'Já Receberam Envio' },
                { id: 'opt_out', label: 'Opt-Out (Parar)' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    filter === f.id
                      ? 'bg-teal-700 text-white'
                      : 'bg-stone-100 dark:bg-slate-900 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadOverview({ search });
              }}
              className="flex items-center gap-2 w-full md:w-72"
            >
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar nome ou telefone..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs text-stone-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-stone-900 dark:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Filtrar
              </button>
            </form>
          </div>

          {selectedContactIds.length > 0 && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                {selectedContactIds.length} contato(s) selecionado(s) para envio programado
              </span>
              <button
                type="button"
                onClick={() => {
                  setAudienceType('selected');
                  setSubTab('schedule');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
              >
                Programar Envio para Selecionados →
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-stone-400">
              <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-teal-600" />
              <p className="text-xs">Carregando lista de contatos do WhatsApp...</p>
            </div>
          ) : overview.contacts?.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <MessageCircle className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-sm font-serif text-stone-700 dark:text-stone-200">
                Nenhum contato encontrado neste filtro.
              </p>
              <button
                type="button"
                onClick={handleSyncContacts}
                disabled={syncing}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>Importar Contatos da Evolution Agora</span>
              </button>
            </div>
          ) : (
            <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1">
              {overview.contacts.map((c) => {
                const isSelected = selectedContactIds.includes(c.id);
                const canSend = c.is_allowed_by_safety_lock && !c.opt_out;
                return (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition ${
                      c.is_allowed_by_safety_lock
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/60'
                        : 'bg-stone-50/80 dark:bg-slate-900/50 border-stone-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!canSend}
                        onChange={() => handleToggleSelectContact(c.id)}
                        className="w-4 h-4 accent-emerald-600 shrink-0 disabled:opacity-30"
                      />

                      {c.profile_pic_url ? (
                        <img
                          src={c.profile_pic_url}
                          alt={c.push_name || c.phone_digits}
                          className="w-9 h-9 rounded-full object-cover shrink-0 bg-stone-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-teal-600/15 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {(c.app_full_name || c.push_name || 'W').slice(0, 1).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-stone-900 dark:text-white truncate">
                            {c.app_full_name || c.push_name || 'Contato WhatsApp'}
                          </span>
                          {c.is_registered_user ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              Cadastrado no App ({c.app_plan_id === 'whatsapp_monthly' ? 'Plano Pago' : 'Plano Grátis'})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                              Não Cadastrado • Convite c/ Imagem ISAAC
                            </span>
                          )}
                          {c.is_allowed_by_safety_lock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                              Liberado p/ Disparo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-200 dark:bg-slate-800 text-stone-500">
                              Protegido pela Trava
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                          <span>📱 {c.phone_digits}</span>
                          {c.app_email && <span>✉️ {c.app_email}</span>}
                          {c.outreach_count > 0 && (
                            <span className="text-teal-700 dark:text-teal-400 font-medium">
                              Envios realizados: {c.outreach_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AÇÕES RÁPIDAS NO CONTATO AUTORIZADO */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {c.is_allowed_by_safety_lock ? (
                        <>
                          <button
                            type="button"
                            disabled={Boolean(sendingPreviewKey)}
                            onClick={() => handleDirectSendFlow(c.phone_digits, 'unregistered_invite_image')}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            title="Testar envio de Convite com Imagem Oficial do ISAAC"
                          >
                            {sendingPreviewKey === `${c.phone_digits}:unregistered_invite_image` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5" />
                            )}
                            <span>Enviar Convite c/ Imagem ISAAC</span>
                          </button>

                          <button
                            type="button"
                            disabled={Boolean(sendingPreviewKey)}
                            onClick={() => handleDirectSendFlow(c.phone_digits, 'registered_plans_integration')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            title="Enviar mensagem integrada apresentando Plano Gratuito e Plano Pago"
                          >
                            {sendingPreviewKey === `${c.phone_digits}:registered_plans_integration` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            <span>Enviar Planos Grátis &amp; Pago</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Bloqueado pela Trava (31995574906)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* SUB-ABA 2: PROGRAMAR ENVIO DE MENSAGENS (AGENDADOR ANTI-BAN)     */}
      {/* ================================================================ */}
      {subTab === 'schedule' && (
        <form
          onSubmit={handleScheduleCampaign}
          className="bg-white/90 dark:bg-slate-800/80 rounded-3xl border border-stone-200 dark:border-slate-700 p-6 space-y-6"
        >
          <div>
            <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Programar Envio Inteligente para Contatos do WhatsApp
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              O sistema identifica automaticamente quem <strong>não está no App</strong> (envia a Imagem do ISAAC + convite) e quem <strong>já está no App</strong> (integra com o perfil e apresenta o Plano Gratuito e o Plano Pago).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                Nome da Programação / Campanha *
              </label>
              <input
                type="text"
                required
                value={campTitle}
                onChange={(e) => setCampTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs text-stone-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                Público-Alvo *
              </label>
              <select
                value={audienceType}
                onChange={(e) => setAudienceType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs text-stone-900 dark:text-white"
              >
                <option value="mixed">Todos Elegíveis (Automático: Não Cadastrados vs Já Cadastrados)</option>
                <option value="unregistered">Apenas Não Cadastrados no App (Imagem ISAAC + Convite)</option>
                <option value="registered">Apenas Já Cadastrados no App (Integração + Planos Grátis/Pago)</option>
                <option value="selected">Contatos Selecionados Manualmente ({selectedContactIds.length})</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                Quando Disparar
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleMode('now')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                    scheduleMode === 'now'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  Iniciar Agora
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode('later')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                    scheduleMode === 'later'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-stone-50 dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  Agendar Data &amp; Hora
                </button>
              </div>
              {scheduleMode === 'later' && (
                <input
                  type="datetime-local"
                  required
                  value={scheduledAtInput}
                  onChange={(e) => setScheduledAtInput(e.target.value)}
                  className="mt-2 w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs text-stone-900 dark:text-white"
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-stone-500 mb-1">
                  Delay Mín. (s)
                </label>
                <input
                  type="number"
                  min={10}
                  max={180}
                  value={minDelaySec}
                  onChange={(e) => setMinDelaySec(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 mb-1">
                  Delay Máx. (s)
                </label>
                <input
                  type="number"
                  min={15}
                  max={300}
                  value={maxDelaySec}
                  onChange={(e) => setMaxDelaySec(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs text-stone-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 mb-1">
                  Teto / Dia
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs text-stone-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* PREVIEW E PERSONALIZAÇÃO DOS 2 FLUXOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* CARD FLUXO 1: NÃO CADASTRADOS */}
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  1. Para Não Cadastrados no App (Imagem do ISAAC + Convite)
                </span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-slate-700">
                <img
                  src={unregisteredImageUrl}
                  alt="Capa ISAAC"
                  className="w-16 h-10 object-cover rounded-lg border border-stone-200 shrink-0"
                />
                <input
                  type="url"
                  value={unregisteredImageUrl}
                  onChange={(e) => setUnregisteredImageUrl(e.target.value)}
                  className="flex-1 text-[11px] bg-transparent outline-none text-stone-700 dark:text-stone-200"
                  placeholder="URL da imagem do ISAAC"
                />
              </div>
              <textarea
                rows={6}
                value={unregisteredTemplate}
                onChange={(e) => setUnregisteredTemplate(e.target.value)}
                placeholder={overview.sampleUnregisteredText || 'Deixe em branco para usar a rotação automática Anti-Ban personalizada com {saudacao} e {nome}...'}
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200"
              />
              <p className="text-[11px] text-stone-500">
                Se deixado em branco, o motor aplica variações automáticas Anti-Ban com a imagem oficial do ISAAC.
              </p>
            </div>

            {/* CARD FLUXO 2: JÁ CADASTRADOS */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  2. Para Já Cadastrados no App (Integração + Planos Grátis &amp; Pago)
                </span>
              </div>
              <textarea
                rows={8}
                value={registeredTemplate}
                onChange={(e) => setRegisteredTemplate(e.target.value)}
                placeholder={overview.sampleRegisteredText || 'Deixe em branco para usar a mensagem integrada ao perfil do usuário com os detalhes do Plano Gratuito (R$ 0,00) e Plano Pago (R$ 14,99/mês)...'}
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200"
              />
              <p className="text-[11px] text-stone-500">
                Integra automaticamente o nome, objetivo/sessão recente do usuário no App + Mural de Notificações.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={creatingCampaign}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {creatingCampaign ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{scheduleMode === 'later' ? 'Salvar Programação Agendada' : 'Iniciar Fila Controlada Agora'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ================================================================ */}
      {/* SUB-ABA 3: PAINEL DE CONTROLE DE CAMPANHAS E AUDITORIA           */}
      {/* ================================================================ */}
      {subTab === 'control' && (
        <div className="space-y-5">
          {/* CAMPANHAS PROGRAMADAS / EM EXECUÇÃO */}
          <div className="bg-white/90 dark:bg-slate-800/80 rounded-3xl border border-stone-200 dark:border-slate-700 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-stone-900 dark:text-white">
                Campanhas &amp; Agendamentos ({overview.campaigns?.length || 0})
              </h3>
              <button
                type="button"
                onClick={() => loadOverview()}
                className="text-xs text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Atualizar Status
              </button>
            </div>

            {overview.campaigns?.length === 0 ? (
              <p className="text-xs text-stone-400 italic">Nenhuma campanha registrada ainda.</p>
            ) : (
              <div className="space-y-2.5">
                {overview.campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 dark:text-white">
                          {camp.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/15 text-teal-700 dark:text-teal-300">
                          Status: {camp.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">
                        Programado: {new Date(camp.scheduled_at).toLocaleString('pt-BR')} • Alvos: {camp.total_targets} • Enviados: <strong>{camp.sent_count}</strong> • Bloqueados Trava: {camp.blocked_safety_count} • Falhas: {camp.failed_count}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {camp.status === 'running' || camp.status === 'scheduled' ? (
                        <button
                          type="button"
                          onClick={() => handleCampaignControl(camp.id, 'pause')}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5" /> Pausar
                        </button>
                      ) : camp.status === 'paused' ? (
                        <button
                          type="button"
                          onClick={() => handleCampaignControl(camp.id, 'resume')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" /> Retomar
                        </button>
                      ) : null}

                      {['scheduled', 'running', 'paused'].includes(camp.status) && (
                        <button
                          type="button"
                          onClick={() => handleCampaignControl(camp.id, 'cancel')}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LOG DE AUDITORIA INDIVIDUAL POR CONTATO */}
          <div className="bg-white/90 dark:bg-slate-800/80 rounded-3xl border border-stone-200 dark:border-slate-700 p-5 space-y-3">
            <h3 className="text-sm font-serif font-bold text-stone-900 dark:text-white">
              Registro Individual de Controle de Envios (Auditoria Anti-Ban)
            </h3>

            {overview.recentLogs?.length === 0 ? (
              <p className="text-xs text-stone-400 italic">Nenhum disparo registrado ainda.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {overview.recentLogs.map((log) => {
                  const badge = STATUS_BADGES[log.status] || { label: log.status, cls: 'bg-stone-200 text-stone-700' };
                  return (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-stone-900 dark:text-white">
                            {log.recipient_name || log.phone_digits}
                          </span>
                          <span className="text-[11px] text-stone-400 font-mono">
                            ({log.phone_digits})
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.cls}`}>
                            {badge.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-200/70 dark:bg-slate-800 text-stone-700 dark:text-stone-300">
                            {log.flow_type === 'unregistered_invite_image'
                              ? '🖼️ Imagem ISAAC + Convite'
                              : '🤝 Integração + Planos Grátis/Pago'}
                          </span>
                        </div>
                        {log.error_reason && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400">{log.error_reason}</p>
                        )}
                        <p className="text-[10px] text-stone-400">
                          {log.sent_at
                            ? `Enviado em ${new Date(log.sent_at).toLocaleString('pt-BR')} • Cadência humana: ${log.anti_ban_delay_ms || 0}ms • ID: ${log.evolution_message_id || '-'}`
                            : `Agendado para ${log.scheduled_for ? new Date(log.scheduled_for).toLocaleString('pt-BR') : '-'}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
