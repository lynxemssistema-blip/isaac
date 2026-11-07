import { supabaseAdmin } from '../config/supabase.js';
import { invalidateAuthCache } from '../middlewares/authMiddleware.js';
import { sendWhatsAppTextSafe, resolveWhatsAppJid, isEvolutionEnabledInDatabase } from './evolutionService.js';

const DEFAULT_ASAAS_URL = 'https://api.asaas.com/v3';
const DEFAULT_CUSTOMER_GROUP = 'Isaac';
const WHATSAPP_PLAN_ID = 'whatsapp_monthly';
const WHATSAPP_PLAN_PRICE = 14.99;

function getAsaasConfig() {
  let rawKey = (process.env.ASAAS_API_KEY || '').trim();
  // Proteção contra eventual remoção de '$' inicial por shells/containers
  if (rawKey && !rawKey.startsWith('$') && rawKey.startsWith('aact_')) {
    rawKey = `$${rawKey}`;
  }
  return {
    baseUrl: (process.env.ASAAS_API_URL || DEFAULT_ASAAS_URL).replace(/\/$/, ''),
    apiKey: rawKey,
    customerGroup: (process.env.ASAAS_CUSTOMER_GROUP || DEFAULT_CUSTOMER_GROUP).trim(),
    webhookToken: (process.env.ASAAS_WEBHOOK_TOKEN || '').trim(),
  };
}

function getTodayBrtDateString() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

export function sanitizeCpfCnpj(raw) {
  return String(raw || '').replace(/\D/g, '');
}

export function sanitizeBrazilMobileForAsaas(rawPhone) {
  let digits = String(rawPhone || '').replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0') && digits.length >= 11) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    digits = `${digits.slice(0, 2)}9${digits.slice(2)}`;
  }
  return digits.slice(0, 11);
}

async function asaasRequest(path, { method = 'GET', body = null } = {}) {
  const cfg = getAsaasConfig();
  if (!cfg.apiKey) {
    throw new Error('ASAAS_API_KEY não configurada no servidor.');
  }

  const resp = await fetch(`${cfg.baseUrl}${path}`, {
    method,
    headers: {
      access_token: cfg.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'IsaacMentoria/1.0',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const firstError = data?.errors?.[0]?.description || data?.message || `HTTP ${resp.status}`;
    throw new Error(firstError);
  }
  return data;
}

/**
 * Cria ou atualiza o cliente no Asaas exclusivamente quando ele contrata o Plano WhatsApp (R$ 14,99),
 * sempre vinculando ao grupo de clientes "Isaac" e externalReference "isaac:<userId>".
 */
export async function ensureAsaasCustomer({ userId, fullName, email, phone, cpfCnpj }) {
  const cfg = getAsaasConfig();
  const cleanCpfCnpj = sanitizeCpfCnpj(cpfCnpj);
  if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
    throw new Error('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido para emitir a assinatura.');
  }

  const mobilePhone = sanitizeBrazilMobileForAsaas(phone);
  const externalReference = `isaac:${userId}`;

  const { data: profile } = await supabaseAdmin
    .from('izaque_profiles')
    .select('asaas_customer_id')
    .eq('id', userId)
    .maybeSingle();

  let customerId = profile?.asaas_customer_id || null;

  if (!customerId) {
    const byExt = await asaasRequest(`/customers?externalReference=${encodeURIComponent(externalReference)}&limit=1`);
    if (Array.isArray(byExt?.data) && byExt.data[0]?.id) {
      customerId = byExt.data[0].id;
    }
  }

  if (!customerId) {
    const byCpf = await asaasRequest(`/customers?cpfCnpj=${encodeURIComponent(cleanCpfCnpj)}&limit=1`);
    if (Array.isArray(byCpf?.data) && byCpf.data[0]?.id) {
      customerId = byCpf.data[0].id;
    }
  }

  const customerPayload = {
    name: (fullName || email?.split('@')[0] || 'Membro ISAAC').trim(),
    email: email ? email.trim().toLowerCase() : undefined,
    cpfCnpj: cleanCpfCnpj,
    mobilePhone: mobilePhone.length >= 10 ? mobilePhone : undefined,
    externalReference,
    groupName: cfg.customerGroup, // "Isaac"
    notificationDisabled: false,
  };

  let customer;
  if (customerId) {
    customer = await asaasRequest(`/customers/${encodeURIComponent(customerId)}`, {
      method: 'PUT',
      body: customerPayload,
    });
  } else {
    customer = await asaasRequest('/customers', {
      method: 'POST',
      body: customerPayload,
    });
  }

  return customer.id;
}

/**
 * Gera ou reaproveita a assinatura mensal de R$ 14,99 (Plano ISAAC no WhatsApp) no Asaas,
 * retornando o link da fatura (Cartão/PIX/Boleto) + QR Code PIX imediato.
 * O Plano Gratuito permanece 100% livre sem qualquer chamada ao Asaas.
 */
export async function createOrGetWhatsappSubscriptionCheckout({ userId, cpfCnpj, phone }) {
  const { data: profile, error: profErr } = await supabaseAdmin
    .from('izaque_profiles')
    .select('id, full_name, email, phone, cpf_cnpj, plan_id, plan_status, asaas_customer_id, asaas_subscription_id')
    .eq('id', userId)
    .single();

  if (profErr || !profile) {
    throw new Error('Perfil do usuário não encontrado.');
  }

  const finalPhone = String(phone || profile.phone || '').trim();
  if (finalPhone.replace(/\D/g, '').length < 10) {
    throw new Error('Informe seu número de WhatsApp com DDD para vincular a conversa com o ISAAC.');
  }

  const finalCpf = sanitizeCpfCnpj(cpfCnpj || profile.cpf_cnpj);
  if (finalCpf.length !== 11 && finalCpf.length !== 14) {
    throw new Error('Informe um CPF ou CNPJ válido para gerar a cobrança no Asaas.');
  }

  await supabaseAdmin
    .from('izaque_profiles')
    .update({
      phone: finalPhone,
      cpf_cnpj: finalCpf,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  const customerId = await ensureAsaasCustomer({
    userId,
    fullName: profile.full_name,
    email: profile.email,
    phone: finalPhone,
    cpfCnpj: finalCpf,
  });

  const externalReference = `isaac:${userId}`;
  let subscriptionId = profile.asaas_subscription_id || null;
  let activeSub = null;

  if (subscriptionId) {
    try {
      const existingSub = await asaasRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
      if (existingSub && existingSub.status === 'ACTIVE' && !existingSub.deleted) {
        activeSub = existingSub;
      }
    } catch {
      subscriptionId = null;
    }
  }

  if (!activeSub) {
    activeSub = await asaasRequest('/subscriptions', {
      method: 'POST',
      body: {
        customer: customerId,
        billingType: 'UNDEFINED',
        value: WHATSAPP_PLAN_PRICE,
        nextDueDate: getTodayBrtDateString(),
        cycle: 'MONTHLY',
        description: 'ISAAC no WhatsApp (Texto e Áudio) — Assinatura Mensal',
        externalReference,
      },
    });
    subscriptionId = activeSub.id;
  }

  const paymentsList = await asaasRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}/payments?limit=5`);
  const payments = Array.isArray(paymentsList?.data) ? paymentsList.data : [];
  const pendingOrLatestPayment =
    payments.find((p) => p.status === 'PENDING' || p.status === 'OVERDUE') || payments[0] || null;

  let pixQrCodeBase64 = null;
  let pixCopyPaste = null;

  if (pendingOrLatestPayment?.id) {
    try {
      const pixData = await asaasRequest(`/payments/${encodeURIComponent(pendingOrLatestPayment.id)}/pixQrCode`);
      pixQrCodeBase64 = pixData?.encodedImage || null;
      pixCopyPaste = pixData?.payload || null;
    } catch (pixErr) {
      console.warn('⚠️ [Asaas] Aviso ao obter QR Code PIX da cobrança:', pixErr.message);
    }
  }

  const isAlreadyPaid =
    pendingOrLatestPayment?.status === 'RECEIVED' || pendingOrLatestPayment?.status === 'CONFIRMED';

  const profileUpdates = {
    asaas_customer_id: customerId,
    asaas_subscription_id: subscriptionId,
    updated_at: new Date().toISOString(),
  };

  if (isAlreadyPaid) {
    profileUpdates.plan_id = WHATSAPP_PLAN_ID;
    profileUpdates.plan_status = 'active';
    profileUpdates.plan_activated_at = new Date().toISOString();
    profileUpdates.plan_expires_at = new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString();
  }

  await supabaseAdmin.from('izaque_profiles').update(profileUpdates).eq('id', userId);
  if (isAlreadyPaid) invalidateAuthCache();

  if (pendingOrLatestPayment?.id) {
    const { data: existingLocalOrder } = await supabaseAdmin
      .from('izaque_subscriptions')
      .select('id')
      .eq('asaas_payment_id', pendingOrLatestPayment.id)
      .maybeSingle();

    const orderPayload = {
      user_id: userId,
      user_email: (profile.email || '').toLowerCase(),
      user_name: profile.full_name || 'Membro ISAAC',
      plan_id: WHATSAPP_PLAN_ID,
      amount: WHATSAPP_PLAN_PRICE,
      status: isAlreadyPaid ? 'active' : 'pending',
      asaas_customer_id: customerId,
      asaas_subscription_id: subscriptionId,
      asaas_payment_id: pendingOrLatestPayment.id,
      billing_type: pendingOrLatestPayment.billingType || 'UNDEFINED',
      invoice_url: pendingOrLatestPayment.invoiceUrl || null,
      pix_qr_code_base64: pixQrCodeBase64,
      pix_copy_paste: pixCopyPaste,
      external_reference: externalReference,
      notes: 'Assinatura Asaas — Grupo Isaac (R$ 14,99/mês)',
    };

    if (existingLocalOrder?.id) {
      await supabaseAdmin.from('izaque_subscriptions').update(orderPayload).eq('id', existingLocalOrder.id);
    } else {
      await supabaseAdmin.from('izaque_subscriptions').insert(orderPayload);
    }
  }

  return {
    success: true,
    alreadyActive: isAlreadyPaid,
    planId: WHATSAPP_PLAN_ID,
    price: WHATSAPP_PLAN_PRICE,
    subscriptionId,
    paymentId: pendingOrLatestPayment?.id || null,
    paymentStatus: pendingOrLatestPayment?.status || 'PENDING',
    invoiceUrl: pendingOrLatestPayment?.invoiceUrl || null,
    pixQrCodeBase64,
    pixCopyPaste,
  };
}

/**
 * Sincroniza em tempo real o status da assinatura Asaas do usuário logado
 */
export async function syncUserWhatsappPlanStatus(userId) {
  const { data: profile } = await supabaseAdmin
    .from('izaque_profiles')
    .select('id, full_name, phone, plan_id, plan_status, plan_expires_at, asaas_subscription_id, whatsapp_opt_out')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    throw new Error('Perfil não encontrado.');
  }

  if (profile.plan_id === WHATSAPP_PLAN_ID && profile.plan_status === 'active') {
    return {
      isActive: true,
      planId: WHATSAPP_PLAN_ID,
      planStatus: 'active',
      expiresAt: profile.plan_expires_at,
    };
  }

  if (profile.asaas_subscription_id) {
    try {
      const paymentsList = await asaasRequest(
        `/subscriptions/${encodeURIComponent(profile.asaas_subscription_id)}/payments?limit=5`
      );
      const payments = Array.isArray(paymentsList?.data) ? paymentsList.data : [];
      const paidPayment = payments.find(
        (p) => p.status === 'RECEIVED' || p.status === 'CONFIRMED' || p.status === 'RECEIVED_IN_CASH'
      );

      if (paidPayment) {
        const expiresAt = new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString();
        await supabaseAdmin
          .from('izaque_profiles')
          .update({
            plan_id: WHATSAPP_PLAN_ID,
            plan_status: 'active',
            plan_activated_at: new Date().toISOString(),
            plan_expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        await supabaseAdmin
          .from('izaque_subscriptions')
          .update({ status: 'active', approved_at: new Date().toISOString() })
          .eq('asaas_payment_id', paidPayment.id);

        invalidateAuthCache();
        return {
          isActive: true,
          planId: WHATSAPP_PLAN_ID,
          planStatus: 'active',
          expiresAt,
        };
      }
    } catch (err) {
      console.warn('⚠️ [Asaas Sync] Erro ao consultar pagamentos da assinatura:', err.message);
    }
  }

  return {
    isActive: false,
    planId: profile.plan_id || 'free',
    planStatus: profile.plan_status || 'free',
    expiresAt: profile.plan_expires_at || null,
  };
}

/**
 * Cancela a recorrência mensal no Asaas quando o usuário desejar voltar ao Plano Gratuito
 */
export async function cancelUserWhatsappSubscription(userId) {
  const { data: profile } = await supabaseAdmin
    .from('izaque_profiles')
    .select('id, asaas_subscription_id')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.asaas_subscription_id) {
    try {
      await asaasRequest(`/subscriptions/${encodeURIComponent(profile.asaas_subscription_id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('⚠️ [Asaas Cancel] Aviso ao cancelar recorrência no Asaas:', err.message);
    }
  }

  await supabaseAdmin
    .from('izaque_profiles')
    .update({
      plan_id: 'free',
      plan_status: 'free',
      asaas_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  invalidateAuthCache();
  return { success: true, planId: 'free' };
}

/**
 * Processa eventos do Webhook Asaas v3 (/api/webhooks/asaas)
 * Protegido por token 'asaas-access-token' e isolado para eventos do grupo/referência 'isaac:'
 */
export async function processAsaasWebhook(headers = {}, body = {}) {
  const cfg = getAsaasConfig();
  const receivedToken = String(
    headers['asaas-access-token'] || headers['Asaas-Access-Token'] || ''
  ).trim();

  if (cfg.webhookToken && receivedToken !== cfg.webhookToken) {
    const err = new Error('Token de webhook Asaas inválido.');
    err.statusCode = 401;
    throw err;
  }

  const event = String(body?.event || '').toUpperCase();
  const payment = body?.payment || body?.subscription || {};
  const extRef = String(payment?.externalReference || '');
  const asaasSubId = payment?.subscription || (body?.subscription ? body.subscription.id : null);
  const asaasCustomerId = payment?.customer || null;
  const asaasPaymentId = body?.payment?.id || null;

  let targetProfile = null;

  if (extRef.startsWith('isaac:')) {
    const uid = extRef.slice('isaac:'.length).trim();
    const { data } = await supabaseAdmin
      .from('izaque_profiles')
      .select('id, full_name, email, phone, whatsapp_jid, whatsapp_opt_out, plan_id, plan_status')
      .eq('id', uid)
      .maybeSingle();
    targetProfile = data || null;
  }

  if (!targetProfile && asaasSubId) {
    const { data } = await supabaseAdmin
      .from('izaque_profiles')
      .select('id, full_name, email, phone, whatsapp_jid, whatsapp_opt_out, plan_id, plan_status')
      .eq('asaas_subscription_id', asaasSubId)
      .maybeSingle();
    targetProfile = data || null;
  }

  if (!targetProfile && asaasCustomerId) {
    const { data } = await supabaseAdmin
      .from('izaque_profiles')
      .select('id, full_name, email, phone, whatsapp_jid, whatsapp_opt_out, plan_id, plan_status')
      .eq('asaas_customer_id', asaasCustomerId)
      .maybeSingle();
    targetProfile = data || null;
  }

  if (!targetProfile) {
    // Evento de outro sistema na mesma conta Asaas -> retorna 200 sem penalizar a fila do Asaas
    return { ignored: true, reason: 'not_isaac_customer', event };
  }

  const activationEvents = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'PAYMENT_DUNNING_RECEIVED'];
  const deactivationEvents = ['PAYMENT_REFUNDED', 'PAYMENT_CHARGEBACK_REQUESTED'];

  if (activationEvents.includes(event)) {
    const wasAlreadyActive =
      targetProfile.plan_id === WHATSAPP_PLAN_ID && targetProfile.plan_status === 'active';
    const expiresAt = new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from('izaque_profiles')
      .update({
        plan_id: WHATSAPP_PLAN_ID,
        plan_status: 'active',
        plan_activated_at: new Date().toISOString(),
        plan_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetProfile.id);

    if (asaasPaymentId) {
      await supabaseAdmin
        .from('izaque_subscriptions')
        .update({
          status: 'active',
          approved_at: new Date().toISOString(),
        })
        .eq('asaas_payment_id', asaasPaymentId);
    }

    invalidateAuthCache();

    if (!wasAlreadyActive && targetProfile.phone && !targetProfile.whatsapp_opt_out) {
      try {
        const evoEnabled = await isEvolutionEnabledInDatabase();
        if (evoEnabled) {
          const jidInfo = await resolveWhatsAppJid(targetProfile.whatsapp_jid || targetProfile.phone);
          if (jidInfo?.exists && jidInfo?.jid) {
            const firstName = (targetProfile.full_name || 'amigo(a)').trim().split(/\s+/)[0];
            const welcomeText = `Olá, ${firstName}! Que alegria ter você por aqui.\n\nSeu *Plano ISAAC no WhatsApp (Texto e Áudio)* acaba de ser ativado! A partir de agora, você pode conversar comigo diretamente por aqui — enviando texto ou áudio — e toda a nossa conversa ficará sincronizada automaticamente no seu mesmo chat lá em https://isaac.lynxems.com.br/\n\nQuando quiser começar ou continuar sua reflexão, é só me chamar!`;
            await sendWhatsAppTextSafe({ jidOrNumber: jidInfo.jid, text: welcomeText });
          }
        }
      } catch (wErr) {
        console.warn('⚠️ [Asaas Webhook] Aviso ao enviar boas-vindas no WhatsApp:', wErr.message);
      }
    }

    console.log(`✅ [Asaas Webhook] Plano WhatsApp ativado para ${targetProfile.email} (${event})`);
    return { activated: true, userId: targetProfile.id, event };
  }

  if (deactivationEvents.includes(event)) {
    await supabaseAdmin
      .from('izaque_profiles')
      .update({
        plan_id: 'free',
        plan_status: 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetProfile.id);

    if (asaasPaymentId) {
      await supabaseAdmin
        .from('izaque_subscriptions')
        .update({ status: 'refunded' })
        .eq('asaas_payment_id', asaasPaymentId);
    }

    invalidateAuthCache();
    console.log(`ℹ️ [Asaas Webhook] Plano WhatsApp revertido para gratuito (${targetProfile.email} — ${event})`);
    return { deactivated: true, userId: targetProfile.id, event };
  }

  return { processed: true, userId: targetProfile.id, event };
}
