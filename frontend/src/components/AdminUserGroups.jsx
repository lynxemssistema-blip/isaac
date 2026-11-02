import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  UserPlus,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle,
  AlertCircle,
  Send,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Upload,
  Radio,
  Layers,
  Check,
  X,
  RefreshCw,
  Loader2,
  Volume2,
  Calendar,
  Sparkles,
  Shield,
  FileAudio,
} from 'lucide-react';
import {
  fetchAdminUserGroups,
  createAdminUserGroup,
  updateAdminUserGroup,
  deleteAdminUserGroup,
  fetchAdminGroupMembers,
  fetchUserAssignedGroups,
  setUserAssignedGroups,
  sendAdminGroupBroadcast,
  fetchAdminGroupBroadcasts,
  uploadBroadcastAudio,
} from '../services/adminApi';

const PRESET_COLORS = [
  { label: 'Esmeralda / Sobriedade', value: '#059669' },
  { label: 'Azul / Liderança', value: '#2563eb' },
  { label: 'Roxo / Espiritualidade', value: '#7c3aed' },
  { label: 'Âmbar / VIP Pro', value: '#d97706' },
  { label: 'Teal / Cura Emocional', value: '#0f766e' },
  { label: 'Rosa / Relacionamentos', value: '#db2777' },
  { label: 'Índigo / Finanças', value: '#4f46e5' },
  { label: 'Ardósia / Geral', value: '#475569' },
];

export default function AdminUserGroups({ allUsers = [], currentUser }) {
  const [activeSubTab, setActiveSubTab] = useState('groups'); // 'groups' | 'broadcast'
  const [groups, setGroups] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Modal de Criação / Edição de Grupo
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
    color: '#0f766e',
  });
  const [savingGroup, setSavingGroup] = useState(false);

  // Modal de Gestão de Membros de um Grupo
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  // Modal de Classificação de um Usuário Específico (Multi-grupos N:N)
  const [selectedUserForGroups, setSelectedUserForGroups] = useState(null);
  const [userGroupIds, setUserGroupIds] = useState([]);
  const [savingUserGroups, setSavingUserGroups] = useState(false);

  // Estado do Disparo de Comunicados (Broadcast de Texto / Áudio)
  const [selectedTargetGroupIds, setSelectedTargetGroupIds] = useState([]);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Áudio Player de Preview
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null);
  const audioPlayerRef = useRef(null);

  // Refs de gravação
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [gList, bList] = await Promise.all([
        fetchAdminUserGroups(),
        fetchAdminGroupBroadcasts(),
      ]);
      setGroups(gList || []);
      setBroadcasts(bList || []);
    } catch (err) {
      console.error('Erro ao carregar dados de grupos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  // ==========================================
  // GESTÃO DE GRUPOS (CRUD)
  // ==========================================
  const handleOpenCreateGroup = () => {
    setEditingGroupId(null);
    setGroupFormData({
      name: '',
      description: '',
      color: PRESET_COLORS[0].value,
    });
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroup = (g) => {
    setEditingGroupId(g.id);
    setGroupFormData({
      name: g.name || '',
      description: g.description || '',
      color: g.color || '#0f766e',
    });
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e) => {
    e?.preventDefault();
    if (!groupFormData.name.trim()) {
      alert('O nome do grupo é obrigatório.');
      return;
    }

    setSavingGroup(true);
    try {
      if (editingGroupId) {
        await updateAdminUserGroup(editingGroupId, groupFormData);
        showToast(`Grupo "${groupFormData.name}" atualizado com sucesso!`);
      } else {
        await createAdminUserGroup(groupFormData);
        showToast(`Grupo "${groupFormData.name}" criado com sucesso!`);
      }
      setIsGroupModalOpen(false);
      await loadData();
    } catch (err) {
      alert('Erro ao salvar grupo: ' + err.message);
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (g) => {
    if (!window.confirm(`Tem certeza que deseja excluir o grupo "${g.name}"? Os usuários não serão removidos do sistema.`)) {
      return;
    }
    try {
      await deleteAdminUserGroup(g.id);
      setGroups((prev) => prev.filter((item) => item.id !== g.id));
      showToast(`Grupo "${g.name}" excluído.`);
    } catch (err) {
      alert('Erro ao excluir grupo: ' + err.message);
    }
  };

  // ==========================================
  // GESTÃO DE MEMBROS DO GRUPO
  // ==========================================
  const handleOpenGroupMembers = async (g) => {
    setSelectedGroupForMembers(g);
    setLoadingMembers(true);
    try {
      const members = await fetchAdminGroupMembers(g.id);
      setGroupMembers(members || []);
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleToggleUserInGroup = async (userObj) => {
    if (!selectedGroupForMembers) return;
    const isMember = groupMembers.some((m) => m.id === userObj.id);

    try {
      // Busca os grupos atuais do usuário
      const currentGroups = await fetchUserAssignedGroups(userObj.id);
      let updatedGroups = [];
      if (isMember) {
        updatedGroups = currentGroups.filter((gid) => gid !== selectedGroupForMembers.id);
        setGroupMembers((prev) => prev.filter((m) => m.id !== userObj.id));
      } else {
        updatedGroups = Array.from(new Set([...currentGroups, selectedGroupForMembers.id]));
        setGroupMembers((prev) => [...prev, userObj]);
      }

      await setUserAssignedGroups(userObj.id, updatedGroups);
      // Atualiza contagem local
      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedGroupForMembers.id
            ? { ...g, member_count: Math.max(0, (g.member_count || 0) + (isMember ? -1 : 1)) }
            : g
        )
      );
    } catch (err) {
      alert('Erro ao atualizar membro: ' + err.message);
    }
  };

  // ==========================================
  // CLASSIFICAÇÃO DE UM USUÁRIO (N:N)
  // ==========================================
  const handleOpenUserClassification = async (userObj) => {
    setSelectedUserForGroups(userObj);
    try {
      const userGroups = await fetchUserAssignedGroups(userObj.id);
      setUserGroupIds(userGroups || []);
    } catch (err) {
      console.error('Erro ao carregar grupos do usuário:', err);
      setUserGroupIds([]);
    }
  };

  const handleToggleGroupForUser = (groupId) => {
    setUserGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSaveUserClassification = async () => {
    if (!selectedUserForGroups) return;
    setSavingUserGroups(true);
    try {
      await setUserAssignedGroups(selectedUserForGroups.id, userGroupIds);
      showToast(`Grupos de ${selectedUserForGroups.full_name || selectedUserForGroups.email} atualizados!`);
      setSelectedUserForGroups(null);
      await loadData();
    } catch (err) {
      alert('Erro ao salvar classificação: ' + err.message);
    } finally {
      setSavingUserGroups(false);
    }
  };

  // ==========================================
  // GRAVAÇÃO E UPLOAD DE ÁUDIO
  // ==========================================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioFile(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Não foi possível acessar o microfone: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const handleAudioFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    setAudioUrl('');
  };

  const handleTogglePlayAudio = (url) => {
    if (playingAudioUrl === url) {
      audioPlayerRef.current?.pause();
      setPlayingAudioUrl(null);
    } else {
      setPlayingAudioUrl(url);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = url;
        audioPlayerRef.current.play().catch(console.error);
      }
    }
  };

  // ==========================================
  // DISPARAR BROADCAST PARA GRUPOS
  // ==========================================
  const handleToggleTargetGroup = (groupId) => {
    setSelectedTargetGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSelectAllGroups = () => {
    if (selectedTargetGroupIds.length === groups.length) {
      setSelectedTargetGroupIds([]);
    } else {
      setSelectedTargetGroupIds(groups.map((g) => g.id));
    }
  };

  const handleSendBroadcast = async (e) => {
    e?.preventDefault();
    if (!broadcastTitle.trim()) {
      alert('Informe o título do comunicado.');
      return;
    }
    if (selectedTargetGroupIds.length === 0) {
      alert('Selecione pelo menos um grupo de destino.');
      return;
    }
    if (!broadcastContent.trim() && !audioFile && !audioUrl) {
      alert('Informe uma mensagem de texto ou grave/anexe um áudio para envio.');
      return;
    }

    setSendingBroadcast(true);
    try {
      let finalAudioUrl = audioUrl;

      // Se temos um arquivo/blob local gravado, fazer upload para o bucket
      if (audioFile) {
        finalAudioUrl = await uploadBroadcastAudio(audioFile);
      }

      const res = await sendAdminGroupBroadcast({
        title: broadcastTitle.trim(),
        content: broadcastContent.trim(),
        audio_url: finalAudioUrl || null,
        target_group_ids: selectedTargetGroupIds,
        sender_id: currentUser?.id || null,
      });

      showToast(res.message || 'Comunicado disparado com sucesso!');
      setBroadcastTitle('');
      setBroadcastContent('');
      setAudioFile(null);
      setAudioUrl('');
      setSelectedTargetGroupIds([]);
      await loadData();
    } catch (err) {
      alert('Erro ao disparar comunicado: ' + err.message);
    } finally {
      setSendingBroadcast(false);
    }
  };

  return (
    <div className="space-y-6">
      <audio
        ref={audioPlayerRef}
        onEnded={() => setPlayingAudioUrl(null)}
        onError={() => setPlayingAudioUrl(null)}
        className="hidden"
      />

      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center gap-3 text-teal-600 dark:text-teal-400 animate-fadeIn">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{feedbackMsg}</p>
        </div>
      )}

      {/* Header do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-white">
                Grupos de Usuários & Disparos
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Crie grupos personalizados, classifique seus usuários e envie mensagens de texto e áudio direcionadas.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {activeSubTab === 'groups' && (
            <button
              onClick={handleOpenCreateGroup}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl shadow-md flex items-center gap-2 font-medium text-sm transition"
            >
              <Plus className="w-4 h-4" />
              Novo Grupo
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs de Navegação: Grupos vs Disparos */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        <button
          onClick={() => setActiveSubTab('groups')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
            activeSubTab === 'groups'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Grupos & Classificação ({groups.length})
        </button>

        <button
          onClick={() => setActiveSubTab('broadcast')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
            activeSubTab === 'broadcast'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" />
          Disparar Texto & Áudio por Grupo
        </button>
      </div>

      {/* ========================================================== */}
      {/* SUB-ABA 1: GESTÃO DE GRUPOS & MEMBROS                      */}
      {/* ========================================================== */}
      {activeSubTab === 'groups' && (
        <div className="space-y-6">
          {/* Grid de Grupos Cadastrados */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-stone-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-teal-600" />
              <p className="text-sm">Carregando grupos de usuários...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center p-12 bg-white/40 dark:bg-stone-900/40 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800">
              <Users className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
              <h3 className="font-serif font-bold text-stone-800 dark:text-stone-200 text-lg mb-1">
                Nenhum grupo criado ainda
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto mb-4">
                Crie grupos para segmentar sua base de usuários e direcionar conteúdos e mentorias em áudio.
              </p>
              <button
                onClick={handleOpenCreateGroup}
                className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Grupo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-3xl border border-stone-200/90 dark:border-stone-800 p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition"
                >
                  <div>
                    {/* Header do Card com Cor do Grupo */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: g.color || '#0f766e' }}
                        />
                        <h3 className="font-serif font-bold text-stone-900 dark:text-white text-base">
                          {g.name}
                        </h3>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        {g.member_count || 0} {g.member_count === 1 ? 'membro' : 'membros'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mb-4">
                      {g.description || 'Sem descrição cadastrada.'}
                    </p>
                  </div>

                  {/* Ações do Card */}
                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenGroupMembers(g)}
                      className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      Gerenciar Membros
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditGroup(g)}
                        title="Editar grupo"
                        className="p-1.5 text-stone-400 hover:text-teal-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(g)}
                        title="Excluir grupo"
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Seção de Classificação Rápida de Usuários */}
          <div className="bg-white/70 dark:bg-stone-900/70 backdrop-blur-md rounded-3xl border border-stone-200 dark:border-stone-800 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Classificação Rápida de Usuários
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Clique em um usuário para definir ou alterar seus múltiplos grupos.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Filtrar usuário por nome ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {allUsers
                .filter(
                  (u) =>
                    !search ||
                    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                    u.email?.toLowerCase().includes(search.toLowerCase()) ||
                    u.phone?.toLowerCase().includes(search.toLowerCase())
                )
                .slice(0, 30)
                .map((u) => (
                  <div
                    key={u.id}
                    className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3 hover:bg-stone-100/80 dark:hover:bg-stone-800 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt={u.full_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center">
                          {u.full_name?.[0] || u.email?.[0] || 'U'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                          {u.full_name || 'Sem nome cadastrado'}
                        </p>
                        <p className="text-[11px] text-stone-400 truncate">
                          {u.email || (u.phone ? `📱 ${u.phone}` : 'Ficha /inscricao')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenUserClassification(u)}
                      className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition shrink-0"
                    >
                      Classificar Grupos
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SUB-ABA 2: DISPARO DE TEXTO & ÁUDIO POR GRUPO              */}
      {/* ========================================================== */}
      {activeSubTab === 'broadcast' && (
        <div className="space-y-6">
          <form
            onSubmit={handleSendBroadcast}
            className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md rounded-3xl border border-stone-200/90 dark:border-stone-800 p-6 space-y-6 shadow-sm"
          >
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Novo Disparo de Comunicado
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Selecione os grupos de destino e componha sua mensagem em texto e/ou áudio.
              </p>
            </div>

            {/* SELETOR DE GRUPOS DE DESTINO */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Grupos de Destino * ({selectedTargetGroupIds.length} selecionados)
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllGroups}
                  className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                >
                  {selectedTargetGroupIds.length === groups.length
                    ? 'Desmarcar Todos'
                    : 'Selecionar Todos'}
                </button>
              </div>

              {groups.length === 0 ? (
                <p className="text-xs text-amber-500 italic">
                  Crie grupos na aba "Grupos & Classificação" antes de realizar disparos.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {groups.map((g) => {
                    const isChecked = selectedTargetGroupIds.includes(g.id);
                    return (
                      <div
                        key={g.id}
                        onClick={() => handleToggleTargetGroup(g.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-2.5 ${
                          isChecked
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 shadow-xs'
                            : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 hover:border-stone-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isChecked
                              ? 'bg-teal-600 border-teal-600 text-white'
                              : 'border-stone-300 dark:border-stone-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-900 dark:text-white truncate">
                            {g.name}
                          </p>
                          <span className="text-[10px] text-stone-400">
                            {g.member_count || 0} membros
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Título do Comunicado */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                Título do Comunicado *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Palavra de Encorajamento para a Semana"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-stone-900 dark:text-white"
              />
            </div>

            {/* Mensagem em Texto */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                Conteúdo em Texto
              </label>
              <textarea
                rows={3}
                placeholder="Digite a mensagem que os usuários receberão em seus murais e notificações..."
                value={broadcastContent}
                onChange={(e) => setBroadcastContent(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-stone-900 dark:text-white"
              />
            </div>

            {/* GRAVAÇÃO / UPLOAD DE ÁUDIO */}
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <FileAudio className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    Anexar Áudio ao Comunicado (Voz do Mentor)
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Grave a voz diretamente pelo navegador ou carregue um arquivo existente.
                  </p>
                </div>

                {audioUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAudio}
                    className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remover Áudio
                  </button>
                )}
              </div>

              {!audioUrl ? (
                <div className="flex flex-wrap items-center gap-3">
                  {/* Botão de Gravar */}
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 animate-pulse shadow-md"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>
                        Parar Gravação ({Math.floor(recordingDuration / 60)}:
                        {String(recordingDuration % 60).padStart(2, '0')})
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-4 py-2.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-100 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                    >
                      <Mic className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Gravar Voz com Microfone</span>
                    </button>
                  )}

                  <span className="text-xs text-stone-400">ou</span>

                  {/* Upload de Arquivo de Áudio */}
                  <label className="px-4 py-2.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-100 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Carregar Arquivo (.mp3, .wav, .m4a)</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                /* Player de Prévia do Áudio */
                <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-teal-500/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleTogglePlayAudio(audioUrl)}
                      className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-sm"
                    >
                      {playingAudioUrl === audioUrl ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>
                    <div>
                      <p className="text-xs font-semibold text-stone-900 dark:text-white">
                        {audioFile?.name || 'Gravação de voz pronta para envio'}
                      </p>
                      <p className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                        Áudio pronto para reprodução
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botão de Disparo */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={sendingBroadcast}
                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-sm font-semibold shadow-md flex items-center gap-2 transition disabled:opacity-50"
              >
                {sendingBroadcast ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Disparando para os grupos...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Disparar Comunicado para os Grupos
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Histórico de Comunicados Enviados */}
          <div className="bg-white/70 dark:bg-stone-900/70 backdrop-blur-md rounded-3xl border border-stone-200 dark:border-stone-800 p-6">
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Histórico de Comunicados Enviados ({broadcasts.length})
            </h3>

            {broadcasts.length === 0 ? (
              <p className="text-xs text-stone-500 dark:text-stone-400 italic">
                Nenhum comunicado disparado até o momento.
              </p>
            ) : (
              <div className="space-y-3">
                {broadcasts.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-stone-900 dark:text-white truncate">
                          {b.title}
                        </h4>
                        {b.audio_url && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center gap-1">
                            <Volume2 className="w-3 h-3" />
                            Áudio
                          </span>
                        )}
                      </div>

                      {b.content && (
                        <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2">
                          {b.content}
                        </p>
                      )}

                      <p className="text-[10px] text-stone-400">
                        Enviado em {new Date(b.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    {b.audio_url && (
                      <button
                        type="button"
                        onClick={() => handleTogglePlayAudio(b.audio_url)}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-semibold flex items-center gap-1.5 shrink-0 text-stone-700 dark:text-stone-200"
                      >
                        {playingAudioUrl === b.audio_url ? (
                          <>
                            <Pause className="w-3.5 h-3.5 text-teal-600" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-teal-600" />
                            Ouvir Áudio
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: CRIAR OU EDITAR GRUPO                               */}
      {/* ========================================================== */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white">
                {editingGroupId ? 'Editar Grupo' : 'Novo Grupo de Usuários'}
              </h3>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                  Nome do Grupo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sobriedade & Hábitos"
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  placeholder="Objetivo e perfil dos membros deste grupo..."
                  value={groupFormData.description}
                  onChange={(e) =>
                    setGroupFormData({ ...groupFormData, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Seletor de Cor */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                  Cor de Identificação
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setGroupFormData({ ...groupFormData, color: c.value })}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition border-2 ${
                        groupFormData.color === c.value ? 'border-stone-900 dark:border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    >
                      {groupFormData.color === c.value && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingGroup}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  {savingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Salvar Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: GERENCIAR MEMBROS DO GRUPO                          */}
      {/* ========================================================== */}
      {selectedGroupForMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: selectedGroupForMembers.color }}
                />
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                    Membros: {selectedGroupForMembers.name}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {groupMembers.length} {groupMembers.length === 1 ? 'membro cadastrado' : 'membros cadastrados'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGroupForMembers(null)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Busca de usuários */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar usuário para adicionar ou remover..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Lista de Usuários do Sistema para Adicionar/Remover */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {loadingMembers ? (
                <div className="flex items-center justify-center p-8 text-stone-400">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600 mr-2" />
                  <span className="text-xs">Carregando membros...</span>
                </div>
              ) : (
                allUsers
                  .filter(
                    (u) =>
                      !memberSearch ||
                      u.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                      u.email?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                      u.phone?.toLowerCase().includes(memberSearch.toLowerCase())
                  )
                  .map((u) => {
                    const isMember = groupMembers.some((m) => m.id === u.id);
                    return (
                      <div
                        key={u.id}
                        className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                          isMember
                            ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-500/40'
                            : 'bg-stone-50 dark:bg-stone-800/40 border-stone-100 dark:border-stone-800'
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-700 text-xs font-bold flex items-center justify-center">
                            {u.full_name?.[0] || u.email?.[0] || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-stone-900 dark:text-white truncate">
                              {u.full_name || 'Sem nome'}
                            </p>
                            <p className="text-[10px] text-stone-400 truncate">
                              {u.email || (u.phone ? `📱 ${u.phone}` : 'Ficha /inscricao')}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleUserInGroup(u)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                            isMember
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 hover:bg-rose-200'
                              : 'bg-teal-600 text-white hover:bg-teal-500'
                          }`}
                        >
                          {isMember ? 'Remover' : 'Adicionar'}
                        </button>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedGroupForMembers(null)}
                className="px-5 py-2 bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL: CLASSIFICAÇÃO DE UM USUÁRIO EM MÚLTIPLOS GRUPOS (N:N)*/}
      {/* ========================================================== */}
      {selectedUserForGroups && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-white">
                  Classificar Grupos do Usuário
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {selectedUserForGroups.full_name || selectedUserForGroups.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForGroups(null)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400">
              Selecione todos os grupos aos quais este usuário deve pertencer:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {groups.map((g) => {
                const isSelected = userGroupIds.includes(g.id);
                return (
                  <div
                    key={g.id}
                    onClick={() => handleToggleGroupForUser(g.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 shadow-xs'
                        : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: g.color }}
                      />
                      <span className="text-xs font-semibold text-stone-900 dark:text-white">
                        {g.name}
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        isSelected
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : 'border-stone-300 dark:border-stone-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setSelectedUserForGroups(null)}
                className="px-4 py-2 text-xs text-stone-500 hover:text-stone-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveUserClassification}
                disabled={savingUserGroups}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                {savingUserGroups ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Salvar Classificação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
