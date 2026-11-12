import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Copy,
  Sparkles,
  Shield,
  Feather,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  HeartHandshake,
  QrCode,
} from 'lucide-react';
import { fetchPublicPlans, createPixOrder } from '../services/api';

export default function SubscriptionModal({ isOpen, onClose, user, profile, onPlanUpdated, initialPlanId }) {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null); // Plano para checkout PIX
  const [copiedKey, setCopiedKey] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoadingPlans(true);
      fetchPublicPlans()
        .then((data) => {
          setPlans(data);
          if (data.length > 0) {
            const target = initialPlanId
              ? data.find((p) => p.id === initialPlanId) || data[0]
              : data.find((p) => p.id === 'pro_monthly') || data[0];
            setSelectedPlan(target);
          }
        })
        .catch((err) => {
          console.error('Erro ao carregar planos:', err);
        })
        .finally(() => setLoadingPlans(false));
    } else {
      setOrderSuccess(false);
      setErrorMessage('');
    }
  }, [isOpen, initialPlanId]);

  if (!isOpen) return null;

  const handleCopyPixKey = (key) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const handleConfirmPixPayment = async () => {
    if (!selectedPlan || !user) return;
    setSubmittingOrder(true);
    setErrorMessage('');

    try {
      await createPixOrder({
        planId: selectedPlan.id,
        userId: user.id,
        userEmail: user.email,
        userName: profile?.full_name || user.email?.split('@')[0] || '',
      });

      setOrderSuccess(true);
      if (onPlanUpdated) {
        onPlanUpdated();
      }
    } catch (err) {
      console.error('Erro ao registrar pedido PIX:', err);
      setErrorMessage(err.message || 'Falha ao registrar pedido. Entre em contato com o suporte.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const currentPlanId = profile?.plan_id || 'free';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-md pt-safe animate-fadeIn">
      <div className="relative w-full max-w-2xl p-6 sm:p-9 bg-stone-50 dark:bg-slate-900 border-t sm:border border-stone-200 dark:border-slate-800 rounded-t-3xl sm:rounded-4xl shadow-2xl text-stone-800 dark:text-stone-100 max-h-[92dvh] overflow-y-auto overscroll-contain pb-safe sm:pb-9">
        {/* Barra de Arraste visual (Mobile Native Pull-bar) */}
        <div className="w-12 h-1 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-200/50 dark:hover:bg-slate-800 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CABEÇALHO */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 mb-3 text-teal-800 dark:text-teal-400 shadow-sm">
            <Sparkles className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h2 className="text-xl sm:text-3xl font-serif font-medium tracking-tight text-stone-900 dark:text-stone-50">
            Plataforma Ilimitada
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1.5 font-serif max-w-md mx-auto leading-relaxed">
            Aprofunde sua jornada com voz neural realista, memória contínua e tranquilidade total para suas reflexões diárias.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SUCESSO DO PEDIDO PIX */}
        {orderSuccess ? (
          <div className="p-6 rounded-3xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-center space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-teal-700 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-teal-900 dark:text-teal-200">
              Solicitação de Ativação Registrada!
            </h3>
            <p className="text-xs sm:text-sm text-teal-800/90 dark:text-teal-300/90 leading-relaxed max-w-md mx-auto">
              Assim que o seu PIX de <strong>R$ {Number(selectedPlan?.price).toFixed(2).replace('.', ',')}</strong> for confirmado, seu refúgio ilimitado será ativado automaticamente.
            </p>
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-teal-200 dark:border-teal-900 text-xs text-stone-600 dark:text-stone-400">
              ⏳ <strong>Lembrete:</strong> A ativação pode demorar <strong>até 10 minutos</strong> após o pagamento. Enviamos a confirmação também para <strong>{user?.email}</strong>.
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold tracking-wide transition shadow-md shadow-teal-700/20"
            >
              Continuar Minhas Reflexões
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* SELETOR DE PLANOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loadingPlans ? (
                <div className="col-span-2 py-8 text-center text-xs text-stone-400">
                  Carregando refúgios disponíveis...
                </div>
              ) : (
                plans.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  const isCurrent = currentPlanId === plan.id;
                  const isAnnual = plan.billing_cycle === 'annual';

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`relative p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white dark:bg-slate-800 border-teal-600 ring-2 ring-teal-600/20 shadow-lg'
                          : 'bg-stone-100/60 dark:bg-slate-800/50 border-stone-200 dark:border-slate-700 hover:border-teal-500/50'
                      }`}
                    >
                      {isAnnual && (
                        <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-600 text-white shadow-sm">
                          Economia de 30%
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-serif font-medium text-base text-stone-900 dark:text-stone-100">
                            {plan.name}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 font-medium">
                              Seu Plano Atual
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 font-serif">
                          {plan.description}
                        </p>

                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-xs text-stone-400 font-medium">R$</span>
                          <span className="text-2xl sm:text-3xl font-serif font-semibold text-stone-900 dark:text-stone-50">
                            {Number(plan.price).toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-xs text-stone-500 dark:text-stone-400">
                            {isAnnual ? '/ano' : '/mês'}
                          </span>
                        </div>

                        <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-300 mb-4">
                          {(Array.isArray(plan.features) ? plan.features : []).map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-3 border-t border-stone-200/60 dark:border-slate-700/60">
                        <div
                          className={`w-full py-2.5 rounded-xl text-xs font-semibold text-center transition ${
                            isSelected
                              ? 'bg-teal-700 text-white shadow-sm'
                              : 'bg-stone-200/70 dark:bg-slate-700 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {isSelected ? 'Plano Selecionado' : 'Escolher este Plano'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* SEÇÃO DE PAGAMENTO EXCLUSIVO PIX */}
            {selectedPlan && (
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800 border border-teal-700/20 dark:border-teal-500/20 shadow-md space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100 dark:border-slate-700">
                  <QrCode className="w-5 h-5 text-teal-700 dark:text-teal-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      Pagamento via PIX ({selectedPlan.name})
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      Total a transferir: <strong className="text-teal-700 dark:text-teal-400">R$ {Number(selectedPlan.price).toFixed(2).replace('.', ',')}</strong>
                    </p>
                  </div>
                </div>

                {/* AVISO CRÍTICO DE ATIVAÇÃO EM ATÉ 10 MINUTOS */}
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Aviso Importante sobre a Ativação:</strong>
                    <p className="mt-0.5 text-[11px] text-amber-800/90 dark:text-amber-300/90">
                      {selectedPlan.activation_notice ||
                        'O pagamento é realizado exclusivamente via PIX. A ativação do plano pode demorar até 10 minutos após o pagamento para confirmação e liberação pelo sistema.'}
                    </p>
                  </div>
                </div>

                {/* DADOS DA CHAVE PIX */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                      Chave PIX Oficial ({selectedPlan.pix_key_type || 'Chave'})
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={selectedPlan.pix_key || 'suporte@lynxems.com.br'}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs font-mono font-medium text-stone-800 dark:text-stone-200 select-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyPixKey(selectedPlan.pix_key || 'suporte@lynxems.com.br')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shrink-0 ${
                          copiedKey
                            ? 'bg-teal-700 text-white'
                            : 'bg-stone-200 dark:bg-slate-700 hover:bg-stone-300 dark:hover:bg-slate-600 text-stone-800 dark:text-stone-200'
                        }`}
                      >
                        {copiedKey ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Chave</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {selectedPlan.pix_beneficiary && (
                    <div className="text-[11px] text-stone-500 dark:text-stone-400">
                      Favorecido / Titular: <strong className="text-stone-700 dark:text-stone-300">{selectedPlan.pix_beneficiary}</strong>
                    </div>
                  )}
                </div>

                {/* BOTÃO DE CONFIRMAÇÃO */}
                <button
                  type="button"
                  onClick={handleConfirmPixPayment}
                  disabled={submittingOrder}
                  className="w-full mt-2 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-medium text-xs tracking-wide shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 min-h-[44px]"
                >
                  <span>{submittingOrder ? 'Registrando pagamento...' : 'Já realizei o pagamento via PIX'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
