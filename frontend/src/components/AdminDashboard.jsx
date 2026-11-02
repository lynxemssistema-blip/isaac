import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Feather,
  Shield,
  Search,
  Save,
  RefreshCw,
  Sliders,
  CheckCircle,
  AlertCircle,
  Bookmark,
  Plus,
  Trash2,
  Compass,
  Heart,
  BookOpen,
  HelpCircle,
  CreditCard,
  QrCode,
  UserCheck,
  UserX,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Lightbulb,
  Award,
  Globe,
  Upload,
  Camera,
  Loader2,
  Edit3,
  Mail,
  Calendar,
  SlidersHorizontal,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Link2,
  Phone,
  X,
} from 'lucide-react';
import {
  fetchAdminMetrics,
  fetchAdminUsers,
  updateRole,
  fetchAdminMemories,
  fetchAdminAgents,
  updateAgent,
  deleteAgent,
  fetchAdminPlans,
  updateAdminPlan,
  updateUserStatus,
  updateUserPlan,
  fetchAdminSubscriptions,
  approveSubscription,
  fetchAdminFeedbacks,
  fetchAdminCreator,
  updateAdminCreator,
  uploadCreatorPhoto,
  updateAdminInscriptionApi,
  deleteAdminInscriptionApi,
} from '../services/adminApi';
import { formatPhoneMask } from './DirectSignupPage';
import CreateAgentModal from './CreateAgentModal';
import AgentKnowledgeManager from './AgentKnowledgeManager';
import AdminHelpGuide from './AdminHelpGuide';
import AdminBroadcastEmail from './AdminBroadcastEmail';
import AdminGuidedConversations from './AdminGuidedConversations';
import AdminUserGroups from './AdminUserGroups';
import AdminProjectPlanning from './AdminProjectPlanning';
import AdminCreativeTroubles from './AdminCreativeTroubles';
import AdminSystemSettings from './AdminSystemSettings';
import AdminPdfCampaigns from './AdminPdfCampaigns';

export default function AdminDashboard({ currentUser }) {
  const isSuperAdmin = currentUser?.role === 'master' || currentUser?.email === 'edsonmanoel2012@gmail.com';
  const [activeTab, setActiveTab] = useState('metrics'); // 'users' | 'plans' | 'subscriptions' | 'feedbacks' | 'memories' | 'agents' | 'help' | 'broadcast'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateAgentOpen, setIsCreateAgentOpen] = useState(false);

  // Dados do Sistema
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [memories, setMemories] = useState([]);
  const [agents, setAgents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  // Filtros e busca
  const [userSearch, setUserSearch] = useState('');
  const [userSourceFilter, setUserSourceFilter] = useState('all'); // 'all' | 'app' | 'inscricao'
  const [copiedInscricaoLink, setCopiedInscricaoLink] = useState(false);
  const [editingInscription, setEditingInscription] = useState(null);
  const [savingInscription, setSavingInscription] = useState(false);
  const [memoryFilter, setMemoryFilter] = useState('all');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Agente em edição
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentTemp, setAgentTemp] = useState(0.7);
  const [agentQuestions, setAgentQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCategory, setNewQuestionCategory] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingQuestionText, setEditingQuestionText] = useState('');
  const [editingQuestionCategory, setEditingQuestionCategory] = useState('');
  const [savingQuestions, setSavingQuestions] = useState(false);

  // Plano em edição
  const [selectedPlanId, setSelectedPlanId] = useState('pro_monthly');
  const [editingPlan, setEditingPlan] = useState(null);
  const [featuresText, setFeaturesText] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  // Perfil do Idealizador do Izaque
  const [creatorData, setCreatorData] = useState({
    name: 'Edson Manoel',
    title: 'Idealizador & Criador do IZAQUE',
    bio: '',
    story: '',
    quote: '',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
    social_instagram: '',
    social_linkedin: '',
    social_whatsapp: '',
    is_visible: true,
  });
  const [savingCreator, setSavingCreator] = useState(false);
  const [uploadingCreatorPhoto, setUploadingCreatorPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [m, u, mem, ag, p, s, f, cr] = await Promise.all([
        fetchAdminMetrics().catch(() => null),
        fetchAdminUsers().catch(() => []),
        fetchAdminMemories().catch(() => []),
        fetchAdminAgents().catch(() => []),
        fetchAdminPlans().catch(() => []),
        fetchAdminSubscriptions().catch(() => []),
        fetchAdminFeedbacks().catch(() => []),
        fetchAdminCreator().catch(() => null),
      ]);

      setMetrics(m);
      setUsers(u);
      setMemories(mem);
      setAgents(ag);
      setPlans(p);
      setSubscriptions(s);
      setFeedbacks(f);
      if (cr && cr.name) {
        setCreatorData(cr);
      }

      if (ag.length > 0) {
        const targetAgent = selectedAgent
          ? ag.find((a) => a.id === selectedAgent.id) || ag[0]
          : ag[0];
        setSelectedAgent(targetAgent);
        setAgentPrompt(targetAgent.system_prompt);
        setAgentTemp(Number(targetAgent.temperature) || 0.7);
        setAgentQuestions(Array.isArray(targetAgent.starter_questions) ? [...targetAgent.starter_questions] : []);
      }

      if (p.length > 0) {
        const curPlan = p.find((item) => item.id === selectedPlanId) || p[0];
        setEditingPlan({ ...curPlan });
        setFeaturesText(Array.isArray(curPlan.features) ? curPlan.features.join('\n') : '');
      }
    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Quando o superadmin troca o plano a ser editado
  const handleSelectPlanToEdit = (planId) => {
    setSelectedPlanId(planId);
    const target = plans.find((p) => p.id === planId);
    if (target) {
      setEditingPlan({ ...target });
      setFeaturesText(Array.isArray(target.features) ? target.features.join('\n') : '');
    }
  };

  // Salvar alterações de um plano (Preço, Chave PIX, Titular, etc.)
  const handleSavePlan = async (e) => {
    e?.preventDefault();
    if (!editingPlan) return;
    setSavingPlan(true);

    try {
      const featuresArray = featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const payload = {
        ...editingPlan,
        features: featuresArray,
      };

      await updateAdminPlan(editingPlan.id, payload);
      setFeedbackMsg(`Plano "${editingPlan.name}" e dados PIX atualizados com sucesso!`);
      setTimeout(() => setFeedbackMsg(''), 3500);
      loadAllData();
    } catch (err) {
      alert('Erro ao salvar plano: ' + err.message);
    } finally {
      setSavingPlan(false);
    }
  };

  // Bloquear ou desbloquear acesso geral de um cliente
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === false ? true : false;
    try {
      await updateUserStatus(userId, newStatus);
      setFeedbackMsg(`Acesso do usuário ${newStatus ? 'liberado/ativado' : 'bloqueado/desativado'} com sucesso!`);
      setTimeout(() => setFeedbackMsg(''), 3000);
      loadAllData();
    } catch (err) {
      alert('Erro ao alterar status de acesso: ' + err.message);
    }
  };

  // Alterar plano de um cliente diretamente no dropdown
  const handleUserPlanChange = async (userId, newPlanId) => {
    try {
      await updateUserPlan(userId, newPlanId);
      setFeedbackMsg('Plano do cliente atualizado com sucesso!');
      setTimeout(() => setFeedbackMsg(''), 3000);
      loadAllData();
    } catch (err) {
      alert('Erro ao atualizar plano do cliente: ' + err.message);
    }
  };

  // Aprovar pedido PIX e ativar o plano do cliente
  const handleApproveSubscription = async (subId) => {
    try {
      await approveSubscription(subId, currentUser?.id);
      setFeedbackMsg('Assinatura PIX aprovada! Plano ativado e e-mail enviado ao cliente.');
      setTimeout(() => setFeedbackMsg(''), 3500);
      loadAllData();
    } catch (err) {
      alert('Erro ao aprovar assinatura: ' + err.message);
    }
  };

  // Upload de foto do Idealizador a partir do computador ou celular
  const handlePhotoFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 8MB.');
      return;
    }

    try {
      setUploadingCreatorPhoto(true);

      // Preview local imediato
      const localPreview = URL.createObjectURL(file);
      setCreatorData((prev) => ({ ...prev, image_url: localPreview }));

      // Upload para o Supabase Storage (bucket avatars)
      const publicUrl = await uploadCreatorPhoto(file);
      setCreatorData((prev) => ({ ...prev, image_url: publicUrl }));
      setFeedbackMsg('Foto carregada com sucesso! Clique em "Salvar Apresentação do Idealizador" para confirmar.');
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      console.warn('Fallback para Base64 devido a erro no Storage:', err);
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        setCreatorData((prev) => ({ ...prev, image_url: loadEvt.target.result }));
        setFeedbackMsg('Foto convertida e pronta para salvar!');
        setTimeout(() => setFeedbackMsg(''), 4000);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingCreatorPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Salvar apresentação do Idealizador
  const handleSaveCreator = async (e) => {
    e?.preventDefault();
    setSavingCreator(true);
    try {
      await updateAdminCreator(creatorData);
      setFeedbackMsg('Apresentação do Idealizador salva com sucesso!');
      setTimeout(() => setFeedbackMsg(''), 3500);
      loadAllData();
    } catch (err) {
      alert('Erro ao salvar dados do idealizador: ' + err.message);
    } finally {
      setSavingCreator(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateRole(userId, newRole);
      setFeedbackMsg('Papel do usuário atualizado com sucesso!');
      setTimeout(() => setFeedbackMsg(''), 3000);
      loadAllData();
    } catch (err) {
      alert('Erro ao alterar role: ' + err.message);
    }
  };

  const handleSaveAgent = async (e) => {
    e?.preventDefault();
    if (!selectedAgent) return;
    try {
      await updateAgent(selectedAgent.id, {
        system_prompt: agentPrompt,
        temperature: agentTemp,
        starter_questions: agentQuestions,
      });
      setFeedbackMsg('Diretrizes e Perguntas do Mentor atualizadas com sucesso!');
      setTimeout(() => setFeedbackMsg(''), 3000);
      loadAllData();
    } catch (err) {
      alert('Erro ao atualizar mentor: ' + err.message);
    }
  };

  const handleSaveQuestionsOnly = async () => {
    if (!selectedAgent) return;
    setSavingQuestions(true);
    try {
      await updateAgent(selectedAgent.id, {
        starter_questions: agentQuestions,
      });
      setFeedbackMsg(`Perguntas de condução salvas com sucesso para "${selectedAgent.name}"!`);
      setTimeout(() => setFeedbackMsg(''), 3500);
      setAgents((prev) =>
        prev.map((a) => (a.id === selectedAgent.id ? { ...a, starter_questions: agentQuestions } : a))
      );
      setSelectedAgent((prev) => (prev ? { ...prev, starter_questions: agentQuestions } : prev));
    } catch (err) {
      alert('Erro ao salvar perguntas: ' + err.message);
    } finally {
      setSavingQuestions(false);
    }
  };

  const handleAddQuestion = (e) => {
    e?.preventDefault();
    if (!newQuestionText.trim()) return;
    const newQ = {
      id: 'q_' + Date.now(),
      text: newQuestionText.trim(),
      category: newQuestionCategory.trim() || 'Geral',
    };
    setAgentQuestions((prev) => [...prev, newQ]);
    setNewQuestionText('');
    setNewQuestionCategory('');
  };

  const handleRemoveQuestion = (qId) => {
    setAgentQuestions((prev) => prev.filter((q) => q.id !== qId));
    if (editingQuestionId === qId) {
      setEditingQuestionId(null);
      setEditingQuestionText('');
      setEditingQuestionCategory('');
    }
  };

  const handleStartEditQuestion = (q) => {
    setEditingQuestionId(q.id);
    setEditingQuestionText(q.text);
    setEditingQuestionCategory(q.category || '');
  };

  const handleSaveEditQuestion = () => {
    if (!editingQuestionText.trim()) return;
    setAgentQuestions((prev) =>
      prev.map((q) =>
        q.id === editingQuestionId
          ? { ...q, text: editingQuestionText.trim(), category: editingQuestionCategory.trim() || 'Geral' }
          : q
      )
    );
    setEditingQuestionId(null);
    setEditingQuestionText('');
    setEditingQuestionCategory('');
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestionId(null);
    setEditingQuestionText('');
    setEditingQuestionCategory('');
  };

  const inscricaoPublicUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/inscricao` : '/inscricao';

  const handleCopyInscricaoLink = async () => {
    try {
      await navigator.clipboard.writeText(inscricaoPublicUrl);
      setCopiedInscricaoLink(true);
      setFeedbackMsg('Link da Ficha de Inscrição (/inscricao) copiado!');
      setTimeout(() => {
        setCopiedInscricaoLink(false);
        setFeedbackMsg('');
      }, 3000);
    } catch {
      alert('Copie o link: ' + inscricaoPublicUrl);
    }
  };

  const handleOpenEditInscription = (u) => {
    setEditingInscription({
      id: u.id,
      fullName: u.full_name || '',
      email: u.email || '',
      phone: u.phone || '',
      notes: u.notes || '',
    });
  };

  const handleSaveInscription = async (e) => {
    e?.preventDefault();
    if (!editingInscription) return;
    setSavingInscription(true);
    try {
      await updateAdminInscriptionApi(editingInscription.id, {
        fullName: editingInscription.fullName,
        email: editingInscription.email,
        phone: editingInscription.phone,
        notes: editingInscription.notes,
      });
      setEditingInscription(null);
      setFeedbackMsg('Ficha de inscrição atualizada com sucesso!');
      setTimeout(() => setFeedbackMsg(''), 3000);
      loadAllData();
    } catch (err) {
      alert('Erro ao salvar ficha de inscrição: ' + err.message);
    } finally {
      setSavingInscription(false);
    }
  };

  const handleDeleteInscription = async (u) => {
    if (!window.confirm(`Deseja realmente remover a ficha de inscrição de "${u.full_name || u.email || u.phone}"?`)) {
      return;
    }
    try {
      await deleteAdminInscriptionApi(u.id);
      setFeedbackMsg('Ficha de inscrição removida com sucesso!');
      setTimeout(() => setFeedbackMsg(''), 3000);
      loadAllData();
    } catch (err) {
      alert('Erro ao remover ficha de inscrição: ' + err.message);
    }
  };

  const appUsersTotal = users.filter((u) => !u.is_inscription).length;
  const inscriptionsTotal = users.filter((u) => u.is_inscription).length;

  const filteredUsers = users.filter((u) => {
    if (userSourceFilter === 'app' && u.is_inscription) return false;
    if (userSourceFilter === 'inscricao' && !u.is_inscription) return false;
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  const filteredMemories = memories.filter((m) => {
    if (memoryFilter === 'all') return true;
    return m.category === memoryFilter;
  });

  const pendingSubsCount = subscriptions.filter((s) => s.status === 'pending').length;
  const activeSubscribersCount = users.filter(
    (u) => !u.is_inscription && u.plan_id && u.plan_id !== 'free'
  ).length;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 p-3.5 sm:p-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* CABEÇALHO DO PAINEL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-stone-200/80 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400 shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
              </div>
              <h1 className="text-xl sm:text-3xl font-serif font-medium text-stone-900 dark:text-stone-50 tracking-tight">
                Painel de Gestão
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-serif bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/40">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-1 font-serif">
              Controle total de planos, pagamentos PIX, bloqueio de clientes e suporte Lynx
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('help')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border text-xs font-medium transition flex items-center gap-1.5 sm:gap-2 shadow-sm active:scale-95 ${
                activeTab === 'help'
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Manual do Admin</span>
            </button>

            <button
              onClick={loadAllData}
              disabled={refreshing}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 text-xs font-medium text-stone-700 dark:text-stone-300 transition flex items-center gap-1.5 sm:gap-2 shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-700' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* CARTÕES DE MÉTRICAS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Usuários</span>
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-700 dark:text-teal-400" />
            </div>
            <span className="text-xl sm:text-3xl font-serif font-medium text-stone-900 dark:text-stone-50">
              {metrics?.totalUsers ?? '...'}
            </span>
            <span className="block text-[10px] sm:text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 sm:mt-1">
              Cadastros registrados
            </span>
          </div>

          <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Assinantes Ativos</span>
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 dark:text-amber-400" />
            </div>
            <span className="text-xl sm:text-3xl font-serif font-medium text-amber-800 dark:text-amber-300">
              {activeSubscribersCount}
            </span>
            <span className="block text-[10px] sm:text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 sm:mt-1">
              Planos Mensal ou Anual
            </span>
          </div>

          <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Pedidos PIX</span>
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-700 dark:text-teal-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-3xl font-serif font-medium text-stone-900 dark:text-stone-50">
                {subscriptions.length}
              </span>
              {pendingSubsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                  {pendingSubsCount} pendente(s)
                </span>
              )}
            </div>
            <span className="block text-[10px] sm:text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 sm:mt-1">
              Transações geradas
            </span>
          </div>

          <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Chamados Lynx</span>
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-700 dark:text-teal-400" />
            </div>
            <span className="text-xl sm:text-3xl font-serif font-medium text-teal-800 dark:text-teal-300">
              {feedbacks.length}
            </span>
            <span className="block text-[10px] sm:text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 sm:mt-1">
              Sugestões / Reclamações
            </span>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS COM QUEBRA DE LINHA RESPONSIVA */}
        <div className="w-full">
          <div className="flex flex-wrap items-center p-1.5 rounded-2xl bg-stone-200/60 dark:bg-slate-800/60 border border-stone-300/50 dark:border-slate-700/50 text-xs font-medium gap-1.5 w-full">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Usuários & Acessos ({users.length})
            </button>

            <button
              onClick={() => setActiveTab('plans')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'plans'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Configurar Planos & PIX
            </button>

            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'subscriptions'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              Assinaturas PIX ({pendingSubsCount > 0 ? `${pendingSubsCount} Pendentes` : subscriptions.length})
            </button>

            <button
              onClick={() => setActiveTab('feedbacks')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'feedbacks'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chamados & Suporte ({feedbacks.length})
            </button>

            <button
              onClick={() => setActiveTab('creator')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'creator'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Idealizador do IZAQUE
            </button>

            <button
              onClick={() => setActiveTab('pdf_campaigns')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'pdf_campaigns'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Links &amp; PDFs de Cadastro</span>
            </button>

            <button
              onClick={() => setActiveTab('broadcast')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'broadcast'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Comunicação & E-mails
            </button>

            <button
              onClick={() => setActiveTab('memories')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'memories'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Lembranças ({memories.length})
            </button>

            <button
              onClick={() => setActiveTab('agents')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'agents'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Mentores & Estudos
            </button>

            <button
              onClick={() => setActiveTab('guided')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'guided'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Conversas Direcionadas
            </button>

            <button
              onClick={() => setActiveTab('groups')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'groups'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Grupos & Disparos
            </button>

            <button
              onClick={() => setActiveTab('project')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'project'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>Gestão do Projeto</span>
            </button>

            <button
              onClick={() => setActiveTab('creative_troubles')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'creative_troubles'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Incômodo Criativo (Diagnósticos)</span>
            </button>

            <button
              onClick={() => setActiveTab('help')}
              className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'help'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Manual</span>
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('advanced_params')}
                className={`px-3 sm:px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'advanced_params'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span className="font-semibold">Parâmetros Avançados</span>
              </button>
            )}
          </div>
        </div>

        {/* ABA 1: GERENCIAR USUÁRIOS E CONTROLE DE ACESSO */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Atalho rápido do Link da Ficha de Inscrição Simples (/inscricao) */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-800/90 border border-stone-200/80 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Link2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                      Link da Ficha de Inscrição Simples (sem senha e sem envio de e-mail):
                    </span>
                    <code className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-slate-900 text-[11px] text-teal-800 dark:text-teal-300 border border-stone-200 dark:border-slate-700 truncate max-w-full">
                      {inscricaoPublicUrl}
                    </code>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    Quem preenche esta ficha aparece automaticamente na lista abaixo junto com os demais usuários.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyInscricaoLink}
                  className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  {copiedInscricaoLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedInscricaoLink ? 'Copiado!' : 'Copiar Link /inscricao'}</span>
                </button>
                <a
                  href="/inscricao"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-stone-700 dark:text-stone-200 text-xs font-medium transition flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Ficha</span>
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 items-stretch sm:items-center">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar por nome, e-mail ou celular..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 outline-none focus:border-teal-700"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setUserSourceFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    userSourceFilter === 'all'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100'
                  }`}
                >
                  Todos ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserSourceFilter('app')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    userSourceFilter === 'app'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100'
                  }`}
                >
                  Contas do App ({appUsersTotal})
                </button>
                <button
                  type="button"
                  onClick={() => setUserSourceFilter('inscricao')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    userSourceFilter === 'inscricao'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100'
                  }`}
                >
                  Fichas /inscricao ({inscriptionsTotal})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-stone-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
              <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
                <thead className="bg-stone-100/70 dark:bg-slate-850 uppercase font-semibold text-[11px] text-stone-500 border-b border-stone-200/80 dark:border-slate-700">
                  <tr>
                    <th className="p-4">Cliente / Contato</th>
                    <th className="p-4">Papel / Origem</th>
                    <th className="p-4">Plano Atual</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Data de Cadastro</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/60 dark:divide-slate-700/60">
                  {filteredUsers.map((u) => {
                    const isActive = u.is_active !== false;
                    const planId = u.plan_id || 'free';
                    const isInscription = Boolean(u.is_inscription);

                    return (
                      <tr key={`${isInscription ? 'insc' : 'app'}_${u.id}`} className="hover:bg-stone-50/70 dark:hover:bg-slate-750 transition">
                        <td className="p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-serif font-medium text-stone-900 dark:text-stone-100 text-sm">
                              {u.full_name || 'Sem nome'}
                            </span>
                            {isInscription ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                Ficha /inscricao
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                                Conta do App
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            {u.email || 'Sem e-mail (contato por celular)'}
                          </div>
                          {(u.phone || u.city || u.occupation || u.main_goal || u.notes) && (
                            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-stone-500 dark:text-stone-400">
                              {u.phone && <span>📱 {u.phone}</span>}
                              {u.city && (
                                <span>
                                  📍 {u.city}
                                  {u.state ? `/${u.state}` : ''}
                                </span>
                              )}
                              {u.occupation && <span>💼 {u.occupation}</span>}
                              {u.main_goal && <span>🎯 {u.main_goal}</span>}
                              {u.notes && <span>📝 {u.notes}</span>}
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          {isInscription ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-medium bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50">
                              Ficha de Contato
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs rounded-xl px-2.5 py-1 text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700"
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                              <option value="master">master</option>
                            </select>
                          )}
                        </td>

                        {/* PLANO ATUAL EDITÁVEL PELO SUPERADMIN */}
                        <td className="p-4">
                          {isInscription ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-medium bg-stone-100 dark:bg-slate-900 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-slate-700">
                              Sem login no app
                            </span>
                          ) : (
                            <select
                              value={planId}
                              onChange={(e) => handleUserPlanChange(u.id, e.target.value)}
                              className={`text-xs rounded-xl px-2.5 py-1 font-medium border outline-none ${
                                planId === 'pro_annual'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300'
                                  : planId === 'pro_monthly'
                                  ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-300'
                                  : 'bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-stone-300 border-stone-300'
                              }`}
                            >
                              <option value="free">Gratuito (free)</option>
                              <option value="pro_monthly">Mensal (R$ 29,90)</option>
                              <option value="pro_annual">Anual (R$ 247,00)</option>
                            </select>
                          )}
                        </td>

                        {/* STATUS DE ACESSO */}
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isActive
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                            {isActive ? 'Ativo' : isInscription ? 'Inativo' : 'Bloqueado'}
                          </span>
                        </td>

                        <td className="p-4 text-stone-400">
                          {new Date(u.created_at).toLocaleDateString('pt-BR')}
                        </td>

                        {/* BOTÕES DE AÇÃO */}
                        <td className="p-4 text-right">
                          {isInscription ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditInscription(u)}
                                title="Editar dados da ficha"
                                className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-stone-700 dark:text-stone-200 transition flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u.id, isActive)}
                                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                                  isActive
                                    ? 'bg-amber-100 dark:bg-amber-950/50 hover:bg-amber-200 text-amber-800 dark:text-amber-300'
                                    : 'bg-emerald-100 dark:bg-emerald-950/50 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300'
                                }`}
                              >
                                {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                <span>{isActive ? 'Inativar' : 'Ativar'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteInscription(u)}
                                title="Excluir ficha de inscrição"
                                className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/50 hover:bg-rose-200 text-rose-700 dark:text-rose-300 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u.id, isActive)}
                              className={`px-3 py-1 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 ml-auto ${
                                isActive
                                  ? 'bg-rose-100 dark:bg-rose-950/50 hover:bg-rose-200 text-rose-800 dark:text-rose-300'
                                  : 'bg-emerald-100 dark:bg-emerald-950/50 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300'
                              }`}
                            >
                              {isActive ? (
                                <>
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Bloquear Acesso</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Liberar Acesso</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 2: CONFIGURAR PLANOS E DADOS PIX */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LISTA DE PLANOS CADASTRADOS */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Planos de Mentoria
              </h3>
              {plans.map((p) => {
                const isSelected = selectedPlanId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPlanToEdit(p.id)}
                    className={`p-4 rounded-3xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 border-teal-700 shadow-md ring-2 ring-teal-700/20'
                        : 'bg-stone-100/70 dark:bg-slate-800/50 border-stone-200 dark:border-slate-700 hover:border-teal-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-medium text-sm text-stone-900 dark:text-stone-100">
                        {p.name}
                      </span>
                      <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                        R$ {Number(p.price).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-400 mt-1">
                      Ciclo: {p.billing_cycle === 'annual' ? 'Anual (365 dias)' : 'Mensal (30 dias)'}
                    </span>
                    <span className="text-[11px] text-teal-700 dark:text-teal-400 mt-0.5">
                      Chave PIX: {p.pix_key || 'Não cadastrada'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* FORMULÁRIO DE EDIÇÃO COMPLETO */}
            <div className="md:col-span-2 p-6 sm:p-8 rounded-4xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-slate-700">
                <div>
                  <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                    Editar Plano: {editingPlan?.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Altere o valor em Reais, a chave PIX de recebimento e os dados do titular.
                  </p>
                </div>
              </div>

              {editingPlan ? (
                <form onSubmit={handleSavePlan} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                        Nome do Plano
                      </label>
                      <input
                        type="text"
                        required
                        value={editingPlan.name || ''}
                        onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                        Valor em Reais (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editingPlan.price || 0}
                        onChange={(e) => setEditingPlan({ ...editingPlan, price: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700 transition"
                      />
                    </div>
                  </div>

                  {/* CONFIGURAÇÃO DA CHAVE PIX */}
                  <div className="p-4 rounded-3xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/60 space-y-4">
                    <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 text-xs font-semibold">
                      <QrCode className="w-4 h-4" />
                      <span>Configurações da Chave PIX Oficial</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                          Chave PIX (E-mail, CNPJ, CPF, Telefone ou Aleatória)
                        </label>
                        <input
                          type="text"
                          required
                          value={editingPlan.pix_key || ''}
                          onChange={(e) => setEditingPlan({ ...editingPlan, pix_key: e.target.value })}
                          placeholder="Ex: suporte@lynxems.com.br ou 00.000.000/0001-00"
                          className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                          Tipo da Chave
                        </label>
                        <select
                          value={editingPlan.pix_key_type || 'email'}
                          onChange={(e) => setEditingPlan({ ...editingPlan, pix_key_type: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700 transition"
                        >
                          <option value="email">E-mail</option>
                          <option value="cnpj">CNPJ</option>
                          <option value="cpf">CPF</option>
                          <option value="telefone">Telefone</option>
                          <option value="aleatoria">Chave Aleatória (EVP)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                        Nome do Favorecido / Titular da Conta
                      </label>
                      <input
                        type="text"
                        value={editingPlan.pix_beneficiary || ''}
                        onChange={(e) => setEditingPlan({ ...editingPlan, pix_beneficiary: e.target.value })}
                        placeholder="Ex: Lynx EMS Soluções Tecnológicas"
                        className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700 transition"
                      />
                    </div>
                  </div>

                  {/* AVISO DE ATIVAÇÃO DE 10 MINUTOS */}
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Aviso Exibido ao Usuário (Prazo de Ativação)
                    </label>
                    <textarea
                      rows={2}
                      value={editingPlan.activation_notice || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, activation_notice: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700 transition resize-none"
                    />
                  </div>

                  {/* DESCRIÇÃO E BENEFÍCIOS */}
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Descrição Resumida
                    </label>
                    <input
                      type="text"
                      value={editingPlan.description || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Benefícios do Plano (1 por linha)
                    </label>
                    <textarea
                      rows={4}
                      value={featuresText}
                      onChange={(e) => setFeaturesText(e.target.value)}
                      placeholder="Conversas sem limite&#10;Voz neural Charon e Aoede&#10;Suporte prioritário Lynx"
                      className="w-full px-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-200 outline-none focus:border-teal-700 transition font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingPlan}
                    className="px-6 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs shadow-md shadow-teal-700/20 transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingPlan ? 'Salvando...' : 'Salvar Alterações do Plano'}</span>
                  </button>
                </form>
              ) : (
                <div className="py-12 text-center text-xs text-stone-400">
                  Selecione um plano à esquerda para editar.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA 3: PEDIDOS DE ASSINATURA PIX */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                Histórico de Pedidos de Assinatura
              </h3>
              <span className="text-xs text-stone-400 font-serif">
                Total de pedidos: {subscriptions.length}
              </span>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-stone-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
              <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
                <thead className="bg-stone-100/70 dark:bg-slate-850 uppercase font-semibold text-[11px] text-stone-500 border-b border-stone-200/80 dark:border-slate-700">
                  <tr>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Plano Escolhido</th>
                    <th className="p-4">Valor</th>
                    <th className="p-4">Data do Pedido</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aprovação Superadmin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/60 dark:divide-slate-700/60">
                  {subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-stone-400 text-xs">
                        Nenhum pedido de assinatura registrado até o momento.
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => {
                      const isPending = sub.status === 'pending';
                      const isActive = sub.status === 'active';

                      return (
                        <tr key={sub.id} className="hover:bg-stone-50/70 dark:hover:bg-slate-750 transition">
                          <td className="p-4">
                            <div className="font-serif font-medium text-stone-900 dark:text-stone-100">
                              {sub.user_name || 'Cliente'}
                            </div>
                            <div className="text-[11px] text-stone-400">{sub.user_email}</div>
                          </td>

                          <td className="p-4 font-medium text-stone-800 dark:text-stone-200">
                            {sub.plan?.name || sub.plan_id}
                          </td>

                          <td className="p-4 font-semibold text-teal-800 dark:text-teal-300">
                            R$ {Number(sub.amount).toFixed(2).replace('.', ',')}
                          </td>

                          <td className="p-4 text-stone-400">
                            {new Date(sub.created_at).toLocaleString('pt-BR')}
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isActive
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                                  : isPending
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 animate-pulse'
                                  : 'bg-stone-100 dark:bg-slate-700 text-stone-500'
                              }`}
                            >
                              {isActive ? 'Ativo / Pago' : isPending ? 'Pendente de PIX' : sub.status}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => handleApproveSubscription(sub.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition active:scale-95 shadow-sm inline-flex items-center gap-1.5"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Aprovar & Ativar Plano</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                Aprovado em {sub.approved_at ? new Date(sub.approved_at).toLocaleDateString('pt-BR') : 'OK'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 4: CHAMADOS E MENSAGENS DE SUPORTE */}
        {activeTab === 'feedbacks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                Mensagens e Sugestões Enviadas por Assinantes
              </h3>
              <span className="text-xs text-stone-400 font-serif">
                Total recebido: {feedbacks.length}
              </span>
            </div>

            <div className="space-y-3">
              {feedbacks.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs rounded-3xl bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700">
                  Nenhuma mensagem de suporte recebida ainda.
                </div>
              ) : (
                feedbacks.map((fb) => {
                  const typeBadgeMap = {
                    suggestion: 'bg-teal-50 text-teal-800 border-teal-200',
                    complaint: 'bg-rose-50 text-rose-800 border-rose-200',
                    support: 'bg-blue-50 text-blue-800 border-blue-200',
                    praise: 'bg-amber-50 text-amber-800 border-amber-200',
                  };

                  return (
                    <div
                      key={fb.id}
                      className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 shadow-sm space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${
                              typeBadgeMap[fb.type] || 'bg-stone-100 text-stone-700 border-stone-200'
                            }`}
                          >
                            {fb.type}
                          </span>
                          <h4 className="font-serif font-medium text-sm text-stone-900 dark:text-stone-100">
                            {fb.subject}
                          </h4>
                        </div>
                        <span className="text-[11px] text-stone-400">
                          {new Date(fb.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div className="text-xs text-stone-500 dark:text-stone-400">
                        De: <strong>{fb.user_name}</strong> ({fb.user_email}) • Plano: <strong>{fb.user_plan || 'free'}</strong>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900 text-xs text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                        {fb.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ABA: IDEALIZADOR DO IZAQUE (CONFIGURAÇÃO & APRESENTAÇÃO) */}
        {activeTab === 'creator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* FORMULÁRIO DE EDIÇÃO */}
            <div className="lg:col-span-7 p-5 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 flex items-center justify-center text-teal-800 dark:text-teal-400">
                    <Award className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                      Apresentação do Idealizador
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Configure os dados exibidos no início da página principal
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={creatorData.is_visible !== false}
                    onChange={(e) => setCreatorData({ ...creatorData, is_visible: e.target.checked })}
                    className="w-4 h-4 text-teal-700 rounded focus:ring-teal-500"
                  />
                  <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                    Visível no site
                  </span>
                </label>
              </div>

              <form onSubmit={handleSaveCreator} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Nome do Idealizador
                    </label>
                    <input
                      type="text"
                      value={creatorData.name || ''}
                      onChange={(e) => setCreatorData({ ...creatorData, name: e.target.value })}
                      placeholder="Ex: Edson Manoel"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Título / Cargo
                    </label>
                    <input
                      type="text"
                      value={creatorData.title || ''}
                      onChange={(e) => setCreatorData({ ...creatorData, title: e.target.value })}
                      placeholder="Ex: Idealizador & Criador do IZAQUE"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    Foto do Idealizador (Upload ou Link)
                  </label>

                  {/* Input Invisível para Upload de Imagem */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoFileSelected}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Botão de Upload Direto do Dispositivo */}
                  <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingCreatorPhoto}
                      className="px-4 py-2.5 rounded-xl bg-teal-700/15 hover:bg-teal-700/25 border border-teal-700/30 dark:border-teal-500/30 text-teal-900 dark:text-teal-200 text-xs font-medium transition flex items-center gap-2 shrink-0 active:scale-95 disabled:opacity-50"
                    >
                      {uploadingCreatorPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-teal-700 dark:text-teal-400" />
                          <span>Enviando foto...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                          <span>Fazer Upload do Celular / PC</span>
                        </>
                      )}
                    </button>

                    <span className="text-[11px] text-stone-400 font-serif">
                      ou insira a URL direta da imagem:
                    </span>
                  </div>

                  <div className="flex gap-3 items-center">
                    <input
                      type="url"
                      value={creatorData.image_url || ''}
                      onChange={(e) => setCreatorData({ ...creatorData, image_url: e.target.value })}
                      placeholder="https://exemplo.com/sua-foto.jpg"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-stone-200 dark:bg-slate-700 shrink-0 border-2 border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center shadow-sm">
                      <img
                        src={creatorData.image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop'}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop';
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">
                    Você pode escolher uma foto salva no celular/computador ou digitar a URL direta.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Apresentação Resumida (Bio)
                  </label>
                  <textarea
                    rows={3}
                    value={creatorData.bio || ''}
                    onChange={(e) => setCreatorData({ ...creatorData, bio: e.target.value })}
                    placeholder="Quem é o idealizador e qual a sua paixão/trajetória..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Por que criei o IZAQUE (Propósito & Trajetória)
                  </label>
                  <textarea
                    rows={4}
                    value={creatorData.story || ''}
                    onChange={(e) => setCreatorData({ ...creatorData, story: e.target.value })}
                    placeholder="Conte o motivo que fez você conceber este espaço de escuta e desenvolvimento..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Frase de Inspiração / Citação Pessoal
                  </label>
                  <textarea
                    rows={2}
                    value={creatorData.quote || ''}
                    onChange={(e) => setCreatorData({ ...creatorData, quote: e.target.value })}
                    placeholder='"O verdadeiro crescimento não começa quando..."'
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-xs text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
                      Instagram (opcional)
                    </label>
                    <input
                      type="text"
                      value={creatorData.social_instagram || ''}
                      onChange={(e) => setCreatorData({ ...creatorData, social_instagram: e.target.value })}
                      placeholder="@edsonmanoel"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-xs text-stone-800 dark:text-stone-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
                      LinkedIn (opcional)
                    </label>
                    <input
                      type="text"
                      value={creatorData.social_linkedin || ''}
                      onChange={(e) => setCreatorData({ ...creatorData, social_linkedin: e.target.value })}
                      placeholder="edson-manoel"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-xs text-stone-800 dark:text-stone-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
                      WhatsApp (opcional)
                    </label>
                    <input
                      type="text"
                      value={creatorData.social_whatsapp || ''}
                      onChange={(e) => setCreatorData({ ...creatorData, social_whatsapp: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-xs text-stone-800 dark:text-stone-100"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 dark:border-slate-700/60 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={savingCreator}
                    className="px-6 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium shadow-md shadow-teal-700/20 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingCreator ? 'Salvando...' : 'Salvar Apresentação do Idealizador'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* PRÉ-VISUALIZAÇÃO EM TEMPO REAL */}
            <div className="lg:col-span-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Prévia ao Vivo na Página Principal
              </h3>

              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-teal-700/30 dark:border-teal-500/30 shadow-md bg-stone-100 dark:bg-slate-700">
                      <img
                        src={creatorData.image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop'}
                        alt={creatorData.name || 'Idealizador'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop';
                        }}
                      />
                    </div>
                    <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-teal-700 text-white shadow-sm whitespace-nowrap">
                      Idealizador
                    </span>
                  </div>

                  <h4 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-50">
                    {creatorData.name || 'Edson Manoel'}
                  </h4>
                  <p className="text-[11px] text-teal-800 dark:text-teal-400 font-serif">
                    {creatorData.title || 'Idealizador & Criador do IZAQUE'}
                  </p>
                </div>

                <div className="space-y-2 text-xs text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                  <p>{creatorData.bio || 'Apresentação do idealizador...'}</p>
                  {creatorData.story && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-100 dark:border-slate-700/60">
                      {creatorData.story}
                    </p>
                  )}
                </div>

                {creatorData.quote && (
                  <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border-l-3 border-teal-700 text-teal-900 dark:text-teal-200 text-xs italic font-serif leading-relaxed">
                    {creatorData.quote}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ABA 5: LEMBRANÇAS DE SESSÕES */}
        {activeTab === 'memories' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {['all', 'blocker', 'belief', 'pattern', 'goal', 'trauma'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setMemoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs capitalize transition ${
                    memoryFilter === cat
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  {cat === 'all' ? 'Todas' : cat}
                </button>
              ))}
            </div>

            <div className="grid gap-3">
              {filteredMemories.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs rounded-3xl bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700">
                  Nenhuma lembrança registrada nesta categoria ainda.
                </div>
              ) : (
                filteredMemories.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-stone-400">
                      <span className="capitalize text-teal-800 dark:text-teal-400 font-medium">
                        {m.category}
                      </span>
                      <span>{new Date(m.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-stone-700 dark:text-stone-200 font-serif leading-relaxed">
                      {m.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABA 6: GESTÃO DE MENTORES E ESTUDOS */}
        {activeTab === 'agents' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Mentores Ativos
                </span>
                <button
                  onClick={() => setIsCreateAgentOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium transition flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Mentor</span>
                </button>
              </div>

              {agents.map((ag) => (
                <div
                  key={ag.id}
                  onClick={() => {
                    setSelectedAgent(ag);
                    setAgentPrompt(ag.system_prompt);
                    setAgentTemp(Number(ag.temperature) || 0.7);
                    setAgentQuestions(Array.isArray(ag.starter_questions) ? [...ag.starter_questions] : []);
                    setEditingQuestionId(null);
                  }}
                  className={`p-4 rounded-3xl border transition cursor-pointer flex items-center justify-between ${
                    selectedAgent?.id === ag.id
                      ? 'bg-white dark:bg-slate-800 border-teal-700 shadow-md ring-2 ring-teal-700/20'
                      : 'bg-stone-100/70 dark:bg-slate-800/50 border-stone-200 dark:border-slate-700 hover:border-teal-500/40'
                  }`}
                >
                  <div>
                    <div className="font-serif font-medium text-stone-900 dark:text-stone-100">
                      {ag.name}
                    </div>
                    <div className="text-xs text-stone-400 mt-0.5">Identificador: {ag.slug}</div>
                  </div>

                  {ag.slug !== 'izaque-master' && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Deseja remover o mentor "${ag.name}"?`)) {
                          try {
                            await deleteAgent(ag.id);
                            loadAllData();
                          } catch (err) {
                            alert(err.message);
                          }
                        }
                      }}
                      title="Excluir Especialista"
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-stone-100 dark:hover:bg-slate-700 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="md:col-span-2 p-6 sm:p-8 rounded-4xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                    Diretrizes do Mentor: {selectedAgent?.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Instruções de tom de voz mansa, reticências para pausas e postura de escuta atenta.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveAgent} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                    Instrução de Persona & Fala
                  </label>
                  <textarea
                    rows={8}
                    value={agentPrompt}
                    onChange={(e) => setAgentPrompt(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs font-mono text-stone-800 dark:text-stone-200 leading-relaxed outline-none focus:border-teal-700 transition"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400 mb-1.5">
                    <span>Serenidade vs Criatividade: {agentTemp}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={agentTemp}
                    onChange={(e) => setAgentTemp(parseFloat(e.target.value))}
                    className="w-full accent-teal-700 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs shadow-md shadow-teal-700/20 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Diretrizes</span>
                </button>
              </form>

              {/* SEÇÃO DE PERGUNTAS PRONTAS DE CONDUÇÃO (STARTER QUESTIONS) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-stone-50/90 dark:bg-slate-900/90 border border-stone-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-700/10 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-serif font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        Perguntas Prontas de Condução
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40">
                          {agentQuestions.length} cadastradas
                        </span>
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        Perguntas de referência pré-configuradas para conduzir a conversa com o usuário. As respostas são salvas na memória permanente.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveQuestionsOnly}
                    disabled={savingQuestions}
                    className="self-start sm:self-auto px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs shadow-sm transition flex items-center gap-1.5 shrink-0 active:scale-95 disabled:opacity-50"
                  >
                    {savingQuestions ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Salvar Perguntas</span>
                  </button>
                </div>

                {/* FORMULÁRIO DE NOVA PERGUNTA */}
                <form onSubmit={handleAddQuestion} className="space-y-2.5 p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
                  <span className="text-xs font-serif font-medium text-stone-700 dark:text-stone-300 block">
                    Nova Pergunta para {selectedAgent?.name || 'este mentor'}
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Ex: Como identificar e desarmar a fissura quando a vontade vier hoje?"
                      className="flex-1 px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-100 outline-none focus:border-teal-700"
                    />
                    <input
                      type="text"
                      value={newQuestionCategory}
                      onChange={(e) => setNewQuestionCategory(e.target.value)}
                      placeholder="Categoria (ex: Manejo de Fissura)"
                      className="w-full sm:w-56 px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-100 outline-none focus:border-teal-700"
                    />
                    <button
                      type="submit"
                      disabled={!newQuestionText.trim()}
                      className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-medium transition disabled:opacity-40 flex items-center justify-center gap-1 shrink-0 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>

                  {/* CHIPS DE SUGESTÃO RÁPIDA DE CATEGORIA */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-stone-400 font-serif">Sugestões de temas:</span>
                    {[
                      'Manejo de Fissura',
                      'Prevenção de Recaída',
                      'Gatilhos Emocionais',
                      'Rede de Apoio',
                      'Autossabotagem',
                      'Crenças Limitantes',
                      'Ansiedade & Paz',
                      'Fé & Oração',
                      'Crença de Escassez',
                      'Delegação',
                    ].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewQuestionCategory(cat)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-slate-700/60 hover:bg-teal-50 dark:hover:bg-teal-950 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-slate-600 hover:border-teal-400 transition"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </form>

                {/* LISTA DE PERGUNTAS ATUAIS */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {agentQuestions.length === 0 ? (
                    <div className="py-6 text-center text-xs text-stone-400 font-serif">
                      Nenhuma pergunta pronta cadastrada para este mentor. Adicione uma acima para guiar as conversas dos usuários.
                    </div>
                  ) : (
                    agentQuestions.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition hover:border-stone-300 dark:hover:border-slate-600 shadow-2xs"
                      >
                        {editingQuestionId === q.id ? (
                          <div className="flex-1 flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={editingQuestionText}
                              onChange={(e) => setEditingQuestionText(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-100 outline-none"
                            />
                            <input
                              type="text"
                              value={editingQuestionCategory}
                              onChange={(e) => setEditingQuestionCategory(e.target.value)}
                              className="w-full sm:w-44 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-100 outline-none"
                            />
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={handleSaveEditQuestion}
                                className="px-3 py-1.5 rounded-xl bg-teal-700 text-white text-xs font-medium"
                              >
                                Salvar
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditQuestion}
                                className="px-3 py-1.5 rounded-xl bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-stone-300 text-xs"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40 shrink-0 uppercase font-semibold">
                                {q.category || 'Geral'}
                              </span>
                              <p className="text-xs text-stone-800 dark:text-stone-100 font-serif leading-relaxed">
                                {q.text}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleStartEditQuestion(q)}
                                title="Editar pergunta"
                                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-700 transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(q.id)}
                                title="Excluir pergunta"
                                className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* BASE DE ESTUDOS DO AGENTE */}
              {selectedAgent && (
                <AgentKnowledgeManager agent={selectedAgent} onUpdated={loadAllData} />
              )}
            </div>
          </div>
        )}

        {/* ABA 7: GUIA E MANUAL DO ADMINISTRADOR */}
        {activeTab === 'help' && (
          <AdminHelpGuide />
        )}

        {/* ABA 8: COMUNICAÇÃO & E-MAILS EM MASSA */}
        {activeTab === 'broadcast' && (
          <AdminBroadcastEmail currentUser={currentUser} />
        )}

        {/* ABA 9: CONVERSAS DIRECIONADAS DO SISTEMA */}
        {activeTab === 'guided' && (
          <AdminGuidedConversations agents={agents} />
        )}

        {/* ABA 10: GRUPOS DE USUÁRIOS & DISPAROS */}
        {activeTab === 'groups' && (
          <AdminUserGroups allUsers={users} currentUser={currentUser} />
        )}

        {/* ABA 11: GESTÃO E CRONOGRAMA DO PROJETO */}
        {activeTab === 'project' && (
          <AdminProjectPlanning currentUser={currentUser} />
        )}

        {/* ABA 12: PRONTUÁRIOS E DIAGNÓSTICOS DO INCÔMODO CRIATIVO */}
        {activeTab === 'creative_troubles' && (
          <AdminCreativeTroubles currentUser={currentUser} />
        )}

        {/* ABA 13: PARÂMETROS AVANÇADOS DO SISTEMA (EXCLUSIVO SUPERADMIN) */}
        {activeTab === 'advanced_params' && isSuperAdmin && (
          <AdminSystemSettings currentUser={currentUser} />
        )}

        {/* ABA 14: LINKS DE CADASTRO DIRETO & ENVIO AUTOMÁTICO DE PDFS */}
        {activeTab === 'pdf_campaigns' && (
          <AdminPdfCampaigns currentUser={currentUser} />
        )}

        {/* MODAL PARA EDITAR FICHA DE INSCRIÇÃO (/inscricao) */}
        {editingInscription && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded-3xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-50">
                    Editar Ficha de Inscrição
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Atualize os dados de contato e observações internas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingInscription(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveInscription} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingInscription.fullName}
                    onChange={(e) =>
                      setEditingInscription((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-xs text-stone-900 dark:text-stone-100 outline-none focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={editingInscription.email}
                    onChange={(e) =>
                      setEditingInscription((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="email@exemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-xs text-stone-900 dark:text-stone-100 outline-none focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Celular / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={editingInscription.phone}
                    onChange={(e) =>
                      setEditingInscription((prev) => ({
                        ...prev,
                        phone: formatPhoneMask(e.target.value),
                      }))
                    }
                    placeholder="(11) 99999-9999"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-xs text-stone-900 dark:text-stone-100 outline-none focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Observações Internas (visível apenas no Admin)
                  </label>
                  <textarea
                    rows={2}
                    value={editingInscription.notes}
                    onChange={(e) =>
                      setEditingInscription((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Ex: Veio pelo evento / prefere contato via WhatsApp..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-xs text-stone-900 dark:text-stone-100 outline-none focus:border-teal-700"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingInscription(null)}
                    className="px-4 py-2 rounded-xl text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingInscription}
                    className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {savingInscription ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL PARA CRIAR AGENTE */}
        <CreateAgentModal
          isOpen={isCreateAgentOpen}
          onClose={() => setIsCreateAgentOpen(false)}
          onSuccess={loadAllData}
        />
      </div>
    </div>
  );
}
