import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckSquare,
  Clock,
  AlertTriangle,
  Plus,
  Edit3,
  Trash2,
  Users,
  Mail,
  Send,
  CheckCircle2,
  ChevronRight,
  Filter,
  Search,
  RefreshCw,
  Sliders,
  FolderPlus,
  UserPlus,
  Bell,
  X,
  ExternalLink,
  ChevronDown,
  Kanban,
  List,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  fetchProjectMembers,
  createProjectMember,
  updateProjectMember,
  deleteProjectMember,
  fetchProjectMilestones,
  createProjectMilestone,
  updateProjectMilestone,
  deleteProjectMilestone,
  fetchProjectTasks,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
  triggerTaskReminder,
  runAutomatedRemindersCheck,
  fetchProjectNotificationsLog,
} from '../services/adminApi';

const STATUS_COLUMNS = [
  { id: 'pending', label: 'A Fazer', color: 'border-amber-400/50 bg-amber-500/5 text-amber-600 dark:text-amber-400' },
  { id: 'in_progress', label: 'Em Andamento', color: 'border-teal-500/50 bg-teal-500/5 text-teal-600 dark:text-teal-400' },
  { id: 'in_review', label: 'Em Revisão', color: 'border-indigo-500/50 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400' },
  { id: 'completed', label: 'Concluído', color: 'border-emerald-500/50 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' },
];

const PRIORITY_BADGES = {
  critical: { label: 'Crítica', bg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  high: { label: 'Alta', bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  medium: { label: 'Média', bg: 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
  low: { label: 'Baixa', bg: 'bg-stone-100 dark:bg-slate-700/60 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-slate-600' },
};

export default function AdminProjectPlanning({ currentUser }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notificationsLog, setNotificationsLog] = useState([]);

  // Modo de visualização: 'kanban' | 'roadmap' | 'list'
  const [viewMode, setViewMode] = useState('kanban');

  // Filtros
  const [filterMilestone, setFilterMilestone] = useState('all');
  const [filterMember, setFilterMember] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');

  // Modais
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberForm, setMemberForm] = useState({ name: '', email: '', role_title: '', phone: '', is_active: true });

  const [isNotifLogModalOpen, setIsNotifLogModalOpen] = useState(false);

  // Estados de envio e feedback
  const [sendingReminderId, setSendingReminderId] = useState(null);
  const [runningAutoCheck, setRunningAutoCheck] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const [membersData, milestonesData, tasksData] = await Promise.all([
        fetchProjectMembers(),
        fetchProjectMilestones(),
        fetchProjectTasks(),
      ]);

      setMembers(membersData || []);
      setMilestones(milestonesData || []);
      setTasks(tasksData || []);
    } catch (err) {
      console.error('Erro ao carregar dados do projeto:', err);
      showToast('Erro ao carregar dados: ' + err.message, true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Métricas do Projeto
  const projectMetrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress' || t.status === 'in_review').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const urgentCount = tasks.filter((t) => {
      if (t.status === 'completed' || !t.due_date) return false;
      const due = new Date(t.due_date + 'T00:00:00');
      const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 2;
    }).length;

    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, pending, urgentCount, progressPercent };
  }, [tasks]);

  // Filtragem de Tarefas
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterMilestone !== 'all' && task.milestone_id !== filterMilestone) return false;
      if (filterMember !== 'all' && task.assigned_member_id !== filterMember) return false;
      if (filterSearch.trim()) {
        const query = filterSearch.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = (task.description || '').toLowerCase().includes(query);
        const matchesMember = (task.member?.name || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesMember) return false;
      }
      return true;
    });
  }, [tasks, filterMilestone, filterMember, filterSearch]);

  // Ações de Membros
  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!memberForm.name.trim() || !memberForm.email.trim()) {
      showToast('Nome e e-mail são obrigatórios.', true);
      return;
    }

    try {
      if (editingMember) {
        await updateProjectMember(editingMember.id, memberForm);
        showToast('Membro atualizado com sucesso!');
      } else {
        await createProjectMember(memberForm);
        showToast('Novo membro adicionado com sucesso!');
      }
      setMemberForm({ name: '', email: '', role_title: '', phone: '', is_active: true });
      setEditingMember(null);
      await loadData(true);
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleDeleteMember = async (id, name) => {
    if (!window.confirm(`Tem certeza que deseja remover o membro "${name}"?`)) return;
    try {
      await deleteProjectMember(id);
      showToast('Membro removido.');
      await loadData(true);
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Ações de Etapas (Milestones)
  const handleSaveMilestone = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const milestoneData = {
      title: formData.get('title'),
      description: formData.get('description'),
      status: formData.get('status'),
      start_date: formData.get('start_date') || null,
      target_date: formData.get('target_date') || null,
      color: formData.get('color') || '#0f766e',
      order_index: Number(formData.get('order_index')) || 0,
    };

    try {
      if (editingMilestone) {
        await updateProjectMilestone(editingMilestone.id, milestoneData);
        showToast('Etapa atualizada com sucesso!');
      } else {
        await createProjectMilestone(milestoneData);
        showToast('Nova etapa criada com sucesso!');
      }
      setIsMilestoneModalOpen(false);
      setEditingMilestone(null);
      await loadData(true);
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleDeleteMilestone = async (id, title) => {
    if (!window.confirm(`Excluir a etapa "${title}"? As atividades associadas não serão apagadas.`)) return;
    try {
      await deleteProjectMilestone(id);
      showToast('Etapa excluída.');
      await loadData(true);
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Ações de Atividades (Tasks)
  const handleSaveTask = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const taskData = {
      title: formData.get('title'),
      description: formData.get('description'),
      milestone_id: formData.get('milestone_id') || null,
      assigned_member_id: formData.get('assigned_member_id') || null,
      status: formData.get('status'),
      priority: formData.get('priority'),
      start_date: formData.get('start_date') || null,
      due_date: formData.get('due_date') || null,
    };

    try {
      if (editingTask) {
        await updateProjectTask(editingTask.id, taskData);
        showToast('Atividade atualizada!');
      } else {
        await createProjectTask(taskData);
        showToast('Atividade criada com sucesso!');
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
      await loadData(true);
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await updateProjectTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      showToast(`Status atualizado para "${STATUS_COLUMNS.find((c) => c.id === newStatus)?.label}"`);
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleDeleteTask = async (id, title) => {
    if (!window.confirm(`Excluir a atividade "${title}"?`)) return;
    try {
      await deleteProjectTask(id);
      showToast('Atividade excluída.');
      await loadData(true);
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Disparo manual de lembrete por e-mail para a tarefa
  const handleTriggerReminder = async (task) => {
    if (!task.member?.email) {
      showToast('Esta atividade não possui um responsável com e-mail associado.', true);
      return;
    }

    try {
      setSendingReminderId(task.id);
      const res = await triggerTaskReminder(task.id);
      showToast(res.message || `E-mail de cobrança enviado para ${task.member.name}!`);
      await loadData(true);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSendingReminderId(null);
    }
  };

  // Executar checagem automática de todas as cobranças
  const handleRunAutoReminders = async () => {
    try {
      setRunningAutoCheck(true);
      const res = await runAutomatedRemindersCheck();
      if (res.dispatchedCount > 0) {
        showToast(`✅ ${res.dispatchedCount} e-mail(s) de cobrança disparado(s) com sucesso!`);
      } else {
        showToast(`ℹ️ Nenhuma cobrança pendente para hoje ou prévia imediata. (${res.scanned} tarefas analisadas)`);
      }
      await loadData(true);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setRunningAutoCheck(false);
    }
  };

  // Abrir Histórico de Notificações
  const handleOpenNotifLogs = async () => {
    try {
      setIsNotifLogModalOpen(true);
      const logs = await fetchProjectNotificationsLog();
      setNotificationsLog(logs || []);
    } catch (err) {
      showToast('Erro ao carregar logs: ' + err.message, true);
    }
  };

  // Auxiliar de cálculo de prazo
  const getDueDateBadge = (dueDate, status) => {
    if (!dueDate) return null;
    if (status === 'completed') {
      return (
        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Entregue
        </span>
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + 'T00:00:00');
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5" /> Atrasada ({Math.abs(diffDays)}d)
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 animate-pulse flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" /> Entrega HOJE
        </span>
      );
    }
    if (diffDays <= 2) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" /> {diffDays} dia(s) restante(s)
        </span>
      );
    }
    return (
      <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1">
        <Calendar className="w-3 h-3" /> {new Date(dueDate + 'T12:00:00Z').toLocaleDateString('pt-BR')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-10 h-10 border-3 border-teal-700/30 border-t-teal-700 rounded-full animate-spin" />
        <p className="text-sm font-serif text-stone-600 dark:text-stone-400">
          Carregando governança e cronograma do projeto ISAAC...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-medium flex items-center gap-3 transition-all transform animate-slideUp ${
            toastMessage.isError
              ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
          }`}
        >
          {toastMessage.isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800/80 p-6 rounded-3xl border border-stone-200/80 dark:border-slate-700 shadow-sm backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
              Governança Master
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">• Revisão Thiago</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-teal-700 dark:text-teal-400" />
            <span>Gestão & Cronograma do Projeto</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-serif mt-1">
            Planejamento de etapas, atribuição de atividades para a equipe e cobrança automática de prazos via e-mail.
          </p>
        </div>

        {/* BOTÕES DE AÇÃO SUPERIORES */}
        <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
          <button
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Atividade</span>
          </button>

          <button
            onClick={() => {
              setEditingMilestone(null);
              setIsMilestoneModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-stone-700 dark:text-stone-200 font-medium text-xs transition flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Nova Etapa</span>
          </button>

          <button
            onClick={() => setIsMembersModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-stone-700 dark:text-stone-200 font-medium text-xs transition flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Equipe ({members.length})</span>
          </button>

          <button
            onClick={handleRunAutoReminders}
            disabled={runningAutoCheck}
            title="Verifica tarefas que vencem hoje ou nos próximos dias e dispara as cobranças por e-mail"
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-medium text-xs transition flex items-center gap-1.5 disabled:opacity-60"
          >
            <Send className={`w-3.5 h-3.5 ${runningAutoCheck ? 'animate-pulse' : ''}`} />
            <span>{runningAutoCheck ? 'Checando...' : 'Disparar Cobranças'}</span>
          </button>

          <button
            onClick={handleOpenNotifLogs}
            className="p-2 rounded-xl bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-stone-600 dark:text-stone-300 transition"
            title="Histórico de E-mails Enviados"
          >
            <Mail className="w-4 h-4" />
          </button>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-stone-600 dark:text-stone-300 transition"
            title="Atualizar Dados"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* CARDS EXECUTIVOS & BARRA DE PROGRESSO GLOBAL (Ocultos em dispositivos móveis/celulares) */}
      <div className="hidden md:grid md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Progresso Global */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-3xl border border-stone-200/80 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-serif text-stone-500 dark:text-stone-400">Progresso Geral</span>
            <span className="text-sm font-bold text-teal-700 dark:text-teal-400">
              {projectMetrics.progressPercent}%
            </span>
          </div>
          <div className="w-full bg-stone-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-700"
              style={{ width: `${projectMetrics.progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">
            {projectMetrics.completed} de {projectMetrics.total} atividades concluídas
          </span>
        </div>

        {/* Card 2: Em Andamento */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-3xl border border-stone-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-serif text-stone-500 dark:text-stone-400 block mb-1">Em Andamento</span>
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {projectMetrics.inProgress}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Concluídas */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-3xl border border-stone-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-serif text-stone-500 dark:text-stone-400 block mb-1">Entregas Feitas</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {projectMetrics.completed}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Entregas Iminentes / Críticas */}
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-3xl border border-stone-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-serif text-stone-500 dark:text-stone-400 block mb-1">Prazos Próximos</span>
            <span className={`text-2xl font-bold ${projectMetrics.urgentCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-900 dark:text-stone-100'}`}>
              {projectMetrics.urgentCount}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${projectMetrics.urgentCount > 0 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-stone-100 dark:bg-slate-700 text-stone-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BARRA DE CONTROLE: MODOS DE VISUALIZAÇÃO E FILTROS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-800/60 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-700 shadow-sm">
        {/* Alternador de Visualização */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-900/60 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Quadro Kanban</span>
          </button>

          <button
            onClick={() => setViewMode('roadmap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              viewMode === 'roadmap'
                ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Linha do Tempo (Roadmap)</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Lista Detalhada</span>
          </button>
        </div>

        {/* Filtros de Busca e Seleção */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Busca por texto */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar atividade..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full sm:w-48 pl-8 pr-3 py-1.5 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:border-teal-600"
            />
          </div>

          {/* Filtro por Etapa */}
          <select
            value={filterMilestone}
            onChange={(e) => setFilterMilestone(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-700 dark:text-stone-300 focus:outline-none focus:border-teal-600"
          >
            <option value="all">Todas as Etapas ({milestones.length})</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>

          {/* Filtro por Responsável */}
          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-700 dark:text-stone-300 focus:outline-none focus:border-teal-600"
          >
            <option value="all">Todos os Responsáveis</option>
            {members.map((mem) => (
              <option key={mem.id} value={mem.id}>
                {mem.name} ({mem.role_title})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VISÃO QUADRO KANBAN */}
      {/* ========================================================================= */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {STATUS_COLUMNS.map((column) => {
            const colTasks = filteredTasks.filter((t) => t.status === column.id);

            return (
              <div
                key={column.id}
                className="bg-stone-100/60 dark:bg-slate-800/40 rounded-3xl p-3 border border-stone-200/60 dark:border-slate-700/60 flex flex-col min-h-[420px]"
              >
                {/* Cabeçalho da Coluna */}
                <div className="flex items-center justify-between px-3 py-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full border ${column.color.split(' ')[0]} bg-current`} />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                      {column.label}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-slate-700 text-stone-600 dark:text-stone-300 shadow-2xs">
                    {colTasks.length}
                  </span>
                </div>

                {/* Lista de Cards da Coluna */}
                <div className="space-y-3 flex-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-all space-y-3 group"
                    >
                      {/* Topo do Card: Etapa e Prioridade */}
                      <div className="flex items-center justify-between gap-2">
                        {task.milestone ? (
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium truncate max-w-[130px]"
                            style={{
                              backgroundColor: `${task.milestone.color || '#0f766e'}18`,
                              color: task.milestone.color || '#0f766e',
                            }}
                          >
                            {task.milestone.title}
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400">Sem etapa</span>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                            PRIORITY_BADGES[task.priority]?.bg || PRIORITY_BADGES.medium.bg
                          }`}
                        >
                          {PRIORITY_BADGES[task.priority]?.label || 'Média'}
                        </span>
                      </div>

                      {/* Título e Descrição */}
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 leading-snug">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Responsável e Prazo */}
                      <div className="pt-2 border-t border-stone-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-teal-700/10 text-teal-800 dark:text-teal-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {task.member?.name ? task.member.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className="text-[11px] text-stone-700 dark:text-stone-300 font-medium truncate">
                            {task.member?.name || 'Não atribuído'}
                          </span>
                        </div>

                        {getDueDateBadge(task.due_date, task.status)}
                      </div>

                      {/* Rodapé de Ações do Card */}
                      <div className="pt-1 flex items-center justify-between">
                        {/* Seletor Rápido de Status */}
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                          className="text-[10px] bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-lg px-2 py-1 text-stone-600 dark:text-stone-300 focus:outline-none"
                        >
                          {STATUS_COLUMNS.map((col) => (
                            <option key={col.id} value={col.id}>
                              Mover para: {col.label}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1">
                          {/* Botão de Cobrar por E-mail */}
                          {task.member?.email && task.status !== 'completed' && (
                            <button
                              onClick={() => handleTriggerReminder(task)}
                              disabled={sendingReminderId === task.id}
                              title={`Enviar cobrança por e-mail para ${task.member.name}`}
                              className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition disabled:opacity-50"
                            >
                              <Send className={`w-3 h-3 ${sendingReminderId === task.id ? 'animate-spin' : ''}`} />
                            </button>
                          )}

                          {/* Editar */}
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setIsTaskModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-700 transition"
                            title="Editar Atividade"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>

                          {/* Excluir */}
                          <button
                            onClick={() => handleDeleteTask(task.id, task.title)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Excluir Atividade"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-stone-200 dark:border-slate-700/60 rounded-2xl">
                      <p className="text-[11px] text-stone-400">Nenhuma atividade</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VISÃO CRONOGRAMA / LINHA DO TEMPO (ROADMAP) */}
      {/* ========================================================================= */}
      {viewMode === 'roadmap' && (
        <div className="space-y-6">
          {milestones.map((milestone) => {
            const milestoneTasks = filteredTasks.filter((t) => t.milestone_id === milestone.id);
            const mTotal = milestoneTasks.length;
            const mCompleted = milestoneTasks.filter((t) => t.status === 'completed').length;
            const mPercent = mTotal > 0 ? Math.round((mCompleted / mTotal) * 100) : 0;

            return (
              <div
                key={milestone.id}
                className="bg-white dark:bg-slate-800/90 rounded-3xl border border-stone-200/80 dark:border-slate-700 shadow-sm p-6 space-y-4"
              >
                {/* Cabeçalho da Etapa / Marco */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-slate-700/60">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3.5 h-12 rounded-full shrink-0"
                      style={{ backgroundColor: milestone.color || '#0f766e' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                          {milestone.title}
                        </h3>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                          style={{
                            backgroundColor: `${milestone.color || '#0f766e'}15`,
                            color: milestone.color || '#0f766e',
                          }}
                        >
                          {milestone.status === 'completed' ? 'Concluída' : 'Em Andamento'}
                        </span>
                      </div>
                      {milestone.description && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
                          {milestone.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Datas e Ações da Etapa */}
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-stone-500 dark:text-stone-400">
                      <div className="flex items-center gap-1 justify-end font-medium text-stone-700 dark:text-stone-300">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>
                          {milestone.target_date
                            ? `Entrega: ${new Date(milestone.target_date + 'T12:00:00Z').toLocaleDateString('pt-BR')}`
                            : 'Prazo não definido'}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400">
                        {mCompleted} de {mTotal} tarefas ({mPercent}%)
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setEditingMilestone(milestone);
                        setIsMilestoneModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-700 transition"
                      title="Editar Etapa"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteMilestone(milestone.id, milestone.title)}
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Excluir Etapa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Barra de Progresso da Etapa */}
                <div className="w-full bg-stone-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${mPercent}%`,
                      backgroundColor: milestone.color || '#0f766e',
                    }}
                  />
                </div>

                {/* Lista de Atividades Vinculadas a este Marco */}
                <div className="space-y-2 pt-2">
                  {milestoneTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/60 dark:border-slate-700/60 hover:border-teal-600/30 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() =>
                            handleUpdateTaskStatus(
                              task.id,
                              task.status === 'completed' ? 'in_progress' : 'completed'
                            )
                          }
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                            task.status === 'completed'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-300 dark:border-slate-600 hover:border-teal-600'
                          }`}
                        >
                          {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>

                        <div className="min-w-0">
                          <span
                            className={`text-xs sm:text-sm font-medium block truncate ${
                              task.status === 'completed'
                                ? 'line-through text-stone-400 dark:text-stone-500'
                                : 'text-stone-900 dark:text-stone-100'
                            }`}
                          >
                            {task.title}
                          </span>
                          <span className="text-[11px] text-stone-500 dark:text-stone-400">
                            Responsável: {task.member?.name || 'Não definido'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                            PRIORITY_BADGES[task.priority]?.bg || PRIORITY_BADGES.medium.bg
                          }`}
                        >
                          {PRIORITY_BADGES[task.priority]?.label}
                        </span>

                        {getDueDateBadge(task.due_date, task.status)}

                        {task.member?.email && task.status !== 'completed' && (
                          <button
                            onClick={() => handleTriggerReminder(task)}
                            disabled={sendingReminderId === task.id}
                            className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-[11px] font-medium transition flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Cobrar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {milestoneTasks.length === 0 && (
                    <p className="text-xs text-stone-400 text-center py-4">
                      Nenhuma atividade vinculada a esta etapa ainda.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VISÃO LISTA DETALHADA */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-stone-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600 dark:text-stone-300">
              <thead className="bg-stone-50 dark:bg-slate-900/60 border-b border-stone-200 dark:border-slate-700 uppercase tracking-wider text-[10px] text-stone-500 dark:text-stone-400 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Atividade</th>
                  <th className="py-3.5 px-4">Etapa</th>
                  <th className="py-3.5 px-4">Responsável</th>
                  <th className="py-3.5 px-4">Prioridade</th>
                  <th className="py-3.5 px-4">Prazo</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-700/60">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-stone-50/80 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3.5 px-4 font-medium text-stone-900 dark:text-stone-100 max-w-xs">
                      <div className="truncate">{task.title}</div>
                      {task.description && (
                        <div className="text-[11px] text-stone-400 truncate">{task.description}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {task.milestone ? (
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                          style={{
                            backgroundColor: `${task.milestone.color || '#0f766e'}15`,
                            color: task.milestone.color || '#0f766e',
                          }}
                        >
                          {task.milestone.title}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {task.member ? (
                        <div>
                          <span className="font-medium text-stone-800 dark:text-stone-200">{task.member.name}</span>
                          <span className="block text-[10px] text-stone-400">{task.member.email}</span>
                        </div>
                      ) : (
                        <span className="text-stone-400">Não definido</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                          PRIORITY_BADGES[task.priority]?.bg || PRIORITY_BADGES.medium.bg
                        }`}
                      >
                        {PRIORITY_BADGES[task.priority]?.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getDueDateBadge(task.due_date, task.status)}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                        className="text-[11px] bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-lg px-2 py-1 text-stone-700 dark:text-stone-300 focus:outline-none"
                      >
                        {STATUS_COLUMNS.map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {task.member?.email && task.status !== 'completed' && (
                          <button
                            onClick={() => handleTriggerReminder(task)}
                            disabled={sendingReminderId === task.id}
                            title="Disparar cobrança por e-mail"
                            className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setIsTaskModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR ATIVIDADE */}
      {/* ========================================================================= */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl border border-stone-200 dark:border-slate-700 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-700">
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                {editingTask ? 'Editar Atividade' : 'Nova Atividade do Projeto'}
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Título da Atividade *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingTask?.title || ''}
                  placeholder="Ex: Desenvolver nova interface da área de reflexão"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Descrição e Escopo
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingTask?.description || ''}
                  placeholder="Detalhes sobre o que deve ser entregue..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Etapa / Marco
                  </label>
                  <select
                    name="milestone_id"
                    defaultValue={editingTask?.milestone_id || ''}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-teal-600"
                  >
                    <option value="">Sem Etapa</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Responsável (Equipe)
                  </label>
                  <select
                    name="assigned_member_id"
                    defaultValue={editingTask?.assigned_member_id || ''}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-teal-600"
                  >
                    <option value="">Não atribuído</option>
                    {members.map((mem) => (
                      <option key={mem.id} value={mem.id}>
                        {mem.name} ({mem.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingTask?.status || 'pending'}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-teal-600"
                  >
                    {STATUS_COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Prioridade
                  </label>
                  <select
                    name="priority"
                    defaultValue={editingTask?.priority || 'medium'}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-teal-600"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    defaultValue={editingTask?.start_date || ''}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Prazo Limite (Vencimento) *
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    defaultValue={editingTask?.due_date || ''}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium shadow-sm transition"
                >
                  Salvar Atividade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR ETAPA (MILESTONE) */}
      {/* ========================================================================= */}
      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl border border-stone-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-700">
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                {editingMilestone ? 'Editar Etapa / Marco' : 'Nova Etapa do Cronograma'}
              </h3>
              <button
                onClick={() => setIsMilestoneModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMilestone} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nome da Etapa *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingMilestone?.title || ''}
                  placeholder="Ex: Fase 1: Revisão Thiago & Novas Telas"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Objetivo / Descrição
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingMilestone?.description || ''}
                  placeholder="Resumo do escopo desta etapa..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Previsão de Término
                  </label>
                  <input
                    type="date"
                    name="target_date"
                    defaultValue={editingMilestone?.target_date || ''}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Cor de Identificação
                  </label>
                  <input
                    type="color"
                    name="color"
                    defaultValue={editingMilestone?.color || '#0f766e'}
                    className="w-full h-10 p-1 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-xl cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsMilestoneModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium shadow-sm transition"
                >
                  Salvar Etapa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GESTÃO DE MEMBROS DA EQUIPE */}
      {/* ========================================================================= */}
      {isMembersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl border border-stone-200 dark:border-slate-700 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                  Equipe de Execução do Projeto
                </h3>
              </div>
              <button
                onClick={() => setIsMembersModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400">
              Cadastre aqui os membros e colaboradores responsáveis pelas atividades. Eles receberão as notificações e cobranças automáticas de prazos nos e-mails indicados.
            </p>

            {/* Formulário de Adicionar / Editar Membro */}
            <form onSubmit={handleSaveMember} className="bg-stone-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-stone-200/80 dark:border-slate-700 space-y-3">
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
                {editingMember ? 'Editar Colaborador' : '+ Adicionar Novo Membro'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nome (ex: Thiago)"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                  required
                />
                <input
                  type="email"
                  placeholder="E-mail para notificações"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Cargo / Especialidade"
                  value={memberForm.role_title}
                  onChange={(e) => setMemberForm({ ...memberForm, role_title: e.target.value })}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {editingMember && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMember(null);
                      setMemberForm({ name: '', email: '', role_title: '', phone: '', is_active: true });
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs text-stone-500 hover:bg-stone-200 transition"
                  >
                    Cancelar Edição
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium transition shadow-xs"
                >
                  {editingMember ? 'Atualizar Membro' : 'Salvar Membro'}
                </button>
              </div>
            </form>

            {/* Lista de Membros Cadastrados */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Membros Cadastrados ({members.length})
              </h4>
              <div className="divide-y divide-stone-100 dark:divide-slate-700/60 border border-stone-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800">
                {members.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-3 sm:px-4 flex items-center justify-between hover:bg-stone-50/80 dark:hover:bg-slate-700/30 transition text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-700/10 text-teal-800 dark:text-teal-300 font-bold flex items-center justify-center">
                        {mem.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-stone-900 dark:text-stone-100">{mem.name}</span>
                        <span className="block text-[11px] text-stone-500 dark:text-stone-400">
                          {mem.email} • {mem.role_title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingMember(mem);
                          setMemberForm({
                            name: mem.name,
                            email: mem.email,
                            role_title: mem.role_title || '',
                            phone: mem.phone || '',
                            is_active: mem.is_active,
                          });
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(mem.id, mem.name)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HISTÓRICO DE DISPAROS DE E-MAILS (LOG) */}
      {/* ========================================================================= */}
      {isNotifLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-3xl border border-stone-200 dark:border-slate-700 shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                  Histórico de E-mails & Cobranças Enviadas
                </h3>
              </div>
              <button
                onClick={() => setIsNotifLogModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400">
              Registro das últimas notificações automáticas e manuais disparadas via SMTP pelo sistema.
            </p>

            <div className="overflow-x-auto border border-stone-200 dark:border-slate-700 rounded-2xl">
              <table className="w-full text-left text-xs text-stone-600 dark:text-stone-300">
                <thead className="bg-stone-50 dark:bg-slate-900/60 uppercase tracking-wider text-[10px] text-stone-500 font-semibold border-b border-stone-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-3">Destinatário</th>
                    <th className="py-2.5 px-3">Atividade</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-slate-700/60">
                  {notificationsLog.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50/60 dark:hover:bg-slate-700/30">
                      <td className="py-2.5 px-3 whitespace-nowrap text-stone-500">
                        {new Date(log.sent_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-stone-800 dark:text-stone-200">{log.recipient_email}</span>
                        {log.member?.name && (
                          <span className="block text-[10px] text-stone-400">{log.member.name}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-stone-900 dark:text-stone-100 max-w-[200px] truncate">
                        {log.task?.title || log.subject}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-stone-300">
                          {log.type === 'reminder_due'
                            ? 'Dia da Entrega (D-0)'
                            : log.type === 'reminder_pre'
                            ? 'Aviso Prévio'
                            : log.type === 'task_completed'
                            ? 'Conclusão'
                            : 'Aviso Manual'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          Enviado
                        </span>
                      </td>
                    </tr>
                  ))}
                  {notificationsLog.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">
                        Nenhum registro de e-mail disparado até o momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
