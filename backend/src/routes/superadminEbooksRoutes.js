import express from 'express';
import { requireSuperAdmin } from '../middlewares/authMiddleware.js';
import {
  EBOOK_COLLECTION_META,
  EBOOK_STORE_PRICING,
  COMPLETE_BUNDLE_PRODUCT,
  ENRICHED_EBOOKS_CATALOG,
} from '../data/superadminEbooksCatalog.js';
import {
  generateEbookBilingualPdfBuffer,
  getEbookPdfFileName,
} from '../services/ebookPdfService.js';
import { listSuperAdminEbookOrders } from '../services/ebookStoreService.js';

const router = express.Router();

// Permite download autenticado via header Authorization: Bearer OU query ?access_token= (ex: download direto em aba)
router.use('/superadmin', (req, res, next) => {
  if (!req.headers.authorization && req.query?.access_token) {
    req.headers.authorization = `Bearer ${String(req.query.access_token).trim()}`;
  }
  return requireSuperAdmin(req, res, next);
});

router.get('/superadmin/ebooks', (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  return res.status(200).json({
    collection: EBOOK_COLLECTION_META,
    pricing: EBOOK_STORE_PRICING,
    bundle: COMPLETE_BUNDLE_PRODUCT,
    ebooks: ENRICHED_EBOOKS_CATALOG,
  });
});

// Download direto individual de cada eBook Bilíngue OU do PDF Único Consolidado (colecao-completa) pelo Superadmin
router.get('/superadmin/ebooks/pdf/:slug', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

    const slug = String(req.params.slug || '').trim();
    const dedicationName = String(req.query?.dedicationName || '').trim();
    const todayStr = new Date().toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const pdfBuffer = await generateEbookBilingualPdfBuffer({
      slugOrId: slug,
      buyerName: dedicationName,
      purchaseDateStr: todayStr,
    });
    const fileName = getEbookPdfFileName(slug);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(pdfBuffer.length));
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('❌ [GET /api/superadmin/ebooks/pdf/:slug]:', err.message);
    return res.status(400).json({
      error: err.message || 'Não foi possível gerar o PDF solicitado.',
    });
  }
});

// Listagem de pedidos Asaas de eBooks para auditoria no Estúdio Superadmin
router.get('/superadmin/ebooks/orders', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    const orders = await listSuperAdminEbookOrders(100);
    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (err) {
    console.error('❌ [GET /api/superadmin/ebooks/orders]:', err.message);
    return res.status(500).json({ error: 'Falha ao carregar pedidos de eBooks.' });
  }
});

export default router;
