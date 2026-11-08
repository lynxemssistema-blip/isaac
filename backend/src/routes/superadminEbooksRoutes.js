import express from 'express';
import { requireSuperAdmin } from '../middlewares/authMiddleware.js';
import { EBOOK_COLLECTION_META, SUPERADMIN_EBOOKS } from '../data/superadminEbooksCatalog.js';

const router = express.Router();

// Protege todas as rotas deste módulo estritamente para o Superadmin ('master' / Edson)
router.use('/superadmin', requireSuperAdmin);

router.get('/superadmin/ebooks', (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  return res.status(200).json({
    collection: EBOOK_COLLECTION_META,
    ebooks: SUPERADMIN_EBOOKS,
  });
});

export default router;

