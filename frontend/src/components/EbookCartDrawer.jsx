import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  X,
  Trash2,
  Sparkles,
  CheckCircle2,
  CreditCard,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Download,
  Mail,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Plus,
  BookOpen,
  ShieldCheck,
  Gift,
} from 'lucide-react';
import { useEbookCart, CART_OPEN_EVENT } from '../services/ebookCartStore';
import {
  fetchPublicEbooksStore,
  createEbookCheckoutOrder,
  fetchEbookOrderByToken,
  resendEbookOrderLink,
  getBuyerPdfDownloadUrl,
} from '../services/ebookStoreApi';

function formatBRL(val) {
  return Number(val || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatCpfCnpjMask(raw = '') {
  const digits = String(raw).replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export default function EbookCartDrawer({ user, profile, hideFloatingButton = false }) {
  const {
    cart,
    itemCount,
    totalAmount,
    addEbookToCart,
    removeEbookFromCart,
    activateCompleteBundleInCart,
    clearEbookCart,
  } = useEbookCart();

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout' | 'payment'
  const [catalog, setCatalog] = useState(null);

  // Checkout fields
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerCpfCnpj, setBuyerCpfCnpj] = useState('');

  // Order & Asaas state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeOrder, setActiveOrder] = useState(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [resendingChannel, setResendingChannel] = useState('');
  const [resendToast, setResendToast] = useState('');

  useEffect(() => {
    fetchPublicEbooksStore()
      .then((data) => setCatalog(data))
      .catch(() => {});
  }, []);

  // Prefill from logged-in user/profile
  useEffect(() => {
    if (profile?.full_name && !buyerName) setBuyerName(profile.full_name);
    if ((profile?.email || user?.email) && !buyerEmail) setBuyerEmail(profile?.email || user?.email);
    if (profile?.phone && !buyerPhone) setBuyerPhone(profile.phone);
    if (profile?.cpf_cnpj && !buyerCpfCnpj) setBuyerCpfCnpj(formatCpfCnpjMask(profile.cpf_cnpj));
  }, [user, profile]);

  useEffect(() => {
    const handleOpen = (evt) => {
      const requestedStep = evt?.detail?.step || 'cart';
      setErrorMsg('');
      setStep(requestedStep);
      setIsOpen(true);
    };
    window.addEventListener(CART_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(CART_OPEN_EVENT, handleOpen);
  }, []);

  // Auto-poll Asaas confirmation every 4.5s while awaiting payment
  useEffect(() => {
    if (!isOpen || step !== 'payment' || !activeOrder?.downloadToken || activeOrder.status === 'paid') {
      return undefined;
    }
    const timer = setInterval(async () => {
      try {
        const updated = await fetchEbookOrderByToken(activeOrder.downloadToken);
        if (updated) {
          setActiveOrder(updated);
          if (updated.status === 'paid') {
            clearEbookCart();
          }
        }
      } catch {}
    }, 4500);
    return () => clearInterval(timer);
  }, [isOpen, step, activeOrder?.downloadToken, activeOrder?.status, clearEbookCart]);

  const allEbooks = catalog?.ebooks || [];
  const bundleProduct = catalog?.bundle || {
    slug: 'colecao-completa',
    title: 'Coleção Completa ISAAC® Essential — Todos os 8 eBooks em 1 PDF Único',
    coverUrl: '/ebooks/covers/colecao-completa.jpg',
    price: 111.44,
    originalPrice: 159.2,
  };

  const selectedItemsDetailed = cart.isBundle
    ? [bundleProduct]
    : cart.slugs
        .map((s) => allEbooks.find((eb) => eb.slug === s || eb.id === s))
        .filter(Boolean);

  const missingEbooks = cart.isBundle
    ? []
    : allEbooks.filter((eb) => !cart.slugs.includes(eb.slug));

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setSubmitting(true);
      const createdOrder = await createEbookCheckoutOrder({
        items: cart.isBundle ? ['colecao-completa'] : cart.slugs,
        useCompleteBundlePromo: cart.isBundle,
        buyerName,
        buyerEmail,
        buyerPhone,
        buyerCpfCnpj,
      });
      setActiveOrder(createdOrder);
      setStep('payment');
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao criar cobrança no Asaas.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualCheckPayment = async () => {
    if (!activeOrder?.downloadToken) return;
    try {
      setCheckingPayment(true);
      const updated = await fetchEbookOrderByToken(activeOrder.downloadToken);
      if (updated) {
        setActiveOrder(updated);
        if (updated.status === 'paid') {
          clearEbookCart();
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Ainda aguardando compensação bancária.');
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleCopyPix = async () => {
    if (!activeOrder?.pixCopyPaste) return;
    try {
      await navigator.clipboard.writeText(activeOrder.pixCopyPaste);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    } catch {}
  };

  const handleResend = async (channel) => {
    if (!activeOrder?.downloadToken) return;
    try {
      setResendingChannel(channel);
      setResendToast('');
      const updated = await resendEbookOrderLink(activeOrder.downloadToken, { channel });
      setActiveOrder(updated);
      setResendToast(
        channel === 'whatsapp'
          ? 'Link enviado novamente para o seu WhatsApp!'
          : 'Link enviado novamente para o seu e-mail!'
      );
      setTimeout(() => setResendToast(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao reenviar link.');
    } finally {
      setResendingChannel('');
    }
  };

  return (
    <>
      {/* BOTÃO FLUTUANTE DO CARRINHO */}
      {!hideFloatingButton && itemCount > 0 && !isOpen && (
        <button
          type="button"
          onClick={() => {
            setStep('cart');
            setIsOpen(true);
          }}
          className="fixed bottom-24 md:bottom-6 right-4 sm:right-6 z-40 px-4 py-3 rounded-2xl bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 hover:from-teal-700 hover:to-emerald-600 text-white shadow-2xl shadow-teal-900/40 border border-amber-300/40 flex items-center gap-3 transition-all hover:scale-105 cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-amber-300" />
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center">
              {cart.isBundle ? '8' : itemCount}
            </span>
          </div>
          <div className="text-left leading-tight">
            <div className="text-[10px] uppercase tracking-wider text-teal-100 font-semibold">
              {cart.isBundle ? 'Coleção Completa (30% OFF)' : 'Seu Carrinho eBooks'}
            </div>
            <div className="text-xs sm:text-sm font-bold text-white">{formatBRL(totalAmount)}</div>
          </div>
        </button>
      )}

      {/* GAVETA LATERAL (DRAWER) */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />

          <aside className="relative z-10 w-full max-w-lg bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 h-full shadow-2xl border-l border-stone-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {/* CABEÇALHO DO DRAWER */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white border-b border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-serif font-semibold truncate">
                    {step === 'cart' && 'Seu Carrinho — Biblioteca ISAAC®'}
                    {step === 'checkout' && 'Checkout Direto Asaas & Dedicatória'}
                    {step === 'payment' &&
                      (activeOrder?.status === 'paid'
                        ? 'Pagamento Confirmado • Baixar PDF'
                        : 'Pagamento Seguro via Asaas')}
                  </h3>
                  <p className="text-[11px] text-amber-200/90 truncate">
                    Autor: Thiago Prata • Edição Bilíngue (PT-BR + EN-GB)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CORPO ROLÁVEL */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-200">
                  {errorMsg}
                </div>
              )}

              {/* PASSO 1: MONTAGEM DO CARRINHO */}
              {step === 'cart' && (
                <>
                  {itemCount === 0 ? (
                    <div className="text-center py-10 space-y-4">
                      <ShoppingBag className="w-12 h-12 text-stone-300 dark:text-slate-700 mx-auto" />
                      <div className="space-y-1">
                        <p className="text-base font-serif font-medium text-stone-800 dark:text-stone-200">
                          Seu carrinho ainda está vazio
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                          Escolha eBooks avulsos por R$ 19,90 cada ou aproveite todos os 8 volumes em um PDF único com 30% OFF.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => activateCompleteBundleInCart()}
                        className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Adicionar Coleção Completa (30% OFF — R$ 111,44)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedItemsDetailed.map((item) => (
                        <div
                          key={item.slug}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 flex items-center gap-3.5 shadow-xs"
                        >
                          <img
                            src={item.coverUrl}
                            alt={item.title}
                            className="w-14 h-20 object-cover rounded-lg border border-stone-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                              {item.isBundle || cart.isBundle
                                ? 'PDF Único Consolidado • 8 Volumes (PT + EN-GB)'
                                : `Volume 0${item.volumeNumber} • Bilíngue PT + EN-GB`}
                            </span>
                            <h4 className="text-xs sm:text-sm font-serif font-semibold text-stone-900 dark:text-white line-clamp-2 mt-0.5">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                {formatBRL(cart.isBundle ? 111.44 : 19.9)}
                              </span>
                              {cart.isBundle && (
                                <span className="text-[11px] line-through text-stone-400">
                                  R$ 159,20
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              removeEbookFromCart(cart.isBundle ? 'colecao-completa' : item.slug)
                            }
                            title="Remover do carrinho"
                            className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* BANNER INTELIGENTE DE UPGRADE PARA PACOTE COMPLETO 30% OFF */}
                  {!cart.isBundle && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-amber-100/70 to-orange-50 dark:from-amber-950/40 dark:via-slate-800 dark:to-slate-800 border-2 border-amber-400/70 dark:border-amber-500/50 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                          <Sparkles className="w-3 h-3" />
                          Promoção 30% de Desconto
                        </span>
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                          De R$ 159,20 por R$ 111,44
                        </span>
                      </div>
                      <p className="text-xs font-serif text-stone-800 dark:text-stone-200 leading-relaxed">
                        {totalAmount >= 99.5
                          ? '💡 Seu carrinho já está quase no valor da Coleção Completa! Leve TODOS os 8 eBooks reunidos em 1 Arquivo Único PDF Bilíngue com 30% OFF!'
                          : 'Leve todos os 8 eBooks de Thiago Prata em um Arquivo Único em PDF (Português + Inglês Britânico) economizando R$ 47,76.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => activateCompleteBundleInCart()}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Gift className="w-4 h-4" />
                        <span>Trocar pelo Pacote Completo em PDF Único (R$ 111,44)</span>
                      </button>
                    </div>
                  )}

                  {/* ADICIONAR RAPIDAMENTE OUTROS VOLUMES AO CARRINHO */}
                  {missingEbooks.length > 0 && (
                    <div className="pt-2 space-y-2.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        Adicionar mais volumes ao seu carrinho (R$ 19,90 cada):
                      </div>
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {missingEbooks.map((eb) => (
                          <div
                            key={eb.slug}
                            className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/70 flex items-center justify-between gap-2.5"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={eb.coverUrl}
                                alt={eb.title}
                                className="w-9 h-12 object-cover rounded border border-stone-200 dark:border-slate-700 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-[10px] font-semibold text-teal-700 dark:text-teal-400">
                                  Vol. 0{eb.volumeNumber} • R$ 19,90
                                </div>
                                <div className="text-xs font-serif text-stone-800 dark:text-stone-200 truncate">
                                  {eb.title}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => addEbookToCart(eb.slug)}
                              className="px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Adicionar</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* PASSO 2: FORMULÁRIO DE COMPRA DIRETA ASAAS + DEDICATÓRIA */}
              {step === 'checkout' && (
                <form id="ebook-asaas-checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="text-xs text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar e revisar itens ({formatBRL(totalAmount)})</span>
                  </button>

                  <div className="p-3.5 rounded-2xl bg-teal-50/90 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/70 space-y-1">
                    <div className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Dedicatória Personalizada na Margem Inferior do PDF</span>
                    </div>
                    <p className="text-[11px] text-teal-800/90 dark:text-teal-300/90 leading-relaxed">
                      Ao confirmar o pagamento, o seu PDF Bilíngue (Português + Inglês Britânico) será gerado com uma dedicatória especial em seu nome no rodapé das páginas, assinado pelo autor <strong>Thiago Prata</strong>, e enviado para seu <strong>E-mail</strong> e <strong>WhatsApp</strong>!
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-200 mb-1">
                        Nome Completo (para a dedicatória no PDF) *
                      </label>
                      <input
                        type="text"
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Ex: Maria Clara Oliveira"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-200 mb-1">
                        E-mail para receber o Link de Download *
                      </label>
                      <input
                        type="email"
                        required
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-200 mb-1">
                        Celular / WhatsApp (receba o link também no celular)
                      </label>
                      <input
                        type="tel"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="Ex: (31) 99999-9999 ou +44 7700 900077"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-200 mb-1">
                        CPF ou CNPJ (exigido pelo Asaas para emissão) *
                      </label>
                      <input
                        type="text"
                        required
                        value={buyerCpfCnpj}
                        onChange={(e) => setBuyerCpfCnpj(formatCpfCnpjMask(e.target.value))}
                        placeholder="000.000.000-00"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-600 dark:text-stone-300">
                      <span>Resumo do Pedido:</span>
                      <span className="font-semibold">
                        {cart.isBundle ? 'Coleção Completa (8 em 1 PDF)' : `${itemCount} volume(s)`}
                      </span>
                    </div>
                    {cart.isBundle && (
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                        <span>Desconto Promocional (30% OFF):</span>
                        <span>- R$ 47,76</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-stone-900 dark:text-white pt-1.5 border-t border-stone-200 dark:border-slate-700">
                      <span>Total a Pagar via Asaas:</span>
                      <span className="text-teal-700 dark:text-teal-400">{formatBRL(totalAmount)}</span>
                    </div>
                  </div>
                </form>
              )}

              {/* PASSO 3: PAGAMENTO ASAAS EM TEMPO REAL OU DOWNLOAD LIBERADO */}
              {step === 'payment' && activeOrder && (
                <div className="space-y-4">
                  {activeOrder.status === 'paid' ? (
                    <div className="space-y-4">
                      <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-center space-y-2 shadow-lg">
                        <CheckCircle2 className="w-11 h-11 mx-auto text-amber-300" />
                        <h4 className="text-lg font-serif font-bold">
                          Pagamento Confirmado! Seu PDF está pronto.
                        </h4>
                        <p className="text-xs text-emerald-50 leading-relaxed">
                          Exemplar dedicado especialmente a <strong>{activeOrder.buyerName}</strong> na margem inferior das páginas. O link também foi enviado para seu e-mail{activeOrder.buyerPhone ? ' e WhatsApp' : ''}!
                        </p>
                      </div>

                      {resendToast && (
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 text-center font-medium">
                          {resendToast}
                        </div>
                      )}

                      <div className="space-y-2.5">
                        <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                          Baixar Seu(s) Arquivo(s) PDF Bilíngue (PT-BR + EN-GB):
                        </div>
                        {(activeOrder.downloadableItems || []).map((item) => (
                          <a
                            key={item.slug}
                            href={getBuyerPdfDownloadUrl(activeOrder.downloadToken, item.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                              item.isPrimaryBundlePdf
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500/60 shadow-sm'
                                : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 hover:border-teal-600'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={item.coverUrl}
                                alt={item.title}
                                className="w-10 h-14 object-cover rounded border border-stone-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold uppercase text-teal-700 dark:text-teal-400">
                                  {item.isPrimaryBundlePdf
                                    ? '★ Arquivo Único Completo (8 eBooks em 1 PDF)'
                                    : `Volume 0${item.volumeNumber || ''} Individual`}
                                </div>
                                <div className="text-xs font-serif font-semibold text-stone-900 dark:text-white line-clamp-1">
                                  {item.title}
                                </div>
                              </div>
                            </div>
                            <span className="px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0">
                              <Download className="w-3.5 h-3.5" />
                              <span>Baixar</span>
                            </span>
                          </a>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        <button
                          type="button"
                          disabled={Boolean(resendingChannel)}
                          onClick={() => handleResend('email')}
                          className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-stone-100 cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5 text-teal-700" />
                          <span>Reenviar p/ E-mail</span>
                        </button>
                        {activeOrder.buyerPhone && (
                          <button
                            type="button"
                            disabled={Boolean(resendingChannel)}
                            onClick={() => handleResend('whatsapp')}
                            className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-stone-100 cursor-pointer"
                          >
                            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Reenviar p/ WhatsApp</span>
                          </button>
                        )}
                      </div>

                      <a
                        href={`/meus-ebooks/${activeOrder.downloadToken}`}
                        className="block text-center text-xs text-teal-700 dark:text-teal-400 underline pt-1"
                      >
                        Abrir Página Permanente do Meu Pedido
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-bold uppercase text-amber-800 dark:text-amber-300">
                            Aguardando Confirmação Asaas
                          </div>
                          <div className="text-xs text-stone-600 dark:text-stone-300">
                            Assim que pagar, esta tela libera o PDF automaticamente e envia no seu e-mail/celular!
                          </div>
                        </div>
                        <span className="text-base font-bold text-teal-800 dark:text-teal-300 shrink-0">
                          {formatBRL(activeOrder.totalAmount)}
                        </span>
                      </div>

                      {/* LINK DIRETO OFICIAL DO ASAAS (CARTÃO / PIX / BOLETO) */}
                      {activeOrder.invoiceUrl && (
                        <a
                          href={activeOrder.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Abrir Link de Venda Direta Asaas (PIX, Cartão ou Boleto)</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      {/* QR CODE PIX DIRETO NA TELA */}
                      {activeOrder.pixQrCodeBase64 && (
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-center space-y-3">
                          <div className="text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center justify-center gap-1.5">
                            <QrCode className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                            <span>Ou pague instantaneamente via PIX QR Code:</span>
                          </div>
                          <img
                            src={`data:image/png;base64,${activeOrder.pixQrCodeBase64}`}
                            alt="QR Code PIX Asaas"
                            className="w-44 h-44 mx-auto rounded-xl border border-stone-200 p-2 bg-white"
                          />
                          {activeOrder.pixCopyPaste && (
                            <button
                              type="button"
                              onClick={handleCopyPix}
                              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-teal-700 dark:hover:bg-teal-600 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                            >
                              {copiedPix ? (
                                <>
                                  <Check className="w-4 h-4 text-emerald-400" />
                                  <span>Código PIX Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  <span>Copiar Código PIX Copia e Cola</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleManualCheckPayment}
                        disabled={checkingPayment}
                        className="w-full py-3 rounded-xl border border-teal-600/40 bg-teal-50/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-teal-100/70 transition cursor-pointer"
                      >
                        {checkingPayment ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                        <span>Já realizei o pagamento — Verificar Liberação Agora</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RODAPÉ DE AÇÃO DO DRAWER */}
            {step === 'cart' && itemCount > 0 && (
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-stone-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-600 dark:text-stone-300 font-serif">Total do Carrinho:</span>
                  <span className="text-lg font-bold text-teal-800 dark:text-teal-300">
                    {formatBRL(totalAmount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-700/25 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Finalizar Compra Direta via Asaas</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 'checkout' && (
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-stone-200 dark:border-slate-800">
                <button
                  type="submit"
                  form="ebook-asaas-checkout-form"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gerando Link Direto &amp; PIX no Asaas...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Gerar Pagamento Asaas ({formatBRL(totalAmount)})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

