import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  MessageCircle,
  Mic,
  Sparkles,
  Copy,
  ExternalLink,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Phone,
  CreditCard,
  RefreshCw,
  LogIn,
} from 'lucide-react';
import {
  createAsaasWhatsappCheckout,
  fetchAsaasWhatsappPlanStatus,
  cancelAsaasWhatsappSubscription,
} from '../services/api';
import { formatPhoneMask } from './DirectSignupPage';

const ISAAC_WHATSAPP_WA_ME = 'https://wa.me/553175235531?text=Ol%C3%A1%2C%20Isaac!';
const OFFICIAL_ASAAS_MONTHLY_URL = 'https://www.asaas.com/000/c/ak85n2ouw2z6j6xv';

function formatCpfCnpjMask(raw) {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export default function WhatsappPlanModal({
  isOpen,
  onClose,
  user,
  profile,
  onProfileUpdated,
  onOpenAuth,
}) {
  const [phone, setPhone] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showAdminPaymentForm, setShowAdminPaymentForm] = useState(false);

  const adminWhatsappOverride = profile?.preferences?.whatsapp_admin_override || null;

  const isMaster =
    adminWhatsappOverride !== 'revoked' &&
    (profile?.role === 'master' ||
      String(user?.email || profile?.email || '').trim().toLowerCase() === 'edsonmanoel2012@gmail.com');

  const isMonthlySubValid =
    adminWhatsappOverride !== 'revoked' &&
    profile?.plan_id === 'whatsapp_monthly' &&
    profile?.plan_status === 'active' &&
    (!profile?.plan_expires_at || new Date(profile.plan_expires_at).getTime() > Date.now());

  const isManualAdminGrant = !isMaster && isMonthlySubValid && adminWhatsappOverride === 'granted';
  const hasAsaasSubscription = Boolean(profile?.asaas_subscription_id);

  const isPaidActive = Boolean(user) && (isMaster || isMonthlySubValid);

  const formattedMonthlyDueDate =
    !isMaster && profile?.plan_expires_at
      ? new Date(profile.plan_expires_at).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : null;

  useEffect(() => {
    if (isOpen) {
      setPhone(profile?.phone ? formatPhoneMask(profile.phone) : '');
      setCpfCnpj(profile?.cpf_cnpj ? formatCpfCnpjMask(profile.cpf_cnpj) : '');
      setErrorMsg('');
      setSuccessMsg('');
      setShowAdminPaymentForm(false);
    }
  }, [isOpen, profile]);

  // Polling automático a cada 6s enquanto aguarda confirmação do PIX / Cartão no Asaas
  useEffect(() => {
    if (!isOpen || !checkoutData || !user || isMonthlySubValid) return;

    const timer = setInterval(async () => {
      try {
        const st = await fetchAsaasWhatsappPlanStatus();
        if (st?.isActive) {
          setSuccessMsg('Pagamento confirmado! Sua conversa com o ISAAC no WhatsApp já está liberada!');
          if (onProfileUpdated) {
            onProfileUpdated({
              ...(profile || {}),
              phone,
              plan_id: 'whatsapp_monthly',
              plan_status: 'active',
              plan_expires_at: st.expiresAt,
            });
          }
          clearInterval(timer);
        }
      } catch {}
    }, 6000);

    return () => clearInterval(timer);
  }, [isOpen, checkoutData, user, isMonthlySubValid, profile, phone, onProfileUpdated]);

  if (!isOpen) return null;

  const handleGenerateCheckout = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      setLoadingCheckout(true);
      const data = await createAsaasWhatsappCheckout({
        phone,
        cpfCnpj,
      });
      setCheckoutData(data);

      if (data.alreadyActive) {
        setSuccessMsg('Sua assinatura já está ativa! Pode conversar com o ISAAC no WhatsApp.');
        if (onProfileUpdated) {
          onProfileUpdated({
            ...(profile || {}),
            phone,
            cpf_cnpj: cpfCnpj.replace(/\D/g, ''),
            plan_id: 'whatsapp_monthly',
            plan_status: 'active',
          });
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao iniciar assinatura.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleManualVerify = async () => {
    setErrorMsg('');
    try {
      setCheckingStatus(true);
      const st = await fetchAsaasWhatsappPlanStatus();
      if (st?.isActive) {
        setSuccessMsg('Assinatura confirmada com sucesso! O ISAAC já está pronto para conversar com você no WhatsApp.');
        if (onProfileUpdated) {
          onProfileUpdated({
            ...(profile || {}),
            phone,
            plan_id: 'whatsapp_monthly',
            plan_status: 'active',
            plan_expires_at: st.expiresAt,
          });
        }
      } else {
        setErrorMsg('Ainda aguardando a compensação pelo Asaas. Assim que o PIX/Cartão compensar, a liberação é imediata.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao verificar pagamento.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCopyPix = () => {
    if (!checkoutData?.pixCopyPaste) return;
    navigator.clipboard.writeText(checkoutData.pixCopyPaste);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Deseja cancelar a renovação mensal de R$ 14,99? Seu acesso ao App Web continuará 100% gratuito.')) {
      return;
    }
    try {
      setCancelling(true);
      await cancelAsaasWhatsappSubscription();
      setCheckoutData(null);
      setSuccessMsg('Assinatura WhatsApp cancelada. Você permanece no Plano Gratuito com tudo liberado no App Web.');
      if (onProfileUpdated) {
        onProfileUpdated({
          ...(profile || {}),
          plan_id: 'free',
          plan_status: 'free',
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao cancelar assinatura.');
    } finally {
      setCancelling(false);
    }
  };

  const renderPaymentSection = () => {
    if (!user) {
      return (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-emerald-500/40 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Opção de Pagamento do Plano Pago — R$ 14,99 / Vencimento Mensal (Asaas)</span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300">
            Entre na sua conta gratuita para vincular automaticamente o seu número de WhatsApp e gerar o QR Code PIX / Cartão pelo Asaas, ou acesse direto o link oficial da assinatura:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar / Criar Conta e Assinar</span>
              </button>
            )}
            <a
              href={OFFICIAL_ASAAS_MONTHLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3.5 px-4 rounded-2xl border border-emerald-600/50 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/70 text-emerald-800 dark:text-emerald-300 font-semibold text-xs transition flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Painel de Pagamento Asaas (R$ 14,99)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      );
    }

    if (checkoutData) {
      return (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-emerald-500/40 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
              <span>Painel de Pagamento Asaas — R$ 14,99 (Vencimento Mensal)</span>
            </div>
            <span className="text-[11px] text-stone-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
              Liberação automática via Webhook Asaas...
            </span>
          </div>

          <a
            href={checkoutData.invoiceUrl || OFFICIAL_ASAAS_MONTHLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
          >
            <CreditCard className="w-4 h-4" />
            <span>Abrir Painel de Pagamento Oficial Asaas (Cartão / PIX / Boleto)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {checkoutData.pixQrCodeBase64 && (
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-700 space-y-3">
              <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                Ou pague instantaneamente pelo QR Code PIX do Asaas abaixo:
              </span>
              <img
                src={`data:image/png;base64,${checkoutData.pixQrCodeBase64}`}
                alt="QR Code PIX Asaas"
                className="w-44 h-44 rounded-xl bg-white p-2 shadow-xs"
              />
              {checkoutData.pixCopyPaste && (
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPix ? 'Código PIX Copiado!' : 'Copiar Código PIX Asaas (Copia e Cola)'}</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={handleManualVerify}
              disabled={checkingStatus}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? 'animate-spin' : ''}`} />
              <span>Já paguei no Asaas, verificar liberação</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <form
        onSubmit={handleGenerateCheckout}
        className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-emerald-500/40 space-y-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-stone-100">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Opção de Pagamento — Plano Pago R$ 14,99/mês (Vencimento Mensal via Asaas)</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            PIX • Cartão • Boleto
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Seu Número de WhatsApp (com DDD) *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(formatPhoneMask(e.target.value))}
                placeholder="(31) 99999-9999"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-900 dark:text-stone-100 outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              CPF ou CNPJ (exigido pelo Asaas) *
            </label>
            <input
              type="text"
              required
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(formatCpfCnpjMask(e.target.value))}
              placeholder="000.000.000-00"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-900 dark:text-stone-100 outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="submit"
            disabled={loadingCheckout}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wide shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loadingCheckout ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando PIX / Fatura Asaas...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Gerar PIX ou Cartão (R$ 14,99/mês)</span>
              </>
            )}
          </button>

          <a
            href={OFFICIAL_ASAAS_MONTHLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl border border-emerald-600/50 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100/70 text-emerald-800 dark:text-emerald-300 font-semibold text-xs transition flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pagar pelo Link Oficial Asaas</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </form>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/65 backdrop-blur-md pt-safe animate-fadeIn">
      <div className="relative w-full max-w-3xl p-5 sm:p-8 bg-stone-50 dark:bg-slate-900 border-t sm:border border-stone-200 dark:border-slate-800 rounded-t-3xl sm:rounded-4xl shadow-2xl text-stone-800 dark:text-stone-100 max-h-[92dvh] overflow-y-auto overscroll-contain pb-safe sm:pb-8">
        <div className="w-12 h-1 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <button
          type="button"
          aria-label="Fechar planos"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-200/50 dark:hover:bg-slate-800 transition cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CABEÇALHO */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-serif mb-2">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Planos da Plataforma ISAAC • O que está incluso</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-medium tracking-tight text-stone-900 dark:text-stone-50">
            Plano Gratuito vs Plano Pago (ISAAC no WhatsApp)
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xl mx-auto">
            O Plano Gratuito é 100% livre no App Web (sem Asaas). No Plano Pago mensal, você conversa em texto e áudio direto pelo WhatsApp com tudo sincronizado no App.
          </p>
        </div>

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* COMPARATIVO DOS 2 CARDS DE PLANOS + O QUE ESTÁ INCLUSO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* CARD 1: PLANO GRÁTIS (LIVRE, SEM ASAAS) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-base font-serif font-semibold text-stone-900 dark:text-stone-100">
                  Plano Gratuito
                </span>
                {user && !isPaidActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-stone-300">
                    Seu plano atual
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    100% Livre
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-1">
                R$ 0,00
                <span className="text-xs font-normal text-stone-400"> / sempre livre</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-3">
                Sem cartão de crédito e sem nenhum vínculo com o Asaas.
              </p>

              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2">
                O que está incluso no Plano Grátis:
              </div>
              <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-300">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Conversas ilimitadas em texto e voz no App Web</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Agente Orquestrador ISAAC + Mentores Especialistas</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Memória contínua de longo prazo (RAG) e sigilo total</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>Laboratório do Incômodo Criativo &amp; Áudio Ambiente 432Hz</span>
                </li>
                <li className="flex items-start gap-2 text-stone-400 dark:text-stone-500 pt-1 border-t border-stone-100 dark:border-slate-700/60">
                  <X className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Não inclui conversa com o ISAAC pelo WhatsApp</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CARD 2: PLANO PAGO — ISAAC NO WHATSAPP (R$ 14,99 MENSAL VIA ASAAS) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-emerald-50/90 to-teal-50/50 dark:from-emerald-950/40 dark:to-slate-800/90 border-2 border-emerald-500/70 dark:border-emerald-500/50 shadow-md flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-base font-serif font-semibold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Plano Pago • WhatsApp
                </span>
                {isPaidActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                    {isMaster
                      ? 'Vitalício SuperAdmin'
                      : isManualAdminGrant
                      ? 'Liberado pela Plataforma'
                      : 'Assinatura Ativa'}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                    Asaas Mensal
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                R$ 14,99
                <span className="text-xs font-normal text-stone-500 dark:text-stone-400"> / vencimento mensal</span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-300 mb-3">
                Cobrança mensal segura via Asaas (PIX, Cartão ou Boleto). Cancele quando quiser.
              </p>

              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-2">
                O que está incluso no Plano Pago:
              </div>
              <ul className="space-y-2 text-xs text-stone-700 dark:text-stone-200">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Tudo do Plano Gratuito</strong> liberado no App Web</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Conversa pelo WhatsApp em Texto</strong> orquestrada pelo ISAAC</span>
                </li>
                <li className="flex items-start gap-2">
                  <Mic className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Envie e receba Áudios no WhatsApp</strong> com voz neural realista</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Reconhecimento pelo telefone e histórico unificado no App</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Acompanhamento gentil de evolução pelo WhatsApp</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* SE JÁ ESTIVER ATIVO */}
        {isPaidActive ? (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-4 text-center">
              <div className="text-sm font-serif font-medium text-emerald-900 dark:text-emerald-200">
                {isMaster
                  ? 'Plano Completo Liberado (SuperAdmin — Sem necessidade de assinar)'
                  : isManualAdminGrant
                  ? 'Seu acesso ao ISAAC pelo WhatsApp (Texto e Áudio) foi liberado pela Administração!'
                  : 'Seu Plano Mensal do ISAAC pelo WhatsApp (Texto e Áudio) está ativo!'}
              </div>
              {formattedMonthlyDueDate ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                  <span>
                    {isManualAdminGrant ? `Acesso válido até: ${formattedMonthlyDueDate}` : `Próximo vencimento mensal: ${formattedMonthlyDueDate}`}
                  </span>
                </div>
              ) : isManualAdminGrant ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                  <span>Acesso vitalício liberado sem vencimento</span>
                </div>
              ) : null}
              <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md mx-auto">
                Seu número <strong>{profile?.phone || 'de celular'}</strong> já está habilitado para falar com o Agente Orquestrador ISAAC:
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
                <a
                  href={ISAAC_WHATSAPP_WA_ME}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Abrir Conversa no WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={OFFICIAL_ASAAS_MONTHLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-emerald-600/50 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-semibold text-xs transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Link Oficial de Pagamento Asaas (R$ 14,99/mês)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {isMaster ? (
                  <button
                    type="button"
                    onClick={() => setShowAdminPaymentForm((prev) => !prev)}
                    className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline px-3 py-1.5 font-medium cursor-pointer"
                  >
                    {showAdminPaymentForm
                      ? 'Ocultar gerador PIX/Cartão de clientes'
                      : 'Visualizar tela de pagamento que os assinantes veem'}
                  </button>
                ) : hasAsaasSubscription ? (
                  <button
                    type="button"
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                    className="text-xs text-stone-500 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400 underline px-3 py-2 cursor-pointer"
                  >
                    {cancelling ? 'Cancelando...' : 'Cancelar renovação mensal'}
                  </button>
                ) : null}
              </div>
            </div>

            {isMaster && showAdminPaymentForm && renderPaymentSection()}
          </div>
        ) : (
          renderPaymentSection()
        )}
      </div>
    </div>
  );
}
