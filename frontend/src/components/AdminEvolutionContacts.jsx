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
  Smartphone,
  Sun,
  Moon,
  Wifi,
  Battery,
} from 'lucide-react';
import {
  fetchAdminWhatsappOutreachOverview,
  syncAdminEvolutionContactsApi,
  createAdminWhatsappCampaignApi,
  controlAdminWhatsappCampaignApi,
  updateAdminWhatsappCampaignSettingsApi,
  triggerAdminWhatsappProcessNowApi,
  sendAdminWhatsappOutreachPreviewApi,
  updateAdminWhatsappSafetyApi,
  saveAdminWhatsappOutreachTemplatesApi,
  updateAdminWhatsappContactNameApi,
} from '../services/adminApi';
import { fetchPublicEbooksStore } from '../services/ebookStoreApi';
import { formatContactPhoneBadge } from '../utils/phoneUtils';
import { formatBrazilTime, formatBrazilDateTime } from '../utils/dateTimeBrazil';

const OFFICIAL_INVITE_IMAGE_OPTIONS = [
  {
    id: 'og-cover',
    shortTitle: 'Capa Ouro & Obsidiana',
    subtitle: 'Imagem original da Plataforma',
    previewSrc: '/og-isaac-cover.jpg',
    url: 'https://isaac.lynxems.com.br/og-isaac-cover.jpg',
  },
  {
    id: 'isaac-black',
    shortTitle: 'ISAAC Fundo Preto & Pilares',
    subtitle: 'Inovação • Sustentabilidade • Amor • Atitude • Competências',
    previewSrc: '/invite-isaac-black.jpg',
    url: 'https://isaac.lynxems.com.br/invite-isaac-black.jpg',
  },
  {
    id: 'isaac-white',
    shortTitle: 'ISAAC Fundo Branco & Pilares',
    subtitle: 'Inovação • Sustentabilidade • Amor • Atitude • Competências',
    previewSrc: '/invite-isaac-white.jpg',
    url: 'https://isaac.lynxems.com.br/invite-isaac-white.jpg',
  },
  {
    id: 'isaac-mint',
    shortTitle: 'ISAAC Fundo Verde Menta',
    subtitle: 'Estrela minimalista fundo menta',
    previewSrc: '/invite-isaac-mint.jpg',
    url: 'https://isaac.lynxems.com.br/invite-isaac-mint.jpg',
  },
];

function resolveInviteImagePreviewSrc(rawUrl) {
  const clean = String(rawUrl || '').split('#')[0].trim();
  const matched = OFFICIAL_INVITE_IMAGE_OPTIONS.find(
    (opt) => clean === opt.url || clean.endsWith(opt.previewSrc)
  );
  if (matched) return matched.previewSrc;
  return clean || '/og-isaac-cover.jpg';
}

function formatWhatsAppInlineTokens(lineText, isDarkTheme) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const segments = String(lineText || '').split(urlRegex);
  const linkCls = isDarkTheme ? 'text-[#53bdeb] underline break-all' : 'text-[#027eb5] underline break-all';

  const renderStyledSpan = (chunk, baseKey) => {
    const tokenRegex = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;
    const parts = chunk.split(tokenRegex);
    return parts.map((part, idx) => {
      const k = `${baseKey}-${idx}`;
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <strong key={k} className="font-bold">
            {part.slice(1, -1)}
          </strong>
        );
      }
      if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
        return (
          <em key={k} className="italic opacity-95">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('~') && part.endsWith('~') && part.length > 2) {
        return (
          <del key={k} className="line-through opacity-80">
            {part.slice(1, -1)}
          </del>
        );
      }
      return <React.Fragment key={k}>{part}</React.Fragment>;
    });
  };

  return segments.map((seg, i) => {
    if (/^https?:\/\/[^\s]+$/.test(seg)) {
      return (
        <a
          key={`url-${i}`}
          href={seg}
          target="_blank"
          rel="noopener noreferrer"
          className={linkCls}
        >
          {seg}
        </a>
      );
    }
    return <React.Fragment key={`txt-${i}`}>{renderStyledSpan(seg, `seg-${i}`)}</React.Fragment>;
  });
}

const FALLBACK_DEFAULT_UNREGISTERED_TEMPLATE = `{saudacao}, {nome}! Tudo bem com você?

Quero te apresentar uma ferramenta maravilhosa de clareza mental e desenvolvimento pessoal: a *Plataforma ISAAC*.

O ISAAC é um mentor confidencial, disponível 24h em texto e voz, criado para ouvir sem julgamentos, ajudar a desatar bloqueios emocionais e trazer direção para as suas decisões.

O acesso completo pelo App Web é *100% gratuito*. Venha conhecer e experimentar agora:
https://isaac.lynxems.com.br/

_(Se não desejar receber convites por aqui, basta responder "parar".)_`;

const FALLBACK_DEFAULT_REGISTERED_TEMPLATE = `{saudacao}, {nome}! Que alegria ter você na *Plataforma ISAAC*. {contexto}

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

👉 Acesse a plataforma ou veja os detalhes dos planos aqui:
https://isaac.lynxems.com.br/#planos

_(Se preferir não receber comunicados no WhatsApp, basta responder "parar".)_`;

const FALLBACK_DEFAULT_INTL_UNREGISTERED_TEMPLATE = `{saudacao}, {nome}! How are you doing?

I would love to introduce you to a wonderful tool for mental clarity and personal growth: the *ISAAC Platform*.

ISAAC is a confidential mentor available 24/7 by text and voice, created to listen without judgement, help untangle emotional blocks, and bring clear direction to your decisions.

Full access via the Web App is *100% free of charge*. Come and experience your personalised space for reflection right now:
https://isaac.lynxems.com.br/

_(If you would rather not receive invitations here, simply reply "stop".)_`;

const FALLBACK_DEFAULT_INTL_REGISTERED_TEMPLATE = `{saudacao}, {nome}! It is a pleasure to have you with us on the *ISAAC Platform*. {contexto}

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

👉 Access the platform or view plan details here:
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
    .replace(/\{([^{}|]+\|[^{}]+)\}/g, (_, group) => group.split('|')[0].trim())
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
  const [campTitle, setCampTitle] = useState('Campanha Controlada Plataforma ISAAC');
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
  const [showPhoneVisualizerModal, setShowPhoneVisualizerModal] = useState(false);
  const [visualizerFlowKey, setVisualizerFlowKey] = useState('pt_unregistered'); // 'pt_unregistered' | 'pt_registered' | 'en_unregistered' | 'en_registered'
  const [visualizerSampleName, setVisualizerSampleName] = useState('Thiago Prata');
  const [visualizerHasValidName, setVisualizerHasValidName] = useState(true);
  const [visualizerDarkTheme, setVisualizerDarkTheme] = useState(true);
  const [visualizerRecipientPhone, setVisualizerRecipientPhone] = useState('+55 (31) 99557-4906');
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
  const [showBulkEbookShieldModal, setShowBulkEbookShieldModal] = useState(false);
  const [ebookLinkMode, setEbookLinkMode] = useState('single_clean_link'); // 'single_clean_link' | 'two_step_shield'
  const [ebookSafeDailyLimit, setEbookSafeDailyLimit] = useState(30);

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
        const storeUrl = `${baseOrigin}/biblioteca`;
        const coverImg = `${baseOrigin}/ebooks/covers/colecao-completa.jpg`;
        return {
          slug: 'loja-geral',
          shortLabel: 'Página dos eBooks',
          shortLabelEn: 'eBooks Library',
          campaignTitle: 'Biblioteca Bilíngue ISAAC® Essential — Thiago Prata',
          coverImg,
          dedicatedUrl: storeUrl,
          twoStepPtMsg: `{saudacao}, {nome}! {Tudo bem com você?|Como você está?|Espero que esteja tudo em paz por aí.}

{Passando com carinho para compartilhar uma novidade muito especial|Queria dividir em primeira mão um projeto editorial muito bonito}: o mentor *Thiago Prata* (criador da Plataforma *ISAAC®*) acaba de lançar a *Biblioteca Oficial de eBooks ISAAC® Essential*, com *8 leituras práticas em edição Bilíngue (Português + Inglês Britânico no mesmo PDF)* e dedicatória nominal personalizada.

{Posso te enviar o acesso da página por aqui para você ver as capas com calma?|Posso te mandar o link da biblioteca aqui no WhatsApp para você conhecer os temas?} Basta me responder um *"sim"* ou 👍!

_(Se preferir não receber convites por aqui, basta responder "parar".)_`,
          twoStepEnMsg: `{saudacao}, {nome}! {How are you doing?|Hope all is well with you.|Wishing you a peaceful week.}

{I wanted to share a special new project with you|Passing by briefly to share wonderful news}: mentor *Thiago Prata* (Creator of the *ISAAC® Platform*) has just published the *Official ISAAC® Essential Bilingual Library* — featuring *8 practical volumes in Portuguese and British English within the same PDF*, complete with a personalised dedication in your name.

{May I share the library link here so you can browse the covers at your own pace?|Would you like me to send the page link right here?} Simply reply *"yes"* or 👍!

_(If you prefer not to receive updates here, simply reply "stop".)_`,
          ptMsg: `{saudacao}, {nome}! {Segue o link da página oficial|Deixo aqui o acesso direto|Compartilho com você o link oficial} dos *eBooks ISAAC® Essential* (por *Thiago Prata*) para você {ver com calma|conhecer todas as edições}:
${storeUrl}

_(Se preferir não receber novidades por aqui, basta responder "parar".)_`,
          enMsg: `{saudacao}, {nome}! {Here is the official page link|Sharing the direct access link|Here is the link} to the *ISAAC® Essential Bilingual eBooks* (by *Thiago Prata*) so you can {take a look at your own pace|browse the editions whenever you wish}:
${storeUrl}

_(If you prefer not to receive updates here, simply reply "stop".)_`,
        };
      }

      if (cleanSlug === 'colecao-completa') {
        const bundleUrl = `${baseOrigin}/biblioteca/colecao-completa`;
        const coverImg = `${baseOrigin}/ebooks/covers/colecao-completa.jpg`;
        return {
          slug: 'colecao-completa',
          shortLabel: 'Coleção Completa (8 eBooks)',
          shortLabelEn: 'Complete 8-Book Collection',
          campaignTitle: 'Coleção Completa 8 eBooks ISAAC® Essential — Thiago Prata',
          coverImg,
          dedicatedUrl: bundleUrl,
          twoStepPtMsg: `{saudacao}, {nome}! {Tudo bem com você?|Como você está?|Espero que esteja tudo bem com você.}

{Queria dividir uma novidade especial com você|Passando para compartilhar um lançamento muito querido}: o mentor *Thiago Prata* (criador do *ISAAC®*) reuniu os *8 livros da Série ISAAC® Essential em um Único PDF Mestre Bilíngue (Português + Inglês Britânico)*, ilustrado e com dedicatória personalizada com o seu nome.

{Posso te mandar o link da página oficial por aqui para você conhecer?|Quer que eu te envie o acesso aqui para ver os detalhes dos 8 volumes?} É só me responder *"sim"* ou 👍!

_(Se preferir não receber novidades por aqui, responda "parar".)_`,
          twoStepEnMsg: `{saudacao}, {nome}! {How are you doing?|Hope you are having a lovely week.|Hope all is well with you.}

{I wanted to share a special release with you|Sharing wonderful news from the ISAAC® Platform}: mentor *Thiago Prata* has brought together all *8 volumes of the ISAAC® Essential Series into one Master Bilingual PDF (Portuguese + British English)*, illustrated and featuring a personal dedication in your name.

{May I send you the official page link here so you can take a look?|Would you like me to share the collection page right here?} Simply reply *"yes"* or 👍!

_(If you prefer not to receive updates here, simply reply "stop".)_`,
          ptMsg: `{saudacao}, {nome}! {Segue o link da página oficial|Deixo aqui o acesso direto|Compartilho com você o link} da *Coleção Completa ISAAC® Essential — 8 eBooks em PDF Único* (por *Thiago Prata*) para você {ver com calma|conhecer os detalhes}:
${bundleUrl}

_(Se preferir não receber novidades por aqui, basta responder "parar".)_`,
          enMsg: `{saudacao}, {nome}! {Here is the official page link|Sharing the direct link} to the *Complete ISAAC® Essential 8-in-1 Bilingual Collection* (by *Thiago Prata*) so you can {take a look at your own pace|explore it whenever you wish}:
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
      const dedicatedUrl = `${baseOrigin}/biblioteca/${book.slug}`;
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
        twoStepPtMsg: `{saudacao}, {nome}! {Tudo bem com você?|Como você está?|Espero que esteja tudo em paz.}

{Lembrei de compartilhar com você|Queria te contar sobre} a nova leitura do mentor *Thiago Prata* (Série *ISAAC® Essential* — Vol. ${volNum}): *"${book.title}"*, em edição *Bilíngue (Português + Inglês Britânico no mesmo PDF)* com dedicatória nominal exclusiva.

{Posso te mandar o link da página deste livro aqui para você ver a capa e os capítulos?|Quer que eu te envie o acesso por aqui para conhecer?} Só responder *"sim"* ou 👍!

_(Se preferir não receber comunicados no WhatsApp, responda "parar".)_`,
        twoStepEnMsg: `{saudacao}, {nome}! {How are you doing?|Hope all is well with you.}

{I thought of sharing with you|Wanted to let you know about} Volume ${volNum} of the *ISAAC® Essential Series* by mentor *Thiago Prata*: *"${enTitle}"*, published as a *Bilingual Single PDF (Portuguese + British English)* with a personal dedication in your name.

{May I send you the page link here so you can see the cover and chapters?|Would you like me to share the link right here?} Simply reply *"yes"* or 👍!

_(If you prefer not to receive updates on WhatsApp, simply reply "stop".)_`,
        ptMsg: `{saudacao}, {nome}! {Segue o link da página oficial|Deixo aqui o acesso direto} do *eBook Vol. ${volNum} — ${book.title}* (Série *ISAAC® Essential*, por *Thiago Prata*) para você {ver com calma|conhecer a edição}:
${dedicatedUrl}

_(Se preferir não receber comunicados no WhatsApp, responda "parar".)_`,
        enMsg: `{saudacao}, {nome}! {Here is the official page link|Sharing the direct link} for *eBook Vol. ${volNum} — ${enTitle}* (*ISAAC® Essential Series*, by *Thiago Prata*) so you can {take a look at your own pace|see the details whenever you wish}:
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
    setCampTitle(`📘 ${payload.campaignTitle}`);
    setUnregisteredTemplate(payload.ptMsg);
    setRegisteredTemplate(payload.ptMsg);
    setIntlUnregisteredTemplate(payload.enMsg);
    setIntlRegisteredTemplate(payload.enMsg);
    setMinDelaySec(52);
    setMaxDelaySec(118);
    setDailyLimit(Math.min(overview.safety?.dailyLimit || 40, 30));
    setRespectWindow(true);
    showToast(`${payload.campaignTitle} carregada em Mensagem Única Enxuta + Link Protegido c/ Preview!`);
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
          `Mensagem única enxuta (${payload.shortLabel})${langBadge} enviada com link e card de capa para ${
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

  const handleOpenBulkEbookShieldModal = () => {
    if (selectedContactIds.length === 0 || sendingBulkEbook) return;
    setEbookLinkMode('single_clean_link');
    setEbookSafeDailyLimit(Math.min(overview.safety?.dailyLimit || 40, 30));
    setShowBulkEbookShieldModal(true);
  };

  const handleConfirmBulkSendEbookPage = async () => {
    if (selectedContactIds.length === 0 || sendingBulkEbook) return;
    const payload = buildEbookWhatsappPayload(quickEbookSlug) || buildEbookWhatsappPayload('loja-geral');
    const isShieldMode = ebookLinkMode === 'two_step_shield';
    const safeCap = Math.max(5, Math.min(overview.safety?.dailyLimit || 40, Number(ebookSafeDailyLimit) || 30));

    try {
      setSendingBulkEbook(true);
      setErrorMsg('');
      const res = await createAdminWhatsappCampaignApi({
        title: isShieldMode
          ? `🛡️ [2 Etapas] ${payload.campaignTitle}`
          : `📘 [Mensagem Única] ${payload.campaignTitle}`,
        audienceType: 'selected',
        contactIds: selectedContactIds,
        scheduledAt: new Date().toISOString(),
        minDelaySec: 52,
        maxDelaySec: 118,
        dailyLimit: safeCap,
        windowStartHhmm: windowStart || '08:30',
        windowEndHhmm: windowEnd || '20:00',
        respectWindow: true,
        forceFlowType: 'unregistered_invite_image',
        unregisteredImageUrl: isShieldMode
          ? `${payload.coverImg}#shield=${payload.slug}`
          : payload.coverImg,
        unregisteredTemplate: isShieldMode ? payload.twoStepPtMsg : payload.ptMsg,
        registeredTemplate: isShieldMode ? payload.twoStepPtMsg : payload.ptMsg,
        intlUnregisteredTemplate: isShieldMode ? payload.twoStepEnMsg : payload.enMsg,
        intlRegisteredTemplate: isShieldMode ? payload.twoStepEnMsg : payload.enMsg,
      });

      setShowBulkEbookShieldModal(false);
      showToast(
        isShieldMode
          ? `🛡️ Fila iniciada! ${res.queuedCount} contato(s) protegidos (Etapa 1 sem link → Mensagem única c/ link entregue na resposta).`
          : `📘 Fila de Mensagem Única iniciada! ${res.queuedCount} contato(s) receberão apenas o balão enxuto com Saudação + Link Oficial c/ Card.`
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

  // Piloto Automático no Servidor (24/7) — ajuste em tempo real da campanha ativa sem precisar recriar
  const [autopilotDailyLimit, setAutopilotDailyLimit] = useState(30);
  const [autopilotMinDelay, setAutopilotMinDelay] = useState(52);
  const [autopilotMaxDelay, setAutopilotMaxDelay] = useState(118);
  const [savingAutopilot, setSavingAutopilot] = useState(false);
  const [triggeringTickNow, setTriggeringTickNow] = useState(false);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(20);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState('');
  const autopilotHydratedIdRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 5000);
  };

  const loadOverview = useCallback(
    async (opts = {}) => {
      try {
        if (opts.silent) {
          setIsAutoRefreshing(true);
        } else {
          setErrorMsg('');
        }
        const data = await fetchAdminWhatsappOutreachOverview({
          search: opts.search !== undefined ? opts.search : search,
          filter: opts.filter !== undefined ? opts.filter : filter,
          limit: 2500,
        });
        setOverview(data);
        setLastSyncedAt(
          formatBrazilTime(new Date(), {
            second: '2-digit',
          })
        );
        setAutoRefreshCountdown(20);
        setSafetyRestricted(Boolean(data.safety?.restrictedMode));
        setSafetyPhones(data.safety?.allowedPhonesRaw || '31995574906');
        setSafetyDailyLimit(data.safety?.dailyLimit || 40);
        setSafetyCooldownHours(data.safety?.cooldownHours ?? 72);
        setDailyLimit(data.safety?.dailyLimit || 40);

        const activeCamp = data.serverAutopilot?.activeCampaign;
        if (activeCamp && (autopilotHydratedIdRef.current !== activeCamp.id || opts.forceHydrateAutopilot)) {
          autopilotHydratedIdRef.current = activeCamp.id;
          setAutopilotDailyLimit(Number(activeCamp.daily_limit) || 30);
          setAutopilotMinDelay(Number(activeCamp.min_delay_sec) || 52);
          setAutopilotMaxDelay(Number(activeCamp.max_delay_sec) || 118);
        }

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
        if (!opts.silent) {
          setErrorMsg(err.message || 'Erro ao carregar dados do WhatsApp.');
        }
      } finally {
        setLoading(false);
        setIsAutoRefreshing(false);
      }
    },
    [search, filter]
  );

  useEffect(() => {
    setVisibleValidLimit(80);
    setVisibleInvalidLimit(80);
    loadOverview();
  }, [filter]);

  // Atualização automática da tela a cada 20 segundos enquanto o SuperAdmin estiver com a página aberta
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoRefreshCountdown((prev) => {
        if (prev <= 1) {
          loadOverview({ silent: true });
          return 20;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loadOverview]);

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

  const handleSelectOfficialInviteImage = async (optionUrl, autoSave = false) => {
    setUnregisteredImageUrl(optionUrl);
    setSelectedEbookPresetSlug('');
    if (!autoSave) return;

    try {
      setSavingTemplates(true);
      setErrorMsg('');
      const updated = await saveAdminWhatsappOutreachTemplatesApi({
        unregisteredImageUrl: optionUrl,
        unregisteredTemplate: unregisteredTemplate.trim(),
        registeredTemplate: registeredTemplate.trim(),
        intlUnregisteredTemplate: intlUnregisteredTemplate.trim(),
        intlRegisteredTemplate: intlRegisteredTemplate.trim(),
      });
      const nextImg = updated.unregisteredImageUrl || optionUrl;
      setUnregisteredImageUrl(nextImg);
      setSavedBaseline((prev) => ({
        ...prev,
        unregisteredImageUrl: nextImg,
      }));
      const opt = OFFICIAL_INVITE_IMAGE_OPTIONS.find((item) => item.url === optionUrl);
      showToast(`Imagem oficial de convite selecionada e salva: "${opt?.shortTitle || 'Capa ISAAC'}"!`);
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao salvar a imagem de convite selecionada.');
    } finally {
      setSavingTemplates(false);
    }
  };

  const handleOpenPhoneVisualizerForContact = (contact = null) => {
    if (contact) {
      const info = formatContactPhoneBadge(contact.phone_digits);
      const isIntl = Boolean(contact.is_international ?? info.isInternational);
      const hasValid = Boolean(contact.has_valid_name);
      const candidateName =
        contact.first_name_clean ||
        contact.display_name ||
        contact.app_full_name ||
        contact.push_name ||
        'Thiago Prata';
      setVisualizerSampleName(hasValid ? candidateName : 'Sem nome válido');
      setVisualizerHasValidName(hasValid);
      setVisualizerRecipientPhone(contact.formatted_phone || info.formatted || `+${contact.phone_digits}`);
      if (contact.is_registered_user) {
        setVisualizerFlowKey(isIntl ? 'en_registered' : 'pt_registered');
      } else {
        setVisualizerFlowKey(isIntl ? 'en_unregistered' : 'pt_unregistered');
      }
    }
    setShowPhoneVisualizerModal(true);
  };

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
      if (action === 'cancel' || action === 'stop') {
        const ok = window.confirm(
          'Deseja realmente PARAR definitivamente o envio desta campanha no servidor? Os contatos que ainda estavam aguardando nesta fila serão encerrados.'
        );
        if (!ok) return;
      }
      await controlAdminWhatsappCampaignApi(campaignId, action === 'stop' ? 'cancel' : action);
      showToast(
        action === 'resume'
          ? '🟢 Piloto Automático no Servidor ativado! Você já pode fechar o aplicativo que o servidor continuará enviando sozinho.'
          : action === 'pause'
          ? '⏸️ Envio no servidor pausado temporariamente (você pode retomar quando quiser).'
          : action === 'cancel' || action === 'stop'
          ? '🛑 Piloto Automático PARADO no servidor e fila encerrada com sucesso!'
          : `Campanha atualizada (${action}).`
      );
      await loadOverview({ forceHydrateAutopilot: true });
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleSaveAutopilotSettings = async (campaignId) => {
    if (!campaignId) return;
    try {
      setSavingAutopilot(true);
      setErrorMsg('');
      await updateAdminWhatsappCampaignSettingsApi(campaignId, {
        dailyLimit: Number(autopilotDailyLimit) || 30,
        minDelaySec: Number(autopilotMinDelay) || 52,
        maxDelaySec: Number(autopilotMaxDelay) || 118,
        status: 'running',
      });
      showToast(
        `🟢 Piloto Automático atualizado no Servidor (${autopilotDailyLimit}/dia • intervalo ${autopilotMinDelay}s–${autopilotMaxDelay}s)! Você pode fechar o App tranquilo.`
      );
      await loadOverview({ forceHydrateAutopilot: true });
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao salvar ajustes no servidor.');
    } finally {
      setSavingAutopilot(false);
    }
  };

  const handleTriggerServerTickNow = async () => {
    try {
      setTriggeringTickNow(true);
      setErrorMsg('');
      const res = await triggerAdminWhatsappProcessNowApi(true);
      if (res?.processed > 0) {
        showToast('⚡ Servidor disparou o próximo contato da fila com sucesso!');
      } else if (res?.skipped === 'daily_limit_reached') {
        showToast('⏳ Cota diária de 24h atingida. Aumente o Limite Diário ao lado e clique em Salvar p/ enviar mais hoje!');
      } else {
        showToast('🔄 Ciclo do servidor verificado.');
      }
      await loadOverview();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao acionar ciclo imediato no servidor.');
    } finally {
      setTriggeringTickNow(false);
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
          <button
            type="button"
            onClick={() => handleOpenPhoneVisualizerForContact(c)}
            className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-200 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
            title="Visualizar exatamente como a mensagem + imagem vai aparecer no celular deste contato"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ver no Celular</span>
          </button>

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

  // Simulador Realista de Tela do WhatsApp no Celular do Destinatário
  const renderSmartphoneWhatsAppVisualizer = ({ inModal = false } = {}) => {
    const isIntlSim = visualizerFlowKey.startsWith('en_');
    const isInviteWithImage =
      visualizerFlowKey === 'pt_unregistered' ||
      visualizerFlowKey === 'en_unregistered' ||
      String(unregisteredImageUrl || '').includes('/ebooks/covers/');

    const rawActiveTemplate =
      visualizerFlowKey === 'pt_unregistered'
        ? unregisteredTemplate
        : visualizerFlowKey === 'pt_registered'
        ? registeredTemplate
        : visualizerFlowKey === 'en_unregistered'
        ? intlUnregisteredTemplate
        : intlRegisteredTemplate;

    const sampleContextText = isIntlSim
      ? 'Your conversations remain safely stored in complete confidence whenever you wish to continue.'
      : 'Suas conversas seguem guardadas com todo sigilo esperando por você.';

    const finalPreviewMessage = renderLivePreviewText(rawActiveTemplate, {
      sampleName: visualizerHasValidName ? visualizerSampleName : '',
      sampleContext:
        visualizerFlowKey === 'pt_registered' || visualizerFlowKey === 'en_registered'
          ? sampleContextText
          : '',
      isIntl: isIntlSim,
    });

    const previewImgSrc = resolveInviteImagePreviewSrc(unregisteredImageUrl);
    const nowTimeStr = formatBrazilTime(new Date(), { hour: '2-digit', minute: '2-digit' }) || '14:32';
    const lines = finalPreviewMessage.split('\n');

    return (
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-stone-100 via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900/95 dark:to-emerald-950/20 border border-emerald-300/70 dark:border-emerald-800/60 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-stone-200/80 dark:border-slate-800 pb-3.5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
                <Smartphone className="w-3 h-3" />
                <span>Simulador Realista WhatsApp</span>
              </span>
              <h4 className="text-sm sm:text-base font-serif font-bold text-stone-900 dark:text-white">
                Como a mensagem aparece no celular de quem vai receber
              </h4>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Escolha abaixo qual das <strong>4 imagens de convite</strong> enviar junto com o texto e veja em tempo real o balão do WhatsApp formatado exatamente como chega no aparelho do usuário.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setVisualizerDarkTheme((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 cursor-pointer hover:border-emerald-500 transition"
            >
              {visualizerDarkTheme ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ver WhatsApp Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Ver WhatsApp Escuro</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* COLUNA ESQUERDA: ESCOLHA DAS 3 IMAGENS DE CONVITE + CONTROLES DE SIMULAÇÃO */}
          <div className="xl:col-span-7 space-y-4">
            {/* SELETOR VISUAL DAS 3 IMAGENS OFICIAIS DE CONVITE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  <span>1. Selecione qual imagem enviar junto com a mensagem de convite:</span>
                </span>
                {inModal && hasUnsavedTemplateChanges && (
                  <button
                    type="button"
                    disabled={savingTemplates}
                    onClick={handleSaveTemplates}
                    className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {savingTemplates ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    <span>Salvar Escolha</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {OFFICIAL_INVITE_IMAGE_OPTIONS.map((opt) => {
                  const cleanCurrent = String(unregisteredImageUrl || '').split('#')[0].trim();
                  const isSelectedImg =
                    cleanCurrent === opt.url || cleanCurrent.endsWith(opt.previewSrc);

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOfficialInviteImage(opt.url, inModal)}
                      className={`group text-left rounded-2xl border-2 overflow-hidden transition flex flex-col cursor-pointer ${
                        isSelectedImg
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/35 shadow-md ring-2 ring-emerald-500/25'
                          : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-amber-400'
                      }`}
                    >
                      <div className="relative aspect-square w-full bg-stone-900 overflow-hidden">
                        <img
                          src={opt.previewSrc}
                          alt={opt.shortTitle}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        />
                        {isSelectedImg && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow flex items-center gap-1">
                            <Check className="w-3 h-3" /> Selecionada
                          </span>
                        )}
                      </div>
                      <div className="p-2.5 space-y-0.5">
                        <div className="text-[11px] font-bold text-stone-900 dark:text-white leading-tight">
                          {opt.shortTitle}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-snug">
                          {opt.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SELETOR DO MODELO E DADOS DO DESTINATÁRIO DE TESTE */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 space-y-3">
              <div>
                <span className="block text-xs font-bold text-stone-800 dark:text-stone-100 mb-1.5">
                  2. Escolha qual tipo de mensagem visualizar na tela do celular:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'pt_unregistered',
                      label: '🇧🇷 Convite Novos Usuários (Imagem + Texto)',
                    },
                    {
                      id: 'pt_registered',
                      label: '🇧🇷 Já Cadastrados (Planos Grátis & Pago)',
                    },
                    {
                      id: 'en_unregistered',
                      label: '🇬🇧 New Users Invite + Image (EN-GB)',
                    },
                    {
                      id: 'en_registered',
                      label: '🇬🇧 Registered Members Plans (EN-GB)',
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVisualizerFlowKey(item.id)}
                      className={`px-3 py-2 rounded-xl text-left text-[11px] font-semibold border transition cursor-pointer ${
                        visualizerFlowKey === item.id
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-stone-50 dark:bg-slate-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-slate-700 hover:bg-stone-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Nome do destinatário para simular <code className="font-mono">{'{nome}'}</code>:
                  </label>
                  <input
                    type="text"
                    disabled={!visualizerHasValidName}
                    value={visualizerSampleName}
                    onChange={(e) => setVisualizerSampleName(e.target.value)}
                    placeholder="Ex: Thiago Prata"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs text-stone-900 dark:text-white disabled:opacity-50 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Teste de saudação inteligente:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setVisualizerHasValidName(true);
                        if (!visualizerSampleName || visualizerSampleName === 'Sem nome válido') {
                          setVisualizerSampleName('Thiago Prata');
                        }
                      }}
                      className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold border cursor-pointer ${
                        visualizerHasValidName
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-stone-50 dark:bg-slate-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-slate-700'
                      }`}
                    >
                      Com 1º Nome
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisualizerHasValidName(false)}
                      className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold border cursor-pointer ${
                        !visualizerHasValidName
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-stone-50 dark:bg-slate-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-slate-700'
                      }`}
                    >
                      Sem Nome Válido
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Simulando entrega para <strong>{visualizerRecipientPhone}</strong> • Qualquer edição feita nas caixas de texto atualiza a tela do celular ao lado instantaneamente.
              </p>
            </div>
          </div>

          {/* COLUNA DIREITA: APARELHO CELULAR COM TELA REAL DO WHATSAPP */}
          <div className="xl:col-span-5 flex justify-center">
            <div className="w-full max-w-[350px] rounded-[40px] p-2.5 bg-slate-950 shadow-2xl border-[3px] border-slate-800 ring-1 ring-black/40">
              {/* TELA INTERNA DO SMARTPHONE */}
              <div
                className={`rounded-[31px] overflow-hidden flex flex-col border ${
                  visualizerDarkTheme
                    ? 'bg-[#0b141a] border-slate-800 text-[#e9edef]'
                    : 'bg-[#efeae2] border-stone-300 text-[#111b21]'
                }`}
              >
                {/* BARRA DE STATUS DO CELULAR */}
                <div
                  className={`px-5 pt-2 pb-1 flex items-center justify-between text-[11px] font-semibold ${
                    visualizerDarkTheme ? 'bg-[#202c33] text-stone-200' : 'bg-[#075e54] text-white'
                  }`}
                >
                  <span>{nowTimeStr}</span>
                  <div className="w-16 h-3.5 rounded-full bg-black/80" />
                  <div className="flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    <Battery className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* CABEÇALHO DO WHATSAPP */}
                <div
                  className={`px-3.5 py-2.5 flex items-center justify-between shadow-xs ${
                    visualizerDarkTheme ? 'bg-[#202c33] text-[#e9edef]' : 'bg-[#075e54] text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm opacity-90">←</span>
                    <img
                      src="/invite-isaac-black.jpg"
                      alt="ISAAC"
                      className="w-9 h-9 rounded-full object-cover border border-white/25 shrink-0 bg-black"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate flex items-center gap-1">
                        <span>ISAAC • Plataforma</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                      <div className="text-[10px] opacity-80 truncate">online</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs opacity-85 pr-1">
                    <span>📹</span>
                    <span>📞</span>
                    <span>⋮</span>
                  </div>
                </div>

                {/* ÁREA DE CONVERSA DO WHATSAPP */}
                <div
                  className="p-3 space-y-2.5 max-h-[450px] min-h-[360px] overflow-y-auto"
                  style={{
                    backgroundImage: visualizerDarkTheme
                      ? 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 0)'
                      : 'radial-gradient(rgba(0,0,0,0.045) 1px, transparent 0)',
                    backgroundSize: '18px 18px',
                  }}
                >
                  {/* AVISO DE CRIPTOGRAFIA */}
                  <div className="flex justify-center">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[9.5px] text-center leading-tight max-w-[92%] shadow-2xs ${
                        visualizerDarkTheme
                          ? 'bg-[#182229] text-[#ffd279]/90'
                          : 'bg-[#fff5c4] text-[#54656f]'
                      }`}
                    >
                      🔒 As mensagens são protegidas com a criptografia de ponta a ponta.
                    </span>
                  </div>

                  {/* BALÃO DE MENSAGEM RECEBIDA PELO USUÁRIO */}
                  <div className="flex justify-start">
                    <div
                      className={`relative max-w-[92%] rounded-2xl rounded-tl-xs p-1.5 shadow-sm ${
                        visualizerDarkTheme
                          ? 'bg-[#202c33] text-[#e9edef]'
                          : 'bg-white text-[#111b21]'
                      }`}
                    >
                      {/* IMAGEM DE CONVITE NO TOPO DO BALÃO (QUANDO FOR CONVITE C/ IMAGEM) */}
                      {isInviteWithImage && (
                        <div className="rounded-xl overflow-hidden mb-1.5 bg-black/20">
                          <img
                            src={previewImgSrc}
                            alt="Imagem do convite no WhatsApp"
                            className="w-full max-h-60 object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/og-isaac-cover.jpg';
                            }}
                          />
                        </div>
                      )}

                      {/* TEXTO FORMATADO COM NEGRITO / ITÁLICO / LINKS REAIS DO WHATSAPP */}
                      <div className="px-1.5 pt-0.5 pb-1 text-[12px] leading-[1.42] break-words">
                        {lines.map((line, idx) => (
                          <React.Fragment key={idx}>
                            {line === '' ? (
                              <div className="h-2.5" />
                            ) : (
                              <div>{formatWhatsAppInlineTokens(line, visualizerDarkTheme)}</div>
                            )}
                          </React.Fragment>
                        ))}

                        <div className="flex items-center justify-end gap-1 mt-1 select-none">
                          <span
                            className={`text-[9.5px] ${
                              visualizerDarkTheme ? 'text-[#8696a0]' : 'text-[#667781]'
                            }`}
                          >
                            {nowTimeStr}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BARRA INFERIOR DE DIGITAÇÃO DO WHATSAPP */}
                <div
                  className={`px-2.5 py-2 flex items-center gap-2 ${
                    visualizerDarkTheme ? 'bg-[#1f2c34]' : 'bg-[#f0f2f5]'
                  }`}
                >
                  <div
                    className={`flex-1 px-3 py-1.5 rounded-full text-[11px] flex items-center justify-between ${
                      visualizerDarkTheme
                        ? 'bg-[#2a3942] text-[#8696a0]'
                        : 'bg-white text-[#667781]'
                    }`}
                  >
                    <span>😊 Mensagem</span>
                    <span>📎 📷</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#00a884] text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                    🎤
                  </div>
                </div>
              </div>
            </div>
          </div>
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
            <span>Divulgar Página Dedicada de eBook — Autor: Thiago Prata (Plataforma ISAAC®)</span>
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

      {/* VISUALIZADOR REALISTA DE CELULAR WHATSAPP + SELETOR DAS 3 IMAGENS DE CONVITE */}
      {renderSmartphoneWhatsAppVisualizer({ inModal: false })}

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
            src={resolveInviteImagePreviewSrc(unregisteredImageUrl)}
            alt="Capa ISAAC"
            className="w-10 h-10 object-cover rounded-md border border-stone-200 shrink-0"
            onError={(e) => {
              e.currentTarget.src = '/og-isaac-cover.jpg';
            }}
          />
          <div className="flex-1 min-w-0">
            <span className="block text-[9px] uppercase font-bold text-stone-400">
              URL da Imagem Selecionada (BR &amp; Intl)
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
      {/* ALERTA AO VIVO DE CONEXÃO DA EVOLUTION API */}
      {overview.evolutionConnection && !overview.evolutionConnection.connected && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400/80 dark:border-rose-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-rose-900 dark:text-rose-200">
                Instância WhatsApp &ldquo;{overview.evolutionConnection.instanceName || 'isaac'}&rdquo; Desconectada na Evolution API
              </h3>
              <p className="text-xs text-rose-800/90 dark:text-rose-300/90 mt-0.5 leading-relaxed">
                O WhatsApp do número conectado foi desvinculado (<code className="font-mono text-[11px]">state: close</code>). Escaneie novamente o QR Code no painel da Evolution para retomar os disparos e o atendimento automático.
              </p>
            </div>
          </div>
          <a
            href={overview.evolutionConnection.managerUrl || 'https://evo.lynxems.com.br/manager'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5 shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir Painel Evolution (QR Code)</span>
          </a>
        </div>
      )}

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

      {/* BARRA DE PILOTO AUTOMÁTICO NO SERVIDOR 24/7 (PODE FECHAR O APP / NAVEGADOR) */}
      {(() => {
        const auto = overview.serverAutopilot || {};
        const activeCamp = auto.activeCampaign || null;
        const isRunning = activeCamp?.status === 'running' || activeCamp?.status === 'scheduled';
        const isPaused = activeCamp?.status === 'paused';
        const reason = activeCamp?.nextDispatchReason || 'idle';
        const total = Number(activeCamp?.total_targets) || 0;
        const sent = Number(activeCamp?.sent_count) || 0;
        const queued = Number(activeCamp?.queuedCount) || Math.max(0, total - sent);
        const pct = total > 0 ? Math.min(100, Math.round((sent / total) * 100)) : 0;

        let nextStatusBadge = '';
        if (!activeCamp) {
          nextStatusBadge = 'Nenhuma fila em andamento no momento — selecione contatos e clique em Enviar p/ iniciar no servidor.';
        } else if (isPaused) {
          nextStatusBadge = '⏸️ Fila pausada manualmente no servidor — clique em "Ativar no Servidor" para retomar.';
        } else if (reason === 'daily_limit_reached') {
          nextStatusBadge = `⏳ Cota de 24h atingida (${activeCamp.campSentLast24h || 0}/${activeCamp.effectiveDailyCap || 30}) — aumente o Limite Diário ao lado e clique em Salvar se quiser continuar enviando hoje!`;
        } else if (reason === 'hourly_cap_reached') {
          nextStatusBadge = `🛡️ Pausa de proteção horária (${auto.sentLast1h || 0}/10 na última 1h) — o servidor retomará sozinho na próxima janela.`;
        } else if ((reason === 'coffee_break' || reason === 'cadence_wait') && activeCamp.nextDispatchAtIso) {
          const nextTimeStr = formatBrazilTime(activeCamp.nextDispatchAtIso, {
            second: '2-digit',
          });
          nextStatusBadge =
            reason === 'coffee_break'
              ? `☕ Pausa Humana Anti-Ban ativa (a cada 7 envios) — próximo disparo automático no servidor às ${nextTimeStr}.`
              : `⏱️ Próximo disparo automático no servidor agendado para ${nextTimeStr}.`;
        } else {
          nextStatusBadge = '🚀 Servidor processando e enviando automaticamente em 2º plano (ciclo de 20s).';
        }

        return (
          <div
            className={`p-4 sm:p-5 rounded-3xl border transition shadow-xs ${
              isRunning
                ? 'bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-indigo-50/60 dark:from-emerald-950/35 dark:via-slate-900 dark:to-indigo-950/30 border-emerald-300 dark:border-emerald-700/80'
                : isPaused
                ? 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-300 dark:border-amber-700/70'
                : 'bg-white/90 dark:bg-slate-800/80 border-stone-200 dark:border-slate-700'
            }`}
          >
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                      isRunning
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isPaused
                        ? 'bg-amber-500 text-white'
                        : 'bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-stone-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isRunning ? 'bg-white animate-ping' : 'bg-current'
                      }`}
                    />
                    {isRunning
                      ? '🟢 PILOTO AUTOMÁTICO NO SERVIDOR ATIVO (24/7)'
                      : isPaused
                      ? '⏸️ PILOTO AUTOMÁTICO PAUSADO'
                      : '⚙️ MOTOR DO SERVIDOR PRONTO (24/7)'}
                  </span>

                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 dark:bg-slate-900/90 text-teal-800 dark:text-teal-300 border border-teal-300/70 dark:border-teal-700">
                    ✅ Pode fechar o App ou desligar o PC — o servidor na nuvem continua enviando sozinho!
                  </span>

                  <span
                    onClick={() => loadOverview({ silent: true })}
                    title="Clique para sincronizar agora (atualiza sozinho a cada 20 segundos)"
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-400/40 flex items-center gap-1.5 cursor-pointer hover:bg-indigo-500/25 transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${isAutoRefreshing ? 'animate-spin' : ''}`} />
                    <span>
                      {isAutoRefreshing
                        ? 'Atualizando tela...'
                        : `Auto-Sync 20s (${autoRefreshCountdown}s)${lastSyncedAt ? ` • ${lastSyncedAt}` : ''}`}
                    </span>
                  </span>
                </div>

                {activeCamp ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-stone-900 dark:text-white">
                      <span className="truncate">{activeCamp.title}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[11px]">
                        Enviadas: {sent} / {total} ({pct}%)
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 text-[11px]">
                        Na Fila: {queued}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-stone-500/15 text-stone-700 dark:text-stone-300 text-[11px]">
                        Hoje (24h): {activeCamp.campSentLast24h || 0} / {activeCamp.effectiveDailyCap || 30}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-800 dark:text-teal-300 text-[11px]">
                        Última 1h: {auto.sentLast1h || 0} / 10
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-stone-200/80 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                        style={{ width: `${Math.max(2, pct)}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-stone-700 dark:text-stone-300 font-medium">
                      {nextStatusBadge}
                      {auto.lastSentRecipient && auto.lastSentAt && (
                        <span className="text-stone-500 dark:text-stone-400 ml-1.5">
                          • Último entregue: <strong>{auto.lastSentRecipient}</strong> às{' '}
                          {formatBrazilTime(auto.lastSentAt)}
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-stone-600 dark:text-stone-300">{nextStatusBadge}</p>
                )}
              </div>

              {activeCamp && (
                <div className="flex flex-wrap items-end gap-2.5 bg-white/85 dark:bg-slate-900/80 p-3 rounded-2xl border border-stone-200/90 dark:border-slate-700 shrink-0">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                      Limite Diário (24h)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="250"
                      value={autopilotDailyLimit}
                      onChange={(e) => setAutopilotDailyLimit(e.target.value)}
                      className="w-20 px-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-600 text-xs font-bold text-stone-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 dark:text-stone-400 mb-1">
                      Intervalo Mín/Máx (s)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="15"
                        max="600"
                        value={autopilotMinDelay}
                        onChange={(e) => setAutopilotMinDelay(e.target.value)}
                        className="w-16 px-2 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-600 text-xs font-bold text-stone-900 dark:text-white"
                      />
                      <span className="text-xs text-stone-400">a</span>
                      <input
                        type="number"
                        min="30"
                        max="900"
                        value={autopilotMaxDelay}
                        onChange={(e) => setAutopilotMaxDelay(e.target.value)}
                        className="w-16 px-2 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-600 text-xs font-bold text-stone-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={savingAutopilot}
                    onClick={() => handleSaveAutopilotSettings(activeCamp.id)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                    title="Salva o novo limite/intervalo no servidor e mantém o envio rodando em 2º plano"
                  >
                    {savingAutopilot ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Salvar &amp; Continuar no Servidor</span>
                  </button>

                  {isRunning ? (
                    <button
                      type="button"
                      onClick={() => handleCampaignControl(activeCamp.id, 'pause')}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Pausar temporariamente o envio automático no servidor (pode retomar depois)"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pausar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCampaignControl(activeCamp.id, 'resume')}
                      className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Ativar o envio automático no servidor"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Ativar no Servidor</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCampaignControl(activeCamp.id, 'stop')}
                    className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                    title="Parar e encerrar definitivamente o envio desta fila no servidor"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Parar</span>
                  </button>

                  <button
                    type="button"
                    disabled={triggeringTickNow}
                    onClick={handleTriggerServerTickNow}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    title="Pede ao servidor para disparar imediatamente o próximo contato da fila"
                  >
                    {triggeringTickNow ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Enviar 1 Agora</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

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
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    🛡️ Links Blindados Anti-Bloqueio Meta
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300">
                  Escolha abaixo qual página o botão roxo <strong>&ldquo;{buildEbookWhatsappPayload(quickEbookSlug)?.shortLabel || 'Página dos eBooks'}&rdquo;</strong> enviará com rotas editoriais rotacionadas (<code>/biblioteca</code>, <code>/leituras</code>, <code>/acervo</code>) + Modo Blindado 2 Etapas p/ lotes:
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
                  🌐 Biblioteca Geral dos eBooks (/biblioteca • Todos + Carrinho)
                </option>
                <option value="colecao-completa">
                  🔥 Coleção Completa 8 em 1 (/biblioteca/colecao-completa • R$ 111,44)
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

          {/* BARRA RÁPIDA DE ESCOLHA DA IMAGEM DE CONVITE (4 OPÇÕES) + BOTÃO VISUALIZADOR DO CELULAR */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/75 dark:bg-amber-950/20 border border-amber-200/90 dark:border-amber-800/50 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-amber-950 dark:text-amber-200 flex flex-wrap items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Imagem Padrão do Convite para Novos Usuários (Escolha entre as 4 opções):</span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-300">
                Clique em uma das 4 artes abaixo para definir qual imagem acompanha o botão laranja <strong>&ldquo;Convite c/ Imagem&rdquo;</strong> e as campanhas de convite:
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {OFFICIAL_INVITE_IMAGE_OPTIONS.map((opt) => {
                const cleanCurrent = String(unregisteredImageUrl || '').split('#')[0].trim();
                const isSelectedImg =
                  cleanCurrent === opt.url || cleanCurrent.endsWith(opt.previewSrc);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={savingTemplates}
                    onClick={() => handleSelectOfficialInviteImage(opt.url, true)}
                    className={`px-2.5 py-1.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                      isSelectedImg
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-stone-700 dark:text-stone-200 border-stone-300 dark:border-slate-700 hover:border-amber-500'
                    }`}
                  >
                    <img
                      src={opt.previewSrc}
                      alt={opt.shortTitle}
                      className="w-8 h-8 rounded-lg object-cover border border-black/10 shrink-0 bg-black"
                    />
                    <div className="pr-1">
                      <div className="text-[11px] font-bold leading-tight">{opt.shortTitle}</div>
                      <div
                        className={`text-[9.5px] ${
                          isSelectedImg ? 'text-emerald-100' : 'text-stone-400'
                        }`}
                      >
                        {isSelectedImg ? '✓ Ativa nos convites' : 'Clique p/ usar'}
                      </div>
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleOpenPhoneVisualizerForContact(null)}
                className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Visualizar no Celular</span>
              </button>
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
                {/* OPÇÃO ANTES DO CONVITE: ENVIAR A PÁGINA DOS EBOOKS EM LOTE P/ SELECIONADOS (COM ESCUDO ANTI-BAN) */}
                <button
                  type="button"
                  disabled={sendingBulkEbook}
                  onClick={handleOpenBulkEbookShieldModal}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {sendingBulkEbook ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
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
                        Programado: {formatBrazilDateTime(camp.scheduled_at)} • Alvos: {camp.total_targets} • Enviados: <strong>{camp.sent_count}</strong> • Bloqueados Trava: {camp.blocked_safety_count} • Falhas: {camp.failed_count}
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
                            {String(log.media_url || '').includes('#awaiting_link_reply:')
                              ? '🛡️⏳ Etapa 1 Enviada (Aguardando "Sim"/👍 p/ Link)'
                              : String(log.media_url || '').includes('#link_delivered:')
                              ? '📘✅ Mensagem Única + Link c/ Card Entregue!'
                              : String(log.media_url || '').includes('#declined_politely:')
                              ? '🤝 Recusa Educada Respeitada'
                              : String(log.media_url || '').includes('/ebooks/covers/')
                              ? '📘 Mensagem Única + Link c/ Card'
                              : log.flow_type === 'unregistered_invite_image'
                              ? '🖼️ Imagem ISAAC + Convite'
                              : '🤝 Integração + Planos'}
                          </span>
                        </div>
                        {log.error_reason && (
                          <p
                            className={`text-[11px] ${
                              log.status === 'queued'
                                ? 'text-amber-700 dark:text-amber-300'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {log.error_reason}
                          </p>
                        )}
                        <p className="text-[10px] text-stone-400">
                          {log.sent_at
                            ? `Enviado em ${formatBrazilDateTime(log.sent_at)} • Cadência humana: ${log.anti_ban_delay_ms || 0}ms • ID: ${log.evolution_message_id || '-'}`
                            : `Agendado para ${log.scheduled_for ? formatBrazilDateTime(log.scheduled_for) : '-'}`}
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

      {/* MODAL DO SIMULADOR REALISTA DE WHATSAPP NO CELULAR */}
      {showPhoneVisualizerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="w-full max-w-5xl rounded-3xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/80 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-serif font-bold">
                    Visualizador do Celular — Prévia Exata no WhatsApp do Destinatário
                  </h3>
                  <p className="text-[11px] text-emerald-200/90">
                    Alterne entre as 4 imagens de convite e os modelos de mensagem para conferir exatamente como chega no celular.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPhoneVisualizerModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto">
              {renderSmartphoneWhatsAppVisualizer({ inModal: true })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRÉ-VOO DE PROTEÇÃO DA LINHA E ENVIO ÚNICO ENXUTO C/ CARD DE PREVIEW */}
      {showBulkEbookShieldModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700/80 shadow-2xl overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-teal-950 text-white flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-serif font-bold">
                    Disparo em Mensagem Única Protegida ({selectedContactIds.length} contatos)
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Envia apenas 1 mensagem enxuta com saudação pelo nome + link oficial com card de pré-visualização.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkEbookShieldModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
              <div className="space-y-2.5">
                <label
                  onClick={() => setEbookLinkMode('single_clean_link')}
                  className={`block p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                    ebookLinkMode === 'single_clean_link'
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30'
                      : 'border-stone-200 dark:border-slate-700 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                      <input
                        type="radio"
                        checked={ebookLinkMode === 'single_clean_link'}
                        onChange={() => setEbookLinkMode('single_clean_link')}
                        className="accent-emerald-600"
                      />
                      <span>📘 Mensagem Única Enxuta — Saudação pelo Nome + Link Oficial c/ Card de Preview (Padrão)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shrink-0">
                      1 Mensagem Direta
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed">
                    Envia <strong>somente 1 única mensagem</strong> saudando pelo primeiro nome (PT-BR p/ Brasil e EN-GB p/ internacionais) + link limpo rotacionado (<code>/biblioteca</code>, <code>/leituras</code> ou <code>/acervo?v=...</code>), que já carrega automaticamente o card visual com a capa e descrição no WhatsApp — sem mandar segunda mensagem!
                  </p>
                </label>

                <label
                  onClick={() => setEbookLinkMode('two_step_shield')}
                  className={`block p-3.5 rounded-2xl border-2 cursor-pointer transition ${
                    ebookLinkMode === 'two_step_shield'
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30'
                      : 'border-stone-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={ebookLinkMode === 'two_step_shield'}
                      onChange={() => setEbookLinkMode('two_step_shield')}
                      className="accent-indigo-600"
                    />
                    <span>🛡️ Opcional: Perguntar &ldquo;Posso enviar?&rdquo; antes do Link (p/ Contatos Frios)</span>
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed">
                    Para contatos sem conversa recente, pergunta primeiro sem URL e, quando respondem &ldquo;sim&rdquo; ou 👍, envia automaticamente essa mesma <strong>1 única mensagem enxuta</strong> com o link e card.
                  </p>
                </label>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-stone-900 dark:text-white">
                      Limite Diário Seguro desta Campanha (24h):
                    </span>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Os {selectedContactIds.length} contatos ficam salvos na fila persistente até todos receberem (0% perda).
                    </p>
                  </div>
                  <input
                    type="number"
                    min={5}
                    max={overview.safety?.dailyLimit || 40}
                    value={ebookSafeDailyLimit}
                    onChange={(e) => setEbookSafeDailyLimit(Number(e.target.value) || 30)}
                    className="w-24 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-600 text-xs font-bold text-center text-stone-900 dark:text-white"
                  />
                </div>

                <ul className="text-[11px] text-stone-600 dark:text-stone-300 space-y-1 pt-1 border-t border-stone-200/80 dark:border-slate-700/80">
                  <li>✅ <strong>Zero Perda de Envios:</strong> se o WhatsApp reconectar ou um contato estiver em cooldown recente, a fila <strong>reagenda automaticamente</strong> sem descartar ninguém.</li>
                  <li>✅ <strong>Fuso Horário por País:</strong> Austrália (<code>+61</code> EN-GB) só recebe entre 08:30–20:00 de Sydney; Brasil (<code>+55</code> PT-BR) entre 08:30–20:00 de Brasília.</li>
                  <li>✅ <strong>Ritmo Humano Real:</strong> 52s–128s entre pessoas, teto de máx. 10/hora, pausa de 14–22 min a cada 7 envios e priorização automática dos contatos já cadastrados/salvos.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-slate-950/60 border-t border-stone-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={sendingBulkEbook}
                onClick={() => setShowBulkEbookShieldModal(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={sendingBulkEbook}
                onClick={handleConfirmBulkSendEbookPage}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sendingBulkEbook ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>
                  Iniciar Fila Blindada p/ {selectedContactIds.length} Contato(s)
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
