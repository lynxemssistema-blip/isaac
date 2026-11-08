import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  Clock,
  Mail,
  Smartphone,
  BookOpen,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  Loader2,
  QrCode,
  Copy,
  Check,
  CreditCard,
} from 'lucide-react';
import {
  fetchEbookOrderByToken,
  resendEbookOrderLink,
  getBuyerPdfDownloadUrl,
} from '../services/ebookStoreApi';

export default function EbookDownloadPage({ token, onBackToHome, onOpenStore }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendPhone, setResendPhone] = useState('');
  const [resending, setResending] = useState('');
  const [toast, setToast] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);

  const loadOrder = async () => {
    try {
      const data = await fetchEbookOrderByToken(token);
      setOrder(data);
      if (data?.buyerEmail && !resendEmail) setResendEmail(data.buyerEmail);
      if (data?.buyerPhone && !resendPhone) setResendPhone(data.buyerPhone);
      setError('');
    } catch (err) {
      setError(err.message || 'Pedido não encontrado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [token]);

  useEffect(() => {
    if (!order || order.status === 'paid') return undefined;
    const interval = setInterval(() => {
      loadOrder();
    }, 5000);
    return () => clearInterval(interval);
  }, [order?.status, token]);

  const handleResend = async (channel) => {
    try {
      setResending(channel);
      setToast('');
      const updated = await resendEbookOrderLink(token, {
        channel,
        email: resendEmail,
        phone: resendPhone,
      });
      setOrder(updated);
      setToast(
        channel === 'whatsapp'
          ? 'Link de download enviado para o WhatsApp informado!'
          : 'Link de download enviado para o e-mail informado!'
      );
      setTimeout(() => setToast(''), 4500);
    } catch (err) {
      setError(err.message || 'Erro ao reenviar link.');
    } finally {
      setResending('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="w-9 h-9 text-teal-700 dark:text-teal-400 animate-spin" />
        <p className="text-sm font-serif text-stone-600 dark:text-stone-300">
          Verificando seu exemplar personalizado da Mentoria ISAAC®...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* BARRA SUPERIOR */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs font-medium flex items-center gap-2 hover:bg-stone-100 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao App ISAAC®</span>
          </button>

          <button
            type="button"
            onClick={onOpenStore}
            className="px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold flex items-center gap-2 hover:bg-teal-100 transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Ver Biblioteca Completa de eBooks</span>
          </button>
        </div>

        {error && !order ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 text-center space-y-3">
            <h1 className="text-xl font-serif font-semibold text-rose-700 dark:text-rose-300">
              Link de Download Não Encontrado
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-300">{error}</p>
          </div>
        ) : order?.status === 'paid' ? (
          <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 shadow-xl space-y-7">
            {/* BANNER DE BOAS-VINDAS */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white border border-amber-500/40 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pagamento Confirmado • Edição Dedicada Exclusiva</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-semibold">
                Parabéns, {order.buyerName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 font-serif leading-relaxed">
                Cada arquivo PDF abaixo contém a <strong>Edição Bilíngue Completa (Português + Inglês Britânico no mesmo exemplar)</strong>, ilustrações exclusivas, linhas de anotações e uma <strong>dedicatória especial para {order.buyerName} impressa na margem inferior das páginas</strong>, assinada por <strong>Thiago Prata</strong>.
              </p>
            </div>

            {toast && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                {toast}
              </div>
            )}

            {/* LISTA DE DOWNLOADS */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Clique abaixo para baixar seu(s) PDF(s) personalizado(s):
              </h2>

              {(order.downloadableItems || []).map((item) => (
                <div
                  key={item.slug}
                  className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    item.isPrimaryBundlePdf
                      ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50/60 dark:from-amber-950/35 dark:via-slate-800 dark:to-slate-800 border-2 border-amber-400 dark:border-amber-500/70 shadow-md'
                      : 'bg-stone-50/80 dark:bg-slate-900/60 border-stone-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      className="w-16 h-22 object-cover rounded-xl border border-stone-300 dark:border-slate-600 shadow-sm shrink-0"
                    />
                    <div className="min-w-0 space-y-1">
                      <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                        {item.isPrimaryBundlePdf
                          ? '★ Arquivo Único Consolidado • Todos os 8 eBooks Bilíngues'
                          : `Volume 0${item.volumeNumber || ''} • Edição Bilíngue (PT-BR + EN-GB)`}
                      </span>
                      <h3 className="text-sm sm:text-base font-serif font-bold text-stone-900 dark:text-white leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        Autor: Thiago Prata • Dedicado a {order.buyerName}
                      </p>
                    </div>
                  </div>

                  <a
                    href={getBuyerPdfDownloadUrl(order.downloadToken, item.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar PDF Dedicado</span>
                  </a>
                </div>
              ))}
            </div>

            {/* ENVIAR NOVAMENTE POR E-MAIL OU CELULAR (WHATSAPP) */}
            <div className="pt-5 border-t border-stone-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center gap-2 text-sm font-serif font-semibold text-stone-800 dark:text-stone-100">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Enviar seu Link de Download para E-mail ou Celular (WhatsApp)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs"
                  />
                  <button
                    type="button"
                    disabled={Boolean(resending)}
                    onClick={() => handleResend('email')}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{resending === 'email' ? 'Enviando...' : 'Enviar Link por E-mail'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="tel"
                    value={resendPhone}
                    onChange={(e) => setResendPhone(e.target.value)}
                    placeholder="DDD + Celular WhatsApp"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs"
                  />
                  <button
                    type="button"
                    disabled={Boolean(resending) || !resendPhone.trim()}
                    onClick={() => handleResend('whatsapp')}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{resending === 'whatsapp' ? 'Enviando...' : 'Enviar Link no WhatsApp'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* AUTOR THIAGO PRATA */}
            <div className="p-4 rounded-2xl bg-stone-100/80 dark:bg-slate-900/70 border border-stone-200 dark:border-slate-700 flex items-center gap-4">
              <img
                src="/ebooks/thiago-prata.jpg"
                alt="Thiago Prata"
                className="w-14 h-14 rounded-full object-cover border-2 border-amber-500 shrink-0"
              />
              <div>
                <div className="text-sm font-serif font-bold text-stone-900 dark:text-white">
                  Thiago Prata
                </div>
                <div className="text-xs text-teal-700 dark:text-teal-400">
                  Mentor em Projetos e Negócios • Idealizador da Metodologia e do App ISAAC®
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* PEDIDO AINDA AGUARDANDO COMPENSAÇÃO NO ASAAS */
          <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 shadow-xl space-y-6 text-center">
            <Clock className="w-12 h-12 text-amber-500 mx-auto" />
            <div className="space-y-2">
              <h1 className="text-2xl font-serif font-semibold text-stone-900 dark:text-white">
                Aguardando Confirmação de Pagamento
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-lg mx-auto">
                Olá, <strong>{order?.buyerName}</strong>! Assim que o Asaas confirmar o seu pagamento, esta página liberará automaticamente os botões de download do seu PDF dedicado.
              </p>
            </div>

            {order?.invoiceUrl && (
              <a
                href={order.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg"
              >
                <CreditCard className="w-4 h-4" />
                <span>Concluir Pagamento no Link Direto Asaas</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {order?.pixQrCodeBase64 && (
              <div className="max-w-xs mx-auto p-4 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 space-y-3">
                <div className="text-xs font-semibold flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4 text-teal-700" />
                  <span>PIX QR Code Imediato</span>
                </div>
                <img
                  src={`data:image/png;base64,${order.pixQrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-44 h-44 mx-auto bg-white p-2 rounded-xl border"
                />
                {order.pixCopyPaste && (
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(order.pixCopyPaste);
                      setCopiedPix(true);
                      setTimeout(() => setCopiedPix(false), 3000);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-stone-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedPix ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPix ? 'Copiado!' : 'Copiar PIX Copia e Cola'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

