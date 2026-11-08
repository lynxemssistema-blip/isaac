import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  UserX,
  Image as ImageIcon,
  Pause,
  Play,
  XCircle,
  Loader2,
  Sliders,
  Check,
  Sparkles,
  Save,
  RotateCcw,
  FileEdit,
  Eye,
  Globe,
  Edit3,
  CheckSquare,
  Square,
  X,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import {
  fetchAdminWhatsappOutreachOverview,
  syncAdminEvolutionContactsApi,
  createAdminWhatsappCampaignApi,
  controlAdminWhatsappCampaignApi,
  sendAdminWhatsappOutreachPreviewApi,
  updateAdminWhatsappSafetyApi,
  saveAdminWhatsappOutreachTemplatesApi,
  updateAdminWhatsappContactNameApi,
} from '../services/adminApi';
import { fetchPublicEbooksStore } from '../services/ebookStoreApi';
import { formatContactPhoneBadge } from '../utils/phoneUtils';

const FALLBACK_DEFAULT_UNREGISTERED_TEMPLATE = `{saudacao}, {nome}! Tudo bem com você?

Quero te apresentar uma ferramenta maravilhosa de clareza mental e desenvolvimento pessoal: a *Mentoria ISAAC*.

O ISAAC é um mentor confidencial, disponível 24h em texto e voz, criado para ouvir sem julgamentos, ajudar a desatar bloqueios emocionais e trazer direção para as suas decisões.

O acesso completo pelo App Web é *100% gratuito*. Venha conhecer e experimentar agora:
https://isaac.lynxems.com.br/

_(Se não desejar receber convites por aqui, basta responder "parar".)_`;

const FALLBACK_DEFAULT_REGISTERED_TEMPLATE = `{saudacao}, {nome}! Que alegria ter você na *Mentoria ISAAC*. {contexto}

Agora sua conta está integrada ao nosso canal e queremos lembrar como funcionam os nossos *2 planos* para você aproveitar cada recurso da melhor forma:

✅ *Plano Gratuito (R$ 0,00 — Sempre Livre):*
• Acesso 100% liberado no App Web em texto e voz
• Agente Orquestrador ISAAC + todos os Mentores Especialistas
• Memória evolutiva contínua e Laboratório do Incômodo Criativo
• Sem cartão de crédito e sem vínculo financeiro

💬 *Plano Pago — ISAAC no WhatsApp (R$ 14,99 / vencimento mensal):*
• Tudo do Plano Gratuito liberado no App
• Conversa direta aqui pelo *WhatsApp em Texto e Áudio* com o Agente Orquestrador ISAAC
• Reconhecimento automático pelo seu telefone e sincronização imediata no mesmo chat do App
• Assinatura mensal segura via Asaas (PIX, Cartão ou Boleto)

👉 Acesse sua mentoria ou veja os detalhes dos planos aqui:
https://isaac.lynxems.com.br/#planos

_(Se preferir não receber comunicados no WhatsApp, basta responder "parar".)_`;

const FALLBACK_DEFAULT_INTL_UNREGISTERED_TEMPLATE = `{saudacao}, {nome}! How are you doing?

I would love to introduce you to a wonderful tool for mental clarity and personal growth: *ISAAC Mentoring*.

ISAAC is a confidential mentor available 24/7 by text and voice, created to listen without judgement, help untangle emotional blocks, and bring clear direction to your decisions.

Full access via the Web App is *100% free of charge*. Come and experience your personalised space for reflection right now:
https://isaac.lynxems.com.br/

_(If you would rather not receive invitations here, simply reply "stop".)_`;

const FALLBACK_DEFAULT_INTL_REGISTERED_TEMPLATE = `{saudacao}, {nome}! It is a pleasure to have you with us at *ISAAC Mentoring*. {contexto}

Your account is now connected to our channel, and we would like to share a quick reminder of how our *2 plans* work so you can make the most of every feature:

✅ *Free Plan (100% Free — Always Open):*
• Full access on the Web App via text and voice
• ISAAC Orchestrator Agent + all Specialist Mentors
• Continuous evolutionary memory & Creative Trouble Lab
• No credit card required and no financial commitment

💬 *WhatsApp Plan — ISAAC on WhatsApp (Monthly Subscription):*
• Everything included in the Free Plan on the Web App
• Direct conversations right here on *WhatsApp via Text and Voice* with ISAAC
• Automatic recognition by your phone number and instant sync with your App chat
• Simple and secure monthly subscription

👉 Access your mentoring space or view plan details here:
https://isaac.lynxems.com.br/#planos

_(If you prefer not to receive updates on WhatsApp, simply reply "stop".)_`;

function renderLivePreviewText(
  template,
  { sampleName = 'Thiago', sampleContext = '', isIntl = false } = {}
) {
  const hour = new Date().getHours();
  const greeting = isIntl
    ? hour < 12
      ? 'Good morning'
      : hour < 18
      ? 'Good afternoon'
      : 'Good evening'
    : hour < 12
    ? 'Bom dia'
    : hour < 18
    ? 'Boa tarde'
    : 'Boa noite';

  const firstName = String(sampleName || '').trim().split(/\s+/)[0] || '';
  let rendered = String(template || '');

  if (firstName) {
    rendered = rendered
      .replace(/\{saudacao\}\s*,\s*\{nome\}/gi, `${greeting}, ${firstName}`)
      .replace(/\{saudacao\}/gi, greeting)
      .replace(/\{nome\}/gi, firstName);
  } else {
    rendered = rendered
      .replace(/\{saudacao\}\s*,\s*\{nome\}\s*([!?.])?/gi, (_, punct) => `${greeting}${punct || '!'}`)
      .replace(/,\s*\{nome\}/gi, '')
      .replace(/\{nome\}\s*,\s*/gi, '')
      .replace(/\{saudacao\}/gi, greeting)
      .replace(/\{nome\}/gi, '');
  }

  return rendered
    .replace(/[ \t]*\{contexto\}/gi, sampleContext ? ` ${sampleContext}` : '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

const STATUS_BADGES = {
  queued: { label: 'Na Fila Agendada', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  sending: { label: 'Enviando...', cls: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30' },
  sent: { label: 'Enviado c/ Sucesso', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  blocked_safety_lock: { label: 'Bloqueado (Trava)', cls: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30' },
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

  const [subTab, setSubTab] = useState('contacts'); // 'contacts' | 'templates' | 'schedule' | 'control'
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // Paginação visual leve de DOM (mantendo todos os contatos em memória para Seleção em Massa instantânea)
  const [visibleValidLimit, setVisibleValidLimit] = useState(80);
  const [visibleInvalidLimit, setVisibleInvalidLimit] = useState(80);

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
      totalValidName: 0,
      totalInvalidName: 0,
      totalInternational: 0,
      totalOptOut: 0,
      sentLast24h: 0,
      dailyLimit: 40,
    },
    contacts: [],
    filteredTotal: 0,
    campaigns: [],
    recentLogs: [],
    defaultImageUrl: 'https://isaac.lynxems.com.br/og-isaac-cover.jpg',
  });

  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [sendingPreviewKey, setSendingPreviewKey] = useState('');

  // Edição inline de nome do contato (Agenda App + Evolution API)
  const [editingContactId, setEditingContactId] = useState(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [savingContactNameId, setSavingContactNameId] = useState(null);

  // Form de Agendamento / Campanha Anti-Ban
  const [campTitle, setCampTitle] = useState('Campanha Controlada Mentoria ISAAC');
  const [audienceType, setAudienceType] = useState('mixed');
  const [scheduleMode, setScheduleMode] = useState('now'); // 'now' | 'later'
  const [scheduledAtInput, setScheduledAtInput] = useState('');
  const [minDelaySec, setMinDelaySec] = useState(18);
  const [maxDelaySec, setMaxDelaySec] = useState(38);
  const [dailyLimit, setDailyLimit] = useState(40);
  const [windowStart, setWindowStart] = useState('08:30');
  const [windowEnd, setWindowEnd] = useState('20:00');
  const [respectWindow, setRespectWindow] = useState(true);

  // 4 Modelos Editáveis (2 PT-BR + 2 Inglês Britânico en-GB) + Imagem Oficial
  const [templateLangFilter, setTemplateLangFilter] = useState('all'); // 'all' | 'pt' | 'en'
  const [unregisteredImageUrl, setUnregisteredImageUrl] = useState('https://isaac.lynxems.com.br/og-isaac-cover.jpg');
  const [unregisteredTemplate, setUnregisteredTemplate] = useState(FALLBACK_DEFAULT_UNREGISTERED_TEMPLATE);
  const [registeredTemplate, setRegisteredTemplate] = useState(FALLBACK_DEFAULT_REGISTERED_TEMPLATE);
  const [intlUnregisteredTemplate, setIntlUnregisteredTemplate] = useState(FALLBACK_DEFAULT_INTL_UNREGISTERED_TEMPLATE);
  const [intlRegisteredTemplate, setIntlRegisteredTemplate] = useState(FALLBACK_DEFAULT_INTL_REGISTERED_TEMPLATE);

  const [savedBaseline, setSavedBaseline] = useState({
    unregisteredImageUrl: 'https://isaac.lynxems.com.br/og-isaac-cover.jpg',
    unregisteredTemplate: FALLBACK_DEFAULT_UNREGISTERED_TEMPLATE,
    registeredTemplate: FALLBACK_DEFAULT_REGISTERED_TEMPLATE,
    intlUnregisteredTemplate: FALLBACK_DEFAULT_INTL_UNREGISTERED_TEMPLATE,
    intlRegisteredTemplate: FALLBACK_DEFAULT_INTL_REGISTERED_TEMPLATE,
  });

  const [savingTemplates, setSavingTemplates] = useState(false);
  const [templatesSavedFlash, setTemplatesSavedFlash] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const templatesHydratedRef = useRef(false);

  const unregisteredTextareaRef = useRef(null);
  const registeredTextareaRef = useRef(null);
  const intlUnregisteredTextareaRef = useRef(null);
  const intlRegisteredTextareaRef = useRef(null);

  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [ebookStoreCatalog, setEbookStoreCatalog] = useState({ ebooks: [], bundle: null });
  const [selectedEbookPresetSlug, setSelectedEbookPresetSlug] = useState('');
  const [quickEbookSlug, setQuickEbookSlug] = useState('loja-geral');
  const [sendingBulkEbook, setSendingBulkEbook] = useState(false);

  useEffect(() => {
    fetchPublicEbooksStore()
      .then((res) => {
        if (res) {
          setEbookStoreCatalog({
            ebooks: res.ebooks || [],
            bundle: res.bundle || res.completeBundle || null,
          });
        }
      })
      .catch(() => {});
  }, []);

  const buildEbookWhatsappPayload = useCallback(
    (targetSlug = 'loja-geral') => {
      const baseOrigin = 'https://isaac.lynxems.com.br';
      const cleanSlug = targetSlug || 'loja-geral';

      if (cleanSlug === 'loja-geral') {
        const storeUrl = `${baseOrigin}/loja/ebooks`;
        const coverImg = `${baseOrigin}/ebooks/covers/colecao-completa.jpg`;
        return {
          slug: 'loja-geral',
          shortLabel: 'Página dos eBooks',
          shortLabelEn: 'eBooks Store',
          campaignTitle: 'Divulgação Página dos eBooks ISAAC® — Thiago Prata',
          coverImg,
          dedicatedUrl: storeUrl,
          ptMsg: `{saudacao}, {nome}! Tudo bem com você?

Quero compartilhar com você a *Biblioteca Oficial de eBooks ISAAC® Essential*, escrita pelo mentor *Thiago Prata* — idealizador e criador da Mentoria e do App ISAAC®.

📚 *O que você encontra na página dos eBooks:*
• *8 eBooks segmentados* de leitura clara, profunda e prática por *R$ 19,90* cada
• *Promoção de 30% OFF na Coleção Completa* (todos os 8 livros em *1 Arquivo Único PDF* por *R$ 111,44*)
• Edição *Bilíngue (Português + Inglês Britânico no mesmo PDF)* com ilustrações e linhas de anotações
• *Dedicatória personalizada com o seu nome* na margem inferior do PDF + envio imediato no E-mail e WhatsApp

👉 Acesse a página dos eBooks, veja as capas e monte seu carrinho:
${storeUrl}

_(Se preferir não receber novidades por aqui, basta responder "parar".)_`,
          enMsg: `{saudacao}, {nome}! How are you doing?

I would love to share with you the *Official ISAAC® Essential eBook Library*, authored by *Thiago Prata* — Mentor and Creator of the ISAAC® Mentoring App.

📚 *What you will find on our eBooks page:*
• *8 segmented volumes* designed for practical clarity (*R$ 19.90* each)
• *30% OFF Complete Collection* (all 8 books united in *1 Single Master PDF* for *R$ 111.44*)
• Full *Bilingual Edition (Portuguese + British English in the same PDF)* with custom illustrations and note pages
• *Personalised dedication bearing your name* in the bottom margin + instant delivery via Email and WhatsApp

👉 Visit the official eBooks page and explore all covers here:
${storeUrl}

_(If you prefer not to receive updates here, simply reply "stop".)_`,
        };
      }

      if (cleanSlug === 'colecao-completa') {
        const bundleUrl = `${baseOrigin}/loja/ebooks/colecao-completa`;
        const coverImg = `${baseOrigin}/ebooks/covers/colecao-completa.jpg`;
        return {
          slug: 'colecao-completa',
          shortLabel: 'Coleção 8 eBooks (30% OFF)',
          shortLabelEn: 'All 8 eBooks (30% OFF)',
          campaignTitle: 'Oferta Especial: Coleção Completa 8 eBooks ISAAC® (30% OFF) — Thiago Prata',
          coverImg,
          dedicatedUrl: bundleUrl,
          ptMsg: `{saudacao}, {nome}! Tudo bem com você?

Quero compartilhar com você o lançamento oficial da *Coleção Completa ISAAC® Essential (8 Volumes em PDF Único)*, escrita pelo mentor *Thiago Prata* — idealizador e criador da Mentoria e do App ISAAC®.

📚 *O que você recebe imediatamente após a confirmação:*
• Arquivo *PDF Único Consolidado* com todos os *8 eBooks completos*
• Edição *Bilíngue (Português + Inglês Britânico no mesmo PDF)* com ilustrações e caderno prático de exercícios
• *Dedicatória nominal exclusiva para você* impressa na margem inferior das páginas
• Envio automático do link de download para o seu E-mail e WhatsApp

🔥 *Promoção Especial de 30% de Desconto:*
De ~R$ 159,20~ por apenas *R$ 111,44* (pagamento direto via PIX, Cartão ou Boleto Asaas).

👉 Conheça a página dedicada da Coleção Completa ou escolha volumes avulsos (R$ 19,90):
${bundleUrl}

_(Se preferir não receber novidades por aqui, basta responder "parar".)_`,
          enMsg: `{saudacao}, {nome}! How are you doing?

I am delighted to share with you the official release of the *Complete ISAAC® Essential Collection (All 8 Volumes in a Single PDF)*, authored by *Thiago Prata* — Mentor and Creator of the ISAAC® Mentoring App.

📚 *What is included upon payment confirmation:*
• *Single Consolidated PDF* containing all *8 complete volumes*
• *Bilingual Edition (Portuguese + British English inside the same PDF)* with custom illustrations and ruled exercise pages
• *Personalised dedication to you* printed along the bottom margin of every page
• Instant delivery link sent straight to your Email and WhatsApp

🔥 *Special 30% Bundle Discount:*
All 8 bilingual volumes for *R$ 111.44* (30% OFF individual price).

👉 View the dedicated collection page here:
${bundleUrl}

_(If you prefer not to receive updates here, simply reply "stop".)_`,
        };
      }

      const book = (ebookStoreCatalog.ebooks || []).find((b) => b.slug === cleanSlug);
      if (!book) {
        return null;
      }

      const volNum = String(book.volumeNumber || 1).padStart(2, '0');
      const enTitle = book.enTitle || book.en?.title || book.title;
      const enSub = book.enSubtitle || book.en?.subtitle || book.subtitle;
      const dedicatedUrl = `${baseOrigin}/loja/ebooks/${book.slug}`;
      const coverImg = book.coverUrl?.startsWith('http')
        ? book.coverUrl
        : `${baseOrigin}${book.coverUrl || `/ebooks/covers/vol-${volNum}.jpg`}`;

      return {
        slug: book.slug,
        shortLabel: `eBook Vol. ${volNum}`,
        shortLabelEn: `eBook Vol. ${volNum}`,
        campaignTitle: `eBook Vol. ${volNum}: ${book.title} — Thiago Prata`,
        coverImg,
        dedicatedUrl,
        ptMsg: `{saudacao}, {nome}! Tudo bem com você?

Acaba de sair o *Volume ${volNum} da Coleção ISAAC® Essential*, escrito pelo mentor *Thiago Prata* (criador da Mentoria e do App ISAAC®):

📘 *${book.title}*
_${book.subtitle}_

✨ *Destaques desta edição:*
• Conteúdo *Bilíngue (Português + Inglês Britânico no mesmo PDF)* com ilustrações editoriais e exercícios práticos
• *Dedicatória exclusiva com o seu nome* na margem inferior do PDF
• Entrega imediata no seu E-mail e WhatsApp após confirmação via Asaas
• Investimento acessível: apenas *R$ 19,90* _(ou leve os 8 volumes no PDF Único com 30% OFF por R$ 111,44)_

👉 Acesse a página dedicada deste eBook e veja a capa e os capítulos:
${dedicatedUrl}

_(Se preferir não receber comunicados no WhatsApp, responda "parar".)_`,
        enMsg: `{saudacao}, {nome}! How are you doing?

We have just released *Volume ${volNum} of the ISAAC® Essential Collection*, authored by *Thiago Prata* (Mentor & Creator of the ISAAC® App):

📘 *${enTitle}*
_${enSub}_

✨ *Edition highlights:*
• Complete *Bilingual Single PDF (Portuguese + British English in the same file)* with custom illustrations and practical frameworks
• *Personalised dedication bearing your name* in the bottom margin of every page
• Instant download link delivered to your Email and WhatsApp
• Individual volume: *R$ 19.90* _(or save 30% on the Complete 8-in-1 Collection)_

👉 Explore the dedicated page for this eBook here:
${dedicatedUrl}

_(If you prefer not to receive updates on WhatsApp, simply reply "stop".)_`,
      };
    },
    [ebookStoreCatalog]
  );

  const handleApplyEbookCampaignPreset = (slug) => {
    setSelectedEbookPresetSlug(slug);
    if (!slug) return;
    const payload = buildEbookWhatsappPayload(slug);
    if (!payload) return;

    setQuickEbookSlug(slug);
    setUnregisteredImageUrl(payload.coverImg);
    setCampTitle(payload.campaignTitle);
    setUnregisteredTemplate(payload.ptMsg);
    setRegisteredTemplate(payload.ptMsg);
    setIntlUnregisteredTemplate(payload.enMsg);
    setIntlRegisteredTemplate(payload.enMsg);
    showToast(`${payload.campaignTitle} carregada com capa oficial e link direto!`);
  };

  const handleDirectSendEbookPage = async (contact) => {
    const phone = contact.phone_digits;
    const isIntl = Boolean(contact.is_international);
    const key = `${phone}:ebook_page`;
    const payload = buildEbookWhatsappPayload(quickEbookSlug) || buildEbookWhatsappPayload('loja-geral');

    try {
      setSendingPreviewKey(key);
      setErrorMsg('');
      const res = await sendAdminWhatsappOutreachPreviewApi({
        phone,
        flowType: 'unregistered_invite_image',
        customImageUrl: payload.coverImg,
        customTemplate: isIntl ? payload.enMsg : payload.ptMsg,
        customTitle: `📘 ${payload.campaignTitle} (${phone})`,
      });
      if (res.outcome === 'sent') {
        const langBadge = isIntl ? ' (em Inglês Britânico 🇬🇧)' : '';
        showToast(
          `Página dos eBooks (${payload.shortLabel})${langBadge} enviada com capa oficial para ${
            contact.formatted_phone || phone
          }!`
        );
      } else {
        setErrorMsg(`Resultado do disparo: ${res.outcome} ${res.error || res.reason || ''}`);
      }
      await loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao enviar página dos eBooks.');
    } finally {
      setSendingPreviewKey('');
    }
  };

  const handleBulkSendEbookPageToSelected = async () => {
    if (selectedContactIds.length === 0 || sendingBulkEbook) return;
    const payload = buildEbookWhatsappPayload(quickEbookSlug) || buildEbookWhatsappPayload('loja-geral');

    try {
      setSendingBulkEbook(true);
      setErrorMsg('');
      const res = await createAdminWhatsappCampaignApi({
        title: `📘 ${payload.campaignTitle}`,
        audienceType: 'selected',
        contactIds: selectedContactIds,
        scheduledAt: new Date().toISOString(),
        minDelaySec: Number(minDelaySec) || 18,
        maxDelaySec: Number(maxDelaySec) || 38,
        dailyLimit: Number(dailyLimit) || 40,
        windowStartHhmm: windowStart,
        windowEndHhmm: windowEnd,
        respectWindow: false,
        forceFlowType: 'unregistered_invite_image',
        unregisteredImageUrl: payload.coverImg,
        unregisteredTemplate: payload.ptMsg,
        registeredTemplate: payload.ptMsg,
        intlUnregisteredTemplate: payload.enMsg,
        intlRegisteredTemplate: payload.enMsg,
      });

      showToast(
        `Envio da Página dos eBooks iniciado! ${res.queuedCount} contato(s) na fila Anti-Ban com capa oficial e link direto.`
      );
      setSelectedContactIds([]);
      setSubTab('control');
      await loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao disparar página dos eBooks para os selecionados.');
    } finally {
      setSendingBulkEbook(false);
    }
  };

  // Modal / Seção de Segurança (Master)
  const [showSafetyConfig, setShowSafetyConfig] = useState(false);
  const [safetyRestricted, setSafetyRestricted] = useState(true);
  const [safetyPhones, setSafetyPhones] = useState('31995574906');
  const [safetyDailyLimit, setSafetyDailyLimit] = useState(40);
  const [safetyCooldownHours, setSafetyCooldownHours] = useState(72);
  const [savingSafety, setSavingSafety] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 5000);
  };

  const loadOverview = useCallback(
    async (opts = {}) => {
      try {
        setErrorMsg('');
        const data = await fetchAdminWhatsappOutreachOverview({
          search: opts.search !== undefined ? opts.search : search,
          filter: opts.filter !== undefined ? opts.filter : filter,
          limit: 2500,
        });
        setOverview(data);
        setSafetyRestricted(Boolean(data.safety?.restrictedMode));
        setSafetyPhones(data.safety?.allowedPhonesRaw || '31995574906');
        setSafetyDailyLimit(data.safety?.dailyLimit || 40);
        setSafetyCooldownHours(data.safety?.cooldownHours ?? 72);
        setDailyLimit(data.safety?.dailyLimit || 40);

        const tplData = data.templates || {};
        const effectiveImg =
          tplData.unregisteredImageUrl || data.defaultImageUrl || 'https://isaac.lynxems.com.br/og-isaac-cover.jpg';
        const effectiveUnreg =
          tplData.effectiveUnregisteredTemplate ||
          tplData.defaultUnregisteredTemplate ||
          FALLBACK_DEFAULT_UNREGISTERED_TEMPLATE;
        const effectiveReg =
          tplData.effectiveRegisteredTemplate ||
          tplData.defaultRegisteredTemplate ||
          FALLBACK_DEFAULT_REGISTERED_TEMPLATE;
        const effectiveIntlUnreg =
          tplData.effectiveIntlUnregisteredTemplate ||
          tplData.defaultIntlUnregisteredTemplate ||
          FALLBACK_DEFAULT_INTL_UNREGISTERED_TEMPLATE;
        const effectiveIntlReg =
          tplData.effectiveIntlRegisteredTemplate ||
          tplData.defaultIntlRegisteredTemplate ||
          FALLBACK_DEFAULT_INTL_REGISTERED_TEMPLATE;

        setSavedBaseline({
          unregisteredImageUrl: effectiveImg,
          unregisteredTemplate: effectiveUnreg,
          registeredTemplate: effectiveReg,
          intlUnregisteredTemplate: effectiveIntlUnreg,
          intlRegisteredTemplate: effectiveIntlReg,
        });

        if (!templatesHydratedRef.current || opts.forceHydrateTemplates) {
          setUnregisteredImageUrl(effectiveImg);
          setUnregisteredTemplate(effectiveUnreg);
          setRegisteredTemplate(effectiveReg);
          setIntlUnregisteredTemplate(effectiveIntlUnreg);
          setIntlRegisteredTemplate(effectiveIntlReg);
          templatesHydratedRef.current = true;
        }
      } catch (err) {
        setErrorMsg(err.message || 'Erro ao carregar dados do WhatsApp.');
      } finally {
        setLoading(false);
      }
    },
    [search, filter]
  );

  useEffect(() => {
    setVisibleValidLimit(80);
    setVisibleInvalidLimit(80);
    loadOverview();
  }, [filter]);

  const handleSyncContacts = async () => {
    try {
      setSyncing(true);
      setErrorMsg('');
      const res = await syncAdminEvolutionContactsApi();
      showToast(
        `Sincronização concluída: ${res.syncedTotal} contatos (${res.validNameCount ?? 0} com nome próprio válido e ${res.invalidNameCount ?? 0} sem nome válido).`
      );
      await loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao sincronizar contatos da Evolution.');
    } finally {
      setSyncing(false);
    }
  };

  // Separação em Grupos: Com Nome Próprio Válido vs Sem Nome Válido + Elegibilidade p/ Seleção em Massa
  const selectedSet = useMemo(() => new Set(selectedContactIds), [selectedContactIds]);

  const { validNameContacts, invalidNameContacts, eligibleContactsInView, allEligibleSelected } = useMemo(() => {
    const all = overview.contacts || [];
    const valid = [];
    const invalid = [];
    const eligible = [];

    for (const c of all) {
      if (c.has_valid_name) {
        valid.push(c);
      } else {
        invalid.push(c);
      }
      if (c.is_allowed_by_safety_lock && !c.opt_out) {
        eligible.push(c);
      }
    }

    const everySelected =
      eligible.length > 0 && eligible.every((c) => selectedSet.has(c.id));

    return {
      validNameContacts: valid,
      invalidNameContacts: invalid,
      eligibleContactsInView: eligible,
      allEligibleSelected: everySelected,
    };
  }, [overview.contacts, selectedSet]);

  const handleToggleSelectContact = (id) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllEligibleInView = () => {
    if (eligibleContactsInView.length === 0) return;
    const eligibleIds = eligibleContactsInView.map((c) => c.id);
    setSelectedContactIds((prev) => Array.from(new Set([...prev, ...eligibleIds])));
  };

  const handleDeselectAllInView = () => {
    if (selectedContactIds.length === 0) return;
    setSelectedContactIds([]);
  };

  const handleToggleSelectAllMaster = () => {
    if (allEligibleSelected) {
      const viewIdsSet = new Set(eligibleContactsInView.map((c) => c.id));
      setSelectedContactIds((prev) => prev.filter((id) => !viewIdsSet.has(id)));
    } else {
      handleSelectAllEligibleInView();
    }
  };

  const handleSelectGroupEligible = (groupList) => {
    const ids = groupList
      .filter((c) => c.is_allowed_by_safety_lock && !c.opt_out)
      .map((c) => c.id);
    if (ids.length === 0) return;
    setSelectedContactIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  // Edição inline de nome na agenda (App + Evolution API)
  const handleStartEditContactName = (contact) => {
    setEditingContactId(contact.id);
    const currentRaw =
      contact.custom_name ||
      (contact.has_valid_name ? contact.display_name || contact.app_full_name || contact.push_name : '') ||
      '';
    setEditingNameValue(currentRaw);
  };

  const handleCancelEditContactName = () => {
    setEditingContactId(null);
    setEditingNameValue('');
  };

  const handleSaveContactName = async (contact) => {
    try {
      setSavingContactNameId(contact.id);
      setErrorMsg('');
      const res = await updateAdminWhatsappContactNameApi(contact.id, editingNameValue.trim());
      const updatedRow = res.contact;

      setOverview((prev) => {
        const wasValid = Boolean(contact.has_valid_name);
        const nowValid = Boolean(updatedRow?.has_valid_name);
        let nextValidTotal = prev.stats?.totalValidName || 0;
        let nextInvalidTotal = prev.stats?.totalInvalidName || 0;

        if (!wasValid && nowValid) {
          nextValidTotal += 1;
          nextInvalidTotal = Math.max(0, nextInvalidTotal - 1);
        } else if (wasValid && !nowValid) {
          nextValidTotal = Math.max(0, nextValidTotal - 1);
          nextInvalidTotal += 1;
        }

        const nextContacts = (prev.contacts || []).map((item) =>
          item.id === contact.id
            ? {
                ...item,
                ...updatedRow,
                display_name:
                  updatedRow.display_name ||
                  updatedRow.custom_name ||
                  updatedRow.app_full_name ||
                  updatedRow.push_name ||
                  '',
              }
            : item
        );

        return {
          ...prev,
          stats: {
            ...prev.stats,
            totalValidName: nextValidTotal,
            totalInvalidName: nextInvalidTotal,
          },
          contacts: nextContacts,
        };
      });

      setEditingContactId(null);
      setEditingNameValue('');

      if (updatedRow?.has_valid_name) {
        showToast(
          `Nome atualizado! O contato agora será tratado pelo 1º nome "${updatedRow.first_name_clean}" e salvo na agenda.`
        );
      } else {
        showToast('Nome personalizado removido/atualizado na agenda.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao salvar nome do contato.');
    } finally {
      setSavingContactNameId(null);
    }
  };

  const handleDirectSendFlow = async (contact, flowType) => {
    const phone = contact.phone_digits;
    const isIntl = Boolean(contact.is_international);
    const key = `${phone}:${flowType}`;

    const chosenTemplate =
      flowType === 'unregistered_invite_image'
        ? isIntl
          ? intlUnregisteredTemplate
          : unregisteredTemplate
        : isIntl
        ? intlRegisteredTemplate
        : registeredTemplate;

    try {
      setSendingPreviewKey(key);
      setErrorMsg('');
      const res = await sendAdminWhatsappOutreachPreviewApi({
        phone,
        flowType,
        customImageUrl: unregisteredImageUrl,
        customTemplate: chosenTemplate,
      });
      if (res.outcome === 'sent') {
        const langBadge = isIntl ? ' (em Inglês Britânico 🇬🇧)' : '';
        showToast(
          flowType === 'unregistered_invite_image'
            ? `Convite com Imagem do ISAAC${langBadge} enviado com sucesso para ${contact.formatted_phone || phone}!`
            : `Mensagem integrada de Planos${langBadge} enviada com sucesso para ${contact.formatted_phone || phone}!`
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

  const hasUnsavedTemplateChanges =
    unregisteredImageUrl !== savedBaseline.unregisteredImageUrl ||
    unregisteredTemplate !== savedBaseline.unregisteredTemplate ||
    registeredTemplate !== savedBaseline.registeredTemplate ||
    intlUnregisteredTemplate !== savedBaseline.intlUnregisteredTemplate ||
    intlRegisteredTemplate !== savedBaseline.intlRegisteredTemplate;

  const handleSaveTemplates = async () => {
    try {
      setSavingTemplates(true);
      setErrorMsg('');
      const updated = await saveAdminWhatsappOutreachTemplatesApi({
        unregisteredImageUrl: unregisteredImageUrl.trim() || 'https://isaac.lynxems.com.br/og-isaac-cover.jpg',
        unregisteredTemplate: unregisteredTemplate.trim(),
        registeredTemplate: registeredTemplate.trim(),
        intlUnregisteredTemplate: intlUnregisteredTemplate.trim(),
        intlRegisteredTemplate: intlRegisteredTemplate.trim(),
      });

      const nextImg = updated.unregisteredImageUrl || 'https://isaac.lynxems.com.br/og-isaac-cover.jpg';
      const nextUnreg = updated.effectiveUnregisteredTemplate || FALLBACK_DEFAULT_UNREGISTERED_TEMPLATE;
      const nextReg = updated.effectiveRegisteredTemplate || FALLBACK_DEFAULT_REGISTERED_TEMPLATE;
      const nextIntlUnreg =
        updated.effectiveIntlUnregisteredTemplate || FALLBACK_DEFAULT_INTL_UNREGISTERED_TEMPLATE;
      const nextIntlReg =
        updated.effectiveIntlRegisteredTemplate || FALLBACK_DEFAULT_INTL_REGISTERED_TEMPLATE;

      setUnregisteredImageUrl(nextImg);
      setUnregisteredTemplate(nextUnreg);
      setRegisteredTemplate(nextReg);
      setIntlUnregisteredTemplate(nextIntlUnreg);
      setIntlRegisteredTemplate(nextIntlReg);
      setSavedBaseline({
        unregisteredImageUrl: nextImg,
        unregisteredTemplate: nextUnreg,
        registeredTemplate: nextReg,
        intlUnregisteredTemplate: nextIntlUnreg,
        intlRegisteredTemplate: nextIntlReg,
      });
      setTemplatesSavedFlash(true);
      setTimeout(() => setTemplatesSavedFlash(false), 3500);
      showToast('Todos os 4 modelos de mensagem (PT-BR e Inglês Britânico) foram salvos com sucesso!');
      await loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao salvar modelos de mensagem.');
    } finally {
      setSavingTemplates(false);
    }
  };

  const handleRestoreDefaultTemplate = async (target = 'all') => {
    try {
      setSavingTemplates(true);
      setErrorMsg('');
      const updated = await saveAdminWhatsappOutreachTemplatesApi({ resetDefaults: target });
      const nextImg = updated.unregisteredImageUrl || 'https://isaac.lynxems.com.br/og-isaac-cover.jpg';
      const nextUnreg = updated.effectiveUnregisteredTemplate || FALLBACK_DEFAULT_UNREGISTERED_TEMPLATE;
      const nextReg = updated.effectiveRegisteredTemplate || FALLBACK_DEFAULT_REGISTERED_TEMPLATE;
      const nextIntlUnreg =
        updated.effectiveIntlUnregisteredTemplate || FALLBACK_DEFAULT_INTL_UNREGISTERED_TEMPLATE;
      const nextIntlReg =
        updated.effectiveIntlRegisteredTemplate || FALLBACK_DEFAULT_INTL_REGISTERED_TEMPLATE;

      if (target === 'all' || target === 'unregistered') {
        setUnregisteredImageUrl(nextImg);
        setUnregisteredTemplate(nextUnreg);
      }
      if (target === 'all' || target === 'registered') {
        setRegisteredTemplate(nextReg);
      }
      if (target === 'all' || target === 'intl_unregistered') {
        setIntlUnregisteredTemplate(nextIntlUnreg);
      }
      if (target === 'all' || target === 'intl_registered') {
        setIntlRegisteredTemplate(nextIntlReg);
      }

      setSavedBaseline({
        unregisteredImageUrl: nextImg,
        unregisteredTemplate: nextUnreg,
        registeredTemplate: nextReg,
        intlUnregisteredTemplate: nextIntlUnreg,
        intlRegisteredTemplate: nextIntlReg,
      });
      showToast('Modelo padrão original restaurado e salvo no servidor!');
      await loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao restaurar modelo padrão.');
    } finally {
      setSavingTemplates(false);
    }
  };

  const handleInsertVariable = (target, variableTag) => {
    const map = {
      unregistered: {
        ref: unregisteredTextareaRef.current,
        val: unregisteredTemplate,
        set: setUnregisteredTemplate,
      },
      registered: {
        ref: registeredTextareaRef.current,
        val: registeredTemplate,
        set: setRegisteredTemplate,
      },
      intl_unregistered: {
        ref: intlUnregisteredTextareaRef.current,
        val: intlUnregisteredTemplate,
        set: setIntlUnregisteredTemplate,
      },
      intl_registered: {
        ref: intlRegisteredTextareaRef.current,
        val: intlRegisteredTemplate,
        set: setIntlRegisteredTemplate,
      },
    };

    const entry = map[target];
    if (!entry) return;

    const { ref, val, set } = entry;
    if (ref && typeof ref.selectionStart === 'number') {
      const start = ref.selectionStart;
      const end = ref.selectionEnd;
      const nextVal = `${val.slice(0, start)}${variableTag}${val.slice(end)}`;
      set(nextVal);
      requestAnimationFrame(() => {
        ref.focus();
        const cursor = start + variableTag.length;
        ref.setSelectionRange(cursor, cursor);
      });
    } else {
      set(`${val}${val.endsWith(' ') || !val ? '' : ' '}${variableTag}`);
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

      if (hasUnsavedTemplateChanges) {
        await saveAdminWhatsappOutreachTemplatesApi({
          unregisteredImageUrl: unregisteredImageUrl.trim() || 'https://isaac.lynxems.com.br/og-isaac-cover.jpg',
          unregisteredTemplate: unregisteredTemplate.trim(),
          registeredTemplate: registeredTemplate.trim(),
          intlUnregisteredTemplate: intlUnregisteredTemplate.trim(),
          intlRegisteredTemplate: intlRegisteredTemplate.trim(),
        });
        setSavedBaseline({
          unregisteredImageUrl: unregisteredImageUrl.trim() || 'https://isaac.lynxems.com.br/og-isaac-cover.jpg',
          unregisteredTemplate: unregisteredTemplate.trim(),
          registeredTemplate: registeredTemplate.trim(),
          intlUnregisteredTemplate: intlUnregisteredTemplate.trim(),
          intlRegisteredTemplate: intlRegisteredTemplate.trim(),
        });
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
        intlUnregisteredTemplate,
        intlRegisteredTemplate,
      });

      showToast(
        `Campanha criada com sucesso! ${res.queuedCount} contato(s) enfileirado(s) com proteção Anti-Ban (PT-BR p/ Brasil e Inglês Britânico p/ Internacionais).`
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

  // Renderizador reutilizável de 1 linha de contato (usado nos 2 grupos: Com Nome Válido e Sem Nome Válido)
  const renderContactRow = (c) => {
    const isSelected = selectedSet.has(c.id);
    const canSend = c.is_allowed_by_safety_lock && !c.opt_out;
    const isEditing = editingContactId === c.id;
    const isSavingName = savingContactNameId === c.id;
    const info = formatContactPhoneBadge(c.phone_digits);
    const displayPhone = c.formatted_phone || info.formatted || c.phone_digits;
    const isIntl = c.is_international ?? info.isInternational;
    const countryLabel = c.country_flag
      ? `${c.country_flag} ${c.country_name || ''}`.trim()
      : info.badge;

    return (
      <div
        key={c.id}
        className={`p-3.5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition ${
          isSelected
            ? 'bg-emerald-50/80 dark:bg-emerald-950/35 border-emerald-400 dark:border-emerald-700'
            : c.is_allowed_by_safety_lock
            ? 'bg-emerald-50/30 dark:bg-emerald-950/15 border-emerald-300/70 dark:border-emerald-800/50'
            : 'bg-stone-50/80 dark:bg-slate-900/50 border-stone-200/80 dark:border-slate-800'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            disabled={!canSend}
            onChange={() => handleToggleSelectContact(c.id)}
            className="w-4 h-4 mt-1 sm:mt-0 accent-emerald-600 shrink-0 disabled:opacity-30 cursor-pointer"
          />

          {c.profile_pic_url ? (
            <img
              src={c.profile_pic_url}
              alt={c.display_name || c.phone_digits}
              className="w-9 h-9 rounded-full object-cover shrink-0 bg-stone-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div
              className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                c.has_valid_name
                  ? 'bg-teal-600/15 text-teal-700 dark:text-teal-300'
                  : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
              }`}
            >
              {(c.first_name_clean || c.display_name || 'W').slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1">
            {isEditing ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={editingNameValue}
                  onChange={(e) => setEditingNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveContactName(c);
                    } else if (e.key === 'Escape') {
                      handleCancelEditContactName();
                    }
                  }}
                  placeholder="Digite o nome próprio (ex: Thiago Prata)..."
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-500 text-xs text-stone-900 dark:text-white w-56 sm:w-64 outline-none"
                />
                <button
                  type="button"
                  disabled={isSavingName}
                  onClick={() => handleSaveContactName(c)}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingName ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  <span>Salvar na Agenda</span>
                </button>
                <button
                  type="button"
                  disabled={isSavingName}
                  onClick={handleCancelEditContactName}
                  className="px-2.5 py-1.5 rounded-xl bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-stone-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Cancelar</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-stone-900 dark:text-white truncate max-w-[230px]">
                  {c.display_name || c.push_name || 'Sem nome na Evolution'}
                </span>

                {c.has_valid_name && c.first_name_clean ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30">
                    👤 1º Nome: {c.first_name_clean}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/40">
                    ⚠️ Sem nome próprio válido
                  </span>
                )}

                {c.is_custom_name && (
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                    Agenda Editada
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleStartEditContactName(c)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                    c.has_valid_name
                      ? 'bg-stone-200/80 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-300'
                      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                  }`}
                  title="Editar o nome deste contato e salvar na agenda do App + Evolution API"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{c.has_valid_name ? 'Editar Nome' : 'Definir Nome'}</span>
                </button>

                {c.is_registered_user ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Cadastrado ({c.app_plan_id === 'whatsapp_monthly' ? 'Plano Pago' : 'Plano Grátis'})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200/70 dark:bg-slate-800 text-stone-600 dark:text-stone-300">
                    Não Cadastrado
                  </span>
                )}
              </div>
            )}

            <div className="text-[11px] text-stone-500 dark:text-stone-400 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="font-mono font-medium text-stone-700 dark:text-stone-300">
                📱 {displayPhone}
              </span>

              {isIntl ? (
                <>
                  {countryLabel && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                      {countryLabel}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                    🇬🇧 Inglês Britânico (EN-GB)
                  </span>
                </>
              ) : (
                <span className="text-[10px] text-stone-400">🇧🇷 Português (BR)</span>
              )}

              {c.app_email && <span>✉️ {c.app_email}</span>}
              {c.outreach_count > 0 && (
                <span className="text-teal-700 dark:text-teal-400 font-medium">
                  Envios: {c.outreach_count}
                </span>
              )}
              {c.opt_out && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                  Opt-Out (Parar)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AÇÕES RÁPIDAS NO CONTATO */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {c.is_allowed_by_safety_lock ? (
            <>
              {/* 1. OPÇÃO DE ENVIAR A PÁGINA DOS EBOOKS (ANTES DO CONVITE!) */}
              <button
                type="button"
                disabled={Boolean(sendingPreviewKey)}
                onClick={() => handleDirectSendEbookPage(c)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                title={
                  isIntl
                    ? 'Send Official Bilingual eBooks Page + Cover Image in British English'
                    : 'Enviar Página dos eBooks (Capa Oficial + Link Direto Asaas — Autor: Thiago Prata)'
                }
              >
                {sendingPreviewKey === `${c.phone_digits}:ebook_page` ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <BookOpen className="w-3.5 h-3.5" />
                )}
                <span>
                  {isIntl
                    ? (buildEbookWhatsappPayload(quickEbookSlug)?.shortLabelEn || 'eBooks Page') + ' (EN-GB)'
                    : buildEbookWhatsappPayload(quickEbookSlug)?.shortLabel || 'Página dos eBooks'}
                </span>
              </button>

              {/* 2. CONVITE COM IMAGEM DO APP ISAAC */}
              <button
                type="button"
                disabled={Boolean(sendingPreviewKey)}
                onClick={() => handleDirectSendFlow(c, 'unregistered_invite_image')}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                title={
                  isIntl
                    ? 'Enviar Convite com Imagem ISAAC em Inglês Britânico'
                    : 'Enviar Convite com Imagem Oficial do ISAAC em Português'
                }
              >
                {sendingPreviewKey === `${c.phone_digits}:unregistered_invite_image` ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5" />
                )}
                <span>{isIntl ? 'Send Invite (EN-GB)' : 'Convite c/ Imagem'}</span>
              </button>

              <button
                type="button"
                disabled={Boolean(sendingPreviewKey)}
                onClick={() => handleDirectSendFlow(c, 'registered_plans_integration')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                title={
                  isIntl
                    ? 'Enviar Mensagem de Planos em Inglês Britânico'
                    : 'Enviar Mensagem de Planos Grátis & Pago em Português'
                }
              >
                {sendingPreviewKey === `${c.phone_digits}:registered_plans_integration` ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isIntl ? 'Send Plans (EN-GB)' : 'Planos Grátis & Pago'}</span>
              </button>
            </>
          ) : (
            <span className="text-[11px] text-stone-400 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Protegido pela Trava ({overview.safety?.allowedPhonesRaw})
            </span>
          )}
        </div>
      </div>
    );
  };

  // Seção reutilizável dos 4 Modelos Editáveis (2 PT-BR + 2 Inglês Britânico)
  const renderTemplatesEditorSection = () => (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-serif font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
              <FileEdit className="w-4 h-4 text-emerald-600" />
              Modelos de Mensagem Editáveis — Brasil (PT-BR) &amp; Internacional (Inglês Britânico 🇬🇧)
            </h4>
            {hasUnsavedTemplateChanges ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Alterações não salvas
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Salvo no Servidor
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            Todos os contatos são tratados apenas pelo <strong>Primeiro Nome</strong> (<code className="font-mono">{'{nome}'}</code>). Se um contato não tiver nome próprio válido, a saudação fica limpa automaticamente (ex.: <em>&ldquo;Bom dia!&rdquo;</em> ou <em>&ldquo;Good morning!&rdquo;</em>). Números fora do Brasil (<code className="font-mono">!= +55</code>) recebem automaticamente o modelo em <strong>Inglês Britânico</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowLivePreview((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
              showLivePreview
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showLivePreview ? 'Ocultar Prévia' : 'Ver Prévia Real'}</span>
          </button>

          <button
            type="button"
            disabled={savingTemplates}
            onClick={() => handleRestoreDefaultTemplate('all')}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Restaurar os 4 modelos (PT-BR e Inglês Britânico) para o texto original"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Todos</span>
          </button>

          <button
            type="button"
            disabled={savingTemplates}
            onClick={handleSaveTemplates}
            className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
              templatesSavedFlash ? 'bg-teal-600 hover:bg-teal-700' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {savingTemplates ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : templatesSavedFlash ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>
              {savingTemplates
                ? 'Salvando...'
                : templatesSavedFlash
                ? 'Modelos Salvos!'
                : 'Salvar Modelos de Mensagem'}
            </span>
          </button>
        </div>
      </div>

      {/* SELETOR RÁPIDO DE CAMPANHA DE EBOOK DEDICADO (THIAGO PRATA) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-teal-50/60 to-stone-50 dark:from-slate-900 dark:via-teal-950/30 dark:to-slate-900 border border-amber-300/80 dark:border-amber-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Divulgar Página Dedicada de eBook — Autor: Thiago Prata (Mentoria ISAAC®)</span>
          </div>
          <p className="text-[11px] text-stone-600 dark:text-stone-300">
            Selecione abaixo qualquer eBook avulso (<strong>R$ 19,90</strong>) ou a Coleção Completa 30% OFF (<strong>R$ 111,44</strong>) para carregar automaticamente a <strong>capa de venda oficial</strong> e o <strong>link direto da página dedicada</strong> nos 4 modelos (PT-BR e EN-GB), enviando para contatos da Evolution e/ou usuários do App.
          </p>
        </div>

        <select
          value={selectedEbookPresetSlug}
          onChange={(e) => handleApplyEbookCampaignPreset(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-400 dark:border-amber-600 text-xs font-semibold text-stone-900 dark:text-white lg:w-96 shrink-0 cursor-pointer"
        >
          <option value="">📚 Escolher eBook ou Pacote p/ Carregar Link &amp; Capa...</option>
          <option value="loja-geral">
            🌐 Página Principal dos eBooks (/loja/ebooks • Avulsos R$ 19,90 + Pacote 30% OFF)
          </option>
          <option value="colecao-completa">
            🔥 Coleção Completa (PDF Único c/ 8 eBooks • 30% OFF = R$ 111,44)
          </option>
          {(ebookStoreCatalog.ebooks || []).map((eb) => (
            <option key={eb.slug} value={eb.slug}>
              📘 Vol. {String(eb.volumeNumber).padStart(2, '0')} — {eb.title} (R$ 19,90)
            </option>
          ))}
        </select>
      </div>

      {/* SELETOR DE IDIOMA DOS TEMPLATES + IMAGEM COMPARTILHADA DO CONVITE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-stone-100/80 dark:bg-slate-900/70 border border-stone-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'Todos os 4 Modelos (PT-BR + EN-GB)' },
            { id: 'pt', label: '🇧🇷 Português — Brasil (+55)' },
            { id: 'en', label: '🇬🇧 Inglês Britânico — Internacionais (+61, +44, +351, +1...)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTemplateLangFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                templateLangFilter === tab.id
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-slate-700 md:w-96">
          <img
            src={unregisteredImageUrl}
            alt="Capa ISAAC"
            className="w-12 h-8 object-cover rounded-md border border-stone-200 shrink-0"
            onError={(e) => {
              e.currentTarget.src = 'https://isaac.lynxems.com.br/og-isaac-cover.jpg';
            }}
          />
          <div className="flex-1 min-w-0">
            <span className="block text-[9px] uppercase font-bold text-stone-400">
              Imagem Oficial de Convite (BR &amp; Intl)
            </span>
            <input
              type="url"
              value={unregisteredImageUrl}
              onChange={(e) => setUnregisteredImageUrl(e.target.value)}
              className="w-full text-[11px] bg-transparent outline-none text-stone-700 dark:text-stone-200 truncate"
              placeholder="URL da imagem do ISAAC"
            />
          </div>
        </div>
      </div>

      {/* BLOCO 1: MODELOS EM PORTUGUÊS (BRASIL +55) */}
      {(templateLangFilter === 'all' || templateLangFilter === 'pt') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1A. BRASIL - NÃO CADASTRADOS */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                🇧🇷 1. Brasil (+55) — Não Cadastrados (Imagem + Convite)
              </span>
              <button
                type="button"
                disabled={savingTemplates}
                onClick={() => handleRestoreDefaultTemplate('unregistered')}
                className="text-[11px] font-medium text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Padrão BR
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                Inserir variável:
              </span>
              {[
                { tag: '{saudacao}', title: 'Bom dia / Boa tarde / Boa noite automático' },
                { tag: '{nome}', title: 'Primeiro nome próprio válido do contato' },
              ].map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  title={v.title}
                  onClick={() => handleInsertVariable('unregistered', v.tag)}
                  className="px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-500/30 text-[10px] font-mono font-semibold cursor-pointer"
                >
                  + {v.tag}
                </button>
              ))}
            </div>

            <textarea
              ref={unregisteredTextareaRef}
              rows={9}
              value={unregisteredTemplate}
              onChange={(e) => setUnregisteredTemplate(e.target.value)}
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 focus:border-amber-500 outline-none text-xs leading-relaxed text-stone-800 dark:text-stone-200"
            />

            {showLivePreview && (
              <div className="p-3 rounded-xl bg-emerald-950/90 text-emerald-50 text-[11px] whitespace-pre-wrap border border-emerald-700/50 space-y-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold mb-0.5">
                    Prévia BR (1º Nome = &ldquo;Thiago&rdquo;):
                  </div>
                  {renderLivePreviewText(unregisteredTemplate, { sampleName: 'Thiago Prata', isIntl: false })}
                </div>
                <div className="pt-2 border-t border-emerald-800/70 text-emerald-200/90">
                  <span className="text-[10px] uppercase font-bold text-amber-300">Se sem nome válido: </span>
                  {renderLivePreviewText(unregisteredTemplate, { sampleName: '', isIntl: false }).split('\n')[0]}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-stone-500">
                Usa apenas o <strong>1º nome</strong> em <code className="font-mono">{'{nome}'}</code>.
              </span>
              <button
                type="button"
                disabled={savingTemplates}
                onClick={handleSaveTemplates}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {savingTemplates ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                <span>Salvar Modelo</span>
              </button>
            </div>
          </div>

          {/* 1B. BRASIL - JÁ CADASTRADOS */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                🇧🇷 2. Brasil (+55) — Já Cadastrados (Planos Grátis &amp; Pago)
              </span>
              <button
                type="button"
                disabled={savingTemplates}
                onClick={() => handleRestoreDefaultTemplate('registered')}
                className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Padrão BR
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                Inserir variável:
              </span>
              {[
                { tag: '{saudacao}', title: 'Bom dia / Boa tarde / Boa noite automático' },
                { tag: '{nome}', title: 'Primeiro nome próprio válido do membro' },
                { tag: '{contexto}', title: 'Última sessão ou objetivo principal do usuário no App' },
              ].map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  title={v.title}
                  onClick={() => handleInsertVariable('registered', v.tag)}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-900 dark:text-emerald-200 border border-emerald-500/30 text-[10px] font-mono font-semibold cursor-pointer"
                >
                  + {v.tag}
                </button>
              ))}
            </div>

            <textarea
              ref={registeredTextareaRef}
              rows={9}
              value={registeredTemplate}
              onChange={(e) => setRegisteredTemplate(e.target.value)}
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 focus:border-emerald-500 outline-none text-xs leading-relaxed text-stone-800 dark:text-stone-200"
            />

            {showLivePreview && (
              <div className="p-3 rounded-xl bg-emerald-950/90 text-emerald-50 text-[11px] whitespace-pre-wrap border border-emerald-700/50">
                <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold mb-0.5">
                  Prévia BR (Membro Cadastrado — 1º Nome = &ldquo;Edson&rdquo;):
                </div>
                {renderLivePreviewText(registeredTemplate, {
                  sampleName: 'Edson Manoel',
                  sampleContext: 'Suas conversas seguem guardadas com todo sigilo esperando por você.',
                  isIntl: false,
                })}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-stone-500">
                Integra <code className="font-mono">{'{nome}'}</code> (1º nome) + <code className="font-mono">{'{contexto}'}</code>.
              </span>
              <button
                type="button"
                disabled={savingTemplates}
                onClick={handleSaveTemplates}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {savingTemplates ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                <span>Salvar Modelo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BLOCO 2: MODELOS EM INGLÊS BRITÂNICO (INTERNACIONAIS != +55) */}
      {(templateLangFilter === 'all' || templateLangFilter === 'en') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 2A. INTERNACIONAL - NÃO CADASTRADOS (BRITISH ENGLISH) */}
          <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                🇬🇧 3. Internacional (EN-GB) — Unregistered (Image + Invite)
              </span>
              <button
                type="button"
                disabled={savingTemplates}
                onClick={() => handleRestoreDefaultTemplate('intl_unregistered')}
                className="text-[11px] font-medium text-sky-800 dark:text-sky-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Default EN-GB
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                Inserir variável:
              </span>
              {[
                { tag: '{saudacao}', title: 'Good morning / Good afternoon / Good evening (fuso horário do país)' },
                { tag: '{nome}', title: 'First name only (if valid proper name)' },
              ].map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  title={v.title}
                  onClick={() => handleInsertVariable('intl_unregistered', v.tag)}
                  className="px-2 py-0.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-900 dark:text-sky-200 border border-sky-500/30 text-[10px] font-mono font-semibold cursor-pointer"
                >
                  + {v.tag}
                </button>
              ))}
            </div>

            <textarea
              ref={intlUnregisteredTextareaRef}
              rows={9}
              value={intlUnregisteredTemplate}
              onChange={(e) => setIntlUnregisteredTemplate(e.target.value)}
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 focus:border-sky-500 outline-none text-xs leading-relaxed text-stone-800 dark:text-stone-200"
            />

            {showLivePreview && (
              <div className="p-3 rounded-xl bg-slate-900 text-sky-50 text-[11px] whitespace-pre-wrap border border-sky-700/50 space-y-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-sky-300 font-bold mb-0.5">
                    Prévia Internacional EN-GB (1º Nome = &ldquo;Oliver&rdquo;):
                  </div>
                  {renderLivePreviewText(intlUnregisteredTemplate, { sampleName: 'Oliver Smith', isIntl: true })}
                </div>
                <div className="pt-2 border-t border-sky-800/70 text-sky-200/90">
                  <span className="text-[10px] uppercase font-bold text-amber-300">Se sem nome válido: </span>
                  {renderLivePreviewText(intlUnregisteredTemplate, { sampleName: '', isIntl: true }).split('\n')[0]}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-stone-500">
                Disparado automaticamente p/ números <code className="font-mono">+61</code>, <code className="font-mono">+44</code>, <code className="font-mono">+351</code>, <code className="font-mono">+1</code>, etc.
              </span>
              <button
                type="button"
                disabled={savingTemplates}
                onClick={handleSaveTemplates}
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {savingTemplates ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                <span>Salvar Modelo</span>
              </button>
            </div>
          </div>

          {/* 2B. INTERNACIONAL - JÁ CADASTRADOS (BRITISH ENGLISH) */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                🇬🇧 4. Internacional (EN-GB) — Registered Members (Plans)
              </span>
              <button
                type="button"
                disabled={savingTemplates}
                onClick={() => handleRestoreDefaultTemplate('intl_registered')}
                className="text-[11px] font-medium text-indigo-800 dark:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Default EN-GB
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                Inserir variável:
              </span>
              {[
                { tag: '{saudacao}', title: 'Good morning / Good afternoon / Good evening (fuso horário do país)' },
                { tag: '{nome}', title: 'First name only (if valid proper name)' },
                { tag: '{contexto}', title: 'Context note in British English from recent session' },
              ].map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  title={v.title}
                  onClick={() => handleInsertVariable('intl_registered', v.tag)}
                  className="px-2 py-0.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-900 dark:text-indigo-200 border border-indigo-500/30 text-[10px] font-mono font-semibold cursor-pointer"
                >
                  + {v.tag}
                </button>
              ))}
            </div>

            <textarea
              ref={intlRegisteredTextareaRef}
              rows={9}
              value={intlRegisteredTemplate}
              onChange={(e) => setIntlRegisteredTemplate(e.target.value)}
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 focus:border-indigo-500 outline-none text-xs leading-relaxed text-stone-800 dark:text-stone-200"
            />

            {showLivePreview && (
              <div className="p-3 rounded-xl bg-slate-900 text-indigo-50 text-[11px] whitespace-pre-wrap border border-indigo-700/50">
                <div className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold mb-0.5">
                  Prévia Internacional EN-GB (Registered — 1º Nome = &ldquo;Charlotte&rdquo;):
                </div>
                {renderLivePreviewText(intlRegisteredTemplate, {
                  sampleName: 'Charlotte Taylor',
                  sampleContext: 'Your conversations remain safely stored in complete confidence whenever you wish to continue.',
                  isIntl: true,
                })}
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-stone-500">
                Inglês Britânico (<em>personalised, judgement, free of charge</em>).
              </span>
              <button
                type="button"
                disabled={savingTemplates}
                onClick={handleSaveTemplates}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {savingTemplates ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                <span>Salvar Modelo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

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
                Anti-Ban Meta + 1º Nome + EN-GB Internacional
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
              Cadência humana ({minDelaySec}s–{maxDelaySec}s + digitação), saudação pelo <strong>Primeiro Nome</strong>, Inglês Britânico automático para números internacionais e teto de {overview.safety?.dailyLimit} envios/24h.
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
                Número(s) Autorizado(s) na Trava (Brasil ou Internacional)
              </label>
              <input
                type="text"
                value={safetyPhones}
                onChange={(e) => setSafetyPhones(e.target.value)}
                placeholder="Ex: 31995574906, 61434484212"
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-900 dark:text-white"
              />
              <span className="block text-[10px] text-stone-400 mt-0.5">
                Aceita DDD+número BR (31995574906) e internacionais E.164 (ex: Austrália 61434484212).
              </span>
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

      {/* CARDS DE MÉTRICAS DOS CONTATOS, GRUPOS DE NOMES E INTERNACIONAIS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div
          onClick={() => {
            setSubTab('contacts');
            setFilter('all');
          }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 cursor-pointer hover:border-teal-400 transition"
        >
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Total na Agenda</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 dark:text-white">
            {overview.stats?.totalContacts || 0}
          </div>
          <span className="text-[11px] text-stone-400">
            {overview.stats?.totalRegistered || 0} no App • {overview.stats?.totalUnregistered || 0} visitantes
          </span>
        </div>

        <div
          onClick={() => {
            setSubTab('contacts');
            setFilter('valid_name');
          }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-800/60 cursor-pointer hover:border-emerald-500 transition"
        >
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 mb-1 font-semibold">
            <span>Com Nome Válido</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-700 dark:text-emerald-400">
            {overview.stats?.totalValidName || 0}
          </div>
          <span className="text-[11px] text-stone-400">Tratados pelo 1º Nome</span>
        </div>

        <div
          onClick={() => {
            setSubTab('contacts');
            setFilter('invalid_name');
          }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-amber-200 dark:border-amber-800/60 cursor-pointer hover:border-amber-500 transition"
        >
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 mb-1 font-semibold">
            <span>Sem Nome Válido</span>
            <UserX className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-700 dark:text-amber-400">
            {overview.stats?.totalInvalidName || 0}
          </div>
          <span className="text-[11px] text-stone-400">Clique p/ revisar e editar</span>
        </div>

        <div
          onClick={() => {
            setSubTab('contacts');
            setFilter('international');
          }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-sky-200 dark:border-sky-800/60 cursor-pointer hover:border-sky-500 transition"
        >
          <div className="flex items-center justify-between text-xs text-sky-700 dark:text-sky-400 mb-1 font-semibold">
            <span>Internacionais 🇬🇧</span>
            <Globe className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-sky-700 dark:text-sky-400">
            {overview.stats?.totalInternational || 0}
          </div>
          <span className="text-[11px] text-stone-400">Envio em Inglês Britânico</span>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Envios 24h (Safe)</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 dark:text-white">
            {overview.stats?.sentLast24h || 0}
            <span className="text-xs font-normal text-stone-400"> / {overview.stats?.dailyLimit || 40}</span>
          </div>
          <span className="text-[11px] text-stone-400">
            Opt-outs: {overview.stats?.totalOptOut || 0}
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
          Lista de Contatos &amp; Grupos ({overview.filteredTotal || 0})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('templates')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'templates'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>Modelos de Mensagem (PT-BR &amp; EN-GB)</span>
          {hasUnsavedTemplateChanges && (
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" title="Alterações não salvas" />
          )}
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
          {selectedContactIds.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/25">
              {selectedContactIds.length}
            </span>
          )}
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
          Controle &amp; Auditoria ({overview.recentLogs?.length || 0})
        </button>
      </div>

      {/* ================================================================ */}
      {/* SUB-ABA 1: LISTA DE CONTATOS, GRUPOS DE NOMES E SELEÇÃO EM MASSA */}
      {/* ================================================================ */}
      {subTab === 'contacts' && (
        <div className="bg-white/90 dark:bg-slate-800/80 rounded-3xl border border-stone-200 dark:border-slate-700 p-5 space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: `Todos (${overview.stats?.totalContacts || 0})` },
                { id: 'valid_name', label: `✅ Com Nome Válido (${overview.stats?.totalValidName || 0})` },
                { id: 'invalid_name', label: `⚠️ Sem Nome Válido (${overview.stats?.totalInvalidName || 0})` },
                { id: 'international', label: `🇬🇧 Internacionais (${overview.stats?.totalInternational || 0})` },
                { id: 'brazil', label: '🇧🇷 Brasil (+55)' },
                { id: 'registered', label: `📱 Usuários do App (${overview.stats?.totalRegistered || 0})` },
                { id: 'unregistered', label: `💬 Contatos Evolution (${overview.stats?.totalUnregistered || 0})` },
                { id: 'allowed_only', label: 'Autorizado (Trava)' },
                { id: 'sent', label: 'Já Receberam Envio' },
                { id: 'opt_out', label: 'Opt-Out (Parar)' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    filter === f.id
                      ? 'bg-teal-700 text-white shadow-xs'
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
                setVisibleValidLimit(80);
                setVisibleInvalidLimit(80);
                loadOverview({ search });
              }}
              className="flex items-center gap-2 w-full xl:w-72 shrink-0"
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

          {/* SELETOR DIRETO DE QUAL PÁGINA DE EBOOKS ENVIAR AOS CONTATOS EVOLUTION (ANTES DO CONVITE) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-amber-50/60 to-teal-50/60 dark:from-indigo-950/35 dark:via-slate-900 dark:to-teal-950/30 border border-indigo-200 dark:border-indigo-800/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={
                  buildEbookWhatsappPayload(quickEbookSlug)?.coverImg ||
                  '/ebooks/covers/colecao-completa.jpg'
                }
                alt="Capa eBook"
                className="w-11 h-15 object-cover rounded-lg border border-indigo-300 dark:border-indigo-700 shadow-sm shrink-0"
              />
              <div className="min-w-0 space-y-0.5">
                <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex flex-wrap items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Enviar Página dos eBooks para Contatos da Evolution (Autor: Thiago Prata)</span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300">
                  Escolha abaixo qual página de eBooks o botão roxo <strong>&ldquo;{buildEbookWhatsappPayload(quickEbookSlug)?.shortLabel || 'Página dos eBooks'}&rdquo;</strong> (antes do Convite) enviará com capa + link direto:
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
              <select
                value={quickEbookSlug}
                onChange={(e) => setQuickEbookSlug(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 text-xs font-semibold text-stone-900 dark:text-white w-full sm:w-88 cursor-pointer"
              >
                <option value="loja-geral">
                  🌐 Página Geral dos eBooks (/loja/ebooks • Todos + Carrinho)
                </option>
                <option value="colecao-completa">
                  🔥 Coleção Completa 8 em 1 (/loja/ebooks/colecao-completa • R$ 111,44)
                </option>
                {(ebookStoreCatalog.ebooks || []).map((eb) => (
                  <option key={eb.slug} value={eb.slug}>
                    📘 Vol. {String(eb.volumeNumber).padStart(2, '0')} — {eb.title} (R$ 19,90)
                  </option>
                ))}
              </select>

              <a
                href={
                  buildEbookWhatsappPayload(quickEbookSlug)?.dedicatedUrl ||
                  '/loja/ebooks'
                }
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 hover:border-indigo-500 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 shrink-0"
                title="Abrir a página de eBooks selecionada em nova guia"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver Página</span>
              </a>
            </div>
          </div>

          {/* BARRA DE SELEÇÃO EM MASSA ("SELECIONAR TODOS" / "DESMARCAR TODOS") */}
          <div className="p-3.5 rounded-2xl bg-stone-100/90 dark:bg-slate-900/80 border border-stone-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={eligibleContactsInView.length === 0}
                onClick={handleToggleSelectAllMaster}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-600 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:border-emerald-500 transition flex items-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                {allEligibleSelected ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-stone-400" />
                )}
                <span>
                  {allEligibleSelected
                    ? `Desmarcar Todos deste Filtro (${eligibleContactsInView.length})`
                    : `Selecionar Todos Elegíveis (${eligibleContactsInView.length})`}
                </span>
              </button>

              {!allEligibleSelected && eligibleContactsInView.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllEligibleInView}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer"
                >
                  Marcar Todos ({eligibleContactsInView.length})
                </button>
              )}

              {selectedContactIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeselectAllInView}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-semibold cursor-pointer"
                >
                  Limpar Seleção ({selectedContactIds.length})
                </button>
              )}

              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                {overview.safety?.restrictedMode
                  ? `Trava ativa: ${eligibleContactsInView.length} contato(s) liberado(s) p/ seleção imediata.`
                  : `${eligibleContactsInView.length} contato(s) elegíveis neste filtro.`}
              </span>
            </div>

            {selectedContactIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  {selectedContactIds.length} selecionado(s)
                </span>
                {/* OPÇÃO ANTES DO CONVITE: ENVIAR A PÁGINA DOS EBOOKS EM LOTE P/ SELECIONADOS */}
                <button
                  type="button"
                  disabled={sendingBulkEbook}
                  onClick={handleBulkSendEbookPageToSelected}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {sendingBulkEbook ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <BookOpen className="w-3.5 h-3.5" />
                  )}
                  <span>
                    Enviar {buildEbookWhatsappPayload(quickEbookSlug)?.shortLabel || 'Página dos eBooks'} p/ Selecionados
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAudienceType('selected');
                    setSubTab('schedule');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Programar Convite / Envio →
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-stone-400">
              <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-teal-600" />
              <p className="text-xs">Carregando e classificando agenda de contatos do WhatsApp...</p>
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
            <div className="space-y-6">
              {/* GRUPO 1: CONTATOS COM NOME PRÓPRIO VÁLIDO */}
              {validNameContacts.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                        Grupo 1: Contatos com Nome Próprio Válido ({validNameContacts.length})
                      </h4>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        • Saudados automaticamente pelo <strong>Primeiro Nome</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectGroupEligible(validNameContacts)}
                      className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer"
                    >
                      Selecionar elegíveis deste grupo
                    </button>
                  </div>

                  <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1">
                    {validNameContacts.slice(0, visibleValidLimit).map(renderContactRow)}
                  </div>

                  {validNameContacts.length > visibleValidLimit && (
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => setVisibleValidLimit((prev) => prev + 150)}
                        className="px-4 py-1.5 rounded-xl bg-stone-100 dark:bg-slate-900 hover:bg-stone-200 dark:hover:bg-slate-700 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer"
                      >
                        Mostrar mais contatos com nome válido (exibindo {visibleValidLimit} de {validNameContacts.length})
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* GRUPO 2: CONTATOS SEM NOME PRÓPRIO VÁLIDO */}
              {invalidNameContacts.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800/60">
                    <div className="flex items-center gap-2">
                      <UserX className="w-4 h-4 text-amber-600" />
                      <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                        Grupo 2: Contatos Sem Nome Próprio Válido ({invalidNameContacts.length})
                      </h4>
                      <span className="text-[11px] text-amber-800 dark:text-amber-300">
                        • Clique em <strong>Definir Nome</strong> para salvar na agenda (App + Evolution) ou envie com saudação limpa
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectGroupEligible(invalidNameContacts)}
                      className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 hover:underline cursor-pointer"
                    >
                      Selecionar elegíveis deste grupo
                    </button>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
                    {invalidNameContacts.slice(0, visibleInvalidLimit).map(renderContactRow)}
                  </div>

                  {invalidNameContacts.length > visibleInvalidLimit && (
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => setVisibleInvalidLimit((prev) => prev + 150)}
                        className="px-4 py-1.5 rounded-xl bg-amber-100/70 dark:bg-slate-900 hover:bg-amber-200/70 text-xs font-semibold text-amber-900 dark:text-amber-300 cursor-pointer"
                      >
                        Mostrar mais contatos sem nome válido (exibindo {visibleInvalidLimit} de {invalidNameContacts.length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* SUB-ABA DEDICADA: MODELOS DE MENSAGEM (PT-BR & INGLÊS BRITÂNICO) */}
      {/* ================================================================ */}
      {subTab === 'templates' && (
        <div className="bg-white/90 dark:bg-slate-800/80 rounded-3xl border border-stone-200 dark:border-slate-700 p-6">
          {renderTemplatesEditorSection()}
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
              O motor seleciona automaticamente o modelo certo para cada pessoa: <strong>Português</strong> para números do Brasil (<code className="font-mono">+55</code>) e <strong>Inglês Britânico</strong> para números internacionais, sempre saudando pelo <strong>Primeiro Nome</strong>.
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
                <option value="mixed">Todos Elegíveis (Automático: BR PT-BR + Internacional EN-GB)</option>
                <option value="valid_name">Apenas Contatos com Nome Próprio Válido ({overview.stats?.totalValidName || 0})</option>
                <option value="international">Apenas Números Internacionais — Inglês Britânico ({overview.stats?.totalInternational || 0})</option>
                <option value="unregistered">Apenas Não Cadastrados no App (Imagem ISAAC + Convite)</option>
                <option value="registered">Apenas Já Cadastrados no App (Integração + Planos Grátis/Pago)</option>
                <option value="selected">Contatos Selecionados na Lista ({selectedContactIds.length})</option>
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

          <div className="pt-4 border-t border-stone-200/80 dark:border-slate-700/80">
            {renderTemplatesEditorSection()}
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
                  const isIntlLog = log.phone_digits && !String(log.phone_digits).startsWith('55');
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
                            (+{log.phone_digits})
                          </span>
                          {isIntlLog && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300">
                              🇬🇧 EN-GB
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.cls}`}>
                            {badge.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-200/70 dark:bg-slate-800 text-stone-700 dark:text-stone-300">
                            {String(log.media_url || '').includes('/ebooks/covers/')
                              ? '📘 Capa + Página dos eBooks'
                              : log.flow_type === 'unregistered_invite_image'
                              ? '🖼️ Imagem ISAAC + Convite'
                              : '🤝 Integração + Planos'}
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
