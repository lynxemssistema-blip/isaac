import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { parseUniversalPhone } from '../utils/phoneUtils.js';
import {
  EBOOK_STORE_PRICING,
  ENRICHED_EBOOKS_CATALOG,
  COMPLETE_BUNDLE_PRODUCT,
  findEbookProductBySlug,
} from '../data/superadminEbooksCatalog.js';
import {
  generateEbookBilingualPdfBuffer,
  getEbookPdfFileName,
} from './ebookPdfService.js';
import { sendEbookPurchaseDeliveryEmail } from './emailService.js';
import {
  resolveWhatsAppJid,
  sendWhatsAppTextSafe,
  isEvolutionEnabledInDatabase,
  randomBetween,
  sleep,
} from './evolutionService.js';
import {
  sendWhatsAppImageSafe,
  isEvolutionInstanceConnected,
} from './evolutionOutreachService.js';
import {
  getAsaasConfig,
  sanitizeCpfCnpj,
  asaasRequest,
  ensureIsolatedIsaacCustomer,
} from './asaasGroupClient.js';

const DEFAULT_APP_URL = 'https://isaac.lynxems.com.br';

const inFlightFulfillments = new Set();

function getDueDateBrtPlusDays(daysToAdd = 1) {
  const target = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(target);
}

/**
 * Calcula os itens, subtotal, desconto promocional (30% OFF no Pacote Completo em PDF Único) e total final.
 */
export function calculateCartSummary(rawItems = [], { useCompleteBundlePromo = false } = {}) {
  const cleanTokens = Array.isArray(rawItems)
    ? rawItems.map((s) => String(s || '').trim().toLowerCase()).filter(Boolean)
    : [];

  const explicitlyRequestedBundle =
    useCompleteBundlePromo ||
    cleanTokens.some((t) => t === 'colecao-completa' || t === 'bundle-all-8' || t === 'todos');

  const uniqueVolumesMap = new Map();
  for (const token of cleanTokens) {
    const prod = findEbookProductBySlug(token);
    if (prod && !prod.isBundle) {
      uniqueVolumesMap.set(prod.slug, prod);
    }
  }

  const selectedVolumes = Array.from(uniqueVolumesMap.values()).sort(
    (a, b) => a.volumeNumber - b.volumeNumber
  );

  // Se selecionou todos os 8 volumes avulsos ou ativou a promoção da Coleção Completa (30% OFF)
  if (explicitlyRequestedBundle || selectedVolumes.length >= ENRICHED_EBOOKS_CATALOG.length) {
    return {
      isCompleteBundle: true,
      items: [
        {
          id: COMPLETE_BUNDLE_PRODUCT.id,
          slug: COMPLETE_BUNDLE_PRODUCT.slug,
          volumeNumber: 0,
          isBundle: true,
          title: COMPLETE_BUNDLE_PRODUCT.title,
          enTitle: COMPLETE_BUNDLE_PRODUCT.enTitle,
          coverUrl: COMPLETE_BUNDLE_PRODUCT.coverUrl,
          price: EBOOK_STORE_PRICING.bundlePrice,
          originalPrice: EBOOK_STORE_PRICING.fullRetailTotal,
        },
      ],
      subtotalAmount: EBOOK_STORE_PRICING.fullRetailTotal, // 159.20
      discountAmount: EBOOK_STORE_PRICING.bundleSavings,   // 47.76 (30%)
      totalAmount: EBOOK_STORE_PRICING.bundlePrice,        // 111.44
      suggestBundleUpgrade: false,
    };
  }

  if (selectedVolumes.length === 0) {
    throw new Error('Selecione ao menos 1 eBook ou a Coleção Completa para continuar.');
  }

  const subtotalAmount = Number(
    (selectedVolumes.length * EBOOK_STORE_PRICING.individualPrice).toFixed(2)
  );

  return {
    isCompleteBundle: false,
    items: selectedVolumes.map((v) => ({
      id: v.id,
      slug: v.slug,
      volumeNumber: v.volumeNumber,
      isBundle: false,
      title: v.title,
      enTitle: v.enGb?.title || '',
      coverUrl: v.coverUrl,
      price: EBOOK_STORE_PRICING.individualPrice,
      originalPrice: EBOOK_STORE_PRICING.individualPrice,
    })),
    subtotalAmount,
    discountAmount: 0,
    totalAmount: subtotalAmount,
    suggestBundleUpgrade: subtotalAmount >= EBOOK_STORE_PRICING.bundlePrice,
  };
}

/**
 * Garante que o comprador tenha um registro de cliente EXCLUSIVO no grupo "Isaac" no Asaas
 * (mesmo que o CPF já exista na mesma conta Asaas em outros grupos como "horeb" ou "lynxems"),
 * isolando 100% os clientes e a receita financeira por grupo de clientes.
 */
async function ensureAsaasBuyerCustomer({ userId, buyerName, buyerEmail, buyerPhone, cleanCpfCnpj }) {
  return ensureIsolatedIsaacCustomer({
    userId,
    fullName: buyerName,
    email: buyerEmail,
    phone: buyerPhone,
    cpfCnpj: cleanCpfCnpj,
    externalReferenceFallback: `isaac:reader:${cleanCpfCnpj}`,
    updateExistingDetails: false,
  });
}

function serializePublicOrder(order, appUrl = DEFAULT_APP_URL) {
  if (!order) return null;
  const cleanBase = String(appUrl || DEFAULT_APP_URL).replace(/\/$/, '');
  const items = Array.isArray(order.items) ? order.items : [];
  const portalUrl = `${cleanBase}/meus-ebooks/${order.download_token}`;

  // Se comprou o Pacote Completo, o comprador pode baixar tanto o PDF Único Consolidado (principal)
  // quanto qualquer um dos 8 volumes separados se desejar!
  const downloadableItems = order.status === 'paid'
    ? order.is_complete_bundle
      ? [
          {
            slug: COMPLETE_BUNDLE_PRODUCT.slug,
            title: COMPLETE_BUNDLE_PRODUCT.title,
            enTitle: COMPLETE_BUNDLE_PRODUCT.enTitle,
            coverUrl: COMPLETE_BUNDLE_PRODUCT.coverUrl,
            isBundle: true,
            isPrimaryBundlePdf: true,
            downloadUrl: `${cleanBase}/api/ebooks/download/${order.download_token}/${COMPLETE_BUNDLE_PRODUCT.slug}`,
          },
          ...ENRICHED_EBOOKS_CATALOG.map((v) => ({
            slug: v.slug,
            volumeNumber: v.volumeNumber,
            title: v.title,
            enTitle: v.enGb?.title || '',
            coverUrl: v.coverUrl,
            isBundle: false,
            isBonusIndividualPdf: true,
            downloadUrl: `${cleanBase}/api/ebooks/download/${order.download_token}/${v.slug}`,
          })),
        ]
      : items.map((it) => ({
          ...it,
          downloadUrl: `${cleanBase}/api/ebooks/download/${order.download_token}/${it.slug}`,
        }))
    : [];

  return {
    orderId: order.id,
    downloadToken: order.download_token,
    portalUrl,
    buyerName: order.buyer_name,
    buyerEmail: order.buyer_email,
    buyerPhone: order.buyer_phone || '',
    isCompleteBundle: Boolean(order.is_complete_bundle),
    items,
    subtotalAmount: Number(order.subtotal_amount || 0),
    discountAmount: Number(order.discount_amount || 0),
    totalAmount: Number(order.total_amount || 0),
    status: order.status,
    asaasCustomerId: order.asaas_customer_id || null,
    asaasPaymentId: order.asaas_payment_id || null,
    customerGroup: getAsaasConfig().customerGroup,
    invoiceUrl: order.invoice_url || null,
    pixQrCodeBase64: order.pix_qr_code_base64 || null,
    pixCopyPaste: order.pix_copy_paste || null,
    paidAt: order.paid_at || null,
    emailSentAt: order.email_sent_at || null,
    whatsappSentAt: order.whatsapp_sent_at || null,
    downloadCount: Number(order.download_count || 0),
    downloadableItems,
    createdAt: order.created_at,
  };
}

/**
 * Cria cobrança avulsa direta no Asaas (PIX QR Code imediato + Link Oficial Asaas Cartão/PIX/Boleto)
 * vinculada exclusivamente ao Grupo de Clientes "Isaac", e registra o pedido com token único de download personalizado.
 */
export async function createEbookAsaasOrder({
  items,
  useCompleteBundlePromo = false,
  buyerName,
  buyerEmail,
  buyerPhone = '',
  buyerCpfCnpj,
  userId = null,
}) {
  const cfg = getAsaasConfig();
  const cleanName = String(buyerName || '').trim();
  const cleanEmail = String(buyerEmail || '').trim().toLowerCase();
  const cleanPhone = String(buyerPhone || '').trim();
  const cleanCpfCnpj = sanitizeCpfCnpj(buyerCpfCnpj);

  if (cleanName.length < 2) {
    throw new Error('Informe o nome completo de quem receberá a dedicatória nos eBooks.');
  }
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Informe um endereço de e-mail válido para receber o link de download.');
  }
  if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
    throw new Error('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido para emissão da cobrança no Asaas.');
  }

  const parsedPhone = cleanPhone ? parseUniversalPhone(cleanPhone) : { isValid: false, isBrazil: true };
  const isInternationalPhone = Boolean(cleanPhone && parsedPhone.e164Digits && !parsedPhone.isBrazil);

  const summary = calculateCartSummary(items, { useCompleteBundlePromo });
  const orderId = crypto.randomUUID();
  const downloadToken = crypto.randomBytes(24).toString('hex');
  const externalReference = `isaac:ebook:${orderId}`;

  const asaasCustomerId = await ensureAsaasBuyerCustomer({
    userId,
    buyerName: cleanName,
    buyerEmail: cleanEmail,
    buyerPhone: cleanPhone,
    cleanCpfCnpj,
  });

  const rawDescription = summary.isCompleteBundle
    ? '[ISAAC] Coleção Completa ISAAC® Essential (8 eBooks Bilíngues PT-BR + EN-GB em 1 PDF Único) — Autor: Thiago Prata'
    : summary.items.length === 1
      ? `[ISAAC] eBook Bilíngue ISAAC® Essential: ${summary.items[0].title} — Autor: Thiago Prata`
      : `[ISAAC] Kit ${summary.items.length} eBooks Bilíngues ISAAC® Essential (${summary.items.map((i) => `Vol.0${i.volumeNumber}`).join(', ')}) — Autor: Thiago Prata`;

  const payment = await asaasRequest('/payments', {
    method: 'POST',
    body: {
      customer: asaasCustomerId,
      billingType: 'UNDEFINED', // Libera PIX, Cartão e Boleto no link direto do Asaas + QR Code PIX imediato
      value: summary.totalAmount,
      dueDate: getDueDateBrtPlusDays(1),
      description: rawDescription.slice(0, 480),
      externalReference,
    },
  });

  let pixQrCodeBase64 = null;
  let pixCopyPaste = null;
  try {
    const pixData = await asaasRequest(`/payments/${encodeURIComponent(payment.id)}/pixQrCode`);
    pixQrCodeBase64 = pixData?.encodedImage || null;
    pixCopyPaste = pixData?.payload || null;
  } catch (pixErr) {
    console.warn('⚠️ [eBook Checkout] Aviso ao obter QR Code PIX imediato:', pixErr.message);
  }

  const { data: insertedOrder, error: insErr } = await supabaseAdmin
    .from('izaque_ebook_orders')
    .insert({
      id: orderId,
      download_token: downloadToken,
      user_id: userId || null,
      buyer_name: cleanName,
      buyer_email: cleanEmail,
      buyer_phone: cleanPhone || null,
      buyer_cpf_cnpj: cleanCpfCnpj,
      is_international_phone: isInternationalPhone,
      items: summary.items,
      is_complete_bundle: summary.isCompleteBundle,
      subtotal_amount: summary.subtotalAmount,
      discount_amount: summary.discountAmount,
      total_amount: summary.totalAmount,
      status: 'pending',
      asaas_customer_id: asaasCustomerId,
      asaas_payment_id: payment.id,
      billing_type: payment.billingType || 'UNDEFINED',
      invoice_url: payment.invoiceUrl || payment.bankSlipUrl || null,
      pix_qr_code_base64: pixQrCodeBase64,
      pix_copy_paste: pixCopyPaste,
      external_reference: externalReference,
    })
    .select('*')
    .single();

  if (insErr) {
    throw new Error(`Erro ao registrar pedido de eBook: ${insErr.message}`);
  }

  return serializePublicOrder(insertedOrder, cfg.appUrl);
}

/**
 * Envia a confirmação e o link de download via WhatsApp (Evolution API) em PT-BR ou Inglês Britânico (EN-GB).
 */
async function deliverOrderViaWhatsApp(order, { appUrl = DEFAULT_APP_URL } = {}) {
  if (!order?.buyer_phone) {
    return { sent: false, reason: 'no_phone' };
  }

  const evoEnabled = await isEvolutionEnabledInDatabase();
  if (!evoEnabled) {
    return { sent: false, reason: 'evolution_disabled' };
  }

  if (!(await isEvolutionInstanceConnected())) {
    return { sent: false, reason: 'evolution_reconnecting_deferred' };
  }

  const jidInfo = await resolveWhatsAppJid(order.buyer_phone);
  if (!jidInfo?.exists || !jidInfo?.jid) {
    return { sent: false, reason: jidInfo?.reason || 'not_on_whatsapp' };
  }

  const cleanBase = String(appUrl || DEFAULT_APP_URL).replace(/\/$/, '');
  const portalUrl = `${cleanBase}/meus-ebooks/${order.download_token}`;
  const cleanFullName = String(order.buyer_name || 'Leitor(a)').trim();
  const firstName = cleanFullName.split(/\s+/)[0] || 'amigo(a)';
  const items = Array.isArray(order.items) ? order.items : [];
  const primaryCoverPath = order.is_complete_bundle
    ? COMPLETE_BUNDLE_PRODUCT.coverUrl
    : items[0]?.coverUrl || COMPLETE_BUNDLE_PRODUCT.coverUrl;
  const fullCoverUrl = `${cleanBase}${primaryCoverPath}`;

  // Balão 1: Capa Oficial + Agradecimento nominal SEM URL na legenda da imagem (proteção Anti-Spam Meta)
  const bubble1Caption = order.is_international_phone
    ? `Hello, *${firstName}*! ✨\n\nThank you very much — your order in the *ISAAC® Essential Bilingual Library* (authored by mentor *Thiago Prata*) has been confirmed!\n\nYour personalised PDF edition — featuring both *Portuguese and British English* in the same volume and a personal dedication to *${cleanFullName}* in the bottom margin — is ready right below.`
    : `Olá, *${firstName}*! ✨\n\nMuito obrigado! Seu pedido na *Biblioteca Oficial ISAAC® Essential* (autor: *Thiago Prata*) foi confirmado com sucesso!\n\nSeu exemplar em PDF Bilíngue (*Português + Inglês Britânico no mesmo arquivo*), com ilustrações exclusivas e *dedicatória especial para ${cleanFullName} na margem inferior das páginas*, já está pronto logo abaixo.`;

  const bubble2Link = order.is_international_phone
    ? `📥 Here is your personal access link to download your PDF(s) whenever you wish:\n${portalUrl}\n\nWarm regards,\n*Thiago Prata — ISAAC® Mentoring*`
    : `📥 Aqui está o seu link exclusivo para baixar seu(s) PDF(s) sempre que desejar:\n${portalUrl}\n\nExcelente leitura e clareza na sua caminhada!\n*Thiago Prata — Mentoria ISAAC®*`;

  try {
    await sendWhatsAppImageSafe({
      jidOrNumber: jidInfo.jid,
      caption: bubble1Caption,
      mediaUrl: fullCoverUrl,
      fileSeed: order.id,
    });
    await sleep(randomBetween(2400, 4200));
    await sendWhatsAppTextSafe({
      jidOrNumber: jidInfo.jid,
      text: bubble2Link,
    });
    return { sent: true, mode: 'two_bubble_protected', jid: jidInfo.jid };
  } catch (imgErr) {
    console.warn('⚠️ [eBook WhatsApp Delivery] Fallback para texto puro:', imgErr.message);
    await sendWhatsAppTextSafe({
      jidOrNumber: jidInfo.jid,
      text: `${bubble1Caption}\n\n${bubble2Link}`,
    });
    return { sent: true, mode: 'text_fallback', jid: jidInfo.jid };
  }
}

/**
 * Marca pedido como pago e dispara de forma idempotente a entrega automática por E-mail e Celular (WhatsApp).
 */
export async function fulfillPaidEbookOrder(orderId, { forceChannel = null } = {}) {
  if (!orderId) return null;
  const cfg = getAsaasConfig();

  const lockKey = `${orderId}:${forceChannel || 'auto'}`;
  if (inFlightFulfillments.has(lockKey)) {
    const { data: current } = await supabaseAdmin
      .from('izaque_ebook_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();
    return serializePublicOrder(current, cfg.appUrl);
  }

  inFlightFulfillments.add(lockKey);
  try {
    const { data: order, error } = await supabaseAdmin
      .from('izaque_ebook_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !order) return null;

    const nowIso = new Date().toISOString();
    const updates = { updated_at: nowIso };

    if (order.status !== 'paid') {
      updates.status = 'paid';
      updates.paid_at = order.paid_at || nowIso;
    }

    const shouldSendEmail =
      forceChannel === 'email' ||
      forceChannel === 'both' ||
      (!forceChannel && !order.email_sent_at);

    const shouldSendWhatsApp =
      Boolean(order.buyer_phone) &&
      (forceChannel === 'whatsapp' ||
        forceChannel === 'both' ||
        (!forceChannel && !order.whatsapp_sent_at));

    if (shouldSendEmail && order.buyer_email) {
      try {
        await sendEbookPurchaseDeliveryEmail({
          toEmail: order.buyer_email,
          buyerName: order.buyer_name,
          downloadToken: order.download_token,
          isCompleteBundle: Boolean(order.is_complete_bundle),
          items: Array.isArray(order.items) ? order.items : [],
          totalAmount: Number(order.total_amount || 0),
          appUrl: cfg.appUrl,
        });
        updates.email_sent_at = nowIso;
      } catch (mailErr) {
        console.error('❌ [eBook Delivery] Erro ao enviar e-mail de entrega:', mailErr.message);
      }
    }

    if (shouldSendWhatsApp) {
      try {
        const waRes = await deliverOrderViaWhatsApp(order, { appUrl: cfg.appUrl });
        if (waRes?.sent) {
          updates.whatsapp_sent_at = nowIso;
        }
      } catch (waErr) {
        console.error('❌ [eBook Delivery] Erro ao enviar WhatsApp de entrega:', waErr.message);
      }
    }

    const { data: updatedOrder } = await supabaseAdmin
      .from('izaque_ebook_orders')
      .update(updates)
      .eq('id', order.id)
      .select('*')
      .single();

    return serializePublicOrder(updatedOrder || { ...order, ...updates }, cfg.appUrl);
  } finally {
    inFlightFulfillments.delete(lockKey);
  }
}

/**
 * Consulta o pedido pelo token seguro e, caso ainda esteja pendente, sincroniza em tempo real no Asaas.
 */
export async function getAndSyncEbookOrderByToken(downloadToken) {
  const cfg = getAsaasConfig();
  const cleanToken = String(downloadToken || '').trim();
  if (!cleanToken) return null;

  const { data: order, error } = await supabaseAdmin
    .from('izaque_ebook_orders')
    .select('*')
    .eq('download_token', cleanToken)
    .maybeSingle();

  if (error || !order) return null;

  if (order.status !== 'paid' && order.asaas_payment_id && cfg.apiKey) {
    try {
      const payment = await asaasRequest(`/payments/${encodeURIComponent(order.asaas_payment_id)}`);
      const pStatus = String(payment?.status || '').toUpperCase();
      if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'DUNNING_RECEIVED'].includes(pStatus)) {
        return await fulfillPaidEbookOrder(order.id);
      }
    } catch (syncErr) {
      console.warn('⚠️ [eBook Order Sync] Falha leve ao consultar Asaas:', syncErr.message);
    }
  } else if (
    order.status === 'paid' &&
    (!order.email_sent_at || (order.buyer_phone && !order.whatsapp_sent_at))
  ) {
    // Recuperação automática zero-perda caso o WhatsApp/SMTP estivesse reconectando no segundo exato do pagamento
    return await fulfillPaidEbookOrder(order.id);
  }

  return serializePublicOrder(order, cfg.appUrl);
}

let lastPaidDeliverySweepAt = 0;
export async function retryPendingPaidEbookDeliveries() {
  const now = Date.now();
  if (now - lastPaidDeliverySweepAt < 4 * 60_000) return;
  lastPaidDeliverySweepAt = now;

  try {
    const since48hIso = new Date(now - 48 * 3600 * 1000).toISOString();
    const { data: pendingDeliveries } = await supabaseAdmin
      .from('izaque_ebook_orders')
      .select('id, buyer_email, buyer_phone, email_sent_at, whatsapp_sent_at')
      .eq('status', 'paid')
      .gte('paid_at', since48hIso)
      .limit(10);

    for (const ord of pendingDeliveries || []) {
      const missingEmail = Boolean(ord.buyer_email && !ord.email_sent_at);
      const missingWa = Boolean(ord.buyer_phone && !ord.whatsapp_sent_at);
      if (missingEmail || missingWa) {
        await fulfillPaidEbookOrder(ord.id);
        break; // 1 pedido recuperado por varredura p/ manter cadência suave
      }
    }
  } catch (sweepErr) {
    console.warn('⚠️ [eBook Zero-Loss Sweep]:', sweepErr.message);
  }
}

/**
 * Processa eventos do Webhook oficial Asaas (/api/webhooks/asaas) referentes a pedidos de eBook (isaac:ebook:<orderId>).
 */
export async function processAsaasEbookWebhook(event, payment = {}) {
  const extRef = String(payment?.externalReference || '').trim();
  const asaasPaymentId = payment?.id ? String(payment.id).trim() : '';

  let order = null;
  if (extRef.startsWith('isaac:ebook:')) {
    const orderId = extRef.slice('isaac:ebook:'.length).trim();
    if (orderId) {
      const { data } = await supabaseAdmin
        .from('izaque_ebook_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();
      order = data || null;
    }
  }

  if (!order && asaasPaymentId) {
    const { data } = await supabaseAdmin
      .from('izaque_ebook_orders')
      .select('*')
      .eq('asaas_payment_id', asaasPaymentId)
      .maybeSingle();
    order = data || null;
  }

  if (!order) {
    return { ignored: true, reason: 'ebook_order_not_found', event };
  }

  const paidEvents = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'PAYMENT_DUNNING_RECEIVED'];
  const refundEvents = ['PAYMENT_REFUNDED', 'PAYMENT_CHARGEBACK_REQUESTED'];

  if (paidEvents.includes(event)) {
    const fulfilled = await fulfillPaidEbookOrder(order.id);
    return {
      success: true,
      type: 'ebook_order_paid',
      orderId: order.id,
      emailSent: Boolean(fulfilled?.emailSentAt),
      whatsappSent: Boolean(fulfilled?.whatsappSentAt),
    };
  }

  if (refundEvents.includes(event)) {
    await supabaseAdmin
      .from('izaque_ebook_orders')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);
    return { success: true, type: 'ebook_order_refunded', orderId: order.id };
  }

  return { ignored: true, reason: 'unhandled_ebook_event', event, orderId: order.id };
}

/**
 * Reenvia link de download por E-mail e/ou Celular (WhatsApp) para um pedido já pago.
 */
export async function resendEbookOrderDelivery({
  downloadToken,
  channel = 'both',
  overrideEmail = '',
  overridePhone = '',
}) {
  const synced = await getAndSyncEbookOrderByToken(downloadToken);
  if (!synced) {
    const err = new Error('Pedido não encontrado.');
    err.statusCode = 404;
    throw err;
  }
  if (synced.status !== 'paid') {
    const err = new Error('O pagamento deste pedido ainda está aguardando confirmação do Asaas.');
    err.statusCode = 402;
    throw err;
  }

  const patch = {};
  if (overrideEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(overrideEmail.trim())) {
    patch.buyer_email = overrideEmail.trim().toLowerCase();
  }
  if (overridePhone && overridePhone.trim().length >= 8) {
    const p = parseUniversalPhone(overridePhone.trim());
    patch.buyer_phone = overridePhone.trim();
    patch.is_international_phone = Boolean(p.e164Digits && !p.isBrazil);
  }
  if (Object.keys(patch).length > 0) {
    patch.updated_at = new Date().toISOString();
    await supabaseAdmin.from('izaque_ebook_orders').update(patch).eq('id', synced.orderId);
  }

  const normalizedChannel = ['email', 'whatsapp', 'both'].includes(channel) ? channel : 'both';
  return fulfillPaidEbookOrder(synced.orderId, { forceChannel: normalizedChannel });
}

/**
 * Gera em tempo real o PDF Bilíngue (PT-BR + EN-GB) personalizado com a dedicatória ao comprador na margem inferior!
 */
export async function generatePaidOrderPersonalizedPdf({ downloadToken, slug }) {
  const cleanToken = String(downloadToken || '').trim();
  const cleanSlug = String(slug || '').trim().toLowerCase();

  const { data: order, error } = await supabaseAdmin
    .from('izaque_ebook_orders')
    .select('*')
    .eq('download_token', cleanToken)
    .maybeSingle();

  if (error || !order) {
    const err = new Error('Link de download inválido ou não encontrado.');
    err.statusCode = 404;
    throw err;
  }

  // Caso o cliente clique no link segundos após pagar o PIX antes do webhook, sincroniza com o Asaas na hora
  let activeOrder = order;
  if (activeOrder.status !== 'paid') {
    const synced = await getAndSyncEbookOrderByToken(cleanToken);
    if (!synced || synced.status !== 'paid') {
      const err = new Error('O pagamento deste pedido ainda não foi confirmado.');
      err.statusCode = 402;
      throw err;
    }
    const { data: refreshed } = await supabaseAdmin
      .from('izaque_ebook_orders')
      .select('*')
      .eq('id', order.id)
      .single();
    activeOrder = refreshed || activeOrder;
  }

  const product = findEbookProductBySlug(cleanSlug);
  if (!product) {
    const err = new Error('Volume solicitado não encontrado no catálogo.');
    err.statusCode = 404;
    throw err;
  }

  const orderItems = Array.isArray(activeOrder.items) ? activeOrder.items : [];
  const isAllowed = activeOrder.is_complete_bundle
    ? true // Quem comprou a Coleção Completa tem direito ao PDF Único Consolidado e também aos 8 individuais
    : orderItems.some(
        (it) =>
          String(it.slug || '').toLowerCase() === product.slug.toLowerCase() ||
          String(it.id || '').toLowerCase() === product.id.toLowerCase()
      );

  if (!isAllowed) {
    const err = new Error('Este volume não faz parte do pedido adquirido.');
    err.statusCode = 403;
    throw err;
  }

  const paidDate = activeOrder.paid_at ? new Date(activeOrder.paid_at) : new Date();
  const purchaseDateStr = paidDate.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const pdfBuffer = await generateEbookBilingualPdfBuffer({
    slugOrId: product.slug,
    buyerName: activeOrder.buyer_name,
    purchaseDateStr,
  });

  await supabaseAdmin
    .from('izaque_ebook_orders')
    .update({
      download_count: Number(activeOrder.download_count || 0) + 1,
      last_downloaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', activeOrder.id);

  return {
    pdfBuffer,
    fileName: getEbookPdfFileName(product.slug),
    buyerName: activeOrder.buyer_name,
  };
}

/**
 * Lista os pedidos recentes de eBooks para auditoria do Superadmin.
 */
export async function listSuperAdminEbookOrders(limit = 50) {
  const cfg = getAsaasConfig();
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const { data, error } = await supabaseAdmin
    .from('izaque_ebook_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) throw error;
  return (data || []).map((row) => serializePublicOrder(row, cfg.appUrl));
}

