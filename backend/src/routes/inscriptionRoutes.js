import { Router } from 'express';
import {
  createPublicInscription,
  updateAdminInscription,
  deleteAdminInscription,
} from '../controllers/inscriptionController.js';
import { requireAdmin } from '../middlewares/authMiddleware.js';
import { authAndMailLimiter } from '../middlewares/rateLimiters.js';

const router = Router();

// Rota Pública da Ficha Simples (/inscricao)
router.post('/inscriptions', authAndMailLimiter, createPublicInscription);

// Rotas Administrativas de Gestão de Inscritos
router.put('/admin/inscriptions/:id', requireAdmin, updateAdminInscription);
router.delete('/admin/inscriptions/:id', requireAdmin, deleteAdminInscription);

export default router;

