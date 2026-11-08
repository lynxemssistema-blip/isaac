import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Users,
  Link2,
} from 'lucide-react';
import { fetchAdminAsaasOverview, updateAdminAsaasPlanApi } from '../services/adminApi';

export default function AdminAsaasPanel({ currentUser }) {
  const isSuperAdmin =
    currentUser?.role === 'master' ||
    String(currentUser?.email || '').trim().toLowerCase() === 'edsonmanoel2012@gmail.com';

  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [overview, setOverview] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: 'ISAAC no WhatsApp (Texto e Áudio)',
    price: '14.99',
    description: '',
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminAsaasOverview();
      setOverview(data);

      const paidPlan = (data?.plans || []).find((p) => p.id === 'whatsapp_monthly');
      if (paidPlan) {
        setPlanForm({
          name: paidPlan.name || 'ISAAC no WhatsApp (Texto e Áudio)',
          price: String(paidPlan.price ?? '14.99'),
          description: paidPlan.description || '',
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Erro ao carregar dados do Asaas.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleSavePaidPlan = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      setSavingPlan(true);
      await updateAdminAsaasPlanApi(planForm);
      setFeedback({
        type: 'success',
        text: 'Plano Mensal atualizado e sincronizado diretamente com o Asaas v3!',
      });
      await loadOverview();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Falha ao sincronizar plano no Asaas.' });
    } finally {
      setSavingPlan(false);
    }
  };

  const handleCopyAsaasLink = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  if (loading && !overview) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-stone-500 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="text-xs font-serif">Conectando ao Painel Oficial Asaas v3...</span>
      </div>
    );
  }

  const integration = overview?.integration || {};
  const revenueSummary = overview?.revenueSummary || {};
  const orders = overview?.orders || [];
  const subscribers = overview?.subscribersAndMasters || [];
  const groupLabel = integration.customerGroup || 'Isaac';

  const formatBrl = (v) =>
    Number(v || 0)
      .toFixed(2)
      .replace('.', ',');

  return (
    <div className="space-y-6 animate-fadeIn">
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 1. CABEÇALHO DE CONEXÃO COM A CONTA ASAAS V3 */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800 border border-emerald-200/80 dark:border-emerald-800/50 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-serif font-semibold text-stone-900 dark:text-stone-100">
                  Gateway de Pagamentos Oficial — Asaas v3
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    integration.configured
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-700 border border-rose-500/30'
                  }`}
                >
                  {integration.configured ? '● Conectado em Produção' : 'Chave Ausente'}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Conta: <strong>{integration.account?.companyName || 'EMS SOLUCOES E SISTEMAS'}</strong> • Grupo de Clientes:{' '}
                <strong className="text-emerald-700 dark:text-emerald-400">{integration.customerGroup || 'Isaac'}</strong> • Webhook:{' '}
                <code className="text-[11px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-900">
                  {integration.webhook?.url || integration.webhookEndpoint}
                </code>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadOverview}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 self-start sm:self-auto transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sincronizar Asaas</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Clientes Isolados (Grupo {groupLabel})
            </div>
            <div className="text-lg font-serif font-bold text-stone-900 dark:text-stone-50 mt-0.5">
              {integration.isaacGroupCustomerCount ?? 0} cadastro(s)
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400">
              Separado 100% de outros grupos no Asaas
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
              Receita eBooks ({groupLabel})
            </div>
            <div className="text-lg font-serif font-bold text-indigo-800 dark:text-indigo-300 mt-0.5">
              R$ {formatBrl(revenueSummary.ebookPaidRevenue)}
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400">
              {revenueSummary.ebookPaidCount || 0} venda(s) confirmada(s)
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
              Receita Plano WhatsApp ({groupLabel})
            </div>
            <div className="text-lg font-serif font-bold text-teal-800 dark:text-teal-300 mt-0.5">
              R$ {formatBrl(revenueSummary.subscriptionPaidRevenue)}
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400">
              {revenueSummary.subscriptionPaidCount || 0} assinatura(s) paga(s)
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Receita Total Consolidada ({groupLabel})
            </div>
            <div className="text-lg font-serif font-bold text-amber-900 dark:text-amber-200 mt-0.5">
              R$ {formatBrl(revenueSummary.totalPaidRevenue)}
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400">
              Em aberto: R$ {formatBrl(revenueSummary.totalPendingRevenue)}
            </div>
          </div>
        </div>

        <div className="px-3.5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-900 dark:text-emerald-200">
          <strong>Regra de Isolamento Financeiro Ativa:</strong> mesmo que o comprador já tenha CPF cadastrado no Asaas em outros grupos (ex: <code>horeb</code> ou <code>lynxems</code>), o sistema cria e utiliza um cadastro <code>cus_...</code> exclusivo no grupo <strong>{groupLabel}</strong>, mantendo clientes e receitas 100% separados por grupo.
        </div>

        {integration.asaasPlanLinkUrl && (
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/70 border border-stone-200/80 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Link Oficial do Plano Mensal Associado no Asaas (ID: {integration.asaasPlanLinkId}):</span>
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate mt-0.5">
                {integration.asaasPlanLinkUrl}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyAsaasLink(integration.asaasPlanLinkUrl)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado!' : 'Copiar Link Asaas'}</span>
              </button>
              <a
                href={integration.asaasPlanLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs font-medium text-stone-700 dark:text-stone-200 flex items-center gap-1.5 hover:bg-stone-100 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver no Asaas</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 2. CONFIGURAÇÃO DOS DOIS PLANOS OFICIAIS + REGRA SUPERADMIN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* PLANO GRATUITO (LIVRE SEM ASAAS) + REGRA SUPERADMIN */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-serif font-semibold text-stone-900 dark:text-stone-100">
                1. Plano Gratuito (App Web)
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 dark:bg-slate-700 text-stone-700 dark:text-stone-300">
                Livre • Sem vínculo Asaas
              </span>
            </div>
            <div className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-50">
              R$ 0,00 <span className="text-xs font-normal text-stone-400">/ livre para todos</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Todos os recursos internos do App Web liberados gratuitamente, <strong>sem criar cadastro ou cobrança no Asaas</strong>. Não inclui conversa com o agente pelo WhatsApp.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 space-y-1">
            <div className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>SuperAdmin Vitalício (Isento de Assinatura)</span>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-200/80">
              A conta SuperAdmin (<strong>edsonmanoel2012@gmail.com</strong>) já possui o Plano Completo (App + WhatsApp Texto e Áudio) ativo permanentemente sem vencimento e sem necessidade de assinar.
            </p>
          </div>
        </div>

        {/* PLANO PAGO MENSAL ASSOCIADO AO ASAAS */}
        <form
          onSubmit={handleSavePaidPlan}
          className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800 border-2 border-emerald-500/40 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-serif font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>2. Plano Pago (Associado ao Asaas)</span>
            </h4>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              Ciclo Mensal (MONTHLY)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Nome do Plano no App e Asaas
              </label>
              <input
                type="text"
                required
                disabled={!isSuperAdmin}
                value={planForm.name}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-900 dark:text-stone-100 outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Valor Mensal (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="5"
                required
                disabled={!isSuperAdmin}
                value={planForm.price}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, price: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs font-semibold text-emerald-700 dark:text-emerald-300 outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Descrição sincronizada com o Asaas
            </label>
            <textarea
              rows={2}
              disabled={!isSuperAdmin}
              value={planForm.description}
              onChange={(e) => setPlanForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs text-stone-900 dark:text-stone-100 outline-none focus:border-emerald-600"
            />
          </div>

          {isSuperAdmin && (
            <button
              type="submit"
              disabled={savingPlan}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
            >
              {savingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Salvar e Sincronizar Plano Mensal com o Asaas</span>
            </button>
          )}
        </form>
      </div>

      {/* 3. ASSINANTES COM ACESSO WHATSAPP ATIVO + HISTÓRICO DE COBRANÇAS ASAAS */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-serif font-semibold text-stone-900 dark:text-stone-100">
              Painel de Pagamentos & Assinaturas Asaas ({orders.length} cobrança{orders.length === 1 ? '' : 's'})
            </h4>
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400">
            Contas com WhatsApp liberado hoje: <strong>{subscribers.length}</strong>
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 rounded-2xl bg-stone-50 dark:bg-slate-900/50 border border-dashed border-stone-200 dark:border-slate-700 text-center text-xs text-stone-500 dark:text-stone-400">
            Nenhuma cobrança gerada ainda no Asaas. Assim que o primeiro membro optar pelo Plano Mensal de R$ 14,99, os pagamentos e faturas do Asaas aparecerão automaticamente aqui.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-stone-200/80 dark:border-slate-700">
            <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
              <thead className="bg-stone-100/80 dark:bg-slate-900 uppercase text-[10px] text-stone-500 font-semibold border-b border-stone-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5">Cliente (Grupo {groupLabel})</th>
                  <th className="p-3.5">Produto / Origem</th>
                  <th className="p-3.5">Valor</th>
                  <th className="p-3.5">Status Asaas</th>
                  <th className="p-3.5">Data</th>
                  <th className="p-3.5 text-right">Fatura Asaas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60 dark:divide-slate-700/60">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/70 dark:hover:bg-slate-800/60">
                    <td className="p-3.5">
                      <div className="font-medium text-stone-900 dark:text-stone-100">{ord.user_name || 'Cliente'}</div>
                      <div className="text-[11px] text-stone-400">{ord.user_email}</div>
                      {ord.asaas_customer_id && (
                        <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                          {ord.asaas_customer_id} • Grupo {groupLabel}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium">{ord.product_title || 'ISAAC no WhatsApp'}</span>
                      <div className="text-[10px] text-stone-400">{ord.cycle_label || 'Vencimento Mensal'}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-emerald-700 dark:text-emerald-400">
                      R$ {Number(ord.amount || 14.99).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : ord.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {ord.status === 'active' ? 'Pago / Ativo' : ord.status === 'pending' ? 'Aguardando Pagamento' : ord.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-[11px] text-stone-500">
                      {ord.created_at ? new Date(ord.created_at).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-3.5 text-right">
                      {ord.invoice_url ? (
                        <a
                          href={ord.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] transition"
                        >
                          <span>Abrir no Asaas</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-stone-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

