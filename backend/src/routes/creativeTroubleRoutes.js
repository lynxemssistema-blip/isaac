import { Router } from 'express';
import {
  analyzeFactSocratic,
  generateDiagnosis,
  createCreativeTrouble,
  getUserCreativeTroubles,
  getCreativeTroubleById,
  updateCreativeTrouble,
  deleteCreativeTrouble,
  getAdminCreativeTroubles,
  updateAdminMentorNotes,
  handleChatStep,
  generateCrossAnalysis,
} from '../controllers/creativeTroubleController.js';
import { requireAuth, requireAdmin, requireSelfOrAdmin } from '../middlewares/authMiddleware.js';
import { aiResourceLimiter } from '../middlewares/rateLimiters.js';

const router = Router();

// ==========================================
// ROTAS DO USUÁRIO / MENTORADO (PROTEGIDAS COM JWT)
// ==========================================

// Mentoria guiada conversacional interativa (Chat com IA)
router.post('/creative-troubles/chat-step', requireAuth, aiResourceLimiter, handleChatStep);

// Cruzamento metodológico e raio-x de múltiplos incômodos
router.get('/creative-troubles/cross-analysis', requireSelfOrAdmin('userId'), aiResourceLimiter, generateCrossAnalysis);

// Descontaminação socrática do fato (IA Isaac / Thiago Prata)
router.post('/creative-troubles/analyze-fact', requireAuth, aiResourceLimiter, analyzeFactSocratic);

// Geração de diagnóstico clínico e quadrante IRRI
router.post('/creative-troubles/diagnose', requireAuth, aiResourceLimiter, generateDiagnosis);

// CRUD de incômodos criativos do usuário
router.get('/creative-troubles', requireSelfOrAdmin('user_id'), getUserCreativeTroubles);
router.post('/creative-troubles', requireSelfOrAdmin('user_id'), createCreativeTrouble);
router.get('/creative-troubles/:id', requireAuth, getCreativeTroubleById);
router.put('/creative-troubles/:id', requireAuth, updateCreativeTrouble);
router.delete('/creative-troubles/:id', requireAuth, deleteCreativeTrouble);

// ==========================================
// ROTAS EXCLUSIVAS DO SUPER ADMIN / MENTOR
// ==========================================

// Listar todos os diagnósticos dos mentorados com métricas
router.get('/admin/creative-troubles', requireAdmin, getAdminCreativeTroubles);

// Salvar anotações privadas do profissional mentor
router.put('/admin/creative-troubles/:id/mentor-notes', requireAdmin, updateAdminMentorNotes);

export default router;
