import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Shield,
  Zap,
  TrendingUp,
  Target,
  Sparkles,
  BookOpen,
  Filter,
  Eye,
  Save,
  X,
  Flame,
  Activity,
  Heart,
  HelpCircle,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import {
  fetchAdminCreativeTroubles,
  saveAdminMentorNotes,
} from '../services/creativeTroublesApi';

const POSTURE_NAMES = {
  1: { name: 'Reclamar', color: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30' },
  2: { name: 'Justificar', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  3: { name: 'Reconhecer', color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30' },
  4: { name: 'Investigar', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  5: { name: 'Analisar', color: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30' },
  6: { name: 'Decidir', color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30' },
  7: { name: 'Propor', color: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30' },
  8: { name: 'Experimentar', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  9: { name: 'Adaptar', color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30' },
  10: { name: 'Consolidar', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30' },
};

export default function AdminCreativeTroubles({ currentUser }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [troubles, setTroubles] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    reactiveCount: 0,
    executiveCount: 0,
    avgIntensity: 0,
    avgInfluence: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [postureFilter, setPostureFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal de Detalhes / Prontuário Clínico
  const [selectedTrouble, setSelectedTrouble] = useState(null);
  const [mentorNotesText, setMentorNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const loadData = async () => {
    try {
      setRefreshing(true);
      const data = await fetchAdminCreativeTroubles();
      if (data && data.troubles) {
        setTroubles(data.troubles);
        setMetrics(data.metrics || {});
      }
    } catch (err) {
      console.error('Erro ao carregar dados do Incômodo Criativo:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openReportModal = (trouble) => {
    setSelectedTrouble(trouble);
    setMentorNotesText(trouble.mentor_notes || '');
    setFeedbackMsg('');
  };

  const handleSaveNotes = async () => {
    if (!selectedTrouble) return;
    try {
      setSavingNotes(true);
      const updated = await saveAdminMentorNotes(
        selectedTrouble.id,
        mentorNotesText,
        currentUser?.id
      );
      setFeedbackMsg('✅ Anotações do mentor salvas com sucesso!');
      setSelectedTrouble(prev => ({
        ...prev,
        mentor_notes: mentorNotesText,
        reviewed_at: new Date().toISOString(),
      }));
      setTroubles(prev =>
        prev.map(t =>
          t.id === selectedTrouble.id
            ? { ...t, mentor_notes: mentorNotesText, reviewed_at: new Date().toISOString() }
            : t
        )
      );
    } catch (err) {
      setFeedbackMsg('❌ Erro ao salvar notas: ' + err.message);
    } finally {
      setSavingNotes(false);
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
  };

  // Filtragem dos registros
  const filteredTroubles = troubles.filter((t) => {
    const userName = (t.user?.full_name || '').toLowerCase();
    const userEmail = (t.user?.email || '').toLowerCase();
    const fact = (t.fact_description || '').toLowerCase();
    const title = (t.title || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      userName.includes(term) ||
      userEmail.includes(term) ||
      fact.includes(term) ||
      title.includes(term);

    const matchesPosture =
      postureFilter === 'all' ||
      (postureFilter === 'reactive' && t.posture_level <= 2) ||
      (postureFilter === 'constructive' && t.posture_level >= 3 && t.posture_level <= 6) ||
      (postureFilter === 'executive' && t.posture_level >= 7);

    const matchesStatus =
      statusFilter === 'all' || t.status === statusFilter;

    return matchesSearch && matchesPosture && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-stone-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400">
              <Compass className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Prontuários: Incômodo Criativo
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              Acesso Exclusivo Mentor
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-slate-400 mt-1">
            Relatórios clínicos e direcionamentos baseados na metodologia do Thiago Prata e na escala de David Hawkins.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar Diagnósticos
        </button>
      </div>

      {/* CARDS DE MÉTRICAS CLÍNICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total de Casos</span>
            <Activity className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {metrics.total || 0}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-slate-400 mt-1">
            Incômodos mapeados
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Posturas Reativas</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {metrics.reactiveCount || 0}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-slate-400 mt-1">
            [1] Reclamar / [2] Justificar
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Posturas Executivas</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.executiveCount || 0}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-slate-400 mt-1">
            [7] Propor a [10] Consolidar
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Média IRRI</span>
            <Sliders className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-baseline gap-1">
            <span>{metrics.avgIntensity}</span>
            <span className="text-xs font-normal text-stone-500">I / {metrics.avgInfluence} Inf</span>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-slate-400 mt-1">
            Intensidade vs Influência
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por nome do mentorado, e-mail ou palavras do incômodo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={postureFilter}
            onChange={(e) => setPostureFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-200"
          >
            <option value="all">Todas as Posturas</option>
            <option value="reactive">Reativas ([1] e [2])</option>
            <option value="constructive">Construtivas ([3] a [6])</option>
            <option value="executive">Executivas ([7] a [10])</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-200"
          >
            <option value="all">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="em_experimentacao">Em Experimentação</option>
            <option value="superado">Superado / Consolidado</option>
          </select>
        </div>
      </div>

      {/* LISTAGEM DOS PRONTUÁRIOS */}
      {loading ? (
        <div className="p-12 text-center text-stone-500 dark:text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
          Carregando prontuários de incômodos...
        </div>
      ) : filteredTroubles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-500 dark:text-slate-400">
          <Compass className="w-10 h-10 mx-auto mb-3 opacity-30 text-teal-600" />
          <p className="font-semibold text-stone-800 dark:text-stone-200">
            Nenhum incômodo criativo encontrado
          </p>
          <p className="text-xs mt-1">
            Assim que os mentorados utilizarem a ferramenta, os relatórios aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTroubles.map((item) => {
            const posture = POSTURE_NAMES[item.posture_level] || POSTURE_NAMES[1];
            const hasNotes = Boolean(item.mentor_notes && item.mentor_notes.trim());

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs hover:border-teal-500/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* DADOS DO USUÁRIO & FATO */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {item.user?.full_name || 'Usuário Sem Nome'}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-slate-400">
                      ({item.user?.email || 'sem e-mail'})
                    </span>
                    <span className="text-xs text-stone-400">·</span>
                    <span className="text-xs text-stone-400">
                      {new Date(item.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {hasNotes && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        Anotado pelo Mentor
                      </span>
                    )}
                  </div>

                  {/* FATO CONCRETO RESUMIDO */}
                  <div className="text-xs text-stone-700 dark:text-slate-300 line-clamp-2">
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      Fato Concreto:{' '}
                    </span>
                    {item.fact_description}
                  </div>

                  {/* BADGES METODOLÓGICAS */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Postura */}
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${posture.color}`}
                    >
                      [{item.posture_level}] {posture.name}
                    </span>

                    {/* Estado Hawkins */}
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 capitalize">
                      Hawkins: {item.internal_state}
                    </span>

                    {/* Gatilho / Tipo */}
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 capitalize">
                      {item.trouble_type}
                    </span>

                    {/* Matriz IRRI */}
                    <div className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700">
                      <span>I:{item.intensity_score}</span>
                      <span>·</span>
                      <span>R:{item.relevance_score}</span>
                      <span>·</span>
                      <span>Resp:{item.responsibility_score}</span>
                      <span>·</span>
                      <span>Inf:{item.influence_score}</span>
                    </div>
                  </div>
                </div>

                {/* BOTÃO ABRIR PRONTUÁRIO */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => openReportModal(item)}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition"
                  >
                    <Eye className="w-4 h-4" />
                    Abrir Prontuário Clínico
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE PRONTUÁRIO CLÍNICO COMPLETO */}
      {selectedTrouble && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            {/* TOPO DO MODAL */}
            <div className="p-5 border-b border-stone-200 dark:border-slate-800 flex items-start justify-between gap-4 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-teal-600/10 text-teal-600 dark:text-teal-400">
                    <Compass className="w-4 h-4" />
                  </span>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    Prontuário de Mentoria: Incômodo Criativo
                  </h3>
                </div>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
                  Mentorado:{' '}
                  <strong className="text-stone-800 dark:text-stone-200">
                    {selectedTrouble.user?.full_name}
                  </strong>{' '}
                  ({selectedTrouble.user?.email}) · Registrado em{' '}
                  {new Date(selectedTrouble.created_at).toLocaleString('pt-BR')}
                </p>
              </div>

              <button
                onClick={() => setSelectedTrouble(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CORPO DO PRONTUÁRIO */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
              {/* SEÇÃO 1: FATO CONCRETO */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  1. Descrição Objetiva do Fato (Sem Julgamento)
                </span>
                <p className="text-stone-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedTrouble.fact_description}
                </p>
              </div>

              {/* SEÇÃO 2 & 3: AUTO PERCEPÇÕES & CONEXÕES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Postura e Hawkins */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    2. Auto Percepções
                  </span>
                  <div>
                    <div className="text-stone-500 dark:text-slate-400 text-xs">
                      Postura Selecionada:
                    </div>
                    <div className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                      [{selectedTrouble.posture_level}]{' '}
                      {POSTURE_NAMES[selectedTrouble.posture_level]?.name}
                    </div>
                  </div>

                  <div>
                    <div className="text-stone-500 dark:text-slate-400 text-xs">
                      Estado Interno (Hawkins / Thiago Prata):
                    </div>
                    <div className="text-sm font-bold text-purple-600 dark:text-purple-400 capitalize mt-0.5">
                      {selectedTrouble.internal_state}
                    </div>
                  </div>

                  <div>
                    <div className="text-stone-500 dark:text-slate-400 text-xs">
                      Gatilho / Origem:
                    </div>
                    <div className="text-sm text-stone-800 dark:text-slate-200 capitalize mt-0.5">
                      {selectedTrouble.trouble_type}
                    </div>
                  </div>
                </div>

                {/* Conexões e Causa/Efeito */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    3. Conexões Sistêmicas
                  </span>
                  <div>
                    <div className="text-stone-500 dark:text-slate-400 text-xs">Contexto:</div>
                    <div className="text-sm font-semibold text-stone-800 dark:text-slate-200 capitalize mt-0.5">
                      {selectedTrouble.context}
                    </div>
                  </div>

                  <div>
                    <div className="text-stone-500 dark:text-slate-400 text-xs">
                      Partes Envolvidas:
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {Array.isArray(selectedTrouble.parties_involved) &&
                      selectedTrouble.parties_involved.length > 0 ? (
                        selectedTrouble.parties_involved.map((p, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[11px] bg-stone-200 dark:bg-slate-700 text-stone-800 dark:text-slate-200"
                          >
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-stone-400">Nenhum especificado</span>
                      )}
                    </div>
                  </div>

                  {selectedTrouble.cause_aspects && (
                    <div>
                      <div className="text-stone-500 dark:text-slate-400 text-xs">
                        Aspectos de Causa (Crenças Internas):
                      </div>
                      <div className="text-xs text-stone-700 dark:text-slate-300 italic mt-0.5">
                        "{selectedTrouble.cause_aspects}"
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SEÇÃO 4: MATRIZ DE IMPACTO (IRRI) */}
              <div className="p-5 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-800 space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  4. Matriz de Impacto IRRI (Notas & Percepções)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Intensidade */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800">
                    <div className="text-xs text-stone-500 dark:text-slate-400">Intensidade</div>
                    <div className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {selectedTrouble.intensity_score} / 5
                    </div>
                    {selectedTrouble.intensity_notes && (
                      <div className="text-[11px] text-stone-600 dark:text-slate-400 mt-1 line-clamp-3">
                        {selectedTrouble.intensity_notes}
                      </div>
                    )}
                  </div>

                  {/* Relevância */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800">
                    <div className="text-xs text-stone-500 dark:text-slate-400">Relevância</div>
                    <div className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {selectedTrouble.relevance_score} / 5
                    </div>
                    {selectedTrouble.relevance_notes && (
                      <div className="text-[11px] text-stone-600 dark:text-slate-400 mt-1 line-clamp-3">
                        {selectedTrouble.relevance_notes}
                      </div>
                    )}
                  </div>

                  {/* Responsabilidade */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800">
                    <div className="text-xs text-stone-500 dark:text-slate-400">Responsabilidade</div>
                    <div className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {selectedTrouble.responsibility_score} / 5
                    </div>
                    {selectedTrouble.responsibility_notes && (
                      <div className="text-[11px] text-stone-600 dark:text-slate-400 mt-1 line-clamp-3">
                        {selectedTrouble.responsibility_notes}
                      </div>
                    )}
                  </div>

                  {/* Influência */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800">
                    <div className="text-xs text-stone-500 dark:text-slate-400">Influência</div>
                    <div className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {selectedTrouble.influence_score} / 5
                    </div>
                    {selectedTrouble.influence_notes && (
                      <div className="text-[11px] text-stone-600 dark:text-slate-400 mt-1 line-clamp-3">
                        {selectedTrouble.influence_notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SEÇÃO 5: DIAGNÓSTICO DO AGENTE ORQUESTRADOR ISAAC / THIAGO */}
              {selectedTrouble.ai_diagnosis && (
                <div className="p-5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/50 space-y-3">
                  <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Resumo & Direcionamento do Agente Isaac
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-900/40">
                    <div className="text-xs font-semibold text-teal-700 dark:text-teal-400 mb-1">
                      Quadrante IRRI: {selectedTrouble.ai_diagnosis.quadrant}
                    </div>
                    <p className="text-stone-700 dark:text-slate-300 text-xs sm:text-sm">
                      {selectedTrouble.ai_diagnosis.quadrantAdvice ||
                        selectedTrouble.ai_diagnosis.summary}
                    </p>
                  </div>

                  {selectedTrouble.ai_diagnosis.postureCritique && (
                    <div className="text-xs text-stone-700 dark:text-slate-300">
                      <strong className="text-stone-900 dark:text-stone-100">
                        Crítica de Postura:{' '}
                      </strong>
                      {selectedTrouble.ai_diagnosis.postureCritique}
                    </div>
                  )}

                  {selectedTrouble.ai_diagnosis.hawkinsBridge && (
                    <div className="text-xs text-purple-700 dark:text-purple-300">
                      <strong>Ponte de Hawkins (Ativação): </strong>
                      {selectedTrouble.ai_diagnosis.hawkinsBridge}
                    </div>
                  )}

                  {selectedTrouble.micro_action_24h && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                      🎯 Micro-Ação Assumida pelo Mentorado (24h):{' '}
                      <span className="font-bold">{selectedTrouble.micro_action_24h}</span>
                    </div>
                  )}
                </div>
              )}

              {/* SEÇÃO 6: ANOTAÇÕES PRIVADAS DO MENTOR */}
              <div className="p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                    <Shield className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Anotações Confidenciais do Mentor (Super Admin)
                    </span>
                  </div>
                  {selectedTrouble.reviewed_at && (
                    <span className="text-[10px] text-amber-700 dark:text-amber-400">
                      Revisado em {new Date(selectedTrouble.reviewed_at).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>

                <p className="text-xs text-amber-900/80 dark:text-amber-300/80">
                  Espaço restrito para o mentor registrar direcionamentos, evolução de postura e
                  pontos de atenção para a próxima sessão individual com o mentorado.
                </p>

                <textarea
                  rows={4}
                  value={mentorNotesText}
                  onChange={(e) => setMentorNotesText(e.target.value)}
                  placeholder="Ex: Usuário apresentou postura de justificar em relação ao sócio. Recomendar na mentoria foco na distinção entre fatos e interpretações..."
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />

                <div className="flex items-center justify-between pt-1">
                  {feedbackMsg ? (
                    <span className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                      {feedbackMsg}
                    </span>
                  ) : <div />}

                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition disabled:opacity-50"
                  >
                    {savingNotes ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salvar Anotações do Mentor
                  </button>
                </div>
              </div>
            </div>

            {/* RODAPÉ DO MODAL */}
            <div className="p-4 border-t border-stone-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedTrouble(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 transition"
              >
                Fechar Prontuário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
