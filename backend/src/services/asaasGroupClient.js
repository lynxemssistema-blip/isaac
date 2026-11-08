import { supabaseAdmin } from '../config/supabase.js';
import { parseUniversalPhone } from '../utils/phoneUtils.js';

const DEFAULT_ASAAS_URL = 'https://api.asaas.com/v3';
const DEFAULT_CUSTOMER_GROUP = 'Isaac';
const DEFAULT_APP_URL = 'https://isaac.lynxems.com.br';

export function getAsaasConfig() {
  let rawKey = (process.env.ASAAS_API_KEY || '').trim();
  // Proteção contra eventual remoção de '$' inicial por shells/containers
  if (rawKey && !rawKey.startsWith('$') && rawKey.startsWith('aact_')) {
    rawKey = `$${rawKey}`;
  }
  return {
    baseUrl: (process.env.ASAAS_API_URL || DEFAULT_ASAAS_URL).replace(/\/$/, ''),
    apiKey: rawKey,
    customerGroup: (process.env.ASAAS_CUSTOMER_GROUP || DEFAULT_CUSTOMER_GROUP).trim() || DEFAULT_CUSTOMER_GROUP,
    webhookToken: (process.env.ASAAS_WEBHOOK_TOKEN || '').trim(),
    appUrl: (process.env.APP_URL || DEFAULT_APP_URL).replace(/\/$/, ''),
  };
}

export function sanitizeCpfCnpj(raw) {
  return String(raw || '').replace(/\D/g, '');
}

export function sanitizeBrazilMobileForAsaas(rawPhone) {
  const parsed = parseUniversalPhone(rawPhone);
  // Asaas aceita apenas celular nacional BR no campo opcional mobilePhone; números internacionais seguem no banco do App sem quebrar o checkout
  if (!parsed.isValid || !parsed.isBrazil) {
    return '';
  }
  let digits = parsed.e164Digits.slice(2);
  if (digits.length === 10) {
    digits = `${digits.slice(0, 2)}9${digits.slice(2)}`;
  }
  return digits.slice(0, 11);
}

export async function asaasRequest(endpointPath, { method = 'GET', body = null } = {}) {
  const cfg = getAsaasConfig();
  if (!cfg.apiKey) {
    throw new Error('ASAAS_API_KEY não configurada no servidor.');
  }

  const resp = await fetch(`${cfg.baseUrl}${endpointPath}`, {
    method,
    headers: {
      access_token: cfg.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'IsaacPlatform/2.0',
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

function normalizeGroupToken(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * Verifica com rigor se um cadastro de cliente do Asaas pertence EXCLUSIVAMENTE ao grupo "Isaac"
 * (sem misturar com outros grupos da mesma conta Asaas, como "horeb" ou "lynxems", e sem externalReference externo).
 * Isso garante 100% de separação tanto da carteira de clientes quanto da receita financeira por grupo no Asaas.
 */
export function isCustomerExclusivelyInIsaacGroup(customer, targetGroup = DEFAULT_CUSTOMER_GROUP) {
  if (!customer || !customer.id || customer.deleted) {
    return false;
  }

  const wanted = normalizeGroupToken(targetGroup || DEFAULT_CUSTOMER_GROUP);
  const rawGroups = Array.isArray(customer.groups) ? customer.groups : [];
  const groupNames = rawGroups
    .map((g) => normalizeGroupToken(typeof g === 'string' ? g : g?.name))
    .filter(Boolean);

  if (groupNames.length === 0 && customer.groupName) {
    groupNames.push(normalizeGroupToken(customer.groupName));
  }

  // Precisa estar vinculado ao grupo Isaac e a NENHUM outro grupo (evita misturar receitas entre grupos no Asaas)
  if (groupNames.length !== 1 || groupNames[0] !== wanted) {
    return false;
  }

  // Nunca reaproveita cliente cujo externalReference pertença a outro produto/sistema (ex: EBOOK_BUYER_*, LYNXEMS:*)
  const extRef = String(customer.externalReference || '').trim();
  if (extRef && !extRef.toLowerCase().startsWith('isaac:')) {
    return false;
  }

  return true;
}

/**
 * Garante um cadastro de cliente no Asaas EXCLUSIVO do grupo "Isaac".
 * - Mesmo que o comprador (mesmo CPF/CNPJ) já exista na conta Asaas em outros grupos (ex: "horeb", "lynxems"),
 *   NUNCA reaproveita nem altera o cadastro do outro grupo: cria um registro de cliente separado vinculado
 *   exclusivamente ao grupo "Isaac", mantendo clientes e receitas 100% separados por grupo no Asaas!
 * - Se o comprador já possuir um cadastro exclusivo no grupo "Isaac", reaproveita esse cadastro para evitar duplicidade dentro do grupo Isaac.
 */
export async function ensureIsolatedIsaacCustomer({
  userId = null,
  fullName,
  email,
  phone = '',
  cpfCnpj,
  externalReferenceFallback = '',
  updateExistingDetails = false,
}) {
  const cfg = getAsaasConfig();
  const cleanCpfCnpj = sanitizeCpfCnpj(cpfCnpj);
  if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
    throw new Error('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido para emissão no Asaas.');
  }

  const cleanName = String(fullName || email?.split('@')[0] || 'Cliente ISAAC').trim();
  const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;
  const mobilePhone = sanitizeBrazilMobileForAsaas(phone);
  const desiredExternalRef = userId
    ? `isaac:${userId}`
    : externalReferenceFallback || `isaac:buyer:${cleanCpfCnpj}`;

  let profileCustomerId = null;
  if (userId) {
    const { data: profile } = await supabaseAdmin
      .from('izaque_profiles')
      .select('asaas_customer_id')
      .eq('id', userId)
      .maybeSingle();
    profileCustomerId = profile?.asaas_customer_id || null;
  }

  let verifiedIsaacCustomer = null;

  // 1. Se o perfil já tiver um asaas_customer_id salvo, confere no Asaas se ele realmente pertence EXCLUSIVAMENTE ao grupo Isaac
  if (profileCustomerId) {
    try {
      const existingById = await asaasRequest(`/customers/${encodeURIComponent(profileCustomerId)}`);
      if (isCustomerExclusivelyInIsaacGroup(existingById, cfg.customerGroup)) {
        verifiedIsaacCustomer = existingById;
      }
    } catch {
      verifiedIsaacCustomer = null;
    }
  }

  // 2. Busca no Asaas filtrando simultaneamente por CPF/CNPJ + groupName=Isaac
  if (!verifiedIsaacCustomer) {
    const byCpfAndGroup = await asaasRequest(
      `/customers?cpfCnpj=${encodeURIComponent(cleanCpfCnpj)}&groupName=${encodeURIComponent(cfg.customerGroup)}&limit=20`
    );
    const candidates = Array.isArray(byCpfAndGroup?.data) ? byCpfAndGroup.data : [];
    verifiedIsaacCustomer =
      candidates.find((c) => isCustomerExclusivelyInIsaacGroup(c, cfg.customerGroup)) || null;
  }

  // 3. Se tiver userId e ainda não achou, tenta pelo externalReference=isaac:<userId> + groupName=Isaac
  if (!verifiedIsaacCustomer && userId) {
    const byExtAndGroup = await asaasRequest(
      `/customers?externalReference=${encodeURIComponent(`isaac:${userId}`)}&groupName=${encodeURIComponent(cfg.customerGroup)}&limit=10`
    );
    const candidates = Array.isArray(byExtAndGroup?.data) ? byExtAndGroup.data : [];
    verifiedIsaacCustomer =
      candidates.find((c) => isCustomerExclusivelyInIsaacGroup(c, cfg.customerGroup)) || null;
  }

  let finalCustomer = verifiedIsaacCustomer;

  if (finalCustomer) {
    // Cliente já existe exclusivamente no grupo Isaac -> atualiza dados cadastrais apenas se solicitado, mantendo no grupo Isaac
    if (updateExistingDetails) {
      const existingExt = String(finalCustomer.externalReference || '').trim();
      finalCustomer = await asaasRequest(`/customers/${encodeURIComponent(finalCustomer.id)}`, {
        method: 'PUT',
        body: {
          name: cleanName,
          email: cleanEmail,
          cpfCnpj: cleanCpfCnpj,
          mobilePhone: mobilePhone.length >= 10 ? mobilePhone : undefined,
          externalReference: userId ? `isaac:${userId}` : existingExt || desiredExternalRef,
          groupName: cfg.customerGroup,
          notificationDisabled: false,
        },
      });
    }
  } else {
    // Mesmo que o CPF já exista em "horeb", "lynxems" ou qualquer outro grupo, cria um cliente NOVO e SEPARADO no grupo "Isaac"!
    finalCustomer = await asaasRequest('/customers', {
      method: 'POST',
      body: {
        name: cleanName,
        email: cleanEmail,
        cpfCnpj: cleanCpfCnpj,
        mobilePhone: mobilePhone.length >= 10 ? mobilePhone : undefined,
        externalReference: desiredExternalRef,
        groupName: cfg.customerGroup,
        notificationDisabled: false,
      },
    });
  }

  if (userId && finalCustomer?.id && finalCustomer.id !== profileCustomerId) {
    await supabaseAdmin
      .from('izaque_profiles')
      .update({
        asaas_customer_id: finalCustomer.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  return finalCustomer.id;
}

/**
 * Caso um pagamento venha de um Link de Pagamento direto do ISAAC (externalReference "isaac:*")
 * onde o próprio Asaas criou automaticamente um cliente avulso sem grupo (groups vazio),
 * vincula esse novo cliente ao grupo "Isaac" sem jamais tocar em cadastros de outros grupos.
 */
export async function ensureUngroupedIsaacWebhookCustomerGrouped(asaasCustomerId, externalReference = '') {
  if (!asaasCustomerId) return;
  const cleanExt = String(externalReference || '').trim().toLowerCase();
  if (!cleanExt.startsWith('isaac:')) return;

  const cfg = getAsaasConfig();
  if (!cfg.apiKey) return;

  try {
    const cust = await asaasRequest(`/customers/${encodeURIComponent(asaasCustomerId)}`);
    if (!cust || cust.deleted) return;

    const rawGroups = Array.isArray(cust.groups) ? cust.groups : [];
    const groupNames = rawGroups
      .map((g) => normalizeGroupToken(typeof g === 'string' ? g : g?.name))
      .filter(Boolean);

    const custExt = String(cust.externalReference || '').trim().toLowerCase();
    const hasForeignExt = Boolean(custExt && !custExt.startsWith('isaac:'));

    // Só atribui o grupo Isaac se o cliente estiver 100% sem grupo e sem externalReference de outro sistema
    if (groupNames.length === 0 && !hasForeignExt) {
      await asaasRequest(`/customers/${encodeURIComponent(asaasCustomerId)}`, {
        method: 'PUT',
        body: {
          name: cust.name,
          cpfCnpj: cust.cpfCnpj,
          email: cust.email || undefined,
          mobilePhone: cust.mobilePhone || undefined,
          externalReference: cust.externalReference || externalReference,
          groupName: cfg.customerGroup,
        },
      });
    }
  } catch (err) {
    console.warn('⚠️ [Asaas Group Sync] Aviso leve ao verificar grupo do cliente no webhook:', err.message);
  }
}
