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

const router = Router();

// ==========================================
// ROTAS DO USUÁRIO / MENTORADO (INDEPENDENTES)
// ==========================================

// Mentoria guiada conversacional interativa (Chat com IA)
router.post('/creative-troubles/chat-step', handleChatStep);

// Cruzamento metodológico e raio-x de múltiplos incômodos
router.get('/creative-troubles/cross-analysis', generateCrossAnalysis);

// Descontaminação socrática do fato (IA Isaac / Thiago Prata)
router.post('/creative-troubles/analyze-fact', analyzeFactSocratic);

// Geração de diagnóstico clínico e quadrante IRRI
router.post('/creative-troubles/diagnose', generateDiagnosis);

// CRUD de incômodos criativos do usuário
router.get('/creative-troubles', getUserCreativeTroubles);
router.post('/creative-troubles', createCreativeTrouble);
router.get('/creative-troubles/:id', getCreativeTroubleById);
router.put('/creative-troubles/:id', updateCreativeTrouble);
router.delete('/creative-troubles/:id', deleteCreativeTrouble);

// ==========================================
// ROTAS EXCLUSIVAS DO SUPER ADMIN / MENTOR
// ==========================================

// Listar todos os diagnósticos dos mentorados com métricas
router.get('/admin/creative-troubles', getAdminCreativeTroubles);

// Salvar anotações privadas do profissional mentor
router.put('/admin/creative-troubles/:id/mentor-notes', updateAdminMentorNotes);

export default router;
