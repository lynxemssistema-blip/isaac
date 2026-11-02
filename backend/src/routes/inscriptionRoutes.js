import { Router } from 'express';
import {
  createPublicInscription,
  updateAdminInscription,
  deleteAdminInscription,
} from '../controllers/inscriptionController.js';

const router = Router();

// Rota Pública da Ficha Simples (/inscricao)
router.post('/inscriptions', createPublicInscription);

// Rotas Administrativas de Gestão de Inscritos
router.put('/admin/inscriptions/:id', updateAdminInscription);
router.delete('/admin/inscriptions/:id', deleteAdminInscription);

export default router;

