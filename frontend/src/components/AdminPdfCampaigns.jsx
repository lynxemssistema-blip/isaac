import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Link2,
  Copy,
  Check,
  ExternalLink,
  Upload,
  Edit3,
  Trash2,
  Star,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  Mail,
  Phone,
  MapPin,
  X,
  Filter,
} from 'lucide-react';
import {
  fetchAdminPdfCampaigns,
  createAdminPdfCampaign,
  updateAdminPdfCampaign,
  deleteAdminPdfCampaign,
  sendTestOrManualCampaignPdf,
  fetchAdminPdfDeliveries,
  fetchAdminUserGroups,
} from '../services/adminApi';

function slugifyClient(str = '') {
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function originLabel(origin) {
  switch (origin) {
    case 'direct_link':
      return 'Novo Cadastro (Link)';
    case 'existing_user_link':
      return 'Já Tinha Conta (Link)';
    case 'landing_modal':
      return 'Página Inicial';
    case 'admin_manual':
      return 'Envio Manual / Teste';
    default:
      return origin || 'Cadastro';
  }
}

export default function AdminPdfCampaigns({ currentUser }) {
  const [campaigns, setCampaigns] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [filterCampaignId, setFilterCampaignId] = useState('');

  // Formulário Criar / Editar
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfBase64, setPdfBase64] = useState('');
  const [pdfSizeBytes, setPdfSizeBytes] = useState(0);
  const [currentPdfUrl, setCurrentPdfUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Envio de teste / reenvio
  const [testOpenForId, setTestOpenForId] = useState(null);
  const [testEmail, setTestEmail] = useState(currentUser?.email || '');
  const [sendingTestId, setSendingTestId] = useState(null);
  const [resendingDeliveryId, setResendingDeliveryId] = useState(null);

  const fileInputRef = useRef(null);
  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setErrorMsg('');

      const [campList, delivList, groupList] = await Promise.all([
        fetchAdminPdfCampaigns(),
        fetchAdminPdfDeliveries(filterCampaignId),
        fetchAdminUserGroups().catch(() => []),
      ]);

      setCampaigns(campList || []);
      setDeliveries(delivList || []);
      setGroups(groupList || []);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao carregar campanhas de PDF.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterCampaignId]);

  const showTempFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg((prev) => (prev === msg ? '' : prev));
    }, 5000);
  };

  const handleCopyLink = async (url, key) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2500);
    } catch {
      showTempFeedback(`Copie manualmente: ${url}`);
    }
  };

  const openCreateForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setSlugManuallyEdited(false);
    setSubtitle('');
    setEmailSubject('📄 Olá, {{nome}}! Aqui está o seu material: {{titulo}}');
    setEmailBody(
      'Olá, {{nome}}!\n\nSeja muito bem-vindo(a) à Plataforma ISAAC.\n\nConforme combinado, anexamos neste e-mail o seu arquivo PDF "{{titulo}}" para você ler e consultar quando desejar.\n\nAproveite também para entrar na plataforma e iniciar suas conversas de clareza e evolução!'
    );
    setTargetGroupId('');
    setIsDefault(campaigns.length === 0);
    setIsActive(true);
    setPdfFileName('');
    setPdfBase64('');
    setPdfSizeBytes(0);
    setCurrentPdfUrl('');
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const openEditForm = (c) => {
    setEditingId(c.id);
    setTitle(c.title || '');
    setSlug(c.slug || '');
    setSlugManuallyEdited(true);
    setSubtitle(c.subtitle || '');
    setEmailSubject(c.email_subject || '');
    setEmailBody(c.email_body || '');
    setTargetGroupId(c.target_group_id || '');
    setIsDefault(Boolean(c.is_default));
    setIsActive(Boolean(c.is_active));
    setPdfFileName(c.pdf_file_name || '');
    setPdfBase64('');
    setPdfSizeBytes(c.pdf_size_bytes || 0);
    setCurrentPdfUrl(c.pdf_public_url || '');
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const handleTitleChange = (val) => {
    setTitle(val);
    if (!slugManuallyEdited) {
      setSlug(slugifyClient(val));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Por favor, selecione exclusivamente um arquivo em formato PDF (.pdf).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('O PDF deve ter no máximo 15 MB para garantir entrega sem bloqueios por e-mail.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPdfBase64(reader.result);
      setPdfFileName(file.name);
      setPdfSizeBytes(file.size);
      setErrorMsg('');
    };
    reader.onerror = () => {
      setErrorMsg('Falha ao ler o arquivo PDF selecionado.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Informe o título do material / página.');
      return;
    }
    if (!editingId && !pdfBase64) {
      setErrorMsg('Anexe o arquivo PDF que será enviado por e-mail aos cadastrados.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        slug: slugifyClient(slug || title),
        subtitle: subtitle.trim(),
        emailSubject: emailSubject.trim(),
        emailBody: emailBody.trim(),
        targetGroupId: targetGroupId || null,
        isDefault,
        isActive,
      };

      if (pdfBase64) {
        payload.pdfBase64 = pdfBase64;
        payload.pdfFileName = pdfFileName;
      }

      if (editingId) {
        await updateAdminPdfCampaign(editingId, payload);
        showTempFeedback('Campanha de PDF atualizada com sucesso!');
      } else {
        await createAdminPdfCampaign(payload);
        showTempFeedback('Novo link de cadastro e PDF criados com sucesso!');
      }

      setIsFormOpen(false);
      await loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao salvar campanha de PDF.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDefault = async (campaign) => {
    try {
      setErrorMsg('');
      const nextDefault = !campaign.is_default;
      await updateAdminPdfCampaign(campaign.id, { isDefault: nextDefault });
      showTempFeedback(
        nextDefault
          ? `"${campaign.title}" definido como PDF Padrão Geral do app!`
          : `"${campaign.title}" desmarcado como PDF Padrão Geral.`
      );
      await loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao alterar PDF padrão.');
    }
  };

  const handleToggleActive = async (campaign) => {
    try {
      setErrorMsg('');
      const nextActive = !campaign.is_active;
      await updateAdminPdfCampaign(campaign.id, { isActive: nextActive });
      showTempFeedback(
        nextActive ? `Link "${campaign.slug}" ativado!` : `Link "${campaign.slug}" pausado.`
      );
      await loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao alterar status da campanha.');
    }
  };

  const handleDelete = async (campaign) => {
    if (
      !window.confirm(
        `Deseja realmente remover a campanha "${campaign.title}" e seu arquivo PDF?`
      )
    ) {
      return;
    }

    try {
      setErrorMsg('');
      await deleteAdminPdfCampaign(campaign.id);
      showTempFeedback('Campanha removida com sucesso.');
      await loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao remover campanha.');
    }
  };

  const handleSendTest = async (campaign) => {
    if (!testEmail || !testEmail.includes('@')) {
      setErrorMsg('Digite um e-mail válido para enviar o PDF de teste.');
      return;
    }

    try {
      setSendingTestId(campaign.id);
      setErrorMsg('');
      const res = await sendTestOrManualCampaignPdf(campaign.id, {
        toEmail: testEmail.trim(),
        recipientName: currentUser?.full_name || 'Admin ISAAC',
        appUrl: baseOrigin,
      });
      showTempFeedback(res.message || `PDF enviado com sucesso para ${testEmail}!`);
      setTestOpenForId(null);
      await loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao enviar e-mail de teste com o PDF.');
    } finally {
      setSendingTestId(null);
    }
  };

  const handleResendDelivery = async (d) => {
    if (!d.campaign_id) return;
    try {
      setResendingDeliveryId(d.id);
      setErrorMsg('');
      await sendTestOrManualCampaignPdf(d.campaign_id, {
        toEmail: d.recipient_email,
        recipientName: d.recipient_name || d.profile?.full_name || 'Cliente',
        appUrl: baseOrigin,
      });
      showTempFeedback(`PDF reenviado com sucesso para ${d.recipient_email}!`);
      await loadData(true);
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao reenviar PDF.');
    } finally {
      setResendingDeliveryId(null);
    }
  };

  const defaultCampaign = campaigns.find((c) => c.is_default && c.is_active);
  const totalSentCount = campaigns.reduce((acc, c) => acc + (c.stats?.sent || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* CABEÇALHO DA SEÇÃO */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-800/90 border border-stone-200/80 dark:border-slate-700 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/50 text-teal-800 dark:text-teal-300 text-xs font-medium mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Captação por Link Direto &amp; Envio Automático de PDF</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-stone-900 dark:text-stone-50">
              Links de Cadastro &amp; Materiais em PDF
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed max-w-2xl">
              Cadastre um ou vários arquivos PDF. Cada PDF gera um <strong>link exclusivo de cadastro</strong> para divulgar aos seus contatos, e o PDF marcado como <strong>Padrão Geral</strong> também é enviado automaticamente para quem se cadastrar pela página inicial do app.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="px-3.5 py-2.5 rounded-2xl bg-stone-100 dark:bg-slate-700/70 hover:bg-stone-200 dark:hover:bg-slate-700 text-xs font-medium text-stone-700 dark:text-stone-200 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              <span>Atualizar</span>
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="px-4 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-md shadow-teal-700/20 transition flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Novo PDF / Link de Cadastro</span>
            </button>
          </div>
        </div>

        {/* BARRA DE RESUMO & LINK GERAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-stone-100 dark:border-slate-700/60">
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/50 border border-stone-200/70 dark:border-slate-700/60">
            <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
              Materiais PDF Cadastrados
            </span>
            <strong className="text-lg font-serif text-stone-900 dark:text-stone-100">
              {campaigns.length}
            </strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/50 border border-stone-200/70 dark:border-slate-700/60">
            <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
              Total de PDFs Entregues por E-mail
            </span>
            <strong className="text-lg font-serif text-teal-700 dark:text-teal-400">
              {totalSentCount}
            </strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-amber-900 dark:text-amber-300 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                PDF Padrão (Página Inicial &amp; Link Geral)
              </span>
              <button
                type="button"
                onClick={() => handleCopyLink(`${baseOrigin}/cadastro`, 'general')}
                className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                {copiedKey === 'general' ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar /cadastro</span>
                  </>
                )}
              </button>
            </div>
            <strong className="text-xs text-stone-800 dark:text-stone-100 truncate">
              {defaultCampaign
                ? `${defaultCampaign.title} (${defaultCampaign.pdf_file_name})`
                : 'Nenhum PDF marcado como padrão geral'}
            </strong>
          </div>
        </div>
      </div>

      {/* FEEDBACKS */}
      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* FORMULÁRIO DE CRIAÇÃO / EDIÇÃO DE CAMPANHA PDF */}
      {isFormOpen && (
        <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-800 border-2 border-teal-600/40 dark:border-teal-500/40 shadow-xl space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-700">
            <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-50">
              {editingId ? 'Editar Campanha & Arquivo PDF' : 'Cadastrar Novo Link & Anexar PDF'}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-2 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveCampaign} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Título */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Título da Página / Nome do Material *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ex.: Guia Prático de Clareza Mental"
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-sm outline-none"
                />
              </div>

              {/* Slug do Link */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Identificador do Link Direto (URL) *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setSlug(slugifyClient(e.target.value));
                  }}
                  placeholder="guia-clareza-mental"
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-sm font-mono outline-none"
                />
                <span className="text-[11px] text-teal-700 dark:text-teal-400 mt-1 block truncate">
                  Link gerado: {baseOrigin}/cadastro/{slug || 'seu-link'}
                </span>
              </div>

              {/* Subtítulo */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Chamada / Subtítulo exibido na Página de Cadastro
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ex.: Faça seu cadastro gratuito no ISAAC e receba este guia em PDF imediatamente no seu e-mail."
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-sm outline-none"
                />
              </div>

              {/* Upload do Arquivo PDF */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  Arquivo PDF que será enviado em anexo por E-mail {!editingId && '*'}
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-5 rounded-2xl border-2 border-dashed border-teal-600/40 dark:border-teal-500/40 bg-teal-50/40 dark:bg-teal-950/20 hover:bg-teal-50/80 dark:hover:bg-teal-950/40 cursor-pointer transition flex flex-col sm:flex-row items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-700/15 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-100">
                        {pdfFileName
                          ? `${pdfFileName} ${pdfSizeBytes ? `(${formatBytes(pdfSizeBytes)})` : ''}`
                          : 'Clique para selecionar o arquivo PDF no seu computador'}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        Formato .PDF • Tamanho máximo de 15 MB para anexo seguro por e-mail
                      </p>
                    </div>
                  </div>

                  <span className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs font-semibold text-teal-700 dark:text-teal-300 shrink-0">
                    {pdfFileName ? 'Trocar PDF' : 'Escolher PDF'}
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {editingId && currentPdfUrl && !pdfBase64 && (
                  <a
                    href={currentPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-400 hover:underline mt-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Visualizar PDF atual salvo no servidor</span>
                  </a>
                )}
              </div>

              {/* Assunto do E-mail */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Assunto do E-mail *
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="📄 Olá, {{nome}}! Aqui está o seu PDF"
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-sm outline-none"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Variáveis disponíveis: <code>{'{{nome}}'}</code> e <code>{'{{titulo}}'}</code>
                </span>
              </div>

              {/* Grupo Automático */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Classificar Inscritos em um Grupo (Opcional)
                </label>
                <select
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-sm outline-none"
                >
                  <option value="">Sem vínculo automático de grupo</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Corpo do E-mail */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Mensagem do E-mail que acompanha o PDF em anexo
                </label>
                <textarea
                  rows={4}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Escreva a mensagem acolhedora que será enviada junto com o PDF..."
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-sm outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* Opções de Padrão Geral & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-amber-900 dark:text-amber-200 block">
                    Definir como PDF Padrão Geral do App
                  </span>
                  <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                    Quem se cadastrar pelo botão normal da Página Inicial também receberá este PDF.
                  </span>
                </div>
              </label>

              <label className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-700 flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-teal-700 focus:ring-teal-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-stone-800 dark:text-stone-100 block">
                    Link &amp; Disparo Ativos
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    Desmarque caso deseje pausar temporariamente o envio deste PDF.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2.5 rounded-2xl bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 text-xs font-medium text-stone-700 dark:text-stone-200 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-md shadow-teal-700/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando PDF...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{editingId ? 'Salvar Alterações' : 'Criar Link & Salvar PDF'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTA DE CAMPANHAS / PDFS */}
      {loading ? (
        <div className="p-12 text-center text-stone-500 dark:text-stone-400 text-sm flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
          <span>Carregando campanhas de PDF...</span>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 text-center space-y-3">
          <FileText className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-base font-serif font-medium text-stone-800 dark:text-stone-100">
            Nenhum PDF de Cadastro configurado ainda
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
            Clique em <strong>Novo PDF / Link de Cadastro</strong> acima para anexar seu primeiro PDF e gerar o link direto para enviar aos seus contatos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {campaigns.map((c) => {
            const directUrl = `${baseOrigin}/cadastro/${c.slug}`;
            const stats = c.stats || {};

            return (
              <div
                key={c.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-800/90 border shadow-sm flex flex-col justify-between gap-4 transition ${
                  c.is_default
                    ? 'border-amber-400/80 dark:border-amber-500/60'
                    : 'border-stone-200/80 dark:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Badges e Ações Rápidas */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {c.is_default && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-400/40 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          PADRÃO GERAL
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          c.is_active
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        {c.is_active ? 'Ativo' : 'Pausado'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleDefault(c)}
                        title={
                          c.is_default
                            ? 'Remover como PDF Padrão Geral'
                            : 'Definir como PDF Padrão Geral'
                        }
                        className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-stone-100 dark:bg-slate-700/70 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-stone-700 dark:text-stone-200 transition"
                      >
                        {c.is_default ? 'Tirar do Padrão' : 'Tornar Padrão'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-stone-100 dark:bg-slate-700/70 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-200 transition"
                      >
                        {c.is_active ? 'Pausar' : 'Ativar'}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditForm(c)}
                        title="Editar"
                        className="p-1.5 rounded-xl text-stone-500 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-stone-100 dark:hover:bg-slate-700 transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        title="Excluir"
                        className="p-1.5 rounded-xl text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Título e Arquivo PDF */}
                  <div>
                    <h3 className="text-base sm:text-lg font-serif font-medium text-stone-900 dark:text-stone-50">
                      {c.title}
                    </h3>
                    {c.subtitle && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">
                        {c.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/70 dark:border-slate-700/60 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                      <span className="truncate font-medium text-stone-700 dark:text-stone-200">
                        {c.pdf_file_name}
                      </span>
                      {c.pdf_size_bytes ? (
                        <span className="text-[11px] text-stone-400 shrink-0">
                          ({formatBytes(c.pdf_size_bytes)})
                        </span>
                      ) : null}
                    </div>

                    {c.pdf_public_url && (
                      <a
                        href={c.pdf_public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 shrink-0"
                      >
                        <span>Ver PDF</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Caixa do Link Direto para Copiar */}
                  <div className="p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/50 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-teal-900 dark:text-teal-300 flex items-center gap-1">
                        <Link2 className="w-3.5 h-3.5" />
                        Link Direto para Enviar aos Contatos:
                      </span>
                      <a
                        href={directUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
                      >
                        <span>Abrir página</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={directUrl}
                        className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/60 text-xs font-mono text-stone-700 dark:text-stone-200 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyLink(directUrl, c.id)}
                        className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shrink-0"
                      >
                        {copiedKey === c.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rodapé de Métricas & Botão de Teste de E-mail */}
                <div className="pt-3 border-t border-stone-100 dark:border-slate-700/60 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>
                        <strong className="text-emerald-700 dark:text-emerald-400">
                          {stats.sent || 0}
                        </strong>{' '}
                        enviados
                      </span>
                      <span>• {stats.directSignups || 0} novos pelo link</span>
                      <span>• {stats.existingUsers || 0} já tinham conta</span>
                      <span>• {stats.landingSignups || 0} pág. inicial</span>
                      {(stats.failed || 0) > 0 && (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">
                          • {stats.failed} falha(s)
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setTestOpenForId((prev) => (prev === c.id ? null : c.id))
                      }
                      className="text-teal-700 dark:text-teal-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Testar envio de PDF</span>
                    </button>
                  </div>

                  {testOpenForId === c.id && (
                    <div className="flex items-center gap-2 pt-1 animate-fadeIn">
                      <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="Digite um e-mail para teste..."
                        className="flex-1 px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs outline-none"
                      />
                      <button
                        type="button"
                        disabled={sendingTestId === c.id}
                        onClick={() => handleSendTest(c)}
                        className="px-3.5 py-2 rounded-xl bg-stone-800 dark:bg-teal-600 hover:bg-stone-900 text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {sendingTestId === c.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Disparar Teste</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* HISTÓRICO DE CADASTROS & ENTREGAS DE PDF */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-800/90 border border-stone-200/80 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-medium text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span>Histórico de Inscritos &amp; Envios de PDF ({deliveries.length})</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Acompanhe todos os contatos que receberam seus PDFs e reenvie com 1 clique se necessário.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={filterCampaignId}
              onChange={(e) => setFilterCampaignId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs outline-none"
            >
              <option value="">Todos os PDFs</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {deliveries.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400">
            Nenhum envio registrado para o filtro selecionado ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-slate-700 text-stone-500 dark:text-stone-400">
                  <th className="py-2.5 pr-3 font-semibold">Contato / Perfil</th>
                  <th className="py-2.5 px-3 font-semibold">Material PDF</th>
                  <th className="py-2.5 px-3 font-semibold">Origem</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Data/Hora</th>
                  <th className="py-2.5 pl-3 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-700/60">
                {deliveries.map((d) => {
                  const p = d.profile;
                  return (
                    <tr key={d.id} className="hover:bg-stone-50/70 dark:hover:bg-slate-800/50">
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-stone-800 dark:text-stone-100">
                          {d.recipient_name || p?.full_name || 'Visitante'}
                        </div>
                        <div className="text-stone-500 dark:text-stone-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span>{d.recipient_email}</span>
                        </div>
                        {(p?.phone || p?.city) && (
                          <div className="text-[11px] text-stone-400 flex flex-wrap items-center gap-2 mt-0.5">
                            {p?.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" />
                                {p.phone}
                              </span>
                            )}
                            {p?.city && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5" />
                                {p.city}
                                {p.state ? `/${p.state}` : ''}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-stone-700 dark:text-stone-200 font-medium">
                        {d.campaign?.title || 'Campanha removida'}
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-slate-700 text-stone-700 dark:text-stone-300 text-[11px]">
                          {originLabel(d.signup_origin)}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {d.delivery_status === 'sent' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                            Enviado
                          </span>
                        ) : (
                          <span
                            title={d.error_message || ''}
                            className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold text-[11px]"
                          >
                            Falha
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-stone-500 dark:text-stone-400 whitespace-nowrap">
                        {d.sent_at
                          ? new Date(d.sent_at).toLocaleString('pt-BR')
                          : '-'}
                      </td>

                      <td className="py-3 pl-3 text-right">
                        {d.campaign_id && (
                          <button
                            type="button"
                            disabled={resendingDeliveryId === d.id}
                            onClick={() => handleResendDelivery(d)}
                            className="px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 text-teal-800 dark:text-teal-300 font-semibold text-[11px] transition inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            {resendingDeliveryId === d.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            <span>Reenviar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

