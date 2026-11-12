import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Globe,
  Mail,
  Smartphone,
  ShieldCheck,
  Copy,
  Check,
  Plus,
  Gift,
  Award,
  Layers,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  fetchPublicEbooksStore,
  fetchPublicEbookBySlug,
} from '../services/ebookStoreApi';
import { useEbookCart } from '../services/ebookCartStore';

export default function EbookSalesPage({
  slug = '',
  onNavigateSlug,
  onBackToHome,
  user,
  profile,
}) {
  const isSuperAdmin =
    profile?.role === 'master' ||
    user?.email === 'edsonmanoel2012@gmail.com' ||
    profile?.email === 'edsonmanoel2012@gmail.com';

  const {
    cart,
    itemCount,
    totalAmount,
    hasSlug,
    addEbookToCart,
    activateCompleteBundleInCart,
    openEbookCartDrawer,
  } = useEbookCart();

  const [storeData, setStoreData] = useState(null);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewLang, setPreviewLang] = useState('pt'); // 'pt' | 'en'
  const [copiedPageUrl, setCopiedPageUrl] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (slug) {
      fetchPublicEbookBySlug(slug)
        .then((res) => {
          if (!active) return;
          setProductData(res);
          setStoreData({
            meta: res.meta,
            author: res.author,
            pricing: res.pricing,
            bundle: res.bundle,
            ebooks: res.allEbooks || [],
          });
          document.title = `${res.product.title} — Thiago Prata | Plataforma ISAAC®`;
        })
        .catch((err) => {
          if (!active) return;
          setError(err.message || 'eBook não encontrado.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      setProductData(null);
      fetchPublicEbooksStore()
        .then((res) => {
          if (!active) return;
          setStoreData(res);
          document.title = 'Biblioteca Oficial de eBooks Bilíngues — Thiago Prata | Plataforma ISAAC®';
        })
        .catch((err) => {
          if (!active) return;
          setError(err.message || 'Falha ao carregar catálogo.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [slug]);

  const handleCopyCurrentLink = async (targetPath) => {
    const url = `${window.location.origin}${targetPath || window.location.pathname}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedPageUrl(true);
      setTimeout(() => setCopiedPageUrl(false), 3000);
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-9 h-9 text-teal-700 dark:text-teal-400 animate-spin" />
        <p className="text-sm font-serif text-stone-600 dark:text-stone-300">
          Carregando Biblioteca Oficial ISAAC® Essential...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <h1 className="text-2xl font-serif font-semibold text-stone-900 dark:text-white">{error}</h1>
        <button
          type="button"
          onClick={() => onNavigateSlug('')}
          className="px-6 py-3 rounded-2xl bg-teal-700 text-white text-xs font-bold cursor-pointer"
        >
          Ver Todos os eBooks da Coleção
        </button>
      </div>
    );
  }

  const author = storeData?.author || {
    name: 'Thiago Prata',
    rolePt: 'Mentor em Projetos e Negócios • Idealizador & Criador da Plataforma e do App ISAAC®',
    bioPt:
      'Estrategista, mentor de líderes e empreendedores e criador da Metodologia ISAAC® (Inovação, Sustentabilidade, Amor, Atitude e Conhecimento).',
    quotePt: '"Fazer do bem um bom negócio — conquistando a liberdade de ser quem você nasceu para ser."',
  };
  const bundle = storeData?.bundle;
  const ebooks = storeData?.ebooks || [];

  // =========================================================================
  // MODO A: PÁGINA DE VENDA DEDICADA DE UM EBOOK OU DO PACOTE COMPLETO
  // =========================================================================
  if (slug && productData?.product) {
    const prod = productData.product;
    const isBundle = Boolean(prod.isBundle);
    const inCart = isBundle ? cart.isBundle : hasSlug(prod.slug);

    const displayTitle =
      previewLang === 'en' ? prod.enTitle || prod.title : prod.title;
    const displaySub =
      previewLang === 'en' ? prod.enSubtitle || prod.subtitle : prod.subtitle;
    const displaySummary =
      previewLang === 'en'
        ? prod.enExecutiveSummary || prod.executiveSummary || prod.salesKit?.transformationPromise
        : prod.executiveSummary || prod.salesKit?.transformationPromise;
    const chaptersList =
      previewLang === 'en' && prod.enChaptersDetail?.length
        ? prod.enChaptersDetail
        : prod.chaptersDetail || [];

    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 pb-24">
        {/* TOPO DE NAVEGAÇÃO DA LOJA */}
        <div className="bg-slate-950 text-white border-b border-amber-500/30 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => onNavigateSlug('')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Todos os eBooks</span>
              </button>
              <button
                type="button"
                onClick={onBackToHome}
                className="hidden sm:inline-flex px-3 py-1.5 rounded-xl text-slate-300 hover:text-white text-xs transition cursor-pointer"
              >
                App ISAAC®
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <a
                  href="/ebooks"
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition"
                >
                  Acervo SuperAdmin
                </a>
              )}
              <button
                type="button"
                onClick={() => handleCopyCurrentLink(prod.salesPagePath)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copiedPageUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedPageUrl ? 'Link Copiado!' : 'Copiar Link de Venda'}</span>
              </button>
              <button
                type="button"
                onClick={() => openEbookCartDrawer({ step: 'cart' })}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Carrinho ({cart.isBundle ? '8' : itemCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* HERO DE VENDA DO PRODUTO (CAPA + OFERTA DIRETA ASAAS) */}
        <section className="relative bg-gradient-to-b from-slate-950 via-teal-950 to-stone-50 dark:to-slate-900 pt-10 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* COLUNA ESQUERDA: CAPA OFICIAL DE VENDA DO PRODUTO */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative group max-w-[330px] w-full">
                <div className="absolute -inset-3 bg-gradient-to-tr from-amber-500/35 via-teal-400/25 to-emerald-500/30 rounded-3xl blur-2xl opacity-80" />
                <img
                  src={prod.coverUrl}
                  alt={prod.title}
                  className="relative w-full aspect-[960/1360] object-cover rounded-2xl border-2 border-amber-400/60 shadow-2xl"
                />
                <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-amber-200/90 font-medium">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mesmo PDF em Português + Inglês Britânico (EN-GB)</span>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: COPY & COMPRA DIRETA ASAAS */}
            <div className="lg:col-span-7 text-white space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-extrabold uppercase tracking-wider">
                  {isBundle ? 'Pacote Completo • 30% OFF' : `Volume 0${prod.volumeNumber} • Coleção ISAAC® Essential`}
                </span>
                <span className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-200 text-[11px] font-semibold">
                  🇬🇧🇧🇷 Edição Bilíngue Integrada
                </span>
              </div>

              {/* SELETOR DE PRÉVIA PT-BR / EN-GB */}
              <div className="inline-flex rounded-xl bg-white/10 p-1 border border-white/15">
                <button
                  type="button"
                  onClick={() => setPreviewLang('pt')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    previewLang === 'pt' ? 'bg-amber-400 text-slate-950' : 'text-slate-200 hover:text-white'
                  }`}
                >
                  🇧🇷 Ler Apresentação em Português
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLang('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    previewLang === 'en' ? 'bg-amber-400 text-slate-950' : 'text-slate-200 hover:text-white'
                  }`}
                >
                  🇬🇧 Read in British English
                </button>
              </div>

              <h1 className="text-2xl sm:text-4xl font-serif font-semibold leading-tight text-white">
                {displayTitle}
              </h1>

              <p className="text-sm sm:text-base text-slate-200 font-serif leading-relaxed">
                {displaySub}
              </p>

              {/* AUTOR EM DESTAQUE */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
                <img
                  src="/ebooks/thiago-prata.jpg"
                  alt="Thiago Prata"
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shrink-0"
                />
                <div>
                  <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                    Autor Oficial da Obra &amp; Mentor do App ISAAC®
                  </div>
                  <div className="text-sm sm:text-base font-serif font-bold text-white">
                    {author.name}
                  </div>
                  <div className="text-[11px] text-slate-300">{author.rolePt}</div>
                </div>
              </div>

              {/* CARD DE PREÇO E VENDA DIRETA ASAAS */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800 text-stone-900 dark:text-white border-2 border-amber-400/80 shadow-2xl space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 block">
                      {isBundle
                        ? 'Todos os 8 eBooks reunidos em 1 Arquivo Único PDF:'
                        : 'Exemplar Digital Completo em PDF (PT-BR + EN-GB):'}
                    </span>
                    <div className="flex items-baseline gap-2.5 mt-1">
                      <span className="text-3xl sm:text-4xl font-serif font-extrabold text-emerald-700 dark:text-emerald-400">
                        {isBundle ? 'R$ 111,44' : 'R$ 19,90'}
                      </span>
                      {isBundle && (
                        <>
                          <span className="text-sm line-through text-stone-400">R$ 159,20</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[11px] font-extrabold">
                            30% OFF
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-stone-500 dark:text-stone-400">
                    <div>PIX Imediato, Cartão ou Boleto</div>
                    <div className="font-semibold text-teal-700 dark:text-teal-400">Checkout Oficial Asaas</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => openEbookCartDrawer({ directBuySlug: prod.slug })}
                    className="py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Comprar Agora via Asaas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isBundle) {
                        activateCompleteBundleInCart();
                      } else {
                        addEbookToCart(prod.slug);
                      }
                      openEbookCartDrawer({ step: 'cart' });
                    }}
                    className="py-3.5 px-5 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-300" />
                    <span>{inCart ? 'Já no Carrinho (Ver)' : 'Adicionar ao Carrinho'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-200 dark:border-slate-700 text-[11px] text-stone-600 dark:text-stone-300">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Dedicatória com seu nome no PDF</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                    <span>Envio automático p/ seu E-mail</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Link enviado no seu WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTEÚDO DETALHADO, ILUSTRAÇÃO 16:9 E CAPÍTULOS */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-12">
          {/* ILUSTRAÇÃO PANORÂMICA 16:9 DO TEMA + RESUMO EXECUTIVO */}
          <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 shadow-lg space-y-6">
            {prod.illustrationUrl && (
              <div className="overflow-hidden rounded-2xl border border-amber-500/40 shadow-md">
                <img
                  src={prod.illustrationUrl}
                  alt={displayTitle}
                  className="w-full aspect-video object-cover"
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                {previewLang === 'en' ? 'Executive Overview • By Thiago Prata' : 'Visão Executiva da Obra • Por Thiago Prata'}
              </div>
              <p className="text-sm sm:text-base font-serif text-stone-700 dark:text-stone-200 leading-relaxed">
                {displaySummary}
              </p>
            </div>

            {prod.salesKit?.deliverables?.length > 0 && (
              <div className="pt-4 border-t border-stone-200 dark:border-slate-700 space-y-3">
                <h2 className="text-base sm:text-lg font-serif font-semibold text-stone-900 dark:text-white">
                  O que você recebe imediatamente ao baixar este PDF:
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {prod.salesKit.deliverables.map((del, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200/80 dark:border-slate-700 flex items-start gap-2.5 text-xs sm:text-sm font-serif"
                    >
                      <CheckCircle2 className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                      <span>{del}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CAPÍTULOS APROFUNDADOS (SE FOR VOLUME INDIVIDUAL) */}
          {!isBundle && chaptersList.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-stone-900 dark:text-white">
                {previewLang === 'en'
                  ? 'Chapters Included Inside Your Bilingual PDF (PT-BR & EN-GB)'
                  : 'Capítulos Completos Inclusos no Seu PDF Bilíngue'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chaptersList.map((ch) => (
                  <div
                    key={ch.number}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 shadow-xs space-y-2"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      {previewLang === 'en' ? `Chapter 0${ch.number}` : `Capítulo 0${ch.number}`}
                    </span>
                    <h3 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                      {ch.title}
                    </h3>
                    {ch.frameworkTitle && (
                      <p className="text-xs text-stone-600 dark:text-stone-300">
                        <strong>Ferramenta Prática:</strong> {ch.frameworkTitle}
                      </p>
                    )}
                    {ch.clarityKey && (
                      <p className="text-xs italic text-amber-800 dark:text-amber-300 pt-1">
                        “{ch.clarityKey}”
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROMOÇÃO PACOTE COMPLETO 30% OFF (EXIBIDO NAS PÁGINAS INDIVIDUAIS) */}
          {!isBundle && bundle && (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white border-2 border-amber-400/70 shadow-2xl flex flex-col md:flex-row items-center gap-6">
              <img
                src={bundle.coverUrl}
                alt={bundle.title}
                className="w-36 sm:w-44 rounded-xl border-2 border-amber-400 shadow-xl shrink-0"
              />
              <div className="space-y-3 text-center md:text-left flex-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-extrabold uppercase tracking-wider">
                  <Gift className="w-3.5 h-3.5" />
                  <span>Promoção Especial • 30% de Desconto</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold">
                  Prefere levar TODOS os 8 eBooks em um Arquivo Único PDF?
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 font-serif leading-relaxed">
                  De <span className="line-through text-slate-400">R$ 159,20</span> por apenas{' '}
                  <strong className="text-amber-300 text-base">R$ 111,44</strong> (economia imediata de R$ 47,76). Receba um único PDF consolidado com todos os 8 volumes bilíngues ilustrados e dedicados a você por <strong>Thiago Prata</strong>!
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => openEbookCartDrawer({ directBuySlug: 'colecao-completa' })}
                    className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Comprar Coleção Completa — R$ 111,44</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateSlug('colecao-completa')}
                    className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer"
                  >
                    Ver Página da Coleção Completa
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  // =========================================================================
  // MODO B: VITRINE GERAL DA LOJA DE EBOOKS (/loja/ebooks)
  // =========================================================================
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 pb-24">
      {/* BARRA SUPERIOR DA LOJA */}
      <div className="bg-slate-950 text-white border-b border-amber-500/30 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBackToHome}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao App ISAAC®</span>
          </button>

          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <a
                href="/ebooks"
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition"
              >
                Estúdio SuperAdmin (/ebooks)
              </a>
            )}
            <button
              type="button"
              onClick={() => openEbookCartDrawer({ step: 'cart' })}
              className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>
                Carrinho ({cart.isBundle ? '8' : itemCount}) •{' '}
                {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* HERO DA VITRINE + PACOTE COMPLETO 30% OFF */}
      <section className="bg-gradient-to-b from-slate-950 via-teal-950 to-slate-900 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-amber-500/30">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Biblioteca Oficial ISAAC® Essential • Português + Inglês Britânico no Mesmo PDF</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-semibold leading-tight">
              Clareza de Entendimento, Liderança &amp; Negócios com Propósito
            </h1>
            <p className="text-sm sm:text-base text-slate-200 font-serif leading-relaxed">
              Obras oficiais escritas por <strong>{author.name}</strong> (Mentor do App ISAAC®). Cada PDF inclui ilustrações exclusivas, linhas de anotações, edição bilíngue completa (PT-BR + EN-GB) e <strong>dedicatória personalizada com o seu nome na margem inferior</strong>!
            </p>
          </div>

          {/* CARD DESTAQUE: PACOTE COMPLETO EM 1 PDF ÚNICO COM 30% DE DESCONTO */}
          {bundle && (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-teal-900/50 border-2 border-amber-400/80 shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-4 flex justify-center">
                <img
                  src={bundle.coverUrl}
                  alt={bundle.title}
                  onClick={() => onNavigateSlug('colecao-completa')}
                  className="w-48 sm:w-56 aspect-[960/1360] object-cover rounded-2xl border-2 border-amber-400 shadow-2xl cursor-pointer hover:scale-[1.02] transition-transform"
                />
              </div>
              <div className="md:col-span-8 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider">
                    ★ Oferta Principal • 30% de Desconto
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-amber-200 text-xs font-semibold">
                    Arquivo Único PDF com Todos os 8 Volumes
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                  {bundle.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 font-serif leading-relaxed">
                  {bundle.subtitle}
                </p>
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-serif font-extrabold text-amber-300">
                    R$ 111,44
                  </span>
                  <span className="text-sm line-through text-slate-400">De R$ 159,20</span>
                  <span className="text-xs text-emerald-300 font-semibold">
                    (Você economiza R$ 47,76 hoje)
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => openEbookCartDrawer({ directBuySlug: 'colecao-completa' })}
                    className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Comprar Pacote Completo no Asaas (R$ 111,44)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateSlug('colecao-completa')}
                    className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <span>Página Dedicada da Coleção</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* GRADE DOS 8 EBOOKS INDIVIDUAIS (R$ 19,90 CADA) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Volumes Segmentados • R$ 19,90 cada
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900 dark:text-white mt-1">
              Monte seu Carrinho ou Compre Cada eBook Individualmente
            </h2>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-serif">
            Autor: <strong>Thiago Prata</strong> • Entrega automática no E-mail &amp; WhatsApp
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ebooks.map((eb) => {
            const added = hasSlug(eb.slug);
            return (
              <article
                key={eb.slug}
                className="rounded-3xl bg-white dark:bg-slate-800 border border-stone-200/90 dark:border-slate-700 shadow-md hover:shadow-xl transition flex flex-col overflow-hidden group"
              >
                <div
                  onClick={() => onNavigateSlug(eb.slug)}
                  className="relative bg-slate-950 p-4 flex justify-center cursor-pointer overflow-hidden"
                >
                  <img
                    src={eb.coverUrl}
                    alt={eb.title}
                    className="w-44 aspect-[960/1360] object-cover rounded-xl border border-amber-400/50 shadow-xl group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-amber-400/50 text-amber-300 text-[10px] font-bold">
                    Vol. 0{eb.volumeNumber}
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold shadow">
                    R$ 19,90
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      🇧🇷 PT-BR + 🇬🇧 EN-GB no mesmo PDF
                    </div>
                    <h3
                      onClick={() => onNavigateSlug(eb.slug)}
                      className="text-sm sm:text-base font-serif font-bold text-stone-900 dark:text-white leading-snug cursor-pointer hover:text-teal-700 dark:hover:text-teal-300 line-clamp-3"
                    >
                      {eb.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-serif line-clamp-3">
                      {eb.subtitle}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-slate-700/70">
                    <button
                      type="button"
                      onClick={() => openEbookCartDrawer({ directBuySlug: eb.slug })}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Comprar Agora — R$ 19,90</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          addEbookToCart(eb.slug);
                        }}
                        className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border transition cursor-pointer ${
                          added
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-800 dark:text-teal-300'
                            : 'bg-stone-100 dark:bg-slate-700 border-stone-200 dark:border-slate-600 text-stone-800 dark:text-stone-200 hover:bg-stone-200'
                        }`}
                      >
                        {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{added ? 'No Carrinho' : 'Carrinho'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigateSlug(eb.slug)}
                        className="py-2 px-2.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:bg-stone-50 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Ver Página</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

