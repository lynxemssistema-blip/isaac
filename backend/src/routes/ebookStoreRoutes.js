import express from 'express';
import { extractBearerToken, verifySupabaseJwt } from '../middlewares/authMiddleware.js';
import {
  getPublicEbooksStorePayload,
  findEbookProductBySlug,
} from '../data/superadminEbooksCatalog.js';
import {
  createEbookAsaasOrder,
  getAndSyncEbookOrderByToken,
  resendEbookOrderDelivery,
  generatePaidOrderPersonalizedPdf,
} from '../services/ebookStoreService.js';

const router = express.Router();

function resolvePublicBaseUrl(req) {
  if (process.env.APP_URL) {
    return String(process.env.APP_URL).replace(/\/$/, '');
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'isaac.lynxems.com.br';
  return `${proto}://${host}`;
}

// 1. Catálogo Público da Loja de eBooks (Vitrine Principal + Carrinho)
router.get('/public/ebooks', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  const payload = getPublicEbooksStorePayload(resolvePublicBaseUrl(req));
  return res.status(200).json(payload);
});

// 2. Dados da Página de Venda Dedicada de cada eBook ou da Coleção Completa
router.get('/public/ebooks/:slug', (req, res) => {
  const baseUrl = resolvePublicBaseUrl(req);
  const storePayload = getPublicEbooksStorePayload(baseUrl);
  const cleanSlug = String(req.params.slug || '').trim().toLowerCase();

  let product = null;
  if (cleanSlug === 'colecao-completa' || cleanSlug === 'bundle-all-8' || cleanSlug === 'todos') {
    product = storePayload.bundle;
  } else {
    product =
      storePayload.ebooks.find(
        (v) => v.slug.toLowerCase() === cleanSlug || v.id.toLowerCase() === cleanSlug
      ) || null;
  }

  if (!product) {
    return res.status(404).json({ error: 'eBook não encontrado na loja oficial ISAAC®.' });
  }

  // Anexa informações enriquecidas completas dos capítulos para a página de venda dedicada
  const fullInternal = findEbookProductBySlug(cleanSlug);
  const fullProduct = {
    ...product,
    chaptersDetail: Array.isArray(fullInternal?.chapters)
      ? fullInternal.chapters.map((ch) => ({
          number: ch.number,
          title: ch.title,
          clarityKey: ch.clarityKey,
          frameworkTitle: ch.frameworkTitle,
          frameworkItems: ch.frameworkItems,
        }))
      : [],
    enChaptersDetail: Array.isArray(fullInternal?.enGb?.chapters)
      ? fullInternal.enGb.chapters.map((ch) => ({
          number: ch.number,
          title: ch.title,
          clarityKey: ch.clarityKey,
          frameworkTitle: ch.frameworkTitle,
        }))
      : [],
  };

  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).json({
    meta: storePayload.meta,
    author: storePayload.author,
    pricing: storePayload.pricing,
    bundle: storePayload.bundle,
    product: fullProduct,
    allEbooks: storePayload.ebooks,
  });
});

// 3. Checkout Direto Asaas (PIX QR Code + Link Direto Asaas Cartão/PIX/Boleto)
router.post('/ebooks/checkout', async (req, res) => {
  try {
    let resolvedUserId = null;
    const bearer = extractBearerToken(req);
    if (bearer) {
      const authUser = await verifySupabaseJwt(bearer).catch(() => null);
      if (authUser?.id) {
        resolvedUserId = authUser.id;
      }
    }

    const {
      items,
      useCompleteBundlePromo = false,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerCpfCnpj,
    } = req.body || {};

    const order = await createEbookAsaasOrder({
      items,
      useCompleteBundlePromo: Boolean(useCompleteBundlePromo),
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerCpfCnpj,
      userId: resolvedUserId,
    });

    return res.status(201).json({
      success: true,
      order,
    });
  } catch (err) {
    console.error('❌ [POST /api/ebooks/checkout]:', err.message);
    return res.status(400).json({
      error: err.message || 'Não foi possível gerar a cobrança no Asaas.',
    });
  }
});

// 4. Consulta e Sincronização Automática do Pedido (Polling de Confirmação + Portal /meus-ebooks/:token)
router.get('/ebooks/orders/:token', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    const order = await getAndSyncEbookOrderByToken(req.params.token);
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    console.error('❌ [GET /api/ebooks/orders/:token]:', err.message);
    return res.status(500).json({ error: 'Falha ao consultar o pedido.' });
  }
});

// 5. Reenvio do Link de Download para E-mail e/ou Celular (WhatsApp)
router.post('/ebooks/orders/:token/resend', async (req, res) => {
  try {
    const { channel = 'both', email = '', phone = '' } = req.body || {};
    const order = await resendEbookOrderDelivery({
      downloadToken: req.params.token,
      channel,
      overrideEmail: email,
      overridePhone: phone,
    });
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({
      error: err.message || 'Não foi possível reenviar o link de download.',
    });
  }
});

// 6. Download do PDF Bilíngue Personalizado (Dedicatória ao Comprador na Margem Inferior)
router.get('/ebooks/download/:token/:slug', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

    const { pdfBuffer, fileName } = await generatePaidOrderPersonalizedPdf({
      downloadToken: req.params.token,
      slug: req.params.slug,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(pdfBuffer.length));
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    console.error('❌ [GET /api/ebooks/download/:token/:slug]:', err.message);
    return res.status(statusCode).json({
      error: err.message || 'Não foi possível gerar o PDF personalizado.',
    });
  }
});

export default router;

