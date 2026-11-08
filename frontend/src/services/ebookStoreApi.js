import { authFetch, BACKEND_URL } from './authFetch';

let cachedStoreCatalog = null;
let cachedAt = 0;

export async function fetchPublicEbooksStore({ force = false } = {}) {
  if (!force && cachedStoreCatalog && Date.now() - cachedAt < 120_000) {
    return cachedStoreCatalog;
  }
  const res = await fetch(`${BACKEND_URL}/api/public/ebooks`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao carregar o catálogo de eBooks.');
  }
  cachedStoreCatalog = data;
  cachedAt = Date.now();
  return data;
}

export async function fetchPublicEbookBySlug(slug) {
  const res = await fetch(`${BACKEND_URL}/api/public/ebooks/${encodeURIComponent(slug)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'eBook não encontrado.');
  }
  return data;
}

export async function createEbookCheckoutOrder(payload) {
  const res = await authFetch(`${BACKEND_URL}/api/ebooks/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao iniciar o pagamento no Asaas.');
  }
  return data.order;
}

export async function fetchEbookOrderByToken(token) {
  const res = await fetch(`${BACKEND_URL}/api/ebooks/orders/${encodeURIComponent(token)}`, {
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Pedido não encontrado.');
  }
  return data.order;
}

export async function resendEbookOrderLink(token, payload = {}) {
  const res = await fetch(`${BACKEND_URL}/api/ebooks/orders/${encodeURIComponent(token)}/resend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao reenviar o link de download.');
  }
  return data.order;
}

export function getBuyerPdfDownloadUrl(token, slug) {
  return `${BACKEND_URL}/api/ebooks/download/${encodeURIComponent(token)}/${encodeURIComponent(slug)}`;
}

export async function downloadSuperAdminEbookPdf(slug, dedicationName = '') {
  const qs = dedicationName ? `?dedicationName=${encodeURIComponent(dedicationName)}` : '';
  const res = await authFetch(`${BACKEND_URL}/api/superadmin/ebooks/pdf/${encodeURIComponent(slug)}${qs}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao gerar PDF exclusivo.');
  }
  const blob = await res.blob();
  const cd = res.headers.get('content-disposition') || '';
  const fnMatch = cd.match(/filename="?([^"]+)"?/i);
  const fileName = fnMatch?.[1] || `ISAAC-${slug}-Thiago-Prata.pdf`;

  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);
}

export async function fetchSuperAdminEbookOrders() {
  const res = await authFetch(`${BACKEND_URL}/api/superadmin/ebooks/orders`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao carregar pedidos de eBooks.');
  }
  return data.orders || [];
}

