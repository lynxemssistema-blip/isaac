import React, { useState, useEffect } from 'react';
import {
  Mail,
  Sparkles,
  Send,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Edit3,
  ShieldCheck,
  CreditCard,
  UserCheck,
  SendHorizonal,
  HelpCircle,
  Clock,
  Check,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import {
  fetchBroadcastStats,
  generateBroadcastDraft,
  sendBroadcastEmail,
} from '../services/adminApi';
import { fetchPublicEbooksStore } from '../services/ebookStoreApi';

export default function AdminBroadcastEmail({ currentUser }) {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Formulário do E-mail
  const [topicPrompt, setTopicPrompt] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [callToActionText, setCallToActionText] = useState('Visitar Meu Refúgio Agora');
  const [callToActionUrl, setCallToActionUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState('all'); // 'all' | 'subscribers' | 'free'
  const [ebookCatalog, setEbookCatalog] = useState({ ebooks: [], bundle: null });
  const [selectedEbookSlug, setSelectedEbookSlug] = useState('');

  // Estados de Operação
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailInput, setTestEmailInput] = useState(currentUser?.email || 'suporte@lynxems.com.br');
  const [activeView, setActiveView] = useState('edit'); // 'edit' | 'preview'

  // Mensagens e Modais
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    loadStats();
    fetchPublicEbooksStore()
      .then((res) => {
        if (res) {
          setEbookCatalog({
            ebooks: res.ebooks || [],
            bundle: res.bundle || res.completeBundle || null,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectEbookEmailPreset = (slug) => {
    setSelectedEbookSlug(slug);
    if (!slug) {
      setCallToActionUrl('');
      return;
    }

    const baseOrigin = 'https://isaac.lynxems.com.br';
    const isBundle = slug === 'colecao-completa';
    const book = isBundle
      ? ebookCatalog.bundle
      : (ebookCatalog.ebooks || []).find((b) => b.slug === slug);

    if (!book) return;

    const dedicatedUrl = `${baseOrigin}/loja/ebooks/${book.slug}`;
    const coverImg = book.coverUrl?.startsWith('http')
      ? book.coverUrl
      : `${baseOrigin}${book.coverUrl || '/ebooks/covers/colecao-completa.jpg'}`;

    setCallToActionUrl(dedicatedUrl);

    if (isBundle) {
      setSubject('📚 Lançamento Oficial: Coleção Completa 8 eBooks ISAAC® (30% OFF) — por Thiago Prata');
      setCallToActionText('Garantir Coleção Completa (30% OFF • R$ 111,44)');
      setHtmlContent(`<p>Olá, <strong>{{nome}}</strong>! Esperamos que esta carta encontre você com paz e clareza.</p>
<p>Temos a alegria de apresentar o lançamento da <strong>Coleção Completa ISAAC® Essential (8 Volumes em PDF Único)</strong>, escrita pelo mentor <strong>Thiago Prata</strong> — idealizador e criador da Plataforma e do App ISAAC®.</p>
<div style="text-align:center; margin: 22px 0;">
  <a href="${dedicatedUrl}" style="text-decoration:none;">
    <img src="${coverImg}" alt="Coleção Completa ISAAC Essential" style="max-width: 240px; width: 100%; border-radius: 14px; box-shadow: 0 10px 25px rgba(15,23,42,0.18);" />
  </a>
</div>
<p><strong>O que torna esta edição especial:</strong></p>
<ul>
  <li><strong>Arquivo PDF Único Consolidado</strong> reunindo todos os 8 eBooks segmentados da metodologia ISAAC®;</li>
  <li><strong>Edição Bilíngue (Português + Inglês Britânico no mesmo PDF)</strong>, com ilustrações editoriais inéditas e caderno prático de exercícios;</li>
  <li><strong>Dedicatória personalizada com o seu nome</strong> impressa na margem inferior das páginas;</li>
  <li><strong>Entrega automática imediata</strong> no seu E-mail e WhatsApp após confirmação via Asaas.</li>
</ul>
<p style="background:#fffbeb; border:1px solid #fde68a; padding:14px 18px; border-radius:12px; color:#78350f;">
  🔥 <strong>Promoção de 30% de Desconto no Pacote Completo:</strong> de <s>R$ 159,20</s> por apenas <strong>R$ 111,44</strong> (ou adquira cada volume individualmente por R$ 19,90).
</p>
<p>Clique no botão abaixo para visitar a página dedicada da coleção:</p>
<p><a href="${dedicatedUrl}" style="color:#0f766e; font-weight:700;">${dedicatedUrl}</a></p>`);
      setFeedback({
        type: 'success',
        message: 'Modelo de divulgação da Coleção Completa (R$ 111,44) carregado com capa e link dedicado!',
      });
      return;
    }

    const volNum = String(book.volumeNumber || 1).padStart(2, '0');
    setSubject(`📘 Novo eBook Vol. ${volNum}: ${book.title} — por Thiago Prata (Plataforma ISAAC®)`);
    setCallToActionText(`Acessar Página do Volume ${volNum} (R$ 19,90)`);
    setHtmlContent(`<p>Olá, <strong>{{nome}}</strong>! Tudo bem com você?</p>
<p>Convidamos você para conhecer o <strong>Volume ${volNum} da Coleção ISAAC® Essential</strong>, assinado pelo mentor <strong>Thiago Prata</strong> — criador da Plataforma e do App ISAAC®:</p>
<div style="text-align:center; margin: 22px 0;">
  <a href="${dedicatedUrl}" style="text-decoration:none;">
    <img src="${coverImg}" alt="${book.title}" style="max-width: 230px; width: 100%; border-radius: 14px; box-shadow: 0 10px 25px rgba(15,23,42,0.18);" />
  </a>
</div>
<h3 style="color:#0f766e; margin-bottom:6px;">${book.title}</h3>
<p style="margin-top:0; color:#57534e;"><em>${book.subtitle}</em></p>
<ul>
  <li><strong>Edição Bilíngue Oficial:</strong> conteúdo completo em Português e Inglês Britânico no mesmo PDF;</li>
  <li><strong>Dedicatória Nominal Exclusiva:</strong> seu exemplar é gerado com dedicatória para você na margem inferior do PDF;</li>
  <li><strong>Envio Automático:</strong> link liberado na hora no seu E-mail e celular (WhatsApp) via Asaas;</li>
  <li><strong>Investimento:</strong> apenas <strong>R$ 19,90</strong> neste volume avulso (ou leve os 8 volumes no PDF Único com <strong>30% de desconto por R$ 111,44</strong>).</li>
</ul>
<p>Acesse a página dedicada deste eBook pelo botão abaixo ou pelo link direto:<br/>
<a href="${dedicatedUrl}" style="color:#0f766e; font-weight:700;">${dedicatedUrl}</a></p>`);
    setFeedback({
      type: 'success',
      message: `Modelo de e-mail do Volume ${volNum} (${book.title}) carregado com capa e link dedicado!`,
    });
  };

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await fetchBroadcastStats();
      setStats(data);
    } catch (err) {
      console.warn('Erro ao carregar estatísticas de e-mail:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Solicitar ao Gemini para redigir o e-mail humanizado
  const handleGenerateDraft = async (customTopic = null) => {
    const textToUse = customTopic !== null ? customTopic : topicPrompt;
    setIsGenerating(true);
    setFeedback(null);

    try {
      const res = await generateBroadcastDraft({
        topic: textToUse,
        targetAudience,
      });

      if (res.draft) {
        setSubject(res.draft.subject || '');
        setHtmlContent(res.draft.bodyHtml || '');
        if (res.draft.callToActionText) {
          setCallToActionText(res.draft.callToActionText);
        }
        setFeedback({
          type: 'success',
          message: 'E-mail redigido com sucesso pela IA! Revise o texto e veja a prévia.',
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: err.message || 'Falha ao gerar redação com a IA.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Disparar e-mail de teste prévio
  const handleSendTest = async () => {
    if (!subject.trim() || !htmlContent.trim()) {
      setFeedback({ type: 'error', message: 'Preencha o assunto e o conteúdo antes de testar.' });
      return;
    }

    setIsSendingTest(true);
    setFeedback(null);

    try {
      const res = await sendBroadcastEmail({
        subject,
        htmlContent,
        targetAudience: 'test',
        testEmail: testEmailInput.trim(),
        callToActionText,
        callToActionUrl,
      });

      setFeedback({
        type: 'success',
        message: `E-mail de teste enviado com sucesso para ${testEmailInput}! Verifique sua caixa de entrada.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Erro ao enviar e-mail de teste.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Disparar para todos os usuários confirmados
  const handleConfirmSendBroadcast = async () => {
    setConfirmModalOpen(false);
    setIsSending(true);
    setFeedback(null);
    setSendResult(null);

    try {
      const res = await sendBroadcastEmail({
        subject,
        htmlContent,
        targetAudience,
        callToActionText,
        callToActionUrl,
      });

      setSendResult(res);
      setFeedback({
        type: 'success',
        message: `Disparo concluído! ${res.totalSent} e-mail(s) entregue(s) com sucesso.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Erro durante o disparo em massa.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const getTargetCount = () => {
    if (!stats) return 0;
    if (targetAudience === 'subscribers') return stats.subscribers || 0;
    if (targetAudience === 'free') return stats.freeUsers || 0;
    return stats.totalUsers || 0;
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DA SEÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white shadow-lg border border-teal-700/50">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-teal-200 border border-white/15">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-medium">
              Comunicação & E-mail para Usuários
            </h2>
          </div>
          <p className="text-xs text-teal-100/80 mt-1.5 font-serif max-w-2xl leading-relaxed">
            Envie novidades e cartas de acolhimento para todos os usuários cadastrados. A redação com IA cria textos calorosos, detalhistas e educados, sempre com a assinatura oficial da <strong>Equipe Lynx EMS</strong>.
          </p>
        </div>

        {/* STATUS DO SERVIDOR SMTP */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/25 border border-white/10 text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="font-semibold text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SMTP Hostinger Conectado</span>
            </div>
            <div className="text-[11px] text-teal-100/70 font-mono">
              suporte@lynxems.com.br (Porta 465)
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK DE STATUS */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-2 animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[11px] font-semibold underline hover:opacity-80"
          >
            Fechar
          </button>
        </div>
      )}

      {/* RESULTADO DO DISPARO ANTERIOR (SE HOUVER) */}
      {sendResult && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 shadow-sm text-xs">
          <h4 className="font-semibold text-stone-900 dark:text-stone-100 mb-1 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-teal-600" />
            Relatório do Último Disparo
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200/60 dark:border-slate-800">
              <span className="text-stone-500 block text-[10px]">Total Alvo</span>
              <strong className="text-sm">{sendResult.totalTarget}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
              <span className="block text-[10px]">Entregues com Sucesso</span>
              <strong className="text-sm">{sendResult.totalSent}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200/60 dark:border-slate-800">
              <span className="text-stone-500 block text-[10px]">Falhas</span>
              <strong className="text-sm">{sendResult.totalFailed}</strong>
            </div>
          </div>
        </div>
      )}

      {/* SELEÇÃO DO PÚBLICO-ALVO */}
      <div>
        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
          1. Selecione o Público Destinatário
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTargetAudience('all')}
            className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
              targetAudience === 'all'
                ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-600 text-teal-900 dark:text-teal-200 shadow-sm ring-1 ring-teal-500'
                : 'bg-white dark:bg-slate-800 border-stone-200/80 dark:border-slate-700 text-stone-700 dark:text-stone-300 hover:border-stone-300'
            }`}
          >
            <div>
              <div className="font-semibold text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Todos os Usuários
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Toda a base cadastrada no refúgio
              </p>
            </div>
            <span className="text-lg font-serif font-bold text-teal-700 dark:text-teal-400">
              {stats?.totalUsers ?? '...'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTargetAudience('subscribers')}
            className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
              targetAudience === 'subscribers'
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-600 text-amber-900 dark:text-amber-200 shadow-sm ring-1 ring-amber-500'
                : 'bg-white dark:bg-slate-800 border-stone-200/80 dark:border-slate-700 text-stone-700 dark:text-stone-300 hover:border-stone-300'
            }`}
          >
            <div>
              <div className="font-semibold text-sm flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Apenas Assinantes Pro
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Clientes de planos pagos ativos
              </p>
            </div>
            <span className="text-lg font-serif font-bold text-amber-700 dark:text-amber-400">
              {stats?.subscribers ?? '...'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTargetAudience('free')}
            className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
              targetAudience === 'free'
                ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-600 text-teal-900 dark:text-teal-200 shadow-sm ring-1 ring-teal-500'
                : 'bg-white dark:bg-slate-800 border-stone-200/80 dark:border-slate-700 text-stone-700 dark:text-stone-300 hover:border-stone-300'
            }`}
          >
            <div>
              <div className="font-semibold text-sm flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Usuários Gratuitos
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Membros sem assinatura ativa
              </p>
            </div>
            <span className="text-lg font-serif font-bold text-stone-600 dark:text-stone-400">
              {stats?.freeUsers ?? '...'}
            </span>
          </button>
        </div>
      </div>

      {/* DIVULGAÇÃO RÁPIDA DE EBOOKS DEDICADOS (THIAGO PRATA) */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-stone-50 to-teal-50/50 dark:from-slate-800 dark:via-slate-800/90 dark:to-teal-950/30 border border-amber-300/80 dark:border-amber-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-stone-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Divulgar Página Dedicada de eBook para Usuários do App (Autor: Thiago Prata)</span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 font-serif">
            Escolha um volume individual (<strong>R$ 19,90</strong>) ou a Coleção Completa 30% OFF (<strong>R$ 111,44</strong>) para montar automaticamente o e-mail com a capa de venda oficial e o link direto da página dedicada.
          </p>
        </div>

        <select
          value={selectedEbookSlug}
          onChange={(e) => handleSelectEbookEmailPreset(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-400 dark:border-amber-600 text-xs font-semibold text-stone-900 dark:text-white lg:w-96 shrink-0 cursor-pointer"
        >
          <option value="">📚 Selecionar eBook para Divulgação por E-mail...</option>
          <option value="colecao-completa">
            🔥 Coleção Completa (PDF Único c/ 8 eBooks • 30% OFF = R$ 111,44)
          </option>
          {(ebookCatalog.ebooks || []).map((eb) => (
            <option key={eb.slug} value={eb.slug}>
              📘 Vol. {String(eb.volumeNumber).padStart(2, '0')} — {eb.title} (R$ 19,90)
            </option>
          ))}
        </select>
      </div>

      {/* ASSISTENTE INTELIGENTE GEMINI PARA REDAÇÃO */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-stone-100 via-teal-50/40 to-stone-100 dark:from-slate-800 dark:via-teal-950/20 dark:to-slate-800 border border-teal-200/80 dark:border-teal-900/60 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
            <span>2. Solicitar ao App para Redigir o E-mail de Novidades</span>
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 font-serif">
            Estilo: Detalhista • Educado • Profundamente Humanizado
          </span>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-400 mb-3 font-serif">
          Digite abaixo quais novidades deseja destacar, ou deixe em branco para a IA criar automaticamente uma carta calorosa destacando os <strong>4 novos mentores especialistas</strong>, a <strong>voz estendida sem cortes</strong> e o suporte da equipe.
        </p>

        <textarea
          value={topicPrompt}
          onChange={(e) => setTopicPrompt(e.target.value)}
          placeholder="Ex: Gostaria de falar sobre a chegada do mentor estoico Marco Aurélio e da Dra. Sofia para limites no trabalho, convidar as pessoas a desabafarem sobre a semana e lembrar que estamos sempre aqui..."
          rows={3}
          className="w-full p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-300/80 dark:border-slate-700 text-xs font-serif leading-relaxed text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
        />

        {/* ATALHOS RÁPIDOS DE SUGESTÃO */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-[11px] font-semibold text-stone-500">Sugestões rápidas:</span>
          <button
            type="button"
            onClick={() => handleGenerateDraft('Novos 4 mentores (Marco Aurélio, Clara, Dra. Sofia e Caleb), voz sem cortes e suporte contínuo')}
            disabled={isGenerating}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-[11px] text-stone-700 dark:text-stone-300 hover:border-teal-500 transition"
          >
            🏛️ 4 Novos Mentores & Voz Sem Cortes
          </button>
          <button
            type="button"
            onClick={() => handleGenerateDraft('Carta de apoio emocional de fim de semana, desaceleração e autocuidado')}
            disabled={isGenerating}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-[11px] text-stone-700 dark:text-stone-300 hover:border-teal-500 transition"
          >
            🌿 Carta de Acolhimento & Paz
          </button>
          <button
            type="button"
            onClick={() => handleGenerateDraft('Apresentação do plano ISAAC Pro, suporte à sobriedade e reflexões diárias')}
            disabled={isGenerating}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-[11px] text-stone-700 dark:text-stone-300 hover:border-teal-500 transition"
          >
            ✨ Atualização de Recursos & Propósito
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => handleGenerateDraft()}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs transition shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>O Gemini está escrevendo com carinho...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Escrever E-mail com IA Agora</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ÁREA DE EDIÇÃO E PRÉ-VISUALIZAÇÃO */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 dark:border-slate-700 pb-4">
          <div>
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-teal-600" />
              3. Conteúdo da Mensagem & Pré-visualização
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-serif">
              Revise o assunto, o texto e visualize como o e-mail será recebido pelos usuários.
            </p>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-stone-100 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveView('edit')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 font-medium ${
                activeView === 'edit'
                  ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveView('preview')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 font-medium ${
                activeView === 'preview'
                  ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Pré-visualização
            </button>
          </div>
        </div>

        {activeView === 'edit' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Assunto do E-mail
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: 🌿 Uma carta de presença, novos mentores e o seu espaço no ISAAC"
                className="w-full p-3 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300/80 dark:border-slate-700 text-xs font-serif font-medium text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Texto do Botão de Ação (CTA)
                </label>
                <input
                  type="text"
                  value={callToActionText}
                  onChange={(e) => setCallToActionText(e.target.value)}
                  placeholder="Visitar Meu Refúgio Agora"
                  className="w-full p-3 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300/80 dark:border-slate-700 text-xs font-serif text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Personalização Dinâmica
                </label>
                <div className="p-2.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 text-[11px] text-teal-800 dark:text-teal-300">
                  Use <code>{'{{nome}}'}</code> em qualquer lugar do texto para que cada e-mail cumprimente o usuário pelo primeiro nome dele.
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Corpo da Mensagem (HTML ou Texto com Parágrafos)
              </label>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                rows={12}
                placeholder="<p>Olá, {{nome}}...</p><p>Escrevemos esta carta para...</p>"
                className="w-full p-3.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300/80 dark:border-slate-700 text-xs font-mono text-stone-800 dark:text-stone-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                A assinatura da Equipe Lynx EMS é inserida automaticamente no rodapé do e-mail.
              </span>
            </div>
          </div>
        ) : (
          /* MOLDURA DE PRÉ-VISUALIZAÇÃO AO VIVO */
          <div className="border border-stone-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-stone-100 dark:bg-slate-950 p-4 sm:p-8">
            <div className="max-w-[620px] mx-auto bg-[#faf9f6] text-[#292524] rounded-3xl p-6 sm:p-10 border border-[#e7e5e4] shadow-sm font-sans">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-serif font-bold text-[#0f766e] tracking-tight">ISAAC</h1>
                <p className="text-xs text-[#78716c] italic mt-1">
                  Espaço de Clareza, Acolhimento & Reconstrução de Vida
                </p>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#f5f5f4] shadow-sm">
                <div
                  className="text-sm text-[#334155] leading-relaxed font-serif space-y-3 prose max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: (htmlContent || '<p><em>Nenhum conteúdo inserido ainda. Solicite à IA ou digite acima...</em></p>')
                      .replace(/\{\{nome\}\}/gi, currentUser?.full_name?.split(' ')[0] || 'Viajante'),
                  }}
                />

                <div className="text-center my-8">
                  <span className="inline-block bg-[#0f766e] text-white px-8 py-3.5 rounded-2xl font-semibold text-xs shadow-md">
                    {callToActionText || 'Visitar Meu Refúgio Agora'}
                  </span>
                </div>

                {/* ASSINATURA OBRIGATÓRIA DA EQUIPE LYNX EMS */}
                <div className="mt-8 pt-6 border-t border-[#f1f5f9]">
                  <p className="text-xs font-semibold text-[#0f766e] m-0">
                    Com respeito, admiração e carinho pela sua caminhada,
                  </p>
                  <p className="text-sm font-bold text-[#0f172a] mt-1 mb-0">
                    Equipe Lynx EMS
                  </p>
                  <p className="text-xs text-[#64748b] mt-0.5 mb-0">
                    Tecnologia com Alma &amp; Plataforma ISAAC
                  </p>
                  <p className="text-xs text-[#0f766e] mt-1 mb-0 font-medium">
                    suporte@lynxems.com.br
                  </p>
                </div>
              </div>

              <div className="text-center mt-6 text-[11px] text-[#a8a29e]">
                Você está recebendo este comunicado porque faz parte do refúgio <strong>ISAAC</strong>.<br />
                © {new Date().getFullYear()} Lynx EMS. Todos os direitos reservados.
              </div>
            </div>
          </div>
        )}

        {/* BARRA DE AÇÕES INFERIOR */}
        <div className="pt-4 border-t border-stone-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* DISPARAR TESTE RÁPIDO */}
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={testEmailInput}
              onChange={(e) => setTestEmailInput(e.target.value)}
              placeholder="seu-email@dominio.com"
              className="p-2 sm:p-2.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs w-56 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <button
              type="button"
              onClick={handleSendTest}
              disabled={isSendingTest || isSending}
              className="px-3.5 py-2 sm:py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700 text-xs font-medium text-stone-700 dark:text-stone-300 transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              {isSendingTest ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 text-stone-500" />
              )}
              <span>Enviar Teste Prévio</span>
            </button>
          </div>

          {/* DISPARO EM MASSA */}
          <button
            type="button"
            onClick={() => setConfirmModalOpen(true)}
            disabled={isSending || isSendingTest || !subject.trim() || !htmlContent.trim()}
            className="px-6 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs transition shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Enviando para todos os usuários...</span>
              </>
            ) : (
              <>
                <SendHorizonal className="w-4 h-4" />
                <span>Disparar para {getTargetCount()} Usuário(s)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE DISPARO EM MASSA */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center mx-auto">
              <SendHorizonal className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
                Confirmar Disparo de E-mails
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-serif leading-relaxed">
                Você está prestes a disparar este e-mail oficial para <strong>{getTargetCount()} usuário(s)</strong> cadastrados no aplicativo.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-900 text-xs border border-stone-200 dark:border-slate-800 space-y-1">
              <div><strong>Assunto:</strong> {subject}</div>
              <div><strong>Público:</strong> {targetAudience === 'subscribers' ? 'Apenas Assinantes' : targetAudience === 'free' ? 'Apenas Gratuitos' : 'Todos os Usuários'}</div>
              <div><strong>Remetente:</strong> suporte@lynxems.com.br (Equipe Lynx EMS)</div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSendBroadcast}
                className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-md transition"
              >
                Confirmar e Disparar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
